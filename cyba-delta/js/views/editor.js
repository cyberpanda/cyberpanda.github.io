import { api } from "../api.js";
import { notify, setState, state } from "../store.js";
import { esc, hint, stateChip, toast } from "../ui.js";

const KIND = {
  trigger: { label: "When", cls: "node-trigger" },
  condition: { label: "Only if", cls: "node-condition" },
  action: { label: "Then", cls: "node-action" },
  delay: { label: "Wait", cls: "node-delay" },
  end: { label: "Done", cls: "node-end" },
};

function subtitle(node) {
  if (node.type === "trigger") return `on ${node.trigger}`;
  if (node.type === "action") return node.app ? `${node.app} · ${node.action}` : `${node.channel || "channel"} · ${node.verb || ""}`;
  if (node.type === "condition") return `${(node.conditions || []).length} rule(s)`;
  if (node.type === "delay") return `${node.seconds || 0}s`;
  return "";
}

function nodeTitle(node) {
  if (node.type === "action") return String(node.action || node.verb || "action").replace(/_/g, " ");
  if (node.type === "trigger") return "Something happens";
  if (node.type === "condition") return "Check first";
  if (node.type === "end") return "Finish";
  return node.type;
}

function edgesSvg(flow) {
  const byId = {};
  (flow.nodes || []).forEach((n) => { byId[n.id] = n.position || { x: 0, y: 0 }; });
  const lines = (flow.edges || []).map((e) => {
    const a = byId[e.source];
    const b = byId[e.target];
    if (!a || !b) return "";
    const x1 = a.x + 168;
    const y1 = a.y + 30;
    const x2 = b.x;
    const y2 = b.y + 30;
    const mid = (x1 + x2) / 2;
    const colour = e.branch === "false" ? "#5C6B67" : "#35CABE";
    const label = e.branch ? `<text x="${mid}" y="${(y1 + y2) / 2 - 6}" fill="${colour}" font-size="10">${esc(e.branch)}</text>` : "";
    return `<path d="M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}"
              stroke="${colour}" stroke-width="1.6" fill="none" opacity="0.8"/>${label}`;
  }).join("");
  return `<svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none">${lines}</svg>`;
}

export function render() {
  const flow = state.editing;
  if (!flow) return `<div class="page-title">No flow open</div>`;
  const nodes = (flow.nodes || []).map((n) => {
    const kind = KIND[n.type] || { label: n.type, cls: "" };
    const pos = n.position || { x: 40, y: 40 };
    const sel = state.selectedNode === n.id ? " sel" : "";
    return `
      <div class="node ${kind.cls}${sel}" style="left:${pos.x}px;top:${pos.y}px"
           data-node="${esc(n.id)}">
        <div class="node-k">${esc(kind.label)}</div>
        <div class="node-t">${esc(nodeTitle(n))}</div>
        <div class="node-s">${esc(subtitle(n))}</div>
      </div>`;
  }).join("");

  const running = flow.state === "running";
  const problems = flow.errors && flow.errors.length
    ? `<div class="card"><div class="card-b" style="color:#FF8A8A;font-size:13px">
         ${flow.errors.map((e) => esc(e)).join("<br>")}
       </div></div>`
    : "";

  return `
    <div class="topbar">
      <div>
        <div class="page-title">${esc(flow.name)} ${stateChip(flow.state)}</div>
        <div class="page-sub">Read it left to right. Click a step to see its settings.</div>
      </div>
      <div class="spacer"></div>
      <button class="btn" id="back">Back</button>
      ${running
        ? '<button class="btn warm" id="stop">Stop</button>'
        : '<button class="btn primary" id="start">Start</button>'}
    </div>
    ${problems}
    ${running ? hint("Running flows are read-only. Stop it first to make changes.") : ""}
    <div class="canvas" id="canvas" style="height:${canvasHeight(flow)}px">
      ${edgesSvg(flow)}
      ${nodes}
    </div>
    <div id="inspector" style="margin-top:14px">${inspector(flow)}</div>`;
}

function canvasHeight(flow) {
  const maxY = Math.max(200, ...(flow.nodes || []).map((n) => (n.position || {}).y || 0));
  return maxY + 160;
}

function inspector(flow) {
  const node = (flow.nodes || []).find((n) => n.id === state.selectedNode);
  if (!node) {
    return `<div class="card"><div class="card-b muted" style="font-size:13px">
      Pick a step above to see what it does.</div></div>`;
  }
  const args = node.arguments || {};
  const rows = Object.keys(args).map((k) => `
    <tr><td class="mono">${esc(k)}</td><td class="mono muted">${esc(args[k])}</td></tr>`).join("");
  const conds = (node.conditions || []).map((c) => `
    <tr><td class="mono">${esc(c.field)}</td><td>${esc(c.op)}</td>
        <td class="mono muted">${esc(Array.isArray(c.value) ? c.value.join(", ") : c.value)}</td></tr>`).join("");
  return `
    <div class="card">
      <div class="card-h"><b>${esc(nodeTitle(node))}</b>
        <span class="tag">${esc(node.type)}</span>
        <div class="spacer"></div>
        <span class="mono muted" style="font-size:11px">${esc(node.id)}</span>
      </div>
      <div class="card-b">
        ${node.type === "action" ? `<div class="muted" style="font-size:12px;margin-bottom:10px">
          ${node.app ? `Uses app <b>${esc(node.app)}</b>, action <b>${esc(node.action)}</b>.` : `Uses the customer’s <b>${esc(node.channel)}</b> channel, verb <b>${esc(node.verb)}</b> – the profile decides which tool.`}</div>` : ""}
        ${rows ? `<table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table>` : ""}
        ${conds ? `<table><thead><tr><th>Field</th><th>Test</th><th>Value</th></tr></thead><tbody>${conds}</tbody></table>` : ""}
        ${!rows && !conds ? '<span class="muted" style="font-size:13px">Nothing to set here.</span>' : ""}
        ${rows ? hint("Anything in double braces is filled in from the event when the flow runs.") : ""}
      </div>
    </div>`;
}

export function bind(root, reload) {
  const back = root.querySelector("#back");
  if (back) back.addEventListener("click", () => setState({ view: "flows", editing: null }));

  root.querySelectorAll("[data-node]").forEach((el) =>
    el.addEventListener("click", () => setState({ selectedNode: el.dataset.node })));

  const start = root.querySelector("#start");
  if (start) {
    start.addEventListener("click", async () => {
      try {
        await api.post(`/workflows/${state.editing.id}/start`);
        const flow = await api.get(`/workflows/${state.editing.id}`);
        setState({ editing: flow });
        await reload();
        toast("Flow is running.");
      } catch (err) { toast(err.message, "bad"); }
    });
  }
  const stop = root.querySelector("#stop");
  if (stop) {
    stop.addEventListener("click", async () => {
      try {
        await api.post(`/workflows/${state.editing.id}/stop`);
        const flow = await api.get(`/workflows/${state.editing.id}`);
        setState({ editing: flow });
        await reload();
        toast("Flow stopped.");
      } catch (err) { toast(err.message, "bad"); }
    });
  }
}
