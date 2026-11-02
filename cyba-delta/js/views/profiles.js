import { api } from "../api.js";
import { notify, setState, state } from "../store.js";
import { closeModal, empty, esc, hint, modal, toast, val } from "../ui.js";

const SIDE_LABEL = {
  normalize: "What comes in",
  respond: "What goes out",
};

function appsFor(side, channel) {
  const group = (state.channels[side] || []).find((c) => c.key === channel);
  return (group && group.apps) || [];
}

function channelRows(profile, side) {
  const groups = state.channels[side] || [];
  return groups.map((group) => {
    const bound = (profile[side] || {})[group.key] || {};
    const choices = appsFor(side, group.key);
    return `
      <tr>
        <td><b>${esc(group.label)}</b>
          <div class="muted" style="font-size:11px">${esc(group.verbs.join(", "))}</div></td>
        <td>
          ${bound.app
            ? `<span class="chip chip-run">${esc(bound.app)}</span>
               ${bound.shared ? '<span class="tag">shared</span>' : ""}`
            : (choices.length
                ? '<span class="muted">not bound</span>'
                : '<span class="muted">no app for this yet</span>')}
        </td>
        <td>
          ${choices.length
            ? `<button class="btn sm" data-bind="${esc(side)}|${esc(group.key)}">
                 ${bound.app && !bound.shared ? "Change" : "Bind"}</button>`
            : ""}
          ${bound.app && !bound.shared
            ? `<button class="btn sm danger" data-unbind="${esc(side)}|${esc(group.key)}">Clear</button>`
            : ""}
        </td>
      </tr>`;
  }).join("");
}

export function render() {
  if (!state.profileCustomer) {
    const rows = state.profiles.map((p) => `
      <tr>
        <td><b>${esc(p.customer)}</b></td>
        <td>${p.normalize.bound}/${p.normalize.total} in</td>
        <td>${p.respond.bound}/${p.respond.total} out</td>
        <td class="muted">${esc(p.respond.missing.join(", ") || "everything is bound")}</td>
        <td><button class="btn sm" data-open="${esc(p.customer)}">Open</button></td>
      </tr>`).join("");
    return `
      <div class="topbar">
        <div>
          <div class="page-title">Customer profiles</div>
          <div class="page-sub">Each customer keeps their own tools. A flow says what to do;
            the profile says where it lands.</div>
        </div>
        <div class="spacer"></div>
        <button class="btn primary" id="newProfile">Add a customer</button>
      </div>
      ${state.profiles.length
        ? `<div class="card"><div class="card-b" style="padding:0"><table>
             <thead><tr><th>Customer</th><th>In</th><th>Out</th><th>Still open</th><th></th></tr></thead>
             <tbody>${rows}</tbody></table></div></div>`
        : empty("No profiles yet",
                "Add a customer and bind their ticket system, their chat, their mail.",
                '<button class="btn primary" id="newProfile2">Add a customer</button>')}
      ${hint("A binding on * covers every customer that has nothing of their own.")}`;
  }

  const profile = state.profile || { normalize: {}, respond: {} };
  return `
    <div class="topbar">
      <div>
        <div class="page-title">${esc(state.profileCustomer)}</div>
        <div class="page-sub">Both sides of this customer, in one place.</div>
      </div>
      <div class="spacer"></div>
      <button class="btn" id="backProfiles">All customers</button>
    </div>
    ${["normalize", "respond"].map((side) => `
      <div class="card">
        <div class="card-h"><b>${SIDE_LABEL[side]}</b>
          <span class="muted" style="font-size:12px">
            ${side === "normalize" ? "SIEMs and connectors that send events here"
                                   : "where the SOAR reaches out"}</span></div>
        <div class="card-b" style="padding:0"><table>
          <thead><tr><th>Channel</th><th>Bound to</th><th></th></tr></thead>
          <tbody>${channelRows(profile, side)}</tbody>
        </table></div>
      </div>`).join("")}
    ${hint("Change the tool here and every flow follows, without touching the flow.")}`;
}

function bindDialog(side, channel, reload) {
  const choices = appsFor(side, channel);
  const group = (state.channels[side] || []).find((c) => c.key === channel) || {};
  const current = ((state.profile || {})[side] || {})[channel] || {};
  const options = choices.map((a) =>
    `<option value="${esc(a.name)}" ${current.app === a.name ? "selected" : ""}>
       ${esc(a.title)} (${esc(a.verbs.join(", "))})</option>`).join("");

  modal(`${esc(group.label || channel)} for ${esc(state.profileCustomer)}`, `
    <div class="frow"><label>Tool</label><select id="bApp">${options}</select></div>
    <div class="frow"><label>Base URL</label>
      <input id="bUrl" value="${esc(current.config && current.config.base_url || "")}"
             placeholder="https://desk.customer.example"></div>
    <div class="frow"><label>Credentials</label>
      <textarea id="bCreds" rows="3" class="mono"
        placeholder='{ "token": "..." }'>${esc(current.config && current.config.credentials
          ? JSON.stringify(current.config.credentials) : "")}</textarea></div>
    <div class="frow"><label>Defaults for this customer</label>
      <textarea id="bDefaults" rows="3" class="mono"
        placeholder='{ "group": "SOC" }'>${esc(current.config && current.config.defaults
          ? JSON.stringify(current.config.defaults) : "")}</textarea></div>
    <button class="btn primary" id="bSave">Save</button>
    ${hint("Defaults fill in what a flow does not say, so the same flow fits every customer.")}`);

  document.getElementById("bSave").addEventListener("click", async () => {
    const parse = (id) => {
      const raw = val(id);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        toast("That is not valid JSON yet.", "bad");
        return undefined;
      }
    };
    const credentials = parse("bCreds");
    const defaults = parse("bDefaults");
    if (credentials === undefined || defaults === undefined) return;
    const config = {};
    if (val("bUrl")) config.base_url = val("bUrl");
    if (credentials) config.credentials = credentials;
    if (defaults) config.defaults = defaults;
    try {
      await api.post("/bindings", {
        customer: state.profileCustomer, side, channel, app: val("bApp"), config,
      });
      closeModal();
      await reload();
      await openProfile(state.profileCustomer);
    } catch (err) {
      toast(err.message, "bad");
    }
  });
}

async function openProfile(customer) {
  const profile = await api.get(`/profiles/${encodeURIComponent(customer)}`);
  setState({ profileCustomer: customer, profile });
}

export function bind(root, reload) {
  ["newProfile", "newProfile2"].forEach((id) => {
    const btn = root.querySelector(`#${id}`);
    if (!btn) return;
    btn.addEventListener("click", () => {
      modal("Add a customer", `
        <div class="frow"><label>Customer id</label>
          <input id="pName" placeholder="t-acme"></div>
        <button class="btn primary" id="pGo">Open the profile</button>
        ${hint("Use * to set something up for every customer at once.")}`);
      document.getElementById("pGo").addEventListener("click", () => {
        if (!val("pName")) return toast("Give it an id", "bad");
        closeModal();
        openProfile(val("pName"));
      });
    });
  });

  root.querySelectorAll("[data-open]").forEach((b) =>
    b.addEventListener("click", () => openProfile(b.dataset.open)));

  const back = root.querySelector("#backProfiles");
  if (back) back.addEventListener("click", () => setState({ profileCustomer: "", profile: null }));

  root.querySelectorAll("[data-bind]").forEach((b) =>
    b.addEventListener("click", () => {
      const [side, channel] = b.dataset.bind.split("|");
      bindDialog(side, channel, reload);
    }));

  root.querySelectorAll("[data-unbind]").forEach((b) =>
    b.addEventListener("click", async () => {
      const [side, channel] = b.dataset.unbind.split("|");
      try {
        await api.del(`/bindings/${encodeURIComponent(state.profileCustomer)}/${side}/${channel}`);
        await reload();
        await openProfile(state.profileCustomer);
      } catch (err) {
        toast(err.message, "bad");
      }
    }));
}
