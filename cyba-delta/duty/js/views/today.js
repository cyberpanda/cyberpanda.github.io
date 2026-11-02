import { api } from "../api.js";
import { setState, state } from "../store.js";
import { empty, esc, hint, toast } from "../ui.js";

export function render() {
  const t = state.today;
  if (!t) return `<div class="page-title">Today</div>`;

  const duty = t.on_duty.length
    ? t.on_duty.map((d) => `
        <div class="kpi">
          <div class="kpi-v" style="font-size:20px">${esc(d.person)}</div>
          <div class="kpi-l">on ${esc(d.shift)}, until ${esc(d.until.slice(11))}</div>
        </div>`).join("")
    : `<div class="kpi"><div class="kpi-v" style="font-size:18px;color:var(--warm)">nobody</div>
         <div class="kpi-l">no one is on shift right now</div></div>`;

  const next = t.next_up.length
    ? t.next_up.map((n) => `${esc(n.person)} (${esc(n.shift)}, ${esc(n.starts.slice(11))})`).join(", ")
    : "nothing planned";

  const waiting = t.waiting_handovers.map((n) => `
    <div class="step">
      <span class="chip ${n.stale ? "chip-fail" : "chip-pause"}">${n.stale ? "waiting too long" : "waiting"}</span>
      <span><b>${esc(n.from_person)}</b> handed the ${esc(n.shift)} shift to
        <b>${esc(n.to_person)}</b></span>
      <span class="muted">${esc(n.summary || "")}</span>
      <div class="spacer"></div>
      <button class="btn sm primary" data-take="${esc(n.id)}">I have it</button>
    </div>`).join("");

  const holes = t.gaps.slice(0, 6).map((g) => `
    <span class="tag">${esc(g.day)} ${esc(g.label)}</span>`).join("");

  return `
    <div class="topbar">
      <div>
        <div class="page-title">Today</div>
        <div class="page-sub">Who is on, what is open, and what is waiting to be picked up.</div>
      </div>
      <div class="spacer"></div>
      <button class="btn primary" id="startHandover">Write the handover</button>
    </div>

    <div class="grid" style="margin-bottom:18px">
      ${duty}
      <div class="kpi"><div class="kpi-v">${t.open_cases}</div><div class="kpi-l">open cases</div></div>
      <div class="kpi"><div class="kpi-v" style="color:var(--warm)">${t.open_actions}</div>
        <div class="kpi-l">actions in flight</div></div>
      <div class="kpi"><div class="kpi-v" style="font-size:15px">${esc(next)}</div>
        <div class="kpi-l">next on</div></div>
    </div>

    ${t.soc_reachable ? "" : `<div class="card"><div class="card-b" style="color:var(--warm);font-size:13px">
      ${esc(t.soc_note)}</div></div>`}

    <div class="card">
      <div class="card-h"><b>Handovers waiting</b></div>
      <div class="card-b">
        ${waiting || '<span class="muted" style="font-size:13px">Nothing is waiting. Everything has been picked up.</span>'}
      </div>
    </div>

    <div class="card">
      <div class="card-h"><b>Holes in the next week</b></div>
      <div class="card-b">
        ${holes || '<span class="muted" style="font-size:13px">The next seven days are covered.</span>'}
        ${t.gaps.length > 6 ? hint(`and ${t.gaps.length - 6} more`) : ""}
      </div>
    </div>`;
}

export function bind(root, reload) {
  const go = root.querySelector("#startHandover");
  if (go) go.addEventListener("click", () => setState({ view: "handover" }));

  root.querySelectorAll("[data-take]").forEach((b) =>
    b.addEventListener("click", async () => {
      if (!state.me) return toast("Tell us who you are first, top right.", "bad");
      try {
        await api.post(`/handovers/${b.dataset.take}/take-over`, { person: state.me });
        toast("Taken over. The shift is yours.");
        await reload();
      } catch (err) {
        toast(err.message, "bad");
      }
    }));
}
