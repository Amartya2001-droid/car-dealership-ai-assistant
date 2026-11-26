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
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

/** Loopback-only fault injection. Recovery always forwards to the real app. */
final class FailureProxy implements AutoCloseable {
    private static final Set<String> HOP_HEADERS = Set.of(
            "host", "connection", "content-length", "transfer-encoding", "upgrade", "http2-settings",
            "expect", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer");
    private enum Mode { FAIL, JSON, HOLD_HEADERS, HOLD_BODY, DISCONNECT }
    private record Fault(String path, Mode mode, String body, CountDownLatch release) {}
    private final URI upstream;
    private final HttpServer server;
    private final ExecutorService executor = Executors.newCachedThreadPool();
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final AtomicReference<Fault> fault = new AtomicReference<>();
    private final AtomicInteger failures = new AtomicInteger();
    private final ConcurrentHashMap<String, AtomicInteger> requests = new ConcurrentHashMap<>();

    FailureProxy(URI upstream) throws IOException {
        this.upstream = upstream;
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", this::forward);
        server.setExecutor(executor);
        server.start();
    }

    URI browserUrl() { return URI.create("http://127.0.0.1:" + server.getAddress().getPort()); }
    void fail(String path) { setFault(path, Mode.FAIL, null); }
    void malformed(String path, String body) { setFault(path, Mode.JSON, body); }
    void hold(String path, boolean afterHeaders) { setFault(path, afterHeaders ? Mode.HOLD_BODY : Mode.HOLD_HEADERS, null); }
    void disconnect(String path) { setFault(path, Mode.DISCONNECT, null); }
    int failures() { return failures.get(); }
    int requests(String path) { var count = requests.get(path); return count == null ? 0 : count.get(); }
    void recover() { var old = fault.getAndSet(null); if (old != null) old.release().countDown(); }

    private void setFault(String path, Mode mode, String body) {
        failures.set(0);
        var old = fault.getAndSet(new Fault(path, mode, body, new CountDownLatch(1)));
        if (old != null) old.release().countDown();
    }

    private static void json(HttpExchange exchange, int status, String value) throws IOException {
        byte[] body = value.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.getResponseHeaders().set("Cache-Control", "no-store");
        exchange.sendResponseHeaders(status, body.length);
        exchange.getResponseBody().write(body);
    }

    private void forward(HttpExchange exchange) throws IOException {
        try (exchange) {
            String path = exchange.getRequestURI().getPath();
            requests.computeIfAbsent(path, ignored -> new AtomicInteger()).incrementAndGet();
            Fault active = fault.get();
            if (active != null && !active.path().equals(path)) active = null;
            if (active != null) {
                failures.incrementAndGet();
                switch (active.mode()) {
                    case FAIL -> { json(exchange, 503, "{\"error\":\"Temporary E2E service failure\"}"); return; }
                    case JSON -> { json(exchange, 200, active.body()); return; }
                    case DISCONNECT -> { return; } // Close without an HTTP response: a real fetch network failure.
                    case HOLD_HEADERS -> { if (!awaitRelease(active)) return; }
                    default -> { }
                }
            }
            HttpRequest.Builder request = HttpRequest.newBuilder(upstream.resolve(exchange.getRequestURI()))
                    .timeout(Duration.ofSeconds(30));
            exchange.getRequestHeaders().forEach((key, values) -> {
                if (!HOP_HEADERS.contains(key.toLowerCase())) {
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
                if (!noBody) {
                    if (active != null && active.mode() == Mode.HOLD_BODY && response.body().length > 1) {
                        // Real response headers and a real JSON prefix arrive; its remaining body stalls.
                        exchange.getResponseBody().write(response.body(), 0, 1);
                        exchange.getResponseBody().flush();
                        if (!awaitRelease(active)) return;
                        exchange.getResponseBody().write(response.body(), 1, response.body().length - 1);
                    } else exchange.getResponseBody().write(response.body());
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } catch (IOException e) {
                // A browser timeout/abort can close a held exchange before it is released.
            }
        }
    }

    private static boolean awaitRelease(Fault active) {
        try { active.release().await(); return true; }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); return false; }
    }

    @Override public void close() { recover(); server.stop(0); executor.shutdownNow(); }
}
