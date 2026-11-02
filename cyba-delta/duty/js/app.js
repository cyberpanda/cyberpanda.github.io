import { api } from "./api.js";
import { setState, state, subscribe } from "./store.js";
import { esc } from "./ui.js";
import * as today from "./views/today.js";
import * as rota from "./views/rota.js";
import * as handover from "./views/handover.js";

const NAV = [
  { id: "today", label: "Today", icon: "◷" },
  { id: "rota", label: "Rota", icon: "▤" },
  { id: "handover", label: "Handover", icon: "⇄" },
];

const VIEWS = { today, rota, handover };
const ME_KEY = "cybaban_me";

async function reload() {
  const safe = async (p, fallback) => {
    try { return await p; } catch { return fallback; }
  };
  const [meta, todayData, rotaData, handovers] = await Promise.all([
    safe(api.get("/meta"), null),
    safe(api.get("/today"), null),
    safe(api.get("/rota?days=14"), null),
    safe(api.get("/handovers"), []),
  ]);
  setState({ meta, today: todayData, rota: rotaData, handovers });
}

function shell() {
  document.body.innerHTML = `
    <div id="app">
      <aside class="sidebar">
        <div class="brand">
          <img src="assets/logos/cybaban.png" alt="" width="30" height="30"
               onerror="this.style.visibility='hidden'">
          <div class="brand-text">Cyba<span>Ban</span></div>
        </div>
        <div class="brand-sub">Who is on, and what they need to know</div>
        <nav id="nav"></nav>
        <div class="nav-spacer"></div>
        <div style="padding:8px">
          <label>You are</label>
          <input id="me" placeholder="your name" value="${esc(localStorage.getItem(ME_KEY) || "")}">
        </div>
        <button class="nav-item" id="toRoof" title="Back to CYBA Delta">⌂&nbsp; CYBA Delta</button>
      </aside>
      <main class="main" id="main"></main>
    </div>`;
  const me = document.getElementById("me");
  me.addEventListener("change", () => {
    localStorage.setItem(ME_KEY, me.value.trim());
    setState({ me: me.value.trim() });
  });
  document.getElementById("toRoof").addEventListener("click", () => {
    window.location.href = "../";
  });
}

function renderNav() {
  const nav = document.getElementById("nav");
  if (!nav) return;
  nav.innerHTML = NAV.map((n) => `
    <button class="nav-item ${state.view === n.id ? "active" : ""}" data-view="${n.id}">
      ${n.icon}&nbsp; ${esc(n.label)}
    </button>`).join("");
  nav.querySelectorAll("[data-view]").forEach((b) =>
    b.addEventListener("click", () => setState({ view: b.dataset.view })));
}

function renderView() {
  const main = document.getElementById("main");
  if (!main) return;
  const view = VIEWS[state.view] || VIEWS.today;
  main.innerHTML = view.render();
  if (view.bind) view.bind(main, reload);
}

function renderAll() {
  renderNav();
  renderView();
}

subscribe(renderAll);

async function boot() {
  shell();
  setState({ me: localStorage.getItem(ME_KEY) || "" });
  await reload();
  renderAll();
}

boot();
