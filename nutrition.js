// Estimation des calories à partir d'une phrase libre, hors ligne.
// Base : table Ciqual 2020 (ANSES), chargée à la première utilisation depuis ciqual.json.
// « 2 œufs, 100 g de riz, une pomme et un café au lait » → une ligne par aliment, avec grammes et kcal.
const Nutrition = (() => {
  let foods = null, byCode = null, aliases = null, index = null, loading = null;

  const norm = s => String(s).toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, ' ').replace(/[^a-z0-9.,½/ ]/g, ' ').replace(/\s+/g, ' ').trim();
  const STOP = new Set(['de', 'd', 'du', 'des', 'la', 'le', 'les', 'l', 'au', 'aux', 'en', 'a', 'un', 'une', 'peu', 'mon', 'ma', 'mes', 'avec', 'sans']);
  const sing = w => w.length > 3 ? w.replace(/(s|x)$/, '') : w;
  const tokens = s => norm(s).split(' ').filter(w => w && !STOP.has(w)).map(sing);
  const key = s => tokens(s).join(' ');

  async function load() {
    if (foods) return;
    if (!loading) loading = fetch('ciqual.json').then(r => r.json()).then(d => {
      foods = d.foods;
      byCode = new Map(foods.map(f => [f[0], f]));
      aliases = d.aliases.flatMap(([words, code, g, label]) => words.map(w => ({ k: key(w), code, g, label })))
        .sort((a, b) => b.k.length - a.k.length);
      index = foods.map(f => {
        const t = tokens(f[1].split('(')[0]);
        return { f, t: new Set(t), first: t[0], n: t.length, avg: /aliment moyen|sans precision/.test(norm(f[1])) };
      });
    });
    return loading;
  }

  const NUMS = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, douze: 12, demi: .5, moitie: .5, quelques: 3, '½': .5 };
  // Unités → grammes (null = « une portion » de l'aliment)
  const UNITS = [
    [/^(kg|kilos?)$/, 1000, 'mass'], [/^(g|gr|grs|grammes?)$/, 1, 'mass'],
    [/^(l|litres?)$/, 1000, 'mass'], [/^cl$/, 10, 'mass'], [/^ml$/, 1, 'mass'],
    [/^(cuilleres? a cafe|cuilleres? cafe|cc|cac|c a c)$/, 5], [/^(cuilleres? a soupe|cuilleres? soupe|cs|cas|c a s|cuilleres?)$/, 15],
    [/^bols?$/, 250, 'bol'], [/^assiettes?$/, 250, 'assiette'], [/^verres?$/, 200, 'verre'], [/^tasses?$/, 200, 'tasse'],
    [/^canettes?$/, 330, 'canette'], [/^poignees?$/, 30, 'poignée'], [/^tranches?$/, 30, 'tranche'], [/^parts?$/, 120, 'part'],
    [/^(portions?|fois)$/, null, 'portion'], [/^morceaux?$/, 30, 'morceau'], [/^carres?$/, 10, 'carré'], [/^pots?$/, 125, 'pot'],
    [/^boules?$/, 60, 'boule'], [/^pincees?$/, 1], [/^(filets?|pieces?)$/, null, 'pièce'], [/^(barquettes?)$/, 200], [/^paquets?$/, 30]
  ];
  const UNIT_WORDS = /^(kg|kilos?|g|gr|grs|grammes?|l|litres?|cl|ml|cuilleres?( a)?( soupe| cafe)?|cc|cac|cs|cas|c a [sc]|bols?|assiettes?|verres?|tasses?|canettes?|poignees?|tranches?|parts?|portions?|fois|morceaux?|carres?|pots?|boules?|pincees?|filets?|pieces?|barquettes?|paquets?)\b/;

  function parseQty(seg) {
    let s = norm(seg), qty = null, unit = null;
    // nombre en chiffres (100, 1,5, 2.5, 100g collé)
    let m = s.match(/^(\d+)\s*\/\s*(\d+)\s*/) ;
    if (m) { qty = +m[1] / +m[2]; s = s.slice(m[0].length); }
    else if ((m = s.match(/^(\d+(?:[.,]\d+)?)\s*/))) { qty = parseFloat(m[1].replace(',', '.')); s = s.slice(m[0].length); }
    else {
      m = s.match(/^(une demi|un demi|demi|moitie|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|douze|quelques|½)\b\s*/);
      if (m) { qty = m[1].includes('demi') || m[1] === 'moitie' ? .5 : NUMS[m[1]]; s = s.slice(m[0].length); }
    }
    s = s.replace(/^(de |d |du |des )/, '');
    const u = s.match(UNIT_WORDS);
    if (u) {
      unit = u[0];
      s = s.slice(u[0].length).trim().replace(/^(a soupe |a cafe |soupe |cafe )/, '').replace(/^(de |d |du |des )/, '');
    }
    return { qty, unit, name: s.trim() };
  }

  function unitGrams(unit, alias) {
    if (!unit) return null;
    for (const [re, g, label] of UNITS) {
      if (!re.test(unit)) continue;
      if (label === 'mass') return { g, mass: true };
      if (alias && (g === null || (label && alias.label === label))) return { g: alias.g };
      return { g: g ?? (alias ? alias.g : 100) };
    }
    return null;
  }

  function search(name, limit = 6) {
    const q = tokens(name).filter(w => w.length >= 2);
    if (!q.length) return [];
    const scored = [];
    for (const it of index) {
      let hit = 0;
      q.forEach(w => { if (it.t.has(w) || [...it.t].some(t => t.length > 4 && w.length > 4 && (t.startsWith(w) || w.startsWith(t)))) hit++; });
      if (!hit) continue;
      const score = hit * 10 - it.n * .6 + (it.first === q[0] ? 4 : 0) + (it.avg ? 1.5 : 0);
      scored.push({ f: it.f, score, ratio: hit / q.length });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.filter(s => s.ratio >= .5).slice(0, limit).map(s => s.f);
  }

  // Tous les aliments courants présents dans le texte, sans chevauchement (le plus long d'abord).
  function findAliases(name) {
    let k = ' ' + key(name) + ' ';
    const found = [];
    for (const a of aliases) {
      const needle = ' ' + a.k + ' ';
      const at = k.indexOf(needle);
      if (at < 0) continue;
      found.push({ ...a, at });
      k = k.slice(0, at) + ' ' + '#'.repeat(a.k.length) + ' ' + k.slice(at + needle.length);
    }
    return found.sort((x, y) => x.at - y.at);
  }

  function item(f, g) {
    const r = v => Math.round(v * g / 100 * 10) / 10;
    return { code: f[0], name: f[1], g: Math.round(g), kcal: Math.round(f[2] * g / 100), p: r(f[3]), c: r(f[4]), f: r(f[5]) };
  }

  async function estimate(text) {
    await load();
    const segs = text.split(/[\n;+]|,(?!\d)|\s(?:et|avec|puis)\s/i).map(s => s.trim()).filter(Boolean);
    return segs.flatMap(seg => {
      const { qty, unit, name } = parseQty(seg);
      const found = findAliases(name);
      const cands = search(name);
      const qn = tokens(name).length;
      // Un plat qui correspond mot pour mot (ex. « pâtes bolognaise ») l'emporte sur l'aliment de base.
      const full = cands.find(c => { const t = new Set(tokens(c[1].split('(')[0])); return tokens(name).every(w => t.has(w)); });
      if (found.length > 1 && !(full && qn > 1)) {
        // « steak frites » : un aliment par mot-clé reconnu, la quantité s'applique au premier.
        return found.map((a, i) => ({ text: seg, found: true, guessed: false, alts: [{ code: a.code, name: byCode.get(a.code)[1] }], ...item(byCode.get(a.code), (i === 0 && qty && !unit ? qty : 1) * a.g) }));
      }
      const alias = found[0] || null;
      let f = full && (!alias || qn > alias.k.split(' ').length) ? full : alias ? byCode.get(alias.code) : cands[0];
      if (!f) return { text: seg, found: false };
      const alts = [f, ...cands.filter(c => c[0] !== f[0])].slice(0, 6);
      const ug = unitGrams(unit, alias);
      let g, guessed = false;
      if (ug?.mass) g = (qty ?? 1) * ug.g;
      else if (ug) g = (qty ?? 1) * ug.g;
      else if (alias) g = (qty ?? 1) * alias.g;
      else { g = (qty ?? 1) * 100; guessed = true; }
      return { text: seg, found: true, guessed, alts: alts.map(a => ({ code: a[0], name: a[1] })), ...item(f, g) };
    });
  }

  function recompute(it, code, g) {
    const f = byCode.get(code);
    return f ? { ...it, ...item(f, g) } : it;
  }

  return { load, estimate, recompute, search: async q => { await load(); return search(q, 8).map(f => ({ code: f[0], name: f[1], kcal: f[2] })); } };
})();
