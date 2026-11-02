import { api } from "../api.js";
import { state } from "../store.js";
import { closeModal, esc, hint, modal, toast, val } from "../ui.js";

const SIDE_LABEL = {
  normalize: "brings events in",
  respond: "acts on the outside",
};

export function render() {
  const groups = { normalize: [], respond: [] };
  state.apps.forEach((a) => (groups[a.side] || groups.respond).push(a));
  const section = (side) => {
    const tiles = groups[side].map((a) => `
      <div class="tile">
        <div class="tile-t">${esc(a.title)}
          ${a.configured ? "" : '<span class="chip chip-pause" style="margin-left:6px">needs setup</span>'}</div>
        <div class="tile-s">${esc(a.description)}</div>
        <div class="tile-f">
          <span class="tag">${esc(a.category)}</span>
          <span class="tag">${a.actions.length} action(s)</span>
          <div class="spacer"></div>
          <button class="btn sm" data-setup="${esc(a.name)}">Set up</button>
        </div>
      </div>`).join("");
    return `
      <div class="card-h" style="border:0;padding:6px 0 10px">
        <b>${side === "normalize" ? "Normalize Delta" : "Respond Delta"}</b>
        <span class="muted" style="font-size:12px">${SIDE_LABEL[side]}</span>
      </div>
      <div class="tiles" style="margin-bottom:22px">${tiles || '<span class="muted">None yet.</span>'}</div>`;
  };

  return `
    <div class="topbar">
      <div>
        <div class="page-title">Apps</div>
        <div class="page-sub">Both sides of the house: what brings events in, and what acts on the outside.</div>
      </div>
      <div class="spacer"></div>
      <button class="btn" id="importSpec">Import API spec</button>
      <button class="btn primary" id="customApp">Custom app</button>
    </div>
    ${section("normalize")}
    ${section("respond")}`;
}

export function bind(root, reload) {
  root.querySelectorAll("[data-setup]").forEach((b) =>
    b.addEventListener("click", () => setup(b.dataset.setup, reload)));

  const imp = root.querySelector("#importSpec");
  if (imp) imp.addEventListener("click", () => importSpec(reload));

  const custom = root.querySelector("#customApp");
  if (custom) custom.addEventListener("click", () => customApp(reload));
}

function setup(name, reload) {
  const app = state.apps.find((a) => a.name === name);
  if (!app) return;
  const fields = {
    api_key: '<div class="frow"><label>API key</label><input id="c_api_key" type="password"></div>',
    bearer: '<div class="frow"><label>Token</label><input id="c_token" type="password"></div>',
    basic: '<div class="frow"><label>User</label><input id="c_username"></div>' +
           '<div class="frow"><label>Password</label><input id="c_password" type="password"></div>',
    oauth2: '<div class="frow"><label>Access token</label><input id="c_access_token" type="password"></div>',
    none: '<div class="muted" style="font-size:13px;margin-bottom:12px">No credentials needed.</div>',
  }[app.auth] || "";

  modal(`Set up ${app.title}`, `
    <div class="frow"><label>Base URL</label>
      <input id="c_base" value="${esc(app.base_url || "")}" placeholder="https://tool.example.com"></div>
    ${fields}
    <button class="btn primary" id="save">Save</button>
    ${hint("Stored for this app only. Flows never see the secret itself.")}
    <div class="card" style="margin-top:16px">
      <div class="card-h"><b>Actions</b></div>
      <div class="card-b" style="padding:0">
        <table><tbody>
          ${app.actions.map((x) => `<tr><td class="mono">${esc(x.name)}</td>
            <td class="muted">${esc(x.description)}</td></tr>`).join("")}
        </tbody></table>
      </div>
    </div>`);

  document.getElementById("save").addEventListener("click", async () => {
    const creds = {};
    ["api_key", "token", "username", "password", "access_token"].forEach((k) => {
      const el = document.getElementById(`c_${k}`);
      if (el && el.value) creds[k] = el.value;
    });
    try {
      await api.post(`/apps/${name}/credentials`, { credentials: creds, base_url: val("c_base") });
      closeModal();
      await reload();
      toast("Saved.");
    } catch (err) { toast(err.message, "bad"); }
  });
}

function importSpec(reload) {
  modal("Import an API spec", `
    <p class="muted" style="font-size:13px;line-height:1.6">
      Paste an OpenAPI document. Every operation becomes an action you can use in a flow.
    </p>
    <div class="frow" style="margin-top:12px">
      <label>Side</label>
      <select id="side">
        <option value="respond">Respond Delta — it acts on the outside</option>
        <option value="normalize">Normalize Delta — it brings events in</option>
      </select>
    </div>
    <div class="frow"><label>OpenAPI JSON</label>
      <textarea id="doc" rows="10" class="mono" placeholder='{ "openapi": "3.0.0", ... }'></textarea></div>
    <button class="btn primary" id="imp">Import</button>`, "min(640px, 94vw)");

  document.getElementById("imp").addEventListener("click", async () => {
    let document_;
    try {
      document_ = JSON.parse(document.getElementById("doc").value);
    } catch {
      return toast("That is not valid JSON yet.", "bad");
    }
    try {
      const app = await api.post("/apps/import/openapi", { document: document_, side: val("side") });
      closeModal();
      await reload();
      toast(`Imported ${app.title} with ${app.actions.length} action(s).`);
    } catch (err) { toast(err.message, "bad"); }
  });
}

function customApp(reload) {
  const example = {
    name: "my_app",
    title: "My App",
    version: "0.1.0",
    side: "respond",
    category: "custom",
    description: "What this app is for.",
    base_url: "https://api.example.com",
    auth: { type: "api_key", in: "header", name: "X-API-Key" },
    actions: [{
      name: "do_something",
      description: "What this action does.",
      request: { method: "POST", path: "/things" },
      parameters: [{ name: "target", type: "string", required: true, location: "body",
                     source_name: "target" }],
    }],
  };
  modal("Custom app", `
    <p class="muted" style="font-size:13px;line-height:1.6">
      Describe your tool once. The same shape works on both sides.
    </p>
    <div class="frow" style="margin-top:12px">
      <label>Manifest</label>
      <textarea id="man" rows="14" class="mono">${esc(JSON.stringify(example, null, 2))}</textarea>
    </div>
    <button class="btn primary" id="saveMan">Save app</button>`, "min(660px, 94vw)");

  document.getElementById("saveMan").addEventListener("click", async () => {
    let manifest;
    try {
      manifest = JSON.parse(document.getElementById("man").value);
    } catch {
      return toast("That is not valid JSON yet.", "bad");
    }
    try {
      await api.post("/apps", manifest);
      closeModal();
      await reload();
      toast("App saved.");
    } catch (err) { toast(err.message, "bad"); }
  });
}
