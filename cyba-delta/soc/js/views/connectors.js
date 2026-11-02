import { api } from "../api.js";
import { state } from "../store.js";
import { checked, closeModal, esc, modal, toast, val } from "../ui.js";

export function render() {
  const rows = state.connectors.map((c) => `
    <tr>
      <td><b>${esc(c.name)}</b> <span class="tag">${esc(c.kind)}</span>
        ${c.active ? "" : '<span class="tag" style="color:var(--warn)">inactive</span>'}</td>
      <td class="mono" style="font-size:12px">${esc(c.base_url)}
        <div class="muted">${esc((c.actions || []).join(", ") || "alle Aktionen")}</div></td>
      <td>
        <button class="btn sm" data-test="${c.id}">Health-Test</button>
        <button class="btn sm danger" data-del="${c.id}">Delete</button>
      </td>
    </tr>`).join("");
  return `
    <div class="topbar">
      <div><div class="page-title">Connectors</div>
      <div class="page-sub">Your own services: GET /healthz · POST /v1/execute · POST /v1/revert</div></div>
      <div class="spacer"></div>
      <button class="btn primary" id="newConn">+ Add a connector</button>
    </div>
    <div class="card"><div class="card-b" style="padding:0">
      <table>
        <thead><tr><th>Name and kind</th><th>Endpoint and actions</th><th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="3" class="muted" style="padding:16px">Keine Connectors – Response laufen simulated.</td></tr>'}</tbody>
      </table>
    </div></div>`;
}

export function bind(root, reload) {
  const nb = root.querySelector("#newConn");
  if (nb) {
    nb.addEventListener("click", () => {
      modal("Add a connector", `
        <div class="frow"><label>Name</label><input id="nName"></div>
        <div class="frow"><label>Kind</label><select id="nKind">
          <option>response</option><option>ingest</option><option>enrichment</option><option>ticket</option>
        </select></div>
        <div class="frow"><label>Base-URL</label><input id="nUrl" placeholder="http://mein-connector:8091"></div>
        <div class="frow"><label>API key, optional</label><input id="nKey" type="password"></div>
        <div class="frow"><label>Actions, comma separated, empty means all</label><input id="nActions" placeholder="block_ip, isolate_host"></div>
        <div class="frow"><label><input type="checkbox" id="nActive" checked style="width:auto"> Active</label></div>
        <button class="btn primary" id="nSave">Save</button>`);
      document.getElementById("nSave").addEventListener("click", async () => {
        if (!val("nUrl")) return toast("A base URL is needed");
        try {
          await api.post("/connectors", {
            name: val("nName") || "connector",
            kind: val("nKind"),
            base_url: val("nUrl"),
            api_key: val("nKey") || null,
            actions: val("nActions").split(",").map((x) => x.trim()).filter(Boolean),
            active: checked("nActive"),
          });
          closeModal();
          await reload();
        } catch (err) {
          toast(err.message);
        }
      });
    });
  }
  root.querySelectorAll("[data-test]").forEach((b) => {
    b.addEventListener("click", async () => {
      try {
        const r = await api.post(`/connectors/${b.dataset.test}/test`, {});
        toast(r.ok ? "Connector answers" : `No answer: ${JSON.stringify(r.detail).slice(0, 90)}`);
      } catch (err) {
        toast(err.message);
      }
    });
  });
  root.querySelectorAll("[data-del]").forEach((b) => {
    b.addEventListener("click", async () => {
      try {
        await api.del(`/connectors/${b.dataset.del}`);
        await reload();
      } catch (err) {
        toast(err.message);
      }
    });
  });
}
