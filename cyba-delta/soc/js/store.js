export const state = {
  user: null,
  view: "dashboard",
  alerts: [],
  cases: [],
  rules: [],
  actions: [],
  customers: [],
  sources: [],
  connectors: [],
  roles: [],
  permissions: [],
  tenantFilter: "",
  sourceTenantFilter: "",
};

const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notify() {
  listeners.forEach((fn) => fn());
}

export function setState(patch) {
  Object.assign(state, patch);
  notify();
}
