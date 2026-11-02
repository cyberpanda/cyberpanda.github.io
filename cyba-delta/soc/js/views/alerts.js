import { api } from "../api.js";
import { notify, state } from "../store.js";
import { esc, fmtDate, sevBadge, tags, toast } from "../ui.js";

export function render() {
  const list = state.alerts.filter(
    (a) => !state.tenantFilter || a.tenant_id === state.tenantFilter
  );
  const options = state.customers
    .map((c) => `<option value="${esc(c.tenant_id)}" ${state.tenantFilter === c.tenant_id ? "selected" : ""}>${esc(c.name)}</option>`)
    .join("");
  const rows = list.map((a) => `
    <tr>
      <td class="mono">${esc(a.ref || "")}</td>
      <td>${sevBadge(a.severity)}</td>
      <td><b>${esc(a.title)}</b><div class="muted" style="font-size:11px">${esc(a.host || "")} ${esc(a.src_ip || "")}</div></td>
      <td>${esc(a.source || "")}</td>
      <td>${esc(a.status)}</td>
      <td>${a.occurrences > 1 ? `<span class="tag">${a.occurrences}x</span>` : ""}${tags(a.tags)}</td>
      <td>${esc(a.assignee || "—")}</td>
      <td>${fmtDate(a.created_at)}</td>
      <td>
        <button class="btn sm" data-act="read" data-seq="${a.seq}">Mark read</button>
        <button class="btn sm" data-act="close" data-seq="${a.seq}">Close</button>
      </td>
    </tr>`).join("");

  return `
    <div class="topbar">
      <div>
        <div class="page-title">Alerts</div>
        <div class="page-sub">${list.length} of ${state.alerts.length}</div>
      </div>
      <div class="spacer"></div>
      <select id="alertTenant" style="width:220px">
        <option value="">All customers</option>${options}
      </select>
    </div>
    <div class="card"><div class="card-b" style="padding:0">
      <table>
        <thead><tr><th>Ref</th><th>Severity</th><th>Title</th><th>Source</th><th>Status</th><th>Tags</th><th>Assigned</th><th>When</th><th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="9" class="muted" style="padding:16px">No alerts.</td></tr>'}</tbody>
      </table>
    </div></div>`;
}

export function bind(root, reload) {
  const sel = root.querySelector("#alertTenant");
  if (sel) {
    sel.addEventListener("change", () => {
      state.tenantFilter = sel.value;
      notify();
    });
  }
  root.querySelectorAll("[data-act]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const seq = btn.dataset.seq;
      try {
        if (btn.dataset.act === "read") await api.post(`/alerts/${seq}/read`);
        if (btn.dataset.act === "close") await api.post(`/alerts/${seq}/status?status=closed`);
        await reload();
      } catch (err) {
        toast(err.message);
      }
    });
  });
}
