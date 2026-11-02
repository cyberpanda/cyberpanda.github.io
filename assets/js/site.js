(() => {
"use strict";
const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" }) : null;
document.querySelectorAll(".reveal").forEach((el) => io ? io.observe(el) : el.classList.add("in"));

/* ---------- interactive terminal ---------- */
const out = document.getElementById("out"), form = document.getElementById("tform"), cmd = document.getElementById("cmd"), sugg = document.getElementById("sugg");
if (!out) return;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const print = (html, cls = "") => { const p = document.createElement("p"); p.className = "ln " + cls; p.innerHTML = html; out.appendChild(p); out.scrollTop = out.scrollHeight; return p; };
const go = (url, label) => { print(`<span class="d">→ opening ${esc(label || url)} …</span>`); setTimeout(() => { location.href = url; }, reduce ? 0 : 450); };
const APPS = {
  kotoba: { url: "kotoba.html", d: "Learn Japanese – lessons, games, RPG" },
  delta: { url: "cyba-delta/", d: "CYBA Delta – SOC automation (live demo)" },
  cve: { url: "cve.html", d: "CVE Table – live vulnerability search" },
  glass: { url: "liquid-glass.html", d: "Liquid Glass – WebGL playground" },
};
const FILES = { "about.txt": "Hobby projects I build with AI in my free time.\nShared for fun – open source, contributions welcome.", "skills.txt": "security · SOC automation · threat intel · web · UI/UX · WebGL", "contact.txt": 'GitHub  <a href="https://github.com/cyberpanda">github.com/cyberpanda</a>\n𝕏       <a href="https://x.com/realcyberpanda">@realcyberpanda</a>', "contribute.md": "Open an issue or a pull request on GitHub –\nideas, fixes and translations are all welcome. 🤝", "todo.md": "- [x] Kotoba 2.0\n- [x] CYBA Delta demo\n- [ ] the next app 👀" };
let hist = [], hi = 0, matrixOn = false;
const fake = async (lines, ms = 380) => { for (const l of lines) { print(l, /^\[\+\]/.test(l) ? "p" : /^\[!\]/.test(l) ? "r" : "y"); await new Promise((r) => setTimeout(r, reduce ? 0 : ms)); } };
const C = {
  help: () => print(`<span class="y">commands</span>
  <span class="p">ls</span>              list apps &amp; files
  <span class="p">open</span> &lt;app&gt;      kotoba · delta · cve · glass
  <span class="p">cve</span> &lt;query&gt;     search CVEs, e.g. <span class="b">cve CVE-2024-3094</span>
  <span class="p">cat</span> &lt;file&gt;      about.txt · contribute.md · contact.txt · todo.md
  <span class="p">whoami</span> · <span class="p">socials</span> · <span class="p">date</span> · <span class="p">echo</span> · <span class="p">clear</span>
  <span class="p">myip</span>            show your own public IP
  <span class="y">“hacking”</span> (all fake, nothing leaves this page)
  <span class="p">hack</span> [target] · <span class="p">nmap</span> · <span class="p">ssh</span> · <span class="p">sqlmap</span> · <span class="p">hydra</span> · <span class="p">msfconsole</span>
  <span class="p">ddos</span> · <span class="p">decrypt</span> · <span class="p">ping</span> · <span class="p">traceroute</span> · <span class="p">whois</span> · <span class="p">exploit</span>
  <span class="d">and a few secrets… try sudo, rm -rf, matrix, panda, fortune, coffee</span>`),
  ls: () => print(Object.entries(APPS).map(([k, a]) => `<span class="b">${k}/</span>  <span class="d">${esc(a.d)}</span>`).join("\n") + "\n" + Object.keys(FILES).join("  ")),
  whoami: () => print("panda 🐼 – hobbyist, building things with AI for fun"),
  open: (a) => { const k = (a[0] || "").toLowerCase().replace(/\/$/, ""); const al = { "cyba-delta": "delta", cybadelta: "delta", "liquid-glass": "glass", liquid: "glass", "cve-table": "cve" }; const app = APPS[al[k] || k]; app ? go(app.url, al[k] || k) : print(`open: no such app '${esc(k)}' – try <span class="p">ls</span>`, "r"); },
  cve: (a) => go("cve.html" + (a.length ? "#q=" + encodeURIComponent(a.join(" ")) + (/^CVE-/i.test(a[0]) ? "&w=all" : "") : ""), a.length ? "CVE search: " + a.join(" ") : "CVE Table"),
  cat: (a) => { const f = FILES[a[0]]; f ? print(f) : print(`cat: ${esc(a[0] || "")}: No such file`, "r"); },
  socials: () => print(FILES["contact.txt"]),
  date: () => print(new Date().toString()),
  echo: (a) => print(esc(a.join(" "))),
  clear: () => { out.innerHTML = ""; },
  sudo: () => print("[sudo] password for panda: ********\n<span class=\"r\">panda is not in the sudoers file. This incident will be reported. 🐼🚨</span>"),
  rm: (a) => print(a.join(" ").includes("-rf") ? '<span class="r">nice try. 🙃 permission denied: this site is read-only.</span>' : "rm: missing operand", "r"),
  hack: (a) => {
    const t = a.join(" ") || "127.0.0.1", T = t.toLowerCase();
    const end = /nasa/.test(T) ? "[+] ACCESS GRANTED. Downloading moon landing raw footage… 99%… cat walked over keyboard. Aborted. 🐈"
      : /mainframe|gibson/.test(T) ? "[+] hacked the Gibson. It was running on a potato. 🥔"
      : /fbi|cia|nsa/.test(T) ? "[!] they already know. they always knew. say hi 👋 (relax, nothing was sent)"
      : /google|apple|microsoft|meta/.test(T) ? "[!] their bug bounty form is that way →  please be nice. 🐼"
      : "[+] ACCESS GRANTED 🐼";
    return fake(["[*] target: " + esc(t), "[*] spinning up 1337 proxies in 3 countries … and a toaster", "[*] bypassing firewall with sheer confidence", "[*] brute-forcing bamboo stash …", "[*] enhancing… ENHANCE!", end, '<span class="d">just kidding – nothing left this page. everything here is open source anyway: </span><a href="https://github.com/cyberpanda">github.com/cyberpanda</a>']);
  },
  nmap: (a) => fake([`Starting Nmap 7.95 ( totally-real ) against ${esc(a.at(-1) || "localhost")}`, "PORT      STATE  SERVICE", "22/tcp    open   ssh-but-only-for-pandas", "80/tcp    open   http (redirects to bamboo)", "443/tcp   open   https", "1337/tcp  open   elite", "8080/tcp  filtered snacks", "Nmap done: 1 IP address (1 host up, 0 hosts actually scanned) 🐼"], 160),
  ssh: (a) => fake([`ssh: connecting to ${esc(a[0] || "root@localhost")} …`, "The authenticity of host can't be established. Fingerprint is 🐾🐾🐾.", "Are you sure you want to continue connecting (yes/no/bamboo)? bamboo", "Welcome to PandaOS 13.37 LTS", "Last login: never. You are the first. Congrats.", '<span class="r">Connection closed by panda (nap time).</span>']),
  sqlmap: () => fake(["[*] testing parameter 'id' …", "[*] payload: ' OR 1=1 --", "[!] this is a static site. there is no database. there never was.", "[+] dumped table `snacks`: bamboo, bamboo, more bamboo"]),
  hydra: () => fake(["[DATA] attacking panda://login", "[ATTEMPT] password: password", "[ATTEMPT] password: 123456", "[ATTEMPT] password: hunter2", "[ATTEMPT] password: correct horse battery staple", '<span class="r">[ERROR] account locked. use a password manager + MFA, kids. 🔐</span>'], 260),
  ddos: () => fake(["[*] sending 1 (one) packet …", "[*] packet arrived. server is fine. server says hi.", '<span class="r">[!] DDoS is illegal and boring. go build something instead. 🛠️</span>']),
  msfconsole: () => fake(["       =[ metasploit v6.panda ]", "+ -- --=[ 2 exploits – 1 is a nap, 1 is a snack ]", "msf6 > use exploit/bamboo/infinite_snacks", "msf6 > run", "[*] Exploit completed, but no session was created. Panda is asleep. 💤"]),
  decrypt: (a) => fake(["[*] analysing ciphertext: " + esc(a.join(" ") || "U2FsdGVkX1+🐼"), "[*] trying ROT13 … ROT26 … ROT🐼 …", "[*] quantum computer warming up … ⚛️ (it is a microwave)", '[+] plaintext: "drink water and patch your systems"']),
  ping: (a) => fake([1, 2, 3, 4].map((i) => `64 bytes from ${esc(a[0] || "bamboo.local")}: icmp_seq=${i} ttl=64 time=${(Math.random() * 20 + 1).toFixed(1)} ms 🏓`).concat(["--- 4 packets, 0 lost, 1 panda entertained ---"]), 300),
  traceroute: () => fake([" 1  your-router (192.168.0.1)  1 ms", " 2  isp-thing (10.0.0.1)  8 ms", " 3  undersea-cable 🐙  42 ms", " 4  github-pages.cdn  12 ms", " 5  cyberpanda.github.io 🐼  0.1 ms"], 250),
  whois: (a) => print(`${esc(a[0] || "panda")}:\n  Registrant: a panda with a keyboard\n  Status:     clientSnackProhibited\n  Contact:    <a href="https://x.com/realcyberpanda">@realcyberpanda</a>`),
  exploit: () => print('<span class="y">0-day found:</span> humans click links in emails. patch: training + MFA. 🧠'),
  phish: () => print('<span class="r">🎣 no phishing here. report suspicious mails to your SOC instead.</span>'),
  firewall: () => print("🔥🧱  firewall status: on fire (metaphorically). all rules: ALLOW bamboo, DENY bugs."),
  ransomware: () => print('<span class="r">your files have been encrypted with… a hug. 🤗 pay 0 BTC. keep offline backups!</span>'),
  coffee: () => print("☕ brewing… error 418: I'm a teapot."),
  fortune: () => print(["There is no cloud. It's just someone else's computer.", "The S in IoT stands for security.", "It's always DNS.", "Have you tried turning it off and on again?", "Security is a process, not a product.", "Patch Tuesday waits for no panda."][Math.floor(Math.random() * 6)]),
  myip: async () => {
    print('<span class="d">asking api.ipify.org for your public IP (only you see this) …</span>');
    try { const r = await fetch("https://api.ipify.org?format=json", { cache: "no-store" }); const j = await r.json(); print(`your public IP: <span class="p">${esc(j.ip)}</span>  – this is what every website sees. 🕵️ nothing was stored.`); }
    catch { print("couldn’t reach the IP service (blocker? offline?) – which is honestly good opsec. 🛡️", "r"); }
  },
  matrix: () => { matrixOn = !matrixOn; matrix(matrixOn); print(matrixOn ? "wake up, panda… 🐇" : "back to the real world."); },
  panda: () => print("   ⠀(\\_/)  \n  ( •ᴥ•)  bamboo?\n  / >🎋"),
  exit: () => print("there is no exit. only more apps. 🐼"),
};
const AL = { "?": "help", dir: "ls", projects: "ls", apps: "ls", contact: "socials", cls: "clear", man: "help", kotoba: "open kotoba", delta: "open delta", glass: "open glass", "cd": "open", ip: "myip", "ifconfig": "myip", metasploit: "msfconsole", hackertyper: "hack" };
let queue = Promise.resolve();
function run(line) {
  const raw = line.trim(); if (!raw) return;
  hist.push(raw); hi = hist.length;
  queue = queue.then(async () => {
    print(`<span class="p">panda@gh:~$</span> ${esc(raw)}`);
    let [c, ...a] = raw.split(/\s+/); c = c.toLowerCase();
    if (AL[c]) { const [c2, ...a2] = AL[c].split(" "); c = c2; a = a2.concat(a); }
    if (C[c]) await C[c](a); else print(`${esc(c)}: command not found – type <span class="p">help</span>`, "r");
  }).catch(() => {});
  return queue;
}
form.addEventListener("submit", (e) => { e.preventDefault(); run(cmd.value); cmd.value = ""; });
cmd.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") { if (hi > 0) cmd.value = hist[--hi]; e.preventDefault(); }
  else if (e.key === "ArrowDown") { hi = Math.min(hist.length, hi + 1); cmd.value = hist[hi] || ""; e.preventDefault(); }
  else if (e.key === "Tab") { const v = cmd.value.trim().toLowerCase(), parts = v.split(/\s+/); const pool = parts.length > 1 ? (parts[0] === "cat" ? Object.keys(FILES) : Object.keys(APPS)) : Object.keys(C); const m = pool.filter((x) => x.startsWith(parts.at(-1))); if (m.length === 1) { parts[parts.length - 1] = m[0]; cmd.value = parts.join(" ") + " "; } else if (m.length) print(m.join("  "), "d"); e.preventDefault(); }
  else if (e.key === "l" && e.ctrlKey) { C.clear(); e.preventDefault(); }
});
out.addEventListener("click", () => { if (!getSelection().toString()) cmd.focus({ preventScroll: true }); });
["help", "ls", "open kotoba", "open delta", "hack nasa", "nmap", "myip"].forEach((s) => { const b = document.createElement("button"); b.type = "button"; b.textContent = s; b.onclick = () => { run(s); cmd.focus({ preventScroll: true }); }; sugg.appendChild(b); });

(async () => {
  const intro = ["whoami", "ls"];
  for (const c of intro) {
    if (reduce) { await run(c); continue; }
    const p = print('<span class="p">panda@gh:~$</span> '); for (const ch of c) { p.innerHTML += esc(ch); await new Promise((r) => setTimeout(r, 70)); }
    p.remove(); await run(c); await new Promise((r) => setTimeout(r, 350));
  }
  print('<span class="d">type <span class="p">help</span> – or tap a command below</span>');
  hist = []; hi = 0;
})();

/* ---------- matrix easter egg ---------- */
let raf = 0;
function matrix(on) {
  const cv = document.getElementById("matrix"); if (!cv) return; cv.classList.toggle("on", on); cancelAnimationFrame(raf); if (!on || reduce) return;
  const x = cv.getContext("2d"), fs = 16; let cols, drops;
  const size = () => { cv.width = innerWidth; cv.height = innerHeight; cols = Math.ceil(cv.width / fs); drops = Array(cols).fill(0).map(() => Math.random() * -50); };
  size(); addEventListener("resize", size);
  let t = 0; const chars = "01🐼アイウエオカキクケコ言葉";
  const draw = (now) => { raf = requestAnimationFrame(draw); if (now - t < 50) return; t = now;
    x.fillStyle = "rgba(0,0,0,.08)"; x.fillRect(0, 0, cv.width, cv.height); x.fillStyle = "#38e0a0"; x.font = fs + "px monospace";
    drops.forEach((d, i) => { x.fillText(chars[Math.floor(Math.random() * chars.length)], i * fs, d * fs); drops[i] = d * fs > cv.height && Math.random() > 0.975 ? 0 : d + 1; }); };
  raf = requestAnimationFrame(draw);
}
})();
