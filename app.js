/* ══════════════════════════════════════════════════════════════════
   SCOUT OVER PRO v7 — Riscritto da zero
   - API-Football: partite, stats, live
   - The Odds API: volumi Betfair Exchange
   - Goal Pressure Index (GPI) con alert
   - iOS Safari compatible layout
══════════════════════════════════════════════════════════════════ */

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

/* ── STORAGE ──────────────────────────────────────────────────── */
const LS = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};

/* ── STATO GLOBALE ────────────────────────────────────────────── */
const S = {
  page: 'home',
  status: 'idle',
  matches: [],
  live: {},
  oddsData: {},
  esiti: LS.get('esiti') || {},
  goalAlerts: {},
  error: '',
  apiKey: LS.get('apiKey') || '',
  oddsApiKey: LS.get('oddsApiKey') || '',
  mkt: 'pt',
  conf: 'all',
  region: LS.get('region') || 'all',
  autoOn: false,
  autoSec: LS.get('autoSec') || 60,
  countdown: 0,
  dismissed: LS.get('dismissed') || false,
  leagues: null
};
let _autoTimer = null, _cdTimer = null;

/* ── COSTANTI ─────────────────────────────────────────────────── */
const REGIONS = {
  all:      { l: '🌐 Tutti',   c: '#00ff88' },
  europe:   { l: '🌍 Europa',  c: '#00aaff' },
  uk:       { l: '🏴 UK',      c: '#ff4466' },
  americas: { l: '🌎 Americhe',c: '#ff8800' },
  asia:     { l: '🌏 Asia',    c: '#ffcc00' }
};

const ALL_LEAGUES = [
  {id:135,n:'Serie A',       f:'🇮🇹',r:'europe',  s:2025,on:true},
  {id:136,n:'Serie B',       f:'🇮🇹',r:'europe',  s:2025,on:false},
  {id:140,n:'La Liga',       f:'🇪🇸',r:'europe',  s:2025,on:true},
  {id:78, n:'Bundesliga',    f:'🇩🇪',r:'europe',  s:2025,on:true},
  {id:79, n:'Bundesliga 2',  f:'🇩🇪',r:'europe',  s:2025,on:false},
  {id:61, n:'Ligue 1',       f:'🇫🇷',r:'europe',  s:2025,on:true},
  {id:88, n:'Eredivisie',    f:'🇳🇱',r:'europe',  s:2025,on:true},
  {id:94, n:'Liga Portugal', f:'🇵🇹',r:'europe',  s:2025,on:true},
  {id:144,n:'Jupiler Pro',   f:'🇧🇪',r:'europe',  s:2025,on:true},
  {id:203,n:'Super Lig',     f:'🇹🇷',r:'europe',  s:2025,on:true},
  {id:2,  n:'Champions Lge', f:'🇪🇺',r:'europe',  s:2025,on:true},
  {id:3,  n:'Europa League', f:'🇪🇺',r:'europe',  s:2025,on:true},
  {id:848,n:'Conference Lge',f:'🇪🇺',r:'europe',  s:2025,on:false},
  {id:39, n:'Premier League',f:'🏴', r:'uk',      s:2025,on:true},
  {id:40, n:'Championship',  f:'🏴', r:'uk',      s:2025,on:true},
  {id:45, n:'FA Cup',        f:'🏴', r:'uk',      s:2025,on:true},
  {id:179,n:'Scottish Prem.',f:'🏴', r:'uk',      s:2025,on:true},
  {id:71, n:'Brasileirao A', f:'🇧🇷',r:'americas',s:2025,on:true},
  {id:128,n:'Liga Argentina',f:'🇦🇷',r:'americas',s:2025,on:true},
  {id:130,n:'Liga MX',       f:'🇲🇽',r:'americas',s:2025,on:true},
  {id:253,n:'MLS',           f:'🇺🇸',r:'americas',s:2025,on:true},
  {id:98, n:'J-League',      f:'🇯🇵',r:'asia',    s:2025,on:true},
  {id:292,n:'K-League',      f:'🇰🇷',r:'asia',    s:2025,on:true},
  {id:307,n:'Saudi Pro Lge', f:'🇸🇦',r:'asia',    s:2025,on:true},
];

// Mappa sport key The Odds API
const ODDS_KEYS = {
  135:'soccer_italy_serie_a', 136:'soccer_italy_serie_b',
  140:'soccer_spain_la_liga', 78:'soccer_germany_bundesliga',
  61:'soccer_france_ligue_one', 88:'soccer_netherlands_eredivisie',
  94:'soccer_portugal_primeira_liga', 39:'soccer_epl',
  40:'soccer_england_championship', 2:'soccer_uefa_champs_league',
  3:'soccer_uefa_europa_league', 71:'soccer_brazil_campeonato',
  128:'soccer_argentina_primera_division', 130:'soccer_mexico_ligamx',
  253:'soccer_usa_mls', 98:'soccer_japan_j_league'
};

const MKT_L = ['Ov 0.5 PT', 'Ov 0.5 FIN', 'Ov 1.5 FIN'];
const MKT_K = ['pt', 'f05', 'f15'];
const MKT_C = ['#00aaff', '#00cc66', '#ffcc00'];

/* ══════════════════════════════════════════════════════════════════
   IPC — Formula principale
══════════════════════════════════════════════════════════════════ */
function calcIPC(p, mkt) {
  if (!p || p.veto_forma || p.veto_quota) {
    return { ipc: 0, hr: 0, fok: false, veto: true, vl: null, vc: '#556' };
  }
  let ovc, ovt, mgc, mgt, h2h, sc, st, smg, sh;
  if (mkt === 'pt') {
    [ovc,ovt,mgc,mgt,h2h,sc,st,smg,sh] = [p.ov05pt_c,p.ov05pt_t,p.mgpt_c,p.mgpt_t,p.h2h_pt,75,70,1.4,65];
  } else if (mkt === 'f05') {
    [ovc,ovt,mgc,mgt,h2h,sc,st,smg,sh] = [p.ov05f_c,p.ov05f_t,p.mgf_c,p.mgf_t,p.h2h_f05,75,70,1.4,62];
  } else {
    [ovc,ovt,mgc,mgt,h2h,sc,st,smg,sh] = [p.ov15f_c,p.ov15f_t,p.mgf_c,p.mgf_t,p.h2h_f15,72,68,2.5,58];
  }

  let v = 0.2*mgc + 0.2*mgt + 0.25*(ovc/100) + 0.25*(ovt/100) + 0.05*(h2h/100);
  v += [p.topAttacco, (mgc+mgt)>=1.2, p.derby, p.motivazioni].filter(Boolean).length * 0.03;

  // Bonus volume da The Odds API
  let vl = null, vc = '#3a6a8f';
  const od = S.oddsData[p.id];
  if (od) {
    const om = mkt === 'f15' ? od.over15 : mkt === 'f05' ? od.over05 : od.over05;
    if (om && om.avg && om.avg > 0) {
      const ip = (1 / om.avg) * 100;
      if (ip >= 70) { v += 0.04; vl = '💰 Volume Alto'; vc = '#00ff88'; }
      else if (ip >= 60) { v += 0.02; vl = '📈 Vol. Medio'; vc = '#ffcc00'; }
      else if (ip < 45) { v -= 0.02; vl = '⚠️ Bassa liq.'; vc = '#ff4466'; }
      else { vl = '🔘 Neutro'; vc = '#3a6a8f'; }
      if (om.betfair && om.avg && (om.avg - om.betfair) > 0.08) {
        v += 0.02; vl = '🎯 Sharp Money'; vc = '#ffd700';
      }
    }
  }

  const fok = ovc >= sc && ovt >= st && (mgc+mgt) >= smg && h2h >= sh;
  const hr = Math.min(0.97, 0.5 + v*0.55 + (fok ? 0.05 : 0));
  return { ipc: +v.toFixed(3), hr: +hr.toFixed(3), fok, veto: false, vl, vc };
}

function getRating(hr, veto) {
  if (veto)      return { l:'VETO', c:'#556677', bg:'rgba(80,100,120,.12)', br:'rgba(80,100,120,.3)' };
  if (hr >= 0.88) return { l:'ALTA', c:'#00ff88', bg:'rgba(0,255,136,.07)',  br:'rgba(0,255,136,.35)' };
  if (hr >= 0.75) return { l:'MEDIA',c:'#ffcc00', bg:'rgba(255,204,0,.07)',  br:'rgba(255,204,0,.3)' };
  return               { l:'BASSA',c:'#ff4466', bg:'rgba(255,68,102,.05)', br:'rgba(255,68,102,.2)' };
}

/* ══════════════════════════════════════════════════════════════════
   GOAL PRESSURE INDEX
══════════════════════════════════════════════════════════════════ */
function calcGPI(matchId) {
  const d = S.live[matchId] || {};
  const mn = d.minute || 0;
  if (!['1H','2H','ET'].includes(d.status)) return null;

  let gpi = 0, factors = [];

  // Minuto
  const ms = mn >= 80 ? 30 : mn >= 70 ? 22 : mn >= 60 ? 16 : mn >= 45 ? 20 : mn >= 35 ? 14 : mn >= 20 ? 8 : 4;
  gpi += ms;
  factors.push({ l: 'Minuto ' + mn + "'", v: ms, c: '#3a6a8f' });

  // Corner
  const cT = (d.cornerH||0) + (d.cornerA||0);
  if (cT > 0) {
    const cs = Math.min(25, cT * 2.5);
    gpi += cs;
    factors.push({ l: 'Corner: ' + cT, v: cs, c: '#ff8800' });
  }

  // Tiri in porta
  const sT = (d.shotOnH||0) + (d.shotOnA||0);
  if (sT > 0) {
    const ss = Math.min(20, sT * 2);
    gpi += ss;
    factors.push({ l: 'Tiri porta: ' + sT, v: ss, c: '#00aaff' });
  }

  // Tiri totali
  const stT = (d.shotH||0) + (d.shotA||0);
  if (stT > 0) {
    const sts = Math.min(10, stT * 0.8);
    gpi += sts;
    factors.push({ l: 'Tiri totali: ' + stT, v: sts, c: '#00cc66' });
  }

  // Flusso Betfair
  const od = S.oddsData[matchId];
  const omk = S.mkt === 'f15' ? od && od.over15 : od && od.over05;
  if (omk && omk.sharpSignal && omk.sharpSignal > 3) {
    const vs = Math.min(10, omk.sharpSignal * 2);
    gpi += vs;
    factors.push({ l: 'Flusso Betfair: ' + omk.sharpSignal.toFixed(1) + '%', v: vs, c: '#ffd700' });
  }

  return { gpi: Math.min(100, Math.round(gpi)), factors, minute: mn };
}

function getGPILevel(g) {
  if (g >= 80) return { l: 'ALLERTA GOL',    c: '#ff4466', bg: 'rgba(255,68,102,.12)',  pulse: true };
  if (g >= 60) return { l: 'Alta pressione', c: '#ff8800', bg: 'rgba(255,136,0,.08)',  pulse: false };
  if (g >= 40) return { l: 'Attenzione',     c: '#ffcc00', bg: 'rgba(255,204,0,.06)',  pulse: false };
  return              { l: 'Calma',          c: '#00ff88', bg: 'rgba(0,255,136,.04)',  pulse: false };
}

function triggerAlert(mid, gpi, match) {
  if (!S.goalAlerts[mid]) S.goalAlerts[mid] = { n60: false, n80: false, last: 0 };
  const a = S.goalAlerts[mid];
  if (gpi >= 80 && !a.n80) { a.n80 = true; showAlert(match, gpi, '🔴 ALLERTA MASSIMA'); }
  else if (gpi >= 60 && !a.n60) { a.n60 = true; showAlert(match, gpi, '🟠 Alta pressione gol'); }
  if (gpi < 30 && a.last >= 60) { a.n60 = false; a.n80 = false; }
  a.last = gpi;
}

function showAlert(match, gpi, title) {
  if (navigator.vibrate) navigator.vibrate([200,100,200,100,400]);
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      new Notification(title + ' — ' + match.casa + ' vs ' + match.trasferta, {
        body: 'GPI: ' + gpi + '/100', icon: 'icon-192.png',
        tag: 'gpi-' + match.id, renotify: true
      });
    } catch(e) {}
  }
  // Banner in-app
  const old = document.getElementById('gal-banner');
  if (old) old.remove();
  const lv = getGPILevel(gpi);
  const b = document.createElement('div');
  b.id = 'gal-banner';
  b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;padding:12px 16px;' +
    'background:' + lv.bg + ';border-bottom:2px solid ' + lv.c + ';cursor:pointer;' +
    'animation:slideDown .3s ease;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)';
  b.innerHTML = '<div style="display:flex;align-items:center;gap:10px">' +
    '<div style="font-size:24px">⚽</div>' +
    '<div style="flex:1"><div style="font-size:12px;font-weight:800;color:' + lv.c + '">' + title + '</div>' +
    '<div style="font-size:11px;color:#e0f0ff;margin-top:2px">' + match.casa + ' vs ' + match.trasferta + '</div>' +
    '<div style="font-size:10px;color:#3a6a8f">GPI ' + gpi + '/100 — tocca per i dettagli</div></div>' +
    '<span style="font-size:22px;font-weight:900;color:' + lv.c + ';font-family:monospace">' + gpi + '</span>' +
    '<button onclick="document.getElementById('gal-banner').remove()" ' +
    'style="background:none;border:none;color:#3a6a8f;font-size:20px;cursor:pointer;padding:4px;margin-left:4px">✕</button></div>';
  b.addEventListener('click', function(e) {
    if (e.target.tagName === 'BUTTON') return;
    goTo('analisi'); b.remove();
  });
  document.body.prepend(b);
  setTimeout(function() { if (b.parentNode) b.remove(); }, 15000);
}

function buildGPIWidget(mid) {
  const d = S.live[mid];
  if (!d || !d.gpi) return '';
  const lv = getGPILevel(d.gpi);
  const facs = d.gpiFactors || [];
  let h = '<div class="gpibox" style="border-color:' + lv.c + '44;background:' + lv.bg + '">';
  h += '<div class="gpitop"><span class="gpitit">⚽ Goal Pressure Index · ' + (d.minute||0) + "'</span>";
  h += '<span class="gpival" style="color:' + lv.c + '">' + d.gpi + '/100</span></div>';
  h += '<div class="gpitrack"><div class="gpifill" style="width:' + d.gpi + '%;background:' + lv.c + '"></div></div>';
  h += '<div class="gpilvl" style="color:' + lv.c + '">' + lv.l + '</div>';
  if (facs.length) {
    h += '<div class="gpifactors">';
    facs.forEach(function(f) {
      h += '<div class="gpif"><span>' + f.l + '</span><span style="color:' + f.c + ';font-weight:700">+' + Math.round(f.v) + '</span></div>';
    });
    h += '</div>';
  }
  h += '</div>';
  return h;
}

function updateAllGPI() {
  S.matches.forEach(function(m) {
    const d = S.live[m.id];
    if (!d || !['1H','2H','ET'].includes(d.status)) return;
    const res = calcGPI(m.id);
    if (!res) return;
    d.gpi = res.gpi;
    d.gpiFactors = res.factors;
    triggerAlert(m.id, res.gpi, m);
    // Aggiorna widget se la card è aperta
    const el = document.getElementById('gpi-' + m.id);
    if (el) el.outerHTML = '<div id="gpi-' + m.id + '">' + buildGPIWidget(m.id) + '</div>';
  });
}

async function requestNotifPerm() {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

/* ══════════════════════════════════════════════════════════════════
   API CALLS
══════════════════════════════════════════════════════════════════ */
async function apiFetch(ep) {
  const r = await fetch('https://v3.football.api-sports.io/' + ep, {
    headers: { 'x-rapidapi-key': S.apiKey, 'x-rapidapi-host': 'v3.football.api-sports.io' }
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json();
  if (j.errors && Object.keys(j.errors).length) throw new Error(Object.values(j.errors).join(', '));
  return j;
}

function pOv(l) { return Math.min(95, Math.max(30, Math.round((1 - Math.exp(-l)) * 100))); }

function mkStats(hs, as_, h2h) {
  const gH = parseFloat((hs && hs.goals && hs.goals.for && hs.goals.for.average && hs.goals.for.average.total) || '1.35');
  const gA = parseFloat((as_ && as_.goals && as_.goals.for && as_.goals.for.average && as_.goals.for.average.total) || '1.35');
  const mgf_c = +gH.toFixed(2), mgf_t = +gA.toFixed(2);
  const mgpt_c = +(gH * 0.44).toFixed(2), mgpt_t = +(gA * 0.44).toFixed(2);
  let h2h_pt = 62, h2h_f05 = 72, h2h_f15 = 60;
  if (h2h && h2h.length) {
    const n = h2h.length;
    h2h_pt  = Math.round(h2h.filter(m => ((m.score&&m.score.halftime&&m.score.halftime.home)||0)+((m.score&&m.score.halftime&&m.score.halftime.away)||0) > 0).length / n * 100);
    h2h_f05 = Math.round(h2h.filter(m => ((m.goals&&m.goals.home)||0)+((m.goals&&m.goals.away)||0) > 0).length / n * 100);
    h2h_f15 = Math.round(h2h.filter(m => ((m.goals&&m.goals.home)||0)+((m.goals&&m.goals.away)||0) > 1).length / n * 100);
  }
  return { mgf_c, mgf_t, mgpt_c, mgpt_t,
    ov05pt_c: pOv(mgpt_c), ov05pt_t: pOv(mgpt_t),
    ov05f_c: pOv(mgf_c),   ov05f_t: pOv(mgf_t),
    ov15f_c: pOv(mgf_c*0.72), ov15f_t: pOv(mgf_t*0.72),
    h2h_pt, h2h_f05, h2h_f15 };
}

/* The Odds API — volumi Betfair */
async function fetchOddsAPI(matches) {
  if (!S.oddsApiKey || !S.oddsApiKey.trim()) return;
  const bySport = {};
  matches.forEach(function(m) {
    const sk = ODDS_KEYS[m.leagueId];
    if (!sk) return;
    if (!bySport[sk]) bySport[sk] = [];
    bySport[sk].push(m);
  });
  for (const sportKey of Object.keys(bySport)) {
    try {
      const url = 'https://api.the-odds-api.com/v4/sports/' + sportKey +
        '/odds/?apiKey=' + S.oddsApiKey +
        '&regions=eu,uk&markets=totals&oddsFormat=decimal&bookmakers=betfair_ex_eu,pinnacle,bet365';
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (!Array.isArray(data)) continue;
      data.forEach(function(ev) {
        const ms = bySport[sportKey];
        const match = ms.find(function(m) {
          const ht = (ev.home_team||'').toLowerCase();
          const at = (ev.away_team||'').toLowerCase();
          const ca = (m.casa||'').toLowerCase();
          const tr = (m.trasferta||'').toLowerCase();
          return ht.includes(ca.substring(0,5)) || ca.includes(ht.substring(0,5)) ||
                 at.includes(tr.substring(0,5)) || tr.includes(at.substring(0,5));
        });
        if (!match) return;
        const res2 = { over05: {}, over15: {}, over25: {} };
        (ev.bookmakers||[]).forEach(function(bk) {
          (bk.markets||[]).forEach(function(mkt) {
            if (mkt.key !== 'totals') return;
            (mkt.outcomes||[]).forEach(function(out) {
              if (out.name !== 'Over') return;
              const pt = parseFloat(out.point);
              const odd = parseFloat(out.price);
              if (pt === 0.5) res2.over05[bk.key] = odd;
              else if (pt === 1.5) res2.over15[bk.key] = odd;
              else if (pt === 2.5) res2.over25[bk.key] = odd;
            });
          });
        });
        ['over05','over15','over25'].forEach(function(mk) {
          const vals = Object.values(res2[mk]).filter(function(v) { return v > 0; });
          if (!vals.length) return;
          const avg = vals.reduce(function(a,b){return a+b;},0) / vals.length;
          const betfair = res2[mk]['betfair_ex_eu'] || null;
          const pinnacle = res2[mk]['pinnacle'] || null;
          const sharpSignal = betfair && avg ? +((avg - betfair) / avg * 100).toFixed(1) : 0;
          res2[mk] = {
            avg: +avg.toFixed(3), betfair, pinnacle,
            implProb: +(1/avg*100).toFixed(1),
            sharpSignal, bookCount: vals.length
          };
        });
        S.oddsData[match.id] = res2;
      });
    } catch(e) { console.warn('The Odds API:', e.message); }
  }
}

/* Live update risultati */
async function liveUpdate() {
  if (!S.apiKey || !S.matches.length) return;
  const ids = S.matches.map(function(m){return m.id;}).slice(0,20).join('-');
  try {
    const fd = await apiFetch('fixtures?ids=' + ids + '&timezone=Europe/Rome');
    let changed = false;
    (fd.response || []).forEach(function(f) {
      const fid = f.fixture && f.fixture.id;
      if (!fid) return;
      const prev = S.live[fid] || {};
      const st = f.fixture && f.fixture.status && f.fixture.status.short;
      const nd = {
        homeGoals: f.goals && f.goals.home != null ? f.goals.home : null,
        awayGoals: f.goals && f.goals.away != null ? f.goals.away : null,
        htHome: f.score && f.score.halftime && f.score.halftime.home != null ? f.score.halftime.home : null,
        htAway: f.score && f.score.halftime && f.score.halftime.away != null ? f.score.halftime.away : null,
        status: st,
        minute: f.fixture && f.fixture.status && f.fixture.status.elapsed || null,
        events: (f.events||[]).map(function(e){ return {
          time: e.time && e.time.elapsed,
          type: e.type, detail: e.detail,
          player: e.player && e.player.name,
          team: e.team && e.team.name
        };}),
        // Mantieni stats esistenti
        cornerH: prev.cornerH||0, cornerA: prev.cornerA||0,
        shotOnH: prev.shotOnH||0, shotOnA: prev.shotOnA||0,
        shotH: prev.shotH||0, shotA: prev.shotA||0,
      };
      // Auto-esito a fine partita
      if (['FT','AET','PEN'].includes(st)) {
        const htG = (nd.htHome||0)+(nd.htAway||0);
        const ftG = (nd.homeGoals||0)+(nd.awayGoals||0);
        const map = { pt: htG>0?'V':'P', f05: ftG>0?'V':'P', f15: ftG>1?'V':'P' };
        MKT_K.forEach(function(k) {
          const key = fid + '_' + k;
          if (!S.esiti[key]) { S.esiti[key] = map[k]; }
        });
        LS.set('esiti', S.esiti);
      }
      if (prev.homeGoals !== nd.homeGoals || prev.status !== nd.status) changed = true;
      S.live[fid] = nd;
    });
    if (changed) {
      updateScoreBadges();
      updateLiveBar();
    }
    updateAllGPI();
    const el = document.getElementById('lbsub');
    if (el) el.textContent = 'Agg. ' + new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  } catch(e) { console.warn('liveUpdate:', e.message); }
}

/* ══════════════════════════════════════════════════════════════════
   FETCH PRINCIPALE
══════════════════════════════════════════════════════════════════ */
function addLog(msg) {
  const b = document.getElementById('logbox');
  if (!b) return;
  b.style.display = 'block';
  if (b.children.length >= 5) b.children[0].remove();
  const d = document.createElement('div');
  d.className = 'logline'; d.textContent = msg;
  b.appendChild(d);
  Array.from(b.querySelectorAll('.logline')).forEach(function(l,i,a){
    l.classList.toggle('active', i === a.length-1);
  });
}

async function fetchMatches() {
  if (!S.apiKey || !S.apiKey.trim()) {
    alert('Inserisci prima la tua API Key di API-Football!');
    return;
  }
  const btn = document.getElementById('refreshbtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Ricerca...'; }
  S.status = 'loading'; S.matches = []; S.error = ''; S.live = {};
  const lb = document.getElementById('livebar');
  if (lb) lb.style.display = 'none';
  const logb = document.getElementById('logbox');
  if (logb) { logb.innerHTML = ''; logb.style.display = 'none'; }
  renderPage();

  try {
    const today = new Date().toISOString().split('T')[0];
    addLog('📡 Connessione API-Football...');
    const fd = await apiFetch('fixtures?date=' + today + '&timezone=Europe/Rome');
    const all = fd.response || [];
    addLog('📋 ' + all.length + ' partite trovate oggi');

    const ids = S.leagues.filter(function(l){return l.on;}).map(function(l){return l.id;});
    const fil = all.filter(function(f){ return ids.includes(f.league && f.league.id); });
    addLog('🎯 ' + fil.length + ' nei campionati attivi');

    if (!fil.length) throw new Error('Nessuna partita oggi nei campionati attivi (' + all.length + ' in altre leghe). Attiva più campionati nelle Impostazioni.');

    // Crea partite raw subito
    S.matches = fil.map(function(f) {
      const lg = S.leagues.find(function(l){ return l.id === (f.league && f.league.id); });
      const ko = new Date(f.fixture && f.fixture.date);
      return {
        id: f.fixture && f.fixture.id,
        leagueId: f.league && f.league.id,
        campionato: (lg && lg.n) || (f.league && f.league.name) || '',
        country: (lg && lg.f) || '',
        region: (lg && lg.r) || 'europe',
        orario: ko.toLocaleTimeString('it-IT', {hour:'2-digit',minute:'2-digit'}),
        casa: f.teams && f.teams.home && f.teams.home.name,
        trasferta: f.teams && f.teams.away && f.teams.away.name,
        mgf_c:1.35, mgf_t:1.35, mgpt_c:0.59, mgpt_t:0.59,
        ov05pt_c:45, ov05pt_t:45, ov05f_c:73, ov05f_t:73,
        ov15f_c:62,  ov15f_t:62,
        h2h_pt:60,  h2h_f05:70, h2h_f15:58,
        topAttacco:false, derby:false, motivazioni:false,
        veto_forma:false, veto_quota:false,
        nota: 'Caricamento...', _loading: true
      };
    }).sort(function(a,b){ return a.orario.localeCompare(b.orario); });

    S.status = 'done';
    renderPage();

    // Carica stats in background
    addLog('🧮 Caricamento statistiche...');
    for (let i = 0; i < fil.length; i++) {
      const f = fil[i];
      const lg = S.leagues.find(function(l){ return l.id === (f.league && f.league.id); });
      const hid = f.teams && f.teams.home && f.teams.home.id;
      const aid = f.teams && f.teams.away && f.teams.away.id;
      const lid = f.league && f.league.id;
      const season = (lg && lg.s) || 2025;
      addLog('[' + (i+1) + '/' + fil.length + '] ' + (f.teams&&f.teams.home&&f.teams.home.name) + ' – ' + (f.teams&&f.teams.away&&f.teams.away.name));

      let hs = null, as_ = null, h2h = [];
      try {
        const results = await Promise.all([
          apiFetch('teams/statistics?league=' + lid + '&season=' + season + '&team=' + hid),
          apiFetch('teams/statistics?league=' + lid + '&season=' + season + '&team=' + aid),
          apiFetch('fixtures/headtohead?h2h=' + hid + '-' + aid + '&last=10')
        ]);
        hs = results[0].response;
        as_ = results[1].response;
        h2h = (results[2].response || []).filter(function(m){ return m.fixture && m.fixture.status && m.fixture.status.short === 'FT'; }).slice(0,8);
      } catch(e) {}

      const st = mkStats(hs, as_, h2h);
      const hForm = (hs && hs.form) || '';
      const aForm = (as_ && as_.form) || '';
      const veto = hForm.slice(-4).split('').filter(function(c){return c==='L';}).length >= 4 ||
                   aForm.slice(-4).split('').filter(function(c){return c==='L';}).length >= 4;

      const idx = S.matches.findIndex(function(m){ return m.id === (f.fixture && f.fixture.id); });
      if (idx >= 0) {
        Object.assign(S.matches[idx], st, {
          topAttacco: st.mgf_c > 2.0 || st.mgf_t > 2.0,
          veto_forma: veto,
          nota: h2h.length + ' H2H',
          _loading: false
        });
      }

      // Live data iniziale
      const fst = f.fixture && f.fixture.status && f.fixture.status.short;
      S.live[f.fixture && f.fixture.id] = {
        homeGoals: f.goals && f.goals.home != null ? f.goals.home : null,
        awayGoals: f.goals && f.goals.away != null ? f.goals.away : null,
        htHome: f.score && f.score.halftime && f.score.halftime.home != null ? f.score.halftime.home : null,
        htAway: f.score && f.score.halftime && f.score.halftime.away != null ? f.score.halftime.away : null,
        status: fst, minute: f.fixture && f.fixture.status && f.fixture.status.elapsed || null,
        events: [], cornerH:0, cornerA:0, shotOnH:0, shotOnA:0, shotH:0, shotA:0
      };

      if (i < fil.length - 1) await new Promise(function(r){ setTimeout(r, 150); });
    }

    addLog('✅ ' + S.matches.length + ' partite pronte!');

    // Carica volumi Betfair se chiave presente
    if (S.oddsApiKey && S.oddsApiKey.trim()) {
      addLog('💹 Caricamento volumi Betfair...');
      fetchOddsAPI(S.matches).then(function(){
        addLog('✅ Volumi Betfair caricati');
        renderPage();
      }).catch(function(e){ addLog('⚠️ Odds API: ' + e.message); });
    }

    startAuto();

  } catch(e) {
    S.error = e.message;
    S.status = 'error';
    addLog('❌ ' + e.message);
  }

  if (btn) { btn.disabled = false; btn.innerHTML = '🔄 AGGIORNA ORA'; }
  renderPage();
}

/* ══════════════════════════════════════════════════════════════════
   AUTO UPDATE
══════════════════════════════════════════════════════════════════ */
function startAuto() {
  stopAuto(); S.autoOn = true;
  const lb = document.getElementById('livebar');
  if (lb) lb.style.display = 'block';
  setDot(true); tickAuto();
}
function stopAuto() {
  S.autoOn = false;
  clearTimeout(_autoTimer); clearInterval(_cdTimer);
  _autoTimer = null; _cdTimer = null;
  setDot(false);
}
function toggleAuto() {
  const pb = document.getElementById('pbtn');
  if (S.autoOn) { stopAuto(); if (pb) pb.textContent = '▶'; }
  else { startAuto(); if (pb) pb.textContent = '⏸'; }
}
function tickAuto() {
  S.countdown = S.autoSec;
  updateCd();
  _cdTimer = setInterval(function(){ S.countdown--; updateCd(); if (S.countdown <= 0) clearInterval(_cdTimer); }, 1000);
  _autoTimer = setTimeout(async function() {
    if (!S.autoOn) return;
    const el = document.getElementById('lbsub');
    if (el) el.textContent = 'Aggiornamento...';
    await liveUpdate();
    tickAuto();
  }, S.autoSec * 1000);
}
function updateCd() {
  const el = document.getElementById('lbcd');
  if (el) el.textContent = S.countdown + 's';
}
function setDot(on) {
  const d = document.getElementById('ldot');
  const l = document.getElementById('livelbl');
  if (d) d.style.background = on ? '#ff4466' : '#334';
  if (l) l.textContent = on ? '🔴 LIVE' : new Date().toLocaleDateString('it-IT',{weekday:'short',day:'numeric',month:'short'});
}
function updateLiveBar() {
  const el = document.getElementById('lbres');
  if (!el) return;
  const live = S.matches.filter(function(m){ const d=S.live[m.id]; return d&&['1H','2H','ET','HT'].includes(d.status); });
  if (!live.length) { el.innerHTML = '<span style="font-size:10px;color:#1a4a7f">Nessuna in corso</span>'; return; }
  el.innerHTML = live.map(function(m){
    const d = S.live[m.id];
    const s = (d.homeGoals||0) + ':' + (d.awayGoals||0);
    const isHT = d.status === 'HT';
    return '<span class="lbsc' + (isHT?'':' ll') + '">' + (m.casa||'').split(' ')[0] + ' ' + s + ' ' + (m.trasferta||'').split(' ')[0] + (isHT?' HT':' '+(d.minute||'')+"'") + '</span>';
  }).join('');
}
function updateScoreBadges() {
  S.matches.forEach(function(m){
    const d = S.live[m.id]; if (!d) return;
    const el = document.getElementById('sb-' + m.id);
    if (el) el.outerHTML = buildBadge(m.id);
  });
}

/* ══════════════════════════════════════════════════════════════════
   HTML BUILDERS
══════════════════════════════════════════════════════════════════ */
function buildBadge(fid) {
  const d = S.live[fid];
  if (!d || !d.status || d.status === 'NS') return '<span id="sb-' + fid + '" class="badge bns">—:—</span>';
  const hg = d.homeGoals != null ? d.homeGoals : '?';
  const ag = d.awayGoals != null ? d.awayGoals : '?';
  const hh = d.htHome != null ? d.htHome : '?';
  const ha = d.htAway != null ? d.htAway : '?';
  if (d.status === 'HT') return '<span id="sb-' + fid + '" class="badge bht">⏸' + hh + ':' + ha + '</span>';
  if (['FT','AET','PEN'].includes(d.status)) return '<span id="sb-' + fid + '" class="badge bft">FT ' + hg + ':' + ag + '</span>';
  if (['1H','2H','ET','BT','P'].includes(d.status)) return '<span id="sb-' + fid + '" class="badge blive"><span class="dot"></span>' + (d.minute||'?') + "' " + hg + ':' + ag + '</span>';
  return '<span id="sb-' + fid + '" class="badge bns">—:—</span>';
}

function buildLiveBox(fid, m) {
  const d = S.live[fid];
  if (!d || !d.status || d.status === 'NS') return '';
  const hg = d.homeGoals != null ? d.homeGoals : '?';
  const ag = d.awayGoals != null ? d.awayGoals : '?';
  const hh = d.htHome != null ? d.htHome : null;
  const ha = d.htAway != null ? d.htAway : null;
  const isL = ['1H','2H','ET'].includes(d.status);
  const isH = d.status === 'HT';
  const isF = ['FT','AET','PEN'].includes(d.status);
  const lbl = isL ? ('🔴 LIVE ' + (d.minute||'?') + "'") : isH ? '⏸ INTERVALLO' : isF ? '✅ FINALE' : d.status;
  const col = isL ? '#ff4466' : isH ? '#ffcc00' : '#00ff88';
  const ht = (hh !== null && ha !== null) ? ('PT: ' + hh + ':' + ha) : '';
  const evHTML = (d.events && d.events.length) ?
    d.events.filter(function(e){ return e.type==='Goal'||e.type==='Card'; }).slice(-5).reverse().map(function(e){
      const ic = e.type==='Goal'?'⚽':e.detail==='Red Card'?'🟥':'🟨';
      return '<div class="ev' + (e.type==='Goal'?' gol':'') + '">' + ic + ' ' + e.time + "' " + (e.player||'') + '</div>';
    }).join('') : '<div class="ev" style="color:#1a3a5a">Nessun evento</div>';

  let html = '<div class="lrbox">';
  html += '<div class="lrt">' + lbl + '</div>';
  html += '<div class="lrs" style="color:' + col + '">' + hg + ' – ' + ag + '</div>';
  html += '<div class="lrm"><span>' + (m&&m.casa||'') + '</span>' + (ht?'<span style="color:#2a5a7f">'+ht+'</span>':'') + '<span>' + (m&&m.trasferta||'') + '</span></div>';
  html += '<div class="levs">' + evHTML + '</div>';
  html += '<div class="lra"><span class="adot"></span>Auto ogni ' + S.autoSec + 's</div>';
  html += '</div>';

  // GPI widget
  if (d.gpi != null) {
    html += '<div id="gpi-' + fid + '">' + buildGPIWidget(fid) + '</div>';
  } else {
    html += '<div id="gpi-' + fid + '"></div>';
  }

  return html;
}

function buildVolBar(p) {
  const od = S.oddsData[p.id];
  const om = S.mkt === 'f15' ? (od && od.over15) : (od && od.over05);
  if (!om || !om.avg) {
    return '<div class="volbar" style="border-color:#0e2035">' +
      '<div class="voltop"><span class="vollbl">💰 Volume Betfair</span>' +
      '<span style="font-size:9px;color:#1a3a5a">' + (S.oddsApiKey ? 'N/D per questo campionato' : 'Configura The Odds API Key') + '</span></div></div>';
  }
  const ip = Math.round(1/om.avg*100);
  const col = ip >= 70 ? '#00ff88' : ip >= 55 ? '#ffcc00' : '#ff4466';
  const lbl = om.sharpSignal > 3 ? '🎯 Sharp Money' : ip >= 70 ? '💰 Volume Alto' : ip >= 60 ? '📈 Vol. Medio' : ip < 45 ? '⚠️ Bassa liq.' : '🔘 Neutro';
  let h = '<div class="volbar" style="border-color:' + col + '33">';
  h += '<div class="voltop"><span class="vollbl">💰 Volume Betfair · ' + MKT_L[MKT_K.indexOf(S.mkt)] + '</span>';
  h += '<span class="volpct" style="color:' + col + '">' + ip + '% · q.' + om.avg.toFixed(2) + '</span></div>';
  h += '<div class="voltrack"><div class="volfill" style="width:' + Math.min(100,ip) + '%;background:' + col + '"></div></div>';
  h += '<div style="display:flex;justify-content:space-between;margin-top:3px">';
  h += '<span class="voltag" style="color:' + col + '">' + lbl;
  if (om.sharpSignal > 3) h += ' <b style="color:#ffd700">quota scesa</b>';
  h += '</span>';
  if (om.betfair) h += '<span style="font-size:9px;color:#2a5a7f">Betfair: ' + om.betfair.toFixed(2) + '</span>';
  h += '</div></div>';
  return h;
}

/* ══════════════════════════════════════════════════════════════════
   NAVIGAZIONE & AZIONI
══════════════════════════════════════════════════════════════════ */
function goTo(p) {
  S.page = p;
  document.querySelectorAll('.nb').forEach(function(b){ b.classList.toggle('nba', b.dataset.page === p); });
  renderPage();
  window.scrollTo(0, 0);
}
function setMkt(k) { S.mkt = k; renderPage(); }
function setConf(c) { S.conf = S.conf === c ? 'all' : c; renderPage(); }
function setRegion(r) { S.region = r; LS.set('region', r); renderPage(); }

function saveKey() {
  const inp = document.getElementById('keyinput');
  if (!inp) return;
  const k = inp.value.trim();
  if (!k) { alert('Inserisci una API Key valida'); return; }
  S.apiKey = k; LS.set('apiKey', k);
  const b = document.querySelector('.savebtn');
  if (b) { b.textContent = '✅'; b.style.color = '#00ff88'; setTimeout(function(){ b.textContent = '💾'; b.style.color = ''; }, 2000); }
}
function saveKeySettings() {
  const k = (document.getElementById('nki') && document.getElementById('nki').value.trim()) || '';
  if (!k) { alert('Inserisci una API Key'); return; }
  S.apiKey = k; LS.set('apiKey', k);
  const inp = document.getElementById('keyinput');
  if (inp) inp.value = k;
  alert('✅ API-Football Key salvata!');
  renderPage();
}
function saveOddsKey() {
  const k = (document.getElementById('noki') && document.getElementById('noki').value.trim()) || '';
  if (!k) { alert('Inserisci la API Key di The Odds API'); return; }
  S.oddsApiKey = k; LS.set('oddsApiKey', k);
  alert('✅ The Odds API Key salvata! I volumi Betfair saranno caricati al prossimo Aggiorna Ora.');
  renderPage();
}
function setAutoSec(s) { S.autoSec = s; LS.set('autoSec', s); if (S.autoOn) { stopAuto(); startAuto(); } renderPage(); }
function toggleLeague(i) { S.leagues[i].on = !S.leagues[i].on; LS.set('leagues', S.leagues); renderPage(); }
function clearEsiti() { if (!confirm('Cancellare tutto lo storico?')) return; S.esiti = {}; LS.set('esiti', {}); renderPage(); }
function dismiss() { S.dismissed = true; LS.set('dismissed', true); renderPage(); }
function setEsito(id, mkt, val) {
  const k = id + '_' + mkt;
  if (S.esiti[k] === val) delete S.esiti[k]; else S.esiti[k] = val;
  LS.set('esiti', S.esiti);
  MKT_K.forEach(function(mk) {
    ['V','P','N'].forEach(function(v) {
      const b = document.getElementById('eb-'+id+'-'+mk+'-'+v);
      if (b) b.className = 'ebtn' + (S.esiti[id+'_'+mk] === v ? ' s'+v : '');
    });
  });
  if (S.page === 'stats') renderPage();
}
function toggleCard(id) {
  const d = document.getElementById('det-'+id);
  const c = document.getElementById('chv-'+id);
  if (!d) return;
  d.classList.toggle('open');
  if (c) c.textContent = d.classList.contains('open') ? '▲' : '▼';
}
function exportCSV() {
  const rows = [['Data','Campionato','Ora','Casa','Trasferta','Risultato','IPC_PT','HR_PT%','IPC_05F','HR_05F%','IPC_15F','HR_15F%','Vol_Betfair','Esito_PT','Esito_05F','Esito_15F','Stato']];
  const td = new Date().toLocaleDateString('it-IT');
  S.matches.filter(function(m){ return !m._loading; }).forEach(function(p) {
    const r = MKT_K.map(function(k){ return calcIPC(p,k); });
    const d = S.live[p.id] || {};
    const score = d.homeGoals != null ? d.homeGoals + ':' + d.awayGoals : '—';
    const od = S.oddsData[p.id];
    const vol = od && od.over05 && od.over05.avg ? 'q:'+od.over05.avg.toFixed(2)+' ip:'+od.over05.implProb+'%' : '';
    rows.push([td, p.campionato, p.orario, p.casa, p.trasferta, score,
      r[0].ipc, (r[0].hr*100).toFixed(1), r[1].ipc, (r[1].hr*100).toFixed(1), r[2].ipc, (r[2].hr*100).toFixed(1),
      vol, S.esiti[p.id+'_pt']||'', S.esiti[p.id+'_f05']||'', S.esiti[p.id+'_f15']||'', d.status||'NS']);
  });
  const csv = rows.map(function(r){ return r.map(function(v){ return '"'+String(v).replace(/"/g,'""')+'"'; }).join(','); }).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'}));
  a.download = 'Scout_' + td.replace(/\//g,'-') + '.csv';
  a.click();
}

/* ══════════════════════════════════════════════════════════════════
   RENDER
══════════════════════════════════════════════════════════════════ */
function renderPage() {
  const main = document.getElementById('main');
  if (!main) return;
  if (S.page === 'home') main.innerHTML = buildHome();
  else if (S.page === 'analisi') main.innerHTML = buildAnalisi();
  else if (S.page === 'stats') main.innerHTML = buildStats();
  else main.innerHTML = buildSettings();
}

/* HOME */
function buildHome() {
  let h = '';
  if (!S.dismissed) {
    h += '<div class="banner"><div class="bant">📲 Installa su iPhone</div>' +
      '<div class="bans">1. Apri in <b>Safari</b><br>2. Tocca <b>Condividi ⬆️</b><br>3. <b>Aggiungi a schermata Home</b></div>' +
      '<button class="bandis" onclick="dismiss()">✓ Ho capito</button></div>';
  }
  h += '<div class="hero"><div class="htitle">⚽ SCOUT OVER PRO</div>' +
    '<div class="hsub">Ov 0.5 PT · Ov 0.5 FIN · Ov 1.5 FIN + Betfair Exchange + Goal Alert</div>' +
    '<div class="hdate">' + new Date().toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'}) + '</div></div>';

  if (S.status === 'idle') {
    h += '<div class="idle"><div style="font-size:48px;margin-bottom:12px">⚽</div>' +
      '<div class="idlet">Pronto</div>' +
      '<div class="idled">Inserisci la <b style="color:#ffcc00">API Key</b> nel campo in alto<br>poi premi <b style="color:#00aaff">🔄 AGGIORNA ORA</b><br><br>' +
      '<span style="font-size:10px;color:#1a4060">api-football.com · 100 req/giorno · Gratis</span></div></div>';
    return h;
  }
  if (S.status === 'error') {
    h += '<div class="errbox"><div style="font-size:24px;margin-bottom:8px">⚠️</div>' +
      '<div class="errt">Errore</div><div class="errm">' + S.error + '</div></div>';
  }

  if (S.matches.length > 0) {
    const done = S.matches.filter(function(m){ return !m._loading; }).length;
    const tot = S.matches.length;
    if (done < tot) {
      const pct = Math.round(done/tot*100);
      h += '<div class="progwrap"><div class="progbar" style="width:' + pct + '%"></div></div>' +
        '<div class="proglbl">' + done + '/' + tot + ' analizzate...</div>';
    }
    const alta = S.matches.filter(function(m){ if(m._loading)return false; const r=calcIPC(m,S.mkt); return !r.veto&&r.hr>=0.88; }).length;
    h += '<div class="sumrow">' +
      '<div class="sumpill"><div class="sumn" style="color:#00aaff">' + tot + '</div><div class="suml">Partite</div></div>' +
      '<div class="sumpill"><div class="sumn" style="color:#00ff88">' + done + '</div><div class="suml">Analizzate</div></div>' +
      '<div class="sumpill"><div class="sumn" style="color:#ffd700">' + alta + '</div><div class="suml">⭐ Alta</div></div>' +
      '</div>';

    // Alert GPI attivi
    const highGPI = S.matches.filter(function(m){ const d=S.live[m.id]; return d&&d.gpi>=60&&['1H','2H','ET'].includes(d.status); });
    if (highGPI.length) {
      h += '<div class="gal-home"><div class="gal-title">🔴 Goal Alert (' + highGPI.length + ')</div>';
      highGPI.forEach(function(m) {
        const d = S.live[m.id];
        const lv = getGPILevel(d.gpi);
        h += '<div class="gal-row" onclick="goTo('analisi')" style="border-color:' + lv.c + '44">' +
          '<div class="gal-teams">' + m.casa + ' vs ' + m.trasferta + '</div>' +
          '<div style="display:flex;align-items:center;gap:8px">' +
          '<span style="font-size:10px;color:#3a6a8f">' + (d.minute||0) + "'" + '</span>' +
          '<div style="width:60px;height:4px;background:#0a1825;border-radius:2px;overflow:hidden">' +
          '<div style="width:' + d.gpi + '%;height:100%;background:' + lv.c + '"></div></div>' +
          '<span style="font-size:13px;font-weight:800;color:' + lv.c + '">' + d.gpi + '</span>' +
          '</div></div>';
      });
      h += '</div>';
    }

    // Filtro regione
    h += '<div class="chips">';
    Object.keys(REGIONS).forEach(function(k) {
      const v = REGIONS[k];
      const cnt = k === 'all' ? S.matches.length : S.matches.filter(function(m){ return m.region===k; }).length;
      if (!cnt && k !== 'all') return;
      h += '<button class="chip' + (S.region===k?' on':'') + '" onclick="setRegion('' + k + '')" ' +
        (S.region===k?'style="border-color:'+v.c+';color:'+v.c+';background:'+v.c+'18"':'') + '>' + v.l + ' (' + cnt + ')</button>';
    });
    h += '</div>';

    // Lista partite
    const showR = S.region === 'all' ? null : S.region;
    const byL = {};
    S.matches.filter(function(m){ return !showR || m.region===showR; }).forEach(function(m) {
      if (!byL[m.campionato]) byL[m.campionato] = { f: m.country, list: [] };
      byL[m.campionato].list.push(m);
    });
    Object.keys(byL).forEach(function(league) {
      const item = byL[league];
      h += '<div class="lghdr"><span>' + item.f + '</span><span class="lgname">' + league + '</span><span class="lgcnt">' + item.list.length + '</span></div>';
      item.list.forEach(function(m) {
        const d = S.live[m.id] || {};
        const best = m._loading ? {hr:0,veto:false} : MKT_K.map(function(k){ return calcIPC(m,k); }).reduce(function(a,b){ return a.hr>b.hr?a:b; });
        const rt = m._loading ? {l:'⏳',c:'#1a3a5a'} : getRating(best.hr, best.veto);
        h += '<div class="mrow">' +
          '<span class="mtime">' + m.orario + '</span>' +
          '<div class="mteams"><span>' + m.casa + '</span><span class="mvs">vs</span><span>' + m.trasferta + '</span></div>' +
          buildBadge(m.id) +
          '<span class="mconf" style="color:' + rt.c + '">' + rt.l + '</span></div>';
      });
    });

    if (done > 0) {
      h += '<button class="gotobtn" onclick="goTo('analisi')">📊 Analisi Complete →</button>';
    }
  }
  return h;
}

/* ANALISI */
function buildAnalisi() {
  if (S.status === 'idle' || (S.status === 'loading' && !S.matches.filter(function(m){return !m._loading;}).length)) {
    return '<div class="empty"><div style="font-size:48px;margin-bottom:16px">📊</div>' +
      '<div class="emptyt">Nessun dato</div>' +
      '<div class="emptyd">Vai alla Home e premi<br><b style="color:#00aaff">🔄 AGGIORNA ORA</b></div>' +
      '<button class="homebtn" onclick="goTo('home')">🏠 Vai alla Home</button></div>';
  }
  if (S.status === 'error') {
    return '<div class="errbox"><div style="font-size:24px;margin-bottom:8px">⚠️</div>' +
      '<div class="errt">Errore</div><div class="errm">' + S.error + '</div>' +
      '<button class="homebtn" style="margin-top:14px" onclick="goTo('home')">🏠 Home</button></div>';
  }

  const showR = S.region === 'all' ? null : S.region;
  const ok = S.matches.filter(function(m){ return !m._loading && (!showR||m.region===showR); });
  const sorted = ok.slice().sort(function(a,b){ return calcIPC(b,S.mkt).hr - calcIPC(a,S.mkt).hr; });
  const filt = sorted.filter(function(p) {
    const r = calcIPC(p, S.mkt);
    if (S.conf==='alta')  return !r.veto && r.hr>=0.88;
    if (S.conf==='media') return !r.veto && r.hr>=0.75 && r.hr<0.88;
    if (S.conf==='bassa') return !r.veto && r.hr<0.75;
    if (S.conf==='veto')  return r.veto;
    return true;
  });
  const alta  = sorted.filter(function(p){ const r=calcIPC(p,S.mkt); return !r.veto&&r.hr>=0.88; }).length;
  const media = sorted.filter(function(p){ const r=calcIPC(p,S.mkt); return !r.veto&&r.hr>=0.75&&r.hr<0.88; }).length;

  let h = '';
  // Filtri
  h += '<div class="chips">';
  Object.keys(REGIONS).forEach(function(k) {
    const v=REGIONS[k]; const cnt=k==='all'?sorted.length:sorted.filter(function(m){return m.region===k;}).length;
    if(!cnt&&k!=='all')return;
    h += '<button class="chip'+(S.region===k?' on':'')+'" onclick="setRegion(''+k+'')" '+(S.region===k?'style="border-color:'+v.c+';color:'+v.c+';background:'+v.c+'18"':'')+'>'+v.l+' ('+cnt+')</button>';
  });
  h += '</div><div class="chips">';
  MKT_K.forEach(function(k,i){ h+='<button class="chip'+(S.mkt===k?' on':'')+'" onclick="setMkt(''+k+'')" '+(S.mkt===k?'style="border-color:'+MKT_C[i]+';color:'+MKT_C[i]+';background:'+MKT_C[i]+'18"':'')+'>'+MKT_L[i]+'</button>'; });
  h += '</div><div class="sumrow">';
  [['all','Tutte','#00aaff',sorted.length],['alta','Alta','#00ff88',alta],['media','Media','#ffcc00',media]].forEach(function(item){
    const on=S.conf===item[0];
    h+='<div class="sumpill'+(on?' son':'')+'" onclick="setConf(''+item[0]+'')" '+(on?'style="border-color:'+item[2]+';background:'+item[2]+'18"':'')+'>'+
      '<div class="sumn" style="color:'+item[2]+'">'+item[3]+'</div><div class="suml">'+item[1]+'</div></div>';
  });
  h += '</div>';

  // Cards
  filt.forEach(function(p, idx) {
    const mkts = MKT_K.map(function(k){ return calcIPC(p,k); });
    const best = mkts.reduce(function(a,b){ return a.hr>b.hr?a:b; });
    const rt = getRating(best.hr, best.veto);
    const d = S.live[p.id] || {};
    const hasGPI = d.gpi != null;

    h += '<div class="card" style="background:'+rt.bg+';border:1px solid '+rt.br+';animation-delay:'+idx*.03+'s">';
    h += '<div class="chead" onclick="toggleCard('+p.id+')">';
    h += '<div class="cmeta"><span class="ctag">'+p.country+' '+p.campionato+'</span><span class="ctime">'+p.orario+'</span>'+buildBadge(p.id)+'</div>';
    h += '<div class="cteams"><span class="ct">'+p.casa+'</span><span class="cvs">VS</span><span class="ct" style="text-align:right">'+p.trasferta+'</span></div>';
    h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">';
    h += '<span style="font-size:12px;font-weight:800;color:'+rt.c+'">'+rt.l+(best.veto?'':' '+Math.round(best.hr*100)+'%')+'</span>';
    if (best.vl) h += '<span class="vlchip" style="color:'+best.vc+';border-color:'+best.vc+'33">'+best.vl+'</span>';
    if (hasGPI) {
      const lv = getGPILevel(d.gpi);
      h += '<span style="margin-left:auto;font-size:10px;font-weight:700;color:'+lv.c+'">GPI '+d.gpi+'</span>';
    }
    h += '</div><div class="cmkts">';
    MKT_K.forEach(function(k,i) {
      const r=calcIPC(p,k); const col=r.veto?'#334':r.hr>=0.88?MKT_C[i]:r.hr>=0.75?'#ffcc00':'#ff4466'; const pct=r.veto?0:Math.round(r.hr*100);
      h+='<div><div style="display:flex;justify-content:space-between"><span class="mkl">'+MKT_L[i]+'</span><span class="mkv" style="color:'+col+'">'+(r.veto?'✗':pct+'%')+'</span></div><div class="bar"><div class="barf" style="width:'+pct+'%;background:'+col+'"></div></div></div>';
    });
    h += '</div>';
    // Volume bar sempre visibile
    h += buildVolBar(p);
    h += '</div>';  // fine chead

    h += '<div class="detail" id="det-'+p.id+'">';
    h += buildLiveBox(p.id, p);
    h += '<div class="sgrid">';
    [['PT Casa',p.ov05pt_c+'%',p.ov05pt_c>=75],['PT Trasf.',p.ov05pt_t+'%',p.ov05pt_t>=70],
     ['Gol PT',+(p.mgpt_c+p.mgpt_t).toFixed(2),(p.mgpt_c+p.mgpt_t)>=1.4],['H2H PT',p.h2h_pt+'%',p.h2h_pt>=65],
     ['Gol FIN',+(p.mgf_c+p.mgf_t).toFixed(2),(p.mgf_c+p.mgf_t)>=2.5],['H2H 1.5F',p.h2h_f15+'%',p.h2h_f15>=58]
    ].forEach(function(s){
      h+='<div class="sbox"><div class="sl">'+s[0]+'</div><div class="sv" style="color:'+(s[2]?'#00cc66':'#ff6688')+'">'+s[1]+'</div></div>';
    });
    h += '</div>';
    if (p.topAttacco||p.veto_forma) {
      h += '<div class="flags">';
      if (p.topAttacco) h += '<span class="flag" style="color:#00cc66;background:rgba(0,204,102,.1)">⚡ Top Att.</span>';
      if (p.veto_forma) h += '<span class="flag" style="color:#ff4466;background:rgba(255,68,102,.1)">🚫 Veto Forma</span>';
      h += '</div>';
    }
    h += '<div class="nota">'+p.nota+'</div>';
    h += '<div class="esbox"><div class="estit">📝 Esito (auto a fine partita)</div><div class="esgrid">';
    MKT_K.forEach(function(k,i) {
      h += '<div><div class="esl">'+MKT_L[i]+'</div><div class="esbtns">';
      ['V','P','N'].forEach(function(v){
        h += '<button id="eb-'+p.id+'-'+k+'-'+v+'" class="ebtn'+(S.esiti[p.id+'_'+k]===v?' s'+v:'')+'" onclick="setEsito('+p.id+',''+k+'',''+v+'')">'+v+'</button>';
      });
      h += '</div></div>';
    });
    h += '</div></div></div>';
    h += '<div class="chev" id="chv-'+p.id+'" onclick="toggleCard('+p.id+')">▼</div></div>';
  });

  if (!filt.length) h += '<div style="text-align:center;padding:30px;color:#1a4060">Nessuna partita in questa categoria</div>';
  h += '<button class="expbtn" onclick="exportCSV()">⬇️ Esporta CSV</button>';
  return h;
}

/* STATISTICHE */
function buildStats() {
  const st = { pt:{V:0,P:0,N:0}, f05:{V:0,P:0,N:0}, f15:{V:0,P:0,N:0} };
  const cf = { alta:{V:0,P:0}, media:{V:0,P:0}, bassa:{V:0,P:0} };
  Object.keys(S.esiti).forEach(function(key) {
    const val = S.esiti[key];
    const parts = key.split('_'); const id = parts[0]; const mkt = parts[1];
    if (!st[mkt]) return;
    st[mkt][val] = (st[mkt][val]||0) + 1;
    const m = S.matches.find(function(p){ return String(p.id)===id; });
    if (m && (val==='V'||val==='P')) {
      const r = calcIPC(m, mkt);
      if (!r.veto) { const b = r.hr>=0.88?'alta':r.hr>=0.75?'media':'bassa'; cf[b][val]++; }
    }
  });
  const tV = MKT_K.reduce(function(s,k){ return s+(st[k].V||0); },0);
  const tP = MKT_K.reduce(function(s,k){ return s+(st[k].P||0); },0);
  const tG = tV + tP;
  const auto = S.matches.filter(function(m){ return ['FT','AET','PEN'].includes(S.live[m.id]&&S.live[m.id].status); }).length;

  let h = '<div class="stsec"><div class="sstit">📊 Riepilogo Globale</div>';
  h += '<div class="stgrid">';
  h += '<div class="stbox"><div class="stn" style="color:#00aaff">'+tG+'</div><div class="stl">Giocate</div></div>';
  h += '<div class="stbox"><div class="stn" style="color:#00cc66">'+tV+'</div><div class="stl">Vinte ✓</div></div>';
  h += '<div class="stbox"><div class="stn" style="color:#ff4466">'+tP+'</div><div class="stl">Perse ✗</div></div>';
  h += '</div>';
  h += '<div class="sthr" style="color:'+(tG>0?(tV/tG>=0.75?'#00ff88':'#ff4466'):'#2a5a7f')+'">';
  h += (tG>0?(tV/tG*100).toFixed(1)+'%':'—') + ' <span style="font-size:11px;color:#2a5a7f">Hit Rate</span></div>';
  if (auto>0) h += '<div style="text-align:center;font-size:10px;color:#2a5a7f;margin-top:6px">🤖 '+auto+' esiti auto-impostati</div>';
  h += '</div>';

  h += '<div class="slbl">Per Mercato</div><div class="smktg">';
  MKT_K.forEach(function(k,i){
    const s=st[k]; const g=(s.V||0)+(s.P||0); const hr=g>0?((s.V||0)/g*100).toFixed(1):null;
    h+='<div class="smkt"><div class="smktn" style="color:'+MKT_C[i]+'">'+MKT_L[i]+'</div>'+
      '<div class="smktr"><span style="color:#00cc66">V:'+(s.V||0)+'</span><span style="color:#ff4466">P:'+(s.P||0)+'</span><span style="color:#556">N:'+(s.N||0)+'</span></div>'+
      '<div class="smkth" style="color:'+(hr?(parseFloat(hr)>=75?'#00ff88':'#ff4466'):'#2a5a7f')+'">'+(hr?hr+'%':'—')+'</div>'+
      (g>0?'<div class="bar" style="margin-top:5px"><div class="barf" style="width:'+(s.V||0)/g*100+'%;background:'+MKT_C[i]+'"></div></div>':'')+'</div>';
  });
  h += '</div><div class="slbl">Per Fascia</div>';
  [['🟢 Alta ≥88%','alta','#00ff88'],['🟡 Media 75-87%','media','#ffcc00'],['🔴 Bassa <75%','bassa','#ff4466']].forEach(function(item){
    const s=cf[item[1]]; const g=s.V+s.P; const hr=g>0?(s.V/g*100).toFixed(1):null;
    h+='<div class="sfrow" style="border:1px solid '+item[2]+'22">'+
      '<span style="flex:1;font-size:12px;color:'+item[2]+'">'+item[0]+'</span>'+
      '<span style="font-size:11px;color:#00cc66">V:'+s.V+'</span>'+
      '<span style="font-size:11px;color:#ff4466;margin-left:8px">P:'+s.P+'</span>'+
      '<span style="font-size:13px;font-weight:700;min-width:44px;text-align:right;color:'+(hr?(parseFloat(hr)>=75?'#00ff88':'#ff4466'):'#2a5a7f')+'">'+
      (hr?hr+'%':'—')+'</span></div>';
  });
  return h;
}

/* IMPOSTAZIONI */
function buildSettings() {
  const masked  = S.apiKey    ? S.apiKey.substring(0,4)+'..'+S.apiKey.slice(-4)    : 'Non conf.';
  const odMasked= S.oddsApiKey? S.oddsApiKey.substring(0,6)+'..': 'Non conf.';
  const notifOk = typeof Notification!=='undefined' && Notification.permission==='granted';
  const tot = Object.keys(S.esiti).filter(function(k){return ['V','P'].includes(S.esiti[k]);}).length;
  const win = Object.values(S.esiti).filter(function(v){return v==='V';}).length;
  const regOrder = ['europe','uk','americas','asia'];

  let h = '';

  // API-Football
  h += '<div class="ssec"><div class="ssectit">🔑 API-Football</div>';
  h += '<div class="setrow"><div class="setlbl"><div>Chiave</div><div style="font-size:10px;color:#3a6a8f">Partite, statistiche, live</div></div><div class="setval">'+masked+'</div></div>';
  h += '<div style="display:flex;gap:8px;margin-top:10px">';
  h += '<input type="text" id="nki" placeholder="Incolla API Key..." style="flex:1;background:#0f1e2e;border:1px solid #1a3a5a;border-radius:10px;padding:10px 12px;color:#e0f0ff;font-size:12px;outline:none;-webkit-appearance:none;font-family:monospace">';
  h += '<button onclick="saveKeySettings()" style="background:rgba(255,204,0,.12);border:1px solid rgba(255,204,0,.4);border-radius:10px;padding:10px 14px;color:#ffcc00;font-size:12px;font-weight:700;cursor:pointer">Salva</button></div>';
  h += '<div style="font-size:10px;color:#2a5a7f;margin-top:6px">dashboard.api-football.com · 100 req/giorno · Gratis</div></div>';

  // The Odds API
  h += '<div class="ssec"><div class="ssectit">💹 The Odds API — Betfair</div>';
  h += '<div class="setrow"><div class="setlbl"><div>Chiave</div><div style="font-size:10px;color:#3a6a8f">Volumi Betfair Exchange</div></div><div class="setval">'+odMasked+'</div></div>';
  h += '<div style="display:flex;gap:8px;margin-top:10px">';
  h += '<input type="text" id="noki" placeholder="API Key the-odds-api.com..." style="flex:1;background:#0f1e2e;border:1px solid #1a3a5a;border-radius:10px;padding:10px 12px;color:#e0f0ff;font-size:12px;outline:none;-webkit-appearance:none;font-family:monospace">';
  h += '<button onclick="saveOddsKey()" style="background:rgba(0,255,136,.1);border:1px solid rgba(0,255,136,.3);border-radius:10px;padding:10px 14px;color:#00ff88;font-size:12px;font-weight:700;cursor:pointer">Salva</button></div>';
  h += '<div style="font-size:10px;color:#2a5a7f;margin-top:6px">the-odds-api.com · 500 req/mese · Gratis · Include Betfair Exchange</div></div>';

  // Notifiche
  h += '<div class="ssec"><div class="ssectit">🔔 Goal Alert</div>';
  h += '<div class="setrow"><div class="setlbl">Notifiche push</div><div class="setval" style="color:'+(notifOk?'#00ff88':'#556')+'">'+(notifOk?'✅ Attive':'⚠️ '+((typeof Notification!=='undefined'?Notification.permission:'N/D')))+'</div></div>';
  h += '<button onclick="requestNotifPerm().then(function(g){alert(g?'Notifiche attivate!':'Permesso negato');renderPage();})" style="margin-top:10px;width:100%;padding:12px;border-radius:10px;background:rgba(0,170,255,.1);border:1px solid rgba(0,170,255,.3);color:#00aaff;font-size:12px;font-weight:700;cursor:pointer">🔔 Attiva notifiche</button>';
  h += '<div style="font-size:10px;color:#2a5a7f;margin-top:6px">Alert quando GPI ≥ 60/100 — vibrazione + notifica push</div></div>';

  // GPI spiegazione
  h += '<div class="ssec"><div class="ssectit">⚽ Come funziona il GPI</div>';
  [['⏱️','Minuto','Pressione massima negli ultimi 10 minuti'],
   ['🚩','Corner','Ogni corner = alta probabilità di gol'],
   ['🎯','Tiri in porta','Proxy Expected Goals in tempo reale'],
   ['💹','Flusso Betfair','Quota in calo = soldi sharp in entrata'],
  ].forEach(function(item){
    h+='<div style="display:flex;gap:10px;padding:7px 0;border-bottom:1px solid #080f18;align-items:flex-start">'+
      '<span style="font-size:16px;flex-shrink:0">'+item[0]+'</span>'+
      '<div><div style="font-size:11px;font-weight:700;color:#e0f0ff">'+item[1]+'</div>'+
      '<div style="font-size:10px;color:#2a5a7f;margin-top:1px">'+item[2]+'</div></div></div>';
  });
  h += '<div style="margin-top:8px;padding:8px;background:rgba(0,0,0,.3);border-radius:8px;font-size:10px;color:#3a6a8f;line-height:1.7">';
  h += '🟢 0-39 Bassa &nbsp;·&nbsp; 🟡 40-59 Attenzione &nbsp;·&nbsp; 🟠 60-79 Alta &nbsp;·&nbsp; 🔴 80+ Alert</div></div>';

  // Auto update
  h += '<div class="ssec"><div class="ssectit">⏱️ Aggiornamento Auto</div>';
  h += '<div class="setrow"><div class="setlbl">Stato</div><div class="setval" style="color:'+(S.autoOn?'#00ff88':'#556')+'">'+(S.autoOn?'🔴 LIVE':'⚫ OFF')+'</div></div>';
  h += '<div style="display:flex;gap:6px;margin-top:10px">';
  [30,60,120,300].forEach(function(s){
    h+='<button onclick="setAutoSec('+s+')" style="flex:1;padding:9px 0;border-radius:8px;background:'+(S.autoSec===s?'rgba(0,170,255,.2)':'rgba(255,255,255,.03)')+';border:1px solid '+(S.autoSec===s?'#00aaff':'#1a3a5a')+';color:'+(S.autoSec===s?'#00aaff':'#3a6a8f')+';font-size:11px;cursor:pointer;font-weight:'+(S.autoSec===s?700:400)+'">'+
      (s<60?s+'s':s/60+'m')+'</button>';
  });
  h += '</div></div>';

  // Campionati
  h += '<div class="ssec"><div class="ssectit">🌍 Campionati</div>';
  regOrder.forEach(function(reg) {
    const rl = S.leagues.filter(function(l){ return l.r===reg; });
    h += '<div style="margin-bottom:14px"><div style="font-size:10px;font-weight:700;color:'+(REGIONS[reg]&&REGIONS[reg].c||'#00aaff')+';text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">'+(REGIONS[reg]&&REGIONS[reg].l||reg)+'</div>';
    rl.forEach(function(l) {
      const i = S.leagues.indexOf(l);
      h += '<div class="ltrow"><span style="flex:1;font-size:12px;color:#e0f0ff">'+l.f+' '+l.n+'</span>'+
        '<button class="tog '+(l.on?'ton':'toff')+'" onclick="toggleLeague('+i+')"></button></div>';
    });
    h += '</div>';
  });
  h += '</div>';

  // Storico
  h += '<div class="ssec"><div class="ssectit">📊 Storico</div>';
  h += '<div class="setrow"><div class="setlbl">Esiti inseriti</div><div class="setval">'+tot+'</div></div>';
  h += '<div class="setrow"><div class="setlbl">Vittorie</div><div class="setval" style="color:#00cc66">'+win+'</div></div>';
  h += '<div class="setrow"><div class="setlbl">Hit Rate</div><div class="setval" style="color:'+(tot>0&&win/tot>=0.75?'#00ff88':'#ff4466')+'">'+(tot>0?(win/tot*100).toFixed(1)+'%':'—')+'</div></div>';
  h += '<button onclick="clearEsiti()" style="margin-top:12px;width:100%;padding:12px;border-radius:10px;background:rgba(255,68,102,.1);border:1px solid rgba(255,68,102,.3);color:#ff4466;font-size:13px;font-weight:700;cursor:pointer">🗑️ Cancella storico</button></div>';

  return h;
}

/* ══════════════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  // Inizializza leghe
  const saved = LS.get('leagues');
  S.leagues = ALL_LEAGUES.map(function(l) {
    const sv = saved && saved.find(function(x){ return x.id === l.id; });
    return sv ? Object.assign({}, l, { on: sv.on }) : Object.assign({}, l);
  });

  // Carica API key nel campo input
  const ki = document.getElementById('keyinput');
  if (ki && S.apiKey) ki.value = S.apiKey;

  setDot(false);
  renderPage();
});
