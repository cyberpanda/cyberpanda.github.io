import { api } from "../api.js";
import { setState, state } from "../store.js";
import { closeModal, empty, esc, hint, modal, toast, val } from "../ui.js";

const SAMPLE = {
  wazuh: {
    id: "evt-1",
    rule: { description: "Brute force", level: 12, id: "5712" },
    agent: { name: "srv-01" },
    data: { srcip: "5.6.7.8", dstuser: "admin" },
  },
  splunk: {
    sid: "sp-1", search_name: "Suspicious login", urgency: "high",
    dest: "srv-02", user: "root", src_ip: "9.9.9.9",
  },
};

export function render() {
  if (!state.sources.length) {
    return `
      <div class="topbar">
        <div><div class="page-title">Sources</div>
        <div class="page-sub">Where events come from, and what they look like once Delta
          is done with them.</div></div>
        <div class="spacer"></div>
        <button class="btn" id="tryMapping">Try a mapping</button>
      </div>
      ${empty("No sources yet",
              "Bind a customer's SIEM under Customers, then issue a key for it here.",
              '<button class="btn primary" id="goCustomers">Go to Customers</button>')}`;
  }

  const rows = state.sources.map((s) => `
    <tr>
      <td><b>${esc(s.source_name)}</b>
        <div class="muted" style="font-size:11px">${esc(s.app)}
          ${s.custom_mapping ? '<span class="tag">own mapping</span>' : ""}</div></td>
      <td>${esc(s.customer)}</td>
      <td>${s.has_key
            ? '<span class="chip chip-run">key issued</span>'
            : '<span class="chip chip-pause">no key yet</span>'}</td>
      <td class="mono" style="font-size:11px">${esc(s.forwards_to || "nowhere yet")}</td>
      <td>
        <button class="btn sm" data-preview="${esc(s.app)}">Preview</button>
        <button class="btn sm" data-key="${esc(s.customer)}|${esc(s.channel)}">
          ${s.has_key ? "New key" : "Issue key"}</button>
      </td>
    </tr>`).join("");

  return `
    <div class="topbar">
      <div>
        <div class="page-title">Sources</div>
        <div class="page-sub">Every source has a key and a mapping. Try the mapping before
          you hand the key out.</div>
      </div>
      <div class="spacer"></div>
      <button class="btn" id="tryMapping">Try a mapping</button>
    </div>
    <div class="card"><div class="card-b" style="padding:0">
      <table>
        <thead><tr><th>Source</th><th>Customer</th><th>Key</th><th>Goes to</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div></div>
    ${hint("Delta keeps only a hash of a key. A new key makes the old one stop working at once.")}`;
}

function previewDialog(app) {
  const sample = SAMPLE[app] || SAMPLE.wazuh;
  modal(`What Delta makes of a ${app || "raw"} event`, `
    <div class="frow">
      <label>Paste something your SIEM really sends</label>
      <textarea id="pvRaw" rows="8" class="mono">${esc(JSON.stringify(sample, null, 2))}</textarea>
    </div>
    <button class="btn primary" id="pvGo">Show me</button>
    <div id="pvOut" style="margin-top:14px"></div>`, "min(660px, 94vw)");

  document.getElementById("pvGo").addEventListener("click", async () => {
    let event;
    try {
      event = JSON.parse(document.getElementById("pvRaw").value);
    } catch {
      return toast("That is not valid JSON yet.", "bad");
    }
    try {
      const out = await api.post("/mappings/preview", { event, app });
      const rows = Object.keys(out.unified).sort().map((k) => `
        <tr>
          <td class="mono">${esc(k)}</td>
          <td><b>${esc(out.unified[k])}</b></td>
          <td class="mono muted">${esc(out.provenance[k] || "set by Delta")}</td>
        </tr>`).join("");
      document.getElementById("pvOut").innerHTML = `
        <div class="card" style="margin:0">
          <div class="card-h">
            <span class="chip ${out.usable ? "chip-run" : "chip-fail"}">
              ${out.usable ? "ready to use" : "not usable yet"}</span>
            <span class="muted" style="font-size:12px">
              ${out.usable ? "This is what the SOAR would see."
                           : "The SOAR would get an alert with no title."}</span>
          </div>
          <div class="card-b" style="padding:0">
            <table>
              <thead><tr><th>Field</th><th>Value</th><th>Came from</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
        ${out.warnings.length
          ? `<div class="hint" style="color:var(--warm)">${out.warnings.map(esc).join("<br>")}</div>`
          : ""}
        ${out.untouched.length
          ? hint(`Nothing reads these yet: ${out.untouched.slice(0, 8).map(esc).join(", ")}`)
          : ""}`;
    } catch (err) {
      toast(err.message, "bad");
    }
  });
}

async function issueKey(customer, channel, reload) {
  try {
    const out = await api.post(`/bindings/${encodeURIComponent(customer)}/normalize/${channel}/key`, {});
    modal("The key for this source", `
      <p class="muted" style="font-size:13px;line-height:1.6">${esc(out.note)}</p>
      <pre class="mono" style="user-select:all;background:#0F1211;border:1px solid var(--line);
           border-radius:9px;padding:12px;margin-top:12px;overflow-x:auto">${esc(out.api_key)}</pre>
      ${hint("Delta keeps only a hash. If this is lost, issue a new one and the old stops working.")}`);
    await reload();
  } catch (err) {
    toast(err.message, "bad");
  }
}

export function bind(root, reload) {
  const go = root.querySelector("#goCustomers");
  if (go) go.addEventListener("click", () => setState({ view: "profiles" }));

  const tryIt = root.querySelector("#tryMapping");
  if (tryIt) tryIt.addEventListener("click", () => previewDialog("wazuh"));

  root.querySelectorAll("[data-preview]").forEach((b) =>
    b.addEventListener("click", () => previewDialog(b.dataset.preview)));

  root.querySelectorAll("[data-key]").forEach((b) =>
    b.addEventListener("click", () => {
      const [customer, channel] = b.dataset.key.split("|");
      issueKey(customer, channel, reload);
    }));
}
