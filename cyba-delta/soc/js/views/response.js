import { api } from "../api.js";
import { state } from "../store.js";
import { esc, fmtDate, toast } from "../ui.js";

export function render() {
  const rows = state.actions.map((a) => `
    <tr>
      <td class="mono">${esc(a.ticket_number)}</td>
      <td>${esc(a.action_type)}</td>
      <td class="mono">${esc(a.target)}</td>
      <td>${esc(a.status)}</td>
      <td>${esc(a.provider || "—")}</td>
      <td>${esc(a.requested_by || "—")} / ${esc(a.approved_by || "—")}</td>
      <td>${fmtDate(a.executed_at)}</td>
      <td>
        ${a.status === "requested" ? `<button class="btn sm primary" data-approve="${a.id}">Approve</button>` : ""}
        ${a.status === "executed" ? `<button class="btn sm danger" data-revert="${a.id}">Roll back</button>` : ""}
      </td>
    </tr>`).join("");
  return `
    <div class="topbar">
      <div><div class="page-title">Response</div>
      <div class="page-sub">Four eyes: someone else has to approve</div></div>
    </div>
    <div class="card"><div class="card-b" style="padding:0">
      <table>
        <thead><tr><th>Ticket</th><th>Action</th><th>Target</th><th>Status</th><th>Provider</th><th>Requested by / approved by</th><th>Done</th><th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="8" class="muted" style="padding:16px">Keine Response.</td></tr>'}</tbody>
      </table>
    </div></div>`;
}

export function bind(root, reload) {
  root.querySelectorAll("[data-approve]").forEach((b) => {
    b.addEventListener("click", async () => {
      try {
        await api.post(`/response/${b.dataset.approve}/approve`);
        await reload();
      } catch (err) {
        toast(err.message);
      }
    });
  });
  root.querySelectorAll("[data-revert]").forEach((b) => {
    b.addEventListener("click", async () => {
      try {
        await api.post(`/response/${b.dataset.revert}/revert`);
        await reload();
      } catch (err) {
        toast(err.message);
      }
    });
  });
}
