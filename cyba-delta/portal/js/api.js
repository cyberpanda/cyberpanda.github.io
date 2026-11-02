const BASE = "/api";
const KEY = "cybamado_key";

export function getKey() {
  return localStorage.getItem(KEY) || "";
}

export function setKey(value) {
  if (value) localStorage.setItem(KEY, value);
  else localStorage.removeItem(KEY);
}

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const key = getKey();
  if (key) headers["X-Portal-Key"] = key;
  const res = await fetch(BASE + path, {
    method, headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent("cybamado:nokey"));
    throw new Error("That key does not open anything here.");
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error((data && data.detail) || `HTTP ${res.status}`);
  return data;
}

export const api = {
  get: (p) => request("GET", p),
  post: (p, b) => request("POST", p, b),
};
