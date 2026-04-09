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
  autoSec:LS.get('autoSec')||60,
  countdown:0,
  dismissed:LS.get('dismissed')||false,
  leagues:null,
  oddsApiKey: LS.get('oddsApiKey')||'',
  oddsData: {},      // eventId → { over05: {betfair, pinnacle, avg, move}, over15: {...} }
  goalAlerts: {},    // matchId → { active, level, lastNotify }
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
  {id:135,n:'Serie A',f:'🇮🇹',r:'europe',s:2025,on:true},
  {id:136,n:'Serie B',f:'🇮🇹',r:'europe',s:2025,on:false},
  {id:140,n:'La Liga',f:'🇪🇸',r:'europe',s:2025,on:true},
  {id:78,n:'Bundesliga',f:'🇩🇪',r:'europe',s:2025,on:true},
  {id:79,n:'Bundesliga 2',f:'🇩🇪',r:'europe',s:2025,on:false},
  {id:61,n:'Ligue 1',f:'🇫🇷',r:'europe',s:2025,on:true},
  {id:88,n:'Eredivisie',f:'🇳🇱',r:'europe',s:2025,on:true},
  {id:94,n:'Liga Portugal',f:'🇵🇹',r:'europe',s:2025,on:true},
  {id:144,n:'Jupiler Pro',f:'🇧🇪',r:'europe',s:2025,on:true},
  {id:203,n:'Super Lig',f:'🇹🇷',r:'europe',s:2025,on:true},
  {id:113,n:'Allsvenskan',f:'🇸🇪',r:'europe',s:2025,on:false},
  {id:235,n:'Premier Liga RU',f:'🇷🇺',r:'europe',s:2025,on:false},
  {id:2,n:'Champions Lge',f:'🇪🇺',r:'europe',s:2025,on:true},
  {id:3,n:'Europa League',f:'🇪🇺',r:'europe',s:2025,on:true},
  {id:848,n:'Conference Lge',f:'🇪🇺',r:'europe',s:2025,on:false},
  {id:39,n:'Premier League',f:'🏴',r:'uk',s:2025,on:true},
  {id:40,n:'Championship',f:'🏴',r:'uk',s:2025,on:true},
  {id:45,n:'FA Cup',f:'🏴',r:'uk',s:2025,on:true},
  {id:179,n:'Scottish Prem.',f:'🏴',r:'uk',s:2025,on:true},
  {id:71,n:'Brasileirao A',f:'🇧🇷',r:'americas',s:2025,on:true},
  {id:128,n:'Liga Argentina',f:'🇦🇷',r:'americas',s:2025,on:true},
  {id:130,n:'Liga MX',f:'🇲🇽',r:'americas',s:2025,on:true},
  {id:253,n:'MLS',f:'🇺🇸',r:'americas',s:2025,on:true},
  {id:265,n:'Libertadores',f:'🌎',r:'americas',s:2025,on:false},
  {id:98,n:'J-League',f:'🇯🇵',r:'asia',s:2025,on:true},
  {id:292,n:'K-League',f:'🇰🇷',r:'asia',s:2025,on:true},
  {id:307,n:'Saudi Pro Lge',f:'🇸🇦',r:'asia',s:2025,on:true},
];


// The Odds API sport keys per campionato
const ODDS_SPORT_KEYS = {
  135:'soccer_italy_serie_a',
  136:'soccer_italy_serie_b',
  140:'soccer_spain_la_liga',
  78: 'soccer_germany_bundesliga',
  79: 'soccer_germany_bundesliga2',
  61: 'soccer_france_ligue_one',
  62: 'soccer_france_ligue_two',
  88: 'soccer_netherlands_eredivisie',
  94: 'soccer_portugal_primeira_liga',
  144:'soccer_belgium_first_div',
  203:'soccer_turkey_super_league',
  39: 'soccer_epl',
  40: 'soccer_england_championship',
  45: 'soccer_fa_cup',
  179:'soccer_scotland_premiership',
  2:  'soccer_uefa_champs_league',
  3:  'soccer_uefa_europa_league',
  71: 'soccer_brazil_campeonato',
  128:'soccer_argentina_primera_division',
  130:'soccer_mexico_ligamx',
  253:'soccer_usa_mls',
  98: 'soccer_japan_j_league',
  292:'soccer_korea_kleague1',
};

const MKT_L=['Ov 0.5 PT','Ov 0.5 FIN','Ov 1.5 FIN'];
const MKT_K=['pt','f05','f15'];
const MKT_C=['#00aaff','#00cc66','#ffcc00'];

/* ── IPC ────────────────────────────────────────────────────────── */
function ipc(p,mkt){
  if(!p||p.veto_forma||p.veto_quota)return{ipc:0,hr:0,fok:false,veto:true,vl:null,vc:'#556'};
  let ovc,ovt,mgc,mgt,h2h,sc,st,smg,sh;
  if(mkt==='pt')     [ovc,ovt,mgc,mgt,h2h,sc,st,smg,sh]=[p.ov05pt_c,p.ov05pt_t,p.mgpt_c,p.mgpt_t,p.h2h_pt,75,70,1.4,65];
  else if(mkt==='f05')[ovc,ovt,mgc,mgt,h2h,sc,st,smg,sh]=[p.ov05f_c,p.ov05f_t,p.mgf_c,p.mgf_t,p.h2h_f05,75,70,1.4,62];
  else               [ovc,ovt,mgc,mgt,h2h,sc,st,smg,sh]=[p.ov15f_c,p.ov15f_t,p.mgf_c,p.mgf_t,p.h2h_f15,72,68,2.5,58];
  let v=0.2*mgc+0.2*mgt+0.25*(ovc/100)+0.25*(ovt/100)+0.05*(h2h/100);
  v+=[p.topAttacco,(mgc+mgt)>=1.2,p.derby,p.motivazioni].filter(Boolean).length*0.03;
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
  const hr=Math.min(0.97,0.5+v*0.55+(fok?0.05:0));
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
    h2h_pt,h2h_f05,h2h_f15};
}

/* ── THE ODDS API — flusso scommesse Betfair + multi-bookmaker ─── */
async function fetchOddsAPI(matches){
  if(!S.oddsApiKey)return;
  // Raggruppa partite per sport key
  const bySport={};
  matches.forEach(m=>{
    const sk=ODDS_SPORT_KEYS[m.leagueId];
    if(!sk)return;
    if(!bySport[sk])bySport[sk]=[];
    bySport[sk].push(m);
  });
  for(const [sportKey, ms] of Object.entries(bySport)){
    try{
      const url=`https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${S.oddsApiKey}&regions=eu,uk&markets=totals&oddsFormat=decimal&bookmakers=betfair,pinnacle,bet365,unibet`;
      const res=await fetch(url);
      if(!res.ok)continue;
      const data=await res.json();
      data.forEach(ev=>{
        // Prova ad abbinare la partita per nome squadra
        const match=ms.find(m=>
          (ev.home_team&&m.casa&&levenshteinMatch(ev.home_team,m.casa))||
          (ev.away_team&&m.trasferta&&levenshteinMatch(ev.away_team,m.trasferta))
        );
        if(!match)return;
        const odResult={over05:{},over15:{},over25:{}};
        ev.bookmakers?.forEach(bk=>{
          bk.markets?.forEach(mkt=>{
            if(mkt.key!=='totals')return;
            mkt.outcomes?.forEach(out=>{
              if(out.name!=='Over')return;
              const point=parseFloat(out.point);
              const odd=parseFloat(out.price);
              if(point===0.5)odResult.over05[bk.key]={odd,point};
              else if(point===1.5)odResult.over15[bk.key]={odd,point};
              else if(point===2.5)odResult.over25[bk.key]={odd,point};
            });
          });
        });
        // Calcola media, movimento e consensus
        ['over05','over15','over25'].forEach(mk=>{
          const vals=Object.values(odResult[mk]).map(v=>v.odd).filter(v=>v>0);
          if(!vals.length)return;
          const avg=vals.reduce((a,b)=>a+b,0)/vals.length;
          const min=Math.min(...vals);
          const max=Math.max(...vals);
          const betfairOdd=odResult[mk]['betfair']?.odd;
          const pinnacleOdd=odResult[mk]['pinnacle']?.odd;
          // Sharp money: se Betfair/Pinnacle è PIÙ BASSO della media soft books → denaro su Over
          const sharpSignal=betfairOdd&&avg?((avg-betfairOdd)/avg)*100:0;
          odResult[mk]={
            ...odResult[mk],
            avg:+avg.toFixed(3),
            min:+min.toFixed(3),
            max:+max.toFixed(3),
            implProb:+(1/avg*100).toFixed(1),
            betfairOdd:betfairOdd||null,
            pinnacleOdd:pinnacleOdd||null,
            sharpSignal:+sharpSignal.toFixed(1),
            bookCount:vals.length,
          };
        });
        S.oddsData[match.id]=odResult;
      });
    }catch(e){console.warn('Odds API:',e.message);}
  }
}

// Semplice matching fuzzy per nomi squadra
function levenshteinMatch(a,b){
  if(!a||!b)return false;
  a=a.toLowerCase().replace(/[^a-z]/g,'');
  b=b.toLowerCase().replace(/[^a-z]/g,'');
  if(a===b)return true;
  if(a.includes(b.substring(0,5))||b.includes(a.substring(0,5)))return true;
  return false;
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
        leagueId:f.league?.id,
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
        leagueId:f.league?.id,
        nota:`${h2h.length} H2H • ${Object.keys(odData).length} mercati odds`,_loading:false});
      S.live[f.fixture?.id]={
        homeGoals:f.goals?.home??null,awayGoals:f.goals?.away??null,
        htHome:f.score?.halftime?.home??null,htAway:f.score?.halftime?.away??null,
        status:f.fixture?.status?.short,minute:f.fixture?.status?.elapsed??null,events:[]};
      if(i<fil.length-1)await new Promise(r=>setTimeout(r,150));
    }
    addLog(`✅ ${S.matches.length} partite pronte!`);
    // Fetch volume da The Odds API (aggiuntivo, non blocca se fallisce)
    if(S.oddsApiKey){
      addLog('💹 Caricamento volumi Betfair...');
      fetchOddsAPI(S.matches).then(()=>{addLog('✅ Volumi Betfair caricati');renderPage();}).catch(()=>{});
    }
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
  }catch(e){console.warn(e);}
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
    ${(()=>{const r=buildGPIWidget(fid,S.live[fid]?.gpi!=null?{gpi:S.live[fid].gpi,factors:S.live[fid].gpiFactors||[],minute:d.minute}:null);return r;})()}
  </div>`;
}

function oddsBox(p,mkt){
  // Mostra sezione volume per TUTTI e 3 i mercati
  const od=S.odds[p.id];
  const hasAny=od&&(od.ov05ht||od.ov05||od.ov15);
  
  if(!hasAny){
    return`<div class="odbox">
      <div class="odtit">💰 Volume Scommesse</div>
      <div style="font-size:10px;color:#1a3a5a;text-align:center;padding:6px 0">
        Dati odds non disponibili per questo campionato<br>
        <span style="color:#2a5a7f">(piano free: copertura parziale)</span>
      </div>
    </div>`;
  }

  let h=`<div class="odbox"><div class="odtit">💰 Volume Scommesse & Flussi</div><div class="odgrid">`;
  
  const markets=[
    {key:'ov05ht',label:'Over 0.5 PT',mktK:'pt'},
    {key:'ov05',  label:'Over 0.5 FIN',mktK:'f05'},
    {key:'ov15',  label:'Over 1.5 FIN',mktK:'f15'},
  ];
  
  markets.forEach(({key,label,mktK})=>{
    const om=od[key];
    if(!om?.avg){
      h+=`<div class="oditem">
        <div class="odlbl">${label}</div>
        <div class="odval" style="color:#1a3a5a">N/D</div>
        <div class="odbar"><div class="odfill" style="width:0%"></div></div>
        <div class="odinfo" style="color:#1a3a5a">—</div>
      </div>`;
      return;
    }
    const ip=Math.round(1/om.avg*100);
    const col=ip>=70?'#00ff88':ip>=55?'#ffcc00':'#ff4466';
    const sharp=om.open&&(om.open-om.avg)>0.08;
    const lbl=ip>=70?'Volume Alto':ip>=60?'Vol. Medio':ip<45?'Bassa liq.':'Neutro';
    const icon=sharp?'🎯':ip>=70?'💰':ip>=60?'📈':'🔘';
    h+=`<div class="oditem${mkt===mktK?' odon':''}">
      <div class="odlbl">${label}</div>
      <div class="odval" style="color:${col}">${ip}%</div>
      <div class="odbar"><div class="odfill" style="width:${Math.min(100,ip)}%;background:${col}"></div></div>
      <div class="odinfo" style="color:${col}">${icon} ${lbl}</div>
      <div style="font-size:9px;color:#2a5a7f;margin-top:2px">
        Quota: <b style="color:#e0f0ff">${om.avg.toFixed(2)}</b>
        ${sharp?`<span style="color:#ffd700;margin-left:4px">⬆ Sharp Money</span>`:''}
      </div>
    </div>`;
  });
  
  h+=`</div>
  <div style="font-size:9px;color:#1a3a5a;margin-top:8px;padding-top:6px;border-top:1px solid #0a1825">
    Fonte: Bet365 · Probabilità implicita dalla quota · Sharp Money = quota scesa dall'apertura
  </div>
  </div>`;
  return h;
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

function saveOddsKey(){
  const k=document.getElementById('noki')?.value?.trim();
  if(!k){alert('Inserisci la API Key di The Odds API');return;}
  S.oddsApiKey=k;LS.set('oddsApiKey',k);
  alert('✅ The Odds API Key salvata! Premi Aggiorna Ora per caricare i volumi Betfair.');
  renderPage();
}

function setAutoSec(s){S.autoSec=s;LS.set('autoSec',s);if(S.autoOn){stopAuto();startAuto();}renderPage();}
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
  a.href=URL.createObjectURL(new Blob(['\uFEFF'+css],{type:'text/csv;charset=utf-8'}));
  a.download=`Scout_${td.replace(/\//g,'-')}.csv`;a.click();
}
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

/* ══ GOAL PRESSURE INDEX (GPI) ═══════════════════════════════════ */
function calcGPI(matchId){
  const d=S.live[matchId]||{};
  const mn=d.minute||0;
  const st=d.status;
  if(!['1H','2H','ET'].includes(st))return null;
  let gpi=0,factors=[];

  // Minuto
  let ms=mn>=80?30:mn>=70?22:mn>=60?16:mn>=45?20:mn>=35?14:mn>=20?8:4;
  gpi+=ms;factors.push({l:'Minuto '+mn+"'",v:ms,c:'#3a6a8f'});

  // Corner
  const cH=parseInt(d.cornerH||0),cA=parseInt(d.cornerA||0),cT=cH+cA;
  if(cT>0){const cs=Math.min(25,cT*2.5);gpi+=cs;factors.push({l:'Corner: '+cT,v:cs,c:'#ff8800'});}

  // Tiri in porta
  const sH=parseInt(d.shotOnH||0),sA=parseInt(d.shotOnA||0),sT=sH+sA;
  if(sT>0){const ss=Math.min(20,sT*2);gpi+=ss;factors.push({l:'Tiri porta: '+sT,v:ss,c:'#00aaff'});}

  // Tiri totali
  const stH=parseInt(d.shotH||0),stA=parseInt(d.shotA||0),stT=stH+stA;
  if(stT>0){const sts=Math.min(10,stT*0.8);gpi+=sts;factors.push({l:'Tiri totali: '+stT,v:sts,c:'#00cc66'});}

  // Azioni pericolose recenti (events)
  const evs=d.events||[];
  const recent=evs.filter(e=>e.time&&mn-e.time<=5&&['Goal','Card','subs'].includes(e.type)).length;
  if(recent>0){const rs=Math.min(15,recent*5);gpi+=rs;factors.push({l:'Azioni recenti: '+recent,v:rs,c:'#ff4466'});}

  // Flusso Betfair (sharp signal)
  const od=S.oddsData[matchId];
  const omk=S.mkt==='f15'?od?.over15:S.mkt==='f05'?od?.over05:od?.over05;
  if(omk&&omk.sharpSignal>3){const vs=Math.min(10,omk.sharpSignal*2);gpi+=vs;factors.push({l:'Flusso Betfair: '+omk.sharpSignal.toFixed(1)+'%',v:vs,c:'#ffd700'});}

  return{gpi:Math.min(100,Math.round(gpi)),factors,minute:mn};
}

function getGPILevel(g){
  if(g>=80)return{l:'ALLERTA GOL',c:'#ff4466',bg:'rgba(255,68,102,.12)',pulse:true};
  if(g>=60)return{l:'Alta pressione',c:'#ff8800',bg:'rgba(255,136,0,.08)',pulse:false};
  if(g>=40)return{l:'Attenzione',c:'#ffcc00',bg:'rgba(255,204,0,.06)',pulse:false};
  return{l:'Calma',c:'#00ff88',bg:'rgba(0,255,136,.04)',pulse:false};
}

function triggerGoalAlert(mid,gpi,match){
  if(!S.goalAlerts[mid])S.goalAlerts[mid]={n60:false,n80:false,last:0};
  const a=S.goalAlerts[mid];
  if(gpi>=80&&!a.n80){
    a.n80=true;notifyGoal(match,gpi,'🔴 ALLERTA MASSIMA GOL');
  } else if(gpi>=60&&!a.n60){
    a.n60=true;notifyGoal(match,gpi,'🟠 Alta pressione gol');
  }
  if(gpi<30&&a.last>=60){a.n60=false;a.n80=false;}
  a.last=gpi;
}

function notifyGoal(match,gpi,title){
  if(navigator.vibrate)navigator.vibrate([200,100,200,100,400]);
  if(Notification.permission==='granted'){
    try{new Notification(title+' — '+match.casa+' vs '+match.trasferta,{
      body:'GPI: '+gpi+'/100 · Probabilità gol elevata',
      icon:'icon-192.png',tag:'goal-'+match.id,renotify:true
    });}catch(e){}
  }
  showInAppBanner(match,gpi,title);
}

function showInAppBanner(match,gpi,title){
  const old=document.getElementById('gal-banner');if(old)old.remove();
  const lv=getGPILevel(gpi);
  const b=document.createElement('div');
  b.id='gal-banner';
  b.setAttribute('style','position:fixed;top:0;left:0;right:0;z-index:9999;background:'+lv.bg+';border-bottom:2px solid '+lv.c+';padding:12px 16px;cursor:pointer;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)');
  b.innerHTML='<div style="display:flex;align-items:center;gap:10px"><div style="font-size:24px">⚽</div><div style="flex:1"><div style="font-size:12px;font-weight:800;color:'+lv.c+'">'+title+'</div><div style="font-size:11px;color:#e0f0ff;margin-top:2px">'+match.casa+' vs '+match.trasferta+'</div><div style="font-size:10px;color:#3a6a8f">GPI '+gpi+'/100</div></div><div style="font-size:22px;font-weight:900;color:'+lv.c+';font-family:monospace">'+gpi+'</div><button onclick="document.getElementById('gal-banner').remove()" style="background:none;border:none;color:#3a6a8f;font-size:20px;cursor:pointer;padding:4px">✕</button></div>';
  b.onclick=function(e){if(e.target.tagName==='BUTTON')return;nav('analisi');b.remove();};
  document.body.prepend(b);
  setTimeout(function(){if(b.parentNode)b.remove();},15000);
}

async function requestNotifPerm(){
  if(!('Notification'in window))return false;
  if(Notification.permission==='granted')return true;
  if(Notification.permission==='denied')return false;
  return(await Notification.requestPermission())==='granted';
}

function buildGPIWidget(mid,res){
  if(!res)return'<div id="gpi-'+mid+'"></div>';
  const{gpi,factors,minute}=res;
  const lv=getGPILevel(gpi);
  return'<div id="gpi-'+mid+'" class="gpibox" style="border-color:'+lv.c+'44;background:'+lv.bg+'">'+
    '<div class="gpitop"><span class="gpitit">⚽ Goal Pressure Index · '+minute+"'</span>"+
    '<span class="gpival" style="color:'+lv.c+'">'+gpi+'/100</span></div>'+
    '<div class="gpitrack"><div class="gpifill" style="width:'+gpi+'%;background:'+lv.c+'"></div></div>'+
    '<div class="gpilvl" style="color:'+lv.c+'">'+lv.l+'</div>'+
    (factors.length?'<div class="gpifactors">'+factors.map(function(f){return'<div class="gpif"><span>'+f.l+'</span><span style="color:'+f.c+';font-weight:700">+'+Math.round(f.v)+'</span></div>';}).join('')+'</div>':'')+'</div>';
}

function updateAllGPI(){
  S.matches.forEach(function(m){
    const d=S.live[m.id];
    if(!d||!['1H','2H','ET'].includes(d.status))return;
    const res=calcGPI(m.id);
    if(!res)return;
    d.gpi=res.gpi;d.gpiFactors=res.factors;
    triggerGoalAlert(m.id,res.gpi,m);
    const el=document.getElementById('gpi-'+m.id);
    if(el)el.outerHTML=buildGPIWidget(m.id,res);
  });
}


/* ══════════════════════════════════════════════════════════════════
   RENDER PRINCIPALE — un'unica funzione che aggiorna #main
   ══════════════════════════════════════════════════════════════════ */
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
      // Mostra alert GPI se ci sono partite con alta pressione
      const highGPI=S.matches.filter(m=>{
        const d=S.live[m.id];
        return d&&d.gpi>=60&&['1H','2H','ET'].includes(d.status);
      });
      if(highGPI.length>0){
        h+=`<div class="gal-home">
          <div class="gal-title">🔴 Goal Alert Attivi (${highGPI.length})</div>
          ${highGPI.map(m=>{
            const d=S.live[m.id];
            const lv=getGPILevel(d.gpi);
            return`<div class="gal-row" onclick="nav('analisi')" style="border-color:${lv.c}44">
              <div class="gal-teams">${m.casa} vs ${m.trasferta}</div>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:10px;color:#3a6a8f">${d.minute}'</span>
                <div style="width:60px;height:4px;background:#0a1825;border-radius:2px;overflow:hidden">
                  <div style="width:${d.gpi}%;height:100%;background:${lv.c}"></div>
                </div>
                <span style="font-size:12px;font-weight:800;color:${lv.c}">${d.gpi}</span>
              </div>
            </div>`;
          }).join('')}
        </div>`;
      }
      h+=`<button class="gotobtn" onclick="nav('analisi')">
        📊 Vedi Analisi Complete →
      </button>`;
    }
  }

  return h;
}

/* ── ANALISI ────────────────────────────────────────────────────── */
function buildAnalisi(){
  if(S.status==='idle'||(S.status==='loading'&&!S.matches.filter(m=>!m._loading).length)){
    return`<div class="empty">
      <div style="font-size:48px;margin-bottom:16px">📊</div>
      <div class="emptyt">Nessun dato</div>
      <div class="emptyd">Vai alla Home e premi<br><b style="color:#00aaff">🔄 AGGIORNA ORA</b></div>
      <button class="homebtn" onclick="nav('home')">🏠 Vai alla Home</button>
    </div>`;
  }
  if(S.status==='error'){
    return`<div class="errbox">
      <div style="font-size:28px;margin-bottom:8px">⚠️</div>
      <div class="errt">Errore</div><div class="errm">${S.error}</div>
      <button class="homebtn" style="margin-top:14px" onclick="nav('home')">🏠 Torna alla Home</button>
    </div>`;
  }

  const showR=S.region==='all'?null:S.region;
  const analizzate=S.matches.filter(m=>!m._loading&&(!showR||m.region===showR));
  const sorted=[...analizzate].sort((a,b)=>ipc(b,S.mkt).hr-ipc(a,S.mkt).hr);
  const filt=sorted.filter(p=>{
    const r=ipc(p,S.mkt);
    if(S.conf==='alta') return !r.veto&&r.hr>=0.88;
    if(S.conf==='media')return !r.veto&&r.hr>=0.75&&r.hr<0.88;
    if(S.conf==='bassa')return !r.veto&&r.hr<0.75;
    if(S.conf==='veto') return r.veto;
    return true;
  });
  const alta=sorted.filter(p=>{const r=ipc(p,S.mkt);return !r.veto&&r.hr>=0.88;}).length;
  const media=sorted.filter(p=>{const r=ipc(p,S.mkt);return !r.veto&&r.hr>=0.75&&r.hr<0.88;}).length;

  let h='';

  // Filtro regione
  h+='<div class="chips">';
  Object.entries(REGIONS).forEach(([k,v])=>{
    const cnt=k==='all'?sorted.length:sorted.filter(m=>m.region===k).length;
    if(!cnt&&k!=='all')return;
    h+=`<button class="chip${S.region===k?' on':''}" onclick="setRegion('${k}')">${v.l} (${cnt})</button>`;
  });
  h+='</div>';

  // Filtro mercato
  h+='<div class="chips">';
  MKT_K.forEach((k,i)=>{
    h+=`<button class="chip${S.mkt===k?' on':''}" onclick="setMkt('${k}')">${MKT_L[i]}</button>`;
  });
  h+='</div>';

  // Sommario
  h+='<div class="sumrow">';
  [['all','Tutte','#00aaff',sorted.length],['alta','Alta','#00ff88',alta],['media','Media','#ffcc00',media]].forEach(([k,l,c,n])=>{
    const on=S.conf===k;
    h+=`<div class="sumpill${on?' son':''}" onclick="setConf('${k}')" style="${on?'border-color:'+c+';background:'+c+'18':''}">
      <div class="sumn" style="color:${c}">${n}</div><div class="suml">${l}</div>
    </div>`;
  });
  h+='</div>';

  // Cards
  filt.forEach((p,idx)=>{
    const mkts=MKT_K.map(k=>ipc(p,k));
    const best=mkts.reduce((a,b)=>a.hr>b.hr?a:b);
    const rt=rtg(best.hr,best.veto);
    const d=S.live[p.id]||{};

    // Calcola info volume per mercato corrente
    const od=S.odds[p.id]||{};
    const omCur=S.mkt==='f15'?od.ov15:S.mkt==='f05'?od.ov05:od.ov05ht;
    const hasVol=omCur&&omCur.avg;
    const ip=hasVol?Math.round(1/omCur.avg*100):null;
    const vcol=ip?(ip>=70?'#00ff88':ip>=55?'#ffcc00':'#ff4466'):'#1a3a5a';
    const sharp=omCur&&omCur.open&&(omCur.open-omCur.avg)>0.08;
    const vlbl=sharp?'🎯 Sharp Money':ip>=70?'💰 Volume Alto':ip>=60?'📈 Vol. Medio':ip&&ip<45?'⚠️ Bassa liq.':'🔘 Neutro';

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
        <span style="font-size:12px;font-weight:800;color:${rt.c}">${rt.l}${best.veto?'':' '+Math.round(best.hr*100)+'%'}</span>
        ${best.vl?`<span class="vlchip" style="color:${best.vc};border-color:${best.vc}33">${best.vl}</span>`:''}
      </div>
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
      </div>`;
    });

    h+=`</div>`;

    // ── BLOCCO VOLUME SCOMMESSE (sempre visibile nella card) ──
    h+=`<div class="volbar" style="border-color:${hasVol?vcol+'44':'#0e2035'}">
      <div class="voltop">
        <span class="vollbl">💰 Volume Scommesse · ${MKT_L[MKT_K.indexOf(S.mkt)]}</span>
        ${hasVol
          ? `<span class="volpct" style="color:${vcol}">${ip}% · q.${omCur.avg.toFixed(2)}</span>`
          : `<span style="font-size:9px;color:#1a3a5a">Dati non disp.</span>`}
      </div>
      ${hasVol?`
      <div class="voltrack">
        <div class="volfill" style="width:${Math.min(100,ip)}%;background:${vcol}"></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:3px">
        <span class="voltag" style="color:${vcol}">${vlbl}${sharp?' · <b style="color:#ffd700">quota scesa dall apertura</b>':''}</span>
        <span style="font-size:9px;color:#2a5a7f">Bet365</span>
      </div>`:'<div style="font-size:9px;color:#1a3a5a;padding:4px 0">Attiva più campionati o piano a pagamento per le odds</div>'}
    </div>`;

    h+=`</div>
    <div class="detail" id="det-${p.id}">
      ${liveBox(p.id,d,p)}
      ${oddsBox(p,S.mkt)}
      <div class="sgrid">
        ${[['PT Casa',p.ov05pt_c+'%',p.ov05pt_c>=75],['PT Trasf.',p.ov05pt_t+'%',p.ov05pt_t>=70],
           ['Gol PT',+(p.mgpt_c+p.mgpt_t).toFixed(2),(p.mgpt_c+p.mgpt_t)>=1.4],
           ['H2H PT',p.h2h_pt+'%',p.h2h_pt>=65],
           ['Gol FIN',+(p.mgf_c+p.mgf_t).toFixed(2),(p.mgf_c+p.mgf_t)>=2.5],
           ['H2H 1.5F',p.h2h_f15+'%',p.h2h_f15>=58]
          ].map(([l,v,ok])=>`<div class="sbox"><div class="sl">${l}</div><div class="sv" style="color:${ok?'#00cc66':'#ff6688'}">${v}</div></div>`).join('')}
      </div>
      <div class="flags">
        ${p.topAttacco?'<span class="flag" style="color:#00cc66;background:rgba(0,204,102,.1)">⚡ Top Att.</span>':''}
        ${p.veto_forma?'<span class="flag" style="color:#ff4466;background:rgba(255,68,102,.1)">🚫 Veto Forma</span>':''}
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
  [['🟢 Alta ≥88%','alta','#00ff88'],['🟡 Media 75-87%','media','#ffcc00'],['🔴 Bassa <75%','bassa','#ff4466']].forEach(([l,k,c])=>{
    const s=cf[k];const g=s.V+s.P;const hr=g>0?(s.V/g*100).toFixed(1):null;
    h+=`<div class="sfrow" style="border:1px solid ${c}22">
      <span style="flex:1;font-size:12px;color:${c}">${l}</span>
      <span style="font-size:11px;color:#00cc66">V:${s.V}</span>
      <span style="font-size:11px;color:#ff4466;margin-left:8px">P:${s.P}</span>
      <span style="font-size:13px;font-weight:700;min-width:44px;text-align:right;color:${hr?(parseFloat(hr)>=75?'#00ff88':'#ff4466'):'#2a5a7f'}">${hr?hr+'%':'—'}</span>
    </div>`;
  });

  return h;
}

/* ── SETTINGS ───────────────────────────────────────────────────── */
function buildSettings(){
  const saved=LS.get('apiKey')||'';
  const masked=saved?saved.substring(0,4)+'..'+saved.slice(-4):'Non configurata';
  const odMasked=S.oddsApiKey?S.oddsApiKey.substring(0,6)+'..':'Non configurata';
  const notifStatus=typeof Notification!=='undefined'?
    (Notification.permission==='granted'?'<span style="color:#00ff88">Attive</span>':
     Notification.permission==='denied'?'<span style="color:#ff4466">Negate</span>':
     '<span style="color:#ffcc00">Non richieste</span>'):'N/D';
  const tot=Object.keys(S.esiti).filter(k=>['V','P'].includes(S.esiti[k])).length;
  const win=Object.values(S.esiti).filter(v=>v==='V').length;
  const regOrder=['europe','uk','americas','asia'];

  return`
  <div class="ssec">
    <div class="ssectit">🔑 API-Football</div>
    <div class="setrow">
      <div class="setlbl"><div>Chiave</div><div style="font-size:10px;color:#3a6a8f">Partite, statistiche, risultati live</div></div>
      <div class="setval">${masked}</div>
    </div>
    <div style="display:flex;gap:8px;margin-top:10px">
      <input type="text" id="nki" placeholder="API Key api-football.com..." style="flex:1;background:#0f1e2e;border:1px solid #1a3a5a;border-radius:10px;padding:10px 12px;color:#e0f0ff;font-size:12px;outline:none;-webkit-appearance:none;font-family:monospace">
      <button onclick="saveKeySettings()" style="background:rgba(255,204,0,.12);border:1px solid rgba(255,204,0,.4);border-radius:10px;padding:10px 14px;color:#ffcc00;font-size:12px;font-weight:700;cursor:pointer">Salva</button>
    </div>
    <div style="font-size:10px;color:#2a5a7f;margin-top:6px">
      dashboard.api-football.com · 100 req/giorno · Gratis
    </div>
  </div>

  <div class="ssec">
    <div class="ssectit">💹 The Odds API — Betfair Exchange</div>
    <div class="setrow">
      <div class="setlbl"><div>Chiave</div><div style="font-size:10px;color:#3a6a8f">Volumi reali da Betfair + Pinnacle</div></div>
      <div class="setval">${odMasked}</div>
    </div>
    <div style="display:flex;gap:8px;margin-top:10px">
      <input type="text" id="noki" placeholder="API Key the-odds-api.com..." style="flex:1;background:#0f1e2e;border:1px solid #1a3a5a;border-radius:10px;padding:10px 12px;color:#e0f0ff;font-size:12px;outline:none;-webkit-appearance:none;font-family:monospace">
      <button onclick="saveOddsKey()" style="background:rgba(0,255,136,.1);border:1px solid rgba(0,255,136,.3);border-radius:10px;padding:10px 14px;color:#00ff88;font-size:12px;font-weight:700;cursor:pointer">Salva</button>
    </div>
    <div style="font-size:10px;color:#2a5a7f;margin-top:6px;line-height:1.6">
      <b style="color:#00aaff">the-odds-api.com</b> · 500 req/mese · Gratis · No carta<br>
      Mostra flussi reali Over da Betfair Exchange, Pinnacle e Bet365
    </div>
  </div>

  <div class="ssec">
    <div class="ssectit">🔔 Goal Alert — Notifiche</div>
    <div class="setrow">
      <div class="setlbl"><div>Stato notifiche</div><div style="font-size:10px;color:#3a6a8f">Alert push quando GPI &ge; 60/100</div></div>
      <div class="setval">${notifStatus}</div>
    </div>
    <button onclick="requestNotifPerm().then(g=>{alert(g?'Notifiche attivate!':'Permesso negato');renderPage();})"
      style="margin-top:10px;width:100%;padding:12px;border-radius:10px;background:rgba(0,170,255,.1);border:1px solid rgba(0,170,255,.3);color:#00aaff;font-size:12px;font-weight:700;cursor:pointer">
      🔔 Attiva notifiche push
    </button>
    <div style="font-size:10px;color:#2a5a7f;margin-top:6px;line-height:1.5">
      Vibrazione + notifica quando una partita raggiunge alta pressione offensiva
    </div>
  </div>

  <div class="ssec">
    <div class="ssectit">⚽ Goal Pressure Index (GPI)</div>
    <div style="font-size:11px;color:#3a6a8f;margin-bottom:10px">
      Calcolato in tempo reale sulle partite in corso. Combina:
    </div>
    ${[
      ['⏱️','Minuto','Pressione cresce nel 2° tempo (80\'+= massima)'],
      ['🚩','Corner','Ogni corner = pericolo. Corner recenti = peso doppio'],
      ['🎯','Tiri in porta','Proxy Expected Goals — ogni tiro conta'],
      ['💹','Flusso Betfair','Quota Over in calo = soldi sharp in entrata'],
      ['🔥','Azioni recenti','Pericoli negli ultimi 5 minuti'],
    ].map(([ic,t,d])=>`<div style="display:flex;gap:10px;padding:7px 0;border-bottom:1px solid #080f18;align-items:flex-start">
      <span style="font-size:16px;flex-shrink:0">${ic}</span>
      <div><div style="font-size:11px;font-weight:700;color:#e0f0ff">${t}</div>
      <div style="font-size:10px;color:#2a5a7f;margin-top:1px">${d}</div></div>
    </div>`).join('')}
    <div style="margin-top:10px;padding:8px 10px;background:rgba(0,0,0,.3);border-radius:8px;font-size:10px;color:#3a6a8f;line-height:1.7">
      🟢 0-39 Bassa &nbsp;·&nbsp; 🟡 40-59 Attenzione &nbsp;·&nbsp; 🟠 60-79 Alta pressione &nbsp;·&nbsp; 🔴 80+ Alert Massimo
    </div>
  </div>

  <div class="ssec">
    <div class="ssectit">⏱️ Aggiornamento Automatico</div>
    <div class="setrow"><div class="setlbl">Stato</div><div class="setval" style="color:${S.autoOn?'#00ff88':'#556'}">${S.autoOn?'LIVE':'OFF'}</div></div>
    <div style="display:flex;gap:6px;margin-top:10px">
      ${[30,60,120,300].map(s=>`<button onclick="setAutoSec(${s})" style="flex:1;padding:9px 0;border-radius:8px;background:${S.autoSec===s?'rgba(0,170,255,.2)':'rgba(255,255,255,.03)'};border:1px solid ${S.autoSec===s?'#00aaff':'#1a3a5a'};color:${S.autoSec===s?'#00aaff':'#3a6a8f'};font-size:11px;cursor:pointer;font-weight:${S.autoSec===s?700:400}">${s<60?s+'s':s/60+'m'}</button>`).join('')}
    </div>
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
    <div class="setrow"><div class="setlbl">Vittorie</div><div class="setval" style="color:#00cc66">${win}</div></div>
    <div class="setrow"><div class="setlbl">Hit Rate</div><div class="setval" style="color:${tot>0&&win/tot>=0.75?'#00ff88':'#ff4466'}">${tot>0?(win/tot*100).toFixed(1)+'%':'—'}</div></div>
    <button onclick="clearEsiti()" style="margin-top:12px;width:100%;padding:12px;border-radius:10px;background:rgba(255,68,102,.1);border:1px solid rgba(255,68,102,.3);color:#ff4466;font-size:13px;font-weight:700;cursor:pointer">Cancella storico esiti</button>
  </div>`;
}

document.addEventListener('DOMContentLoaded',()=>{
  // Merge leagues
  const saved=LS.get('leagues');
  S.leagues=ALL_LEAGUES.map(l=>{const sv=saved?.find(x=>x.id===l.id);return sv?{...l,on:sv.on}:l;});

  if(S.apiKey){const ki=document.getElementById('keyinput');if(ki)ki.value=S.apiKey;}
  setDot(false);
  renderPage();
});
