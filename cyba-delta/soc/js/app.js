import { api, getToken, setToken } from "./api.js";
import { notify, setState, state, subscribe } from "./store.js";
import { esc, toast, val } from "./ui.js";
import * as dashboard from "./views/dashboard.js";
import * as alerts from "./views/alerts.js";
import * as cases from "./views/cases.js";
import * as customers from "./views/customers.js";
import * as sources from "./views/sources.js";
import * as response from "./views/response.js";
import * as connectors from "./views/connectors.js";
import * as roles from "./views/roles.js";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "▦" },
  { id: "alerts", label: "Alerts", icon: "◈" },
  { id: "cases", label: "Cases", icon: "▤" },
  { id: "response", label: "Response", icon: "⚡" },
  { id: "customers", label: "Customers", icon: "◉" },
  { id: "sources", label: "Sources", icon: "⇲" },
  { id: "connectors", label: "Connectors", icon: "⚯" },
  { id: "roles", label: "Roles", icon: "⛊" },
];

const VIEWS = { dashboard, alerts, cases, customers, sources, response, connectors, roles };

function loginScreen() {
  document.body.innerHTML = `
    <div class="login-wrap">
      <div class="card login-card">
        <div class="card-b">
          <div class="brand" style="justify-content:center;padding-bottom:14px">
            <img src="assets/logos/cybasoa.png" alt="CybaSoa" width="34" height="34"
                 onerror="this.style.visibility='hidden'">
            <div class="brand-text">Cyba<span>Soa</span></div>
          </div>
          <div class="frow"><label>User name</label><input id="lu" autocomplete="username"></div>
          <div class="frow"><label>Password</label><input id="lp" type="password" autocomplete="current-password"></div>
          <button class="btn primary" id="lb" style="width:100%">Sign in</button>
          <div class="muted" style="font-size:11px;margin-top:12px;text-align:center">
            Security Orchestration, Automation &amp; Response
          </div>
        </div>
      </div>
    </div>`;
  const submit = async () => {
    try {
      const res = await api.post("/auth/login", { username: val("lu"), password: val("lp") });
      setToken(res.access_token);
      await boot();
    } catch (err) {
      toast(err.message);
    }
  };
  document.getElementById("lb").addEventListener("click", submit);
  document.getElementById("lp").addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });
}

function shell() {
  document.body.innerHTML = `
    <div id="app">
      <aside class="sidebar">
        <div class="brand">
          <img src="assets/logos/cybasoa.png" alt="" width="30" height="30"
               onerror="this.style.visibility='hidden'">
          <div class="brand-text">Cyba<span>Soa</span></div>
        </div>
        <nav id="nav"></nav>
        <div class="nav-spacer"></div>
        <div class="muted" style="font-size:11px;padding:8px">
          <div id="who"></div>
        </div>
        <button class="nav-item" id="toRoof" title="Back to CYBA Delta">⌂&nbsp; CYBA Delta</button>
        <button class="nav-item" id="logout">↩&nbsp; Sign out</button>
      </aside>
      <main class="main" id="main"></main>
    </div>`;
  const roof = document.getElementById("toRoof");
  if (roof) {
    roof.addEventListener("click", () => {
      window.location.href = "../";
    });
  }
  document.getElementById("logout").addEventListener("click", () => {
    setToken("");
    loginScreen();
  });
}

async function reload() {
  const safe = async (p, fallback) => {
    try {
      return await p;
    } catch {
      return fallback;
    }
  };
  const [a, c, s, cu, ac, co, ro] = await Promise.all([
    safe(api.get("/alerts?limit=200"), []),
    safe(api.get("/cases"), []),
    safe(api.get("/sources"), []),
    safe(api.get("/customers"), []),
    safe(api.get("/response"), []),
    safe(api.get("/connectors"), []),
    safe(api.get("/roles"), { roles: [], permissions: [] }),
  ]);
  setState({
    alerts: a, cases: c, sources: s, customers: cu, actions: ac,
    connectors: co, roles: ro.roles || [], permissions: ro.permissions || [],
  });
}

function renderNav() {
  const nav = document.getElementById("nav");
  if (!nav) return;
  nav.innerHTML = NAV.map((n) => `
    <button class="nav-item ${state.view === n.id ? "active" : ""}" data-view="${n.id}">
      ${n.icon} ${esc(n.label)}
    </button>`).join("");
  nav.querySelectorAll("[data-view]").forEach((b) => {
    b.addEventListener("click", () => setState({ view: b.dataset.view }));
  });
  const who = document.getElementById("who");
  if (who && state.user) {
    who.innerHTML = `${esc(state.user.username)}<br><span class="tag">${esc(state.user.role)}</span>`;
  }
}

function renderView() {
  const main = document.getElementById("main");
  if (!main) return;
  const view = VIEWS[state.view] || VIEWS.dashboard;
  main.innerHTML = view.render();
  if (view.bind) {
    if (state.view === "customers") view.bind(main, reload, sources.openSourceModal);
    else view.bind(main, reload);
  }
}

function renderAll() {
  renderNav();
  renderView();
}

async function boot() {
  if (!getToken()) {
    loginScreen();
    return;
  }
  try {
    const me = await api.get("/auth/me");
    shell();
    setState({ user: me });
    await reload();
  } catch {
    setToken("");
    loginScreen();
  }
}

subscribe(renderAll);
window.addEventListener("cybasoa:logout", loginScreen);
boot();
