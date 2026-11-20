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

test("initial reconnect announces pending work, blocks duplicates, and recovers after another failure", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true; localStorage.clear(); api.mockReset();
  let attempts = 0, resolveConfig, rejectConfig;
  api.mockImplementation(path => {
    if (path === "/config") {
      attempts++;
      if (attempts === 1) return Promise.reject(new Error("Initial connection unavailable"));
      return new Promise((resolve, reject) => { resolveConfig = resolve; rejectConfig = reject; });
    }
    if (path === "/inventory") return Promise.resolve({ vehicles: [] });
    if (path === "/auth/session") return Promise.resolve({ authenticated: false });
    throw new Error(`Unexpected API call: ${path}`);
  });
  const container = document.createElement("div"); document.body.appendChild(container); const root = createRoot(container);
  try {
    await act(async () => root.render(<Workspace />));
    const button = container.querySelector('button');
    expect(button.textContent).toBe("Try again");
    await act(async () => button.click());
    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe("Reconnecting…");
    expect(container.querySelector('.boot').getAttribute('aria-busy')).toBe("true");
    await act(async () => button.click());
    expect(attempts).toBe(2);
    await act(async () => rejectConfig(new Error("Still unavailable")));
    expect(container.querySelector('[role="alert"]').textContent).toContain("Still unavailable");
    expect(button.disabled).toBe(false);
    expect(button.textContent).toBe("Try again");
    await act(async () => button.click());
    expect(button.disabled).toBe(true); expect(attempts).toBe(3);
    await act(async () => resolveConfig({ name: "Sample dealership", currency: "CAD" }));
    expect(container.querySelector('.boot')).toBeNull();
    expect(container.querySelector('.shop-main')).not.toBeNull();
    expect(container.textContent).toContain("Sample dealership");
    expect(attempts).toBe(3);
  } finally {
    await act(async () => root.unmount()); container.remove(); localStorage.clear();
  }
});
