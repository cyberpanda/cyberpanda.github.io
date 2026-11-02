import { esc } from "./ui.js";

export const FALLBACK_LOGO = "assets/logos/cyba-delta.png";
const REVEAL = "this.style.display='none';"
  + "if(this.nextElementSibling)this.nextElementSibling.style.display='';";

export function logoOf(space) {
  return (space && space.logo) || FALLBACK_LOGO;
}

export function styleOf(space) {
  const style = space && space.logo_style;
  return style === "lockup" ? "lockup" : "mark";
}

function wordmark(space, hidden) {
  const words = (space && space.wordmark) || ["CYBA", "Delta"];
  const style = hidden ? ' style="display:none"' : "";
  return `<div class="brand-text"${style}>${esc(words[0])} <span>${esc(words[1])}</span></div>`;
}

export function brandMark(space, options) {
  const opts = options || {};
  const lockup = styleOf(space) === "lockup";
  const cls = lockup ? "brand-logo lockup" : "brand-logo mark";
  const height = opts.height || (lockup ? 26 : 30);
  const title = (space && space.title) || "";
  return `
    <img class="${cls}" src="${esc(logoOf(space))}" alt="${esc(title)}"
         style="height:${height}px" onerror="${REVEAL}">
    ${wordmark(space, lockup)}`;
}

export function switcher(spaces, currentName) {
  const others = spaces.filter((s) => s.name !== currentName && s.kind !== "engine");
  if (!others.length) return "";
  const items = others.map((s) => `
    <button class="switch-item" data-go="${esc(s.name)}" ${s.up ? "" : "disabled"}>
      <span class="switch-logo">
        <img class="brand-logo ${esc(styleOf(s))}" src="${esc(logoOf(s))}" alt=""
             style="height:18px" onerror="${REVEAL}">
        <span class="switch-t" style="display:none">${esc(s.title)}</span>
      </span>
      <span class="switch-s">${esc(s.up ? s.role : s.start_hint)}</span>
    </button>`).join("");
  return `<div class="switch-menu" id="switchMenu" hidden>${items}</div>`;
}
