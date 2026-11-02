import { api } from "./api.js";
import { setState, state, subscribe } from "./store.js";
import { brandMark, switcher } from "./brand.js";
import { esc, toast } from "./ui.js";
import * as flows from "./views/flows.js";
import * as templates from "./views/templates.js";
import * as editor from "./views/editor.js";
import * as apps from "./views/apps.js";
import * as runs from "./views/runs.js";
import * as productsView from "./views/products.js";
import * as profiles from "./views/profiles.js";
import * as sources from "./views/sources.js";

const NAV = [
  { id: "flows", label: "Flows", icon: "⇢" },
  { id: "templates", label: "Templates", icon: "◇" },
  { id: "apps", label: "Apps", icon: "⚯" },
  { id: "profiles", label: "Customers", icon: "◎" },
  { id: "sources", label: "Sources", icon: "⇥" },
  { id: "runs", label: "Runs", icon: "◷" },
  { id: "products", label: "Products", icon: "◈" },
];

const VIEWS = { flows, templates, editor, apps, runs, profiles, sources,
                products: productsView };

async function reload() {
  const safe = async (p, fallback) => {
    try { return await p; } catch { return fallback; }
  };
  const [meta, workflows, tpl, appList, runList, productList, spaceList,
         profileList, channelMap, sourceList] = await Promise.all([
    safe(api.get("/meta"), null),
    safe(api.get("/workflows"), []),
    safe(api.get("/templates"), []),
    safe(api.get("/apps"), []),
    safe(api.get("/runs?limit=50"), []),
    safe(api.get("/products"), []),
    safe(api.get("/spaces"), []),
    safe(api.get("/profiles"), []),
    safe(api.get("/channels"), { normalize: [], respond: [] }),
    safe(api.get("/ingest/sources"), []),
  ]);
  setState({ meta, workflows, templates: tpl, apps: appList, runs: runList,
             products: productList, spaces: spaceList, profiles: profileList,
             channels: channelMap, sources: sourceList });
}

function shell() {
  document.body.innerHTML = `
    <div id="app">
      <aside class="sidebar">
        <div id="brand"></div>
        <nav id="nav"></nav>
        <div class="nav-spacer"></div>
        <div class="nav-note" id="foot"></div>
      </aside>
      <main class="main" id="main"></main>
    </div>`;
}

function renderBrand() {
  const host = document.getElementById("brand");
  if (!host) return;
  const current = state.spaces.find((s) => s.name === state.space)
    || { wordmark: ["CYBA", "Delta"], logo: "assets/logos/cyba-delta.png",
         summary: "Quiet automation for the SOC" };
  host.innerHTML = `
    <button class="brand" id="brandBtn" title="Switch tool">
      ${brandMark(current)}
      <span class="brand-caret">${state.switchOpen ? "&#9652;" : "&#9662;"}</span>
    </button>
    <div class="brand-sub">${esc(current.summary || "")}</div>
    ${switcher(state.spaces, state.space)}`;

  const btn = document.getElementById("brandBtn");
  const menu = document.getElementById("switchMenu");
  if (btn && menu) {
    menu.hidden = !state.switchOpen;
    btn.addEventListener("click", () => setState({ switchOpen: !state.switchOpen }));
    menu.querySelectorAll("[data-go]").forEach((item) =>
      item.addEventListener("click", () => {
        const target = state.spaces.find((s) => s.name === item.dataset.go);
        if (!target) return;
        if (target.kind === "roof") {
          setState({ space: target.name, switchOpen: false, view: "flows" });
          return;
        }
        window.location.href = target.url;
      }));
  }
}

function renderNav() {
  const nav = document.getElementById("nav");
  if (!nav) return;
  const current = state.view === "editor" ? "flows" : state.view;
  nav.innerHTML = NAV.map((n) => `
    <button class="nav-item ${current === n.id ? "active" : ""}" data-view="${n.id}">
      ${n.icon}&nbsp; ${esc(n.label)}
    </button>`).join("");
  nav.querySelectorAll("[data-view]").forEach((b) =>
    b.addEventListener("click", () => setState({ view: b.dataset.view, editing: null })));
  const foot = document.getElementById("foot");
  if (foot && state.meta) {
    const running = state.workflows.filter((w) => w.state === "running").length;
    foot.innerHTML = `${esc(state.meta.component)} ${esc(state.meta.version)}<br>
      ${running} flow(s) running`;
  }
}

function renderView() {
  const main = document.getElementById("main");
  if (!main) return;
  const view = VIEWS[state.view] || VIEWS.flows;
  main.innerHTML = view.render();
  if (view.bind) view.bind(main, reload);
}

function renderAll() {
  renderBrand();
  renderNav();
  renderView();
}

subscribe(renderAll);

async function boot() {
  shell();
  await reload();
  renderAll();
}

boot();
