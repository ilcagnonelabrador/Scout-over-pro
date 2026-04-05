/* ═══════════════════════════════════════════════════════════════════
   SCOUT OVER PRO v3 - Dashboard + Tutte le Leghe + Volume Scommesse
   ═══════════════════════════════════════════════════════════════════ */
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
const LS={get:k=>{try{return JSON.parse(localStorage.getItem(k));}catch{return null;}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
const S={page:'dashboard',status:'idle',matches:[],live:{},odds:{},esiti:LS.get('esiti')||{},error:'',apiKey:LS.get('apiKey')||'',mkt:'pt',conf:'all',region:LS.get('region')||'all',autoOn:false,autoSec:LS.get('autoSec')||60,countdown:0,dismissed:LS.get('dismissed')||false,leagues:null};
let _timer=null,_ctimer=null;
const REGIONS={all:{l:'🌐 Tutti',c:'#00ff88'},europe:{l:'🌍 Europa',c:'#00aaff'},uk:{l:'🏴󠁧󠁢󠁥󠁮󠁧󠁿 UK',c:'#ff4466'},americas:{l:'🌎 Americhe',c:'#ff8800'},asia:{l:'🌏 Asia',c:'#ffcc00'}};
const ALL_LEAGUES=[
  {id:135,n:'Serie A',f:'🇮🇹',r:'europe',s:2025,on:true},
  {id:136,n:'Serie B',f:'🇮🇹',r:'europe',s:2025,on:false},
  {id:140,n:'La Liga',f:'🇪🇸',r:'europe',s:2025,on:true},
  {id:141,n:'La Liga 2',f:'🇪🇸',r:'europe',s:2025,on:false},
  {id:78,n:'Bundesliga',f:'🇩🇪',r:'europe',s:2025,on:true},
  {id:79,n:'Bundesliga 2',f:'🇩🇪',r:'europe',s:2025,on:true},
  {id:61,n:'Ligue 1',f:'🇫🇷',r:'europe',s:2025,on:true},
  {id:62,n:'Ligue 2',f:'🇫🇷',r:'europe',s:2025,on:false},
  {id:88,n:'Eredivisie',f:'🇳🇱',r:'europe',s:2025,on:true},
  {id:94,n:'Liga Portugal',f:'🇵🇹',r:'europe',s:2025,on:true},
  {id:95,n:'Liga Portugal 2',f:'🇵🇹',r:'europe',s:2025,on:false},
  {id:144,n:'Jupiler Pro',f:'🇧🇪',r:'europe',s:2025,on:true},
  {id:203,n:'Super Lig',f:'🇹🇷',r:'europe',s:2025,on:true},
  {id:113,n:'Allsvenskan',f:'🇸🇪',r:'europe',s:2025,on:false},
  {id:119,n:'Superliga DK',f:'🇩🇰',r:'europe',s:2025,on:false},
  {id:103,n:'Eliteserien',f:'🇳🇴',r:'europe',s:2025,on:false},
  {id:106,n:'Ekstraklasa',f:'🇵🇱',r:'europe',s:2025,on:false},
  {id:218,n:'Bundesliga AT',f:'🇦🇹',r:'europe',s:2025,on:false},
  {id:197,n:'Super League CH',f:'🇨🇭',r:'europe',s:2025,on:false},
  {id:244,n:'Veikkausliiga',f:'🇫🇮',r:'europe',s:2025,on:false},
  {id:235,n:'Premier Liga RU',f:'🇷🇺',r:'europe',s:2025,on:false},
  {id:2,n:'Champions Lge',f:'🇪🇺',r:'europe',s:2025,on:true},
  {id:3,n:'Europa League',f:'🇪🇺',r:'europe',s:2025,on:true},
  {id:848,n:'Conference Lge',f:'🇪🇺',r:'europe',s:2025,on:true},
  {id:39,n:'Premier League',f:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',r:'uk',s:2025,on:true},
  {id:40,n:'Championship',f:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',r:'uk',s:2025,on:true},
  {id:41,n:'League One',f:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',r:'uk',s:2025,on:false},
  {id:42,n:'League Two',f:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',r:'uk',s:2025,on:false},
  {id:45,n:'FA Cup',f:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',r:'uk',s:2025,on:true},
  {id:179,n:'Scottish Prem.',f:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',r:'uk',s:2025,on:true},
  {id:71,n:'Brasileirao A',f:'🇧🇷',r:'americas',s:2025,on:true},
  {id:128,n:'Liga Argentina',f:'🇦🇷',r:'americas',s:2025,on:true},
  {id:130,n:'Liga MX',f:'🇲🇽',r:'americas',s:2025,on:true},
  {id:253,n:'MLS',f:'🇺🇸',r:'americas',s:2025,on:true},
  {id:265,n:'Libertadores',f:'🌎',r:'americas',s:2025,on:true},
  {id:98,n:'J-League',f:'🇯🇵',r:'asia',s:2025,on:true},
  {id:292,n:'K-League',f:'🇰🇷',r:'asia',s:2025,on:true},
  {id:307,n:'Saudi Pro Lge',f:'🇸🇦',r:'asia',s:2025,on:true},
];
const MKT_L=['Ov 0.5 PT','Ov 0.5 FIN','Ov 1.5 FIN'],MKT_K=['pt','f05','f15'],MKT_C=['#00aaff','#00cc66','#ffcc00'];

function ipc(p,mkt){
  if(p.veto_forma||p.veto_quota)return{ipc:0,hr:0,fok:false,veto:true,volLabel:null,volColor:'#2a5a7f'};
  let ovc,ovt,mgc,mgt,h2h,sc,st,smg,sh;
  if(mkt==='pt')[ovc,ovt,mgc,mgt,h2h,sc,st,smg,sh]=[p.ov05pt_c,p.ov05pt_t,p.mgpt_c,p.mgpt_t,p.h2h_pt,75,70,1.4,65];
  else if(mkt==='f05')[ovc,ovt,mgc,mgt,h2h,sc,st,smg,sh]=[p.ov05f_c,p.ov05f_t,p.mgf_c,p.mgf_t,p.h2h_f05,75,70,1.4,62];
  else[ovc,ovt,mgc,mgt,h2h,sc,st,smg,sh]=[p.ov15f_c,p.ov15f_t,p.mgf_c,p.mgf_t,p.h2h_f15,72,68,2.5,58];
  let v=0.20*mgc+0.20*mgt+0.25*(ovc/100)+0.25*(ovt/100)+0.05*(h2h/100);
  v+=[p.topAttacco,(mgc+mgt)>=1.2,p.derby,p.motivazioni].filter(Boolean).length*0.03;
  let volBonus=0,volLabel=null,volColor='#2a5a7f';
  const od=S.odds[p.id];
  if(od){const om=mkt==='f15'?od.ov15:mkt==='f05'?od.ov05:od.ov05ht;
    if(om?.avg){const ip=1/om.avg*100;
      if(ip>=70&&(om.bookCount||1)>=1){volBonus=0.04;volLabel='💰 Volume Alto';volColor='#00ff88';}
      else if(ip>=60){volBonus=0.02;volLabel='📈 Volume Med.';volColor='#ffcc00';}
      else if(ip<45){volBonus=-0.02;volLabel='⚠️ Bassa liquidità';volColor='#ff4466';}
      else{volLabel='🔘 Neutro';volColor='#3a6a8f';}
      if(om.open&&(om.open-om.avg)>0.08){volBonus+=0.02;volLabel='🎯 Sharp Money';volColor='#ffd700';}
      v+=volBonus;}}
  const fok=ovc>=sc&&ovt>=st&&(mgc+mgt)>=smg&&h2h>=sh;
  return{ipc:+(v.toFixed(3)),hr:+(Math.min(0.97,0.5+v*0.55+(fok?0.05:0)).toFixed(3)),fok,veto:false,volLabel,volColor};
}
function rtg(hr,veto){
  if(veto)return{l:'VETO',c:'#556677',bg:'rgba(80,100,120,.12)',br:'rgba(80,100,120,.3)'};
  if(hr>=0.88)return{l:'ALTA',c:'#00ff88',bg:'rgba(0,255,136,.07)',br:'rgba(0,255,136,.35)'};
  if(hr>=0.75)return{l:'MEDIA',c:'#ffcc00',bg:'rgba(255,204,0,.07)',br:'rgba(255,204,0,.3)'};
  return{l:'BASSA',c:'#ff4466',bg:'rgba(255,68,102,.05)',br:'rgba(255,68,102,.2)'};
}
async function apiFetch(ep){
  const r=await fetch(`https://v3.football.api-sports.io/${ep}`,{headers:{'x-rapidapi-key':S.apiKey,'x-rapidapi-host':'v3.football.api-sports.io'}});
  if(!r.ok)throw new Error(`HTTP ${r.status}`);const j=await r.json();
  if(j.errors&&Object.keys(j.errors).length)throw new Error(Object.values(j.errors).join(', '));return j;
}
function pOv(l){return Math.min(95,Math.max(30,Math.round((1-Math.exp(-l))*100)));}
function mkStats(hs,as_,h2h){
  const gH=parseFloat(hs?.goals?.for?.average?.total)||1.35,gA=parseFloat(as_?.goals?.for?.average?.total)||1.35;
  const mgf_c=+(gH.toFixed(2)),mgf_t=+(gA.toFixed(2)),mgpt_c=+((gH*.44).toFixed(2)),mgpt_t=+((gA*.44).toFixed(2));
  let h2h_pt=62,h2h_f05=72,h2h_f15=60;
  if(h2h?.length>0){const n=h2h.length;
    h2h_pt=Math.round(h2h.filter(m=>(m.score?.halftime?.home||0)+(m.score?.halftime?.away||0)>0).length/n*100);
    h2h_f05=Math.round(h2h.filter(m=>(m.goals?.home||0)+(m.goals?.away||0)>0).length/n*100);
    h2h_f15=Math.round(h2h.filter(m=>(m.goals?.home||0)+(m.goals?.away||0)>1).length/n*100);}
  return{mgf_c,mgf_t,mgpt_c,mgpt_t,ov05pt_c:pOv(mgpt_c),ov05pt_t:pOv(mgpt_t),ov05f_c:pOv(mgf_c),ov05f_t:pOv(mgf_t),ov15f_c:pOv(mgf_c*.72),ov15f_t:pOv(mgf_t*.72),h2h_pt,h2h_f05,h2h_f15};
}
async function fetchOdds(fid){
  try{const od=await apiFetch(`odds?fixture=${fid}&bookmaker=6`);
    const bets=od.response?.[0]?.bookmakers?.[0]?.bets||[];const res={};
    bets.forEach(b=>{
      if(b.name==='Goals Over/Under'){b.values?.forEach(v=>{if(v.value==='Over 0.5')res.ov05={avg:parseFloat(v.odd)};if(v.value==='Over 1.5')res.ov15={avg:parseFloat(v.odd)};});}
      if(b.name==='Goals Over/Under First Half'){b.values?.forEach(v=>{if(v.value==='Over 0.5')res.ov05ht={avg:parseFloat(v.odd)};});}});
    return res;}catch(_){return{};}
}
function addLog(msg){const b=q('#logbox');if(!b)return;b.style.display='block';if(b.children.length>=6)b.children[0].remove();const d=document.createElement('div');d.className='logline';d.textContent=msg;b.appendChild(d);[...b.querySelectorAll('.logline')].forEach((l,i,a)=>l.classList.toggle('active',i===a.length-1));}
async function fetchMatches(){
  if(!S.apiKey){alert('Inserisci la tua API Key!');return;}
  const btn=q('#refreshbtn');if(btn){btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Ricerca...';}
  S.status='loading';S.matches=[];S.error='';S.live={};S.odds={};
  const lb=q('#livebar');if(lb)lb.style.display='none';
  const logb=q('#logbox');if(logb)logb.innerHTML='';
  renderDashboard();
  try{
    const today=new Date().toISOString().split('T')[0];
    addLog('📡 Connessione API-Football...');
    const fd=await apiFetch(`fixtures?date=${today}&timezone=Europe/Rome`);
    const all=fd.response||[];addLog(`📋 ${all.length} partite totali oggi`);
    const activeIds=S.leagues.filter(l=>l.on).map(l=>l.id);
    const fil=all.filter(f=>activeIds.includes(f.league?.id));
    addLog(`🎯 ${fil.length} partite nei campionati attivi`);
    if(!fil.length)throw new Error(`Nessuna partita oggi nei campionati attivi (${all.length} in altre leghe).`);
    const raw=fil.map(f=>{const lg=S.leagues.find(l=>l.id===f.league?.id);
      return{id:f.fixture?.id,campionato:lg?.n||f.league?.name||'',country:lg?.f||'',region:lg?.r||'europe',
        orario:new Date(f.fixture?.date).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}),
        casa:f.teams?.home?.name,trasferta:f.teams?.away?.name,
        mgf_c:1.35,mgf_t:1.35,mgpt_c:0.59,mgpt_t:0.59,ov05pt_c:45,ov05pt_t:45,ov05f_c:73,ov05f_t:73,ov15f_c:62,ov15f_t:62,h2h_pt:60,h2h_f05:70,h2h_f15:58,
        topAttacco:false,derby:false,motivazioni:false,veto_forma:false,veto_quota:false,nota:'Caricamento...',_loading:true};});
    S.matches=raw.sort((a,b)=>a.orario.localeCompare(b.orario));S.status='done';renderDashboard();
    addLog('🧮 Caricamento statistiche...');
    for(let i=0;i<fil.length;i++){
      const f=fil[i];const lg=S.leagues.find(l=>l.id===f.league?.id);const season=lg?.s||2025;const hid=f.teams?.home?.id,aid=f.teams?.away?.id;
      addLog(`[${i+1}/${fil.length}] ${f.teams?.home?.name} – ${f.teams?.away?.name}`);
      let hs=null,as_=null,h2h=[];
      try{const[hr,ar,h2r]=await Promise.all([apiFetch(`teams/statistics?league=${f.league.id}&season=${season}&team=${hid}`),apiFetch(`teams/statistics?league=${f.league.id}&season=${season}&team=${aid}`),apiFetch(`fixtures/headtohead?h2h=${hid}-${aid}&last=10`)]);hs=hr.response;as_=ar.response;h2h=(h2r.response||[]).filter(m=>m.fixture?.status?.short==='FT').slice(0,8);}catch(_){}
      const odData=await fetchOdds(f.fixture?.id);S.odds[f.fixture?.id]=odData;
      const st=mkStats(hs,as_,h2h);const hF=hs?.form||'',aF=as_?.form||'';
      const veto=[...hF.slice(-4)].filter(c=>c==='L').length>=4||[...aF.slice(-4)].filter(c=>c==='L').length>=4;
      const idx=S.matches.findIndex(m=>m.id===f.fixture?.id);
      if(idx>=0)Object.assign(S.matches[idx],{...st,topAttacco:st.mgf_c>2.0||st.mgf_t>2.0,derby:false,motivazioni:false,veto_forma:veto,veto_quota:false,nota:`API-Football • ${h2h.length} H2H`,_loading:false});
      S.live[f.fixture?.id]={homeGoals:f.goals?.home??null,awayGoals:f.goals?.away??null,htHome:f.score?.halftime?.home??null,htAway:f.score?.halftime?.away??null,status:f.fixture?.status?.short,minute:f.fixture?.status?.elapsed??null,events:[]};
      if(i<fil.length-1)await new Promise(r=>setTimeout(r,150));}
    addLog(`✅ ${S.matches.length} partite pronte!`);startAuto();renderDashboard();
  }catch(e){S.error=e.message;S.status='error';addLog(`❌ ${e.message}`);renderDashboard();}
  if(btn){btn.disabled=false;btn.innerHTML='🔄 AGGIORNA ORA';}
}
async function liveUpdate(){
  if(!S.apiKey||!S.matches.length)return;
  const ids=S.matches.map(m=>m.id).slice(0,20).join('-');
  try{const fd=await apiFetch(`fixtures?ids=${ids}&timezone=Europe/Rome`);let ch=false;
    (fd.response||[]).forEach(f=>{const fid=f.fixture?.id,prev=S.live[fid]||{};
      const nd={homeGoals:f.goals?.home??null,awayGoals:f.goals?.away??null,htHome:f.score?.halftime?.home??null,htAway:f.score?.halftime?.away??null,status:f.fixture?.status?.short,minute:f.fixture?.status?.elapsed??null,events:(f.events||[]).map(e=>({time:e.time?.elapsed,type:e.type,detail:e.detail,player:e.player?.name,team:e.team?.name}))};
      autoEsiti(fid,nd);if(prev.homeGoals!==nd.homeGoals||prev.awayGoals!==nd.awayGoals||prev.status!==nd.status)ch=true;S.live[fid]=nd;});
    if(ch){updateLiveBar();S.matches.forEach(m=>{const d=S.live[m.id];if(!d)return;const el=document.getElementById(`sb-${m.id}`);if(el)el.outerHTML=scoreBadge(m.id,d);const lb=document.getElementById(`lrb-${m.id}`);if(lb)lb.outerHTML=liveBox(m.id,d,m);});}
    const sub=q('#lbsub');if(sub)sub.textContent=`Agg. ${new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}`;}catch(e){console.warn('live:',e.message);}
}
function autoEsiti(fid,d){if(!['FT','AET','PEN'].includes(d.status))return;const hG=(d.htHome??0)+(d.htAway??0),fG=(d.homeGoals??0)+(d.awayGoals??0);const map={pt:hG>0?'V':'P',f05:fG>0?'V':'P',f15:fG>1?'V':'P'};let upd=false;MKT_K.forEach(k=>{const key=`${fid}_${k}`;if(!S.esiti[key]){S.esiti[key]=map[k];upd=true;}});if(upd){LS.set('esiti',S.esiti);MKT_K.forEach(k=>['V','P','N'].forEach(v=>{const b=document.getElementById(`eb-${fid}-${k}-${v}`);if(b)b.className=`ebtn${S.esiti[`${fid}_${k}`]===v?' s'+v:''}`;}));}}
function scoreBadge(fid,d){
  if(!d||d.status==='NS'||!d.status)return`<span id="sb-${fid}" class="sbadge sns">—:—</span>`;
  const{homeGoals:hg,awayGoals:ag,htHome:hh,htAway:ha,status:st,minute:mn}=d;
  if(st==='HT')return`<span id="sb-${fid}" class="sbadge sht">⏸${hh??0}:${ha??0}</span>`;
  if(['FT','AET','PEN'].includes(st))return`<span id="sb-${fid}" class="sbadge sft">✓${hg??0}:${ag??0}</span>`;
  if(['1H','2H','ET','BT','P'].includes(st))return`<span id="sb-${fid}" class="sbadge slive"><span class="ldot"></span>${mn||'?'}' ${hg??0}:${ag??0}</span>`;
  return`<span id="sb-${fid}" class="sbadge sns">—:—</span>`;
}
function liveBox(fid,d,m){
  if(!d||d.status==='NS'||!d.status)return`<div id="lrb-${fid}"></div>`;
  const{homeGoals:hg,awayGoals:ag,htHome:hh,htAway:ha,status:st,minute:mn,events:ev}=d;
  const isL=['1H','2H','ET','BT','P'].includes(st),isH=st==='HT',isF=['FT','AET','PEN'].includes(st);
  const lbl=isL?`🔴 LIVE ${mn}'`:isH?'⏸ INTERVALLO':isF?'✅ FINALE':st;
  const col=isL?'#ff4466':isH?'#ffcc00':'#00ff88';const ht=hh!==null&&ha!==null?`PT:${hh}:${ha}`:'';
  const evH=(ev&&ev.length?ev.filter(e=>e.type==='Goal'||e.type==='Card').slice(-6).reverse().map(e=>`<div class="lrb-ev${e.type==='Goal'?' goal':''}">${e.type==='Goal'?'⚽':e.detail==='Red Card'?'🟥':'🟨'} ${e.time}' ${e.player||''} (${e.team||''})</div>`).join(''):'<div class="lrb-ev" style="color:#1a3a5a">Nessun evento</div>');
  return`<div id="lrb-${fid}" class="lrbox"><div class="lrb-t">${lbl}</div><div class="lrb-score" style="color:${col}">${hg??0}:${ag??0}</div><div class="lrb-meta"><span>${m?.casa||''}</span>${ht?`<span style="color:#2a5a7f">${ht}</span>`:''}<span>${m?.trasferta||''}</span></div><div class="lrb-evs">${evH}</div><div class="lrb-auto"><span class="adot"></span><span>Auto ogni ${S.autoSec}s</span></div></div>`;
}
function oddsBox(p,mkt){
  const od=S.odds[p.id];if(!od)return'';const om=mkt==='f15'?od.ov15:mkt==='f05'?od.ov05:od.ov05ht;
  if(!om?.avg)return'';const ip=Math.round(1/om.avg*100);const col=ip>=70?'#00ff88':ip>=55?'#ffcc00':'#ff4466';
  const sharp=om.open&&(om.open-om.avg)>0.08?'<span style="color:#ffd700;font-size:10px;margin-left:4px">🎯 Sharp</span>':'';
  return`<div class="odds-box"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;"><span style="font-size:10px;color:#2a5a7f;">💰 Volume ${mkt==='pt'?'PT':'FIN'}</span><span style="font-family:\'JetBrains Mono\',monospace;font-size:11px;font-weight:700;color:${col}">${ip}% consensus${sharp}</span></div><div style="display:flex;align-items:center;gap:8px;"><div style="flex:1;height:5px;background:#0a1825;border-radius:3px;overflow:hidden;"><div style="width:${Math.min(100,ip)}%;height:100%;background:${col};box-shadow:0 0 6px ${col};border-radius:3px;transition:width 1s ease;"></div></div><span style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:#2a5a7f;">q.${om.avg?.toFixed(2)||'—'}</span></div></div>`;
}
function startAuto(){stopAuto();S.autoOn=true;S.countdown=S.autoSec;const lb=q('#livebar');if(lb)lb.style.display='block';setDot(true);tick();}
function stopAuto(){S.autoOn=false;clearTimeout(_timer);clearInterval(_ctimer);_timer=null;_ctimer=null;setDot(false);}
function toggleAuto(){const pb=q('#pausebtn');if(S.autoOn){stopAuto();if(pb)pb.textContent='▶';const sub=q('#lbsub');if(sub)sub.textContent='In pausa';}else{startAuto();if(pb)pb.textContent='⏸';}}
function tick(){S.countdown=S.autoSec;updateCd();_ctimer=setInterval(()=>{S.countdown--;updateCd();if(S.countdown<=0)clearInterval(_ctimer);},1000);_timer=setTimeout(async()=>{if(!S.autoOn)return;const sub=q('#lbsub');if(sub)sub.textContent='Aggiornamento...';await liveUpdate();tick();},S.autoSec*1000);}
function updateCd(){const el=q('#lbcd');if(el)el.textContent=`${S.countdown}s`;}
function setDot(on){const d=q('#livedot'),l=q('#livelbl');if(d)d.className=`ldot-tb${on?'':' off'}`;if(l)l.textContent=on?'🔴 LIVE':new Date().toLocaleDateString('it-IT',{weekday:'short',day:'numeric',month:'short'});}
function updateLiveBar(){const el=q('#lbresults');if(!el)return;const live=S.matches.filter(m=>{const d=S.live[m.id];return d&&['1H','2H','ET','HT'].includes(d.status);});el.innerHTML=live.length?live.map(m=>{const d=S.live[m.id];const s=`${d.homeGoals??0}:${d.awayGoals??0}`;return`<span class="lb-sc${d.status==='HT'?'':' llive'}">${m.casa?.split(' ')[0]} ${s} ${m.trasferta?.split(' ')[0]}${d.status==='HT'?' HT':` ${d.minute||''}′`}</span>`;}).join(''):'<span style="font-size:10px;color:#1a3a5a">Nessuna in corso</span>';}
function setEsito(id,mkt,val){const k=`${id}_${mkt}`;S.esiti[k]===val?delete S.esiti[k]:(S.esiti[k]=val);LS.set('esiti',S.esiti);MKT_K.forEach(mk=>['V','P','N'].forEach(v=>{const b=document.getElementById(`eb-${id}-${mk}-${v}`);if(b)b.className=`ebtn${S.esiti[`${id}_${mk}`]===v?' s'+v:''}`;
}));if(S.page==='stats')renderStats();}
function toggleCard(id){const d=document.getElementById(`det-${id}`),c=document.getElementById(`chv-${id}`);if(!d)return;d.classList.toggle('open');if(c)c.textContent=d.classList.contains('open')?'▲':'▼';}
function setPage(p){S.page=p;document.querySelectorAll('.page').forEach(el=>el.classList.remove('active'));document.querySelectorAll('.navbtn').forEach(el=>el.classList.remove('active'));const pg=document.getElementById(`page-${p}`);if(pg)pg.classList.add('active');const nb=document.getElementById(`nav-${p}`);if(nb)nb.classList.add('active');q('#scroller').scrollTop=0;if(p==='dashboard')renderDashboard();else if(p==='partite')renderPartite();else if(p==='stats')renderStats();else renderSettings();}
function setMkt(k){S.mkt=k;renderPartite();}
function setConf(c){S.conf=S.conf===c?'all':c;renderPartite();}
function setRegion(r){S.region=r;LS.set('region',r);if(S.page==='partite')renderPartite();else renderDashboard();}
function dismiss(){S.dismissed=true;LS.set('dismissed',true);renderDashboard();}
function goToPartite(){setPage('partite');}
function q(sel){return document.querySelector(sel);}

// ════════════ DASHBOARD ══════════════════════════════════════════════
function renderDashboard(){
  const c=document.getElementById('dash-content');if(!c)return;
  let h='';
  if(!S.dismissed)h+=`<div class="inst-ban"><div class="inst-t">📲 Installa su iPhone</div><div class="inst-s">1. Apri in <b>Safari</b><br>2. Tocca <b>Condividi ⬆️</b><br>3. <b>"Aggiungi a schermata Home"</b></div><button class="inst-dismiss" onclick="dismiss()">✓ Ho capito</button></div>`;
  h+=`<div class="dash-hero"><div class="dash-title">⚽ SCOUT OVER PRO</div><div class="dash-sub">Ov 0.5 PT • Ov 0.5 FIN • Ov 1.5 FIN + Volume scommesse</div><div class="dash-date">${new Date().toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div></div>`;
  if(S.status==='idle')h+=`<div class="dash-idle"><div class="di-icon">⚽</div><div class="di-title">Pronto</div><div class="di-desc">Inserisci la <b style="color:#ffcc00">API Key gratuita</b> nel campo in alto<br>poi premi <b style="color:#00aaff">AGGIORNA ORA</b></div><div class="di-note" style="margin-top:8px;">api-football.com • 100 req/giorno • No carta di credito</div></div>`;
  else if(S.status==='error')h+=`<div class="errbox"><div style="font-size:24px;margin-bottom:8px">⚠️</div><div class="errt">Errore</div><div class="errm">${S.error}</div></div>`;
  if(S.matches.length>0){
    const done=S.matches.filter(m=>!m._loading).length,tot=S.matches.length;
    if(S.status==='loading'||done<tot){h+=`<div class="dash-loading"><div class="dload-bar-wrap"><div class="dload-bar" style="width:${Math.round(done/tot*100)}%"></div></div><div class="dload-lbl">${done} / ${tot} analizzate</div></div>`;}
    const alta=S.matches.filter(m=>{if(m._loading)return false;const r=ipc(m,S.mkt);return !r.veto&&r.hr>=0.88;}).length;
    h+=`<div class="dash-summary"><div class="ds-pill"><div class="ds-n" style="color:#00aaff">${tot}</div><div class="ds-l">Partite</div></div><div class="ds-pill"><div class="ds-n" style="color:#00ff88">${done}</div><div class="ds-l">Analizzate</div></div><div class="ds-pill"><div class="ds-n" style="color:#ffd700">${alta}</div><div class="ds-l">⭐ Alta</div></div></div>`;
    h+=`<div class="fscroll" style="margin-bottom:10px;">`;
    Object.entries(REGIONS).forEach(([k,v])=>{const cnt=k==='all'?S.matches.length:S.matches.filter(m=>m.region===k).length;if(cnt===0&&k!=='all')return;h+=`<button class="pill" onclick="setRegion('${k}')" style="${S.region===k?`border-color:${v.c};color:${v.c};background:${v.c}18`:''}">${v.l} (${cnt})</button>`;});
    h+='</div>';
    const showR=S.region==='all'?null:S.region;const byL={};
    S.matches.filter(m=>!showR||m.region===showR).forEach(m=>{if(!byL[m.campionato])byL[m.campionato]={f:m.country,list:[]};byL[m.campionato].list.push(m);});
    Object.entries(byL).forEach(([league,{f,list}])=>{
      h+=`<div class="dl-league"><span class="dl-flag">${f}</span><span class="dl-lname">${league}</span><span class="dl-count">${list.length}</span></div>`;
      list.forEach(m=>{const d=S.live[m.id]||{};const isL=m._loading;const best=isL?{hr:0,veto:false}:MKT_K.map(k=>ipc(m,k)).reduce((a,b)=>a.hr>b.hr?a:b);const rt=isL?{c:'#1a3a5a',l:'⏳'}:rtg(best.hr,best.veto);
        h+=`<div class="dl-match"><span class="dl-time">${m.orario}</span><div class="dl-teams"><span>${m.casa}</span><span style="color:#1a3a5a;font-size:9px;margin:0 3px">vs</span><span>${m.trasferta}</span></div>${scoreBadge(m.id,d)}<span class="dl-conf" style="color:${rt.c}">${rt.l}</span></div>`;});
    });
    if(done>0)h+=`<button class="goto-btn" onclick="goToPartite()">📊 Analisi Complete (${done} partite) →</button>`;
  }
  c.innerHTML=h;
}

// ════════════ PARTITE ════════════════════════════════════════════════
function renderPartite(){
  const el=document.getElementById('analisi-content');if(!el)return;
  if(S.status!=='done'&&S.status!=='loading'){el.innerHTML=`<div style="text-align:center;padding:40px 14px"><div style="font-size:40px;margin-bottom:12px">⚽</div><div style="color:#2a5a7f;font-size:13px">Torna alla Home e premi<br><b style="color:#00aaff">AGGIORNA ORA</b></div><button style="margin-top:16px;padding:10px 20px;border-radius:10px;background:rgba(0,170,255,.15);border:1px solid #00aaff;color:#00aaff;font-size:12px;cursor:pointer;font-family:\'Outfit\',sans-serif;" onclick="setPage(\'dashboard\')">← Home</button></div>`;return;}
  const showR=S.region==='all'?null:S.region;
  const sorted=[...S.matches].filter(m=>!m._loading&&(!showR||m.region===showR)).sort((a,b)=>ipc(b,S.mkt).hr-ipc(a,S.mkt).hr);
  const filt=sorted.filter(p=>{const r=ipc(p,S.mkt);if(S.conf==='alta')return !r.veto&&r.hr>=0.88;if(S.conf==='media')return !r.veto&&r.hr>=0.75&&r.hr<0.88;if(S.conf==='bassa')return !r.veto&&r.hr<0.75;if(S.conf==='veto')return r.veto;return true;});
  const sum={alta:sorted.filter(p=>{const r=ipc(p,S.mkt);return !r.veto&&r.hr>=0.88;}).length,media:sorted.filter(p=>{const r=ipc(p,S.mkt);return !r.veto&&r.hr>=0.75&&r.hr<0.88;}).length};
  let h='';
  h+='<div class="fscroll">';Object.entries(REGIONS).forEach(([k,v])=>{const cnt=k==='all'?sorted.length:sorted.filter(m=>m.region===k).length;if(cnt===0&&k!=='all')return;h+=`<button class="pill" onclick="setRegion('${k}')" style="${S.region===k?`border-color:${v.c};color:${v.c};background:${v.c}18`:''}">${v.l} (${cnt})</button>`;});h+='</div>';
  h+='<div class="fscroll">';MKT_K.forEach((k,i)=>{h+=`<button class="pill${S.mkt===k?' p'+['b','g','y'][i]:''}" onclick="setMkt('${k}')">${MKT_L[i]}</button>`;});h+='</div>';
  h+='<div class="sumgrid">';[['all','Tutte','#00aaff',sorted.length],['alta','Alta','#00ff88',sum.alta],['media','Media','#ffcc00',sum.media]].forEach(([k,l,c,n])=>{const a=S.conf===k;h+=`<div class="sumpill" onclick="setConf('${k}')" style="border-color:${a?c:'#0e2035'};background:${a?c+'18':'rgba(255,255,255,.03)'}"><div class="sumnum" style="color:${c}">${n}</div><div class="sumlbl">${l}</div></div>`;});h+='</div>';
  filt.forEach((p,idx)=>{
    const mkts=MKT_K.map(k=>ipc(p,k));const best=mkts.reduce((a,b)=>a.hr>b.hr?a:b);const rt=rtg(best.hr,best.veto);const d=S.live[p.id]||{};
    const vb=best.volLabel?`<span style="font-size:9px;padding:2px 6px;border-radius:10px;background:rgba(0,0,0,.3);border:1px solid ${best.volColor}33;color:${best.volColor};margin-left:4px;">${best.volLabel}</span>`:'';
    h+=`<div class="card" style="background:${rt.bg};border:1px solid ${rt.br};animation-delay:${idx*.03}s"><div class="cardhead" onclick="toggleCard(${p.id})">
      <div class="cardmeta"><span class="ltag">${p.country} ${p.campionato}</span><span class="ttag">${p.orario}</span>${scoreBadge(p.id,d)}</div>
      <div class="teams"><span class="tn">${p.casa}</span><span class="vs">VS</span><span class="tn r">${p.trasferta}</span></div>
      <div style="display:flex;align-items:center;gap:5px;margin-bottom:7px;"><span style="font-size:11px;font-weight:800;color:${rt.c}">${rt.l} ${best.veto?'':((best.hr*100).toFixed(0)+'%')}</span>${vb}</div>
      <div class="mkts">`;
    MKT_K.forEach((k,i)=>{const r=ipc(p,k);const col=r.veto?'#334':r.hr>=0.88?MKT_C[i]:r.hr>=0.75?'#ffcc00':'#ff4466';const pct=r.veto?0:r.hr*100;h+=`<div class="mki"><div class="mrow"><span class="ml">${MKT_L[i]}</span><span class="mv" style="color:${col}">${r.veto?'✗':pct.toFixed(0)+'%'}</span></div><div class="hbar"><div class="hbarf" style="width:${pct}%;background:${col};box-shadow:0 0 4px ${col}"></div></div>${r.volLabel?`<div style="font-size:8px;color:${r.volColor};margin-top:1px">${r.volLabel}</div>`:''}</div>`;});
    h+=`</div></div><div class="detail" id="det-${p.id}">${liveBox(p.id,d,p)}${oddsBox(p,S.mkt)}
      <div class="sg">${[['PT Casa',`${p.ov05pt_c}%`,p.ov05pt_c>=75],['PT Trasf.',`${p.ov05pt_t}%`,p.ov05pt_t>=70],['Gol PT',+(p.mgpt_c+p.mgpt_t).toFixed(2),(p.mgpt_c+p.mgpt_t)>=1.4],['H2H PT',`${p.h2h_pt}%`,p.h2h_pt>=65],['Gol FIN',+(p.mgf_c+p.mgf_t).toFixed(2),(p.mgf_c+p.mgf_t)>=2.5],['H2H 1.5F',`${p.h2h_f15}%`,p.h2h_f15>=58]].map(([l,v,ok])=>`<div class="sb"><div class="sl">${l}</div><div class="sv" style="color:${ok?'#00cc66':'#ff6688'}">${v}</div></div>`).join('')}</div>
      <div class="flagsrow">${p.topAttacco?'<span class="flag" style="color:#00cc66;background:rgba(0,204,102,.1);border:1px solid rgba(0,204,102,.25)">⚡ Top Att.</span>':''}${p.veto_forma?'<span class="flag" style="color:#ff4466;background:rgba(255,68,102,.1);border:1px solid rgba(255,68,102,.25)">🚫 Veto</span>':''}</div>
      <div class="notebox">${p.nota}</div>
      <div class="esito-box"><div class="etitle">📝 Esito (auto a fine partita)</div><div class="eg">${MKT_K.map((k,i)=>`<div><div class="emktl">${MKT_L[i]}</div><div class="ebtns">${['V','P','N'].map(v=>`<button id="eb-${p.id}-${k}-${v}" class="ebtn${S.esiti[`${p.id}_${k}`]===v?' s'+v:''}" onclick="setEsito(${p.id},'${k}','${v}')">${v}</button>`).join('')}</div></div>`).join('')}</div></div>
    </div><div class="chevron" id="chv-${p.id}" onclick="toggleCard(${p.id})">▼</div></div>`;
  });
  if(!filt.length)h+=`<div style="text-align:center;padding:30px;color:#1a4060">Nessuna partita in questa categoria</div>`;
  h+=`<button class="expbtn" onclick="exportCSV()">⬇️ ESPORTA CSV</button><div class="exphint">Include odds, statistiche e volume scommesse</div>`;
  el.innerHTML=h;
}

// ════════════ STATS ═══════════════════════════════════════════════════
function renderStats(){
  const st={pt:{V:0,P:0,N:0},f05:{V:0,P:0,N:0},f15:{V:0,P:0,N:0}};const cf={alta:{V:0,P:0},media:{V:0,P:0},bassa:{V:0,P:0}};
  Object.entries(S.esiti).forEach(([key,val])=>{const[id,mkt]=key.split('_');if(!st[mkt])return;st[mkt][val]=(st[mkt][val]||0)+1;const m=S.matches.find(p=>String(p.id)===id);if(m&&(val==='V'||val==='P')){const r=ipc(m,mkt);if(!r.veto){const b=r.hr>=0.88?'alta':r.hr>=0.75?'media':'bassa';cf[b][val]++;}}});
  const tV=MKT_K.reduce((s,k)=>s+(st[k].V||0),0),tP=MKT_K.reduce((s,k)=>s+(st[k].P||0),0),tG=tV+tP;const auto=S.matches.filter(m=>['FT','AET','PEN'].includes(S.live[m.id]?.status)).length;
  let h=`<div class="statsec"><div class="stitle">📊 Globale</div><div class="globg"><div class="gb"><div class="gn" style="color:#00aaff">${tG}</div><div class="gl">Giocate</div></div><div class="gb"><div class="gn" style="color:#00cc66">${tV}</div><div class="gl">Vinte ✓</div></div><div class="gb"><div class="gn" style="color:#ff4466">${tP}</div><div class="gl">Perse ✗</div></div></div><div class="hrbig" style="color:${tG>0?(tV/tG>=0.75?'#00ff88':'#ff4466'):'#2a5a7f'}">${tG>0?(tV/tG*100).toFixed(1)+'%':'—'} <span style="font-size:11px;color:#2a5a7f">Hit Rate</span></div>${auto>0?`<div style="text-align:center;margin-top:8px;font-size:10px;color:#2a5a7f">🤖 ${auto} esiti auto-impostati</div>`:''}</div>
  <div style="font-size:11px;color:#2a5a7f;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Per Mercato</div><div class="mktsg">`;
  MKT_K.forEach((k,i)=>{const s=st[k];const g=(s.V||0)+(s.P||0);const hr=g>0?((s.V||0)/g*100).toFixed(1):null;h+=`<div class="msb"><div class="msn" style="color:${MKT_C[i]}">${MKT_L[i]}</div><div class="msr"><span style="color:#00cc66">V:${s.V||0}</span><span style="color:#ff4466">P:${s.P||0}</span><span style="color:#556677">N:${s.N||0}</span></div><div class="msh" style="color:${hr?(parseFloat(hr)>=75?'#00ff88':'#ff4466'):'#2a5a7f'}">${hr?hr+'%':'—'}</div>${g>0?`<div class="hbar" style="margin-top:6px"><div class="hbarf" style="width:${(s.V||0)/g*100}%;background:${MKT_C[i]};box-shadow:0 0 5px ${MKT_C[i]}"></div></div>`:''}</div>`;});
  h+=`</div><div style="font-size:11px;color:#2a5a7f;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Per Fascia</div>`;
  [['🟢 Alta ≥88%','alta','#00ff88'],['🟡 Media 75-87%','media','#ffcc00'],['🔴 Bassa <75%','bassa','#ff4466']].forEach(([l,k,c])=>{const s=cf[k];const g=s.V+s.P;const hr=g>0?(s.V/g*100).toFixed(1):null;h+=`<div class="fascia" style="border:1px solid ${c}22"><span class="fl" style="color:${c}">${l}</span><span class="fv">V:${s.V}</span><span class="fp">P:${s.P}</span><span class="fh" style="color:${hr?(parseFloat(hr)>=75?'#00ff88':'#ff4466'):'#2a5a7f'}">${hr?hr+'%':'—'}</span></div>`;});
  document.getElementById('stats-content').innerHTML=h;
}

// ════════════ SETTINGS ═══════════════════════════════════════════════
function renderSettings(){
  const saved=LS.get('apiKey')||'';const masked=saved?saved.substring(0,4)+'••••••'+saved.slice(-4):'Non configurata';
  const tot=Object.keys(S.esiti).filter(k=>S.esiti[k]==='V'||S.esiti[k]==='P').length;const win=Object.values(S.esiti).filter(v=>v==='V').length;
  const regOrder=['europe','uk','americas','asia'];
  const lh=regOrder.map(reg=>{const rl=S.leagues.filter(l=>l.r===reg);return`<div style="margin-bottom:14px;"><div style="font-size:10px;color:${REGIONS[reg]?.c||'#00aaff'};font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">${REGIONS[reg]?.l||reg}</div>${rl.map(l=>{const i=S.leagues.indexOf(l);return`<div class="lgtog"><span class="ltn">${l.f} ${l.n}</span><button class="toggle ${l.on?'on':'off'}" onclick="toggleLeague(${i})"></button></div>`;}).join('')}</div>`;}).join('');
  document.getElementById('settings-content').innerHTML=`
  <div class="setsec"><div class="settit">🔑 API Key</div>
    <div class="setrow"><div class="setlbl"><div>Chiave</div><div class="setsub">api-football.com</div></div><div class="setval">${masked}</div></div>
    <div style="margin-top:10px;display:flex;gap:8px;"><input type="text" id="nki" placeholder="Incolla API Key..." style="flex:1;background:#0f1e2e;border:1px solid #1a3a5a;border-radius:10px;padding:9px 12px;color:#e0f0ff;font-family:'JetBrains Mono',monospace;font-size:11px;outline:none;-webkit-appearance:none;">
    <button onclick="saveFromSettings()" style="background:rgba(255,204,0,.12);border:1px solid rgba(255,204,0,.4);border-radius:10px;padding:9px 14px;color:#ffcc00;font-size:11px;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif;">Salva</button></div>
    <div style="font-size:10px;color:#2a5a7f;margin-top:8px;line-height:1.5;">➜ <b style="color:#00aaff">dashboard.api-football.com</b> • Free forever • 100 req/giorno</div>
  </div>
  <div class="setsec"><div class="settit">⏱️ Auto Update Live</div>
    <div class="setrow"><div class="setlbl">Stato</div><div class="setval" style="color:${S.autoOn?'#00ff88':'#556677'}">${S.autoOn?'🔴 LIVE':'⚫ OFF'}</div></div>
    <div class="interval-row">${[30,60,120,300].map(s=>`<button class="intbtn${S.autoSec===s?' active':''}" onclick="setAutoSec(${s})">${s<60?s+'s':s/60+'min'}</button>`).join('')}</div>
    <div style="font-size:10px;color:#2a5a7f;margin-top:10px;line-height:1.5;">ℹ️ 1 req/ciclo per tutti i match. Esiti V/P auto a fine partita.</div>
  </div>
  <div class="setsec"><div class="settit">🌍 Campionati</div>${lh}</div>
  <div class="setsec"><div class="settit">📊 Storico</div>
    <div class="setrow"><div class="setlbl">Esiti inseriti</div><div class="setval">${tot}</div></div>
    <div class="setrow"><div class="setlbl">Vittorie</div><div class="setval" style="color:#00cc66">${win}</div></div>
    <div class="setrow"><div class="setlbl">Hit Rate</div><div class="setval" style="color:${tot>0&&win/tot>=0.75?'#00ff88':'#ff4466'}">${tot>0?(win/tot*100).toFixed(1)+'%':'—'}</div></div>
    <button onclick="clearEsiti()" style="margin-top:12px;width:100%;padding:11px;border-radius:10px;background:rgba(255,68,102,.1);border:1px solid rgba(255,68,102,.3);color:#ff4466;font-size:12px;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif;">🗑️ Cancella storico</button>
  </div>`;
}
function setAutoSec(s){S.autoSec=s;LS.set('autoSec',s);if(S.autoOn){stopAuto();startAuto();}renderSettings();}
function toggleLeague(i){S.leagues[i].on=!S.leagues[i].on;LS.set('leagues',S.leagues);renderSettings();}
function clearEsiti(){if(!confirm('Cancellare tutti gli esiti?'))return;S.esiti={};LS.set('esiti',{});renderSettings();}
function saveFromSettings(){const k=document.getElementById('nki')?.value?.trim();if(!k){alert('Inserisci API Key');return;}S.apiKey=k;LS.set('apiKey',k);document.getElementById('keyinput').value=k;alert('✅ Salvata!');renderSettings();}
function saveKey(){const k=document.getElementById('keyinput').value.trim();if(!k)return;S.apiKey=k;LS.set('apiKey',k);const b=q('.savebtn');b.textContent='✅';b.style.color='#00cc66';b.style.borderColor='#00cc66';setTimeout(()=>{b.textContent='💾';b.style.color='';b.style.borderColor='';},2000);}
function exportCSV(){const rows=[['Data','Camp.','Ora','Casa','Trasferta','Risultato','IPC_PT','HR_PT%','IPC_05F','HR_05F%','IPC_15F','HR_15F%','Vol_PT','Vol_05F','Vol_15F','Esito_PT','Esito_05F','Esito_15F','Stato']];const td=new Date().toLocaleDateString('it-IT');S.matches.filter(m=>!m._loading).forEach(p=>{const r=MKT_K.map(k=>ipc(p,k));const d=S.live[p.id]||{};const score=d.homeGoals!=null?`${d.homeGoals}:${d.awayGoals}`:'—';const od=S.odds[p.id]||{};rows.push([td,p.campionato,p.orario,p.casa,p.trasferta,score,r[0].ipc,(r[0].hr*100).toFixed(1),r[1].ipc,(r[1].hr*100).toFixed(1),r[2].ipc,(r[2].hr*100).toFixed(1),od.ov05ht?.avg?`q:${od.ov05ht.avg.toFixed(2)}`:'',od.ov05?.avg?`q:${od.ov05.avg.toFixed(2)}`:'',od.ov15?.avg?`q:${od.ov15.avg.toFixed(2)}`:'',S.esiti[`${p.id}_pt`]||'',S.esiti[`${p.id}_f05`]||'',S.esiti[`${p.id}_f15`]||'',d.status||'NS']);});const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));a.download=`Scout_${td.replace(/\//g,'-')}.csv`;a.click();}

// ════════════ CSS ══════════════════════════════════════════════════════
function injectCSS(){const s=document.createElement('style');s.textContent=`:root{--bg:#060d16;--bg2:#0a1825;--bg3:#0f1e2e;--blue:#00aaff;--green:#00ff88;--yel:#ffcc00;--red:#ff4466;--gold:#ffd700;--white:#e0f0ff;--gray:#3a6a8f;--border:#0e2035;--st:env(safe-area-inset-top);--sb:env(safe-area-inset-bottom);}*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}html,body{height:100%;overflow:hidden;background:var(--bg);}body{font-family:'Outfit',sans-serif;color:var(--white);display:flex;flex-direction:column;}#shell{display:flex;flex-direction:column;height:100%;padding-top:var(--st);}#topbar{background:linear-gradient(180deg,var(--bg2) 0%,var(--bg) 100%);border-bottom:1px solid var(--border);padding:12px 14px 10px;flex-shrink:0;}#scroller{flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;}#botnav{background:var(--bg2);border-top:1px solid var(--border);padding:10px 0 calc(10px + var(--sb));display:flex;flex-shrink:0;}.tb-row1{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}.tb-logo{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:900;background:linear-gradient(120deg,var(--blue),var(--green));-webkit-background-clip:text;-webkit-text-fill-color:transparent;}.tb-live{display:flex;align-items:center;gap:6px;}.ldot-tb{width:7px;height:7px;border-radius:50%;background:var(--red);animation:pulse 1.4s ease-in-out infinite;}.ldot-tb.off{background:#334;animation:none;}.tb-keyrow{display:flex;gap:8px;margin-bottom:10px;}#keyinput{flex:1;background:var(--bg3);border:1px solid #1a3a5a;border-radius:10px;padding:9px 12px;color:var(--white);font-family:'JetBrains Mono',monospace;font-size:11px;outline:none;-webkit-appearance:none;}#keyinput:focus{border-color:var(--yel);}#keyinput::placeholder{color:#1a3a5a;}.savebtn{background:rgba(255,204,0,.12);border:1px solid rgba(255,204,0,.4);border-radius:10px;padding:9px 12px;color:var(--yel);font-size:11px;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif;}#refreshbtn{width:100%;padding:13px 0;border-radius:12px;background:linear-gradient(135deg,#0044aa,#0088ff);border:1px solid #0066cc;color:#fff;font-size:14px;font-weight:800;cursor:pointer;letter-spacing:.5px;text-transform:uppercase;box-shadow:0 4px 20px rgba(0,136,255,.25);display:flex;align-items:center;justify-content:center;gap:8px;font-family:'Outfit',sans-serif;transition:all .2s;}#refreshbtn:disabled{background:linear-gradient(135deg,#0a2040,#0a3060);border-color:#1a4a7f;box-shadow:none;}#refreshbtn:active:not(:disabled){transform:scale(.98);}.spinner{width:14px;height:14px;border:2px solid #1a4a7f;border-top-color:var(--blue);border-radius:50%;animation:spin .8s linear infinite;display:inline-block;}#livebar{display:none;margin-top:8px;background:rgba(255,68,102,.07);border:1px solid rgba(255,68,102,.2);border-radius:10px;padding:8px 12px;}.lb-row{display:flex;align-items:center;justify-content:space-between;}.lb-left{display:flex;align-items:center;gap:8px;}.lb-t{font-size:11px;color:var(--red);font-weight:700;}.lb-sub{font-size:10px;color:var(--gray);}#lbcd{font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--yel);font-weight:700;}#pausebtn{background:rgba(255,204,0,.1);border:1px solid rgba(255,204,0,.3);border-radius:8px;padding:4px 10px;color:var(--yel);font-size:11px;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif;}#lbresults{margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;}.lb-sc{font-size:10px;padding:2px 8px;border-radius:6px;background:rgba(0,0,0,.3);border:1px solid var(--border);color:var(--white);font-family:'JetBrains Mono',monospace;}.lb-sc.llive{border-color:var(--red);color:var(--red);}#logbox{margin-top:6px;padding:8px 10px;background:rgba(0,0,0,.4);border-radius:8px;border:1px solid var(--border);display:none;}.logline{font-size:10px;color:#1a4a7f;margin-bottom:1px;font-family:'JetBrains Mono',monospace;}.logline.active{color:var(--blue);}.navbtn{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:4px 0;background:none;border:none;color:var(--gray);font-family:'Outfit',sans-serif;}.navbtn.active{color:var(--blue);}.navicon{font-size:20px;}.navlbl{font-size:10px;font-weight:600;}.page{padding:14px 14px 20px;display:none;}.page.active{display:block;}.inst-ban{background:linear-gradient(135deg,rgba(0,170,255,.1),rgba(0,255,136,.07));border:1px solid rgba(0,170,255,.3);border-radius:14px;padding:14px;margin-bottom:14px;}.inst-t{font-size:13px;font-weight:700;color:var(--blue);margin-bottom:6px;}.inst-s{font-size:11px;color:var(--gray);line-height:1.8;}.inst-dismiss{margin-top:10px;width:100%;padding:8px;border-radius:8px;background:rgba(0,170,255,.1);border:1px solid rgba(0,170,255,.3);color:var(--blue);font-size:11px;cursor:pointer;font-family:'Outfit',sans-serif;}.dash-hero{text-align:center;padding:16px 0 12px;margin-bottom:14px;border-bottom:1px solid var(--border);}.dash-title{font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:900;background:linear-gradient(120deg,var(--blue),var(--green));-webkit-background-clip:text;-webkit-text-fill-color:transparent;}.dash-sub{font-size:10px;color:var(--gray);margin-top:4px;}.dash-date{font-size:10px;color:#1a4a7f;margin-top:3px;}.dash-idle{text-align:center;padding:20px 0;}.di-icon{font-size:44px;margin-bottom:10px;}.di-title{font-size:16px;font-weight:700;color:var(--blue);margin-bottom:6px;}.di-desc{font-size:12px;color:#2a5a7f;line-height:1.7;margin-bottom:8px;}.di-note{font-size:10px;color:#1a4060;line-height:1.6;}.dash-loading{padding:12px 0 8px;}.dload-bar-wrap{height:4px;background:#0a1825;border-radius:2px;overflow:hidden;margin-bottom:6px;}.dload-bar{height:100%;background:linear-gradient(90deg,var(--blue),var(--green));border-radius:2px;transition:width .5s ease;box-shadow:0 0 8px rgba(0,170,255,.4);}.dload-lbl{font-size:11px;color:var(--gray);text-align:center;}.dash-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;}.ds-pill{background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:10px;padding:10px 6px;text-align:center;}.ds-n{font-size:22px;font-weight:900;font-family:'JetBrains Mono',monospace;}.ds-l{font-size:10px;color:#2a5a7f;}.dl-league{display:flex;align-items:center;gap:6px;padding:8px 0 4px;border-top:1px solid #080f18;margin-top:4px;}.dl-flag{font-size:14px;}.dl-lname{flex:1;font-size:11px;font-weight:700;color:var(--blue);}.dl-count{font-size:10px;color:#2a5a7f;background:#0a1825;padding:2px 7px;border-radius:10px;}.dl-match{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #060d16;}.dl-time{font-size:10px;color:#2a5a7f;font-family:'JetBrains Mono',monospace;min-width:34px;}.dl-teams{flex:1;font-size:12px;color:var(--white);overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}.dl-conf{font-size:10px;font-weight:700;min-width:40px;text-align:right;}.goto-btn{width:100%;padding:14px 0;margin-top:16px;border-radius:14px;background:linear-gradient(135deg,rgba(0,255,136,.1),rgba(0,170,255,.08));border:1px solid rgba(0,255,136,.3);color:var(--green);font-size:14px;font-weight:700;cursor:pointer;letter-spacing:.5px;font-family:'Outfit',sans-serif;box-shadow:0 4px 20px rgba(0,255,136,.1);}.goto-btn:active{transform:scale(.98);}.fscroll{overflow-x:auto;display:flex;gap:6px;padding-bottom:4px;margin-bottom:10px;}.fscroll::-webkit-scrollbar{display:none;}.pill{white-space:nowrap;font-size:11px;padding:6px 12px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:20px;color:var(--gray);cursor:pointer;font-family:'Outfit',sans-serif;}.pb{background:rgba(0,170,255,.15)!important;border-color:var(--blue)!important;color:var(--blue)!important;}.pg{background:rgba(0,255,136,.15)!important;border-color:var(--green)!important;color:var(--green)!important;}.py{background:rgba(255,204,0,.15)!important;border-color:var(--yel)!important;color:var(--yel)!important;}.sumgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:14px;}.sumpill{border-radius:10px;padding:8px 4px;text-align:center;cursor:pointer;border:1px solid var(--border);background:rgba(255,255,255,.03);}.sumnum{font-size:18px;font-weight:900;font-family:'JetBrains Mono',monospace;}.sumlbl{font-size:9px;color:var(--gray);text-transform:uppercase;}.card{border-radius:14px;margin-bottom:10px;overflow:hidden;animation:fadeUp .35s ease both;}.cardhead{padding:12px 14px;cursor:pointer;}.cardmeta{display:flex;align-items:center;gap:8px;margin-bottom:7px;}.ltag{font-size:9px;color:#2a5a7f;background:#0a1825;padding:2px 8px;border-radius:20px;white-space:nowrap;max-width:130px;overflow:hidden;text-overflow:ellipsis;}.ttag{font-size:10px;color:#2a5a7f;white-space:nowrap;}.sbadge{margin-left:auto;display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;font-size:10px;font-weight:800;font-family:'JetBrains Mono',monospace;white-space:nowrap;}.slive{background:rgba(255,68,102,.15);border:1px solid rgba(255,68,102,.4);color:var(--red);}.sft{background:rgba(0,255,136,.1);border:1px solid rgba(0,255,136,.3);color:var(--green);}.sht{background:rgba(255,204,0,.1);border:1px solid rgba(255,204,0,.3);color:var(--yel);}.sns{background:rgba(0,170,255,.07);border:1px solid rgba(0,170,255,.2);color:#2a5a7f;}.ldot{width:6px;height:6px;border-radius:50%;background:var(--red);animation:pulse 1.2s ease-in-out infinite;flex-shrink:0;}.teams{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}.tn{font-size:13px;font-weight:700;color:var(--white);flex:1;}.tn.r{text-align:right;}.vs{font-size:9px;color:#1a3a5a;padding:0 6px;font-family:monospace;}.mkts{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;}.mki .mrow{display:flex;justify-content:space-between;}.ml{font-size:9px;color:#2a5a7f;}.mv{font-size:9px;font-weight:700;font-family:'JetBrains Mono',monospace;}.hbar{height:4px;background:#0a1825;border-radius:2px;overflow:hidden;margin-top:2px;}.hbarf{height:100%;border-radius:2px;transition:width .9s ease;}.chevron{text-align:center;font-size:9px;color:#1a3050;padding-bottom:4px;cursor:pointer;}.detail{padding:0 14px 14px;border-top:1px solid var(--border);display:none;}.detail.open{display:block;}.lrbox{background:rgba(255,68,102,.07);border:1px solid rgba(255,68,102,.25);border-radius:12px;padding:12px 14px;margin:12px 0 10px;}.lrb-t{font-size:10px;color:var(--red);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;}.lrb-score{font-size:32px;font-weight:900;font-family:'JetBrains Mono',monospace;text-align:center;margin-bottom:4px;}.lrb-meta{display:flex;justify-content:space-between;font-size:10px;color:var(--gray);}.lrb-evs{margin-top:8px;max-height:90px;overflow-y:auto;}.lrb-ev{font-size:10px;color:var(--gray);padding:2px 0;border-bottom:1px solid #080f18;}.lrb-ev:last-child{border-bottom:none;}.lrb-ev.goal{color:var(--green);font-weight:700;}.lrb-auto{display:flex;align-items:center;gap:6px;margin-top:6px;font-size:10px;color:#2a5a7f;}.adot{width:6px;height:6px;border-radius:50%;background:var(--blue);animation:pulse 2s ease-in-out infinite;flex-shrink:0;}.odds-box{background:rgba(0,0,0,.25);border:1px solid rgba(255,204,0,.15);border-radius:10px;padding:10px 12px;margin-bottom:10px;}.sg{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin:10px 0;}.sb{background:rgba(0,0,0,.3);border-radius:8px;padding:7px 10px;}.sl{font-size:9px;color:#2a5a7f;margin-bottom:2px;}.sv{font-size:13px;font-weight:800;font-family:'JetBrains Mono',monospace;}.flagsrow{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px;}.flag{font-size:10px;padding:2px 8px;border-radius:20px;}.notebox{font-size:11px;color:var(--gray);font-style:italic;border-left:2px solid #1a3a5a;padding-left:8px;margin-bottom:10px;}.esito-box{background:rgba(0,0,0,.2);border-radius:10px;padding:10px 12px;margin-top:6px;}.etitle{font-size:10px;color:#2a5a7f;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;}.eg{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;}.emktl{font-size:9px;color:#3a6a8f;margin-bottom:3px;text-align:center;}.ebtns{display:flex;gap:2px;}.ebtn{flex:1;padding:5px 0;border-radius:5px;font-size:10px;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif;border:1px solid #1a3a5a;background:transparent;color:#3a6a8f;}.ebtn.sV{border-color:var(--green);background:rgba(0,204,102,.2);color:var(--green);}.ebtn.sP{border-color:var(--red);background:rgba(255,68,102,.2);color:var(--red);}.ebtn.sN{border-color:#556677;background:rgba(80,100,120,.2);color:#556677;}.statsec{background:rgba(0,255,136,.05);border:1px solid rgba(0,255,136,.2);border-radius:14px;padding:16px;margin-bottom:14px;}.stitle{font-size:11px;color:var(--green);font-weight:700;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;}.globg{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px;}.gb{background:rgba(0,0,0,.3);border-radius:10px;padding:10px 8px;text-align:center;}.gn{font-size:22px;font-weight:900;font-family:'JetBrains Mono',monospace;}.gl{font-size:10px;color:#2a5a7f;}.hrbig{font-size:24px;font-weight:900;font-family:'JetBrains Mono',monospace;text-align:center;margin-top:8px;}.mktsg{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;}.msb{background:rgba(0,0,0,.25);border:1px solid var(--border);border-radius:12px;padding:10px 12px;}.msn{font-size:11px;font-weight:700;margin-bottom:5px;}.msr{display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;}.msh{font-size:18px;font-weight:900;font-family:'JetBrains Mono',monospace;}.fascia{display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(0,0,0,.2);border-radius:10px;margin-bottom:6px;}.fl{flex:1;font-size:12px;}.fv{font-size:11px;color:var(--green);}.fp{font-size:11px;color:var(--red);}.fh{font-size:13px;font-weight:900;font-family:'JetBrains Mono',monospace;min-width:46px;text-align:right;}.setsec{background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:14px;}.settit{font-size:11px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;}.setrow{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #080f18;}.setrow:last-child{border-bottom:none;}.setlbl{flex:1;font-size:13px;color:var(--white);}.setsub{font-size:10px;color:var(--gray);margin-top:2px;}.setval{font-size:12px;color:var(--blue);font-family:'JetBrains Mono',monospace;}.lgtog{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #080f18;}.lgtog:last-child{border-bottom:none;}.ltn{flex:1;font-size:12px;color:var(--white);}.toggle{width:36px;height:20px;border-radius:10px;position:relative;cursor:pointer;transition:background .2s;border:none;}.toggle.on{background:var(--green);box-shadow:0 0 8px rgba(0,255,136,.4);}.toggle.off{background:#1e3a5f;}.toggle::after{content:'';position:absolute;top:3px;left:3px;width:14px;height:14px;border-radius:50%;background:white;transition:left .2s;}.toggle.on::after{left:19px;}.interval-row{display:flex;align-items:center;gap:6px;margin-top:10px;}.intbtn{flex:1;padding:8px 0;border-radius:8px;background:rgba(255,255,255,.03);border:1px solid var(--border);color:var(--gray);font-size:11px;cursor:pointer;font-family:'Outfit',sans-serif;}.intbtn.active{background:rgba(0,170,255,.15);border-color:var(--blue);color:var(--blue);font-weight:700;}.errbox{background:rgba(255,68,102,.08);border:1px solid rgba(255,68,102,.3);border-radius:14px;padding:20px;margin-bottom:16px;text-align:center;}.errt{color:var(--red);font-weight:700;margin-bottom:6px;}.errm{color:#7a9bbf;font-size:12px;line-height:1.5;}.expbtn{width:100%;padding:12px 0;margin-top:10px;border-radius:12px;background:linear-gradient(135deg,#003a1a,#005a28);border:1px solid var(--green);color:var(--green);font-size:13px;font-weight:700;cursor:pointer;letter-spacing:.5px;font-family:'Outfit',sans-serif;}.exphint{font-size:10px;color:#1a3a5a;text-align:center;margin-top:5px;}@keyframes spin{to{transform:rotate(360deg);}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.3;}}::-webkit-scrollbar{width:0;height:0;}`;document.head.appendChild(s);}

// ════════════ INIT ════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded',()=>{
  injectCSS();
  const saved=LS.get('leagues');
  S.leagues=ALL_LEAGUES.map(l=>{const sv=saved?.find(x=>x.id===l.id);return sv?{...l,on:sv.on}:l;});
  document.getElementById('root').innerHTML=`<div id="shell"><div id="topbar"><div class="tb-row1"><span class="tb-logo">⚽ SCOUT OVER PRO</span><div class="tb-live"><span class="ldot-tb off" id="livedot"></span><span style="font-size:10px;color:#3a6a8f;" id="livelbl"></span></div></div><div class="tb-keyrow"><input type="text" id="keyinput" placeholder="API Key (api-football.com)..." autocomplete="off" autocorrect="off" spellcheck="false"><button class="savebtn" onclick="saveKey()">💾</button></div><button id="refreshbtn" onclick="fetchMatches()">🔄 AGGIORNA ORA</button><div id="livebar"><div class="lb-row"><div class="lb-left"><span class="ldot"></span><div><div class="lb-t">LIVE</div><div class="lb-sub" id="lbsub">In attesa...</div></div></div><div style="display:flex;align-items:center;gap:8px;"><span id="lbcd"></span><button id="pausebtn" onclick="toggleAuto()">⏸</button></div></div><div id="lbresults"></div></div><div id="logbox"></div></div><div id="scroller"><div class="page active" id="page-dashboard"><div style="padding:14px 14px 20px;" id="dash-content"></div></div><div class="page" id="page-partite"><div style="padding:14px 14px 20px;" id="analisi-content"></div></div><div class="page" id="page-stats"><div style="padding:14px 14px 20px;" id="stats-content"></div></div><div class="page" id="page-settings"><div style="padding:14px 14px 20px;" id="settings-content"></div></div></div><div id="botnav"><button class="navbtn active" id="nav-dashboard" onclick="setPage('dashboard')"><span class="navicon">🏠</span><span class="navlbl">Home</span></button><button class="navbtn" id="nav-partite" onclick="setPage('partite')"><span class="navicon">📊</span><span class="navlbl">Analisi</span></button><button class="navbtn" id="nav-stats" onclick="setPage('stats')"><span class="navicon">📈</span><span class="navlbl">Stats</span></button><button class="navbtn" id="nav-settings" onclick="setPage('settings')"><span class="navicon">⚙️</span><span class="navlbl">Config</span></button></div></div>`;
  document.getElementById('livelbl').textContent=new Date().toLocaleDateString('it-IT',{weekday:'short',day:'numeric',month:'short'});
  if(S.apiKey)document.getElementById('keyinput').value=S.apiKey;
  renderDashboard();
});
