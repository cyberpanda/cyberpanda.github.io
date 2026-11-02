import { api } from "../api.js";
import { state } from "../store.js";
import { closeModal, empty, esc, hint, modal, toast, val } from "../ui.js";

function waited(minutes) {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

export function render() {
  const { waiting, answered } = state.consent;
  const asks = waiting.map((r) => `
    <div class="card" style="${r.nudge ? "border-color:var(--warm)" : ""}">
      <div class="card-h">
        <span class="chip ${r.nudge ? "chip-pause" : "chip-run"}">waiting ${esc(waited(r.waiting_minutes))}</span>
        <b>${esc(r.action.replace(/_/g, " "))} on ${esc(r.target)}</b>
        <div class="spacer"></div>
        <span class="mono muted" style="font-size:11px">${esc(r.ref)}</span>
      </div>
      <div class="card-b">
        <div style="font-size:14px;margin-bottom:8px"><b>What this does:</b> ${esc(r.impact)}.</div>
        <div class="muted" style="font-size:13px;margin-bottom:12px"><b>Why we ask:</b> ${esc(r.why)}</div>
        <button class="btn primary sm" data-yes="${esc(r.ref)}">Yes, go ahead</button>
        <button class="btn danger sm" data-no="${esc(r.ref)}">No, not this</button>
      </div>
    </div>`).join("");
  const done = answered.slice(0, 10).map((r) => `
    <tr><td><span class="chip ${r.state === "granted" ? "chip-run" : "chip-fail"}">${esc(r.state)}</span></td>
      <td class="mono">${esc(r.ref)}</td>
      <td>${esc(r.action.replace(/_/g, " "))} on ${esc(r.target)}</td>
      <td>${esc(r.answered_by)}</td><td class="muted">${esc(r.answer || "")}</td></tr>`).join("");
  return `
    <div class="topbar"><div><div class="page-title">Your word</div>
      <div class="page-sub">We ask before we touch your systems. Nothing happens until you answer.</div></div></div>
    ${asks || empty("Nothing needs your word",
                    "When we want to do something on your systems, it will appear here.")}
    ${done ? `<div class="card"><div class="card-h"><b>What you have answered</b></div>
      <div class="card-b" style="padding:0"><table>
        <thead><tr><th></th><th>Ref</th><th>What</th><th>Who</th><th>Note</th></tr></thead>
        <tbody>${done}</tbody></table></div></div>` : ""}
    ${hint("Waiting is never taken as a yes. If you do not answer, nothing happens.")}`;
}

export function bind(root, reload) {
  const answer = async (ref, yes) => {
    if (!state.who) return toast("Put your name in first, on the left.", "bad");
    if (yes) {
      try {
        await api.post(`/consent/${encodeURIComponent(ref)}/answer`,
                       { answer: "yes", person: state.who });
        toast("Thank you. We will get on with it.");
        await reload();
      } catch (err) { toast(err.message, "bad"); }
      return;
    }
    modal("Not this one", `
      <div class="frow"><label>Why not? It helps us find another way.</label>
        <textarea id="cNote" rows="3" placeholder="That box runs the payroll today."></textarea></div>
      <button class="btn primary" id="cGo">Send</button>`);
    document.getElementById("cGo").addEventListener("click", async () => {
      if (!val("cNote")) return toast("A short reason, please.", "bad");
      try {
        await api.post(`/consent/${encodeURIComponent(ref)}/answer`,
                       { answer: "no", person: state.who, note: val("cNote") });
        closeModal();
        await reload();
      } catch (err) { toast(err.message, "bad"); }
    });
  };
  root.querySelectorAll("[data-yes]").forEach((b) =>
    b.addEventListener("click", () => answer(b.dataset.yes, true)));
  root.querySelectorAll("[data-no]").forEach((b) =>
    b.addEventListener("click", () => answer(b.dataset.no, false)));
}
