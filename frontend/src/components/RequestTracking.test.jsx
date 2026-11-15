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

let container, root;
const click = async text => {
  const button = [...container.querySelectorAll("button")].find(b => b.textContent.trim() === text);
  expect(button).toBeDefined();
  await act(async () => button.click());
};
const enterCode = async value => {
  const input = container.querySelector('form input');
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
};
const submit = async () => {
  await act(async () => container.querySelector('form').dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
};
beforeEach(async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear(); api.mockReset();
  api.mockImplementation(async path => {
    if (path === "/config") return { name: "Sample dealership", currency: "CAD" };
    if (path === "/inventory") return { vehicles: [] };
    if (path === "/auth/session") return { authenticated: false };
    throw new Error(`Unexpected API call: ${path}`);
  });
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
  await act(async () => root.render(<Workspace />));
  await click("My request");
});
afterEach(async () => {
  await act(async () => root.unmount()); container.remove(); localStorage.clear(); jest.restoreAllMocks();
});

test("editing a checked code removes stale actions and repeated failures can retry the new request", async () => {
  let failing = false;
  api.mockImplementation(async (path, options) => {
    if (path === "/request/status") {
      if (failing) throw new Error("Status temporarily unavailable");
      return { status: "new", vehicleName: options.body.token === "sample-a" ? "Sample vehicle A" : "Sample vehicle B", appointments: [] };
    }
    if (path === "/request/delete") return {};
    throw new Error(`Unexpected API call: ${path}`);
  });
  await enterCode("sample-a"); await submit();
  expect(container.textContent).toContain("Sample vehicle A");
  await enterCode("sample-b");
  expect(container.querySelector('.tracking-result')).toBeNull();
  expect(container.textContent).not.toContain("Delete my request");
  failing = true; await submit();
  expect(container.querySelector('[role="alert"]').textContent).toContain("Status temporarily unavailable");
  expect(container.querySelector('.tracking-result')).toBeNull();
  await click("Retry status");
  expect(container.querySelector('[role="alert"]').textContent).toContain("Status temporarily unavailable");
  expect(api).toHaveBeenLastCalledWith("/request/status", { method: "POST", body: { token: "sample-b" } });
  failing = false; await click("Retry status");
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(container.textContent).toContain("Sample vehicle B");
  jest.spyOn(window, "confirm").mockReturnValue(true);
  await click("Delete my request and personal details");
  expect(api).toHaveBeenLastCalledWith("/request/delete", { method: "POST", body: { token: "sample-b" } });
  expect(container.querySelector('.tracking-result')).toBeNull();
});

test("a late status response cannot restore actions after the code changes", async () => {
  let resolveStatus;
  api.mockImplementation(() => new Promise(resolve => { resolveStatus = resolve; }));
  await enterCode("sample-a"); await submit();
  await enterCode("sample-b");
  await act(async () => resolveStatus({ status: "new", vehicleName: "Old sample result", appointments: [] }));
  expect(container.querySelector('.tracking-result')).toBeNull();
  expect(container.textContent).not.toContain("Old sample result");
});
