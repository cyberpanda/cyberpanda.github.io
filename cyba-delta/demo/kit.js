(() => {
  class HTTP extends Error { constructor(s, d) { super(d); this.status = s; this.detail = d; } }
  window.CybaDemo = function ({ key, seed, routes, repo, name, preset }) {
    let S; try { S = JSON.parse(localStorage.getItem(key)) || seed(); } catch { S = seed(); }
    const save = () => { try { localStorage.setItem(key, JSON.stringify(S)); } catch {} };
    if (preset) preset();
    const R = routes(S, HTTP).map(([m, p, f]) => [m, new RegExp("^/api" + p.replace(/\{(\w+)\}/g, "(?<$1>[^/]+)") + "$"), f]);
    const real = window.fetch.bind(window);
    const J = (o, s) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });
    window.fetch = async (input, init = {}) => {
      const url = new URL(typeof input === "string" ? input : input.url, location.href);
      if (!url.pathname.startsWith("/api")) return real(input, init);
      const method = (init.method || "GET").toUpperCase(), q = Object.fromEntries(url.searchParams);
      let body; try { body = init.body ? JSON.parse(init.body) : undefined; } catch {}
      await new Promise((r) => setTimeout(r, 50 + Math.random() * 80));
      for (const [m, rx, f] of R) {
        if (m !== method) continue; const mm = url.pathname.match(rx); if (!mm) continue;
        try { const out = f(mm.groups ? Object.fromEntries(Object.entries(mm.groups).map(([k, v]) => [k, decodeURIComponent(v)])) : {}, body || {}, q); if (method !== "GET") save(); return J(out, 200); }
        catch (e) { return J({ detail: e.detail || String(e) }, e.status || 500); }
      }
      return J({ detail: "Not Found" }, 404);
    };
    const bar = () => {
      if (document.getElementById("demoBar") || !document.body) return;
      const d = document.createElement("div"); d.id = "demoBar";
      d.innerHTML = `<b>${name} demo</b><span>Dummy data, saved only in your browser.</span><a href="../">⌂ Delta</a><button type="button">Reset</button><a href="${repo}" target="_blank" rel="noopener">Repo</a>`;
      document.body.appendChild(d); d.querySelector("button").onclick = () => { try { localStorage.removeItem(key); } catch {} location.reload(); };
    };
    new MutationObserver(bar).observe(document.documentElement, { childList: true, subtree: true });
    addEventListener("DOMContentLoaded", bar);
  };
  const T = Date.now() / 1000;
  window.CybaDemo.ago = (min) => T - min * 60;
  window.CybaDemo.iso = (min) => new Date((T - min * 60) * 1000).toISOString();
  window.CybaDemo.day = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
  window.CybaDemo.loc = (h) => { const d = new Date(Date.now() + h * 36e5); return d.toISOString().slice(0, 11) + String(d.getHours()).padStart(2, "0") + ":00"; };
})();
