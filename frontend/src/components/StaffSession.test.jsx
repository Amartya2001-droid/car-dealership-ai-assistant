import React, { act } from "react";
import { createRoot } from "react-dom/client";
import Workspace from "./Workspace";
import { api } from "../lib/api";

jest.mock("../lib/api", () => ({ api: jest.fn(), setToken: jest.fn() }));
jest.mock("../lib/native", () => ({ isNative: () => false }));
jest.mock("sonner", () => ({ Toaster: () => null, toast: { error: jest.fn(), success: jest.fn() } }));
// Dialog internals are unrelated to the insights request lifecycle.
jest.mock("./ui/dialog", () => ({
  Dialog: ({ open, children }) => open ? children : null,
  DialogContent: ({ children }) => children,
  DialogHeader: ({ children }) => children,
  DialogTitle: ({ children }) => children,
  DialogDescription: ({ children }) => children,
}));

let container, root, failure, fresh, overviewOverride;
const vehicle = { id: "a", year: 2026, make: "Sample", model: "One", price: 20000, mileage: 100, inStock: true, bodyType: "SUV", fuelType: "Gasoline" };
const overview = name => ({ leads: [{ id: "lead", name, email: "sample@example.test", message: "Sample inquiry", status: "new", createdAt: "2026-11-01T12:00:00Z" }], appointments: [], vehicles: [vehicle], stats: {} });
const insight = () => ({
  funnel: ["received", "contacted", "qualified", "won"].map(stage => ({ stage, count: 0, percent: null })),
  sources: { web: 0, voice: 0 }, response: { medianMinutes: null, responded: 0, awaiting: 0, untracked: 0 },
  testDrives: { completed: 0, notCompleted: 0, cancelled: 0, unconfirmed: 0, upcoming: 0, showRate: null }, leadsPerVehicle: [], generalInquiries: 0,
});
const unauthorized = () => Object.assign(new Error("Please sign in to continue."), { status: 401 });
const click = async text => {
  const button = [...container.querySelectorAll("button")].find(b => b.textContent.trim() === text);
  expect(button).toBeDefined(); await act(async () => button.click());
};
const submit = async () => {
  const form = container.querySelector('form'); expect(form).not.toBeNull();
  await act(async () => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
};
beforeEach(async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true; localStorage.clear(); api.mockReset();
  failure = null; fresh = false; overviewOverride = null;
  api.mockImplementation(async path => {
    if (path === "/config") return { name: "Sample dealership", currency: "CAD", staffConfigured: true };
    if (path === "/inventory") return { vehicles: [vehicle] };
    if (path === "/auth/session") return { authenticated: failure !== "session-check" };
    if (path === "/admin/overview") {
      if (overviewOverride) return overviewOverride();
      if (failure === "overview") throw unauthorized();
      return overview(fresh ? "Fresh sample inquiry" : "Cached sample inquiry");
    }
    if (path.startsWith("/admin/insights")) {
      if (failure === "insights") throw unauthorized();
      return insight();
    }
    if (path === "/admin/inventory/a") { if (failure === "session-check") return {}; throw unauthorized(); }
    if (path === "/auth/login") {
      if (failure === "login") throw unauthorized();
      fresh = true; return {};
    }
    throw new Error(`Unexpected API call: ${path}`);
  });
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
  await act(async () => root.render(<Workspace />)); await click("Staff workspace");
  expect(container.textContent).toContain("Cached sample inquiry");
});
afterEach(async () => {
  await act(async () => root.unmount()); container.remove(); localStorage.clear();
});

test.each(["overview", "insights", "write", "session-check"])("expired session during %s prompts sign-in and reloads fresh records", async kind => {
  if (kind === "overview") { failure = kind; await click("Refresh"); }
  if (kind === "insights") {
    await click("Insights"); failure = kind;
    const select = container.querySelector('[aria-label="Insights period"]');
    await act(async () => { select.value = "7"; select.dispatchEvent(new Event("change", { bubbles: true })); });
  }
  if (kind === "write" || kind === "session-check") { failure = kind; await click("Inventory"); await click("Edit"); await submit(); }
  expect(container.querySelector('.staff-layout')).toBeNull();
  expect(container.textContent).not.toContain("Cached sample inquiry");
  expect(container.querySelector('input[name="price"]')).toBeNull();
  expect(container.querySelector('input[type="password"]')).not.toBeNull();
  failure = "login"; await submit();
  expect(container.querySelector('input[type="password"]')).not.toBeNull();
  expect(container.querySelector('.staff-layout')).toBeNull();
  failure = null; await submit();
  expect(container.querySelector('input[type="password"]')).toBeNull();
  expect(container.querySelector('.staff-layout')).not.toBeNull();
  if (kind === "insights") {
    expect(container.querySelector('[aria-label="Insights period"]').value).toBe("7");
    expect(container.textContent).toContain("Leads received");
  }
  await click("Overview");
  expect(container.textContent).toContain("Fresh sample inquiry");
  expect(container.textContent).not.toContain("Cached sample inquiry");
});

test("a late overview response from the expired session is discarded before signing in again", async () => {
  let resolveOld, resolveFresh;
  overviewOverride = () => new Promise(resolve => { resolveOld = resolve; });
  await click("Refresh"); failure = "insights"; await click("Insights");
  expect(container.querySelector('input[type="password"]')).not.toBeNull();
  await act(async () => resolveOld(overview("Late old-session inquiry")));
  failure = null; overviewOverride = () => new Promise(resolve => { resolveFresh = resolve; });
  await submit(); await click("Overview");
  expect(container.textContent).toContain("Loading workspace");
  expect(container.textContent).not.toContain("Late old-session inquiry");
  expect(container.textContent).not.toContain("Cached sample inquiry");
  await act(async () => resolveFresh(overview("Fresh sample inquiry")));
  await click("Overview"); expect(container.textContent).toContain("Fresh sample inquiry");
});
