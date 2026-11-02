import { api } from "../api.js";
import { setState, state } from "../store.js";
import { closeModal, empty, esc, modal, stateChip, toast, val } from "../ui.js";

export function render() {
  if (!state.workflows.length) {
    return `
      <div class="topbar">
        <div>
          <div class="page-title">Flows</div>
          <div class="page-sub">A flow listens for something, checks it, and does the rest for you.</div>
        </div>
      </div>
      ${empty("Nothing here yet",
              "Start from a template. It is already wired up and only asks for the parts that are yours.",
              '<button class="btn primary" id="goTemplates">Browse templates</button>')}`;
  }
  const rows = state.workflows.map((w) => `
    <tr>
      <td><b>${esc(w.name)}</b>${w.template ? `<div class="muted" style="font-size:11px">from template: ${esc(w.template)}</div>` : ""}</td>
      <td>${stateChip(w.state)}</td>
      <td>${w.valid ? '<span class="muted">ready</span>' : '<span class="chip chip-fail">needs a fix</span>'}</td>
      <td class="muted">${w.nodes} steps</td>
      <td>
        ${w.state === "running"
          ? `<button class="btn sm warm" data-stop="${esc(w.id)}">Stop</button>`
          : `<button class="btn sm primary" data-start="${esc(w.id)}" ${w.valid ? "" : "disabled"}>Start</button>`}
        <button class="btn sm" data-open="${esc(w.id)}">Open</button>
        <button class="btn sm" data-test="${esc(w.id)}">Test run</button>
        <button class="btn sm danger" data-del="${esc(w.id)}">Delete</button>
      </td>
    </tr>`).join("");

  return `
    <div class="topbar">
      <div>
        <div class="page-title">Flows</div>
        <div class="page-sub">Start and stop whenever you like. A stopped flow keeps its settings.</div>
      </div>
      <div class="spacer"></div>
      <button class="btn" id="goTemplates">From template</button>
    </div>
    <div class="card"><div class="card-b" style="padding:0">
      <table>
        <thead><tr><th>Name</th><th>State</th><th>Check</th><th>Size</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div></div>`;
}

export function bind(root, reload) {
  const go = root.querySelector("#goTemplates");
  if (go) go.addEventListener("click", () => setState({ view: "templates" }));

  root.querySelectorAll("[data-start]").forEach((b) =>
    b.addEventListener("click", async () => {
      try {
        await api.post(`/workflows/${b.dataset.start}/start`);
        toast("Flow is running.");
        await reload();
      } catch (err) { toast(err.message, "bad"); }
    }));

  root.querySelectorAll("[data-stop]").forEach((b) =>
    b.addEventListener("click", async () => {
      try {
        await api.post(`/workflows/${b.dataset.stop}/stop`);
        toast("Flow stopped.");
        await reload();
      } catch (err) { toast(err.message, "bad"); }
    }));

  root.querySelectorAll("[data-open]").forEach((b) =>
    b.addEventListener("click", async () => {
      const flow = await api.get(`/workflows/${b.dataset.open}`);
      setState({ editing: flow, selectedNode: null, view: "editor" });
    }));

  root.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", async () => {
      try {
        await api.del(`/workflows/${b.dataset.del}`);
        await reload();
      } catch (err) { toast(err.message, "bad"); }
    }));

  root.querySelectorAll("[data-test]").forEach((b) =>
    b.addEventListener("click", () => testRun(b.dataset.test)));
}

function testRun(id) {
  modal("Test run", `
    <p class="muted" style="font-size:13px;line-height:1.6">
      Nothing leaves the house. The flow runs with the event below and shows you each step.
    </p>
    <div class="frow" style="margin-top:12px">
      <label>Example event</label>
      <textarea id="ev" rows="7" class="mono">{
  "alert": { "severity": "critical", "title": "Brute force" },
  "host": { "name": "srv-01" }
}</textarea>
    </div>
    <button class="btn primary" id="runIt">Run it</button>
    <div id="out" style="margin-top:14px"></div>`, "min(640px, 94vw)");

  document.getElementById("runIt").addEventListener("click", async () => {
    let event;
    try {
      event = JSON.parse(document.getElementById("ev").value);
    } catch {
      return toast("That is not valid JSON yet.", "bad");
    }
    try {
      const run = await api.post(`/workflows/${id}/run`, { dry_run: true, event });
      document.getElementById("out").innerHTML = `
        <div class="steps">
          ${run.steps.map((s) => `
            <div class="step">
              <span class="chip ${s.status === "ok" ? "chip-run" : "chip-fail"}">${esc(s.status)}</span>
              <span class="mono">${esc(s.node)}</span>
              <span class="muted">${esc(s.type)}</span>
              ${s.result && s.result.detail ? `<span class="muted">${esc(s.result.detail)}</span>` : ""}
              ${s.type === "condition" ? `<span class="muted">${s.result ? "yes" : "no"}</span>` : ""}
            </div>`).join("")}
        </div>
        ${run.errors.length ? `<div class="hint" style="color:#FF8A8A">${esc(run.errors.join(" · "))}</div>` : ""}`;
    } catch (err) {
      toast(err.message, "bad");
    }
  });
}
