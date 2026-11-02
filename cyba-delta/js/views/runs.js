import { state } from "../store.js";
import { empty, esc, fmtTime, statusChip } from "../ui.js";

export function render() {
  if (!state.runs.length) {
    return `
      <div class="topbar">
        <div><div class="page-title">Runs</div>
        <div class="page-sub">Every run leaves a trace here, so you can see what happened.</div></div>
      </div>
      ${empty("No runs yet", "Try a flow with Test run first. Nothing leaves the house.")}`;
  }
  const rows = state.runs.map((r) => `
    <tr>
      <td>${statusChip(r.status)}</td>
      <td><b>${esc(r.workflow)}</b>${r.dry_run ? ' <span class="tag">test</span>' : ""}</td>
      <td class="muted">${r.steps.length} step(s)</td>
      <td class="muted">${esc(r.errors.join(" · ") || "—")}</td>
      <td class="muted">${fmtTime(r.created_at)}</td>
    </tr>`).join("");
  return `
    <div class="topbar">
      <div><div class="page-title">Runs</div>
      <div class="page-sub">Newest first. Test runs are marked, so you can tell them apart.</div></div>
    </div>
    <div class="card"><div class="card-b" style="padding:0">
      <table>
        <thead><tr><th>Result</th><th>Flow</th><th>Steps</th><th>Notes</th><th>When</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div></div>`;
}
