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
  // Where each letter is said (makhraj), after Tajweed Rules of the Qur'an, ch. 2.
  const MAKHRAJ = {
    'ء': 'from the deepest part of the throat', 'ه': 'from the deepest part of the throat',
    'ع': 'from the middle of the throat', 'ح': 'from the middle of the throat',
    'غ': 'from the part of the throat closest to the mouth', 'خ': 'from the part of the throat closest to the mouth',
    'ق': 'from the deepest part of the tongue against the soft palate',
    'ك': 'from the back of the tongue against the palate, a little nearer the mouth than qaf',
    'ج': 'from the middle of the tongue against the palate', 'ش': 'from the middle of the tongue against the palate', 'ي': 'from the middle of the tongue against the palate',
    'ض': 'from the side of the tongue against the upper molars',
    'ل': 'from the front edges and tip of the tongue against the gums of the upper front teeth',
    'ن': 'from the tip of the tongue against the gums of the two upper front teeth',
    'ر': 'from the tip of the tongue, with its top, near the place of nun',
    'ط': 'from the top of the tip of the tongue against the gum line of the upper front teeth',
    'د': 'from the top of the tip of the tongue against the gum line of the upper front teeth',
    'ت': 'from the top of the tip of the tongue against the gum line of the upper front teeth',
    'ص': 'from the tip of the tongue, just above the lower front teeth, leaving a small gap (a whistle)',
    'ز': 'from the tip of the tongue, just above the lower front teeth, leaving a small gap (a whistle)',
    'س': 'from the tip of the tongue, just above the lower front teeth, leaving a small gap (a whistle)',
    'ظ': 'from the tip of the tongue against the edges of the upper front teeth',
    'ذ': 'from the tip of the tongue against the edges of the upper front teeth',
    'ث': 'from the tip of the tongue against the edges of the upper front teeth',
    'ف': 'from the inside of the lower lip against the tips of the upper front teeth',
    'و': 'by rounding the lips without closing them', 'م': 'by closing the lips', 'ب': 'by closing the lips firmly',
  };
  const HEAVY = 'خصضغطقظ', ITBAQ = 'صضطظ', HAMS = 'فحثهشخصسكت';
  // How to say the expected letter instead of the one heard.
  function howTo(exp, got) {
    const tips = [];
    if (MAKHRAJ[exp] && MAKHRAJ[exp] !== MAKHRAJ[got]) tips.push(`say it ${MAKHRAJ[exp]}`);
    if (HEAVY.includes(exp) && !HEAVY.includes(got)) tips.push(ITBAQ.includes(exp) ? 'make it heavy: raise the back of the tongue and press it to the palate' : 'make it heavy: raise the back of the tongue');
    else if (!HEAVY.includes(exp) && HEAVY.includes(got)) tips.push("keep it light: don't raise the back of the tongue");
    if (HAMS.includes(exp) !== HAMS.includes(got) && MAKHRAJ[exp] === MAKHRAJ[got]) tips.push(HAMS.includes(exp) ? 'let the breath flow with it' : 'voice it, without breath running');
    return tips.length ? ' — ' + tips.join('; ') : '';
  }
  const LETTER_NAMES = { 'ء': 'hamza', 'ب': 'ba', 'ت': 'ta', 'ث': 'tha', 'ج': 'jim', 'ح': 'ḥa', 'خ': 'kha', 'د': 'dal', 'ذ': 'dhal', 'ر': 'ra', 'ز': 'zay', 'س': 'sin', 'ش': 'shin', 'ص': 'ṣad', 'ض': 'ḍad', 'ط': 'ṭa', 'ظ': 'ẓa', 'ع': 'ʿayn', 'غ': 'ghayn', 'ف': 'fa', 'ق': 'qaf', 'ك': 'kaf', 'ل': 'lam', 'م': 'mim', 'ن': 'nun', 'ه': 'ha', 'و': 'waw', 'ي': 'ya' };
  const MADD_FOR = { 'َ': 'ا', 'ُ': 'ۥ', 'ِ': 'ۦ' };
  const HARAKA_NAMES = { 'َ': 'fatḥa', 'ُ': 'ḍamma', 'ِ': 'kasra', '۪': 'imala', '': 'sukun' };

  let units = [], byStr = new Map(), maxLen = 1, blank = -1, ref = null, index = null;

  function describe(str) {
    const u = { str, base: '', haraka: '', madd: 0, maddChar: '', ghunnah: false, qalqala: str.includes('ڇ'), shadda: false, sakt: str.includes('ۜ') };
    const chars = [...str];
    if (chars.every(c => MADD.includes(c))) { u.madd = chars.length; u.maddChar = chars[0]; u.base = chars[0]; return u; }
    for (const c of chars) {
      if (HARAKAT.includes(c)) u.haraka = c;
      else if (c === 'ڇ' || c === 'ۜ' || c === 'ؙ') continue;
      else u.base += c;
    }
    if (/^[ںن۾م]{3,}$/.test(u.base) || /[ں۾]/.test(u.base)) u.ghunnah = true;
    // A hidden nun/mim (ںںں, ۾۾۾: ikhfaʾ, iqlab) is one letter held with ghunnah, not a doubled one.
    if (u.base.length >= 2 && new Set(u.base).size === 1 && !/[ں۾]/.test(u.base)) { u.shadda = true; }
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
    // Alignment costs for every pair of units, worked out once (alignment runs these millions
    // of times while the reader recites).
    NU = units.length + 1;
    SUB = new Float32Array(NU * NU); INS = new Float32Array(NU); DEL = new Float32Array(NU);
    for (let x = 0; x < NU; x++) {
      INS[x] = units[x] && units[x].madd ? 0.5 : 1; DEL[x] = units[x] && units[x].madd ? 0.6 : 1;
      for (let y = 0; y < NU; y++) SUB[x * NU + y] = subCost0(x, y);
    }
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
        // A word whose first sound was joined to the previous word (idgham across words)
        // still has its own full start, for when you restart from it.
        if (!o.ibt && i > 0) { const own = mk(e[0]); if (own.length && own.join() !== o.wasl.join()) o.ibt = own; }
        o.last = i === E.length - 1;
        if (!o.wasl.length) { o.wasl = mk(e[0]); o.rules = o.wasl.map(() => null); }
      });
    }
    wordCache.set(key, out);
    return out;
  }
  function word(s, a, pos) { const w = ayahWords(s, a); return w ? w[pos - 1] || null : null; }

  // ---- alignment ----
  let NU = 0, SUB = null, INS = null, DEL = null;
  function subCost(x, y) { return x < NU && y < NU && x >= 0 && y >= 0 ? SUB[x * NU + y] : subCost0(x, y); }
  function subCost0(x, y) {
    if (x === y) return 0;
    const X = units[x], Y = units[y];
    if (!X || !Y) return 1;
    if (X.madd && Y.madd) return X.maddChar === Y.maddChar ? 0.25 : 0.6;
    if (X.letter && X.letter === Y.letter) return 0.4;
    // Letters from the same or a neighbouring articulation point line up first.
    if (X.letter && Y.letter && near(X.letter, Y.letter)) return 0.8;
    return 1;
  }
  const insCost = y => (y < NU ? INS[y] : units[y] && units[y].madd ? 0.5 : 1);
  const delCost = x => (x < NU ? DEL[x] : units[x] && units[x].madd ? 0.6 : 1);

  function distance(X, Y, y0, y1) {
    const n = X.length, m = y1 - y0;
    let prev = new Float32Array(m + 1), cur = new Float32Array(m + 1);
    const ys = new Int32Array(m);
    for (let j = 0; j < m; j++) ys[j] = Y[y0 + j].id;
    for (let j = 1; j <= m; j++) prev[j] = prev[j - 1] + insCost(ys[j - 1]);
    for (let i = 1; i <= n; i++) {
      const x = X[i - 1], dc = delCost(x), row = x < NU ? x * NU : -1;
      cur[0] = prev[0] + dc;
      for (let j = 1; j <= m; j++) {
        const yid = ys[j - 1];
        const sc = row >= 0 && yid < NU ? SUB[row + yid] : subCost0(x, yid);
        let v = prev[j] + dc; const b = cur[j - 1] + insCost(yid); if (b < v) v = b; const c = prev[j - 1] + sc; if (c < v) v = c;
        cur[j] = v;
      }
      const t = prev; prev = cur; cur = t;
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
    // Unit i is a ya with kasra followed by a long ī (يِ + ۦۦ).
    const yiBefore = i => units[X[i]] && units[X[i]].str === 'يِ' && units[X[i + 1]] && units[X[i + 1]].maddChar === 'ۦ';
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
      // Same letter, same doubling, only the haraka differs: that's a real haraka mistake.
      if (o.op === 'sub') { const v = units[H[o.y].id]; if (v && v.letter === u.letter && v.shadda === u.shadda && v.haraka !== u.haraka && !u.madd) return false; }
      // A join only makes a long vowel longer: a madd held shorter than needed is not a join.
      if (o.op === 'sub' && u.madd) { const v = units[H[o.y].id]; if (v && v.madd && v.madd < u.madd) return false; }
      const l = u.letter || u.maddChar;
      // A sound at the very start or end of a word that repeats the letter heard just across
      // the boundary is the join of the two words (idgham, a doubled letter), not an extra.
      const nb = o.op === 'ins' ? (o.x === 0 ? H[o.y - 1] : o.x >= X.length ? H[o.y + 1] : null) : null;
      if (nb && units[nb.id] && (units[nb.id].letter || units[nb.id].maddChar) === l) return true;
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
          // Stopping on the word: its final madd shortens or drops (a pronoun's silah goes).
          if (ok.includes(yu.madd) || (atEnd && (W.last || opts.pauseAfter))) continue;
          // The pronoun's ṣilah before a hamza (bihī innahu) follows the separated madd (4 or 5),
          // but the model hears it as 2 even from master reciters: its length isn't judged.
          if (rule === 'F' && o.x > 0 && units[X[o.x - 1]] && units[X[o.x - 1]].letter === 'ه') continue;
          if (Math.abs(yu.madd - xu.madd) === 1 && rule !== 'N') continue;
          if (ok.some(n => Math.abs(n - yu.madd) <= 1) && sure(H, o.y) < 0.9) continue;
          e = { type: 'madd', sev: 'tajweed', exp: xu.str, got: yu.str, msg: `${rule ? MADD_NAMES[rule] : 'Madd'}: hold for ${counts(ok)} (you held ${yu.madd})` };
        } else if (xu.letter && xu.letter === yu.letter) {
          if (xu.ghunnah !== yu.ghunnah) e = { type: 'ghunnah', sev: 'tajweed', exp: xu.str, got: yu.str, msg: ghunnahMsg(xu, nextLetter(o.x)) };
          else if (xu.qalqala !== yu.qalqala) e = { type: 'qalqala', sev: 'tajweed', exp: xu.str, got: yu.str, msg: xu.qalqala
            ? (atEnd && (W.last || opts.pauseAfter) ? `Qalqalah kubrā: when stopping, bounce the ${lname(xu.letter)} clearly` : `Qalqalah ṣughrā: bounce the ${lname(xu.letter)} lightly, without a vowel`)
            : `No qalqalah on the ${lname(xu.letter)}` };
          else if (xu.shadda !== yu.shadda) e = { type: 'shadda', sev: 'wrong', exp: xu.str, got: yu.str, msg: xu.shadda ? `Shaddah: double the ${LETTER_NAMES[xu.letter] || xu.letter}` : `No shaddah on the ${LETTER_NAMES[xu.letter] || xu.letter}` };
          // yastaḥyī, yuḥyī: the ya with kasra before a long ī is heard merged into it (ḥi + ī)
          else if (!xu.haraka && yu.haraka === 'ِ' && yiBefore(o.x + 1)) continue;
          else if (xu.haraka !== yu.haraka) {
            if (atEnd && (W.last || opts.pauseAfter)) continue; // the ending changes when stopping
            e = { type: 'haraka', sev: 'wrong', exp: xu.str, got: yu.str, msg: `Haraka: ${HARAKA_NAMES[xu.haraka]} on the ${LETTER_NAMES[xu.letter] || xu.letter}, not ${HARAKA_NAMES[yu.haraka]}` };
          } else e = { type: 'letter', sev: 'wrong', exp: xu.str, got: yu.str, msg: 'Pronunciation differs' };
        } else if (xu.madd && !yu.madd) {
          e = { type: 'letter', sev: 'wrong', exp: xu.str, got: yu.str, msg: `Expected a long vowel, heard ${yu.str}` };
        } else {
          e = { type: 'letter', sev: 'wrong', exp: xu.str, got: yu.str, msg: `Letter: ${LETTER_NAMES[xu.letter] || xu.str}, not ${LETTER_NAMES[yu.letter] || yu.str}${xu.letter && yu.letter ? howTo(xu.letter, yu.letter) : ''}` };
          if ((poor || !(xu.letter && yu.letter && near(xu.letter, yu.letter))) && sure(H, o.y) < 0.98) e.weak = true;
        }
      } else if (o.op === 'del') {
        if (heardMaybe(H, o.y, X[o.x], 0.03) || heardMaybe(H, o.y - 1, X[o.x], 0.03)) continue;
        if (yiBefore(o.x)) continue;
        if (edgeMerge(o)) continue;
        low = sure(H, o.y) < ms || sure(H, o.y - 1) < ms; var conf = Math.min(sure(H, o.y), sure(H, o.y - 1));
        if (atEnd && (W.last || opts.pauseAfter) && (xu.madd || !xu.base)) continue;
        // Sakt (a short stop without breath: ʿiwajā ۜ qayyiman, marqadinā ۜ hādhā, man ۜ rāq, bal ۜ rāna)
        // run through and merged into the next word.
        if (xu.sakt) e = { type: 'sakt', sev: 'tajweed', exp: xu.str, got: '', msg: "Sakt: stop briefly here without taking a breath, then go on; don't merge into the next word" };
        else if (xu.madd) {
          const ok = rule && MADD_OK[rule] ? MADD_OK[rule] : [xu.madd];
          e = { type: 'madd', sev: 'tajweed', exp: xu.str, got: '', msg: `${rule ? MADD_NAMES[rule] : 'Madd'}: lengthen for ${counts(ok)}` };
        } else if (xu.letter === 'ل' && !xu.haraka && !xu.shadda && !SUN.includes(nextLetter(o.x))) e = { type: 'missing', sev: 'wrong', exp: xu.str, got: '', msg: 'Lām qamariyyah: pronounce the lam clearly' };
        // The first sound after a pause is easily lost by the model (a consonant coming out of
        // silence): on its own that is doubtful.
        else e = { type: 'missing', sev: 'wrong', exp: xu.str, got: '', msg: `Missing: ${lname(xu.letter) || xu.str}`, weak: (poor && conf < 0.97) || (o.x === 0 && !!opts.afterPause && !list.some(q => q.op === 'ins' && Math.abs(q.y - o.y) <= 1)) };
      } else if (o.op === 'ins') {
        if (edgeMerge(o)) continue;
        low = sure(H, o.y) < ms; var conf = sure(H, o.y);
        // A stutter or a restart (the same sound again) is not a mistake.
        const prevH = H[o.y - 1], nextH = H[o.y + 1];
        if ((prevH && prevH.id === H[o.y].id) || (nextH && nextH.id === H[o.y].id)) continue;
        if (o.x < X.length && X[o.x] === H[o.y].id) continue;
        if (o.x > 0 && X[o.x - 1] === H[o.y].id) continue;
        if (yu.madd) {
          // A long vowel said where the vowel is short (inside the word, model sure) changes the word.
          if (yu.madd <= 2 && (sure(H, o.y) < 0.9 || o.x >= X.length || o.x === 0)) continue;
          const hidden = units[X[o.x]] && /[ں۾]/.test(units[X[o.x]].base);
          e = hidden ? { type: 'madd', sev: 'tajweed', exp: '', got: yu.str, msg: `Ikhfāʾ: keep the vowel before the hidden ${units[X[o.x]].base.includes('ں') ? 'nun' : 'mim'} short; the ghunnah is on the ${units[X[o.x]].base.includes('ں') ? 'nun' : 'mim'}, not the vowel` }
            : yu.madd <= 2 ? { type: 'madd', sev: 'wrong', exp: '', got: yu.str, msg: 'Extra long vowel: keep this vowel short' } : { type: 'madd', sev: 'tajweed', exp: '', got: yu.str, msg: 'Extra lengthening' };
        }
        else if ((yu.letter === 'ن' || yu.letter === 'م') && units[X[o.x]] && units[X[o.x]].shadda) {
          const l = units[X[o.x]].letter;
          e = { type: 'idgham', sev: 'tajweed', exp: '', got: yu.str, msg: 'لر'.includes(l) ? `Idghām without ghunnah: merge the nun completely into the ${lname(l)}` : yu.letter === 'م' && l === 'م' ? 'Idghām mithlayn: merge the mim into the next mim, with ghunnah' : `Idghām with ghunnah: merge the nun into the ${lname(l)}, keeping the ghunnah` };
        } else if (yu.letter === 'ل' && !yu.haraka && units[X[o.x]] && units[X[o.x]].shadda && SUN.includes(units[X[o.x]].letter)) {
          const l = units[X[o.x]].letter;
          e = o.x === 0 && 'رل'.includes(l)
            ? { type: 'idgham', sev: 'tajweed', exp: '', got: yu.str, msg: `Idghām of the lam sakinah: merge the lam into the ${lname(l)} (as in qur-rabbi)` }
            : { type: 'idgham', sev: 'wrong', exp: '', got: yu.str, msg: `Lām shamsiyyah: don't say the lam; double the ${lname(l)}` };
        }
        else if (heardMaybe(H, o.y, -1, 1)) continue;
        else e = { type: 'extra', sev: 'wrong', exp: '', got: yu.str, msg: `Extra sound: ${yu.str}`, weak: sure(H, o.y) < 0.9 };
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
    if (errs.length && errs.every(e => e.weak) && errs.length < (poor ? 3 : 2)) return [];
    const baseMs = opts.minSure == null ? 0.8 : opts.minSure;
    if (!errs.length && doubt.length >= (poor ? 3 : 2)) return doubt.filter(e => !(level === 'words' && (e.type === 'haraka' || e.type === 'shadda')));
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
    // The same word is often tried at the same place many times over (looking back for a
    // repeat, ahead for a skip): work each one out once per check.
    const memo = new Map();
    const BM = (q, yy, ap) => {
      const key = q * 4194304 + yy * 2 + (ap ? 1 : 0);
      let m = memo.get(key);
      if (m === undefined) { const w = W(q); m = w ? bestMatch(w, W(q + 1), H, yy, ap, final) : null; memo.set(key, m); }
      return m && Object.assign({}, m);
    };
    // An opening taʿawwudh or basmala before the first ayah is not part of the check.
    const ends = [];   // where in H each judged word ends (for the app to resume from)
    if (!opts.noOpener && words.length) {
      // Al-Fatiha's basmala is its first ayah, so only the taʿawwudh is skipped before it.
      for (const k of (words[0].s === 1 && words[0].a === 1 ? ['0:1'] : ['0:1', '0:2'])) {
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
      if (!w) { status[p] = status[p] || null; ends[p] = y; p++; continue; }
      if (pauses && pauses.has(y)) afterPause = true;
      const need = Math.max(w.wasl.length, w.waqf ? w.waqf.length : 0) + 2;
      if (!final && H.length - y < need && !(pauses && [...pauses].some(q => q > y))) break;
      const cur = BM(p, y, afterPause);
      if (!cur) break;

      // How well do the next few words read from here, starting at word q?
      const run = (q, yy, n) => {
        let cost = 0, len = 0, used = 0;
        for (let i = 0; i < n && q + i < words.length && yy < H.length; i++) {
          const wq = W(q + i); if (!wq) continue;
          const m = BM(q + i, yy, i === 0);
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
        if (back) { p -= back; ends.length = Math.min(ends.length, p); afterPause = true; continue; }
        // Skipped ahead (a word, a phrase or an ayah)? Not if the next words line up right
        // after this word's sounds: then the word was said, only wrongly.
        const after = cur.norm > 0.3 && p + 1 < words.length ? run(p + 1, y + cur.k, 3) : null;
        if (cur.norm > 0.3 && !(after && after.norm < 0.2 && cur.norm < 0.75)) {
          let skip = 0, bestSkip = null;
          for (let j = 1; j <= 25 && p + j < words.length; j++) {
            if (!W(p + j)) continue;
            const f = run(p + j, y, 3);
            if (f && f.used >= Math.min(2, words.length - p - j) && f.norm < 0.4 && f.norm < here.norm - 0.2 && (!bestSkip || f.norm < bestSkip.norm - 0.05)) { skip = j; bestSkip = f; }
          }
          if (skip) { for (let j = 0; j < skip; j++) { status[p + j] = 'skip'; errors[p + j] = null; ends[p + j] = y; } p += skip; continue; }
          // A stray sound before the word?
          const nx = BM(p, y + 1, afterPause);
          if (nx && nx.norm < cur.norm - 0.3) { y++; continue; }
        }
      }
      const pauseAfter = !!(pauses && pauses.has(y + cur.k));
      // While still reciting, judge a word only once the next sounds have come in.
      if (!final && !pauseAfter && y + cur.k + (opts.settle == null ? 4 : opts.settle) > H.length) break;
      const nw = W(p + 1);
      let errs = explain(w, cur.form, H, y, y + cur.k, Object.assign({}, opts, { pauseAfter, afterPause, nextUnit: nw && !pauseAfter ? nw.wasl[0] : -1 }));
      // A long vowel straight after the word's last short vowel, of the same kind (ۥۥ after
      // ḍamma…), lengthens that vowel: e.g. ʿalā l- for ʿala l- (a madd kept before a sukun).
      // It belongs to this word, not to the start of the next.
      const lastU = units[cur.form.units[cur.form.units.length - 1]], ex = H[y + cur.k], exU = ex && units[ex.id];
      if (!pauseAfter && nw && exU && exU.madd === 2 && lastU && lastU.haraka && MADD_FOR[lastU.haraka] === exU.maddChar
          && sure(H, y + cur.k) >= 0.95 && !(pauses && pauses.has(y + cur.k + 1)) && units[nw.wasl[0]] && !units[nw.wasl[0]].madd
          && (opts.level || 'tajweed') !== 'words' && !(opts.room > (opts.roomPoor == null ? 0.08 : opts.roomPoor))) {
        errs = errs.concat([{ type: 'madd', sev: 'wrong', exp: '', got: exU.str, msg: `Extra long vowel at the end: keep the ${HARAKA_NAMES[lastU.haraka]} short` }]);
        cur.k++;
      }
      // An extra sound said between this word and the next (the next word reads clearly better
      // without it) is this word's mistake, not the next word's.
      else if (!pauseAfter && nw && exU && !exU.madd && y + cur.k + 1 < H.length && sure(H, y + cur.k) >= 0.95
          && (opts.level || 'tajweed') !== 'words' && !(opts.room > (opts.roomPoor == null ? 0.08 : opts.roomPoor))
          && units[nw.wasl[0]] && exU.letter !== units[nw.wasl[0]].letter && (!lastU || exU.letter !== lastU.letter)) {
        const a = BM(p + 1, y + cur.k, false), b = BM(p + 1, y + cur.k + 1, false);
        if (a && b && b.norm < 0.12 && b.norm + 0.2 < a.norm) {
          errs = errs.concat([{ type: 'extra', sev: 'wrong', exp: '', got: exU.str, msg: `Extra sound at the end: ${exU.str}` }]);
          cur.k++;
        }
      }
      // The recording stopped in the middle of this word: don't judge the unsaid part.
      if (final && y + cur.k >= H.length && errs.length && errs.every(e => e.type === 'missing' || (e.type === 'madd' && !e.got))) {
        const said = cur.k / Math.max(1, cur.form.units.length);
        if (said < 1) { if (said < 0.5) break; errs = []; }
      }
      errors[p] = errs.length ? errs : null;
      status[p] = !errs.length ? 'ok' : errs.some(e => e.sev === 'wrong') ? 'wrong' : 'tajweed';
      y += cur.k; ends[p] = y; p++;
      afterPause = !!(pauses && pauses.has(y));
    }
    return { status, errors, pos: p, ends };
  }

  /* Live checking while the reader recites. Keeps state between calls (st = {} to start):
     - words well behind the reader (15 words back) are settled and kept, and only the
       rest is checked again, so each update stays fast however long the recitation;
     - the room (echo/noise) estimate carries over and is refined as more is heard;
     - a mark is shown only once it has held for two updates in a row (or the word is
       settled, or on the final check), so a mark doesn't flash up and vanish. */
  const KEEP_BACK = 15;
  function live(st, words, H, pauses, opts) {
    opts = opts || {};
    if (st.p0 == null) Object.assign(st, { p0: 0, y0: 0, status: [], errors: [], flagged: new Map(), shown: new Map() });
    const P = new Set(); (pauses || []).forEach(q => { if (q >= st.y0) P.add(q - st.y0); });
    const stats = { eq: 0, unsure: 0 };
    const o = Object.assign({}, opts, { noOpener: st.p0 > 0, stats });
    if (st.room != null) o.room = st.room;
    let r = check(words.slice(st.p0), H.slice(st.y0), P, o);
    if (st.room == null && r.room != null) st.room = r.room;
    else if (st.room != null && stats.eq >= 12) st.room = 0.7 * st.room + 0.3 * (stats.unsure / stats.eq);
    const n = words.length, status = new Array(n).fill(null), errors = new Array(n).fill(null);
    for (let i = 0; i < st.p0; i++) { status[i] = st.status[i]; errors[i] = st.errors[i]; }
    r.status.forEach((x, i) => { status[st.p0 + i] = x; errors[st.p0 + i] = r.errors[i]; });
    const pos = st.p0 + r.pos;
    const raw = status.slice(), rawE = errors.slice();
    // Hide a fresh mark until it has held for two updates in a row.
    if (!opts.final) {
      for (let i = st.p0; i < pos; i++) {
        const bad = status[i] && status[i] !== 'ok';
        const c = bad ? (st.flagged.get(i) || 0) + 1 : 0;
        if (c) st.flagged.set(i, c); else st.flagged.delete(i);
        if (bad && c < (opts.hold || 2)) { status[i] = 'ok'; errors[i] = null; }
        else if (bad) st.shown.set(i, [status[i], errors[i]]);
      }
    } else {
      // A mark the reader has already seen stays in the final result.
      st.shown.forEach(([x, e], i) => { if (i < pos && (!status[i] || status[i] === 'ok')) { status[i] = x; errors[i] = e; } });
    }
    // Settle the words well behind the reader.
    const k = r.pos - KEEP_BACK;
    if (!opts.final && k > 0 && r.ends[k - 1] != null) {
      for (let i = 0; i < k; i++) { st.status[st.p0 + i] = raw[st.p0 + i]; st.errors[st.p0 + i] = rawE[st.p0 + i]; status[st.p0 + i] = raw[st.p0 + i]; errors[st.p0 + i] = rawE[st.p0 + i]; }
      st.y0 += r.ends[k - 1]; st.p0 += k;
    }
    return { status, errors, pos, room: st.room };
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
  // A basmala (Al-Fatiha 1:1) heard first may open any surah: decide from what follows it.
  // Where an opening taʿawwudh (أعوذ بالله من الشيطان الرجيم) heard first ends in H; -1 if none,
  // null if it may still be going on.
  function openerEnd(H) {
    const ws = ayahWords(0, 1); if (!ws) return -1;
    const seq = [].concat(...ws.slice(0, -1).map(w => w.wasl));
    let best = null;
    for (const last of [ws[ws.length - 1].wasl, ws[ws.length - 1].waqf].filter(Boolean)) {
      const X = seq.concat(last);
      if (H.length < X.length + 2) {                 // not all heard yet: is it the start of it?
        const n = distance(X.slice(0, Math.max(3, H.length - 1)), H, 0, H.length) / Math.max(3, H.length - 1);
        if (n < 0.35) return null;
        continue;
      }
      for (let kk = Math.max(1, X.length - 4); kk <= X.length + 4 && kk <= H.length; kk++) {
        const n = distance(X, H, 0, kk) / X.length;
        if (!best || n < best.n) best = { n, kk };
      }
    }
    return best && best.n < 0.35 ? best.kk : -1;
  }
  function find(H) {
    const oe = openerEnd(H);
    if (oe === null) return null;
    if (oe > 0) { const r = findAfterOpener(H.slice(oe)); return r && Object.assign(r, { skip: r.skip + oe }); }
    return findAfterOpener(H);
  }
  function findAfterOpener(H) {
    const r = find0(H, false);
    if (!r || !(r.s === 1 && r.a === 1)) return r;
    const w11 = ayahWords(1, 1); if (!w11) return r;
    let left = 0; for (let i = r.pos - 1; i < w11.length; i++) left += w11[i].wasl.length;
    const end = r.skip + left, rest = H.slice(end);
    if (rest.length < 10) return null;                 // wait for the words after the basmala
    const r2 = find0(rest, true);
    if (!r2) return null;
    if (r2.s === 1 && r2.a === 2) return r;            // Al-Fatiha: start at its basmala
    return Object.assign(r2, { skip: r2.skip + end });
  }
  function find0(H, noBasmala) {
    if (H.length < 8) return null;
    const { seq, at, tri } = buildIndex();
    const votes = new Map(), first = new Map();   // first: the earliest heard sound that matched there
    for (let i = 0; i + 2 < H.length; i++) {
      const l = tri.get(H[i].id * 65536 + H[i + 1].id * 256 + H[i + 2].id);
      if (!l || l.length > 40) continue;
      l.forEach(q => { const st = q - i; votes.set(st, (votes.get(st) || 0) + 1); if (!first.has(st)) first.set(st, i); });
    }
    // Candidate places (nearby offsets merged), strongest first.
    const cands = [...votes.entries()].sort((a, b) => b[1] - a[1]);
    const places = [];
    for (const [st, n] of cands) {
      if (noBasmala) { const t = at[Math.max(0, Math.min(at.length - 1, st + 2))]; if (t && t[0] === 1 && t[1] === 1) continue; }
      const p = places.find(x => Math.abs(x.st - st) <= 4);
      if (p) { p.n += n; p.first = Math.min(p.first, first.get(st)); } else if (places.length < 6) places.push({ st, n, first: first.get(st) });
    }
    if (!places.length) return null;
    let best = places[0];
    const second = places[1] ? places[1].n : 0;
    if (!(best.n >= 3 && best.n - second >= 2)) {
      // Not clear from the votes (a reader's slips break up the sound patterns): compare
      // what was heard with the text at each candidate, sound by sound.
      const L = Math.min(H.length, 40), Hs = H.slice(-L);
      const scored = places.filter(p => p.n >= 2).map(p => {
        const from = Math.max(0, p.st + H.length - L - 3), X = seq.slice(from, from + L + 6);
        let bestD = Infinity;
        for (let k = Math.max(1, L - 6); k <= L + 6 && k <= X.length; k++) bestD = Math.min(bestD, distance(X.slice(0, k), Hs, 0, L) / L);
        return { p, d: bestD };
      }).sort((a, b) => a.d - b.d);
      if (!scored.length || scored[0].d > 0.35 || (scored[1] && scored[1].d - scored[0].d < 0.15 && Math.abs(scored[1].p.st - scored[0].p.st) > 4) || H.length < 12) return null;
      best = scored[0].p;
    }
    // Start at the first whole word heard that matches there (sounds before it, such as a
    // basmala, belong to no ayah here).
    let k = Math.max(0, -best.st, best.first || 0);
    while (best.st + k < at.length && best.st + k > 0 && at[best.st + k - 1] === at[best.st + k]) k++;
    if (best.st + k >= at.length || k >= H.length) return null;
    const [s, a, pos] = at[best.st + k];
    return { s, a, pos, skip: k, score: best.n };
  }

  const api = { init, tokenize, word, check, live, find, units: () => units, get blank() { return blank; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Tajweed = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
