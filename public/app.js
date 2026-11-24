const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function api(url, method = 'GET', body) {
  const res = await fetch(url, body === undefined ? { method } : {
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
  return data;
}

let users = [], projects = [], matches = {}, filter = null;
let me = Number(localStorage.getItem('me')) || null;

/* ---------- helpers ---------- */
const userName = id => users.find(u => u.id === id)?.name ?? 'Unknown';
const initials = n => n.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
const hue = n => [...n].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const avatar = (name, cls = '') => `<span class="av ${cls}" style="--h:${hue(name)}" aria-hidden="true">${esc(initials(name))}</span>`;
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

let toastTimer;
function toast(msg, isErr = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'show' + (isErr ? ' err' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = ''), 2600);
}

function tagInput(root) {
  const tags = [], input = $('input', root);
  const draw = () => {
    root.querySelectorAll('.chip').forEach(c => c.remove());
    tags.forEach((t, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip on';
      b.setAttribute('aria-label', `Remove ${t}`);
      b.innerHTML = `${esc(t)}<span aria-hidden="true">×</span>`;
      b.onclick = () => { tags.splice(i, 1); draw(); input.focus(); };
      root.insertBefore(b, input);
    });
  };
  const add = raw => {
    raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).forEach(s => { if (!tags.includes(s)) tags.push(s); });
    input.value = ''; draw();
  };
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input.value); }
    else if (e.key === 'Backspace' && !input.value && tags.length) { tags.pop(); draw(); }
  });
  input.addEventListener('blur', () => add(input.value));
  root.addEventListener('click', () => input.focus());
  return { get: () => { add(input.value); return [...tags]; }, clear: () => { tags.length = 0; draw(); } };
}
const userTags = tagInput($('#user-tags'));
const projectTags = tagInput($('#project-tags'));

/* ---------- data ---------- */
async function load() {
  [users, projects] = await Promise.all([api('/api/users'), api('/api/projects')]);
  const results = await Promise.all(projects.map(p => api(`/api/projects/${p.id}/matches`)));
  matches = Object.fromEntries(projects.map((p, i) => [p.id, results[i]]));
  if (!users.some(u => u.id === me)) me = null;
  render();
}

/* ---------- render ---------- */
function render() {
  renderMe();
  renderProjects();
  renderPeople();
}

function renderMe() {
  const sel = $('#me');
  sel.innerHTML = users.length
    ? `<option value="">Guest</option>` + users.map(u => `<option value="${u.id}">${esc(u.name)}</option>`).join('')
    : `<option value="">No profiles yet</option>`;
  sel.value = me ?? '';
}

function renderProjects() {
  const el = $('#projects');
  if (!projects.length) {
    el.innerHTML = `<div class="empty">No projects yet. Create one and the people who fit it will show up here.</div>`;
    return;
  }
  el.innerHTML = [...projects].reverse().map(projectCard).join('');
}

function projectCard(p) {
  const need = p.requiredSkills.length;
  const inTeam = p.team.includes(me), asked = p.requests.includes(me);
  const isOwner = me && me === p.ownerId;
  let action = '';
  if (inTeam) action = `<span class="badge ok">${isOwner ? 'You lead this' : 'You\'re on the team'}</span>`;
  else if (asked) action = `<span class="badge">Request sent</span>`;
  else if (me) action = `<button class="btn sm primary" data-join="${p.id}">Request to join</button>`;

  const list = matches[p.id] || [];
  const rows = list.map(u => {
    const status = p.team.includes(u.id) ? `<span class="badge ok">On team</span>` : p.requests.includes(u.id) ? `<span class="badge">Requested</span>` : '';
    return `<div class="row">
      ${avatar(u.name)}
      <div><div class="name">${esc(u.name)} ${status}</div>
        <div class="chips">${u.skills.map(s => `<span class="chip ${u.matchedSkills.includes(s) ? 'on' : ''}">${esc(s)}</span>`).join('')}</div></div>
      <div class="fit" title="${u.matchCount} of ${need} required skills">
        <div class="meter">${p.requiredSkills.map((_, i) => `<i class="${i < u.matchCount ? 'on' : ''}" style="--i:${i}"></i>`).join('')}</div>
        <small>${u.matchCount} of ${need}</small></div>
    </div>`;
  }).join('');

  const pending = p.requests.map(id => `<div class="req"><span>${esc(userName(id))}</span>${
    isOwner ? `<button class="btn sm ok" data-accept="${p.id}:${id}">Accept</button>` : `<span class="badge">Pending</span>`}</div>`).join('');

  return `<article class="project">
    <div class="p-head">
      <div><h3>${esc(p.title)}</h3><p class="sub">${p.ownerId ? `Led by ${esc(userName(p.ownerId))}` : 'No owner'}</p></div>
      ${action}
    </div>
    <div class="p-need"><div class="chips">${p.requiredSkills.map(s => `<span class="chip on">${esc(s)}</span>`).join('') || '<span class="sub">No skills listed</span>'}</div></div>
    <div class="p-body">
      <div class="group"><h4>Team (${p.team.length})</h4>
        ${p.team.length ? `<div class="av-stack">${p.team.map(id => avatar(userName(id), 'sm').replace('<span', `<span title="${esc(userName(id))}"`)).join('')}</div>` : `<div class="empty">Nobody on the team yet.</div>`}</div>
      ${pending ? `<div class="group"><h4>Join requests</h4>${pending}</div>` : ''}
      <div class="group"><h4>Best matches</h4>
        ${rows ? `<div class="rows">${rows}</div>` : `<div class="empty">No one has these skills yet.</div>`}</div>
    </div>
  </article>`;
}

function renderPeople() {
  const list = filter ? users.filter(u => u.skills.includes(filter)) : users;
  const clear = $('#clear-filter');
  clear.hidden = !filter;
  clear.textContent = filter ? `Showing ${filter} · Clear` : '';
  $('#people').innerHTML = list.length ? list.map(u => `
    <div class="person ${u.id === me ? 'me' : ''}">
      <div class="who">${avatar(u.name)}<span>${esc(u.name)}</span></div>
      <div class="chips">${u.skills.map(s => `<button class="chip ${s === filter ? 'on' : ''}" data-skill="${esc(s)}">${esc(s)}</button>`).join('') || '<span class="sub">No skills listed</span>'}</div>
    </div>`).join('')
    : `<div class="empty" style="grid-column:1/-1">${filter ? `No one lists ${esc(filter)} yet.` : 'No profiles yet. Add yours to get matched.'}</div>`;
}

/* ---------- events ---------- */
const run = async fn => { try { await fn(); } catch (e) { toast(e.message, true); } };

$('#me').addEventListener('change', e => {
  me = Number(e.target.value) || null;
  localStorage.setItem('me', me ?? '');
  render();
});

$('#user-form').addEventListener('submit', e => {
  e.preventDefault();
  run(async () => {
    const user = await api('/api/users', 'POST', { name: $('#user-name').value, skills: userTags.get() });
    me = user.id; localStorage.setItem('me', me);
    e.target.reset(); userTags.clear();
    await load(); toast('Profile saved');
  });
});

$('#project-form').addEventListener('submit', e => {
  e.preventDefault();
  run(async () => {
    await api('/api/projects', 'POST', { title: $('#project-title').value, ownerId: me, requiredSkills: projectTags.get() });
    e.target.reset(); projectTags.clear();
    await load(); toast('Project created');
  });
});

document.addEventListener('click', e => {
  const join = e.target.closest('[data-join]');
  const accept = e.target.closest('[data-accept]');
  const skill = e.target.closest('[data-skill]');
  if (join) run(async () => { await api(`/api/projects/${join.dataset.join}/requests`, 'POST', { userId: me }); await load(); toast('Request sent'); });
  if (accept) run(async () => {
    const [pid, uid] = accept.dataset.accept.split(':');
    await api(`/api/projects/${pid}/requests/${uid}/accept`, 'POST', {});
    await load(); toast('Added to the team');
  });
  if (skill) { filter = filter === skill.dataset.skill ? null : skill.dataset.skill; renderPeople(); }
});
$('#clear-filter').addEventListener('click', () => { filter = null; renderPeople(); });

run(load);
