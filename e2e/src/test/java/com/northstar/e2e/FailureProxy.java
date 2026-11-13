package com.northstar.e2e;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

/** Test-only reverse proxy. Only the chosen failure is synthetic; recovery uses the real API. */
final class FailureProxy implements AutoCloseable {
    private static final Set<String> HOP_HEADERS = Set.of(
            "host", "connection", "content-length", "transfer-encoding", "upgrade", "http2-settings",
            "expect", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer");
    private final URI upstream;
    private final HttpServer server;
    private final ExecutorService executor = Executors.newCachedThreadPool();
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private volatile String failingPath;
    private final AtomicInteger failures = new AtomicInteger();

    FailureProxy(URI upstream) throws IOException {
        this.upstream = upstream;
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", this::forward);
        server.setExecutor(executor);
        server.start();
    }

    URI browserUrl() { return URI.create("http://127.0.0.1:" + server.getAddress().getPort()); }
    void fail(String path) { failures.set(0); failingPath = path; }
    void recover() { failingPath = null; }
    int failures() { return failures.get(); }

    private void forward(HttpExchange exchange) throws IOException {
        try (exchange) {
            if (exchange.getRequestURI().getPath().equals(failingPath)) {
                failures.incrementAndGet();
                byte[] body = "{\"error\":\"Temporary E2E service failure\"}".getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.getResponseHeaders().set("Cache-Control", "no-store");
                exchange.sendResponseHeaders(503, body.length);
                exchange.getResponseBody().write(body);
                return;
            }
            HttpRequest.Builder request = HttpRequest.newBuilder(upstream.resolve(exchange.getRequestURI()))
                    .timeout(Duration.ofSeconds(30));
            exchange.getRequestHeaders().forEach((key, values) -> {
                if (!HOP_HEADERS.contains(key.toLowerCase())) {
                    // The app still enforces its normal same-origin policy at the upstream origin.
                    for (String value : values) request.header(key,
                            key.equalsIgnoreCase("Origin") ? upstream.toString() : value);
                }
            });
            request.method(exchange.getRequestMethod(),
                    HttpRequest.BodyPublishers.ofByteArray(exchange.getRequestBody().readAllBytes()));
            try {
                HttpResponse<byte[]> response = client.send(request.build(), HttpResponse.BodyHandlers.ofByteArray());
                response.headers().map().forEach((key, values) -> {
                    if (!HOP_HEADERS.contains(key.toLowerCase())) exchange.getResponseHeaders().put(key, values);
                });
                boolean noBody = exchange.getRequestMethod().equals("HEAD") || response.statusCode() == 304
                        || response.statusCode() == 204;
                exchange.sendResponseHeaders(response.statusCode(), noBody ? -1 : response.body().length);
                if (!noBody) exchange.getResponseBody().write(response.body());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                exchange.sendResponseHeaders(502, -1);
            } catch (IOException e) {
                exchange.sendResponseHeaders(502, -1);
            }
        }
    }

    @Override public void close() { server.stop(0); executor.shutdownNow(); }
}
