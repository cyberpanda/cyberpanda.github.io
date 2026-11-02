CybaDemo({
  key: "cybaban-demo-v1", name: "CybaBan",
  repo: "https://github.com/cyberpanda/cyba-delta/tree/main/products/cybaban",
  preset() { if (!localStorage.getItem("cybaban_me")) localStorage.setItem("cybaban_me", "mia"); },
  seed() {
    const day = CybaDemo.day, P = ["mia", "jonas", "aylin", "ben"], K = ["early", "late", "night"];
    const rota = []; let id = 1;
    for (let d = 0; d < 14; d++) K.forEach((k, j) => { if (!(d === 3 && k === "night") && !(d === 9 && k === "late")) rota.push({ id: id++, day: day(d), shift: k, person: P[(d + j) % 4] }); });
    return {
      seq: id, hseq: 4, rota,
      handovers: [
        { id: 3, state: "handed_over", shift: "night", from_person: "jonas", to_person: "mia", stale: false, created_at: CybaDemo.iso(40).slice(0, 16).replace("T", " "), summary: "Quiet night, one ransomware case still hot.", note: "FS-ACME-07 is isolated pending approval. Call ACME on-call before 9.", attention: ["Isolation of FS-ACME-07 awaits approval"],
          carried: { cases: [{ ref: "CS-118", title: "Ransomware on FS-ACME-07", customer: "ACME", assigned_to: "mia" }], actions: [{ ref: "RA-1", what: "isolate_host FS-ACME-07", customer: "ACME", state: "requested" }], watch: [{ what: "VPN gateway Globex", why: "brute force may come back" }] }, soc_reachable: true, soc_note: "" },
        { id: 2, state: "acknowledged", shift: "late", from_person: "aylin", to_person: "jonas", stale: false, created_at: CybaDemo.iso(520).slice(0, 16).replace("T", " "), summary: "Phishing wave closed.", note: "", attention: [], carried: { cases: [], actions: [], watch: [] }, soc_reachable: true, soc_note: "" },
      ],
    };
  },
  routes: (S, HTTP) => {
    const shifts = [["early", "Early", "06:00", "14:00"], ["late", "Late", "14:00", "22:00"], ["night", "Night", "22:00", "06:00"], ["day", "Day", "08:00", "17:00"], ["standby", "Standby", "17:00", "08:00"]].map(([key, label, start, end]) => ({ key, label, start, end }));
    const gaps = () => { const out = []; for (let d = 0; d < 14; d++) { const day = CybaDemo.day(d); ["early", "late", "night"].forEach((k) => { if (!S.rota.some((e) => e.day === day && e.shift === k)) out.push({ day, label: k }); }); } return out; };
    const h = (id) => { const x = S.handovers.find((y) => String(y.id) === String(id)); if (!x) throw new HTTP(404, "no such handover"); return x; };
    return [
      ["GET", "/meta", () => ({ shifts })],
      ["GET", "/today", () => {
        const t = S.rota.filter((e) => e.day === CybaDemo.day(0));
        return { on_duty: t.slice(0, 1).map((e) => ({ person: e.person, shift: e.shift, until: CybaDemo.loc(3) })),
          next_up: t.slice(1, 2).map((e) => ({ person: e.person, shift: e.shift, starts: CybaDemo.loc(3) })),
          waiting_handovers: S.handovers.filter((x) => x.state === "handed_over").map(({ id, from_person, to_person, shift, summary, stale }) => ({ id, from_person, to_person, shift, summary, stale })),
          gaps: gaps().slice(0, 5), open_cases: 2, open_actions: 1, soc_reachable: true, soc_note: "" };
      }],
      ["GET", "/rota", () => ({ since: CybaDemo.day(0), until: CybaDemo.day(13), entries: S.rota, gaps: gaps() })],
      ["POST", "/rota", (p, b) => { if (!b.person) throw new HTTP(400, "Who?"); const e = { id: S.seq++, ...b }; S.rota.push(e); return e; }],
      ["DELETE", "/rota/{id}", (p) => { S.rota = S.rota.filter((e) => String(e.id) !== p.id); return { ok: true }; }],
      ["GET", "/handovers", () => S.handovers],
      ["POST", "/handovers/draft", (p, b) => { if (!b.person) throw new HTTP(400, "Set your name first"); const x = { id: S.hseq++, state: "draft", shift: "early", from_person: b.person, to_person: null, stale: false, created_at: new Date().toISOString().slice(0, 16).replace("T", " "), summary: "2 open cases, 1 action waiting.", note: b.note || "", attention: [], carried: { cases: [{ ref: "CS-118", title: "Ransomware on FS-ACME-07", customer: "ACME", assigned_to: "mia" }], actions: [], watch: b.watch || [] }, soc_reachable: true, soc_note: "" }; S.handovers.unshift(x); return x; }],
      ["POST", "/handovers/{id}/hand-over", (p, b) => { if (!b.to) throw new HTTP(400, "Hand over to whom?"); return Object.assign(h(p.id), { state: "handed_over", to_person: b.to }); }],
      ["POST", "/handovers/{id}/take-over", (p, b) => Object.assign(h(p.id), { state: "acknowledged", to_person: b.person || h(p.id).to_person })],
    ];
  },
});
