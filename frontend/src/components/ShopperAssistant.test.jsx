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

test("a failed assistant question retries in place, preserves a new draft, and recovers after a second failure", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear(); api.mockReset();
  let failing = true, resolveChat;
  api.mockImplementation(async (path) => {
    if (path === "/config") return { name: "Sample dealership", currency: "CAD", aiMode: "guided" };
    if (path === "/inventory") return { vehicles: [] };
    if (path === "/auth/session") return { authenticated: false };
    if (path === "/chat") {
      if (failing) throw new Error("Temporary assistant outage");
      return new Promise(resolve => { resolveChat = resolve; });
    }
    throw new Error(`Unexpected API call: ${path}`);
  });
  const container = document.createElement("div"); document.body.appendChild(container);
  const root = createRoot(container);
  const click = async text => {
    const button = [...container.querySelectorAll("button")].find(b => b.textContent.trim() === text);
    expect(button).toBeDefined(); await act(async () => button.click());
  };
  const question = "What are your sales hours?";
  try {
    await act(async () => root.render(<Workspace />));
    await act(async () => container.querySelector('[aria-label="Open shopper assistant"]').click());
    await click(question);
    expect(container.querySelector('.chat-panel [role="alert"]').textContent).toContain("I couldn’t connect");
    const input = container.querySelector('[aria-label="Message to assistant"]');
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, "A different draft");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await click("Retry message");
    expect(api).toHaveBeenLastCalledWith("/chat", { method: "POST", body: { message: question } });
    expect(container.querySelectorAll('.message.user')).toHaveLength(1);
    expect(container.querySelectorAll('.message.assistant')).toHaveLength(1);
    expect(input.value).toBe("A different draft");
    failing = false;
    await click("Retry message");
    expect(container.textContent).toContain("Working on it");
    expect(container.querySelector('[aria-label="Send message"]').disabled).toBe(true);
    expect(container.querySelector('.chat-panel [role="alert"]')).toBeNull();
    await act(async () => resolveChat({ reply: "Sample showroom hours", mode: "guided_fallback" }));
    expect(container.querySelectorAll('.message.user')).toHaveLength(1);
    expect(container.querySelectorAll('.message.assistant')).toHaveLength(1);
    expect(container.textContent).toContain("Sample showroom hours");
    expect(container.textContent).toContain("Guided answer · Live AI unavailable");
    expect(container.textContent).not.toContain("Working on it");
    expect(container.textContent).not.toContain("Retry message");
    expect(input.value).toBe("A different draft");
  } finally {
    await act(async () => root.unmount()); container.remove(); localStorage.clear();
  }
});
