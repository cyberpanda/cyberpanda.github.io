import { state } from "../store.js";
import { empty, esc, hint } from "../ui.js";

export function render() {
  if (!state.products.length) {
    return `
      <div class="topbar">
        <div><div class="page-title">Products</div>
        <div class="page-sub">The rest of the family, and whether it is up.</div></div>
      </div>
      ${empty("Nothing registered", "No products are set up next to CYBA Delta yet.")}`;
  }

  const tiles = state.products.map((p) => `
    <div class="tile">
      <div class="tile-t">${esc(p.title)}
        <span class="chip ${p.up ? "chip-run" : "chip-stop"}" style="margin-left:6px">${p.up ? "up" : "not running"}</span>
      </div>
      <div class="muted" style="font-size:11px">${esc(p.role)}</div>
      <div class="tile-s">${esc(p.summary)}</div>
      <div class="muted" style="font-size:11px">${(p.services || []).map((x) => `<span class="tag">${esc(x)}</span>`).join(" ")}</div>
      <div class="tile-f">
        ${p.sends_events ? '<span class="tag">sends events</span>' : ""}
        <div class="spacer"></div>
        ${p.up
          ? `<a class="btn sm" href="${esc(p.docs)}" target="_blank" rel="noopener">Repo</a> <a class="btn sm primary" href="${esc(p.url)}">Open demo</a>`
          : `<span class="mono muted" style="font-size:11px">${esc(p.start_hint)}</span>`}
      </div>
    </div>`).join("");

  const anyDown = state.products.some((p) => !p.up);

  return `
    <div class="topbar">
      <div>
        <div class="page-title">Products</div>
        <div class="page-sub">The family runs side by side. Each one can be started on its own.</div>
      </div>
    </div>
    <div class="tiles">${tiles}</div>
    ${anyDown
      ? hint("A product that is not running is started from the shell, not from here. "
             + "CYBA Delta deliberately holds no keys to the machine it runs on.")
      : ""}
    <div class="card" style="margin-top:18px">
      <div class="card-h"><b>Working together</b></div>
      <div class="card-b">
        <p class="muted" style="font-size:13px;line-height:1.7">
          A product that sends events can start a flow. Point it at the hook of a running
          flow that listens for incoming events, and everything after that is the flow's job.
        </p>
        <pre class="mono" style="background:#0F1211;border:1px solid var(--line);border-radius:9px;
             padding:12px;margin-top:10px;overflow-x:auto;font-size:12px">POST /api/hooks/&lt;flow-id&gt;
{ "alert": { "severity": "critical", "title": "Brute force" },
  "host": { "name": "srv-01" } }</pre>
        ${hint("The flow has to be running and its trigger has to listen for events. "
               + "A stopped flow answers politely and does nothing.")}
      </div>
    </div>`;
}
