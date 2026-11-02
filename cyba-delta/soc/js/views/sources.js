import { api } from "../api.js";
import { notify, state } from "../store.js";
import { checked, closeModal, esc, modal, toast, val } from "../ui.js";

const TYPES = ["wazuh", "splunk", "sentinel", "elastic", "opensearch", "qradar",
  "suricata", "zeek", "sysmon", "syslog", "nids", "webhook"];

function locationsOf(tenantId) {
  const c = state.customers.find((x) => x.tenant_id === tenantId);
  return (c && c.locations) || [];
}

export function render() {
  const list = state.sources.filter(
    (s) => !state.sourceTenantFilter || s.tenant_id === state.sourceTenantFilter
  );
  const opts = state.customers
    .map((c) => `<option value="${esc(c.tenant_id)}" ${state.sourceTenantFilter === c.tenant_id ? "selected" : ""}>${esc(c.name)}</option>`)
    .join("");
  const rows = list.map((s) => `
    <tr>
      <td><span class="tag">${esc(s.type)}</span></td>
      <td>
        <b>${esc(s.name)}</b>
        ${s.location ? `<div class="muted" style="font-size:11px">📍 ${esc(s.location)}</div>` : ""}
      </td>
      <td>${esc(s.sensor_id || "—")}</td>
      <td>${esc((state.customers.find((c) => c.tenant_id === s.tenant_id) || {}).name || s.tenant_id || "—")}</td>
      <td>${s.enabled ? '<span class="tag" style="color:var(--accent)">active</span>' : '<span class="tag" style="color:var(--warn)">inactive</span>'}</td>
      <td><button class="btn sm" data-edit="${esc(s.name)}">Edit or move</button></td>
    </tr>`).join("");

  return `
    <div class="topbar">
      <div><div class="page-title">Sources and sensors</div><div class="page-sub">${list.length} of ${state.sources.length}</div></div>
      <div class="spacer"></div>
      <select id="srcTenant" style="width:200px"><option value="">All customers</option>${opts}</select>
      <button class="btn primary" id="newSource">+ Add a source</button>
    </div>
    <div class="card"><div class="card-b" style="padding:0">
      <table>
        <thead><tr><th>Type</th><th>Name</th><th>Sensor id</th><th>Customer</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6" class="muted" style="padding:16px">No sources yet.</td></tr>'}</tbody>
      </table>
    </div></div>`;
}

export function openSourceModal(name, preferTenant) {
  const s = name ? state.sources.find((x) => x.name === name) : null;
  const tenant = s ? s.tenant_id : preferTenant || "";
  const custOpts = state.customers
    .map((c) => `<option value="${esc(c.tenant_id)}" ${tenant === c.tenant_id ? "selected" : ""}>${esc(c.name)}</option>`)
    .join("");
  const typeOpts = TYPES.map((t) => `<option value="${esc(t)}">`).join("");
  const locOpts = locationsOf(tenant).map((l) => `<option value="${esc(l)}">`).join("");
  modal(s ? `Edit source – ${s.name}` : "Add a source", `
    <div class="frow"><label>Name</label><input id="sName" value="${s ? esc(s.name) : ""}" ${s ? "disabled" : ""} placeholder="wazuh-master-01"></div>
    <div class="frow"><label>Type, pick one or write your own</label>
      <input id="sType" list="typeList" value="${s ? esc(s.type) : "wazuh"}">
      <datalist id="typeList">${typeOpts}</datalist></div>
    <div class="frow"><label>Customer</label><select id="sTenant">${custOpts}</select></div>
    <div class="frow"><label>Sensor or agent id</label><input id="sSensor" value="${s ? esc(s.sensor_id || "") : ""}"></div>
    <div class="frow"><label>Site, suggestions come from the customer</label>
      <input id="sLoc" list="locList" value="${s ? esc(s.location || "") : ""}">
      <datalist id="locList">${locOpts}</datalist></div>
    ${s ? `<div class="frow"><label><input type="checkbox" id="sEnabled" ${s.enabled ? "checked" : ""} style="width:auto"> Active</label></div>` : ""}
    <button class="btn primary" id="sSave">${s ? "Save" : "Create"}</button>`);

  const tenantSel = document.getElementById("sTenant");
  tenantSel.addEventListener("change", () => {
    document.getElementById("locList").innerHTML =
      locationsOf(tenantSel.value).map((l) => `<option value="${esc(l)}">`).join("");
  });
  document.getElementById("sSave").addEventListener("click", () => save(s));
}

async function save(existing) {
  const body = {
    type: val("sType").toLowerCase() || "webhook",
    tenant_id: val("sTenant"),
    location: val("sLoc") || null,
  };
  try {
    if (existing) {
      body.enabled = checked("sEnabled");
      await api.patch(`/sources/${encodeURIComponent(existing.name)}`, body);
    } else {
      if (!val("sName")) return toast("Give it a name");
      body.name = val("sName");
      body.sensor_id = val("sSensor") || null;
      const res = await api.post("/sources", body);
      modal("Source added, keep this key", `
        <p class="muted">You see this key once. Header <span class="mono">X-API-Key</span> bei <span class="mono">POST /api/ingest/${esc(res.type)}</span>.</p>
        <pre class="mono" style="user-select:all;background:#0F1211;border:1px solid var(--line);border-radius:8px;padding:12px;margin-top:10px;overflow-x:auto">${esc(res.api_key)}</pre>`);
      state.sources.push(res);
      notify();
      return;
    }
    closeModal();
    state.sources = await api.get("/sources");
    notify();
  } catch (err) {
    toast(err.message);
  }
}

export function bind(root, reload) {
  const sel = root.querySelector("#srcTenant");
  if (sel) {
    sel.addEventListener("change", () => {
      state.sourceTenantFilter = sel.value;
      notify();
    });
  }
  const nb = root.querySelector("#newSource");
  if (nb) nb.addEventListener("click", () => openSourceModal(null, state.sourceTenantFilter));
  root.querySelectorAll("[data-edit]").forEach((b) => {
    b.addEventListener("click", () => openSourceModal(b.dataset.edit));
  });
}
