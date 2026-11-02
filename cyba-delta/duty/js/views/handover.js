import { api } from "../api.js";
import { setState, state } from "../store.js";
import { closeModal, empty, esc, hint, modal, toast, val } from "../ui.js";

const STATE_CHIP = { draft: "chip-pause", handed_over: "chip-run",
                     acknowledged: "chip-stop" };
const STATE_WORD = { draft: "still yours", handed_over: "passed on",
                     acknowledged: "picked up" };

function carried(note) {
  const c = note.carried || {};
  const rows = [];
  (c.cases || []).forEach((x) => rows.push(`
    <tr><td><span class="tag">case</span></td><td class="mono">${esc(x.ref)}</td>
      <td>${esc(x.title)}</td>
      <td>${esc(x.customer)}</td>
      <td>${x.assigned_to ? esc(x.assigned_to) : '<span class="muted">nobody</span>'}</td></tr>`));
  (c.actions || []).forEach((x) => rows.push(`
    <tr><td><span class="tag">action</span></td><td class="mono">${esc(x.ref)}</td>
      <td>${esc(x.what)}</td><td>${esc(x.customer)}</td>
      <td>${esc(x.state)}</td></tr>`));
  (c.watch || []).forEach((x) => rows.push(`
    <tr><td><span class="tag">watch</span></td><td class="mono">—</td>
      <td>${esc(x.what)}</td><td colspan="2">${esc(x.why)}</td></tr>`));
  return rows.join("");
}

export function render() {
  const notes = state.handovers;
  if (!notes.length) {
    return `
      <div class="topbar">
        <div><div class="page-title">Handover</div>
        <div class="page-sub">It writes itself from what is open. You add what only you know.</div></div>
        <div class="spacer"></div>
        <button class="btn primary" id="newNote">Write one</button>
      </div>
      ${empty("No handovers yet",
              "At the end of a shift, write one. It pulls the open cases and the actions in flight by itself.")}`;
  }

  const cards = notes.map((n) => `
    <div class="card">
      <div class="card-h">
        <span class="chip ${STATE_CHIP[n.state] || "chip-stop"}">${STATE_WORD[n.state] || n.state}</span>
        <b>${esc(n.shift)} shift, ${esc(n.from_person)}</b>
        ${n.to_person ? `<span class="muted">to ${esc(n.to_person)}</span>` : ""}
        ${n.stale ? '<span class="chip chip-fail">nobody picked this up</span>' : ""}
        <div class="spacer"></div>
        <span class="muted" style="font-size:12px">${esc(n.created_at || "")}</span>
      </div>
      <div class="card-b">
        <div style="font-size:13px;margin-bottom:8px"><b>${esc(n.summary || "")}</b></div>
        ${n.note ? `<div class="muted" style="font-size:13px;margin-bottom:10px">${esc(n.note)}</div>` : ""}
        ${(n.attention || []).length
          ? `<div style="color:var(--warm);font-size:12px;margin-bottom:10px">
               ${n.attention.map(esc).join("<br>")}</div>`
          : ""}
        ${carried(n) ? `<div class="tbl-wrap"><table>
            <thead><tr><th></th><th>Ref</th><th>What</th><th>Customer</th><th>State</th></tr></thead>
            <tbody>${carried(n)}</tbody></table></div>` : ""}
        ${n.soc_reachable === false
          ? `<div class="hint" style="color:var(--warm)">${esc(n.soc_note || "")}</div>` : ""}
        <div style="margin-top:12px">
          ${n.state === "draft" ? `<button class="btn sm primary" data-pass="${esc(n.id)}">Pass it on</button>` : ""}
          ${n.state === "handed_over" ? `<button class="btn sm primary" data-take="${esc(n.id)}">I have it</button>` : ""}
        </div>
      </div>
    </div>`).join("");

  return `
    <div class="topbar">
      <div><div class="page-title">Handover</div>
      <div class="page-sub">Newest first. A note nobody picked up is marked, not forgotten.</div></div>
      <div class="spacer"></div>
      <button class="btn primary" id="newNote">Write one</button>
    </div>
    ${cards}`;
}

export function bind(root, reload) {
  const write = root.querySelector("#newNote");
  if (write) {
    write.addEventListener("click", () => {
      modal("Write the handover", `
        <p class="muted" style="font-size:13px;line-height:1.6">
          The open cases and the actions in flight come along by themselves.
          Add what only you know.
        </p>
        <div class="frow" style="margin-top:12px"><label>Anything to say</label>
          <textarea id="hNote" rows="3" placeholder="Quiet apart from the phish wave."></textarea></div>
        <div class="frow"><label>Something to keep an eye on</label>
          <input id="hWatch" placeholder="srv-09"></div>
        <div class="frow"><label>Why</label>
          <input id="hWhy" placeholder="was noisy all morning"></div>
        <button class="btn primary" id="hSave">Write it</button>`);
      document.getElementById("hSave").addEventListener("click", async () => {
        const watch = val("hWatch") ? [{ what: val("hWatch"), why: val("hWhy") }] : [];
        try {
          await api.post("/handovers/draft", { person: state.me, note: val("hNote"), watch });
          closeModal();
          await reload();
          toast("Written. Pass it on when you go.");
        } catch (err) {
          toast(err.message, "bad");
        }
      });
    });
  }

  root.querySelectorAll("[data-pass]").forEach((b) =>
    b.addEventListener("click", () => {
      modal("Pass it on", `
        <div class="frow"><label>To whom</label><input id="toWho" placeholder="bo"></div>
        <button class="btn primary" id="passGo">Pass it on</button>
        ${hint("They have to pick it up, so nothing falls between two shifts.")}`);
      document.getElementById("passGo").addEventListener("click", async () => {
        try {
          await api.post(`/handovers/${b.dataset.pass}/hand-over`, { to: val("toWho") });
          closeModal();
          await reload();
        } catch (err) {
          toast(err.message, "bad");
        }
      });
    }));

  root.querySelectorAll("[data-take]").forEach((b) =>
    b.addEventListener("click", async () => {
      if (!state.me) return toast("Tell us who you are first, top right.", "bad");
      try {
        await api.post(`/handovers/${b.dataset.take}/take-over`, { person: state.me });
        await reload();
        toast("Taken over. The shift is yours.");
      } catch (err) {
        toast(err.message, "bad");
      }
    }));
}
