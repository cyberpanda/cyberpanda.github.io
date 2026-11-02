import { state } from "../store.js";
import { empty, esc, fmtTime } from "../ui.js";

function sev(value) {
  const s = String(value || "info").toLowerCase();
  return `<span class="chip ${s === "critical" || s === "high" ? "chip-fail"
    : s === "medium" ? "chip-pause" : "chip-stop"}">${esc(s)}</span>`;
}

export function render() {
  if (!state.alerts.length && !state.cases.length) {
    return `
      <div class="topbar"><div><div class="page-title">What happened</div>
        <div class="page-sub">Your alerts and the cases we opened for you.</div></div></div>
      ${empty("Nothing to show", "Nothing has come in for you yet. That is good news.")}`;
  }
  const cases = state.cases.map((c) => `
    <tr><td class="mono">${esc(c.ref || "")}</td><td><b>${esc(c.title)}</b></td>
      <td>${sev(c.severity)}</td><td>${esc(c.status)}</td>
      <td class="muted">${fmtTime(c.created_at)}</td></tr>`).join("");
  const alerts = state.alerts.slice(0, 50).map((a) => `
    <tr><td class="mono">${esc(a.ref || "")}</td><td>${esc(a.title)}</td>
      <td>${sev(a.severity)}</td><td>${esc(a.status || "")}</td>
      <td class="muted">${fmtTime(a.created_at)}</td></tr>`).join("");
  return `
    <div class="topbar"><div><div class="page-title">What happened</div>
      <div class="page-sub">The cases we are working, and what came in.</div></div></div>
    <div class="card"><div class="card-h"><b>Cases</b></div>
      <div class="card-b" style="padding:0"><table>
        <thead><tr><th>Ref</th><th>What</th><th>How bad</th><th>Where it stands</th><th>Opened</th></tr></thead>
        <tbody>${cases || '<tr><td colspan="5" class="muted" style="padding:16px">No cases.</td></tr>'}</tbody>
      </table></div></div>
    <div class="card"><div class="card-h"><b>Alerts</b>
      <span class="muted" style="font-size:12px">newest first</span></div>
      <div class="card-b" style="padding:0"><table>
        <thead><tr><th>Ref</th><th>What</th><th>How bad</th><th>State</th><th>When</th></tr></thead>
        <tbody>${alerts || '<tr><td colspan="5" class="muted" style="padding:16px">No alerts.</td></tr>'}</tbody>
      </table></div></div>`;
}
