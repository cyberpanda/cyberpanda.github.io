export function esc(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sevBadge(severity) {
  const s = String(severity || "info").toLowerCase();
  return `<span class="sev sev-${esc(s)}">${esc(s)}</span>`;
}

export function tags(list) {
  if (!list || !list.length) return '<span class="muted">—</span>';
  return list.map((t) => `<span class="tag">${esc(t)}</span>`).join("");
}

export function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("de-DE");
}

export function toast(message) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

export function modal(title, bodyHtml) {
  closeModal();
  const bg = document.createElement("div");
  bg.className = "modal-bg";
  bg.id = "modalBg";
  bg.innerHTML = `
    <div class="modal">
      <div class="modal-h">
        <div class="modal-t">${esc(title)}</div>
        <div class="spacer"></div>
        <button class="btn sm" data-close="1">Close</button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
    </div>`;
  bg.addEventListener("click", (e) => {
    if (e.target === bg || e.target.dataset.close) closeModal();
  });
  document.body.appendChild(bg);
}

export function closeModal() {
  const el = document.getElementById("modalBg");
  if (el) el.remove();
}

export function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

export function checked(id) {
  const el = document.getElementById(id);
  return el ? el.checked : false;
}
