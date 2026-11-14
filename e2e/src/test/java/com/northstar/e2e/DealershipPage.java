package com.northstar.e2e;

import java.time.Duration;
import java.util.List;
import org.openqa.selenium.By;
import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.ElementClickInterceptedException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

/** Locators use visible labels, roles and form names rather than generated CSS classes. */
final class DealershipPage {
    private final WebDriver driver;
    final WebDriverWait wait;

    DealershipPage(WebDriver driver) {
        this.driver = driver;
        wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        wait.ignoring(StaleElementReferenceException.class);
        wait.ignoring(ElementClickInterceptedException.class);
    }
    WebElement visible(By locator) { return wait.until(ExpectedConditions.visibilityOfElementLocated(locator)); }
    WebElement button(String text) {
        return wait.until(d -> d.findElements(By.tagName("button")).stream()
                .filter(WebElement::isDisplayed).filter(WebElement::isEnabled)
                .filter(b -> b.getText().trim().equals(text) || ((text.equals("Shortlist") || text.equals("Leads")) && b.getText().startsWith(text))).findFirst().orElse(null));
    }
    void click(String text) { wait.until(d -> { button(text).click(); return true; }); }
    void fill(String name, String value) {
        WebElement input = visible(By.cssSelector("input[name='" + name + "'], textarea[name='" + name + "']"));
        input.clear(); input.sendKeys(value);
    }
    void select(String name, String value) {
        var select = new Select(visible(By.cssSelector("select[name='" + name + "']")));
        select.getOptions().stream().filter(option -> value.equals(option.getDomProperty("value")))
                .findFirst().orElseThrow(() -> new AssertionError("Missing form option: " + value)).click();
    }
    void contains(String text) {
        wait.until(d -> d.findElement(By.tagName("body")).getText().toLowerCase(java.util.Locale.ROOT).contains(text.toLowerCase(java.util.Locale.ROOT)));
    }
    void absent(String text) {
        wait.until(d -> !d.findElement(By.tagName("body")).getText().toLowerCase(java.util.Locale.ROOT).contains(text.toLowerCase(java.util.Locale.ROOT)));
    }
    void alert(String text) {
        wait.until(d -> d.findElements(By.cssSelector("[role='alert']")).stream()
                .anyMatch(e -> e.isDisplayed() && e.getText().contains(text)));
    }
    void closeDialog() {
        wait.until(d -> {
            var buttons = d.findElements(By.cssSelector("[role='dialog'] button:has(.sr-only)"))
                    .stream().filter(WebElement::isDisplayed).toList();
            if (buttons.isEmpty()) return false;
            buttons.getLast().click();
            return true;
        });
        wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector("[role='dialog']")));
    }
    void login(String email, String password) {
        click("Staff workspace");
        try {
            fill("email", email); fill("password", password);
        } catch (RuntimeException e) {
            // Selenium exceptions can include sendKeys arguments. Never emit credential values.
            throw new AssertionError("Staff credential fields could not be filled");
        }
        click("Sign in");
        contains("Your day, in focus.");
    }
    List<WebElement> cars() {
        return driver.findElements(By.cssSelector(".car-card"));
    }
    void ready() { visible(By.cssSelector(".car-card")); }
    void openComparison() {
        ready();
        List<WebElement> cars = cars();
        cars.get(0).findElement(By.cssSelector(".compare-toggle")).click();
        cars.get(1).findElement(By.cssSelector(".compare-toggle")).click();
        visible(By.cssSelector("[aria-label='Vehicle comparison'] .primary")).click();
        visible(By.cssSelector("[role='dialog']"));
    }
}
