import { state } from "../store.js";
import { esc, fmtDate, sevBadge } from "../ui.js";

function count(list, key, value) {
  return list.filter((x) => x[key] === value).length;
}

export function render() {
  const a = state.alerts;
  const open = a.filter((x) => x.status !== "closed" && x.status !== "false_positive");
  const pending = state.actions.filter((x) => x.status === "requested");
  const rows = a.slice(0, 12).map((x) => `
    <tr>
      <td class="mono">${esc(x.ref || "")}</td>
      <td>${sevBadge(x.severity)}</td>
      <td>${esc(x.title)}</td>
      <td>${esc(x.source || "")}</td>
      <td>${esc(x.assignee || "—")}</td>
      <td>${fmtDate(x.created_at)}</td>
    </tr>`).join("");

  return `
    <div class="page-title">Dashboard</div>
    <div class="page-sub">What is going on, across all customers</div>
    <div class="grid" style="margin:18px 0">
      <div class="kpi"><div class="kpi-v">${open.length}</div><div class="kpi-l">Open alerts</div></div>
      <div class="kpi"><div class="kpi-v" style="color:#FF6B6B">${count(a, "severity", "critical")}</div><div class="kpi-l">Critical</div></div>
      <div class="kpi"><div class="kpi-v">${state.cases.length}</div><div class="kpi-l">Cases</div></div>
      <div class="kpi"><div class="kpi-v" style="color:var(--warn)">${pending.length}</div><div class="kpi-l">Response actions waiting</div></div>
      <div class="kpi"><div class="kpi-v">${state.sources.length}</div><div class="kpi-l">Sources</div></div>
      <div class="kpi"><div class="kpi-v">${state.customers.length}</div><div class="kpi-l">Customers</div></div>
    </div>
    <div class="card">
      <div class="card-h"><b>Newest alerts</b></div>
      <div class="card-b" style="padding:0">
        <table>
          <thead><tr><th>Ref</th><th>Severity</th><th>Title</th><th>Source</th><th>Assigned</th><th>When</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="6" class="muted" style="padding:16px">No alerts yet.</td></tr>'}</tbody>
        </table>
      </div>
    </div>`;
}
