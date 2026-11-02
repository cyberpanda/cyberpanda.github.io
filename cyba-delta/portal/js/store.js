export const state = {
  view: "overview",
  me: null,
  overview: null,
  alerts: [],
  cases: [],
  consent: { waiting: [], answered: [] },
  who: "",
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
