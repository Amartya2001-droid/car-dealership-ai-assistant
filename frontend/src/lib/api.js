const base = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
let nativeToken = "";
export const setToken = (token) => {
  nativeToken = token || "";
};
export async function api(path, options = {}) {
  const response = await fetch(base + "/api" + path, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(nativeToken ? { Authorization: `Bearer ${nativeToken}` } : {}),
    },
    signal: AbortSignal.timeout(25000),
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("The server could not be reached. Check your connection.");
  }
  if (!response.ok) {
    const error = new Error(result.error || "Request failed");
    error.status = response.status;
    throw error;
  }
  return result;
}
