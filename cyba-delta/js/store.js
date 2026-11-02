export const state = {
  view: "flows",
  meta: null,
  workflows: [],
  templates: [],
  apps: [],
  runs: [],
  products: [],
  spaces: [],
  space: "cyba-delta",
  switchOpen: false,
  profiles: [],
  profile: null,
  profileCustomer: "",
  channels: { normalize: [], respond: [] },
  sources: [],
  editing: null,
  selectedNode: null,
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
