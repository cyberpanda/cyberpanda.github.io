CybaDemo({
  key: "cybamado-demo-v1", name: "CybaMado",
  repo: "https://github.com/cyberpanda/cyba-delta/tree/main/products/cybamado",
  preset() { if (!localStorage.getItem("cybamado_key")) localStorage.setItem("cybamado_key", "demo-acme"); },
  seed() {
    const ago = CybaDemo.ago;
    return {
      alerts: [["Ransomware behaviour on a file server", "critical", "investigating", 35], ["Many failed VPN sign-ins", "high", "closed", 400], ["New admin account on a domain controller", "low", "closed", 1500], ["Unusual sign-in from abroad", "medium", "closed", 3100]].map(([title, severity, status, m], i) => ({ ref: `AL-${2400 + i}`, title, severity, status, created_at: ago(m) })),
      cases: [{ ref: "CS-118", title: "Ransomware on FS-ACME-07", severity: "critical", status: "open", created_at: ago(30) }, { ref: "CS-101", title: "Phishing mails to accounting", severity: "medium", status: "closed", created_at: ago(9000) }],
      waiting: [{ ref: "RA-1", action: "Isolate a computer from the network", target: "FS-ACME-07 (file server, HQ North)", impact: "Shares on this server are unreachable until we release it.", why: "It is encrypting files right now. Isolating it stops the spread.", waiting_minutes: 25, nudge: true },
                { ref: "RA-2", action: "Block an internet address", target: "185.220.101.44", impact: "None for your staff.", why: "It tried 3,000 VPN passwords tonight.", waiting_minutes: 4, nudge: false }],
      answered: [{ ref: "RA-0", state: "granted", action: "Reset a password", target: "j.doe", answered_by: "Anna (IT lead)", answer: "yes" }],
    };
  },
  routes: (S, HTTP) => [
    ["GET", "/me", () => ({ customer: "ACME Manufacturing" })],
    ["GET", "/overview", () => ({ in_plain_words: S.waiting.length ? "We are handling a ransomware attempt on one file server. We need your yes to isolate it." : "All quiet. We are watching your systems.", waiting_for_you: S.waiting.length, numbers: { alerts: 42, days: 30, critical: 2, cases: 5, cases_closed: 4 }, open_cases: 1, soc_reachable: true, soc_note: "" })],
    ["GET", "/alerts", () => S.alerts],
    ["GET", "/cases", () => S.cases],
    ["GET", "/consent", () => ({ waiting: S.waiting, answered: S.answered })],
    ["POST", "/consent/{ref}/answer", (p, b) => { const i = S.waiting.findIndex((w) => w.ref === p.ref); if (i < 0) throw new HTTP(404, "already answered"); const [w] = S.waiting.splice(i, 1); const r = { ref: w.ref, state: b.answer === "yes" ? "granted" : "refused", action: w.action, target: w.target, answered_by: b.person || "you", answer: b.answer }; S.answered.unshift(r); return r; }],
  ],
});
