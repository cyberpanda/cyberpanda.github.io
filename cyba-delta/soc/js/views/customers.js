import { api } from "../api.js";
import { notify, state } from "../store.js";
import { closeModal, esc, modal, tags, toast, val } from "../ui.js";

function sourcesOf(tenantId) {
  return state.sources.filter((s) => s.tenant_id === tenantId);
}

export function render() {
  const rows = state.customers.map((c) => `
    <tr>
      <td class="mono">${esc(c.number || "—")}</td>
      <td>
        <b>${esc(c.name)}</b>
        <div class="muted" style="font-size:11px">${esc(c.tenant_id)}</div>
        ${c.aliases && c.aliases.length ? `<div class="muted" style="font-size:11px">alias: ${esc(c.aliases.join(", "))}</div>` : ""}
      </td>
      <td>${esc(c.email || "—")}</td>
      <td>${tags(c.tags)}${(c.locations || []).map((l) => `<span class="tag">📍 ${esc(l)}</span>`).join("")}</td>
      <td>
        <a href="javascript:void(0)" data-goto="${esc(c.tenant_id)}">${sourcesOf(c.tenant_id).length} source(s)</a>
        <button class="btn sm" data-addsrc="${esc(c.tenant_id)}" title="Add a source">+</button>
      </td>
      <td><button class="btn sm" data-edit="${esc(c.tenant_id)}">Edit</button></td>
    </tr>`).join("");

  return `
    <div class="topbar">
      <div><div class="page-title">Customers</div><div class="page-sub">Customers, their other names, their sites</div></div>
      <div class="spacer"></div>
      <button class="btn primary" id="newCustomer">+ New customer</button>
    </div>
    <div class="card"><div class="card-b" style="padding:0">
      <table>
        <thead><tr><th>Nr.</th><th>Name</th><th>E-Mail</th><th>Tags and sites</th><th>Sources</th><th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6" class="muted" style="padding:16px">No customers yet.</td></tr>'}</tbody>
      </table>
    </div></div>`;
}

function form(c) {
  return `
    <div class="frow"><label>Tenant-ID</label><input id="kTenant" value="${c ? esc(c.tenant_id) : ""}" ${c ? "disabled" : ""} placeholder="t-acme"></div>
    <div class="frow"><label>Name</label><input id="kName" value="${c ? esc(c.name) : ""}"></div>
    <div class="frow"><label>Customer number</label><input id="kNum" value="${c ? esc(c.number || "") : ""}"></div>
    <div class="frow"><label>E-Mail</label><input id="kMail" value="${c ? esc(c.email || "") : ""}"></div>
    <div class="frow"><label>Tags, comma separated</label><input id="kTags" value="${c ? esc((c.tags || []).join(", ")) : ""}"></div>
    <div class="frow"><label>Other names, comma separated</label><input id="kAliases" value="${c ? esc((c.aliases || []).join(", ")) : ""}" placeholder="ACME, acme-prod"></div>
    <div class="frow"><label>Sites, one per line</label><textarea id="kLocs" rows="3" placeholder="HQ North&#10;Plant West">${c ? esc((c.locations || []).join("\n")) : ""}</textarea></div>
    <button class="btn primary" id="kSave">Save</button>`;
}

async function save(existing, reload) {
  const split = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
  const tenant = existing ? existing.tenant_id : val("kTenant");
  if (!tenant || !val("kName")) return toast("Tenant id and name are needed");
  try {
    await api.post("/customers", {
      tenant_id: tenant,
      name: val("kName"),
      number: val("kNum"),
      email: val("kMail"),
      tags: split(val("kTags")),
      aliases: split(val("kAliases")),
      locations: (document.getElementById("kLocs").value || "")
        .split("\n").map((x) => x.trim()).filter(Boolean),
    });
    closeModal();
    await reload();
  } catch (err) {
    toast(err.message);
  }
}

export function bind(root, reload, openSourceModal) {
  const nb = root.querySelector("#newCustomer");
  if (nb) {
    nb.addEventListener("click", () => {
      modal("New customer", form(null));
      document.getElementById("kSave").addEventListener("click", () => save(null, reload));
    });
  }
  root.querySelectorAll("[data-edit]").forEach((b) => {
    b.addEventListener("click", () => {
      const c = state.customers.find((x) => x.tenant_id === b.dataset.edit);
      modal(`Edit customer – ${c.name}`, form(c));
      document.getElementById("kSave").addEventListener("click", () => save(c, reload));
    });
  });
  root.querySelectorAll("[data-goto]").forEach((a) => {
    a.addEventListener("click", () => {
      state.sourceTenantFilter = a.dataset.goto;
      state.view = "sources";
      notify();
    });
  });
  root.querySelectorAll("[data-addsrc]").forEach((b) => {
    b.addEventListener("click", () => openSourceModal(null, b.dataset.addsrc));
  });
}
