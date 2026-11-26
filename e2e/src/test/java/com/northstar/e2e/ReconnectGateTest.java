package com.northstar.e2e;

import static org.junit.jupiter.api.Assertions.*;

import java.net.URI;
import java.time.Duration;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

/** Public startup gates: no staff credentials, synthetic success data, or shortened app timeout. */
@Timeout(100)
class ReconnectGateTest {
    private ChromeDriver driver;
    private FailureProxy proxy;
    private DealershipPage page;

    private static String env(String key, String fallback) {
        String value = System.getenv(key);
        return value == null || value.isBlank() ? fallback : value;
    }

    @BeforeEach void open() throws Exception {
        URI base = URI.create(env("APP_BASE_URL", "http://localhost:3000").replaceAll("/+$", ""));
        assertTrue(("http".equals(base.getScheme()) || "https".equals(base.getScheme()))
                && base.getHost() != null && base.getPath().isEmpty(), "APP_BASE_URL must be an HTTP(S) origin");
        proxy = new FailureProxy(base);
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new", "--window-size=1440,1100", "--no-sandbox", "--disable-dev-shm-usage");
        String binary = env("CHROME_BIN", ""); if (!binary.isEmpty()) options.setBinary(binary);
        String executable = env("CHROMEDRIVER_BIN", "");
        if (!executable.isEmpty()) System.setProperty("webdriver.chrome.driver", executable);
        driver = new ChromeDriver(options);
        driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(30));
        page = new DealershipPage(driver);
        driver.get(proxy.browserUrl().toString()); page.ready();
    }

    @AfterEach void close() {
        try { if (driver != null) driver.quit(); }
        finally { if (proxy != null) proxy.close(); }
    }

    private void errorReady() {
        page.visible(By.cssSelector(".boot [role='alert']"));
        assertTrue(page.button("Try again").isEnabled());
        assertTrue(driver.findElements(By.cssSelector(".shop-main")).isEmpty(), "Invalid startup must not partially publish the showroom");
    }

    private void recover() { proxy.recover(); page.click("Try again"); page.ready(); }

    @ParameterizedTest(name = "invalid startup contract: {0}")
    @ValueSource(strings = {"/api/config", "/api/inventory", "/api/auth/session"})
    void malformedStartupPayloadIsRetryable(String path) {
        String[] invalid = path.equals("/api/inventory")
                ? new String[]{"null", "{}", "{\"vehicles\":[null]}"}
                : path.equals("/api/auth/session")
                    ? new String[]{"null", "{}", "{\"authenticated\":\"false\"}"}
                    : new String[]{"null", "{}", "{\"name\":\"Sample\",\"currency\":null}"};
        for (String body : invalid) {
            proxy.malformed(path, body); driver.navigate().refresh(); errorReady();
            int first = proxy.failures(); page.click("Try again");
            page.wait.until(d -> proxy.failures() > first); errorReady(); recover();
        }
    }

    @ParameterizedTest(name = "startup transport recovery: {0}")
    @ValueSource(strings = {"/api/config", "/api/inventory", "/api/auth/session"})
    void startupFailureModesRecover(String path) {
        proxy.fail(path); driver.navigate().refresh(); errorReady();
        int first = proxy.failures(); page.click("Try again");
        page.wait.until(d -> proxy.failures() > first); errorReady();
        proxy.hold(path, false); page.click("Try again");
        page.wait.until(d -> proxy.failures() == 1);
        WebElement pending = page.visible(By.cssSelector(".boot button"));
        assertEquals("Reconnecting…", pending.getText()); assertFalse(pending.isEnabled());
        assertEquals("true", page.visible(By.cssSelector(".boot")).getDomAttribute("aria-busy"));
        int attempts = proxy.requests(path);
        for (int i = 0; i < 3; i++) driver.executeScript("arguments[0].click()", pending);
        long stableSince = System.nanoTime();
        new WebDriverWait(driver, Duration.ofSeconds(2)).pollingEvery(Duration.ofMillis(100)).until(d -> {
            assertEquals(attempts, proxy.requests(path), "Disabled retry must not start overlapping reloads");
            return System.nanoTime() - stableSince >= Duration.ofMillis(500).toNanos();
        });
        proxy.recover(); page.ready(); // Held request now receives the real backend response.

        proxy.malformed(path, "{not-json"); driver.navigate().refresh(); errorReady(); recover();
        proxy.disconnect(path); driver.navigate().refresh(); errorReady(); recover();

        for (boolean bodyStarted : new boolean[]{false, true}) {
            proxy.hold(path, bodyStarted);
            long started = System.nanoTime(); driver.navigate().refresh();
            page.wait.until(d -> proxy.failures() >= 1);
            new WebDriverWait(driver, Duration.ofSeconds(35)).until(
                    ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".boot [role='alert']")));
            assertTrue(System.nanoTime() - started >= Duration.ofSeconds(24).toNanos(),
                    "Exercise the real 25-second app timeout, including abort during JSON-body consumption");
            errorReady(); recover();
        }
    }
}
