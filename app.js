'use strict';
/* =========================================================
   Mon cadre — v4
   Stockage : localStorage 'monCadre_v4' (migration auto depuis 'monCadre_v3').
   ========================================================= */

const STORE = 'monCadre_v4';
const OLD_STORE = 'monCadre_v3';
const IDB_NAME = 'mon-cadre-kv', IDB_STORE = 'kv';
const DEFAULT_SETTINGS = {
  startDate: '2026-07-07', weightStart: 86, weightGoal: 80,
  waterGoal: 2250, glass: 750, rest: 90, theme: 'auto', stepsGoal: 8000,
  eveningReminder: false,
  modules: { pas: true, eau: true, souffle: true, tests: true }
};
const blank = () => ({
  version: 4, settings: { ...DEFAULT_SETTINGS },
  weights: [], water: {}, sessions: [], exoLast: {}, tests: {},
  breath: [], goalsDone: {}, notes: '', draft: null, steps: {},
  habits: [], habitLog: {}
});
let state = blank();

/* ---------- Outils ---------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const pad2 = n => String(n).padStart(2, '0');
const keyOf = d => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
const today = () => keyOf(new Date());
const dateOf = k => new Date(k + 'T12:00:00');
const addDays = (k, n) => { const d = dateOf(k); d.setDate(d.getDate() + n); return keyOf(d); };
const fmtShort = k => dateOf(k).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const fmtLong = k => dateOf(k).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const num = Charts.fmtNum;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const stars = n => n ? '<span class="stars" aria-label="' + n + ' sur 5">' + '★'.repeat(n) + '</span>' : '';
const ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';

/* ---------- Stockage + migration ---------- */
// Retrouve la définition d'un exercice par son nom, toutes phases confondues.
function exoDef(name) {
  for (const ph of Object.values(PROGRAMS)) for (const d of Object.values(ph)) {
    const e = d.exos.find(x => x.n === name); if (e) return e;
  }
  return null;
}
function migrateV3(o) {
  const s = blank();
  s.weights = (o.weights || []).filter(w => w && w.date && +w.value).map(w => ({ date: w.date, value: +w.value }));
  s.tests = o.tests || {};
  s.notes = o.userNotes || '';
  s.goalsDone = o.goalsChecked || {};
  s.breath = (o.breathLogs || []).map(b => ({ date: b.date, tech: b.techId, sec: b.durationSec || 0 }));
  s.sessions = (o.sessionLogs || []).map(l => {
    if (l.isFreeLog) return { id: uid(), date: l.date, free: true, type: l.type, note: l.alt || '', feel: l.feel || 0 };
    const exos = {};
    Object.entries(l.perfs || {}).forEach(([n, v]) => {
      if (!Array.isArray(v)) return;
      const def = exoDef(n);
      exos[n] = { sets: v.map(x => ({ kg: +x.poids || 0, reps: +x.reps || 0 })), feel: (l.feels || {})[n] || 0, unit: def ? unitOf(def) : 'rép.', weighted: def ? isWeighted(def) : false };
    });
    return { id: uid(), date: l.date, type: l.type, label: l.label, kind: kindOf(l.type), feel: l.feel || 0, note: l.alt || '', exos };
  });
  Object.entries(o.exoStruct || {}).forEach(([n, arr]) => {
    s.exoLast[n] = { sets: arr.map(x => ({ kg: +x.poids || 0, reps: +x.reps || 0 })), allOk: false };
  });
  return s;
}
function normalize(o) {
  if (!o || typeof o !== 'object') return blank();
  if (o.version !== 4) return migrateV3(o);
  const s = { ...blank(), ...o };
  s.settings = { ...DEFAULT_SETTINGS, ...(o.settings || {}) };
  s.settings.modules = Object.fromEntries(Object.keys(DEFAULT_SETTINGS.modules).map(m => [m, o.settings?.modules?.[m] ?? true]));
  return s;
}
function load() {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) { state = normalize(JSON.parse(raw)); return; }
    const old = localStorage.getItem(OLD_STORE);
    if (old) { state = migrateV3(JSON.parse(old)); save(); setTimeout(() => toast('Tes anciennes données ont été reprises.'), 600); }
  } catch (e) { console.warn('Lecture impossible', e); }
}
function save() {
  try { localStorage.setItem(STORE, JSON.stringify(state)); }
  catch (e) { toast("Enregistrement impossible : le stockage du téléphone est plein ou bloqué."); }
  syncReminderState();
}
// Demande au navigateur de ne pas effacer les données (utile sur iPhone).
if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});

// Copie minimale de l'état du jour dans IndexedDB : le service worker n'a pas accès à localStorage,
// c'est le seul moyen pour lui de savoir, en tâche de fond, si la journée est déjà remplie.
function idbPut(key, val) {
  try {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => {
      const db = req.result, tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(val, key);
      tx.oncomplete = () => db.close();
    };
  } catch (e) {}
}
function syncReminderState() {
  idbPut('status', { date: today(), complete: dayComplete(today()), remind: !!state.settings.eveningReminder });
}
// Une journée compte comme faite quand les objectifs activés (séance, eau, pas) sont atteints.
function dayComplete(k) {
  const prog = programFor(dateOf(k).getDay(), phaseInfo(k).num);
  const ses = sessionsOn(k).length > 0 || kindOf(prog.type) === 'repos';
  const M = state.settings.modules;
  const eau = !M.eau || (state.water[k] || 0) >= state.settings.waterGoal;
  const pas = !M.pas || (state.steps[k] || 0) >= state.settings.stepsGoal;
  const log = state.habitLog[k] || {};
  const habits = state.habits.every(h => log[h.id]);
  return ses && eau && pas && habits;
}
// Jours consécutifs avec objectifs atteints, jusqu'à hier si la journée en cours n'est pas finie.
function habitStreak() {
  let k = today();
  if (!dayComplete(k)) k = addDays(k, -1);
  let n = 0;
  while (k >= state.settings.startDate && dayComplete(k)) { n++; k = addDays(k, -1); }
  return n;
}

/* ---------- Toast & confirmation ---------- */
let toastTimer;
function toast(msg, action) {
  const t = $('#toast');
  t.replaceChildren(document.createTextNode(msg));
  if (action) {
    const b = document.createElement('button');
    b.textContent = action.label;
    b.onclick = () => { action.run(); t.classList.remove('on'); };
    t.appendChild(b);
  }
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), action ? 5000 : 2600);
}
function confirmDlg(title, text, yes) {
  const d = $('#dlgConfirm');
  $('#cfTitle').textContent = title;
  $('#cfText').textContent = text;
  $('#cfYes').textContent = yes;
  d.returnValue = '';
  d.showModal();
  return new Promise(res => d.addEventListener('close', () => res(d.returnValue === 'yes'), { once: true }));
}

/* ---------- Programme & phases ---------- */
function kindOf(type = '') {
  const t = type.toLowerCase();
  if (t.includes('repos')) return 'repos';
  if (t.includes('course')) return 'course';
  return 'force';
}
function phaseInfo(k = today()) {
  const week = Math.floor((dateOf(k) - dateOf(state.settings.startDate)) / (7 * 864e5)) + 1;
  const base = [
    { num: 1, name: 'Reconditionnement', desc: 'Semaines 1 à 8 : bases, marche, mobilité, gainage doux.' },
    { num: 2, name: 'Construction', desc: 'Semaines 9 à 16 : course progressive, charges qui montent.' },
    { num: 3, name: 'Consolidation', desc: 'Semaines 17 à 24 : objectifs cibles, performance.' }
  ];
  const p = week <= 8 ? base[0] : week <= 16 ? base[1] : base[2];
  return { ...p, week: Math.max(1, week), over: week > 24, before: week < 1 };
}
const programFor = (dayIdx, phase = phaseInfo().num) => PROGRAMS[phase][dayIdx];

/* ---------- Classement des exercices (repris de la v3) ---------- */
const isNoInput = e => /échauff|étirement|etirement|repos|retour calme|retour au calme|souplesse|activité libre/i.test(e.n);
const isTime = e => /planche|gainage|équilibre|hollow|superman/i.test(e.n) || /\d+\s*[×x]\s*\d+\s*s\b/.test(e.s);
const isWeighted = e => /rh0|rh1|rc0|hip thrust|leg curl|abducteur|squat barre|tirage|lombaires|abdos/i.test(e.n) && !/assist/i.test(e.n);
const isAssisted = e => /assist/i.test(e.n);
// Unité de mesure d'un exercice : secondes, minutes, cycles ou répétitions.
function unitOf(e) {
  if (isTime(e)) return 's';
  if (/cycles/.test(e.s)) return 'cycles';
  if (/\bmin\b/.test(e.s) && !/[×x]\s*\d/.test(e.s)) return 'min';
  return 'rép.';
}
function specReps(e) {
  const m = (e.s.match(/MIN\s+([^·]+)/) || [null, e.s])[1].match(/(\d+)\s*[×x]\s*(\d+)/);
  return m ? +m[2] : 10;
}
function prettySpec(s) {
  return esc(s).replace(/MIN ([^·]+?)( ·|$)/g, 'Minimum $1$2').replace(/MAX (.+)$/, ' maximum $1').replace(/ · /g, ', ');
}

/* =========================================================
   NAVIGATION
   ========================================================= */
const TITLES = { today: "Aujourd'hui", seances: 'Séances', progres: 'Progrès', bien: 'Bien-être', moi: 'Moi' };
let current = 'today';
function go(name) {
  current = name;
  $$('.screen').forEach(s => s.classList.toggle('on', s.id === 's-' + name));
  $$('.nav button').forEach(b => b.dataset.s === name ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  $('#screenTitle').textContent = TITLES[name];
  window.scrollTo({ top: 0, behavior: 'instant' });
  render();
}
$$('.nav button').forEach(b => b.addEventListener('click', () => go(b.dataset.s)));

function segInit(id, onChange) {
  const seg = $(id);
  seg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    seg.querySelectorAll('button').forEach(x => x.setAttribute('aria-selected', x === b));
    onChange(b);
  });
}
function panelSwitch(screen, p) {
  $$(`${screen} [data-panel]`).forEach(x => x.hidden = x.dataset.panel !== p);
}
let progTab = 'poids';
segInit('#progSeg', b => { progTab = b.dataset.p; panelSwitch('#s-progres', progTab); renderProgres(); });

function render() {
  $('#todayDate').textContent = fmtLong(today()).replace(/^./, c => c.toUpperCase());
  ({ today: renderToday, seances: renderSeances, progres: renderProgres, bien: renderBien, moi: renderMoi })[current]();
}

/* =========================================================
   AUJOURD'HUI
   ========================================================= */
function sessionsOn(k) { return state.sessions.filter(s => s.date === k); }
function setArc(id, r, p) {
  const c = 2 * Math.PI * r, a = $(id);
  a.setAttribute('transform', 'rotate(-90 66 66)');
  a.style.strokeDasharray = c;
  a.style.strokeDashoffset = c * (1 - Math.max(0, Math.min(1, p)));
}
function renderToday() {
  const k = today(), dow = new Date().getDay(), ph = phaseInfo();
  const prog = programFor(dow), kind = kindOf(prog.type);
  const done = sessionsOn(k);
  const draft = state.draft && state.draft.date === k ? state.draft : null;
  const ml = state.water[k] || 0, goal = state.settings.waterGoal;
  const w = state.weights.find(x => x.date === k);

  // Rosace
  const sesP = done.length ? 1 : kind === 'repos' ? 1 : draft ? draft.step / draft.exos.length : 0;
  const M = state.settings.modules, steps = state.steps[k] || 0;
  setArc('#arcS', 58, sesP); setArc('#arcE', 44, M.eau ? ml / goal : 0);
  setArc('#arcP', 30, M.pas ? steps / state.settings.stepsGoal : (w ? 1 : 0));
  $('#lgS').textContent = done.length ? 'Faite' : kind === 'repos' ? 'Repos' : draft ? 'En cours' : 'À faire';
  $('#lgE').textContent = num(ml / 1000, 2) + ' / ' + num(goal / 1000, 1) + ' L';
  $('#lgE').closest('li').hidden = !M.eau;
  $('#lgPname').textContent = M.pas ? 'Pas' : 'Pesée';
  $('#lgP').textContent = M.pas ? (steps ? num(steps, 0) : 'À noter') : (w ? num(w.value) + ' kg' : 'À faire');
  $('#lgWrow').hidden = !M.pas;
  $('#lgW').textContent = w ? num(w.value) + ' kg' : 'À faire';
  const brSec = state.breath.filter(b => b.date === k).reduce((a, b) => a + b.sec, 0);
  $('#lgB').textContent = brSec ? Math.max(1, Math.round(brSec / 60)) + ' min' : 'pas encore';
  if (M.pas) renderStepsCard();

  const strk = habitStreak();
  $('#streakTxt').hidden = !strk;
  if (strk) $('#streakTxt').innerHTML = 'Série en cours : <b>' + strk + ' jour' + (strk > 1 ? 's' : '') + '</b> d\'objectifs atteints.';

  // Séance du jour
  const box = $('#todaySession');
  const phaseTxt = ph.before ? 'Le programme commence le ' + fmtShort(state.settings.startDate)
    : ph.over ? 'Programme terminé · semaine ' + ph.week : 'Semaine ' + ph.week + ', ' + ph.name.toLowerCase();
  box.classList.toggle('done', !!done.length || kind === 'repos');
  if (done.length) {
    const s = done[0];
    box.innerHTML = `<span class="phase">${esc(phaseTxt)}</span><h2>Séance faite</h2>
      <p>${esc(s.free ? s.type : s.label)} ${stars(s.feel)}</p>
      <button class="btn" data-act="free">Noter une autre activité</button>`;
  } else if (kind === 'repos') {
    box.innerHTML = `<span class="phase">${esc(phaseTxt)}</span><h2>${esc(prog.label)}</h2>
      <p>${esc(prog.exos[0].d)}</p>
      <button class="btn" data-act="free">Noter une activité</button>`;
  } else {
    const min = prog.exos.reduce((a, e) => a + (parseInt(e.s) && /min/.test(e.s) ? parseInt(e.s) : 0), 0);
    box.innerHTML = `<span class="phase">${esc(phaseTxt)}</span><h2>${esc(prog.label)}</h2>
      <p>${esc(prog.type)}, ${prog.exos.length} exercices${min ? ', dont ' + min + ' min de cardio' : ''}</p>
      <button class="btn" data-act="start">${draft ? 'Reprendre ma séance' : 'Commencer la séance'}</button>`;
  }

  // Eau
  const g = state.settings.glass, n = Math.max(Math.ceil(goal / g), Math.ceil(ml / g));
  const word = g >= 500 ? 'bouteille' : 'verre', left = Math.ceil((goal - ml) / g);
  $('#glasses').innerHTML = Array.from({ length: n }, (_, i) => `<i class="glass${g >= 500 ? ' bottle' : ''}${i < Math.round(ml / g) ? ' full' : ''}"></i>`).join('');
  $('#waterTxt').textContent = ml >= goal ? 'objectif atteint' : `encore ${left} ${word}${left > 1 ? 's' : ''} de ${num(g / 1000, 2)} L`;

  // Pesée
  const prev = state.weights.filter(x => x.date < k).at(-1);
  $('#qwInput').value = '';
  $('#qwInput').placeholder = w ? 'Corriger : ' + num(w.value) + ' kg' : 'Poids du jour en kg';
  $('#qwHint').textContent = w ? 'Noté aujourd\'hui : ' + num(w.value) + ' kg' + (prev ? ' (' + signed(w.value - prev.value) + ' kg depuis le ' + fmtShort(prev.date) + ')' : '')
    : prev ? 'Dernière pesée : ' + num(prev.value) + ' kg le ' + fmtShort(prev.date) : 'Pèse-toi le matin, à jeun, pour comparer ce qui est comparable.';

  // Respiration suggérée selon l'heure
  const h = new Date().getHours();
  const t = BREATH.find(b => b.id === (h < 11 ? 'cohere' : h >= 21 ? '478' : h >= 17 ? 'long-expire' : 'box'));
  $('#breathSuggest').innerHTML = `<h3>${esc(t.name)}</h3><div class="tags">${t.tags.map(x => `<span class="tag">${esc(x)}</span>`).join('')}</div>
    <p class="hint">${esc(t.rhythm)}, ${Math.round(t.duration / 60)} min</p>`;
  $('#breathSuggest').dataset.id = t.id;

  renderHabits();
}
const signed = v => (v > 0 ? '+' : v < 0 ? '−' : '±') + num(Math.abs(v));

/* ---------- Habitudes personnalisées ---------- */
function renderHabits() {
  const k = today(), log = state.habitLog[k] || {};
  $('#habitsList').innerHTML = state.habits.length ? state.habits.map(h => `<div class="list-row">
    <button class="check" role="checkbox" aria-checked="${!!log[h.id]}" data-habit="${h.id}" aria-label="${esc(h.name)}"></button>
    <span class="grow">${esc(h.name)}</span>
    <button class="del" data-habitdel="${h.id}" aria-label="Supprimer l'habitude ${esc(h.name)}">${ICON_X}</button></div>`).join('')
    : '<p class="empty">Ajoute une habitude que tu veux suivre au jour le jour.</p>';
}
$('#habitsList').addEventListener('click', async e => {
  const chk = e.target.closest('[data-habit]');
  if (chk) {
    const k = today();
    (state.habitLog[k] ||= {})[chk.dataset.habit] = !state.habitLog[k][chk.dataset.habit];
    if (!state.habitLog[k][chk.dataset.habit]) delete state.habitLog[k][chk.dataset.habit];
    save(); renderToday();
    return;
  }
  const del = e.target.closest('[data-habitdel]');
  if (del) {
    const h = state.habits.find(x => x.id === del.dataset.habitdel);
    if (!await confirmDlg('Supprimer cette habitude ?', `« ${h.name} » disparaîtra, avec son historique de cases cochées.`, 'Supprimer')) return;
    state.habits = state.habits.filter(x => x.id !== h.id);
    save(); renderHabits();
    toast('Habitude supprimée.');
  }
});
$('#habitForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#habitInput').value.trim();
  if (!name) return;
  state.habits.push({ id: uid(), name, createdAt: today() });
  $('#habitForm').reset();
  save(); renderHabits();
  toast('Habitude ajoutée.');
});

$('#todaySession').addEventListener('click', e => {
  const a = e.target.closest('[data-act]')?.dataset.act;
  if (a === 'start') startSession();
  if (a === 'free') openFree();
});
function addWater(sign) {
  const k = today();
  state.water[k] = Math.max(0, (state.water[k] || 0) + sign * state.settings.glass);
  save(); renderToday();
  if (sign > 0 && state.water[k] >= state.settings.waterGoal && state.water[k] - state.settings.glass < state.settings.waterGoal) toast('Objectif d\'eau atteint pour aujourd\'hui.');
}
$('#waterPlus').onclick = () => addWater(1);
$('#waterMinus').onclick = () => addWater(-1);
$('#quickWeight').addEventListener('submit', e => {
  e.preventDefault();
  const v = parseFloat($('#qwInput').value.replace(',', '.'));
  if (!(v > 30 && v < 250)) { toast('Entre un poids entre 30 et 250 kg.'); return; }
  setWeight(today(), v);
  $('#qwInput').blur();
  toast('Pesée notée : ' + num(v) + ' kg');
});
function setWeight(k, v) {
  state.weights = state.weights.filter(w => w.date !== k);
  state.weights.push({ date: k, value: Math.round(v * 10) / 10 });
  state.weights.sort((a, b) => a.date.localeCompare(b.date));
  save(); render();
}
$('#breathSuggest').onclick = e => startBreath(e.currentTarget.dataset.id);

/* =========================================================
   SÉANCE GUIDÉE
   ========================================================= */
function buildSets(e) {
  const last = state.exoLast[e.n]?.sets?.length ? state.exoLast[e.n] : exoHistory(e.n).at(-1);
  if (last?.sets?.length) return last.sets.map(s => ({ kg: s.kg, reps: s.reps, ok: false }));
  const u = unitOf(e);
  if (u === 'min' || u === 'cycles') {
    const v = parseInt((e.s.match(/MIN\s+(\d+)/) || e.s.match(/(\d+)/) || [])[1]) || 0;
    return [{ kg: 0, reps: v, ok: false }];
  }
  const reps = u === 's' ? (parseInt((e.s.match(/(\d+)\s*s/) || [])[1]) || 30) : specReps(e);
  return Array.from({ length: 3 }, () => ({ kg: 0, reps, ok: false }));
}
async function startSession() {
  const k = today();
  if (state.draft && state.draft.date !== k) {
    const resume = await confirmDlg('Séance non terminée', `Ta séance du ${fmtShort(state.draft.date)} n'a pas été terminée. La reprendre pour l'enregistrer ?`, 'Reprendre');
    if (!resume) { state.draft = null; save(); }
  }
  if (!state.draft) {
    const dow = new Date().getDay(), prog = programFor(dow);
    if (kindOf(prog.type) === 'repos') { toast('Jour de repos : note plutôt ce que tu as fait.'); openFree(); return; }
    state.draft = {
      date: k, type: prog.type, label: prog.label, kind: kindOf(prog.type), phase: phaseInfo().num,
      exos: prog.exos, step: 0, sets: {}, feels: {}, feel: 0, note: '', startedAt: Date.now()
    };
    prog.exos.forEach(e => { if (!isNoInput(e)) state.draft.sets[e.n] = buildSets(e); });
    save();
  }
  $('#sesTitle').textContent = state.draft.label;
  $('#dlgSession').showModal();
  renderStep();
}
$('#sesClose').onclick = () => {
  stopRest();
  $('#dlgSession').close();
  render();
  if (state.draft) toast('Séance gardée : tu pourras la reprendre.');
};
$('#dlgSession').addEventListener('cancel', () => { stopRest(); setTimeout(render); });

function suggestion(e) {
  const last = state.exoLast[e.n];
  if (!last?.allOk || !isWeighted(e) || !last.sets.length) return null;
  const top = Math.max(...last.sets.map(s => s.kg));
  if (!top) return null;
  return { from: top, to: top + 2.5 };
}
function renderStep() {
  const d = state.draft, total = d.exos.length;
  $('#sesBar').style.width = (d.step / total * 100) + '%';
  if (d.step >= total) return renderRecap();
  $('#sesCount').textContent = 'Exercice ' + (d.step + 1) + ' sur ' + total;
  const e = d.exos[d.step], sets = d.sets[e.n];
  const weighted = isWeighted(e), unit = unitOf(e), assisted = isAssisted(e);
  const sug = sets && suggestion(e);
  let html = `<div class="ses-card"><h3>${esc(e.n)}</h3><p class="spec">${prettySpec(e.s)}</p>`;
  if (e.d) html += `<div class="tip">${esc(e.d)}</div>`;
  if (e.t) html += `<div class="tip${/PALIER/.test(e.t) ? ' palier' : ''}">${esc(e.t)}</div>`;
  const hist = sets ? exoHistory(e.n) : [];
  if (hist.length) html += `<div class="ses-prog"><p class="hint">La dernière fois (${fmtShort(hist.at(-1).date)}) : ${esc(setsTxt(hist.at(-1).sets, hist.at(-1).unit || unitOf(e)))}</p>${hist.length > 1 ? '<div id="sesProg"></div>' : ''}</div>`;
  if (sug) html += `<div class="suggest"><span class="grow">La dernière fois, toutes tes séries étaient réussies. Essaie <b>${num(sug.to)} kg</b>.</span><button class="btn small soft" data-act="sug">Appliquer</button></div>`;
  if (!sets) {
    html += `<p class="hint" style="text-align:center;margin:16px 0 4px">Rien à noter ici : appuie sur « Terminé » quand c'est fait.</p>`;
  } else {
    html += `<p class="hint" style="margin-top:14px">Coche chaque série réussie : c'est ce qui est enregistré.</p><div style="margin-top:8px">`;
    sets.forEach((s, i) => {
      html += `<div class="set${s.ok ? ' ok' : ''}"><span class="n">${i + 1}</span>`;
      if (weighted || assisted) html += stepper(i, 'kg', s.kg, assisted ? 'kg aide' : 'kg');
      html += stepper(i, 'reps', s.reps, unit);
      html += `<button class="check" role="checkbox" aria-checked="${s.ok}" aria-label="Série ${i + 1} réussie" data-ok="${i}"></button></div>`;
    });
    html += `<div class="btns"><button class="btn small ghost" data-act="add">Ajouter une série</button>${sets.length > 1 ? '<button class="btn small ghost" data-act="rm">Retirer la dernière</button>' : ''}</div></div>`;
    html += `<p class="hint" style="text-align:center;margin-top:14px">Ressenti sur cet exercice</p><div class="feel" data-feel="exo">${feelBtns(d.feels[e.n])}</div>`;
  }
  html += `<button class="btn" data-act="next" style="margin-top:12px">Terminé, exercice suivant</button>
    <div class="btns" style="margin-top:8px">${d.step ? '<button class="btn ghost" data-act="prev">Précédent</button>' : ''}<button class="btn ghost" data-act="skip">Passer</button></div>
    </div><div id="restBar"></div>`;
  $('#sesBody').innerHTML = html;
  if (hist.length > 1) {
    const M = exoMetric(e.n, hist);
    Charts.line($('#sesProg'), { title: 'Progression ' + e.n, unit: M.unit, height: 90, table: false, series: [{ name: M.label, color: COLORS().rose, dots: true, points: M.pts }] });
  }
  paintRest();
}
const stepper = (i, f, v, u) => `<div class="stepper"><button data-adj="${i}|${f}|-1" aria-label="Moins">−</button><output>${num(v)}</output><span class="u">${u}</span><button data-adj="${i}|${f}|1" aria-label="Plus">+</button></div>`;
const feelBtns = v => [1, 2, 3, 4, 5].map(n => `<button aria-pressed="${n <= (v || 0)}" data-f="${n}" aria-label="${n} sur 5">★</button>`).join('');

$('#sesBody').addEventListener('click', async ev => {
  const d = state.draft; if (!d) return;
  const e = d.exos[d.step], sets = e && d.sets[e.n];
  const t = ev.target.closest('button'); if (!t) return;
  if (t.dataset.adj) {
    const [i, f, dir] = t.dataset.adj.split('|');
    const step = f === 'kg' ? 2.5 : unitOf(e) === 's' ? 5 : 1;
    sets[i][f] = Math.max(0, Math.round((sets[i][f] + step * dir) * 10) / 10);
    t.parentNode.querySelector('output').textContent = num(sets[i][f]);
    save(); return;
  }
  if (t.dataset.ok !== undefined) {
    const s = sets[t.dataset.ok]; s.ok = !s.ok; save();
    t.setAttribute('aria-checked', s.ok); t.closest('.set').classList.toggle('ok', s.ok);
    if (s.ok && sets.some(x => !x.ok)) startRest();
    return;
  }
  if (t.dataset.f) {
    const box = t.parentNode, v = +t.dataset.f;
    if (box.dataset.feel === 'exo') d.feels[e.n] = v; else d.feel = v;
    box.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.f <= v));
    save(); return;
  }
  const act = t.dataset.act;
  if (act === 'sug') { const s = suggestion(e); sets.forEach(x => x.kg = s.to); save(); renderStep(); }
  if (act === 'add') { const l = sets.at(-1); sets.push({ kg: l.kg, reps: l.reps, ok: false }); save(); renderStep(); }
  if (act === 'rm') { sets.pop(); save(); renderStep(); }
  if (act === 'next') { d.step++; stopRest(); save(); renderStep(); $('#dlgSession').scrollTo(0, 0); }
  if (act === 'prev') { d.step--; save(); renderStep(); }
  if (act === 'skip') { if (sets) d.sets[e.n] = sets.map(x => ({ ...x, ok: false, skipped: true })); d.step++; stopRest(); save(); renderStep(); }
  if (act === 'finish') finishSession();
  if (act === 'abandon') {
    if (await confirmDlg('Abandonner la séance ?', 'Ce que tu as noté pendant cette séance sera effacé.', 'Abandonner')) {
      state.draft = null; save(); $('#dlgSession').close(); render(); toast('Séance abandonnée.');
    }
  }
  if (act === 'rest+') { restEnd += 15000; paintRest(); }
  if (act === 'rest0') stopRest();
});

/* Minuteur de repos */
let restEnd = 0, restTick = null;
function startRest() {
  restEnd = Date.now() + state.settings.rest * 1000;
  clearInterval(restTick);
  restTick = setInterval(paintRest, 250);
  paintRest();
}
function stopRest() { clearInterval(restTick); restTick = null; restEnd = 0; paintRest(); }
function paintRest() {
  const bar = $('#restBar'); if (!bar) return;
  const left = Math.ceil((restEnd - Date.now()) / 1000);
  if (!restEnd || left <= 0) {
    if (restEnd && left <= 0) { navigator.vibrate?.([200, 100, 200]); toast('Repos terminé : série suivante.'); restEnd = 0; clearInterval(restTick); }
    bar.innerHTML = ''; return;
  }
  bar.innerHTML = `<div class="rest"><span class="grow">Repos</span><span class="t">${Math.floor(left / 60)}:${pad2(left % 60)}</span><button data-act="rest+">+15 s</button><button data-act="rest0">Passer</button></div>`;
}

function renderRecap() {
  const d = state.draft;
  $('#sesCount').textContent = 'Dernière étape';
  const n = Object.values(d.sets).filter(s => s.some(x => x.ok && !x.skipped)).length;
  $('#sesBody').innerHTML = `<div class="ses-card"><h3>Séance terminée</h3>
    <p class="hint" style="text-align:center;margin:6px 0 10px">${n} exercice${n > 1 ? 's' : ''} avec des séries cochées.</p>
    <p style="text-align:center">Comment tu te sens ?</p>
    <div class="feel" data-feel="ses">${feelBtns(d.feel)}</div>
    <label class="field"><span>Une note sur cette séance (facultatif)</span><textarea id="sesNote" placeholder="J'ai remplacé la course par 1 h de marche…">${esc(d.note)}</textarea></label>
    <button class="btn" data-act="finish">Enregistrer la séance</button>
    <div class="btns" style="margin-top:8px"><button class="btn ghost" data-act="prev">Revenir</button><button class="btn danger" data-act="abandon">Abandonner</button></div></div>`;
  $('#sesNote').addEventListener('input', ev => { d.note = ev.target.value; save(); });
}
// Valeur comparable d'une série d'un exercice, dans le même sens que exoMetric().
function exoVal(def, sets) {
  const assisted = isAssisted(def) && sets.some(s => s.kg > 0);
  const weighted = !assisted && sets.some(s => s.kg > 0);
  return assisted ? Math.min(...sets.map(s => s.kg)) : weighted ? Math.max(...sets.map(s => s.kg)) : Math.max(...sets.map(s => s.reps));
}
function finishSession() {
  const d = state.draft;
  if (!d.feel) { toast('Donne une note de ressenti avant d\'enregistrer.'); return; }
  const exos = {}, records = [];
  d.exos.forEach(e => {
    const sets = d.sets[e.n];
    if (!sets) return;
    // Seules les séries cochées comptent comme faites.
    const okSets = sets.filter(s => s.ok && !s.skipped);
    if (!okSets.length) return;
    exos[e.n] = { sets: okSets.map(s => ({ kg: s.kg, reps: s.reps })), feel: d.feels[e.n] || 0, unit: unitOf(e), weighted: isWeighted(e) };
    // On garde toutes les séries prévues pour pré-remplir la prochaine fois.
    state.exoLast[e.n] = { sets: sets.map(s => ({ kg: s.kg, reps: s.reps })), allOk: sets.every(s => s.ok), date: d.date };
    const H = exoHistory(e.n);
    if (H.length) {
      const M = exoMetric(e.n, H), v = exoVal(e, okSets);
      if (M.assisted ? v < M.best : v > M.best) records.push(e.n);
    }
  });
  const min = d.startedAt ? Math.min(150, Math.max(15, Math.round((Date.now() - d.startedAt) / 60000))) : 0;
  state.sessions.push({ id: uid(), date: d.date, type: d.type, label: d.label, kind: d.kind, phase: d.phase, feel: d.feel, note: d.note.trim(), exos, min });
  state.draft = null;
  save(); stopRest();
  $('#dlgSession').close();
  render();
  toast(records.length ? 'Nouveau record : ' + records.join(', ') + ' !' : 'Séance enregistrée. Bravo.');
}

/* ---------- Activité libre ---------- */
let freeFeel = 0;
function openFree() {
  const f = $('#freeForm'); f.reset(); freeFeel = 0;
  $('#freeFeel').innerHTML = feelBtns(0);
  $('#dlgFree').showModal();
}
$('#freeFeel').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  freeFeel = +b.dataset.f;
  $$('#freeFeel button').forEach(x => x.setAttribute('aria-pressed', +x.dataset.f <= freeFeel));
});
$('#freeForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const note = f.get('note').trim(), min = +f.get('min') || 0;
  if (!note && !min) { toast('Indique au moins une durée ou ce que tu as fait.'); return; }
  state.sessions.push({ id: uid(), date: today(), free: true, type: f.get('type'), min, note, feel: freeFeel });
  save(); $('#dlgFree').close(); render(); toast('Activité enregistrée.');
});

/* =========================================================
   SÉANCES (programme + historique)
   ========================================================= */
let viewPhase = null;
function renderSeances() {
  const ph = phaseInfo();
  if (!viewPhase) viewPhase = ph.num;
  $('#phaseSeg').innerHTML = [1, 2, 3].map(n => `<button role="tab" data-n="${n}" aria-selected="${n === viewPhase}">Phase ${n}${n === ph.num ? ' (actuelle)' : ''}</button>`).join('');
  const info = [null, 'Reconditionnement', 'Construction', 'Consolidation'][viewPhase];
  $('#phaseDesc').textContent = info + (viewPhase === ph.num ? ` : tu es en semaine ${ph.week}${ph.over ? ', le programme de 24 semaines est terminé. Tu peux le relancer en changeant la date de début dans Moi.' : '.'}` : '.');
  const dow = new Date().getDay();
  const prog = programFor(dow);
  const draft = state.draft && state.draft.date === today();
  $('#startBtn').textContent = kindOf(prog.type) === 'repos' ? 'Jour de repos : noter une activité' : draft ? 'Reprendre ma séance' : 'Commencer la séance du jour';
  $('#program').innerHTML = [1, 2, 3, 4, 5, 6, 0].map(i => {
    const p = PROGRAMS[viewPhase][i], isT = i === dow && viewPhase === ph.num;
    return `<details class="day${isT ? ' is-today' : ''}" data-kind="${kindOf(p.type)}"${isT ? ' open' : ''}>
      <summary><span class="dname">${p.name.slice(0, 3)}</span><div class="grow"><h3>${esc(p.label)}</h3><span class="hint">${esc(p.type)}${isT ? ' · aujourd\'hui' : ''}</span></div>
      <svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></summary>
      ${p.exos.map(e => `<div class="exo"><div class="row between"><b>${esc(e.n)}</b><span class="spec">${prettySpec(e.s)}</span></div>
        ${e.d ? `<p class="desc">${esc(e.d)}</p>` : ''}${e.t ? `<div class="tip${/PALIER/.test(e.t) ? ' palier' : ''}">${esc(e.t)}</div>` : ''}</div>`).join('')}
    </details>`;
  }).join('');

  const hist = state.sessions.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  $('#history').innerHTML = hist.length ? hist.map(s => `<div class="list-row"><span class="date">${fmtShort(s.date)}</span>
    <div class="grow"><div>${esc(s.free ? s.type : s.label)}${s.min ? ', ' + s.min + ' min' : ''} ${stars(s.feel)}</div>
    ${s.note ? `<div class="hint">${esc(s.note)}</div>` : ''}${!s.free && s.exos ? `<div class="hint">${Object.keys(s.exos).length} exercices notés</div>` : ''}</div>
    <button class="del" data-del="${s.id}" aria-label="Supprimer">${ICON_X}</button></div>`).join('')
    : '<p class="empty">Ta première séance apparaîtra ici.</p>';
}
$('#phaseSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { viewPhase = +b.dataset.n; renderSeances(); } });
$('#startBtn').onclick = () => startSession();
$('#freeBtn').onclick = () => openFree();
$('#history').addEventListener('click', async e => {
  const id = e.target.closest('[data-del]')?.dataset.del; if (!id) return;
  if (!await confirmDlg('Supprimer cette séance ?', 'Elle disparaîtra de ton historique et de tes graphiques.', 'Supprimer')) return;
  state.sessions = state.sessions.filter(s => s.id !== id); save(); renderSeances(); toast('Séance supprimée.');
});

/* =========================================================
   PROGRÈS
   ========================================================= */
const COLORS = () => {
  const cs = getComputedStyle(document.documentElement);
  return { rose: cs.getPropertyValue('--rose').trim(), eau: cs.getPropertyValue('--eau').trim(), olive: cs.getPropertyValue('--olive').trim(), muted: cs.getPropertyValue('--muted').trim() };
};
let wRange = 30;
segInit('#wRange', b => { wRange = +b.dataset.r; renderPoids(); });

function rolling(list, days = 7) {
  return list.map(w => {
    const from = addDays(w.date, -(days - 1));
    const win = list.filter(x => x.date >= from && x.date <= w.date);
    return { date: w.date, y: win.reduce((a, x) => a + x.value, 0) / win.length };
  });
}
function renderProgres() {
  ({ poids: renderPoids, pas: renderPas, exos: renderExos, habitudes: renderHabitsProgress, eau: renderEau, tests: renderTests, regul: renderRegul })[progTab]();
}
function habitDoneOn(id, k) { return !!(state.habitLog[k] || {})[id]; }
// Jours consécutifs cochés pour une seule habitude, jusqu'à hier si celle du jour n'est pas encore faite.
function habitOwnStreak(id) {
  let k = today();
  if (!habitDoneOn(id, k)) k = addDays(k, -1);
  let n = 0;
  while (k >= state.settings.startDate && habitDoneOn(id, k)) { n++; k = addDays(k, -1); }
  return n;
}
function renderHabitsProgress() {
  const box = $('#habitCards');
  if (!state.habits.length) {
    box.innerHTML = '<div class="card"><p class="empty">Ajoute une habitude depuis l\'écran Aujourd\'hui pour voir son suivi ici.</p></div>';
    return;
  }
  const days = Array.from({ length: 30 }, (_, i) => addDays(today(), i - 29));
  box.innerHTML = state.habits.map(h => {
    const hit = days.filter(k => habitDoneOn(h.id, k)).length;
    const strk = habitOwnStreak(h.id);
    const strip = days.map(k => {
      const on = habitDoneOn(h.id, k);
      return `<i class="${on ? 'on' : ''}" title="${esc(fmtShort(k))} : ${on ? 'faite' : 'pas faite'}"></i>`;
    }).join('');
    return `<div class="card exo-card"><div class="row between"><h3>${esc(h.name)}</h3>${strk ? `<span class="badge up">${strk} j de suite</span>` : ''}</div>
      <p class="hint">${hit} / ${days.length} jours sur les 30 derniers</p>
      <div class="habit-strip">${strip}</div></div>`;
  }).join('');
}
function stat(label, value, unit = '', delta = '', cls = '') {
  return `<div class="stat"><div class="l">${label}</div><div class="n">${value}${unit ? `<small>${unit}</small>` : ''}</div>${delta ? `<div class="d ${cls}">${delta}</div>` : ''}</div>`;
}
function renderPoids() {
  const W = state.weights, S = state.settings, C = COLORS();
  const last = W.at(-1);
  const avg = rolling(W);
  const month = W.filter(w => w.date >= addDays(today(), -30));
  const d30 = month.length >= 2 ? month.at(-1).value - month[0].value : null;
  $('#wStats').innerHTML = W.length ? [
    stat('Dernière pesée', num(last.value), 'kg', fmtShort(last.date)),
    stat('Moyenne 7 jours', num(avg.at(-1).y), 'kg', 'lisse les variations'),
    stat('Sur 30 jours', d30 === null ? '—' : signed(d30), d30 === null ? '' : 'kg', d30 === null ? 'il faut 2 pesées' : d30 < 0 ? 'en baisse' : d30 > 0 ? 'en hausse' : 'stable', d30 < 0 ? 'good' : d30 > 0 ? 'bad' : ''),
    stat('Reste à perdre', num(Math.max(0, last.value - S.weightGoal)), 'kg', 'objectif ' + num(S.weightGoal) + ' kg')
  ].join('') : '';
  const from = wRange ? addDays(today(), -wRange) : '0000';
  Charts.line($('#wChart'), {
    title: 'Évolution du poids', unit: 'kg', goal: { y: S.weightGoal, label: 'objectif' },
    empty: 'Note au moins deux pesées pour voir ta courbe.',
    series: [
      { name: 'Pesée', color: C.muted, line: false, dots: true, endLabel: false, points: W.filter(w => w.date >= from).map(w => ({ date: w.date, y: w.value })) },
      { name: 'Moyenne 7 jours', color: C.rose, area: true, points: avg.filter(w => w.date >= from) }
    ]
  });
  $('#wList').innerHTML = W.length ? W.slice().reverse().slice(0, 60).map((w, i, arr) => {
    const prev = arr[i + 1];
    return `<div class="list-row"><span class="date">${fmtShort(w.date)}</span><span class="val grow">${num(w.value)} kg</span>
      ${prev ? `<span class="hint">${signed(w.value - prev.value)}</span>` : ''}<button class="del" data-wdel="${w.date}" aria-label="Supprimer la pesée du ${fmtShort(w.date)}">${ICON_X}</button></div>`;
  }).join('') : '<p class="empty">Aucune pesée pour l\'instant. Tu peux en noter une sur l\'écran Aujourd\'hui.</p>';
}
$('#wList').addEventListener('click', e => {
  const k = e.target.closest('[data-wdel]')?.dataset.wdel; if (!k) return;
  const old = state.weights.find(w => w.date === k);
  state.weights = state.weights.filter(w => w.date !== k); save(); renderPoids();
  toast('Pesée supprimée.', { label: 'Annuler', run: () => setWeight(old.date, old.value) });
});

function exoHistory(name) {
  return state.sessions.filter(s => s.exos?.[name]).sort((a, b) => a.date.localeCompare(b.date)).map(s => ({ date: s.date, ...s.exos[name] }));
}
// Ordre et regroupement des exercices selon le programme (phase actuelle d'abord).
const EXO_GROUPS = [[1, 'Bas du corps'], [5, 'Bas du corps'], [3, 'Haut du corps et gainage'], [2, 'Course'], [4, 'Course']];
function exoOrder() {
  const map = new Map(), cur = phaseInfo().num;
  [cur, 1, 2, 3].forEach(ph => EXO_GROUPS.forEach(([d, g]) => PROGRAMS[ph][d].exos.forEach(e => { if (!map.has(e.n)) map.set(e.n, { g, i: map.size }); })));
  return map;
}
// Ce qu'on suit pour un exercice : charge max, assistance minimale (moins = mieux), ou meilleure série.
function exoMetric(name, H) {
  const def = exoDef(name);
  const anyKg = H.some(h => h.sets.some(s => s.kg > 0));
  const assisted = (def ? isAssisted(def) : /assist/i.test(name)) && anyKg;
  const weighted = !assisted && anyKg;
  const unit = assisted || weighted ? 'kg' : (H.at(-1)?.unit || (def ? unitOf(def) : 'rép.'));
  const val = h => assisted ? Math.min(...h.sets.map(s => s.kg)) : weighted ? Math.max(...h.sets.map(s => s.kg)) : Math.max(...h.sets.map(s => s.reps));
  const pts = H.map(h => ({ date: h.date, y: val(h) }));
  const ys = pts.map(p => p.y);
  return {
    assisted, weighted, unit, pts,
    label: assisted ? 'Assistance' : weighted ? 'Charge max' : ({ s: 'Meilleure tenue', min: 'Durée', cycles: 'Cycles' }[unit] || 'Meilleure série'),
    best: assisted ? Math.min(...ys) : Math.max(...ys),
    delta: ys.at(-1) - ys[0],
    better: assisted ? ys.at(-1) < ys[0] : ys.at(-1) > ys[0]
  };
}
const setsTxt = (sets, unit) => sets.map(s => (s.kg ? num(s.kg) + ' kg × ' : '') + num(s.reps) + (s.kg ? '' : ' ' + unit)).join(', ');
function renderExos() {
  const names = [...new Set(state.sessions.flatMap(s => Object.keys(s.exos || {})))];
  const order = exoOrder();
  const G = ['Bas du corps', 'Haut du corps et gainage', 'Course'];
  const rank = n => { const o = order.get(n); return o ? G.indexOf(o.g) * 1000 + o.i : 9999; };
  names.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, 'fr'));
  const box = $('#exoCards');
  if (!names.length) {
    box.innerHTML = '<div class="card"><p class="empty">Fais une séance guidée et coche tes séries : chaque exercice aura ici sa propre courbe.</p></div>';
  } else {
    const C = COLORS();
    let html = '', lastG = null;
    const charts = [];
    names.forEach((n, i) => {
      const H = exoHistory(n), M = exoMetric(n, H), g = order.get(n)?.g || 'Autres';
      if (g !== lastG) { html += `<h3 class="exo-group">${esc(g)}</h3>`; lastG = g; }
      const d = H.length > 1 ? `<span class="badge${M.better ? ' up' : ''}">${signed(M.delta)} ${M.unit}</span>` : '';
      const rec = H.length > 1 && M.pts.at(-1).y === M.best ? '<span class="badge rec">Record</span>' : '';
      html += `<div class="card exo-card"><div class="row between"><h3>${esc(n)}</h3><div class="row" style="gap:6px">${rec}${d}</div></div>
        <p class="hint">${M.label}${M.assisted ? ' (moins = mieux)' : ''} : <b>${num(M.pts.at(-1).y)} ${M.unit}</b> la dernière fois, record ${num(M.best)} ${M.unit}, ${H.length} séance${H.length > 1 ? 's' : ''}</p>
        <div id="ec-${i}"></div>
        <details class="table-toggle"><summary>Détail des séances</summary>
        ${H.slice().reverse().slice(0, 12).map(h => `<div class="list-row"><span class="date">${fmtShort(h.date)}</span><span class="grow">${esc(setsTxt(h.sets, h.unit || M.unit))}</span></div>`).join('')}</details></div>`;
      charts.push([i, n, M]);
    });
    box.innerHTML = html;
    charts.forEach(([i, n, M]) => Charts.line($('#ec-' + i), {
      title: n, unit: M.unit, height: 130, table: false, empty: 'Encore une séance de cet exercice et la courbe apparaîtra.',
      series: [{ name: M.label, color: C.rose, area: true, dots: true, points: M.pts }]
    }));
  }
  // Records
  const rows = [];
  if (state.weights.length) rows.push(['Poids le plus bas', num(Math.min(...state.weights.map(w => w.value))) + ' kg']);
  names.forEach(n => { const M = exoMetric(n, exoHistory(n)); rows.push([n + (M.assisted ? ' (assistance la plus faible)' : ''), num(M.best) + ' ' + M.unit]); });
  TESTS.forEach(t => {
    const L = state.tests[t.id]; if (!L?.length) return;
    const v = L.map(x => x.value);
    rows.push([t.name, num(t.inverse ? Math.min(...v) : Math.max(...v)) + ' ' + t.unit]);
  });
  $('#records').innerHTML = rows.length ? rows.map(r => `<div class="list-row"><span class="grow">${esc(r[0])}</span><span class="val">${esc(r[1])}</span></div>`).join('') : '<p class="empty">Tes records se rempliront tout seuls au fil des séances.</p>';
}

function renderEau() {
  const goal = state.settings.waterGoal, C = COLORS();
  const days = Array.from({ length: 14 }, (_, i) => addDays(today(), i - 13));
  const last7 = days.slice(7).map(k => state.water[k] || 0);
  const hit30 = Array.from({ length: 30 }, (_, i) => addDays(today(), -i)).filter(k => (state.water[k] || 0) >= goal).length;
  $('#eauStats').innerHTML = [
    stat("Aujourd'hui", num((state.water[today()] || 0) / 1000, 2), 'L'),
    stat('Moyenne 7 jours', num(last7.reduce((a, b) => a + b, 0) / 7 / 1000, 2), 'L'),
    stat('Objectif atteint', hit30, 'j', 'sur les 30 derniers jours')
  ].join('');
  Charts.bars($('#eauChart'), {
    color: C.eau, unit: 'L', decimals: 2, goal: { y: goal / 1000, label: 'objectif' }, labelHead: 'Jour', valueHead: 'Eau',
    empty: "Ajoute des verres sur l'écran Aujourd'hui pour voir ton historique.",
    bars: days.map(k => ({ label: dateOf(k).getDate() + '', tipLabel: fmtShort(k), value: (state.water[k] || 0) / 1000, full: (state.water[k] || 0) >= goal }))
  });
}

function renderTests() {
  const C = COLORS();
  $('#testsList').innerHTML = TESTS.map(t => {
    const L = state.tests[t.id] || [], last = L.at(-1);
    const due = !last || (dateOf(today()) - dateOf(last.date)) / 864e5 >= t.freq;
    return `<div class="card"><div class="row between"><h3 style="font-size:1.1rem">${esc(t.name)}</h3>
      <span class="badge" style="${due ? '' : 'background:var(--olive-soft)'}">${due ? 'À faire' : 'Fait le ' + fmtShort(last.date)}</span></div>
      <p class="hint" style="margin:4px 0 8px">${esc(t.desc)} Départ : ${esc(t.baseline)}. Objectif : ${esc(t.goal)}. Tous les ${t.freq} jours.</p>
      ${last ? `<p>Dernière mesure : <b>${num(last.value)} ${esc(t.unit)}</b></p>` : ''}
      <div id="tc-${t.id}"></div>
      <form class="quick-weight" data-test="${t.id}" style="margin-top:10px"><input type="number" step="0.5" inputmode="decimal" placeholder="Nouvelle mesure (${esc(t.unit)})" aria-label="Nouvelle mesure pour ${esc(t.name)}"><button class="btn small" type="submit">Noter</button></form></div>`;
  }).join('');
  TESTS.forEach(t => {
    const L = state.tests[t.id] || [];
    if (L.length >= 2) Charts.line($('#tc-' + t.id), { title: t.name, unit: t.unit, height: 140, series: [{ name: t.name, color: C.rose, dots: true, points: L.map(x => ({ date: x.date, y: x.value })) }] });
  });
}
$('#testsList').addEventListener('submit', e => {
  e.preventDefault();
  const id = e.target.dataset.test, v = parseFloat(e.target.querySelector('input').value.replace(',', '.'));
  if (isNaN(v)) { toast('Entre une valeur.'); return; }
  (state.tests[id] ||= []).push({ date: today(), value: v });
  save(); renderTests(); toast('Mesure notée.');
});

let calOffset = 0;
function weekStart(k) { const d = dateOf(k), w = (d.getDay() + 6) % 7; return addDays(k, -w); }
function renderRegul() {
  const C = COLORS();
  const ws = weekStart(today());
  const planned = [1, 2, 3, 4, 5, 6, 0].filter(i => kindOf(programFor(i).type) !== 'repos').length;
  const thisWeek = state.sessions.filter(s => s.date >= ws).length;
  const monthKey = today().slice(0, 7);
  const thisMonth = state.sessions.filter(s => s.date.startsWith(monthKey)).length;
  let streak = 0;
  for (let i = 1; i < 60; i++) {
    const a = addDays(ws, -7 * i), b = addDays(a, 6);
    if (state.sessions.filter(s => s.date >= a && s.date <= b).length >= 3) streak++; else break;
  }
  const M = state.settings.modules, today_ = today();
  const waterWeek = Object.entries(state.water).filter(([k, v]) => k >= ws && k <= today_ && v).map(([, v]) => v);
  const stepsWeek = Object.entries(state.steps).filter(([k, v]) => k >= ws && k <= today_ && v).map(([, v]) => v);
  const breathWeek = state.breath.filter(b => b.date >= ws && b.date <= today_);
  const wWeek = state.weights.filter(w => w.date >= ws && w.date <= today_);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(ws, i)).filter(k => k <= today_);
  const habitPossible = state.habits.length * weekDays.length;
  const habitDone = weekDays.reduce((a, k) => a + state.habits.filter(h => (state.habitLog[k] || {})[h.id]).length, 0);
  $('#regStats').innerHTML = [
    stat('Cette semaine', thisWeek + ' / ' + planned, '', 'séances prévues'),
    stat('Ce mois-ci', thisMonth, '', 'séances et activités'),
    stat('Semaines tenues', streak, '', 'd\'affilée avec 3 séances ou plus'),
    M.eau && waterWeek.length ? stat('Eau cette semaine', num(waterWeek.reduce((a, b) => a + b, 0) / waterWeek.length / 1000, 2), 'L/j', 'en moyenne') : '',
    M.pas && stepsWeek.length ? stat('Pas cette semaine', num(stepsWeek.reduce((a, b) => a + b, 0) / stepsWeek.length, 0), '', 'en moyenne par jour') : '',
    M.souffle && breathWeek.length ? stat('Respiration', Math.round(breathWeek.reduce((a, b) => a + b.sec, 0) / 60), 'min', 'cette semaine') : '',
    wWeek.length >= 2 ? stat('Poids cette semaine', signed(wWeek.at(-1).value - wWeek[0].value), 'kg', 'depuis ' + fmtShort(wWeek[0].date)) : '',
    habitPossible ? stat('Habitudes', habitDone + ' / ' + habitPossible, '', 'cases cochées cette semaine') : ''
  ].join('');
  const weeks = Array.from({ length: 10 }, (_, i) => addDays(ws, -7 * (9 - i)));
  Charts.bars($('#regChart'), {
    color: C.rose, unit: 'séances', goal: { y: 3, label: 'repère' }, labelHead: 'Semaine du', valueHead: 'Séances',
    empty: 'Tes semaines apparaîtront ici dès la première séance.',
    bars: weeks.map(a => ({ label: fmtShort(a), tipLabel: 'Semaine du ' + fmtShort(a), value: state.sessions.filter(s => s.date >= a && s.date <= addDays(a, 6)).length }))
  });
  // Calendrier
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + calOffset);
  const y = base.getFullYear(), m = base.getMonth();
  $('#calTitle').textContent = base.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const first = (new Date(y, m, 1).getDay() + 6) % 7, n = new Date(y, m + 1, 0).getDate();
  let html = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => `<span class="h">${d}</span>`).join('');
  html += '<span class="c x"></span>'.repeat(first);
  for (let d = 1; d <= n; d++) {
    const k = keyOf(new Date(y, m, d));
    const cls = ['c', sessionsOn(k).length ? 's' : '', (state.water[k] || 0) >= state.settings.waterGoal ? 'e' : '', k === today() ? 't' : ''].join(' ');
    html += `<span class="${cls}">${d}</span>`;
  }
  $('#cal').innerHTML = html;
  $('#calNext').disabled = calOffset >= 0;
}
$('#calPrev').onclick = () => { calOffset--; renderRegul(); };
$('#calNext').onclick = () => { if (calOffset < 0) { calOffset++; renderRegul(); } };

/* =========================================================
   BIEN-ÊTRE
   ========================================================= */
function renderBien() {
  const m = today().slice(0, 7);
  const mins = Math.round(state.breath.filter(b => b.date.startsWith(m)).reduce((a, b) => a + b.sec, 0) / 60);
  $('#breathStats').textContent = mins ? `${mins} minute${mins > 1 ? 's' : ''} de respiration ce mois-ci.` : 'Choisis une technique selon ce dont tu as besoin.';
  $('#breathList').innerHTML = BREATH.map(t => `<button class="card tech" data-b="${t.id}"><h3>${esc(t.name)}</h3>
    <div class="tags">${t.tags.map(x => `<span class="tag">${esc(x)}</span>`).join('')}</div>
    <p class="hint">${esc(t.rhythm)}, ${Math.round(t.duration / 60)} min</p><p style="font-size:.9rem;margin-top:4px">${esc(t.benefits)}</p></button>`).join('');
}
$('#breathList').addEventListener('click', e => { const b = e.target.closest('[data-b]'); if (b) startBreath(b.dataset.b); });

/* Respiration guidée */
let br = null;
function startBreath(id) {
  const t = BREATH.find(b => b.id === id); if (!t) return;
  $('#brTitle').textContent = t.name;
  $('#brRhythm').textContent = t.rhythm;
  const ball = $('#brBall');
  br = { t, start: Date.now(), idx: 0, timer: null };
  $('#dlgBreath').showModal();
  const stepFn = () => {
    const el = (Date.now() - br.start) / 1000;
    if (el >= t.duration) { stopBreath(true); return; }
    const [label, ms] = t.cycle[br.idx % t.cycle.length];
    ball.textContent = label;
    ball.style.transitionDuration = ms + 'ms';
    if (label === 'Inspire') ball.classList.add('big');
    if (label === 'Expire') ball.classList.remove('big');
    const left = Math.ceil(t.duration - el);
    $('#brLeft').textContent = 'Encore ' + Math.floor(left / 60) + ' min ' + pad2(left % 60);
    br.idx++;
    br.timer = setTimeout(stepFn, ms);
  };
  ball.classList.remove('big');
  setTimeout(stepFn, 400);
}
function stopBreath(finished) {
  if (!br) return;
  clearTimeout(br.timer);
  const sec = Math.round((Date.now() - br.start) / 1000);
  if (sec >= 30) { state.breath.push({ date: today(), tech: br.t.id, sec: Math.min(sec, br.t.duration) }); save(); }
  br = null;
  if ($('#dlgBreath').open) $('#dlgBreath').close();
  if (finished) toast('Séance de respiration terminée.');
  if (current === 'bien') renderBien();
}
$('#brStop').onclick = () => stopBreath(false);
$('#dlgBreath').addEventListener('close', () => stopBreath(false));


/* =========================================================
   PAS
   ========================================================= */
function renderStepsCard() {
  const k = today(), st = state.steps[k] || 0, goal = state.settings.stepsGoal;
  $('#stepsInput').value = ''; $('#stepsInput').placeholder = st ? 'Corriger : ' + num(st, 0) + ' pas' : 'Pas du jour (Google Fit, Samsung Santé…)';
  $('#stepsTxt').textContent = st >= goal ? 'objectif atteint' : st ? 'encore ' + num(goal - st, 0) : 'objectif ' + num(goal, 0);
  $('#stepsHint').textContent = st ? `${num(st, 0)} pas, soit environ ${num(st * 0.00072, 1)} km.`
    : 'Recopie le nombre de pas affiché par ton téléphone, le soir par exemple.';
}
$('#stepsForm').addEventListener('submit', e => {
  e.preventDefault();
  const v = parseInt($('#stepsInput').value, 10);
  if (!(v >= 0 && v < 100000)) { toast('Entre un nombre de pas.'); return; }
  state.steps[today()] = v; save(); $('#stepsInput').blur(); renderToday();
  toast(v >= state.settings.stepsGoal ? 'Objectif de pas atteint. Bravo.' : 'Pas notés.');
});

function renderPas() {
  const C = COLORS(), goal = state.settings.stepsGoal;
  const days = Array.from({ length: 14 }, (_, i) => addDays(today(), i - 13));
  const last7 = days.slice(7).map(k => state.steps[k] || 0).filter(Boolean);
  const all = Object.values(state.steps);
  const hit = Array.from({ length: 30 }, (_, i) => addDays(today(), -i)).filter(k => (state.steps[k] || 0) >= goal).length;
  $('#pasStats').innerHTML = [
    stat('Moyenne 7 jours', last7.length ? num(last7.reduce((a, b) => a + b, 0) / last7.length, 0) : '—', '', last7.length + ' jour' + (last7.length > 1 ? 's' : '') + ' notés'),
    stat('Objectif atteint', hit, 'j', 'sur les 30 derniers jours'),
    stat('Record', all.length ? num(Math.max(...all), 0) : '—', '', 'pas en une journée')
  ].join('');
  Charts.bars($('#pasChart'), {
    color: C.olive, unit: 'pas', goal: { y: goal, label: 'objectif' }, labelHead: 'Jour', valueHead: 'Pas',
    empty: "Note tes pas sur l'écran Aujourd'hui pour voir l'historique.",
    bars: days.map(k => ({ label: dateOf(k).getDate() + '', tipLabel: fmtShort(k), value: state.steps[k] || 0, full: (state.steps[k] || 0) >= goal }))
  });
}

/* Modules affichés */
function applyModules() {
  const M = state.settings.modules;
  $$('[data-module]').forEach(el => { el.hidden = !M[el.dataset.module]; });
  const firstVisible = seg => $$(seg + ' button').find(b => !b.hidden);
  if ($(`#progSeg [data-p="${progTab}"]`).hidden) { progTab = firstVisible('#progSeg').dataset.p; }
  $$('#progSeg button').forEach(b => b.setAttribute('aria-selected', b.dataset.p === progTab));
  panelSwitch('#s-progres', progTab);
  $('.nav [data-s="bien"]').hidden = !M.souffle;
  if (!M.souffle && current === 'bien') go('today');
}

/* =========================================================
   MOI
   ========================================================= */
function goalProgress(g) {
  const S = state.settings;
  if (g.id === 'poids' && state.weights.length) {
    const last = state.weights.at(-1).value;
    const pct = (S.weightStart - last) / (S.weightStart - S.weightGoal);
    return { pct, txt: `${num(last)} kg sur un objectif de ${num(S.weightGoal)} kg` };
  }
  if (g.testKey && state.tests[g.testKey]?.length) {
    const t = TESTS.find(x => x.id === g.testKey), L = state.tests[g.testKey];
    const a = L[0].value, b = L.at(-1).value, target = parseFloat(t.goal);
    const pct = isNaN(target) || a === target ? null : (a - b) / (a - target);
    return { pct, txt: `Dernière mesure : ${num(b)} ${t.unit}, objectif ${t.goal}` };
  }
  return null;
}
function renderMoi() {
  const S = state.settings;
  const goals = GOALS.map(g => g.id === 'poids' ? { ...g, title: `Poids ${num(S.weightStart)} → ${num(S.weightGoal)} kg` } : g);
  $('#goals').innerHTML = goals.map(g => {
    const p = goalProgress(g), ok = !!state.goalsDone[g.id];
    return `<div class="card goal${ok ? ' ok' : ''}"><div class="row"><button class="check" role="checkbox" aria-checked="${ok}" data-goal="${g.id}" aria-label="Objectif atteint : ${esc(g.title)}"></button>
      <div class="grow"><h3>${esc(g.title)}</h3><span class="hint">${esc(g.meta)}</span></div></div>
      <p style="font-size:.9rem;margin-top:8px;color:var(--ink-2)">${esc(g.desc)}</p>
      ${p ? `${p.pct !== null ? `<div class="meter" role="progressbar" aria-valuenow="${Math.round(Math.max(0, Math.min(1, p.pct)) * 100)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.max(0, Math.min(1, p.pct)) * 100}%"></i></div>` : ''}<p class="hint" style="margin-top:6px">${esc(p.txt)}</p>` : ''}</div>`;
  }).join('');
  const notes = $('#notes'); if (document.activeElement !== notes) notes.value = state.notes;
  const f = $('#settingsForm');
  Object.entries(S).forEach(([k, v]) => { if (f.elements[k] && typeof v !== 'object') f.elements[k].value = v; });
  Object.entries(S.modules).forEach(([m, on]) => { if (f.elements['m_' + m]) f.elements['m_' + m].checked = on; });
  f.elements.eveningReminder.checked = !!S.eveningReminder;
}
$('#goals').addEventListener('click', e => {
  const b = e.target.closest('[data-goal]'); if (!b) return;
  const id = b.dataset.goal; state.goalsDone[id] = !state.goalsDone[id]; save(); renderMoi();
  if (state.goalsDone[id]) toast('Objectif atteint. Bien joué.');
});
let notesT;
$('#notes').addEventListener('input', e => { clearTimeout(notesT); notesT = setTimeout(() => { state.notes = e.target.value; save(); }, 400); });
$('#settingsForm').addEventListener('submit', async e => {
  e.preventDefault();
  const f = new FormData(e.target), S = state.settings;
  S.startDate = f.get('startDate') || S.startDate;
  ['weightStart', 'weightGoal', 'waterGoal', 'glass', 'rest', 'stepsGoal'].forEach(k => { const v = parseFloat(f.get(k)); if (v > 0) S[k] = v; });
  S.theme = f.get('theme');
  Object.keys(S.modules).forEach(m => S.modules[m] = f.get('m_' + m) === 'on');
  const wantReminder = f.get('eveningReminder') === 'on';
  if (wantReminder !== S.eveningReminder) {
    const ok = await setupReminder(wantReminder);
    S.eveningReminder = wantReminder && ok;
    if (wantReminder && !ok) toast('Autorise les notifications pour activer le rappel.');
  }
  applyTheme(); applyModules(); save(); viewPhase = null; toast('Réglages enregistrés.');
});
// Best effort : demande la permission de notifier et, si le téléphone le permet, une vérification périodique
// en tâche de fond (Android/Chrome seulement). L'heure n'est jamais garantie, iOS ne le supporte pas du tout :
// en repli, un rappel s'affiche aussi dans l'app si elle est rouverte le soir sans que la journée soit remplie.
async function setupReminder(on) {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return false;
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  if (!reg) return false;
  if (!on) {
    if ('periodicSync' in reg) { try { await reg.periodicSync.unregister('evening-check'); } catch (e) {} }
    return true;
  }
  if (!('Notification' in window)) return false;
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return false;
  if ('periodicSync' in reg) {
    try {
      const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
      if (status.state === 'granted') await reg.periodicSync.register('evening-check', { minInterval: 12 * 60 * 60 * 1000 });
    } catch (e) {}
  }
  return true;
}
// Repli dans l'app : si le rappel est activé, qu'il est tard et que la journée n'est pas remplie.
function maybeRemindTonight() {
  if (!state.settings.eveningReminder || new Date().getHours() < 20 || dayComplete(today())) return;
  const key = 'mc-reminded-' + today();
  try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch (e) {}
  toast('Un moment pour noter tes habitudes du jour ?', { label: "Aujourd'hui", run: () => go('today') });
}
function applyTheme() {
  const t = state.settings.theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  const dark = t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  $$('meta[name="theme-color"]').forEach(m => m.content = dark ? '#1E1718' : '#FAF3F0');
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { applyTheme(); render(); });

/* Sauvegarde / restauration / récap */
async function shareOrDownload(name, text, type) {
  const file = new File([text], name, { type });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return true; }
    catch (e) { if (e.name === 'AbortError') return false; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return true;
}
$('#exportBtn').onclick = async () => {
  const ok = await shareOrDownload('mon-cadre-sauvegarde-' + today() + '.json', JSON.stringify(state, null, 1), 'application/json');
  if (ok) { state.lastBackup = today(); save(); toast('Sauvegarde créée.'); }
};
$('#importFile').addEventListener('change', async e => {
  const file = e.target.files[0]; e.target.value = '';
  if (!file) return;
  let data;
  try { data = JSON.parse(await file.text()); } catch { toast('Ce fichier n\'est pas une sauvegarde Mon cadre.'); return; }
  if (!data || (!data.weights && !data.sessionLogs && !data.sessions)) { toast('Ce fichier n\'est pas une sauvegarde Mon cadre.'); return; }
  if (!await confirmDlg('Restaurer cette sauvegarde ?', 'Les données actuelles de l\'app seront remplacées par celles du fichier.', 'Restaurer')) return;
  state = normalize(data); save(); applyTheme(); render(); toast('Sauvegarde restaurée.');
});
$('#recapBtn').onclick = async () => {
  const m = today().slice(0, 7), label = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const ses = state.sessions.filter(s => s.date.startsWith(m));
  const W = state.weights.filter(w => w.date.startsWith(m));
  const waterDays = Object.entries(state.water).filter(([k]) => k.startsWith(m));
  const ph = phaseInfo();
  let t = `Mon cadre — récap de ${label}\nPhase ${ph.num} (${ph.name}), semaine ${ph.week}\n\n`;
  t += `Séances : ${ses.length}\n` + ses.map(s => `- ${fmtShort(s.date)} : ${s.free ? s.type + (s.min ? ' ' + s.min + ' min' : '') : s.label}${s.feel ? ' (' + s.feel + '/5)' : ''}${s.note ? ' — ' + s.note : ''}`).join('\n') + '\n\n';
  t += W.length >= 2 ? `Poids : ${num(W[0].value)} → ${num(W.at(-1).value)} kg (${signed(W.at(-1).value - W[0].value)} kg)\n` : W.length ? `Poids : ${num(W[0].value)} kg\n` : 'Poids : pas de pesée\n';
  if (waterDays.length) t += `Eau : ${num(waterDays.reduce((a, [, v]) => a + v, 0) / waterDays.length / 1000, 2)} L par jour en moyenne, objectif atteint ${waterDays.filter(([, v]) => v >= state.settings.waterGoal).length} jours\n`;
  const exNames = [...new Set(ses.flatMap(s => Object.keys(s.exos || {})))];
  if (exNames.length) {
    t += '\nExercices :\n';
    exNames.forEach(n => {
      const H = exoHistory(n).filter(h => h.date.startsWith(m));
      t += `- ${n} : ` + H.map(h => fmtShort(h.date) + ' ' + h.sets.map(s => (s.kg ? num(s.kg) + 'kg×' : '') + s.reps).join(', ')).join(' | ') + '\n';
    });
  }
  const stepDays = Object.entries(state.steps).filter(([k, v]) => k.startsWith(m) && v);
  if (stepDays.length) t += `Pas : ${num(stepDays.reduce((a, [, v]) => a + v, 0) / stepDays.length, 0)} par jour en moyenne, objectif atteint ${stepDays.filter(([, v]) => v >= state.settings.stepsGoal).length} jours\n`;
  const br_ = state.breath.filter(b => b.date.startsWith(m));
  if (br_.length) t += `\nRespiration : ${br_.length} séances, ${Math.round(br_.reduce((a, b) => a + b.sec, 0) / 60)} min\n`;
  if (state.notes.trim()) t += `\nNotes :\n${state.notes.trim()}\n`;
  if (navigator.share) { try { await navigator.share({ title: 'Mon récap', text: t }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(t); toast('Récap copié : colle-le où tu veux.'); }
  catch { shareOrDownload('mon-cadre-recap-' + m + '.txt', t, 'text/plain'); }
};

/* =========================================================
   DIALOGUES : fermeture par le fond (repli si closedby absent)
   ========================================================= */
$$('dialog').forEach(d => {
  d.addEventListener('click', e => { if (e.target.closest('[data-close]')) d.close(); });
  if (!('closedBy' in HTMLDialogElement.prototype) && d.getAttribute('closedby') === 'any') {
    d.addEventListener('click', e => {
      if (e.target !== d) return;
      const r = d.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom || e.clientX < r.left || e.clientX > r.right) d.close();
    });
  }
});

/* =========================================================
   INSTALLATION (PWA)
   ========================================================= */
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; $('#installBanner').hidden = false; });
window.addEventListener('appinstalled', () => { $('#installBanner').hidden = true; toast('Mon cadre est installée.'); });
if (!standalone && /iphone|ipad|ipod/i.test(navigator.userAgent)) $('#installBanner').hidden = false;
$('#installBtn').onclick = async () => {
  if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; $('#installBanner').hidden = true; }
  else $('#dlgInstall').showModal();
};
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW', err));
}

/* =========================================================
   DÉMARRAGE
   ========================================================= */
load();
applyTheme();
applyModules();
render();
// Raccourcis de l'icône (appui long sur Android)
const action = new URLSearchParams(location.search).get('action');
if (action) {
  history.replaceState(null, '', location.pathname);
  if (action === 'eau') addWater(1);
  if (action === 'seance') startSession();
}
// Rafraîchit au retour sur l'app (changement de jour, etc.)
document.addEventListener('visibilitychange', () => { if (!document.hidden && !$('#dlgSession').open) { render(); maybeRemindTonight(); } });
// Rappel de sauvegarde tous les 30 jours si des données existent
if (state.weights.length + state.sessions.length > 5 && (!state.lastBackup || (dateOf(today()) - dateOf(state.lastBackup)) / 864e5 > 30)) {
  setTimeout(() => toast('Pense à sauvegarder tes données.', { label: 'Sauvegarder', run: () => $('#exportBtn').click() }), 2500);
}
maybeRemindTonight();
