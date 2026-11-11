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

test("a failed insights request ends loading and retry recovers the selected period", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  let failing = true;
  api.mockImplementation(async (path) => {
    if (path === "/config") return { name: "Test dealership", currency: "CAD" };
    if (path === "/inventory") return { vehicles: [] };
    if (path === "/auth/session") return { authenticated: true };
    if (path === "/admin/overview") return { leads: [], appointments: [], vehicles: [], stats: {} };
    if (path.startsWith("/admin/insights")) {
      if (failing) throw new Error("Insights temporarily unavailable");
      return {
        funnel: ["received", "contacted", "qualified", "won"].map(stage => ({ stage, count: 0, percent: null })),
        sources: { web: 0, voice: 0 }, response: { medianMinutes: null, responded: 0, awaiting: 0, untracked: 0 },
        testDrives: { completed: 0, notCompleted: 0, cancelled: 0, unconfirmed: 0, upcoming: 0, showRate: null },
        leadsPerVehicle: [], generalInquiries: 0,
      };
    }
    throw new Error(`Unexpected API call: ${path}`);
  });
  const click = async (text) => {
    const button = [...container.querySelectorAll("button")].find(b => b.textContent.trim() === text);
    expect(button).toBeDefined();
    await act(async () => button.click());
  };
  try {
    await act(async () => root.render(<Workspace />));
    await click("Staff workspace");
    await click("Insights");
    expect(container.querySelector('[role="alert"]').textContent).toContain("Insights temporarily unavailable");
    expect(container.textContent).not.toContain("Loading insights");
    const period = container.querySelector('select[aria-label="Insights period"]');
    expect(period).not.toBeNull();
    await act(async () => {
      period.value = "7";
      period.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await click("Retry insights");
    expect(api).toHaveBeenLastCalledWith("/admin/insights?days=7");
    expect(container.querySelector('[role="alert"]').textContent).toContain("Insights temporarily unavailable");
    expect(container.textContent).not.toContain("Loading insights");
    failing = false;
    await click("Retry insights");
    expect(api).toHaveBeenLastCalledWith("/admin/insights?days=7");
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.textContent).toContain("Leads received");
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});

test("workspace failures show an error and retry recovers after a second failure", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  let failing = true;
  api.mockImplementation(async path => {
    if (path === "/config") return { name: "Test dealership", currency: "CAD" };
    if (path === "/inventory") return { vehicles: [] };
    if (path === "/auth/session") return { authenticated: true };
    if (path === "/admin/overview") {
      if (failing) throw new Error("Workspace temporarily unavailable");
      return { leads: [], appointments: [], vehicles: [], stats: {} };
    }
    throw new Error(`Unexpected API call: ${path}`);
  });
  const click = async text => {
    const button = [...container.querySelectorAll("button")].find(b => b.textContent.trim() === text);
    expect(button).toBeDefined();
    await act(async () => button.click());
  };
  try {
    await act(async () => root.render(<Workspace />));
    await click("Staff workspace");
    expect(container.querySelector('[role="alert"]').textContent).toContain("Workspace temporarily unavailable");
    expect(container.textContent).not.toContain("Loading workspace");
    await click("Retry workspace");
    expect(container.querySelector('[role="alert"]').textContent).toContain("Workspace temporarily unavailable");
    failing = false;
    await click("Retry workspace");
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.textContent).toContain("New leads");
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});

test("comparison failures end loading and retry recovers the selected vehicles", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.setItem("northstar-compare", JSON.stringify(["a", "b"]));
  const vehicles = ["a", "b"].map(id => ({ id, year: 2026, make: "Sample", model: id, price: 20000, mileage: 100, inStock: true, bodyType: "SUV", fuelType: "Gasoline", imageUrl: "", description: "Sample vehicle" }));
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  let failing = true;
  api.mockImplementation(async path => {
    if (path === "/config") return { name: "Test dealership", currency: "CAD" };
    if (path === "/inventory") return { vehicles };
    if (path === "/auth/session") return { authenticated: false };
    if (path === "/compare?ids=a,b") {
      if (failing) throw new Error("Comparison temporarily unavailable");
      return { vehicles, highlights: { lowestPrice: [], newest: [], lowestMileage: [] } };
    }
    throw new Error(`Unexpected API call: ${path}`);
  });
  const click = async text => {
    const button = [...container.querySelectorAll("button")].find(b => b.textContent.trim() === text);
    expect(button).toBeDefined();
    await act(async () => button.click());
  };
  try {
    await act(async () => root.render(<Workspace />));
    await act(async () => container.querySelector(".compare-bar button").click());
    expect(container.querySelector('[role="alert"]').textContent).toContain("Comparison temporarily unavailable");
    expect(container.textContent).not.toContain("Loading comparison");
    await click("Retry comparison");
    expect(container.querySelector('[role="alert"]').textContent).toContain("Comparison temporarily unavailable");
    failing = false;
    await click("Retry comparison");
    expect(api).toHaveBeenLastCalledWith("/compare?ids=a,b");
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.querySelector('.compare-table')).not.toBeNull();
  } finally {
    await act(async () => root.unmount());
    container.remove();
    localStorage.clear();
  }
});
