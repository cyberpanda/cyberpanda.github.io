import { api, getKey, setKey } from "./api.js";
import { setState, state, subscribe } from "./store.js";
import { esc, toast } from "./ui.js";
import * as overview from "./views/overview.js";
import * as activity from "./views/activity.js";
import * as consent from "./views/consent.js";

const NAV = [
  { id: "overview", label: "Your security", icon: "▦" },
  { id: "activity", label: "What happened", icon: "◈" },
  { id: "consent", label: "Your word", icon: "✓" },
];
const VIEWS = { overview, activity, consent };
const WHO_KEY = "cybamado_who";

async function reload() {
  const safe = async (p, fallback) => {
    try { return await p; } catch { return fallback; }
  };
  const [me, ov, alerts, cases, cons] = await Promise.all([
    safe(api.get("/me"), null),
    safe(api.get("/overview"), null),
    safe(api.get("/alerts"), []),
    safe(api.get("/cases"), []),
    safe(api.get("/consent"), { waiting: [], answered: [] }),
  ]);
  setState({ me, overview: ov, alerts, cases, consent: cons });
}

function keyScreen() {
  document.body.innerHTML = `
    <div class="login-wrap"><div class="card login-card"><div class="card-b">
      <div class="brand" style="justify-content:center;padding-bottom:14px">
        <img src="assets/logos/cybamado.png" alt="CybaMado" width="34" height="34"
             onerror="this.style.visibility='hidden'">
        <div class="brand-text">Cyba<span>Mado</span></div>
      </div>
      <p class="muted" style="font-size:13px;text-align:center;line-height:1.6">
        Your window into what we do for you.</p>
      <div class="frow" style="margin-top:14px"><label>Your key</label>
        <input id="k" type="password" placeholder="the key we gave you"></div>
      <button class="btn primary" id="go" style="width:100%">Come in</button>
    </div></div></div>`;
  const enter = async () => {
    setKey(document.getElementById("k").value.trim());
    const me = await api.get("/me").catch(() => null);
    if (!me) { setKey(""); return toast("That key does not open anything here.", "bad"); }
    await boot();
  };
  document.getElementById("go").addEventListener("click", enter);
  document.getElementById("k").addEventListener("keydown", (e) => {
    if (e.key === "Enter") enter();
  });
}

function shell() {
  document.body.innerHTML = `
    <div id="app">
      <aside class="sidebar">
        <div class="brand">
          <img src="assets/logos/cybamado.png" alt="" width="30" height="30"
               onerror="this.style.visibility='hidden'">
          <div class="brand-text">Cyba<span>Mado</span></div>
        </div>
        <div class="brand-sub" id="whose"></div>
        <nav id="nav"></nav>
        <div class="nav-spacer"></div>
        <div style="padding:8px"><label>You are</label>
          <input id="who" placeholder="your name"
                 value="${esc(localStorage.getItem(WHO_KEY) || "")}"></div>
        <button class="nav-item" id="out">↩&nbsp; Sign out</button>
      </aside>
      <main class="main" id="main"></main>
    </div>`;
  const who = document.getElementById("who");
  who.addEventListener("change", () => {
    localStorage.setItem(WHO_KEY, who.value.trim());
    setState({ who: who.value.trim() });
  });
  document.getElementById("out").addEventListener("click", () => {
    setKey("");
    keyScreen();
  });
}

function renderAll() {
  const nav = document.getElementById("nav");
  if (!nav) return;
  nav.innerHTML = NAV.map((n) => `
    <button class="nav-item ${state.view === n.id ? "active" : ""}" data-view="${n.id}">
      ${n.icon}&nbsp; ${esc(n.label)}${n.id === "consent" && state.consent.waiting.length
        ? ` <span class="chip chip-pause">${state.consent.waiting.length}</span>` : ""}
    </button>`).join("");
  nav.querySelectorAll("[data-view]").forEach((b) =>
    b.addEventListener("click", () => setState({ view: b.dataset.view })));
  const whose = document.getElementById("whose");
  if (whose && state.me) whose.textContent = state.me.customer;
  const main = document.getElementById("main");
  if (!main) return;
  const view = VIEWS[state.view] || VIEWS.overview;
  main.innerHTML = view.render();
  if (view.bind) view.bind(main, reload);
}

subscribe(renderAll);
window.addEventListener("cybamado:nokey", keyScreen);

async function boot() {
  if (!getKey()) { keyScreen(); return; }
  const me = await api.get("/me").catch(() => null);
  if (!me) { setKey(""); keyScreen(); return; }
  shell();
  setState({ who: localStorage.getItem(WHO_KEY) || "" });
  await reload();
  renderAll();
}

boot();
