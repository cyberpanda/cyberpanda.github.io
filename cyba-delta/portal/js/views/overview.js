import { setState, state } from "../store.js";
import { esc, hint } from "../ui.js";

export function render() {
  const o = state.overview;
  if (!o) return `<div class="page-title">Your security</div>`;
  return `
    <div class="topbar">
      <div>
        <div class="page-title">Your security</div>
        <div class="page-sub">${esc(o.in_plain_words)}</div>
      </div>
    </div>
    ${o.waiting_for_you
      ? `<div class="card" style="border-color:var(--warm)"><div class="card-b">
           <b style="color:var(--warm)">${o.waiting_for_you} thing${o.waiting_for_you === 1 ? "" : "s"} waiting for your word</b>
           <div class="muted" style="font-size:13px;margin-top:4px">Nothing happens on your systems until you answer.</div>
           <button class="btn primary sm" id="goConsent" style="margin-top:10px">Have a look</button>
         </div></div>`
      : ""}
    <div class="grid" style="margin:18px 0">
      <div class="kpi"><div class="kpi-v">${o.numbers.alerts}</div>
        <div class="kpi-l">alerts in ${o.numbers.days} days</div></div>
      <div class="kpi"><div class="kpi-v" style="color:${o.numbers.critical ? "#FF6B6B" : "var(--text)"}">${o.numbers.critical}</div>
        <div class="kpi-l">of them critical</div></div>
      <div class="kpi"><div class="kpi-v">${o.numbers.cases}</div><div class="kpi-l">became a case</div></div>
      <div class="kpi"><div class="kpi-v" style="color:var(--accent)">${o.numbers.cases_closed}</div>
        <div class="kpi-l">of those are closed</div></div>
      <div class="kpi"><div class="kpi-v">${o.open_cases}</div><div class="kpi-l">still with us</div></div>
    </div>
    ${o.soc_reachable ? "" : `<div class="card"><div class="card-b" style="color:var(--warm);font-size:13px">
        ${esc(o.soc_note)}. What you see here may be incomplete, so we would rather say so.</div></div>`}
    ${hint("This is your view only. Nothing here is shared with anyone else, and nothing from anyone else reaches you.")}`;
}

export function bind(root) {
  const go = root.querySelector("#goConsent");
  if (go) go.addEventListener("click", () => setState({ view: "consent" }));
}
