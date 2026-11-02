export const state = {
  view: "today",
  meta: null,
  today: null,
  rota: null,
  handovers: [],
  me: "",
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
