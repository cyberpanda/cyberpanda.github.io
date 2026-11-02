CybaDemo({
  key: "cybasoa-demo-v1", name: "CybaSoa",
  repo: "https://github.com/cyberpanda/cyba-delta/tree/main/products/cybasoa",
  preset() { if (!sessionStorage.getItem("cybasoa_token")) sessionStorage.setItem("cybasoa_token", "demo"); },
  seed() {
    const iso = CybaDemo.iso, T = ["t-acme", "t-globex", "t-initech"];
    const A = [
      ["critical", "Ransomware behaviour: mass file renames", "FS-ACME-07", "10.10.4.21", "wazuh", ["ransomware", "edr"]],
      ["high", "Brute force against VPN gateway", "vpn-gw-01", "185.220.101.44", "splunk", ["bruteforce"]],
      ["high", "Suspicious PowerShell download cradle", "WS-GLX-112", "10.2.0.15", "sysmon", ["powershell", "t1059"]],
      ["medium", "Impossible travel sign-in", "entra-id", "45.83.64.9", "sentinel", ["identity"]],
      ["medium", "Outbound connection to known C2 domain", "WS-INI-044", "10.30.1.44", "suricata", ["c2"]],
      ["low", "New local admin account created", "SRV-ACME-DC2", "10.10.0.5", "wazuh", ["persistence"]],
      ["low", "Port scan from internal host", "WS-GLX-090", "10.2.0.90", "zeek", ["recon"]],
      ["info", "Antivirus signatures updated", "fleet", "-", "elastic", []],
      ["high", "Mailbox forwarding rule to external address", "exchange", "-", "sentinel", ["bec"]],
      ["critical", "LSASS memory access by unknown binary", "SRV-INI-APP1", "10.30.0.12", "wazuh", ["credential-access"]],
    ];
    return {
      seq: 11,
      alerts: A.map((a, i) => ({ seq: i + 1, ref: `AL-${2400 + i}`, severity: a[0], title: a[1], host: a[2], src_ip: a[3], source: a[4], tags: a[5], status: i > 7 ? "read" : "new", occurrences: 1 + (i * 7) % 13, assignee: i % 3 ? null : "mia", created_at: iso(i * 37 + 4), tenant_id: T[i % 3] })),
      cases: [
        { ref: "CS-118", title: "Ransomware on FS-ACME-07", severity: "critical", status: "open", assigned_to: "mia", created_at: iso(30), tenant_id: "t-acme" },
        { ref: "CS-117", title: "VPN brute force – Globex", severity: "high", status: "in_progress", assigned_to: "jonas", created_at: iso(300), tenant_id: "t-globex" },
        { ref: "CS-112", title: "Phishing wave, 14 mailboxes", severity: "medium", status: "closed", assigned_to: "aylin", created_at: iso(3000), tenant_id: "t-initech" },
      ],
      actions: [
        { id: 1, ticket_number: "CS-118", action_type: "isolate_host", target: "FS-ACME-07", status: "requested", provider: "defender", requested_by: "mia", approved_by: null, executed_at: null },
        { id: 2, ticket_number: "CS-117", action_type: "block_ip", target: "185.220.101.44", status: "executed", provider: "fortigate", requested_by: "jonas", approved_by: "aylin", executed_at: iso(240) },
        { id: 3, ticket_number: "CS-112", action_type: "disable_user", target: "j.doe@initech.example", status: "reverted", provider: "entra", requested_by: "aylin", approved_by: "mia", executed_at: iso(2900) },
      ],
      customers: [
        { tenant_id: "t-acme", name: "ACME Manufacturing", number: "K-1001", email: "it@acme.example", aliases: ["ACME", "acme-prod"], locations: ["HQ North", "Plant West"], tags: ["24/7", "OT"], active: true },
        { tenant_id: "t-globex", name: "Globex Logistics", number: "K-1002", email: "sec@globex.example", aliases: ["GLX"], locations: ["Hamburg"], tags: ["business hours"], active: true },
        { tenant_id: "t-initech", name: "Initech Software", number: "K-1003", email: "soc@initech.example", aliases: [], locations: ["Berlin", "Remote"], tags: ["cloud"], active: true },
      ],
      sources: [
        { name: "acme-wazuh", type: "wazuh", tenant_id: "t-acme", sensor_id: "wz-01", location: "HQ North", enabled: true },
        { name: "acme-suricata", type: "suricata", tenant_id: "t-acme", sensor_id: "ids-plant", location: "Plant West", enabled: true },
        { name: "globex-splunk", type: "splunk", tenant_id: "t-globex", sensor_id: "sp-hh", location: "Hamburg", enabled: true },
        { name: "initech-sentinel", type: "sentinel", tenant_id: "t-initech", sensor_id: null, location: "Berlin", enabled: false },
      ],
      connectors: [
        { id: 1, name: "fortigate-block", kind: "response", base_url: "http://connector-fortigate:8091", actions: ["block_ip"], active: true },
        { id: 2, name: "zammad", kind: "ticket", base_url: "https://tickets.example/api", actions: [], active: true },
      ],
      roles: [
        { name: "admin", rank: 100, builtin: true, description: "Everything", permissions: ["*"] },
        { name: "lead", rank: 50, builtin: true, description: "Shift lead", permissions: ["alerts.read", "alerts.write", "cases.write", "response.approve"] },
        { name: "analyst", rank: 10, builtin: true, description: "Analyst", permissions: ["alerts.read", "alerts.write", "cases.write", "response.request"] },
      ],
      permissions: [["alerts.read", "See alerts"], ["alerts.write", "Triage alerts"], ["cases.write", "Open and edit cases"], ["response.request", "Request response actions"], ["response.approve", "Approve response actions"], ["customers.write", "Manage customers and sources"]].map(([key, label]) => ({ key, label })),
    };
  },
  routes: (S, HTTP) => {
    const find = (l, k, v) => { const x = S[l].find((y) => String(y[k]) === String(v)); if (!x) throw new HTTP(404, "not found"); return x; };
    return [
      ["POST", "/auth/login", (p, b) => { if (!b.username) throw new HTTP(400, "Any name works in the demo"); return { access_token: "demo" }; }],
      ["GET", "/auth/me", () => ({ username: "demo-analyst", role: "admin" })],
      ["GET", "/alerts", () => S.alerts],
      ["POST", "/alerts/{seq}/read", (p) => { find("alerts", "seq", p.seq).status = "read"; return { ok: true }; }],
      ["POST", "/alerts/{seq}/status", (p, b, q) => { find("alerts", "seq", p.seq).status = q.status; return { ok: true }; }],
      ["GET", "/cases", () => S.cases],
      ["POST", "/cases", (p, b) => { const c = { ref: `CS-${119 + S.cases.length}`, title: b.title, severity: b.severity, status: "open", assigned_to: "demo-analyst", created_at: new Date().toISOString(), tenant_id: b.tenant_id }; S.cases.unshift(c); return c; }],
      ["GET", "/response", () => S.actions],
      ["POST", "/response/{id}/approve", (p) => { const a = find("actions", "id", p.id); Object.assign(a, { status: "executed", approved_by: "demo-analyst", executed_at: new Date().toISOString() }); return a; }],
      ["POST", "/response/{id}/revert", (p) => { const a = find("actions", "id", p.id); a.status = "reverted"; return a; }],
      ["GET", "/customers", () => S.customers],
      ["POST", "/customers", (p, b) => { const i = S.customers.findIndex((c) => c.tenant_id === b.tenant_id); const c = { active: true, ...b }; if (i >= 0) S.customers[i] = { ...S.customers[i], ...c }; else S.customers.push(c); return c; }],
      ["GET", "/sources", () => S.sources],
      ["POST", "/sources", (p, b) => { const s = { enabled: true, ...b }; S.sources.push(s); return { ...s, api_key: "demo_" + Math.random().toString(36).slice(2, 14) }; }],
      ["PATCH", "/sources/{name}", (p, b) => Object.assign(find("sources", "name", p.name), b)],
      ["GET", "/connectors", () => S.connectors],
      ["POST", "/connectors", (p, b) => { const c = { id: Math.max(0, ...S.connectors.map((x) => x.id)) + 1, ...b }; S.connectors.push(c); return c; }],
      ["DELETE", "/connectors/{id}", (p) => { S.connectors = S.connectors.filter((c) => String(c.id) !== p.id); return { ok: true }; }],
      ["POST", "/connectors/{id}/test", (p) => { const c = find("connectors", "id", p.id); return { ok: true, message: `${c.name}: /healthz answered 200 (simulated)` }; }],
      ["GET", "/roles", () => ({ roles: S.roles, permissions: S.permissions })],
      ["POST", "/roles", (p, b) => { const r = { builtin: false, ...b }; S.roles.push(r); return r; }],
      ["PATCH", "/roles/{name}", (p, b) => Object.assign(find("roles", "name", p.name), b)],
    ];
  },
});
