import React, { act } from "react";
import { createRoot } from "react-dom/client";
import Workspace from "./Workspace";
import { api } from "../lib/api";

jest.mock("../lib/api", () => ({ api: jest.fn(), setToken: jest.fn() }));
jest.mock("../lib/native", () => ({ isNative: () => false }));
jest.mock("sonner", () => ({ Toaster: () => null, toast: { error: jest.fn() } }));
// Dialog internals are unrelated to the insights request lifecycle.
jest.mock("./ui/dialog", () => ({
  Dialog: ({ open, children }) => open ? children : null,
  DialogContent: ({ children }) => children,
  DialogHeader: ({ children }) => children,
  DialogTitle: ({ children }) => children,
  DialogDescription: ({ children }) => children,
}));

test("similar vehicles expose repeated failures and retry the selected vehicle", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  const vehicle = { id: "a", year: 2026, make: "Sample", model: "One", price: 20000, mileage: 100, inStock: true, bodyType: "SUV", fuelType: "Gasoline" };
  let failing = true;
  api.mockImplementation(async path => {
    if (path === "/config") return { name: "Test dealership", currency: "CAD" };
    if (path === "/inventory") return { vehicles: [vehicle] };
    if (path === "/auth/session") return { authenticated: false };
    if (path === "/inventory/a/similar") {
      if (failing) throw new Error("Similar vehicles unavailable");
      return { similar: [{ vehicle: { ...vehicle, id: "b", model: "Two" }, reasons: ["Same body type"] }] };
    }
    throw new Error(`Unexpected API call: ${path}`);
  });
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const retry = async () => {
    const button = [...container.querySelectorAll("button")].find(b => b.textContent === "Retry similar vehicles");
    expect(button).toBeDefined();
    await act(async () => button.click());
  };
  try {
    await act(async () => root.render(<Workspace />));
    await act(async () => container.querySelector(".car-card button").click());
    expect(container.querySelector('[role="alert"]').textContent).toContain("Similar vehicles unavailable");
    expect(container.textContent).not.toContain("Finding similar vehicles");
    expect(container.textContent).not.toContain("No similar vehicles are currently listed");
    await retry();
    expect(container.querySelector('[role="alert"]').textContent).toContain("Similar vehicles unavailable");
    failing = false;
    await retry();
    expect(api).toHaveBeenLastCalledWith("/inventory/a/similar");
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.querySelector('.similar').textContent).toContain("Sample Two");
  } finally {
    await act(async () => root.unmount());
    container.remove();
    localStorage.clear();
  }
});
