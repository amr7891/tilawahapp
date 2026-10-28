/* Tajweed checker.
   Compares the phoneme units the speech model heard with the reference phonemes
   of each word (Hafs ʿan ʿAsim, from the open quran-transcript phonetizer, in
   data/quran-ph.json) and reports, word by word, what was correct and what was
   not: letters, harakat, shaddah, madd length, ghunnah, ikhfa, idgham, qalqalah.

   Reference entry per word: [wasl, waqf|0, ibtida|0, rules?]
     wasl   = the word as read in continuous recitation
     waqf   = the word when you stop on it (0 = same)
     ibtida = the word when you start from it (0 = same)
     rules  = [[from, to, code]] char ranges in wasl: N normal madd (2), F munfasil,
              T muttasil, P muttasil at a stop, A ʿarid lis-sukun, L lazim, E leen, Q qalqalah
   No text is generated here: every reference comes from the data file. */
(function (root) {
  'use strict';

  const HARAKAT = 'َُِ۪';
  const MADD = 'اۦۥـ';
  // Madd names and lengths (in counts) for Hafs ʿan ʿAsim by way of ash-Shatibiyyah, as taught in
  // Tajweed Rules of the Qur'an (K. Czerepinski), ch. 7: natural 2; separated (munfasil) 4 or 5,
  // two not allowed; attached (muttasil) 4 or 5, and 6 too when stopping on its hamza; ʿarid
  // lis-sukun and leen when stopping 2, 4 or 6; compulsory (lazim) 6.
  const MADD_NAMES = { N: 'Natural madd (ṭabīʿī)', F: 'Separated madd (munfaṣil)', T: 'Attached madd (muttaṣil)', P: 'Attached madd (muttaṣil) when stopping', A: 'Madd ʿāriḍ lis-sukūn (stopping)', L: 'Compulsory madd (lāzim)', E: 'Madd līn (stopping)' };
  const MADD_OK = { N: [2], F: [4, 5], T: [4, 5], P: [4, 5, 6], A: [2, 4, 6], L: [6], E: [2, 4, 6] };
  const THROAT = 'ءهعحغخ', SUN = 'تثدذرزسشصضطظلن', QALQALA = 'قطبجد';
  const counts = ok => ok.length === 1 ? `${ok[0]} counts` : `${ok.slice(0, -1).join(', ')} or ${ok[ok.length - 1]} counts`;
  const lname = l => LETTER_NAMES[l] || l;
  // Letters a reader can mix up: the same or a neighbouring articulation point (makhraj,
  // ch. 2) or a heavy/light pair. A swap between letters far apart (fa for kaf) is almost
  // always the model mishearing, not the reader.
  const NEAR = ['ءهعحغخ', 'غخقك', 'قكج', 'جشي', 'ضلد', 'ضظ', 'نرل', 'طدت', 'صسز', 'سثش', 'ظذثز', 'فثب', 'بمو', 'هة'];
  const near = (a, b) => a === b || NEAR.some(g => g.includes(a) && g.includes(b));
  const LETTER_NAMES = { 'ء': 'hamza', 'ب': 'ba', 'ت': 'ta', 'ث': 'tha', 'ج': 'jim', 'ح': 'ḥa', 'خ': 'kha', 'د': 'dal', 'ذ': 'dhal', 'ر': 'ra', 'ز': 'zay', 'س': 'sin', 'ش': 'shin', 'ص': 'ṣad', 'ض': 'ḍad', 'ط': 'ṭa', 'ظ': 'ẓa', 'ع': 'ʿayn', 'غ': 'ghayn', 'ف': 'fa', 'ق': 'qaf', 'ك': 'kaf', 'ل': 'lam', 'م': 'mim', 'ن': 'nun', 'ه': 'ha', 'و': 'waw', 'ي': 'ya' };
  const HARAKA_NAMES = { 'َ': 'fatḥa', 'ُ': 'ḍamma', 'ِ': 'kasra', '۪': 'imala', '': 'sukun' };

  let units = [], byStr = new Map(), maxLen = 1, blank = -1, ref = null, index = null;

  function describe(str) {
    const u = { str, base: '', haraka: '', madd: 0, maddChar: '', ghunnah: false, qalqala: str.includes('ڇ'), shadda: false };
    const chars = [...str];
    if (chars.every(c => MADD.includes(c))) { u.madd = chars.length; u.maddChar = chars[0]; u.base = chars[0]; return u; }
    for (const c of chars) {
      if (HARAKAT.includes(c)) u.haraka = c;
      else if (c === 'ڇ' || c === 'ۜ' || c === 'ؙ') continue;
      else u.base += c;
    }
    if (/^[ںن۾م]{3,}$/.test(u.base) || /[ں۾]/.test(u.base)) u.ghunnah = true;
    if (u.base.length >= 2 && new Set(u.base).size === 1) { u.shadda = true; }
    u.letter = u.base[0] === 'ں' ? 'ن' : u.base[0] === '۾' ? 'م' : u.base[0];
    return u;
  }

  function init(tokensTxt, refData) {
    units = []; byStr = new Map(); maxLen = 1;
    tokensTxt.split('\n').forEach(line => {
      const i = line.lastIndexOf(' ');
      if (i < 0) return;
      const s = line.slice(0, i), id = +line.slice(i + 1);
      if (s === '<blank>') { blank = id; return; }
      units[id] = describe(s); units[id].id = id;
      byStr.set(s, id); maxLen = Math.max(maxLen, [...s].length);
    });
    ref = refData; index = null;
  }

  // Longest-match tokenizer, keeping each unit's character range.
  function tokenize(ph) {
    const chars = [...ph], out = [];
    let i = 0;
    while (i < chars.length) {
      let found = null;
      for (let L = Math.min(maxLen, chars.length - i); L > 0; L--) {
        const id = byStr.get(chars.slice(i, i + L).join(''));
        if (id !== undefined) { found = { id, from: i, to: i + L }; break; }
      }
      if (!found) { i++; continue; }
      out.push(found); i = found.to;
    }
    return out;
  }

  const wordCache = new Map();
  // Units and rules for every word of an ayah. The joined forms are tokenized as one
  // stream, because the model hears some sounds across word boundaries as one unit
  // (e.g. the idgham in مَن يَقُول is heard as a single يييَ).
  function ayahWords(s, a) {
    const key = `${s}:${a}`;
    if (wordCache.has(key)) return wordCache.get(key);
    const E = ref[key];
    let out = null;
    if (E) {
      const mk = ph => tokenize(ph).map(t => t.id);
      const starts = []; let all = '';
      E.forEach(e => { starts.push([...all].length); all += e[0]; });
      const toks = tokenize(all);
      out = E.map(() => ({ wasl: [], rules: [] }));
      toks.forEach(t => {
        let w = 0; while (w + 1 < starts.length && starts[w + 1] <= t.from) w++;
        const local = t.from - starts[w], localTo = t.to - starts[w];
        const hit = (E[w][3] || []).find(x => x[0] < localTo && x[1] > local);
        out[w].wasl.push(t.id); out[w].rules.push(hit ? hit[2] : null);
      });
      out.forEach((o, i) => {
        const e = E[i];
        o.waqf = e[1] ? mk(e[1]) : null;
        o.ibt = e[2] ? mk(e[2]) : null;
        o.last = i === E.length - 1;
        if (!o.wasl.length) { o.wasl = mk(e[0]); o.rules = o.wasl.map(() => null); }
      });
    }
    wordCache.set(key, out);
    return out;
  }
  function word(s, a, pos) { const w = ayahWords(s, a); return w ? w[pos - 1] || null : null; }

  // ---- alignment ----
  function subCost(x, y) {
    if (x === y) return 0;
    const X = units[x], Y = units[y];
    if (!X || !Y) return 1;
    if (X.madd && Y.madd) return X.maddChar === Y.maddChar ? 0.25 : 0.6;
    if (X.letter && X.letter === Y.letter) return 0.4;
    // Letters from the same or a neighbouring articulation point line up first.
    if (X.letter && Y.letter && near(X.letter, Y.letter)) return 0.8;
    return 1;
  }
  const insCost = y => (units[y] && units[y].madd ? 0.5 : 1);
  const delCost = x => (units[x] && units[x].madd ? 0.6 : 1);

  function distance(X, Y, y0, y1) {
    const n = X.length, m = y1 - y0;
    let prev = new Float32Array(m + 1), cur = new Float32Array(m + 1);
    for (let j = 1; j <= m; j++) prev[j] = prev[j - 1] + insCost(Y[y0 + j - 1].id);
    for (let i = 1; i <= n; i++) {
      cur[0] = prev[0] + delCost(X[i - 1]);
      for (let j = 1; j <= m; j++) {
        const yid = Y[y0 + j - 1].id;
        cur[j] = Math.min(prev[j] + delCost(X[i - 1]), cur[j - 1] + insCost(yid), prev[j - 1] + subCost(X[i - 1], yid));
      }
      [prev, cur] = [cur, prev];
    }
    return prev[m];
  }

  function ops(X, Y, y0, y1) {
    const n = X.length, m = y1 - y0;
    const D = Array.from({ length: n + 1 }, () => new Float32Array(m + 1));
    for (let j = 1; j <= m; j++) D[0][j] = D[0][j - 1] + insCost(Y[y0 + j - 1].id);
    for (let i = 1; i <= n; i++) {
      D[i][0] = D[i - 1][0] + delCost(X[i - 1]);
      for (let j = 1; j <= m; j++) {
        const yid = Y[y0 + j - 1].id;
        D[i][j] = Math.min(D[i - 1][j] + delCost(X[i - 1]), D[i][j - 1] + insCost(yid), D[i - 1][j - 1] + subCost(X[i - 1], yid));
      }
    }
    const out = [];
    let i = n, j = m;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && Math.abs(D[i][j] - (D[i - 1][j - 1] + subCost(X[i - 1], Y[y0 + j - 1].id))) < 1e-4) { out.push({ op: X[i - 1] === Y[y0 + j - 1].id ? 'eq' : 'sub', x: i - 1, y: y0 + j - 1 }); i--; j--; }
      else if (i > 0 && Math.abs(D[i][j] - (D[i - 1][j] + delCost(X[i - 1]))) < 1e-4) { out.push({ op: 'del', x: i - 1, y: y0 + j }); i--; }
      else { out.push({ op: 'ins', x: i, y: y0 + j - 1 }); j--; }
    }
    return out.reverse();
  }

  // Did the model also consider the expected unit at this point? (avoid false alarms)
  function heardMaybe(H, y, x, tau) {
    for (const k of [y, y - 1, y + 1]) {
      const h = H[k];
      if (!h || !h.alt) continue;
      for (const [id, p] of h.alt) if (id === x && p >= tau) return true;
    }
    return false;
  }

  function maddLen(u) { return u && u.madd ? u.madd : 0; }
  // How sure the model was of the sound it wrote down (0–1).
  function sure(H, y) {
    const h = H[y];
    if (!h || !h.alt) return 1;
    const own = h.alt.find(a => a[0] === h.id);
    return own ? own[1] : 1;
  }

  // What the book calls the rule behind a ghunnah difference (chapters 3–5).
  function ghunnahMsg(xu, next) {
    const nun = xu.letter === 'ن', L = lname(next);
    if (xu.ghunnah) {
      if (xu.base.includes('ں')) return `Ikhfāʾ: hide the nun with ghunnah before the ${L}, tongue near but not touching`;
      if (xu.base.includes('۾')) return next === 'ب' ? 'Iqlāb / ikhfāʾ shafawī: before the ba, hide the mim with ghunnah, lips lightly closed' : 'Hide the mim with ghunnah';
      if (xu.shadda) return `Ghunnah: hold the doubled ${lname(xu.letter)} for 2 counts`;
      return 'Ghunnah: hold the nasal sound for 2 counts';
    }
    if (nun && THROAT.includes(next)) return `Iẓhār: say the nun clearly, with no ghunnah, before the throat letter ${L}`;
    if (xu.letter === 'م' && (next === 'و' || next === 'ف')) return `Iẓhār shafawī: close the lips fully on the mim before the ${L}; don't hide it`;
    return `No ghunnah on the ${lname(xu.letter)} here`;
  }

  // Explain the differences in one word.
  function explain(W, form, H, y0, y1, opts) {
    const X = form.units, errs = [];
    // The letter that follows unit i (in this word, or the next word's first sound).
    const nextLetter = i => { const u = i + 1 < X.length ? units[X[i + 1]] : units[opts.nextUnit]; return u ? (u.letter || u.maddChar) : ''; };
    const level = opts.level || 'tajweed', tau = opts.tau == null ? 0.12 : opts.tau;
    const list = ops(X, H, y0, y1);
    // In an echoey or noisy room the model is unsure of more sounds; then only report what it
    // is very sure of, and treat a single slip in a word as doubtful.
    const room = opts.room || 0, poor = room > (opts.roomPoor == null ? 0.08 : opts.roomPoor);
    const ms = Math.max(opts.minSure == null ? 0.8 : opts.minSure, poor ? (room > 0.26 ? 0.95 : 0.9) : 0);
    // At a word's edges the model may hear the joining sound of two words as one unit
    // (وو + وَ heard as وووَ): a difference there in that same letter is not a mistake.
    const edgeLetter = new Set();
    [X[0], X[X.length - 1]].forEach(id => { const u = units[id]; if (u) edgeLetter.add(u.letter || u.maddChar); });
    const edgeMerge = o => {
      const atEdge = o.x <= 0 || o.x >= X.length - 1;
      if (!atEdge) return false;
      const u = o.op === 'ins' ? units[H[o.y].id] : units[X[o.x]];
      if (!u) return false;
      const l = u.letter || u.maddChar;
      return edgeLetter.has(l) && (l === 'و' || l === 'ي' || l === 'ۥ' || l === 'ۦ' || u.shadda || (o.op !== 'sub' && (H[o.y - 1] && units[H[o.y - 1].id] && units[H[o.y - 1].id].letter === l || H[o.y + 1] && units[H[o.y + 1].id] && units[H[o.y + 1].id].letter === l)));
    };
    const doubt = [];   // differences the model was unsure of: one is noise, several are a mistake
    for (let k = 0; k < list.length; k++) {
      const o = list[k];
      let low = false;
      const xu = o.op !== 'ins' ? units[X[o.x]] : null;
      const yu = o.op === 'sub' || o.op === 'ins' ? units[H[o.y].id] : null;
      const rule = o.op !== 'ins' && form.rules ? form.rules[o.x] : null;
      const atEnd = o.op !== 'ins' && o.x >= X.length - 1;
      let e = null;
      if (o.op === 'eq') { if (opts.stats) { opts.stats.eq++; if (sure(H, o.y) < 0.9) opts.stats.unsure++; } continue; }
      if (o.op === 'sub') {
        if (heardMaybe(H, o.y, X[o.x], tau)) continue;
        if (edgeMerge(o)) continue;
        low = sure(H, o.y) < ms; var conf = sure(H, o.y);
        if (xu.madd && yu.madd) {
          const ok = rule && MADD_OK[rule] ? MADD_OK[rule] : [xu.madd];
          if (ok.includes(yu.madd) || (atEnd && W.last)) continue;
          if (Math.abs(yu.madd - xu.madd) === 1 && rule !== 'N') continue;
          if (ok.some(n => Math.abs(n - yu.madd) <= 1) && sure(H, o.y) < 0.9) continue;
          e = { type: 'madd', sev: 'tajweed', exp: xu.str, got: yu.str, msg: `${rule ? MADD_NAMES[rule] : 'Madd'}: hold for ${counts(ok)} (you held ${yu.madd})` };
        } else if (xu.letter && xu.letter === yu.letter) {
          if (xu.ghunnah !== yu.ghunnah) e = { type: 'ghunnah', sev: 'tajweed', exp: xu.str, got: yu.str, msg: ghunnahMsg(xu, nextLetter(o.x)) };
          else if (xu.qalqala !== yu.qalqala) e = { type: 'qalqala', sev: 'tajweed', exp: xu.str, got: yu.str, msg: xu.qalqala
            ? (atEnd && (W.last || opts.pauseAfter) ? `Qalqalah kubrā: when stopping, bounce the ${lname(xu.letter)} clearly` : `Qalqalah ṣughrā: bounce the ${lname(xu.letter)} lightly, without a vowel`)
            : `No qalqalah on the ${lname(xu.letter)}` };
          else if (xu.shadda !== yu.shadda) e = { type: 'shadda', sev: 'wrong', exp: xu.str, got: yu.str, msg: xu.shadda ? `Shaddah: double the ${LETTER_NAMES[xu.letter] || xu.letter}` : `No shaddah on the ${LETTER_NAMES[xu.letter] || xu.letter}` };
          else if (xu.haraka !== yu.haraka) {
            if (atEnd && (W.last || opts.pauseAfter)) continue; // the ending changes when stopping
            e = { type: 'haraka', sev: 'wrong', exp: xu.str, got: yu.str, msg: `Haraka: ${HARAKA_NAMES[xu.haraka]} on the ${LETTER_NAMES[xu.letter] || xu.letter}, not ${HARAKA_NAMES[yu.haraka]}` };
          } else e = { type: 'letter', sev: 'wrong', exp: xu.str, got: yu.str, msg: 'Pronunciation differs' };
        } else if (xu.madd && !yu.madd) {
          e = { type: 'letter', sev: 'wrong', exp: xu.str, got: yu.str, msg: `Expected a long vowel, heard ${yu.str}` };
        } else {
          e = { type: 'letter', sev: 'wrong', exp: xu.str, got: yu.str, msg: `Letter: ${LETTER_NAMES[xu.letter] || xu.str}, not ${LETTER_NAMES[yu.letter] || yu.str}` };
          if ((poor || !(xu.letter && yu.letter && near(xu.letter, yu.letter))) && sure(H, o.y) < 0.98) e.weak = true;
        }
      } else if (o.op === 'del') {
        if (heardMaybe(H, o.y, X[o.x], 0.03) || heardMaybe(H, o.y - 1, X[o.x], 0.03)) continue;
        if (edgeMerge(o)) continue;
        low = sure(H, o.y) < ms || sure(H, o.y - 1) < ms; var conf = Math.min(sure(H, o.y), sure(H, o.y - 1));
        if (atEnd && (W.last || opts.pauseAfter) && (xu.madd || !xu.base)) continue;
        if (xu.madd) {
          const ok = rule && MADD_OK[rule] ? MADD_OK[rule] : [xu.madd];
          e = { type: 'madd', sev: 'tajweed', exp: xu.str, got: '', msg: `${rule ? MADD_NAMES[rule] : 'Madd'}: lengthen for ${counts(ok)}` };
        } else if (xu.letter === 'ل' && !xu.haraka && !xu.shadda && !SUN.includes(nextLetter(o.x))) e = { type: 'missing', sev: 'wrong', exp: xu.str, got: '', msg: 'Lām qamariyyah: pronounce the lam clearly' };
        else e = { type: 'missing', sev: 'wrong', exp: xu.str, got: '', msg: `Missing: ${lname(xu.letter) || xu.str}`, weak: poor };
      } else if (o.op === 'ins') {
        if (edgeMerge(o)) continue;
        low = sure(H, o.y) < ms; var conf = sure(H, o.y);
        // A stutter or a restart (the same sound again) is not a mistake.
        const prevH = H[o.y - 1], nextH = H[o.y + 1];
        if ((prevH && prevH.id === H[o.y].id) || (nextH && nextH.id === H[o.y].id)) continue;
        if (o.x < X.length && X[o.x] === H[o.y].id) continue;
        if (o.x > 0 && X[o.x - 1] === H[o.y].id) continue;
        if (yu.madd) { if (yu.madd <= 2) continue; e = { type: 'madd', sev: 'tajweed', exp: '', got: yu.str, msg: 'Extra lengthening' }; }
        else if ((yu.letter === 'ن' || yu.letter === 'م') && units[X[o.x]] && units[X[o.x]].shadda) {
          const l = units[X[o.x]].letter;
          e = { type: 'idgham', sev: 'tajweed', exp: '', got: yu.str, msg: 'لر'.includes(l) ? `Idghām without ghunnah: merge the nun completely into the ${lname(l)}` : yu.letter === 'م' && l === 'م' ? 'Idghām mithlayn: merge the mim into the next mim, with ghunnah' : `Idghām with ghunnah: merge the nun into the ${lname(l)}, keeping the ghunnah` };
        } else if (yu.letter === 'ل' && !yu.haraka && units[X[o.x]] && units[X[o.x]].shadda && SUN.includes(units[X[o.x]].letter)) e = { type: 'idgham', sev: 'wrong', exp: '', got: yu.str, msg: `Lām shamsiyyah: don't say the lam; double the ${lname(units[X[o.x]].letter)}` };
        else if (heardMaybe(H, o.y, -1, 1)) continue;
        else e = { type: 'extra', sev: 'wrong', exp: '', got: yu.str, msg: `Extra sound: ${yu.str}`, weak: sure(H, o.y) < 0.98 };
      }
      if (!e) continue;
      if (low) { if (e.sev === 'wrong' && e.type !== 'extra') { e.conf = conf; doubt.push(e); } continue; }
      if (level === 'words' && e.sev !== 'wrong') continue;
      if (level === 'words' && (e.type === 'haraka' || e.type === 'shadda')) continue;
      if (level === 'harakat' && e.sev === 'tajweed') continue;
      errs.push(e);
    }
    // One unlikely slip in an otherwise right word is the model, not the reader; several
    // (a different word was said) are reported.
    if (errs.length === 1 && errs[0].weak) return [];
    const baseMs = opts.minSure == null ? 0.8 : opts.minSure;
    if (!errs.length && (doubt.length >= (poor ? 3 : 2) || (poor && doubt.length >= 2 && doubt.some(e => e.conf >= baseMs)))) return doubt.filter(e => !(level === 'words' && (e.type === 'haraka' || e.type === 'shadda')));
    return errs;
  }
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  // Forms of word W allowed here: as joined, as started after a pause, as stopped on.
  // Rules for the started / stopped forms: shared start or end lines up with the
  // joined form; a madd made by stopping is a madd ʿarid (2, 4 or 6 counts).
  function rulesFor(W, U, kind) {
    const k = W[kind + 'Rules'];
    if (k) return k;
    const r = new Array(U.length).fill(null);
    if (kind === 'ibt') { const sh = U.length - W.wasl.length; W.rules.forEach((x, i) => { if (i + sh >= 0 && i + sh < r.length && U[i + sh] === W.wasl[i]) r[i + sh] = x; }); }
    else W.rules.forEach((x, i) => { if (i < r.length && U[i] === W.wasl[i]) r[i] = x; });
    // A madd near the end that differs from the joined form was made by stopping: madd ʿarid
    // (a stopped attached madd keeps its own rule, P).
    const sh = U.length - W.wasl.length;
    for (let i = U.length - 1; i >= Math.max(0, U.length - 3); i--) {
      if (!units[U[i]] || !units[U[i]].madd) continue;
      const j = i - (kind === 'ibt' ? sh : 0), orig = W.rules[j];
      if (!r[i] || (U[i] !== W.wasl[j] && orig !== 'T' && orig !== 'P')) r[i] = orig === 'T' ? 'P' : 'A';
      break;
    }
    W[kind + 'Rules'] = r;
    return r;
  }
  function formsOf(W, afterPause) {
    const f = [{ units: W.wasl, rules: W.rules, kind: 'wasl' }];
    if (W.ibt) f.push({ units: W.ibt, rules: rulesFor(W, W.ibt, 'ibt'), kind: 'ibt' });
    if (W.waqf) f.push({ units: W.waqf, rules: rulesFor(W, W.waqf, 'waqf'), kind: 'waqf' });
    return f;
  }

  // Best way to read H from y as word W (and the start of the next word).
  function bestMatch(W, next, H, y, afterPause, final) {
    let best = null;
    for (const form of formsOf(W, afterPause)) {
      const L = form.units.length;
      for (let k = Math.max(1, L - 3); k <= L + 3 && y + k <= H.length; k++) {
        let c = distance(form.units, H, y, y + k);
        if (next && y + k < H.length) {
          const nx = next.wasl.slice(0, 2), m = Math.min(2, H.length - y - k);
          c += 0.5 * distance(nx, H, y + k, y + k + m) / 2;
        }
        const norm = c / Math.max(L, 1);
        if (!best || norm < best.norm - 1e-6) best = { form, k, norm };
      }
    }
    return best;
  }

  /* words: expected words in reading order, each {s, a, pos}
     H: heard units [{id, alt: [[id, p]], t}], pauses: Set of unit indices that follow a pause
     Returns { status[], errors[], pos } like Matcher.align. */
  function check(words, H, pauses, opts) {
    opts = opts || {};
    const final = !!opts.final;
    // How echoey/noisy the room is: the share of recent sounds the model was unsure of.
    // Measured only on sounds that matched the text, so the reader's own mistakes don't count.
    if (opts.room == null) {
      const stats = { eq: 0, unsure: 0 };
      const first = check(words, H, pauses, Object.assign({}, opts, { room: 0, stats }));
      if (stats.eq < 12) return first;
      const room = stats.unsure / stats.eq;
      if (room <= (opts.roomPoor == null ? 0.08 : opts.roomPoor)) return Object.assign(first, { room });
      return Object.assign(check(words, H, pauses, Object.assign({}, opts, { room })), { room });
    }
    const status = new Array(words.length).fill(null), errors = new Array(words.length).fill(null);
    let p = 0, y = 0, afterPause = true, guard = 0;
    const W = j => (words[j] ? (words[j].free ? null : word(words[j].s, words[j].a, words[j].pos)) : null);
    // An opening taʿawwudh or basmala before the first ayah is not part of the check.
    if (words.length && !(words[0].s === 1 && words[0].a === 1)) {
      for (const k of ['0:1', '0:2']) {
        const ws = ayahWords(+k[0], +k[2]); if (!ws) continue;
        const seq = [].concat(...ws.slice(0, -1).map(w => w.wasl));
        let best = null;
        for (const last of [ws[ws.length - 1].wasl, ws[ws.length - 1].waqf].filter(Boolean)) {
          const X = seq.concat(last);
          for (let kk = Math.max(1, X.length - 4); kk <= X.length + 4 && y + kk <= H.length; kk++) {
            const n = distance(X, H, y, y + kk) / X.length;
            if (!best || n < best.n) best = { n, kk };
          }
        }
        if (best && best.n < 0.35) { y += best.kk; afterPause = true; }
        else if (!final && H.length - y < 12) return { status, errors, pos: 0 };
      }
    }
    while (p < words.length && y < H.length && guard++ < 20000) {
      const w = W(p);
      if (!w) { status[p] = status[p] || null; p++; continue; }
      if (pauses && pauses.has(y)) afterPause = true;
      const need = Math.max(w.wasl.length, w.waqf ? w.waqf.length : 0) + 2;
      if (!final && H.length - y < need && !(pauses && [...pauses].some(q => q > y))) break;
      const cur = bestMatch(w, W(p + 1), H, y, afterPause, final);
      if (!cur) break;

      // How well do the next few words read from here, starting at word q?
      const run = (q, yy, n) => {
        let cost = 0, len = 0, used = 0;
        for (let i = 0; i < n && q + i < words.length && yy < H.length; i++) {
          const wq = W(q + i); if (!wq) continue;
          const m = bestMatch(wq, W(q + i + 1), H, yy, i === 0, final);
          if (!m) break;
          cost += m.norm * wq.wasl.length; len += wq.wasl.length; yy += m.k; used++;
        }
        return used ? { norm: cost / len, used } : null;
      };
      if (cur.norm > 0.2) {
        const here = run(p, y, 3);
        // Went back to repeat earlier words? The new attempt replaces the old one.
        let back = 0;
        for (let j = 1; j <= 12 && p - j >= 0; j++) {
          if (!W(p - j)) continue;
          const b = run(p - j, y, 3);
          if (b && b.norm < 0.25 && b.norm < here.norm - 0.2) { back = j; break; }
        }
        if (back) { p -= back; afterPause = true; continue; }
        // Skipped ahead (a word, a phrase or an ayah)?
        if (cur.norm > 0.3) {
          let skip = 0, bestSkip = null;
          for (let j = 1; j <= 25 && p + j < words.length; j++) {
            if (!W(p + j)) continue;
            const f = run(p + j, y, 3);
            if (f && f.used >= Math.min(2, words.length - p - j) && f.norm < 0.4 && f.norm < here.norm - 0.2 && (!bestSkip || f.norm < bestSkip.norm - 0.05)) { skip = j; bestSkip = f; }
          }
          if (skip) { for (let j = 0; j < skip; j++) { status[p + j] = 'skip'; errors[p + j] = null; } p += skip; continue; }
          // A stray sound before the word?
          const nx = bestMatch(w, W(p + 1), H, y + 1, afterPause, final);
          if (nx && nx.norm < cur.norm - 0.3) { y++; continue; }
        }
      }
      const pauseAfter = !!(pauses && pauses.has(y + cur.k));
      // While still reciting, judge a word only once the next sounds have come in.
      if (!final && !pauseAfter && y + cur.k + (opts.settle == null ? 4 : opts.settle) > H.length) break;
      const nw = W(p + 1);
      let errs = explain(w, cur.form, H, y, y + cur.k, Object.assign({}, opts, { pauseAfter, nextUnit: nw && !pauseAfter ? nw.wasl[0] : -1 }));
      // The recording stopped in the middle of this word: don't judge the unsaid part.
      if (final && y + cur.k >= H.length && errs.length && errs.every(e => e.type === 'missing' || (e.type === 'madd' && !e.got))) {
        const said = cur.k / Math.max(1, cur.form.units.length);
        if (said < 1) { if (said < 0.5) break; errs = []; }
      }
      errors[p] = errs.length ? errs : null;
      status[p] = !errs.length ? 'ok' : errs.some(e => e.sev === 'wrong') ? 'wrong' : 'tajweed';
      y += cur.k; p++;
      afterPause = !!(pauses && pauses.has(y));
    }
    return { status, errors, pos: p };
  }

  // ---- finding where the reciter is (recite anywhere) ----
  function buildIndex() {
    if (index) return index;
    const seq = [], at = [], tri = new Map();
    Object.keys(ref).forEach(k => {
      const [s, a] = k.split(':').map(Number);
      if (!s) return;
      ref[k].forEach((_, i) => { const w = word(s, a, i + 1); if (!w) return; const tag = [s, a, i + 1]; w.wasl.forEach(u => { seq.push(u); at.push(tag); }); });
    });
    for (let i = 0; i + 2 < seq.length; i++) {
      const key = seq[i] * 65536 + seq[i + 1] * 256 + seq[i + 2];
      const l = tri.get(key); if (l) { if (l.length < 60) l.push(i); } else tri.set(key, [i]);
    }
    index = { seq, at, tri };
    return index;
  }
  function find(H) {
    if (H.length < 8) return null;
    const { at, tri } = buildIndex();
    const votes = new Map();
    for (let i = 0; i + 2 < H.length; i++) {
      const l = tri.get(H[i].id * 65536 + H[i + 1].id * 256 + H[i + 2].id);
      if (!l || l.length > 40) continue;
      l.forEach(q => { const st = q - i; votes.set(st, (votes.get(st) || 0) + 1); });
    }
    let best = null, bn = 0, second = 0;
    votes.forEach((n, st) => { if (n > bn) { second = bn; bn = n; best = st; } else if (n > second) second = n; });
    if (best === null || bn < 3) return null;
    let near = 0; votes.forEach((n, st) => { if (st !== best && Math.abs(st - best) <= 4) near = Math.max(near, n); });
    if (near === second) second = 0;
    if (bn - second < 2) return null;
    // Start at the first whole word heard.
    let k = Math.max(0, -best);
    while (best + k < at.length && best + k > 0 && at[best + k - 1] === at[best + k]) k++;
    if (best + k >= at.length || k >= H.length) return null;
    const [s, a, pos] = at[best + k];
    return { s, a, pos, skip: k, score: bn };
  }

  const api = { init, tokenize, word, check, find, units: () => units, get blank() { return blank; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Tajweed = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
