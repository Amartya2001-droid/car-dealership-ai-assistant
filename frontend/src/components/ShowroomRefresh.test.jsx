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

test("failed refresh after a saved vehicle edit is visible and retry updates the showroom without saving twice", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true; localStorage.clear(); api.mockReset();
  const vehicle = { id: "a", year: 2026, make: "Sample", model: "One", price: 20000, mileage: 100, inStock: true, bodyType: "SUV", fuelType: "Gasoline" };
  let saved = false, failing = true;
  api.mockImplementation(async (path, options) => {
    if (path === "/config") return { name: "Sample dealership", currency: "CAD" };
    if (path === "/inventory") {
      if (saved && failing) throw new Error("Showroom temporarily unavailable");
      return { vehicles: [{ ...vehicle, price: saved ? 21000 : 20000 }] };
    }
    if (path === "/auth/session") return { authenticated: true };
    if (path === "/admin/overview") return { leads: [], appointments: [], vehicles: [{ ...vehicle, price: saved ? 21000 : 20000 }], stats: {} };
    if (path === "/admin/inventory/a" && options.method === "PATCH") { saved = true; return {}; }
    throw new Error(`Unexpected API call: ${path}`);
  });
  const container = document.createElement("div"); document.body.appendChild(container);
  const root = createRoot(container);
  const click = async text => {
    const button = [...container.querySelectorAll("button")].find(b => b.textContent.trim() === text);
    expect(button).toBeDefined(); await act(async () => button.click());
  };
  try {
    await act(async () => root.render(<Workspace />));
    await click("Staff workspace"); await click("Inventory"); await click("Edit");
    container.querySelector('input[name="price"]').value = "21000";
    await act(async () => container.querySelector('input[name="price"]').closest('form').dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(container.querySelector('[role="alert"]').textContent).toContain("Showroom temporarily unavailable");
    await click("Explore cars");
    expect(container.querySelector('.car-card').textContent).toContain("$20,000");
    await click("Retry showroom");
    expect(container.querySelector('[role="alert"]').textContent).toContain("Showroom temporarily unavailable");
    expect(container.querySelector('.car-card').textContent).toContain("$20,000");
    failing = false; await click("Retry showroom");
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.querySelector('.car-card').textContent).toContain("$21,000");
    expect(api.mock.calls.filter(([path]) => path === "/admin/inventory/a")).toHaveLength(1);
    expect(api.mock.calls.find(([path]) => path === "/admin/inventory/a")[1].body.price).toBe("21000");
  } finally {
    await act(async () => root.unmount()); container.remove(); localStorage.clear();
  }
});
