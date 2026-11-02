import { api } from "../api.js";
import { state } from "../store.js";
import { closeModal, esc, fmtDate, modal, sevBadge, toast, val } from "../ui.js";

export function render() {
  const rows = state.cases.map((c) => `
    <tr>
      <td class="mono">${esc(c.ref || "")}</td>
      <td><b>${esc(c.title)}</b></td>
      <td>${sevBadge(c.severity)}</td>
      <td>${esc(c.status)}</td>
      <td>${esc(c.assigned_to || "—")}</td>
      <td>${fmtDate(c.created_at)}</td>
    </tr>`).join("");
  return `
    <div class="topbar">
      <div><div class="page-title">Cases</div><div class="page-sub">${state.cases.length} in progress</div></div>
      <div class="spacer"></div>
      <button class="btn primary" id="newCase">+ New case</button>
    </div>
    <div class="card"><div class="card-b" style="padding:0">
      <table>
        <thead><tr><th>Ref</th><th>Title</th><th>Severity</th><th>Status</th><th>Assigned</th><th>Created</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6" class="muted" style="padding:16px">No cases yet.</td></tr>'}</tbody>
      </table>
    </div></div>`;
}

export function bind(root, reload) {
  const btn = root.querySelector("#newCase");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const opts = state.customers
      .map((c) => `<option value="${esc(c.tenant_id)}">${esc(c.name)}</option>`).join("");
    modal("New case", `
      <div class="frow"><label>Title</label><input id="cTitle"></div>
      <div class="frow"><label>Customer</label><select id="cTenant">${opts}</select></div>
      <div class="frow"><label>Severity</label><select id="cSev">
        <option>low</option><option selected>medium</option><option>high</option><option>critical</option>
      </select></div>
      <div class="frow"><label>Summary</label><textarea id="cSummary" rows="4"></textarea></div>
      <button class="btn primary" id="cSave">Create</button>`);
    document.getElementById("cSave").addEventListener("click", async () => {
      if (!val("cTitle")) return toast("Title angeben");
      try {
        await api.post("/cases", {
          title: val("cTitle"),
          tenant_id: val("cTenant") || null,
          severity: val("cSev"),
          summary: val("cSummary"),
        });
        closeModal();
        await reload();
      } catch (err) {
        toast(err.message);
      }
    });
  });
}
