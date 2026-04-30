/* SCOUT OVER PRO v5 - iOS Safari compatible */
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});

const LS={
  get:k=>{try{return JSON.parse(localStorage.getItem(k));}catch{return null;}},
  set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))
};

/* ── STATO ──────────────────────────────────────────────────────── */
const S={
  page:'home',
  status:'idle',
  matches:[],
  live:{},
  odds:{},
  esiti:LS.get('esiti')||{},
  error:'',
  apiKey:LS.get('apiKey')||'',
  mkt:'pt',
  conf:'all',
  region:LS.get('region')||'all',
  autoOn:false,
  autoSec:LS.get('autoSec')||1800,
  countdown:0,
  dismissed:LS.get('dismissed')||false,
  leagues:null
};
let _timer=null,_ctimer=null;

const REGIONS={
  all:{l:'🌐 Tutti',c:'#00ff88'},
  europe:{l:'🌍 Europa',c:'#00aaff'},
  uk:{l:'🏴 UK',c:'#ff4466'},
  americas:{l:'🌎 Americhe',c:'#ff8800'},
  asia:{l:'🌏 Asia',c:'#ffcc00'}
};

const ALL_LEAGUES=[
  // ── ITALIA ──
  {id:135,n:'Serie A',        f:'🇮🇹',r:'europe',  s:2025,on:true},
  {id:136,n:'Serie B',        f:'🇮🇹',r:'europe',  s:2025,on:true},
  {id:137,n:'Serie C Grp A',  f:'🇮🇹',r:'europe',  s:2025,on:false},
  {id:138,n:'Serie C Grp B',  f:'🇮🇹',r:'europe',  s:2025,on:false},
  {id:139,n:'Serie C Grp C',  f:'🇮🇹',r:'europe',  s:2025,on:false},
  {id:57, n:'Coppa Italia',   f:'🇮🇹',r:'europe',  s:2025,on:false},
  // ── SPAGNA ──
  {id:140,n:'La Liga',        f:'🇪🇸',r:'europe',  s:2025,on:true},
  {id:141,n:'La Liga 2',      f:'🇪🇸',r:'europe',  s:2025,on:true},
  {id:142,n:'Segunda B (RF)', f:'🇪🇸',r:'europe',  s:2025,on:false},
  {id:143,n:'Tercera Division',f:'🇪🇸',r:'europe', s:2025,on:false},
  {id:556,n:'Copa del Rey',   f:'🇪🇸',r:'europe',  s:2025,on:true},
  {id:560,n:'Supercopa ES',   f:'🇪🇸',r:'europe',  s:2025,on:false},
  // ── UK & IRLANDA ──
  {id:39, n:'Premier League', f:'🏴',r:'uk',       s:2025,on:true},
  {id:40, n:'Championship',   f:'🏴',r:'uk',       s:2025,on:true},
  {id:41, n:'League One',     f:'🏴',r:'uk',       s:2025,on:true},
  {id:42, n:'League Two',     f:'🏴',r:'uk',       s:2025,on:true},
  {id:43, n:'National League',f:'🏴',r:'uk',       s:2025,on:false},
  {id:45, n:'FA Cup',         f:'🏴',r:'uk',       s:2025,on:true},
  {id:46, n:'League Cup',     f:'🏴',r:'uk',       s:2025,on:false},
  {id:48, n:'EFL Trophy',     f:'🏴',r:'uk',       s:2025,on:false},
  {id:179,n:'Scottish Prem.', f:'🏴',r:'uk',       s:2025,on:true},
  {id:180,n:'Scottish Champ.',f:'🏴',r:'uk',       s:2025,on:false},
  {id:181,n:'Scottish Lge 1', f:'🏴',r:'uk',       s:2025,on:false},
  {id:182,n:'Scottish Lge 2', f:'🏴',r:'uk',       s:2025,on:false},
  {id:183,n:'Scottish FA Cup',f:'🏴',r:'uk',       s:2025,on:false},
  {id:357,n:'Lge of Ireland', f:'🇮🇪',r:'uk',      s:2025,on:false},
  {id:358,n:'FAI Cup',        f:'🇮🇪',r:'uk',      s:2025,on:false},
  // ── RESTO EUROPA ──
  {id:78, n:'Bundesliga',     f:'🇩🇪',r:'europe',  s:2025,on:true},
  {id:79, n:'Bundesliga 2',   f:'🇩🇪',r:'europe',  s:2025,on:true},
  {id:61, n:'Ligue 1',        f:'🇫🇷',r:'europe',  s:2025,on:true},
  {id:62, n:'Ligue 2',        f:'🇫🇷',r:'europe',  s:2025,on:false},
  {id:88, n:'Eredivisie',     f:'🇳🇱',r:'europe',  s:2025,on:true},
  {id:94, n:'Liga Portugal',  f:'🇵🇹',r:'europe',  s:2025,on:true},
  {id:95, n:'Liga Portugal 2',f:'🇵🇹',r:'europe',  s:2025,on:false},
  {id:144,n:'Jupiler Pro',    f:'🇧🇪',r:'europe',  s:2025,on:true},
  {id:203,n:'Super Lig TR',   f:'🇹🇷',r:'europe',  s:2025,on:true},
  {id:113,n:'Allsvenskan',    f:'🇸🇪',r:'europe',  s:2025,on:false},
  {id:119,n:'Superliga DK',   f:'🇩🇰',r:'europe',  s:2025,on:false},
  {id:103,n:'Eliteserien NO', f:'🇳🇴',r:'europe',  s:2025,on:false},
  {id:106,n:'Ekstraklasa PL', f:'🇵🇱',r:'europe',  s:2025,on:false},
  {id:235,n:'Premier Liga RU',f:'🇷🇺',r:'europe',  s:2025,on:false},
  {id:197,n:'Super League GR',f:'🇬🇷',r:'europe',  s:2025,on:false},
  {id:218,n:'Bundesliga AT',  f:'🇦🇹',r:'europe',  s:2025,on:false},
  // ── COPPE EUROPEE ──
  {id:2,  n:'Champions Lge',  f:'🇪🇺',r:'europe',  s:2025,on:true},
  {id:3,  n:'Europa League',  f:'🇪🇺',r:'europe',  s:2025,on:true},
  {id:848,n:'Conference Lge', f:'🇪🇺',r:'europe',  s:2025,on:true},
  // ── AMERICHE ──
  {id:71, n:'Brasileirao A',  f:'🇧🇷',r:'americas',s:2025,on:true},
  {id:72, n:'Brasileirao B',  f:'🇧🇷',r:'americas',s:2025,on:false},
  {id:128,n:'Liga Argentina', f:'🇦🇷',r:'americas',s:2025,on:true},
  {id:130,n:'Liga MX',        f:'🇲🇽',r:'americas',s:2025,on:true},
  {id:253,n:'MLS',            f:'🇺🇸',r:'americas',s:2025,on:true},
  {id:265,n:'Libertadores',   f:'🌎',r:'americas', s:2025,on:false},
  {id:266,n:'Sudamericana',   f:'🌎',r:'americas', s:2025,on:false},
  // ── ASIA ──
  {id:98, n:'J-League',       f:'🇯🇵',r:'asia',    s:2025,on:true},
  {id:292,n:'K-League',       f:'🇰🇷',r:'asia',    s:2025,on:true},
  {id:307,n:'Saudi Pro Lge',  f:'🇸🇦',r:'asia',    s:2025,on:true},
  {id:323,n:'UAE Pro League', f:'🇦🇪',r:'asia',    s:2025,on:false},
];

const MKT_L=['Ov 0.5 PT','Ov 1.5 FIN'];
const MKT_K=['pt','f15'];
const MKT_C=['#00aaff','#ffcc00'];

/* ── IPC ────────────────────────────────────────────────────────── */
function ipc(p,mkt){
  if(!p||p.veto_forma||p.veto_quota)return{ipc:0,hr:0,fok:false,veto:true,vl:null,vc:'#556'};
  let ovc,ovt,mgc,mgt,h2h,sc,st,smg,sh;
  if(mkt==='pt')     [ovc,ovt,mgc,mgt,h2h,sc,st,smg,sh]=[p.ov05pt_c,p.ov05pt_t,p.mgpt_c,p.mgpt_t,p.h2h_pt,75,70,1.4,65];
  else if(mkt==='f05')[ovc,ovt,mgc,mgt,h2h,sc,st,smg,sh]=[p.ov05f_c,p.ov05f_t,p.mgf_c,p.mgf_t,p.h2h_f05,75,70,1.4,62];
  else               [ovc,ovt,mgc,mgt,h2h,sc,st,smg,sh]=[p.ov15f_c,p.ov15f_t,p.mgf_c,p.mgf_t,p.h2h_f15,72,68,2.5,58];
  let v=0.2*mgc+0.2*mgt+0.25*(ovc/100)+0.25*(ovt/100)+0.05*(h2h/100);
  v+=[p.topAttacco,(mgc+mgt)>=1.2,p.derby,p.motivazioni].filter(Boolean).length*0.03;
  // Bonus favorita in casa: squadra forte che gioca davanti al pubblico di casa
  if(p.isFavoriteHome) v+=0.05;
  let vb=0,vl=null,vc='#3a6a8f';
  const od=S.odds[p.id];
  if(od){
    const om=mkt==='f15'?od.ov15:mkt==='f05'?od.ov05:od.ov05ht;
    if(om?.avg){
      const ip=1/om.avg*100;
      if(ip>=70){vb=0.04;vl='💰 Volume Alto';vc='#00ff88';}
      else if(ip>=60){vb=0.02;vl='📈 Vol. Medio';vc='#ffcc00';}
      else if(ip<45){vb=-0.02;vl='⚠️ Bassa liq.';vc='#ff4466';}
      else{vl='🔘 Neutro';vc='#3a6a8f';}
      if(om.open&&(om.open-om.avg)>0.08){vb+=0.02;vl='🎯 Sharp Money';vc='#ffd700';}
      v+=vb;
    }
  }
  const fok=ovc>=sc&&ovt>=st&&(mgc+mgt)>=smg&&h2h>=sh;

  // Penalità: entrambe le squadre poco prolifiche
  let penalty=0;
  if(mgc<1.0&&mgt<1.0)      penalty=0.06;  // entrambe scarsissime
  else if(mgc<1.1&&mgt<1.1) penalty=0.03;  // entrambe sotto la media

  // Penalità: H2H molto basso (le due squadre si sono spesso bloccate)
  if(h2h<45) penalty+=0.04;

  const hr=Math.min(0.97, 0.5+v*0.55+(fok?0.05:0)-penalty);
  return{ipc:+v.toFixed(3),hr:+hr.toFixed(3),fok,veto:false,vl,vc};
}

function rtg(hr,veto){
  if(veto)     return{l:'VETO',c:'#667',bg:'#0d1a27',br:'#334455'};
  if(hr>=0.88) return{l:'ALTA',c:'#00ff88',bg:'#041a0f',br:'#005522'};
  if(hr>=0.75) return{l:'MEDIA',c:'#ffcc00',bg:'#1a1500',br:'#554400'};
  return             {l:'BASSA',c:'#ff4466',bg:'#1a0008',br:'#551122'};
}

/* ── API ────────────────────────────────────────────────────────── */
async function apiFetch(ep){
  const r=await fetch(`https://v3.football.api-sports.io/${ep}`,
    {headers:{'x-rapidapi-key':S.apiKey,'x-rapidapi-host':'v3.football.api-sports.io'}});
  if(!r.ok)throw new Error(`HTTP ${r.status}`);
  const j=await r.json();
  if(j.errors&&Object.keys(j.errors).length)throw new Error(Object.values(j.errors).join(', '));
  return j;
}

function pOv(l){return Math.min(95,Math.max(30,Math.round((1-Math.exp(-l))*100)));}

function mkStats(hs,as_,h2h){
  const gH=parseFloat(hs?.goals?.for?.average?.total)||1.35;
  const gA=parseFloat(as_?.goals?.for?.average?.total)||1.35;
  const mgf_c=+gH.toFixed(2),mgf_t=+gA.toFixed(2);
  const mgpt_c=+(gH*.44).toFixed(2),mgpt_t=+(gA*.44).toFixed(2);

  // Win% in casa (squadra di casa nelle partite giocate in casa)
  const homeW=parseInt(hs?.fixtures?.wins?.home)||0;
  const homeD=parseInt(hs?.fixtures?.draws?.home)||0;
  const homeL=parseInt(hs?.fixtures?.loses?.home)||0;
  const homeTot=homeW+homeD+homeL||1;
  const homeWinPct=Math.round(homeW/homeTot*100);       // % vittorie in casa
  const homeStrength=+(gH-(parseFloat(hs?.goals?.against?.average?.home)||1.2)).toFixed(2); // gol fatti - subiti in casa

  // Win% in trasferta (squadra ospite)
  const awayW=parseInt(as_?.fixtures?.wins?.away)||0;
  const awayD=parseInt(as_?.fixtures?.draws?.away)||0;
  const awayL=parseInt(as_?.fixtures?.loses?.away)||0;
  const awayTot=awayW+awayD+awayL||1;
  const awayWinPct=Math.round(awayW/awayTot*100);       // % vittorie in trasferta
  const awayStrength=+(gA-(parseFloat(as_?.goals?.against?.average?.away)||1.4)).toFixed(2);

  // Favorita in casa: la squadra di casa ha forza nettamente superiore
  // homeStrength > awayStrength + 0.3  →  casa chiaramente favorita
  const isFavoriteHome = homeStrength > awayStrength + 0.3 && homeWinPct >= 45;

  let h2h_pt=62,h2h_f05=72,h2h_f15=60;
  if(h2h?.length){
    const n=h2h.length;
    h2h_pt  =Math.round(h2h.filter(m=>(m.score?.halftime?.home||0)+(m.score?.halftime?.away||0)>0).length/n*100);
    h2h_f05 =Math.round(h2h.filter(m=>(m.goals?.home||0)+(m.goals?.away||0)>0).length/n*100);
    h2h_f15 =Math.round(h2h.filter(m=>(m.goals?.home||0)+(m.goals?.away||0)>1).length/n*100);
  }
  return{mgf_c,mgf_t,mgpt_c,mgpt_t,
    ov05pt_c:pOv(mgpt_c),ov05pt_t:pOv(mgpt_t),
    ov05f_c:pOv(mgf_c),ov05f_t:pOv(mgf_t),
    ov15f_c:pOv(mgf_c*.72),ov15f_t:pOv(mgf_t*.72),
    h2h_pt,h2h_f05,h2h_f15,
    homeWinPct,awayWinPct,homeStrength,awayStrength,isFavoriteHome};
}

async function fetchOdds(fid){
  try{
    const od=await apiFetch(`odds?fixture=${fid}&bookmaker=6`);
    const bets=od.response?.[0]?.bookmakers?.[0]?.bets||[];
    const res={};
    bets.forEach(b=>{
      if(b.name==='Goals Over/Under')
        b.values?.forEach(v=>{
          if(v.value==='Over 0.5')res.ov05={avg:parseFloat(v.odd)};
          if(v.value==='Over 1.5')res.ov15={avg:parseFloat(v.odd)};
        });
      if(b.name==='Goals Over/Under First Half')
        b.values?.forEach(v=>{
          if(v.value==='Over 0.5')res.ov05ht={avg:parseFloat(v.odd)};
        });
    });
    return res;
  }catch{return{};}
}

/* ── LOG ────────────────────────────────────────────────────────── */
function addLog(msg){
  const b=document.getElementById('logbox');
  if(!b)return;
  b.style.display='block';
  if(b.children.length>=5)b.children[0].remove();
  const d=document.createElement('div');
  d.className='logline';d.textContent=msg;b.appendChild(d);
  [...b.querySelectorAll('.logline')].forEach((l,i,a)=>l.classList.toggle('active',i===a.length-1));
}

/* ── FETCH ──────────────────────────────────────────────────────── */
async function fetchMatches(){
  if(!S.apiKey){alert('Inserisci la tua API Key!');return;}
  const btn=document.getElementById('refreshbtn');
  btn.disabled=true;
  btn.innerHTML='<span class="spin"></span> Ricerca...';
  S.status='loading';S.matches=[];S.error='';S.live={};S.odds={};
  const lb=document.getElementById('livebar');
  if(lb)lb.style.display='none';
  document.getElementById('logbox').innerHTML='';
  renderPage();

  try{
    const today=new Date().toISOString().split('T')[0];
    addLog('📡 Connessione API-Football...');
    const fd=await apiFetch(`fixtures?date=${today}&timezone=Europe/Rome`);
    const all=fd.response||[];
    addLog(`📋 ${all.length} partite trovate`);
    const ids=S.leagues.filter(l=>l.on).map(l=>l.id);
    const fil=all.filter(f=>ids.includes(f.league?.id));
    addLog(`🎯 ${fil.length} nei campionati attivi`);
    if(!fil.length)throw new Error(`Nessuna partita oggi (${all.length} in altre leghe). Attiva più campionati nelle Impostazioni.`);

    S.matches=fil.map(f=>{
      const lg=S.leagues.find(l=>l.id===f.league?.id);
      return{id:f.fixture?.id,
        campionato:lg?.n||f.league?.name||'',country:lg?.f||'',region:lg?.r||'europe',
        orario:new Date(f.fixture?.date).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}),
        casa:f.teams?.home?.name,trasferta:f.teams?.away?.name,
        mgf_c:1.35,mgf_t:1.35,mgpt_c:0.59,mgpt_t:0.59,
        ov05pt_c:45,ov05pt_t:45,ov05f_c:73,ov05f_t:73,ov15f_c:62,ov15f_t:62,
        h2h_pt:60,h2h_f05:70,h2h_f15:58,
        topAttacco:false,derby:false,motivazioni:false,
        veto_forma:false,veto_quota:false,
        nota:'Caricamento...',_loading:true};
    }).sort((a,b)=>a.orario.localeCompare(b.orario));

    S.status='done';
    renderPage();

    addLog('🧮 Statistiche e quote...');
    for(let i=0;i<fil.length;i++){
      const f=fil[i];
      const lg=S.leagues.find(l=>l.id===f.league?.id);
      const hid=f.teams?.home?.id,aid=f.teams?.away?.id;
      addLog(`[${i+1}/${fil.length}] ${f.teams?.home?.name} – ${f.teams?.away?.name}`);
      let hs=null,as_=null,h2h=[];
      try{
        const[hr,ar,h2r]=await Promise.all([
          apiFetch(`teams/statistics?league=${f.league.id}&season=${lg?.s||2025}&team=${hid}`),
          apiFetch(`teams/statistics?league=${f.league.id}&season=${lg?.s||2025}&team=${aid}`),
          apiFetch(`fixtures/headtohead?h2h=${hid}-${aid}&last=10`)
        ]);
        hs=hr.response;as_=ar.response;
        h2h=(h2r.response||[]).filter(m=>m.fixture?.status?.short==='FT').slice(0,8);
      }catch{}
      const odData=await fetchOdds(f.fixture?.id);
      S.odds[f.fixture?.id]=odData;
      const st=mkStats(hs,as_,h2h);
      const hF=hs?.form||'',aF=as_?.form||'';
      const veto=[...hF.slice(-4)].filter(c=>c==='L').length>=4||[...aF.slice(-4)].filter(c=>c==='L').length>=4;
      const idx=S.matches.findIndex(m=>m.id===f.fixture?.id);
      if(idx>=0)Object.assign(S.matches[idx],{...st,
        topAttacco:st.mgf_c>2.0||st.mgf_t>2.0,
        derby:false,motivazioni:false,veto_forma:veto,veto_quota:false,
        nota:`${h2h.length} H2H • ${Object.keys(odData).length} mercati odds`,_loading:false});
      S.live[f.fixture?.id]={
        homeGoals:f.goals?.home??null,awayGoals:f.goals?.away??null,
        htHome:f.score?.halftime?.home??null,htAway:f.score?.halftime?.away??null,
        status:f.fixture?.status?.short,minute:f.fixture?.status?.elapsed??null,events:[]};
      if(i<fil.length-1)await new Promise(r=>setTimeout(r,150));
    }
    addLog(`✅ ${S.matches.length} partite pronte!`);
    startAuto();
  }catch(e){
    S.error=e.message;S.status='error';
    addLog(`❌ ${e.message}`);
  }
  btn.disabled=false;btn.innerHTML='🔄 AGGIORNA ORA';
  renderPage();
}

/* ── LIVE ───────────────────────────────────────────────────────── */
async function liveUpdate(){
  if(!S.apiKey||!S.matches.length)return;
  const ids=S.matches.map(m=>m.id).slice(0,20).join('-');
  try{
    const fd=await apiFetch(`fixtures?ids=${ids}&timezone=Europe/Rome`);
    let ch=false;
    (fd.response||[]).forEach(f=>{
      const fid=f.fixture?.id,prev=S.live[fid]||{};
      const nd={homeGoals:f.goals?.home??null,awayGoals:f.goals?.away??null,
        htHome:f.score?.halftime?.home??null,htAway:f.score?.halftime?.away??null,
        status:f.fixture?.status?.short,minute:f.fixture?.status?.elapsed??null,
        events:(f.events||[]).map(e=>({time:e.time?.elapsed,type:e.type,detail:e.detail,player:e.player?.name,team:e.team?.name}))};
      autoEsiti(fid,nd);
      if(prev.homeGoals!==nd.homeGoals||prev.status!==nd.status)ch=true;
      S.live[fid]=nd;
    });
    if(ch){
      S.matches.forEach(m=>{
        const d=S.live[m.id];if(!d)return;
        const sb=document.getElementById(`sb-${m.id}`);
        if(sb)sb.outerHTML=badge(m.id,d);
        const lb=document.getElementById(`lrb-${m.id}`);
        if(lb)lb.outerHTML=liveBox(m.id,d,m);
      });
      updateLiveBar();
    }
    const el=document.getElementById('lbsub');
    if(el)el.textContent='Agg. '+new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  autoSetEsitiFinite();
  }catch(e){console.warn(e);}
}

/* Imposta esiti automatici per partite FT senza esito ancora */
function autoSetEsitiFinite(){
  let changed=false;
  S.matches.forEach(function(m){
    const d=S.live[m.id];
    if(!d||!['FT','AET','PEN'].includes(d.status))return;
    const htG=(d.htHome||0)+(d.htAway||0);
    const ftG=(d.homeGoals||0)+(d.awayGoals||0);
    const map={pt:htG>0?'V':'P',f15:ftG>1?'V':'P'};
    MKT_K.forEach(function(k){
      const key=m.id+'_'+k;
      if(S.esiti[key]===undefined){S.esiti[key]=map[k];changed=true;}
    });
  });
  if(changed){
    LS.set('esiti',S.esiti);
    S.matches.forEach(function(m){
      MKT_K.forEach(function(k){
        ['V','P','N'].forEach(function(v){
          const b=document.getElementById('eb-'+m.id+'-'+k+'-'+v);
          if(b)b.className='ebtn'+(S.esiti[m.id+'_'+k]===v?' s'+v:'');
        });
      });
    });
    if(S.page==='stats')renderPage();
  }
}

function autoEsiti(fid,d){
  if(!['FT','AET','PEN'].includes(d.status))return;
  const hG=(d.htHome??0)+(d.htAway??0),fG=(d.homeGoals??0)+(d.awayGoals??0);
  const map={pt:hG>0?'V':'P',f05:fG>0?'V':'P',f15:fG>1?'V':'P'};
  let upd=false;
  MKT_K.forEach(k=>{const key=`${fid}_${k}`;if(!S.esiti[key]){S.esiti[key]=map[k];upd=true;}});
  if(upd){LS.set('esiti',S.esiti);
    MKT_K.forEach(k=>['V','P','N'].forEach(v=>{
      const b=document.getElementById(`eb-${fid}-${k}-${v}`);
      if(b)b.className='ebtn'+(S.esiti[`${fid}_${k}`]===v?' s'+v:'');
    }));
  }
}

function badge(fid,d){
  if(!d||!d.status||d.status==='NS')return`<span id="sb-${fid}" class="badge bns">—:—</span>`;
  const{homeGoals:hg,awayGoals:ag,htHome:hh,htAway:ha,status:st,minute:mn}=d;
  if(st==='HT')return`<span id="sb-${fid}" class="badge bht">⏸${hh??0}:${ha??0}</span>`;
  if(['FT','AET','PEN'].includes(st))return`<span id="sb-${fid}" class="badge bft">FT ${hg??0}:${ag??0}</span>`;
  if(['1H','2H','ET','BT','P'].includes(st))return`<span id="sb-${fid}" class="badge blive"><span class="dot"></span>${mn||'?'}' ${hg??0}:${ag??0}</span>`;
  return`<span id="sb-${fid}" class="badge bns">—:—</span>`;
}

function liveBox(fid,d,m){
  if(!d||!d.status||d.status==='NS')return`<div id="lrb-${fid}"></div>`;
  const{homeGoals:hg,awayGoals:ag,htHome:hh,htAway:ha,status:st,minute:mn,events:ev}=d;
  const isL=['1H','2H','ET'].includes(st),isH=st==='HT',isF=['FT','AET','PEN'].includes(st);
  const lbl=isL?`🔴 LIVE ${mn}'`:isH?'⏸ INTERVALLO':isF?'✅ FINALE':st;
  const col=isL?'#ff4466':isH?'#ffcc00':'#00ff88';
  const ht=hh!==null?`PT: ${hh}:${ha}`:'';
  const evH=(ev?.length?ev.filter(e=>e.type==='Goal'||e.type==='Card').slice(-5).reverse()
    .map(e=>`<div class="ev${e.type==='Goal'?' gol':''}">${e.type==='Goal'?'⚽':e.detail==='Red Card'?'🟥':'🟨'} ${e.time}' ${e.player||''}</div>`).join('')
    :'<div class="ev" style="color:#1a3a5a">Nessun evento</div>');
  return`<div id="lrb-${fid}" class="lrbox">
    <div class="lrt">${lbl}</div>
    <div class="lrs" style="color:${col}">${hg??0} – ${ag??0}</div>
    <div class="lrm"><span>${m?.casa||''}</span>${ht?`<span style="color:#2a5a7f">${ht}</span>`:''}<span>${m?.trasferta||''}</span></div>
    <div class="levs">${evH}</div>
    <div class="lra"><span class="adot"></span>Auto ogni ${S.autoSec}s</div>
  </div>`;
}

function oddsBox(p,mkt){
  const od=S.odds[p.id];if(!od)return'';
  const om=mkt==='f15'?od.ov15:mkt==='f05'?od.ov05:od.ov05ht;
  if(!om?.avg)return'';
  const ip=Math.round(1/om.avg*100);
  const col=ip>=70?'#00ff88':ip>=55?'#ffcc00':'#ff4466';
  return`<div class="odbox">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
      <span style="font-size:10px;color:#3a6a8f">💰 Volume scommesse</span>
      <span style="font-size:11px;font-weight:700;color:${col}">${ip}% consensus · q.${om.avg.toFixed(2)}</span>
    </div>
    <div style="height:5px;background:#0a1825;border-radius:3px;overflow:hidden">
      <div style="width:${Math.min(100,ip)}%;height:100%;background:${col};border-radius:3px"></div>
    </div>
  </div>`;
}

/* ── AUTO ───────────────────────────────────────────────────────── */
function startAuto(){
  stopAuto();S.autoOn=true;
  const lb=document.getElementById('livebar');if(lb)lb.style.display='block';
  setDot(true);tick();
}
function stopAuto(){
  S.autoOn=false;clearTimeout(_timer);clearInterval(_ctimer);_timer=null;_ctimer=null;setDot(false);
}
function toggleAuto(){
  if(S.autoOn){stopAuto();const pb=document.getElementById('pbtn');if(pb)pb.textContent='▶';}
  else{startAuto();const pb=document.getElementById('pbtn');if(pb)pb.textContent='⏸';}
}
function tick(){
  S.countdown=S.autoSec;updateCd();
  _ctimer=setInterval(()=>{S.countdown--;updateCd();if(S.countdown<=0)clearInterval(_ctimer);},1000);
  _timer=setTimeout(async()=>{
    if(!S.autoOn)return;
    const el=document.getElementById('lbsub');if(el)el.textContent='Aggiornamento...';
    await liveUpdate();tick();
  },S.autoSec*1000);
}
function updateCd(){const el=document.getElementById('lbcd');if(el)el.textContent=S.countdown+'s';}
function setDot(on){
  const d=document.getElementById('ldot');
  if(d)d.style.background=on?'#ff4466':'#334';
  const l=document.getElementById('livelbl');
  if(l)l.textContent=on?'🔴 LIVE':new Date().toLocaleDateString('it-IT',{weekday:'short',day:'numeric',month:'short'});
}
function updateLiveBar(){
  const el=document.getElementById('lbres');if(!el)return;
  const live=S.matches.filter(m=>{const d=S.live[m.id];return d&&['1H','2H','ET','HT'].includes(d.status);});
  el.innerHTML=live.length
    ?live.map(m=>{const d=S.live[m.id];return`<span class="lbsc${d.status==='HT'?'':' ll'}">${m.casa?.split(' ')[0]} ${d.homeGoals??0}:${d.awayGoals??0} ${m.trasferta?.split(' ')[0]}${d.status==='HT'?' HT':` ${d.minute||''}′`}</span>`;}).join('')
    :'<span style="font-size:10px;color:#1a4a7f">Nessuna in corso</span>';
}

/* ── ESITI ──────────────────────────────────────────────────────── */
function setEsito(id,mkt,val){
  const k=`${id}_${mkt}`;
  S.esiti[k]===val?delete S.esiti[k]:(S.esiti[k]=val);
  LS.set('esiti',S.esiti);
  MKT_K.forEach(mk=>['V','P','N'].forEach(v=>{
    const b=document.getElementById(`eb-${id}-${mk}-${v}`);
    if(b)b.className='ebtn'+(S.esiti[`${id}_${mk}`]===v?' s'+v:'');
  }));
  if(S.page==='stats')renderStats();
}
function toggleCard(id){
  const d=document.getElementById(`det-${id}`);
  const c=document.getElementById(`chv-${id}`);
  if(!d)return;
  d.classList.toggle('open');
  if(c)c.textContent=d.classList.contains('open')?'▲':'▼';
}

/* ── NAVIGAZIONE ────────────────────────────────────────────────── */
function nav(p){
  S.page=p;
  // Aggiorna nav bar
  document.querySelectorAll('.nb').forEach(b=>{
    b.classList.toggle('nba',b.dataset.page===p);
  });
  renderPage();
  window.scrollTo(0,0);
}
function setMkt(k){S.mkt=k;renderPage();}
function setConf(c){S.conf=S.conf===c?'all':c;renderPage();}
function setRegion(r){S.region=r;LS.set('region',r);renderPage();}
function saveKey(){
  const k=document.getElementById('keyinput').value.trim();
  if(!k)return;
  S.apiKey=k;LS.set('apiKey',k);
  const b=document.querySelector('.savebtn');
  if(b){b.textContent='✅';b.style.color='#00ff88';setTimeout(()=>{b.textContent='💾';b.style.color='';},2000);}
}
function saveKeySettings(){
  const k=document.getElementById('nki')?.value?.trim();
  if(!k){alert('Inserisci una API Key');return;}
  S.apiKey=k;LS.set('apiKey',k);
  if(document.getElementById('keyinput'))document.getElementById('keyinput').value=k;
  alert('✅ API Key salvata!');renderPage();
}
function setAutoSec(s){
  S.autoSec=s;LS.set('autoSec',s);
  if(s===0){stopAuto();}else if(S.autoOn){stopAuto();startAuto();}
  renderPage();
}
function toggleLeague(i){S.leagues[i].on=!S.leagues[i].on;LS.set('leagues',S.leagues);renderPage();}
function clearEsiti(){if(!confirm('Cancellare tutto lo storico?'))return;S.esiti={};LS.set('esiti',{});renderPage();}
function dismiss(){S.dismissed=true;LS.set('dismissed',true);renderPage();}
function exportCSV(){
  const rows=[['Data','Camp','Ora','Casa','Trasferta','Risultato','IPC_PT','HR_PT%','IPC_05F','HR_05F%','IPC_15F','HR_15F%','Esito_PT','Esito_05F','Esito_15F','Stato']];
  const td=new Date().toLocaleDateString('it-IT');
  S.matches.filter(m=>!m._loading).forEach(p=>{
    const r=MKT_K.map(k=>ipc(p,k));
    const d=S.live[p.id]||{};
    const score=d.homeGoals!=null?`${d.homeGoals}:${d.awayGoals}`:'—';
    rows.push([td,p.campionato,p.orario,p.casa,p.trasferta,score,
      r[0].ipc,(r[0].hr*100).toFixed(1),r[1].ipc,(r[1].hr*100).toFixed(1),r[2].ipc,(r[2].hr*100).toFixed(1),
      S.esiti[`${p.id}_pt`]||'',S.esiti[`${p.id}_f05`]||'',S.esiti[`${p.id}_f15`]||'',d.status||'NS']);
  });
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));
  a.download=`Scout_${td.replace(/\//g,'-')}.csv`;a.click();
}

/* ══════════════════════════════════════════════════════════════════
   RENDER PRINCIPALE — un'unica funzione che aggiorna #main
   ══════════════════════════════════════════════════════════════════ */
/* ── AGGIORNAMENTO RISULTATI FINE GIORNATA ───────────────────── */
async function aggiornaRisultatiGiornata(){
  if(!S.apiKey){alert('Inserisci prima la API Key!');return;}
  const btn=document.getElementById('btn-aggiorna-esiti');
  if(btn){btn.disabled=true;btn.textContent='⏳ Aggiornamento...';}
  
  let aggiornate=0;
  try{
    // Recupera tutte le partite di oggi come fixtures concluse
    const today=new Date().toISOString().split('T')[0];
    const fd=await apiFetch('fixtures?date='+today+'&timezone=Europe/Rome');
    const finished=(fd.response||[]);
    
    finished.filter(function(f){
        const st=f.fixture&&f.fixture.status&&f.fixture.status.short;
        return ['FT','AET','PEN'].includes(st);
      }).forEach(function(f){
      const fid=f.fixture&&f.fixture.id;
      if(!fid)return;
      const htH=f.score&&f.score.halftime&&f.score.halftime.home!=null?f.score.halftime.home:null;
      const htA=f.score&&f.score.halftime&&f.score.halftime.away!=null?f.score.halftime.away:null;
      const ftH=f.goals&&f.goals.home!=null?f.goals.home:null;
      const ftA=f.goals&&f.goals.away!=null?f.goals.away:null;
      if(ftH===null||ftA===null)return;
      
      const htG=(htH||0)+(htA||0);
      const ftG=ftH+ftA;
      const map={
        pt:  htG>0?'V':'P',
        f05: ftG>0?'V':'P',
        f15: ftG>1?'V':'P'
      };
      
      // Aggiorna live data
      if(!S.live[fid])S.live[fid]={};
      S.live[fid].homeGoals=ftH;S.live[fid].awayGoals=ftA;
      S.live[fid].htHome=htH;S.live[fid].htAway=htA;
      S.live[fid].status=f.fixture.status.short;
      
      // Imposta esiti per tutte le partite trovate (sovrascrivi solo quelli non impostati manualmente)
      // Ma qui sovrascriviamo tutti per garantire correttezza
      let found=false;
      MKT_K.forEach(function(k){
        const key=fid+'_'+k;
        // Imposta solo se la partita è in S.matches (è di oggi)
        const match=S.matches.find(function(m){return m.id===fid;});
        if(!match)return;
        S.esiti[key]=map[k];
        found=true;
      });
      if(found)aggiornate++;
    });
    
    if(aggiornate>0){
      LS.set('esiti',S.esiti);
      alert('✅ Aggiornati i risultati di '+aggiornate+' partite!\nOv 0.5 PT, Ov 0.5 FIN e Ov 1.5 FIN impostati automaticamente.');
    }else{
      alert('ℹ️ Nessuna partita conclusa trovata per oggi.\n(Le partite devono essere nello stato FT/AET/PEN)');
    }
  }catch(e){
    alert('❌ Errore: '+e.message);
  }
  if(btn){btn.disabled=false;btn.textContent='🔄 Aggiorna tutti i risultati di oggi';}
  renderPage();
}

/* ── ARCHIVIO PARTITE — GOOGLE SHEETS ──────────────────────────── */
function esportaArchivio(){
  if(!S.matches.length){
    alert('Nessuna partita da esportare. Carica prima le partite del giorno.');
    return;
  }
  
  const today=new Date().toLocaleDateString('it-IT');
  const todayISO=new Date().toISOString().split('T')[0];
  
  // Header arricchito per analisi 0-0
  const header=[
    'Data','Campionato','Paese','Ora',
    'Casa','Trasferta',
    'Ris_PT','Ris_FIN',           // es. "0:0" / "1:2"
    'GolPT','GolFIN',             // numero gol
    'Ov05PT','Ov05FIN','Ov15FIN', // V/P/N
    'IPC_PT','HR_PT%',
    'IPC_05F','HR_05F%',
    'IPC_15F','HR_15F%',
    'GolMedCasa','GolMedTrasf',   // media gol stagionale
    'OvCasaPT%','OvTrasfPT%',     // statistiche storiche
    'OvCasaFIN%','OvTrasfFIN%',
    'H2H_PT%','H2H_05F%','H2H_15F%',
    'TopAttacco','VetoForma',
    'Nota_0_0',                    // campo libero per analisi
    'Status'
  ];
  
  const rows=[header];
  
  S.matches.filter(function(m){return !m._loading;}).forEach(function(p){
    const r=MKT_K.map(function(k){return ipc(p,k);});
    const d=S.live[p.id]||{};
    
    const ftH=d.homeGoals!=null?d.homeGoals:'';
    const ftA=d.awayGoals!=null?d.awayGoals:'';
    const htH=d.htHome!=null?d.htHome:'';
    const htA=d.htAway!=null?d.htAway:'';
    
    const risPT=(htH!==''&&htA!=='')?htH+':'+htA:'';
    const risFIN=(ftH!==''&&ftA!=='')?ftH+':'+ftA:'';
    const golPT=(htH!==''&&htA!=='')?Number(htH)+Number(htA):'';
    const golFIN=(ftH!==''&&ftA!=='')?Number(ftH)+Number(ftA):'';
    
    // Determina se è 0-0 (interessante per analisi)
    const is00FIN=(golFIN===0);
    const nota00=is00FIN?'0-0 FINALE — analizzare':'';
    
    rows.push([
      today, p.campionato, p.country, p.orario,
      p.casa, p.trasferta,
      risPT, risFIN,
      golPT, golFIN,
      S.esiti[p.id+'_pt']||'', S.esiti[p.id+'_f05']||'', S.esiti[p.id+'_f15']||'',
      r[0].ipc, (r[0].hr*100).toFixed(1),
      r[1].ipc, (r[1].hr*100).toFixed(1),
      r[2].ipc, (r[2].hr*100).toFixed(1),
      p.mgf_c||'', p.mgf_t||'',
      p.ov05pt_c||'', p.ov05pt_t||'',
      p.ov05f_c||'', p.ov05f_t||'',
      p.h2h_pt||'', p.h2h_f05||'', p.h2h_f15||'',
      p.topAttacco?'SI':'NO', p.veto_forma?'SI':'NO',
      nota00,
      d.status||'NS'
    ]);
  });
  
  // Crea CSV con separatore ; (compatibile Excel/Google Sheets italiano)
  const csv=rows.map(function(r){
    return r.map(function(v){
      return '"'+String(v===null||v===undefined?'':v).replace(/"/g,'""')+'"';
    }).join(';');
  }).join('\n');
  
  // Download CSV
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='ScoutOver_Archivio_'+todayISO+'.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  // Conta 0-0
  const zero=S.matches.filter(function(m){
    const d=S.live[m.id]||{};
    return d.homeGoals===0&&d.awayGoals===0&&['FT','AET'].includes(d.status);
  });
  
  setTimeout(function(){
    alert(
      '✅ Archivio esportato!\n\n'+
      '📊 Partite totali: '+S.matches.filter(function(m){return !m._loading;}).length+'\n'+
      (zero.length?'🔴 Partite 0-0 oggi: '+zero.length+'\n\n':'\n')+
      'Come importare in Google Sheets:\n'+
      '1. Apri Google Sheets (sheets.google.com)\n'+
      '2. File → Importa → Carica il file CSV\n'+
      '3. Separatore: punto e virgola (;)\n'+
      '4. Aggiungi al foglio esistente per accumulare lo storico'
    );
  }, 500);
}


function renderPage(){
  const main=document.getElementById('main');
  if(!main)return;
  if(S.page==='home')      main.innerHTML=buildHome();
  else if(S.page==='analisi')main.innerHTML=buildAnalisi();
  else if(S.page==='stats') main.innerHTML=buildStats();
  else                       main.innerHTML=buildSettings();
}

/* ── HOME ───────────────────────────────────────────────────────── */
function buildHome(){
  let h='';

  // Banner install
  if(!S.dismissed)
    h+=`<div class="banner">
      <div class="bant">📲 Installa su iPhone</div>
      <div class="bans">1. Apri in <b>Safari</b><br>2. Tocca <b>Condividi ⬆️</b> in basso<br>3. Tocca <b>"Aggiungi a schermata Home"</b></div>
      <button class="bandis" onclick="dismiss()">✓ Ho capito</button>
    </div>`;

  // Hero
  h+=`<div class="hero">
    <div class="htitle">⚽ SCOUT OVER PRO</div>
    <div class="hsub">Ov 0.5 PT · Ov 0.5 FIN · Ov 1.5 FIN + Volume scommesse</div>
    <div class="hdate">${new Date().toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'})}</div>
  </div>`;

  // Stato idle
  if(S.status==='idle'){
    h+=`<div class="idle">
      <div style="font-size:48px;margin-bottom:12px">⚽</div>
      <div class="idlet">Pronto all'analisi</div>
      <div class="idled">Inserisci la <b style="color:#ffcc00">API Key gratuita</b><br>nel campo in alto, poi premi<br><b style="color:#00aaff">🔄 AGGIORNA ORA</b></div>
      <div style="margin-top:12px;font-size:10px;color:#1a4060;line-height:1.6">
        Ottieni la chiave gratis su<br><b style="color:#00aaff">dashboard.api-football.com</b><br>100 richieste/giorno • No carta di credito
      </div>
    </div>`;
    return h;
  }

  // Errore
  if(S.status==='error'){
    h+=`<div class="errbox">
      <div style="font-size:28px;margin-bottom:8px">⚠️</div>
      <div class="errt">Errore</div>
      <div class="errm">${S.error}</div>
    </div>`;
  }

  // Partite trovate
  if(S.matches.length>0){
    const done=S.matches.filter(m=>!m._loading).length;
    const tot=S.matches.length;

    // Barra progresso
    if(done<tot){
      const pct=Math.round(done/tot*100);
      h+=`<div class="progwrap">
        <div class="progbar" style="width:${pct}%"></div>
      </div>
      <div class="proglbl">${done}/${tot} analizzate...</div>`;
    }

    // Sommario
    const alta=S.matches.filter(m=>{if(m._loading)return false;const r=ipc(m,S.mkt);return !r.veto&&r.hr>=0.88;}).length;
    h+=`<div class="sumrow">
      <div class="sumpill"><div class="sumn" style="color:#00aaff">${tot}</div><div class="suml">Partite</div></div>
      <div class="sumpill"><div class="sumn" style="color:#00ff88">${done}</div><div class="suml">Analizzate</div></div>
      <div class="sumpill"><div class="sumn" style="color:#ffd700">${alta}</div><div class="suml">⭐ Alta</div></div>
    </div>`;

    // Filtro regione
    h+=`<div class="chips">`;
    Object.entries(REGIONS).forEach(([k,v])=>{
      const cnt=k==='all'?S.matches.length:S.matches.filter(m=>m.region===k).length;
      if(cnt===0&&k!=='all')return;
      h+=`<button class="chip${S.region===k?' on':''}" onclick="setRegion('${k}')" style="${S.region===k?`--cc:${v.c}`:''}">
        ${v.l} (${cnt})
      </button>`;
    });
    h+='</div>';

    // Lista partite per campionato
    const showR=S.region==='all'?null:S.region;
    const byL={};
    S.matches.filter(m=>!showR||m.region===showR).forEach(m=>{
      if(!byL[m.campionato])byL[m.campionato]={f:m.country,list:[]};
      byL[m.campionato].list.push(m);
    });

    Object.entries(byL).forEach(([league,{f,list}])=>{
      h+=`<div class="lghdr"><span>${f}</span><span class="lgname">${league}</span><span class="lgcnt">${list.length}</span></div>`;
      list.forEach(m=>{
        const d=S.live[m.id]||{};
        const isL=m._loading;
        const best=isL?{hr:0,veto:false}:MKT_K.map(k=>ipc(m,k)).reduce((a,b)=>a.hr>b.hr?a:b);
        const rt=isL?{l:'⏳',c:'#1a3a5a'}:rtg(best.hr,best.veto);
        h+=`<div class="mrow">
          <span class="mtime">${m.orario}</span>
          <div class="mteams"><span>${m.casa}</span><span class="mvs">vs</span><span>${m.trasferta}</span></div>
          ${badge(m.id,d)}
          <span class="mconf" style="color:${rt.c}">${rt.l}</span>
        </div>`;
      });
    });

    // Bottone vai ad analisi
    if(done>0){
      h+=`<button class="gotobtn" onclick="nav('analisi')">
        📊 Vedi Analisi Complete →
      </button>`;
    }
  }

  return h;
}

/* ── ANALISI ────────────────────────────────────────────────────── */
function buildAnalisi(){
  if(S.status==='idle'||S.status==='error'||(S.status==='loading'&&S.matches.filter(m=>!m._loading).length===0)){
    return`<div class="empty">
      <div style="font-size:48px;margin-bottom:16px">📊</div>
      <div class="emptyt">Nessun dato</div>
      <div class="emptyd">Vai alla Home e premi<br><b style="color:#00aaff">🔄 AGGIORNA ORA</b></div>
      <button class="homebtn" onclick="nav('home')">🏠 Vai alla Home</button>
    </div>`;
  }

  const showR=S.region==='all'?null:S.region;
  const analizzate=S.matches.filter(m=>!m._loading&&(!showR||m.region===showR));
  const sorted=[...analizzate].sort((a,b)=>{
    const ra=ipc(a,S.mkt), rb=ipc(b,S.mkt);
    // Prima le non-veto; a parità, favorita in casa prima; a parità, HR più alto
    if(ra.veto!==rb.veto) return ra.veto?1:-1;
    const favA=a.isFavoriteHome?0.015:0;
    const favB=b.isFavoriteHome?0.015:0;
    return (rb.hr+favB)-(ra.hr+favA);
  });
  const filt=sorted.filter(p=>{
    const r=ipc(p,S.mkt);
    if(S.conf==='alta') return !r.veto&&r.hr>=0.85;
    if(S.conf==='media')return !r.veto&&r.hr>=0.75&&r.hr<0.85;
    if(S.conf==='veto') return r.veto;
    // "Tutte": mostra solo partite con almeno un segnale valido (hr >= 0.68)
    return !r.veto&&r.hr>=0.68;
  });
  const sum={
    alta: sorted.filter(p=>{const r=ipc(p,S.mkt);return !r.veto&&r.hr>=0.85;}).length,
    media:sorted.filter(p=>{const r=ipc(p,S.mkt);return !r.veto&&r.hr>=0.75&&r.hr<0.85;}).length,
  };

  let h='';

  // Filtro regione
  h+=`<div class="chips">`;
  Object.entries(REGIONS).forEach(([k,v])=>{
    const cnt=k==='all'?sorted.length:sorted.filter(m=>m.region===k).length;
    if(cnt===0&&k!=='all')return;
    h+=`<button class="chip${S.region===k?' on':''}" onclick="setRegion('${k}')" style="${S.region===k?`--cc:${v.c}`:''}">
      ${v.l} (${cnt})
    </button>`;
  });
  h+='</div>';

  // Filtro mercato
  h+=`<div class="chips">`;
  MKT_K.forEach((k,i)=>{
    h+=`<button class="chip${S.mkt===k?' on':''}" onclick="setMkt('${k}')" style="${S.mkt===k?`--cc:${MKT_C[i]}`:''}">
      ${MKT_L[i]}
    </button>`;
  });
  h+='</div>';

  // Sommario confidenza
  h+=`<div class="sumrow">`;
  [['all','Tutte','#00aaff',sorted.length],['alta','Alta','#00ff88',sum.alta],['media','Media','#ffcc00',sum.media]].forEach(([k,l,c,n])=>{
    h+=`<div class="sumpill${S.conf===k?' son':''}" onclick="setConf('${k}')" style="${S.conf===k?`--cc:${c}`:''}">
      <div class="sumn" style="color:${c}">${n}</div>
      <div class="suml">${l}</div>
    </div>`;
  });
  h+='</div>';

  // Cards
  filt.forEach((p,idx)=>{
    const mkts=MKT_K.map(k=>ipc(p,k));
    const best=mkts.reduce((a,b)=>a.hr>b.hr?a:b);
    const rt=rtg(best.hr,best.veto);
    const d=S.live[p.id]||{};
    h+=`<div class="card" style="background:${rt.bg};border:1px solid ${rt.br};animation-delay:${idx*.03}s">
      <div class="chead" onclick="toggleCard(${p.id})">
        <div class="cmeta">
          <span class="ctag">${p.country} ${p.campionato}</span>
          <span class="ctime">${p.orario}</span>
          ${badge(p.id,d)}
        </div>
        <div class="cteams">
          <span class="ct">${p.casa}</span>
          <span class="cvs">VS</span>
          <span class="ct" style="text-align:right">${p.trasferta}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
          <span style="font-size:11px;font-weight:800;color:${rt.c}">${rt.l}${best.veto?'':' '+Math.round(best.hr*100)+'%'}</span>
          ${p.isFavoriteHome?'<span style="font-size:9px;padding:2px 7px;border-radius:10px;background:rgba(0,170,255,.12);border:1px solid rgba(0,170,255,.3);color:#00aaff">🏠 Fav. casa</span>':''}${best.vl?`<span style="font-size:9px;padding:2px 7px;border-radius:10px;background:#0a1825;color:${best.vc};border:1px solid ${best.vc}33">${best.vl}</span>`:''}\n        </div>
        <div class="cmkts">`;
    MKT_K.forEach((k,i)=>{
      const r=ipc(p,k);
      const col=r.veto?'#334':r.hr>=0.88?MKT_C[i]:r.hr>=0.75?'#ffcc00':'#ff4466';
      const pct=r.veto?0:Math.round(r.hr*100);
      h+=`<div>
        <div style="display:flex;justify-content:space-between">
          <span class="mkl">${MKT_L[i]}</span>
          <span class="mkv" style="color:${col}">${r.veto?'✗':pct+'%'}</span>
        </div>
        <div class="bar"><div class="barf" style="width:${pct}%;background:${col}"></div></div>
        ${r.vl?`<div style="font-size:8px;color:${r.vc};margin-top:1px">${r.vl}</div>`:''}
      </div>`;
    });
    h+=`</div>
      </div>
      <div class="detail" id="det-${p.id}">
        ${liveBox(p.id,d,p)}
        ${oddsBox(p,S.mkt)}
        <div class="sgrid">
          ${[['PT Casa',p.ov05pt_c+'%',p.ov05pt_c>=75],
             ['PT Trasf.',p.ov05pt_t+'%',p.ov05pt_t>=70],
             ['Gol PT',+(p.mgpt_c+p.mgpt_t).toFixed(2),(p.mgpt_c+p.mgpt_t)>=1.4],
             ['H2H PT',p.h2h_pt+'%',p.h2h_pt>=65],
             ['Gol FIN',+(p.mgf_c+p.mgf_t).toFixed(2),(p.mgf_c+p.mgf_t)>=2.5],
             ['H2H 1.5F',p.h2h_f15+'%',p.h2h_f15>=58],
             ['Win% Casa',(p.homeWinPct||0)+'%',(p.homeWinPct||0)>=50],
             ['Win% Trasf.',(p.awayWinPct||0)+'%',(p.awayWinPct||0)<=30]
            ].map(([l,v,ok])=>`<div class="sbox"><div class="sl">${l}</div><div class="sv" style="color:${ok?'#00cc66':'#ff6688'}">${v}</div></div>`).join('')}
        </div>
        <div class="flags">
          ${p.topAttacco?'<span class="flag" style="color:#00cc66;background:rgba(0,204,102,.1)">⚡ Top Att.</span>':''}
          ${p.veto_forma?'<span class="flag" style="color:#ff4466;background:rgba(255,68,102,.1)">🚫 Veto</span>':''}
        </div>
        <div class="nota">${p.nota}</div>
        <div class="esbox">
          <div class="estit">📝 Esito reale (auto a fine partita)</div>
          <div class="esgrid">${MKT_K.map((k,i)=>`<div>
            <div class="esl">${MKT_L[i]}</div>
            <div class="esbtns">${['V','P','N'].map(v=>`<button id="eb-${p.id}-${k}-${v}" class="ebtn${S.esiti[`${p.id}_${k}`]===v?' s'+v:''}" onclick="setEsito(${p.id},'${k}','${v}')">${v}</button>`).join('')}</div>
          </div>`).join('')}</div>
        </div>
      </div>
      <div class="chev" id="chv-${p.id}" onclick="toggleCard(${p.id})">▼</div>
    </div>`;
  });

  if(!filt.length)h+=`<div style="text-align:center;padding:30px;color:#1a4060">Nessuna partita in questa categoria</div>`;
  h+=`<button class="expbtn" onclick="exportCSV()">⬇️ Esporta CSV</button>`;
  return h;
}

/* ── STATS ──────────────────────────────────────────────────────── */
function buildStats(){
  const st={pt:{V:0,P:0,N:0},f05:{V:0,P:0,N:0},f15:{V:0,P:0,N:0}};
  const cf={alta:{V:0,P:0},media:{V:0,P:0},bassa:{V:0,P:0}};
  Object.entries(S.esiti).forEach(([key,val])=>{
    const[id,mkt]=key.split('_');if(!st[mkt])return;
    st[mkt][val]=(st[mkt][val]||0)+1;
    const m=S.matches.find(p=>String(p.id)===id);
    if(m&&(val==='V'||val==='P')){const r=ipc(m,mkt);if(!r.veto){const b=r.hr>=0.88?'alta':r.hr>=0.75?'media':'bassa';cf[b][val]++;}}
  });
  const tV=MKT_K.reduce((s,k)=>s+(st[k].V||0),0);
  const tP=MKT_K.reduce((s,k)=>s+(st[k].P||0),0);
  const tG=tV+tP;
  const auto=S.matches.filter(m=>['FT','AET','PEN'].includes(S.live[m.id]?.status)).length;

  let h=`<div class="stsec">
    <div class="sstit">📊 Riepilogo Globale</div>
    <div class="stgrid">
      <div class="stbox"><div class="stn" style="color:#00aaff">${tG}</div><div class="stl">Giocate</div></div>
      <div class="stbox"><div class="stn" style="color:#00cc66">${tV}</div><div class="stl">Vinte ✓</div></div>
      <div class="stbox"><div class="stn" style="color:#ff4466">${tP}</div><div class="stl">Perse ✗</div></div>
    </div>
    <div class="sthr" style="color:${tG>0?(tV/tG>=0.75?'#00ff88':'#ff4466'):'#2a5a7f'}">
      ${tG>0?(tV/tG*100).toFixed(1)+'%':'—'} <span style="font-size:11px;color:#2a5a7f">Hit Rate</span>
    </div>
    ${auto>0?`<div style="text-align:center;font-size:10px;color:#2a5a7f;margin-top:6px">🤖 ${auto} esiti auto-impostati</div>`:''}
  </div>
  <div class="slbl">Per Mercato</div>
  <div class="smktg">`;

  MKT_K.forEach((k,i)=>{
    const s=st[k];const g=(s.V||0)+(s.P||0);const hr=g>0?((s.V||0)/g*100).toFixed(1):null;
    h+=`<div class="smkt">
      <div class="smktn" style="color:${MKT_C[i]}">${MKT_L[i]}</div>
      <div class="smktr"><span style="color:#00cc66">V:${s.V||0}</span><span style="color:#ff4466">P:${s.P||0}</span><span style="color:#556">N:${s.N||0}</span></div>
      <div class="smkth" style="color:${hr?(parseFloat(hr)>=75?'#00ff88':'#ff4466'):'#2a5a7f'}">${hr?hr+'%':'—'}</div>
      ${g>0?`<div class="bar" style="margin-top:5px"><div class="barf" style="width:${(s.V||0)/g*100}%;background:${MKT_C[i]}"></div></div>`:''}
    </div>`;
  });

  h+=`</div><div class="slbl">Per Fascia</div>`;
  [['🟢 Alta ≥88%','alta','#00ff88'],['🟡 Media 75-87%','media','#ffcc00']].forEach(([l,k,c])=>{
    const s=cf[k];const g=s.V+s.P;const hr=g>0?(s.V/g*100).toFixed(1):null;
    h+=`<div class="sfrow" style="border:1px solid ${c}22">
      <span style="flex:1;font-size:12px;color:${c}">${l}</span>
      <span style="font-size:11px;color:#00cc66">V:${s.V}</span>
      <span style="font-size:11px;color:#ff4466;margin-left:8px">P:${s.P}</span>
      <span style="font-size:13px;font-weight:700;min-width:44px;text-align:right;color:${hr?(parseFloat(hr)>=75?'#00ff88':'#ff4466'):'#2a5a7f'}">${hr?hr+'%':'—'}</span>
    </div>`;
  });



  // Sezione analisi partite 0-0 di oggi
  const oggi00=S.matches.filter(function(m){
    const d=S.live[m.id]||{};
    return d.homeGoals===0&&d.awayGoals===0&&['FT','AET','PEN'].includes(d.status);
  });
  if(oggi00.length>0){
    h+='<div class="zero-box">';
    h+='<div class="zero-tit">🔴 Partite 0-0 di Oggi ('+oggi00.length+')</div>';
    h+='<div class="zero-desc">Analizza queste partite per trovare pattern e migliorare la selezione</div>';
    oggi00.forEach(function(m){
      const r_pt=ipc(m,'pt'),r_f05=ipc(m,'f05'),r_f15=ipc(m,'f15');
      h+='<div class="zero-row">';
      h+='<div class="zero-match">'+m.casa+' vs '+m.trasferta+'<span class="zero-camp"> · '+m.campionato+'</span></div>';
      h+='<div class="zero-stats">';
      h+='<span>IPC PT: <b>'+r_pt.ipc+'</b></span>';
      h+='<span>HR: <b>'+(r_pt.hr*100).toFixed(0)+'%</b></span>';
      h+='<span>Gol/g: <b>'+((m.mgf_c||0)+(m.mgf_t||0)).toFixed(1)+'</b></span>';
      h+='<span>H2H PT: <b>'+(m.h2h_pt||0)+'%</b></span>';
      h+='</div></div>';
    });
    h+='</div>';
  }
  
  // Box aggiornamento risultati fine giornata
  h+='<div class="aggbox">';
  h+='<div class="aggtit">📅 Aggiornamento Risultati Fine Giornata</div>';
  h+='<div class="aggdesc">Imposta automaticamente tutti gli esiti V/P di oggi per tutti e 3 i mercati (Ov 0.5 PT, Ov 0.5 FIN, Ov 1.5 FIN) recuperando i risultati finali da API-Football.</div>';
  h+='<button id="btn-aggiorna-esiti" onclick="aggiornaRisultatiGiornata()" class="aggbtn">🔄 Aggiorna tutti i risultati di oggi</button>';
  h+='<div class="agginfo">⚠️ Usa 1 richiesta API. Sovrascrive gli esiti già impostati.</div>';
  h+='</div>';
  
  // Box archivio Google Sheets  
  h+='<div class="aggbox" style="border-color:rgba(0,255,136,.3);background:rgba(0,255,136,.05)">';
  h+='<div class="aggtit" style="color:#00ff88">📊 Archivio Google Sheets</div>';
  h+='<div class="aggdesc">Esporta tutte le partite in un CSV da importare su Google Sheets. Include dati per analisi pattern sulle partite 0-0 (sempre perdenti).</div>';
  h+='<button onclick="esportaArchivio()" class="aggbtn" style="border-color:#00ff88;color:#00ff88;background:rgba(0,255,136,.08)">📥 Esporta CSV per Google Sheets</button>';
  h+='<div class="agginfo">Le partite 0-0 vengono evidenziate automaticamente nel CSV</div>';
  h+='</div';
  return h;
}

/* ── SETTINGS ───────────────────────────────────────────────────── */
function buildSettings(){
  const saved=LS.get('apiKey')||'';
  const masked=saved?saved.substring(0,4)+'•••'+saved.slice(-4):'Non configurata';
  const tot=Object.keys(S.esiti).filter(k=>['V','P'].includes(S.esiti[k])).length;
  const win=Object.values(S.esiti).filter(v=>v==='V').length;
  const regOrder=['europe','uk','americas','asia'];

  return`
  <div class="ssec">
    <div class="ssectit">🔑 API Key</div>
    <div class="setrow"><div class="setlbl">Chiave attuale</div><div class="setval">${masked}</div></div>
    <div style="display:flex;gap:8px;margin-top:10px">
      <input type="text" id="nki" placeholder="Nuova API Key..." style="flex:1;background:#0f1e2e;border:1px solid #1a3a5a;border-radius:10px;padding:10px 12px;color:#e0f0ff;font-size:12px;outline:none;-webkit-appearance:none;font-family:monospace">
      <button onclick="saveKeySettings()" style="background:rgba(255,204,0,.12);border:1px solid rgba(255,204,0,.4);border-radius:10px;padding:10px 14px;color:#ffcc00;font-size:12px;font-weight:700;cursor:pointer">Salva</button>
    </div>
    <div style="font-size:10px;color:#2a5a7f;margin-top:8px;line-height:1.6">
      ➜ Registrati su <b style="color:#00aaff">dashboard.api-football.com</b><br>
      ➜ 100 richieste/giorno • Gratis • No carta di credito
    </div>
  </div>

  <div class="ssec">
    <div class="ssectit">⏱️ Aggiornamento Automatico</div>
    <div class="setrow"><div class="setlbl">Stato</div><div class="setval" style="color:${S.autoOn?'#00ff88':'#556'}">${S.autoOn?'🔴 LIVE':'⚫ OFF'}</div></div>
    <div style="display:flex;gap:6px;margin-top:10px">
      ${[[1800,"30m"],[3600,"1h"],[7200,"2h"],[0,"Off"]].map(s=>`<button onclick="setAutoSec(${s})" style="flex:1;padding:9px 0;border-radius:8px;background:${S.autoSec===s?'rgba(0,170,255,.2)':'rgba(255,255,255,.03)'};border:1px solid ${S.autoSec===s?'#00aaff':'#1a3a5a'};color:${S.autoSec===s?'#00aaff':'#3a6a8f'};font-size:11px;cursor:pointer;font-weight:${S.autoSec===s?700:400}">${s<60?s+'s':s/60+'m'}</button>`).join('')}
    </div>
    <div style="font-size:10px;color:#2a5a7f;margin-top:8px;line-height:1.5">ℹ️ 1 sola richiesta API per ciclo. Esiti V/P auto a fine partita.</div>
  </div>

  <div class="ssec">
    <div class="ssectit">🌍 Campionati</div>
    ${regOrder.map(reg=>{
      const rl=S.leagues.filter(l=>l.r===reg);
      return`<div style="margin-bottom:14px">
        <div style="font-size:10px;font-weight:700;color:${REGIONS[reg]?.c||'#00aaff'};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">${REGIONS[reg]?.l||reg}</div>
        ${rl.map(l=>{const i=S.leagues.indexOf(l);return`<div class="ltrow">
          <span style="flex:1;font-size:12px;color:#e0f0ff">${l.f} ${l.n}</span>
          <button class="tog ${l.on?'ton':'toff'}" onclick="toggleLeague(${i})"></button>
        </div>`;}).join('')}
      </div>`;
    }).join('')}
  </div>

  <div class="ssec">
    <div class="ssectit">📊 Storico</div>
    <div class="setrow"><div class="setlbl">Esiti inseriti</div><div class="setval">${tot}</div></div>
    <div class="setrow"><div class="setlbl">Vittorie totali</div><div class="setval" style="color:#00cc66">${win}</div></div>
    <div class="setrow"><div class="setlbl">Hit Rate</div><div class="setval" style="color:${tot>0&&win/tot>=0.75?'#00ff88':'#ff4466'}">${tot>0?(win/tot*100).toFixed(1)+'%':'—'}</div></div>
    <button onclick="clearEsiti()" style="margin-top:12px;width:100%;padding:12px;border-radius:10px;background:rgba(255,68,102,.1);border:1px solid rgba(255,68,102,.3);color:#ff4466;font-size:13px;font-weight:700;cursor:pointer">🗑️ Cancella storico esiti</button>
  </div>`;
}

/* ══════════════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded',()=>{
  // Merge leagues
  const saved=LS.get('leagues');
  S.leagues=ALL_LEAGUES.map(l=>{const sv=saved?.find(x=>x.id===l.id);return sv?{...l,on:sv.on}:l;});

  if(S.apiKey){const ki=document.getElementById('keyinput');if(ki)ki.value=S.apiKey;}
  setDot(false);
  renderPage();
});
