import { api } from "../api.js";
import { state } from "../store.js";
import { closeModal, esc, modal, toast, val } from "../ui.js";

export function render() {
  const head = state.roles.map((r) => `
    <th style="text-align:center">${esc(r.name)}${r.builtin ? "" : ' <span class="tag">custom</span>'}
      <div class="muted" style="font-weight:400;font-size:10px">Rank ${r.rank}</div></th>`).join("");
  const body = state.permissions.map((p) => `
    <tr>
      <td><b class="mono" style="font-size:12px">${esc(p.key)}</b>
        <div class="muted" style="font-size:11px">${esc(p.label)}</div></td>
      ${state.roles.map((r) => {
        const all = (r.permissions || []).includes("*");
        const on = all || (r.permissions || []).includes(p.key);
        const lock = r.name === "admin";
        return `<td style="text-align:center">
          <input type="checkbox" style="width:auto" ${on ? "checked" : ""} ${lock ? "disabled" : ""}
            data-role="${esc(r.name)}" data-perm="${esc(p.key)}"></td>`;
      }).join("")}
    </tr>`).join("");

  return `
    <div class="topbar">
      <div><div class="page-title">Roles and permissions</div>
      <div class="page-sub">Assign here or through a Keycloak role of the same name, prefix cybasoa_ is fine</div></div>
      <div class="spacer"></div>
      <button class="btn" id="newRole">+ New role</button>
      <button class="btn primary" id="saveRoles">Save</button>
    </div>
    <div class="card"><div class="card-b" style="padding:0;overflow-x:auto">
      <table>
        <thead><tr><th style="min-width:230px">Permission</th>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div></div>
    <div class="muted" style="font-size:12px">Freigaben unterliegen zusaetzlich dem Vier-Augen-Prinzip. admin keeps full access.</div>`;
}

export function bind(root, reload) {
  root.querySelectorAll("[data-perm]").forEach((cb) => {
    cb.addEventListener("change", () => {
      const role = state.roles.find((r) => r.name === cb.dataset.role);
      if (!role) return;
      const perms = new Set(role.permissions || []);
      if (cb.checked) perms.add(cb.dataset.perm);
      else perms.delete(cb.dataset.perm);
      role.permissions = [...perms];
    });
  });
  const nb = root.querySelector("#newRole");
  if (nb) {
    nb.addEventListener("click", () => {
      modal("New role anlegen", `
        <div class="frow"><label>Name, lower case, a-z 0-9 _ -</label><input id="rName" placeholder="t1-analyst"></div>
        <div class="frow"><label>Rank (0 = viewer … 3 = admin)</label><select id="rRank">
          <option>0</option><option selected>1</option><option>2</option><option>3</option></select></div>
        <div class="frow"><label>Description</label><input id="rDesc"></div>
        <button class="btn primary" id="rSave">Create</button>`);
      document.getElementById("rSave").addEventListener("click", async () => {
        try {
          await api.post("/roles", {
            name: val("rName").toLowerCase(),
            rank: parseInt(val("rRank"), 10),
            permissions: ["alerts.read"],
            description: val("rDesc"),
          });
          closeModal();
          await reload();
        } catch (err) {
          toast(err.message);
        }
      });
    });
  }
  const sb = root.querySelector("#saveRoles");
  if (sb) {
    sb.addEventListener("click", async () => {
      try {
        for (const r of state.roles) {
          if (r.name === "admin") continue;
          await api.patch(`/roles/${encodeURIComponent(r.name)}`, {
            name: r.name, rank: r.rank,
            permissions: r.permissions || [], description: r.description || "",
          });
        }
        toast("Permissione-Matrix gespeichert (greift in <= 30 s)");
        await reload();
      } catch (err) {
        toast(err.message);
      }
    });
  }
}
