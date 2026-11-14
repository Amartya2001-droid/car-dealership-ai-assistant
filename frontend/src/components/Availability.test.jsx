import React, { act } from "react";
import { createRoot } from "react-dom/client";
import Workspace from "./Workspace";
import { api } from "../lib/api";

jest.mock("../lib/api", () => ({ api: jest.fn(), setToken: jest.fn() }));
jest.mock("../lib/native", () => ({ isNative: () => false }));
jest.mock("sonner", () => ({ Toaster: () => null, toast: { error: jest.fn() } }));
// Keep the full workspace request lifecycle; dialog layout is unrelated to recovery.
jest.mock("./ui/dialog", () => ({
  Dialog: ({ open, children }) => open ? children : null,
  DialogContent: ({ children }) => children,
  DialogHeader: ({ children }) => children,
  DialogTitle: ({ children }) => children,
  DialogDescription: ({ children }) => children,
}));

test("availability retry preserves the chosen date through a second failure and recovers selectable times", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  const vehicle = { id: "a", year: 2026, make: "Sample", model: "One", price: 20000, mileage: 100, inStock: true, bodyType: "SUV", fuelType: "Gasoline" };
  let failing = true;
  api.mockImplementation(async path => {
    if (path === "/config") return { name: "Test dealership", currency: "CAD", timezone: "America/Halifax" };
    if (path === "/inventory") return { vehicles: [vehicle] };
    if (path === "/auth/session") return { authenticated: false };
    if (path === "/inventory/a/similar") return { similar: [] };
    if (path.startsWith("/availability?date=")) {
      if (failing) throw new Error("Availability temporarily unavailable");
      return { slots: [{ start: "2026-11-20T14:00:00Z", available: true }] };
    }
    throw new Error(`Unexpected API call: ${path}`);
  });
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const click = async text => {
    const button = [...container.querySelectorAll("button")].find(b => b.textContent.trim() === text);
    expect(button).toBeDefined();
    await act(async () => button.click());
  };
  try {
    await act(async () => root.render(<Workspace />));
    await act(async () => container.querySelector(".car-card .photo-button").click());
    await click("Request a test drive");
    const date = container.querySelector('.slot-picker input[type="date"]');
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(date, "2026-11-20");
      date.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(container.querySelector('.slot-picker [role="alert"]').textContent).toContain("Availability temporarily unavailable");
    expect(container.textContent).not.toContain("Checking availability");
    const retry = [...container.querySelectorAll("button")].find(b => b.textContent.trim() === "Retry availability");
    expect(retry.type).toBe("button");
    await click("Retry availability");
    expect(api).toHaveBeenLastCalledWith("/availability?date=2026-11-20");
    expect(container.querySelector('.slot-picker [role="alert"]').textContent).toContain("Availability temporarily unavailable");
    failing = false;
    await click("Retry availability");
    expect(date.value).toBe("2026-11-20");
    expect(container.querySelector('.slot-picker [role="alert"]')).toBeNull();
    const slot = container.querySelector('[role="radio"]');
    expect(slot.disabled).toBe(false);
    await act(async () => slot.click());
    expect(slot.getAttribute("aria-checked")).toBe("true");
    expect(api.mock.calls.some(([path]) => path === "/inquiries")).toBe(false);
  } finally {
    await act(async () => root.unmount());
    container.remove(); localStorage.clear();
  }
});
