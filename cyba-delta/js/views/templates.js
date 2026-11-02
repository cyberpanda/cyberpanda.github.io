import { api } from "../api.js";
import { setState, state } from "../store.js";
import { closeModal, esc, modal, toast, val } from "../ui.js";

export function render() {
  const tiles = state.templates.map((t) => `
    <div class="tile">
      <div class="tile-t">${esc(t.title)}</div>
      <div class="tile-s">${esc(t.summary)}</div>
      <div class="tile-f">
        <span class="tag">${esc(t.category)}</span>
        <div class="spacer"></div>
        <button class="btn sm primary" data-use="${esc(t.key)}">Use this</button>
      </div>
    </div>`).join("");
  return `
    <div class="topbar">
      <div>
        <div class="page-title">Templates</div>
        <div class="page-sub">The everyday jobs, already wired. Pick one, fill in two fields, done.</div>
      </div>
    </div>
    <div class="tiles">${tiles}</div>`;
}

export function bind(root, reload) {
  root.querySelectorAll("[data-use]").forEach((b) =>
    b.addEventListener("click", () => open(b.dataset.use, reload)));
}

function open(key, reload) {
  const template = state.templates.find((t) => t.key === key);
  if (!template) return;
  const fields = template.variables.map((v) => {
    if (v.type === "app") {
      const options = state.apps
        .filter((a) => !v.side || a.side === v.side)
        .map((a) => `<option value="${esc(a.name)}" ${a.name === v.default ? "selected" : ""}>${esc(a.title)}</option>`)
        .join("");
      return `<div class="frow"><label>${esc(v.label)}</label>
        <select id="v_${esc(v.name)}">${options}</select></div>`;
    }
    return `<div class="frow"><label>${esc(v.label)}</label>
      <input id="v_${esc(v.name)}" value="${esc(v.default || "")}"></div>`;
  }).join("");

  modal(template.title, `
    <p class="muted" style="font-size:13px;line-height:1.6">${esc(template.summary)}</p>
    <div style="margin-top:14px">${fields}</div>
    <button class="btn primary" id="mk">Create flow</button>
    <div class="hint">It starts out stopped, so you can look before it runs.</div>`);

  document.getElementById("mk").addEventListener("click", async () => {
    const values = {};
    template.variables.forEach((v) => { values[v.name] = val(`v_${v.name}`); });
    try {
      const flow = await api.post(`/templates/${key}/use`, { values });
      closeModal();
      await reload();
      setState({ editing: flow, selectedNode: null, view: "editor" });
      toast("Flow created. Take a look, then start it.");
    } catch (err) {
      toast(err.message, "bad");
    }
  });
}
