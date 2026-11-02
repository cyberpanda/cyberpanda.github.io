export function esc(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function fmtTime(seconds) {
  if (!seconds) return "—";
  const d = new Date(seconds * 1000);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export function stateChip(value) {
  const map = { running: "chip-run", stopped: "chip-stop", paused: "chip-pause" };
  return `<span class="chip ${map[value] || "chip-stop"}">${esc(value || "stopped")}</span>`;
}

export function statusChip(value) {
  const map = { completed: "chip-run", failed: "chip-fail", invalid: "chip-fail",
                aborted: "chip-pause" };
  return `<span class="chip ${map[value] || "chip-stop"}">${esc(value)}</span>`;
}

export function toast(message, kind) {
  const el = document.createElement("div");
  el.className = "toast" + (kind === "bad" ? " toast-bad" : "");
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3600);
}

export function modal(title, bodyHtml, width) {
  closeModal();
  const bg = document.createElement("div");
  bg.className = "modal-bg";
  bg.id = "modalBg";
  bg.innerHTML = `
    <div class="modal" style="width:${width || "min(560px, 92vw)"}">
      <div class="modal-h">
        <div class="modal-t">${esc(title)}</div>
        <div class="spacer"></div>
        <button class="btn sm" data-close="1">Close</button>
      </div>
      <div>${bodyHtml}</div>
    </div>`;
  bg.addEventListener("click", (e) => {
    if (e.target === bg || e.target.dataset.close) closeModal();
  });
  document.body.appendChild(bg);
  return bg;
}

export function closeModal() {
  const el = document.getElementById("modalBg");
  if (el) el.remove();
}

export function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

export function hint(text) {
  return `<div class="hint">${esc(text)}</div>`;
}

export function empty(title, text, actionHtml) {
  return `
    <div class="empty">
      <div class="empty-t">${esc(title)}</div>
      <div class="empty-s">${esc(text)}</div>
      ${actionHtml || ""}
    </div>`;
}
