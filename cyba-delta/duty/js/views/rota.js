import { api } from "../api.js";
import { state } from "../store.js";
import { closeModal, esc, hint, modal, toast, val } from "../ui.js";

const SHIFT_CLASS = { early: "chip-run", late: "chip-pause", night: "chip-fail",
                      day: "chip-run", standby: "chip-stop" };

function byDay(entries) {
  const out = {};
  entries.forEach((e) => {
    out[e.day] = out[e.day] || [];
    out[e.day].push(e);
  });
  return out;
}

export function render() {
  const rota = state.rota;
  if (!rota) return `<div class="page-title">Rota</div>`;
  const days = byDay(rota.entries);
  const holes = {};
  (rota.gaps || []).forEach((g) => {
    holes[g.day] = holes[g.day] || [];
    holes[g.day].push(g);
  });

  const keys = [...new Set([...Object.keys(days), ...Object.keys(holes)])].sort();
  const rows = keys.map((day) => `
    <tr>
      <td><b>${esc(day)}</b></td>
      <td>
        ${(days[day] || []).map((e) => `
          <span class="chip ${SHIFT_CLASS[e.shift] || "chip-stop"}" style="margin-right:4px">
            ${esc(e.shift)}: ${esc(e.person)}</span>
          <button class="btn sm" data-drop="${esc(e.id)}" title="Take this off the rota">x</button>
        `).join("")}
        ${(holes[day] || []).map((g) => `
          <span class="tag" style="color:var(--warm)">${esc(g.label)} is open</span>`).join("")}
      </td>
    </tr>`).join("");

  return `
    <div class="topbar">
      <div>
        <div class="page-title">Rota</div>
        <div class="page-sub">${esc(rota.since)} to ${esc(rota.until)}.
          A hole is shown, not hidden.</div>
      </div>
      <div class="spacer"></div>
      <button class="btn primary" id="addShift">Put someone on</button>
    </div>
    <div class="card"><div class="card-b" style="padding:0">
      <table>
        <thead><tr><th style="width:130px">Day</th><th>Who is on</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="2" class="muted" style="padding:16px">Nothing planned yet.</td></tr>'}</tbody>
      </table>
    </div></div>
    ${hint("Somebody who came off a night shift under eleven hours ago will not be woken.")}`;
}

export function bind(root, reload) {
  const add = root.querySelector("#addShift");
  if (add) {
    add.addEventListener("click", () => {
      const shifts = (state.meta && state.meta.shifts) || [];
      const today = new Date().toISOString().slice(0, 10);
      modal("Put someone on", `
        <div class="frow"><label>Who</label><input id="rPerson" placeholder="anna"></div>
        <div class="frow"><label>Day</label><input id="rDay" type="date" value="${today}"></div>
        <div class="frow"><label>Shift</label><select id="rShift">
          ${shifts.map((p) => `<option value="${esc(p.key)}">${esc(p.label)} (${esc(p.start)}-${esc(p.end)})</option>`).join("")}
        </select></div>
        <button class="btn primary" id="rSave">Put them on</button>`);
      document.getElementById("rSave").addEventListener("click", async () => {
        if (!val("rPerson")) return toast("A name, please.", "bad");
        try {
          await api.post("/rota", { person: val("rPerson"), day: val("rDay"),
                                    shift: val("rShift") });
          closeModal();
          await reload();
        } catch (err) {
          toast(err.message, "bad");
        }
      });
    });
  }
  root.querySelectorAll("[data-drop]").forEach((b) =>
    b.addEventListener("click", async () => {
      try {
        await api.del(`/rota/${b.dataset.drop}`);
        await reload();
      } catch (err) {
        toast(err.message, "bad");
      }
    }));
}
