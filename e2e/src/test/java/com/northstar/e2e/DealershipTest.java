package com.northstar.e2e;

import static org.junit.jupiter.api.Assertions.*;

import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.api.TestInfo;
import org.junit.jupiter.api.io.TempDir;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.json.Json;
import org.openqa.selenium.support.ui.Select;

@Timeout(90)
class DealershipTest {
    @TempDir Path downloads;
    private ChromeDriver driver;
    private FailureProxy proxy;
    private DealershipPage page;
    private String email;
    private String password;

    private static String env(String name, String fallback) {
        String value = System.getenv(name);
        return value == null || value.isBlank() ? fallback : value;
    }

    @BeforeEach void openApp(TestInfo info) throws Exception {
        System.out.println("E2E: " + info.getTestMethod().orElseThrow().getName());
        email = env("E2E_STAFF_EMAIL", "");
        password = env("E2E_STAFF_PASSWORD", "");
        if (email.isEmpty() && password.isEmpty()) {
            Path accessFile = Path.of(env("E2E_ACCESS_FILE", Path.of(System.getProperty("e2e.projectDir"))
                    .resolve("../.demo/access.json").normalize().toString()));
            try (var reader = Files.newBufferedReader(accessFile)) {
                Map<?, ?> access = new Json().toType(reader, Map.class);
                email = (String) access.get("email"); password = (String) access.get("password");
            }
        }
        assertTrue(email != null && !email.isBlank() && password != null && !password.isBlank(),
                "Provide demo access.json or both E2E_STAFF_EMAIL and E2E_STAFF_PASSWORD");
        String baseUrl = env("APP_BASE_URL", "http://localhost:3000").replaceAll("/+$", "");
        URI upstream = URI.create(baseUrl);
        assertTrue(("http".equals(upstream.getScheme()) || "https".equals(upstream.getScheme()))
                && upstream.getHost() != null && (upstream.getPath().isEmpty() || upstream.getPath().equals("/")),
                "APP_BASE_URL must be an HTTP(S) origin");
        proxy = new FailureProxy(upstream);
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new", "--window-size=1440,1100", "--no-sandbox", "--disable-dev-shm-usage");
        String binary = env("CHROME_BIN", "");
        if (!binary.isEmpty()) options.setBinary(binary);
        String executable = env("CHROMEDRIVER_BIN", "");
        if (!executable.isEmpty()) System.setProperty("webdriver.chrome.driver", executable);
        Map<String, Object> prefs = new HashMap<>();
        prefs.put("download.default_directory", downloads.toAbsolutePath().toString());
        prefs.put("download.prompt_for_download", false);
        options.setExperimentalOption("prefs", prefs);
        driver = new ChromeDriver(options);
        driver.executeCdpCommand("Browser.setDownloadBehavior", Map.of("behavior", "allow",
                "downloadPath", downloads.toAbsolutePath().toString()));
        driver.manage().timeouts().pageLoadTimeout(java.time.Duration.ofSeconds(30));
        driver.manage().timeouts().scriptTimeout(java.time.Duration.ofSeconds(10));
        page = new DealershipPage(driver);
        driver.get(proxy.browserUrl().toString());
        page.ready();
    }

    @AfterEach void closeApp() {
        try { if (driver != null) driver.quit(); }
        finally { if (proxy != null) proxy.close(); }
    }

    @Test void inventorySearchFiltersShortlistAndDetails() {
        assertTrue(page.cars().size() >= 2, "Use a demo with at least two sample vehicles");
        WebElement search = page.visible(By.cssSelector("input[aria-label='Search inventory']"));
        search.sendKeys("RAV4");
        page.wait.until(d -> page.cars().size() == 1);
        assertTrue(page.cars().getFirst().getText().contains("Toyota RAV4"));
        search.clear();
        search.sendKeys("no-such-vehicle-e2e");
        page.wait.until(d -> page.cars().isEmpty());
        search.clear(); search.sendKeys("RAV4");
        page.wait.until(d -> page.cars().size() == 1);
        page.cars().getFirst().findElement(By.cssSelector("button[aria-label='Save Toyota RAV4']")).click();
        page.click("Shortlist");
        assertEquals(1, page.cars().size());
        driver.navigate().refresh(); page.ready();
        page.click("Shortlist");
        page.wait.until(d -> page.cars().size() == 1);
        page.cars().getFirst().findElement(By.cssSelector("button[aria-label='View Toyota RAV4']")).click();
        page.contains("Vehicle details and test-drive requests.");
        page.visible(By.cssSelector(".estimator summary")).click();
        page.contains("estimate");
        page.contains("You might also like");
    }

    @Test void staffInquiryNotesStagesAndCsvPersist() throws Exception {
        String name = "E2E Shopper " + UUID.randomUUID().toString().substring(0, 8);
        page.click("Contact the team");
        page.fill("name", name); page.fill("email", "selenium@example.test");
        page.fill("message", "Sample inquiry created by the Selenium suite.");
        page.click("Send request");
        page.visible(By.cssSelector(".request-code"));
        page.closeDialog();
        page.login(email, password); page.click("Leads");
        WebElement search = page.visible(By.cssSelector("input[aria-label='Search leads']"));
        search.sendKeys(name);
        page.click("Open");
        page.select("status", "qualified"); page.fill("notes", "Verified E2E follow-up note");
        page.click("Save changes");
        page.wait.until(d -> d.findElements(By.cssSelector("[role='dialog']")).isEmpty());
        page.contains("qualified"); page.click("Open");
        assertEquals("Verified E2E follow-up note", page.visible(By.name("notes")).getAttribute("value"));
        page.contains("Activity"); page.closeDialog(); page.click("Export");
        Path csv = downloads.resolve("northstar-leads.csv");
        try {
            page.wait.until(d -> Files.exists(csv));
        } catch (org.openqa.selenium.TimeoutException e) {
            try (var files = Files.list(downloads)) {
                throw new AssertionError("CSV download missing; directory contains: "
                        + files.map(p -> p.getFileName().toString()).toList());
            }
        }
        assertTrue(Files.readString(csv).contains(name), "CSV includes the filtered sample inquiry");
        page.click("Open"); page.click("Delete lead"); driver.switchTo().alert().accept();
        page.wait.until(d -> d.findElements(By.cssSelector("[role='dialog']")).isEmpty());
        page.absent(name);
    }

    @Test void staffInventoryCreateEditAndUnpublishReachTheShowroom() {
        String model = "E2E-" + UUID.randomUUID().toString().substring(0, 8);
        page.login(email, password); page.contains("New leads"); page.click("Inventory");
        page.click("Add vehicle");
        page.fill("make", "Sample"); page.fill("model", model);
        page.fill("year", "2026"); page.fill("price", "31000"); page.fill("mileage", "100");
        page.fill("description", "Synthetic inventory for browser testing only.");
        page.click("Save vehicle");
        page.wait.until(d -> d.findElements(By.cssSelector("[role='dialog']")).isEmpty());
        page.contains(model);
        page.click("Explore cars");
        page.visible(By.cssSelector("input[aria-label='Search inventory']")).sendKeys(model);
        page.wait.until(d -> page.cars().size() == 1);
        page.contains("31,000");
        page.click("Staff workspace"); page.click("Inventory");
        page.visible(By.xpath("//tr[contains(., '" + model + "')]//button")).click();
        page.fill("price", "32000"); page.visible(By.name("inStock")).click();
        page.click("Save vehicle");
        page.wait.until(d -> d.findElements(By.cssSelector("[role='dialog']")).isEmpty());
        page.contains("32,000");
        page.click("Explore cars");
        page.wait.until(d -> page.cars().isEmpty());
    }

    @Test void shopperBookingStaffConfirmationAndShopperCancellation() {
        String name = "E2E Booking " + UUID.randomUUID().toString().substring(0, 8);
        page.cars().getFirst().findElement(By.cssSelector(".photo-button")).click();
        page.click("Request a test drive");
        page.fill("name", name); page.fill("email", "booking@example.test");
        java.time.LocalDate date = java.time.LocalDate.now(java.time.ZoneId.of("America/Halifax")).plusDays(2);
        while (date.getDayOfWeek().getValue() > 5) date = date.plusDays(1);
        WebElement dateInput = page.visible(By.cssSelector(".slot-picker input[type='date']"));
        // Native date input entry varies by OS; set its value through the native setter and dispatch change.
        driver.executeScript("Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(arguments[0],arguments[1]); arguments[0].dispatchEvent(new Event('input',{bubbles:true})); arguments[0].dispatchEvent(new Event('change',{bubbles:true}));", dateInput, date.toString());
        page.visible(By.cssSelector("[role='radio']:not([disabled])")).click();
        page.click("Send request");
        String code = page.visible(By.cssSelector(".request-code")).getText();
        assertFalse(code.isBlank(), "Booking returns a private tracking code");
        page.closeDialog();
        page.login(email, password); page.contains("New leads"); page.click("Test drives");
        By appointment = By.xpath("//div[contains(@class,'appointment-row')][contains(., '" + name + "')]");
        page.visible(appointment).findElement(By.xpath(".//button[normalize-space()='Confirm']")).click();
        page.wait.until(d -> d.findElement(appointment).getText().toLowerCase(java.util.Locale.ROOT).contains("confirmed"));
        page.click("My request");
        try {
            page.visible(By.cssSelector("[role='dialog'] input")).sendKeys(code);
        } catch (RuntimeException e) {
            throw new AssertionError("The private request code could not be entered");
        }
        page.click("Check status");
        page.contains("Confirmed"); page.click("Cancel test drive"); driver.switchTo().alert().accept();
        page.contains("Cancelled"); page.closeDialog();
        page.click("Staff workspace"); page.click("Test drives"); page.click("Refresh");
        page.wait.until(d -> d.findElement(appointment).getText().toLowerCase(java.util.Locale.ROOT).contains("cancelled"));
        page.click("My request"); page.click("Check status");
        page.contains("Cancelled"); page.click("Delete my request and personal details");
        driver.switchTo().alert().accept(); page.absent("Inquiry:");
    }

    @Test void workspaceErrorAndRepeatedRetryRecoverRealRecords() {
        proxy.fail("/api/admin/overview");
        page.login(email, password);
        page.alert("Temporary E2E service failure"); page.absent("Loading workspace");
        int first = proxy.failures(); page.click("Retry workspace");
        page.wait.until(d -> proxy.failures() > first); page.alert("Temporary E2E service failure");
        proxy.recover(); page.click("Retry workspace");
        page.contains("New leads"); page.absent("Could not load workspace");
        page.click("Inventory"); page.contains("Load sample vehicles");
        page.click("Test drives"); page.contains("The next test drive.");
    }

    @Test void insightsPeriodErrorAndRepeatedRetryRecoverRealMetrics() {
        page.login(email, password);
        page.contains("New leads");
        proxy.fail("/api/admin/insights"); page.click("Insights");
        page.alert("Temporary E2E service failure"); page.absent("Loading insights");
        new Select(page.visible(By.cssSelector("select[aria-label='Insights period']"))).selectByValue("7");
        page.contains("Last 7 days"); page.alert("Temporary E2E service failure");
        int first = proxy.failures(); page.click("Retry insights");
        page.wait.until(d -> proxy.failures() > first); page.alert("Temporary E2E service failure");
        proxy.recover(); page.click("Retry insights");
        page.contains("Leads received"); page.absent("Could not load insights");
        assertEquals("7", page.visible(By.cssSelector("select[aria-label='Insights period']")).getAttribute("value"));
        new Select(page.visible(By.cssSelector("select[aria-label='Insights period']"))).selectByValue("30");
        page.contains("Last 30 days"); page.contains("Leads received");
    }

    @Test void comparisonShowsRealVehiclesAndRemoveControlWorks() {
        page.openComparison(); page.visible(By.cssSelector(".compare-table"));
        assertEquals(2, driver.findElements(By.cssSelector(".compare-table thead th:not(:first-child)")).size());
        page.contains("Lowest price"); page.contains("Mileage");
        page.click("Remove"); page.contains("Add at least two vehicles to compare.");
        page.closeDialog();
        page.contains("1 of 3 selected"); page.click("Clear");
        page.wait.until(d -> d.findElements(By.cssSelector("[aria-label='Vehicle comparison']")).isEmpty());
    }

    @Test void comparisonErrorAndRepeatedRetryRecoverRealComparison() {
        proxy.fail("/api/compare"); page.openComparison();
        page.alert("Temporary E2E service failure"); page.absent("Loading comparison");
        int first = proxy.failures(); page.click("Retry comparison");
        page.wait.until(d -> proxy.failures() > first); page.alert("Temporary E2E service failure");
        proxy.recover(); page.click("Retry comparison");
        page.visible(By.cssSelector(".compare-table")); page.absent("Could not load comparison");
        assertEquals(2, driver.findElements(By.cssSelector(".compare-table thead th:not(:first-child)")).size());
    }
}
