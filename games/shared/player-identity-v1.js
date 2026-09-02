(()=>{'use strict';
const PROFILE_KEY='igch.player.profile.v1';
const EVENTS_KEY='igch.player.events.v1';
const SESSION_KEY='igch.player.session.v1';
const ENDPOINT_KEY='igch.telemetry.endpoint';
const HEARTBEAT_MS=15000;
const MAX_LOCAL_EVENTS=250;
const GAME_NAMES={
  'camel-rush':'Camel Rush',
  'horse-rush':'Horse Rush',
  'Greyhound-Rush':'Greyhound Rush',
  'greyhound-rush':'Greyhound Rush',
  'goal-rush':'Goal Rush',
  'penalty':'Casino Penalty',
  'sonic-rush':'Sonic Rocket Rush'
};
function randomHex(n=6){
  try{const a=new Uint8Array(Math.ceil(n/2));crypto.getRandomValues(a);return [...a].map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,n).toUpperCase()}
  catch(e){return Math.random().toString(16).slice(2,2+n).toUpperCase().padEnd(n,'0')}
}
function safeParse(s,fallback){try{return JSON.parse(s)}catch(e){return fallback}}
function now(){return new Date().toISOString()}
function gameSlug(){const p=location.pathname.split('/').filter(Boolean);const i=p.indexOf('games');return i>=0&&p[i+1]?p[i+1]:'hub'}
function gameName(){const s=gameSlug();return GAME_NAMES[s]||s.replace(/[-_]/g,' ').replace(/\b\w/g,m=>m.toUpperCase())}
function loadProfile(){
  let p=safeParse(localStorage.getItem(PROFILE_KEY),null);
  if(!p||!/^P-[A-F0-9]{6,}$/i.test(String(p.id||''))){
    const code=randomHex(8);
    p={id:'P-'+code,nickname:'Guest-'+code.slice(0,4),type:'REAL',createdAt:now(),version:1};
    localStorage.setItem(PROFILE_KEY,JSON.stringify(p));
  }
  p.type='REAL';p.version=1;
  localStorage.setItem(PROFILE_KEY,JSON.stringify(p));
  return p;
}
function loadSession(){
  let s=safeParse(sessionStorage.getItem(SESSION_KEY),null);
  if(!s||!s.id){s={id:'S-'+randomHex(8),startedAt:now()};sessionStorage.setItem(SESSION_KEY,JSON.stringify(s))}
  return s;
}
let profile=loadProfile();
const session=loadSession();
function endpoint(){return (window.IGCH_TELEMETRY&&window.IGCH_TELEMETRY.endpoint)||localStorage.getItem(ENDPOINT_KEY)||''}
function localEvents(){const value=safeParse(localStorage.getItem(EVENTS_KEY),[]);return Array.isArray(value)?value:[]}
function storeEvent(e){const a=localEvents();a.push(e);if(a.length>MAX_LOCAL_EVENTS)a.splice(0,a.length-MAX_LOCAL_EVENTS);localStorage.setItem(EVENTS_KEY,JSON.stringify(a))}
function sendRemote(e){
  const url=endpoint();if(!url)return;
  const headers={'Content-Type':'application/json'};
  const apiKey=window.IGCH_TELEMETRY&&window.IGCH_TELEMETRY.apiKey;
  if(apiKey)headers['X-IGCH-Key']=apiKey;
  try{fetch(url,{method:'POST',headers,body:JSON.stringify(e),keepalive:true,mode:'cors'}).catch(()=>{})}catch(err){}
}
function track(event,payload={},source='REAL'){
  const e={event,eventId:'E-'+randomHex(10),ts:now(),playerId:profile.id,nickname:profile.nickname,sessionId:session.id,source,game:gameSlug(),gameName:gameName(),path:location.pathname,payload:payload||{}};
  storeEvent(e);sendRemote(e);
  window.dispatchEvent(new CustomEvent('igch:telemetry',{detail:e}));
  return e;
}
function setNickname(name){
  name=String(name||'').trim().replace(/\s+/g,' ').slice(0,24);
  if(!name)return false;
  const old=profile.nickname;profile={...profile,nickname:name,updatedAt:now()};localStorage.setItem(PROFILE_KEY,JSON.stringify(profile));
  track('profile_rename',{from:old,to:name});render();return true;
}
function setTelemetryEndpoint(url){
  url=String(url||'').trim();
  if(url)localStorage.setItem(ENDPOINT_KEY,url);else localStorage.removeItem(ENDPOINT_KEY);
  return endpoint();
}
function profileCss(){return `
[data-igch-player-pill]{display:inline-flex;align-items:center;gap:7px;min-height:36px;padding:0 10px;border:1px solid var(--line,rgba(255,255,255,.16));border-radius:10px;background:rgba(255,255,255,.045);color:var(--text,var(--txt,#fff));font:800 9px/1 Inter,system-ui,sans-serif;letter-spacing:.035em;white-space:nowrap;cursor:pointer;backdrop-filter:blur(10px);box-shadow:0 8px 24px rgba(0,0,0,.16)}
[data-igch-player-dot]{width:7px;height:7px;border-radius:50%;background:#42e58f;box-shadow:0 0 10px rgba(66,229,143,.75)}
[data-igch-player-pill] strong{font-size:9px;max-width:92px;overflow:hidden;text-overflow:ellipsis}
[data-igch-player-pill] small{opacity:.62;font-size:8px}
[data-igch-profile-modal]{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.58);backdrop-filter:blur(8px)}
[data-igch-profile-modal].open{display:flex}
[data-igch-profile-card]{width:min(390px,100%);border:1px solid rgba(255,255,255,.14);border-radius:20px;background:#0c1221;color:#f5f8ff;padding:18px;box-shadow:0 28px 90px rgba(0,0,0,.5);font-family:Inter,system-ui,sans-serif}
[data-igch-profile-card] h3{margin:0 0 3px;font-size:19px}[data-igch-profile-card] p{margin:0;color:#8f9bb3;font-size:11px}
.igch-prof-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0}.igch-prof-box{padding:10px;border:1px solid rgba(255,255,255,.09);border-radius:12px;background:rgba(255,255,255,.035)}.igch-prof-box span,.igch-prof-box strong{display:block}.igch-prof-box span{font-size:8px;color:#7f8ba3;text-transform:uppercase;letter-spacing:.1em}.igch-prof-box strong{margin-top:4px;font-size:11px;word-break:break-word}
.igch-prof-name{display:grid;grid-template-columns:1fr auto;gap:7px}.igch-prof-name input{min-width:0;height:40px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:#080d18;color:#fff;padding:0 11px;outline:0}.igch-prof-name button,.igch-prof-close{height:40px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:rgba(255,255,255,.06);color:#fff;padding:0 13px;font-weight:800}.igch-prof-close{width:100%;margin-top:9px}.igch-prof-note{margin-top:10px!important;font-size:9px!important;line-height:1.5!important}
@media(max-width:520px){[data-igch-player-pill] small{display:none}[data-igch-player-pill]{padding:0 8px}.igch-prof-grid{grid-template-columns:1fr 1fr}}
`}
function findHost(){
  const hub=document.querySelector('[data-games-hub-link]');if(hub&&hub.parentElement)return{host:hub.parentElement,before:hub};
  for(const s of ['.top-actions','.header-actions','.topbar-actions','.nav-actions','.badges']){const h=document.querySelector(s);if(h)return{host:h,before:null}}
  return null;
}
function ensureStyle(){if(document.querySelector('style[data-igch-profile-style]'))return;const s=document.createElement('style');s.dataset.igchProfileStyle='';s.textContent=profileCss();document.head.appendChild(s)}
function ensureModal(){
  let m=document.querySelector('[data-igch-profile-modal]');if(m)return m;
  m=document.createElement('div');m.dataset.igchProfileModal='';m.innerHTML=`<div data-igch-profile-card role="dialog" aria-modal="true" aria-label="Player profile"><h3>Player Profile</h3><p>Anonymous test identity shared across all Crash Hub games on this browser.</p><div class="igch-prof-grid"><div class="igch-prof-box"><span>Player ID</span><strong data-igch-pid></strong></div><div class="igch-prof-box"><span>Type</span><strong>REAL</strong></div><div class="igch-prof-box"><span>Session</span><strong data-igch-sid></strong></div><div class="igch-prof-box"><span>Current game</span><strong data-igch-game></strong></div></div><div class="igch-prof-name"><input data-igch-name maxlength="24" aria-label="Nickname"><button data-igch-save type="button">SAVE</button></div><p class="igch-prof-note">The Player ID stays the same when you move between Camel, Horse, Greyhound, Sonic, Goal and Penalty in the same browser. Simulation users should use the SIM source and never this REAL ID.</p><button class="igch-prof-close" data-igch-close type="button">CLOSE</button></div>`;
  document.body.appendChild(m);
  m.addEventListener('click',e=>{if(e.target===m||e.target.closest('[data-igch-close]'))m.classList.remove('open')});
  m.querySelector('[data-igch-save]').addEventListener('click',()=>{if(setNickname(m.querySelector('[data-igch-name]').value))m.classList.remove('open')});
  m.querySelector('[data-igch-name]').addEventListener('keydown',e=>{if(e.key==='Enter')m.querySelector('[data-igch-save]').click()});
  return m;
}
function ensurePill(){
  let b=document.querySelector('[data-igch-player-pill]');if(b)return b;
  b=document.createElement('button');b.type='button';b.dataset.igchPlayerPill='';b.innerHTML='<span data-igch-player-dot></span><strong data-igch-player-name></strong><small data-igch-player-id></small>';
  b.addEventListener('click',()=>{const m=ensureModal();fillModal(m);m.classList.add('open');track('profile_open')});
  return b;
}
function fillModal(m){m.querySelector('[data-igch-pid]').textContent=profile.id;m.querySelector('[data-igch-sid]').textContent=session.id;m.querySelector('[data-igch-game]').textContent=gameName();m.querySelector('[data-igch-name]').value=profile.nickname}
function render(){
  ensureStyle();const b=ensurePill();b.querySelector('[data-igch-player-name]').textContent=profile.nickname;b.querySelector('[data-igch-player-id]').textContent=profile.id;
  const f=findHost();if(f){if(b.parentElement!==f.host){if(f.before)f.host.insertBefore(b,f.before);else f.host.appendChild(b)}b.style.position='';b.style.right='';b.style.top='';b.style.zIndex=''}
  else if(b.parentElement!==document.body){document.body.appendChild(b);Object.assign(b.style,{position:'fixed',right:'12px',top:'58px',zIndex:'9999'})}
  const m=document.querySelector('[data-igch-profile-modal]');if(m)fillModal(m)
}
function readStake(){const e=document.querySelector('[data-stake],#stake,input[name="stake"]');const n=Number(e&&e.value);return Number.isFinite(n)?n:null}
document.addEventListener('click',e=>{
  const t=e.target.closest?.('button,a');if(!t)return;
  if(t.matches('[data-place-bet],[data-manual-start],[data-bet],[data-start-bet]'))track('bet_intent',{stake:readStake()});
  else if(t.matches('[data-cashout],[data-cash-out]'))track('cashout_intent');
  else if(t.matches('[data-auto-start]'))track('auto_start',{stake:readStake()});
  else if(t.matches('[data-auto-stop]'))track('auto_stop');
},true);
function heartbeat(){track('presence',{status:document.hidden?'AWAY':'ONLINE',visibility:document.visibilityState})}
window.addEventListener('storage',e=>{if(e.key===PROFILE_KEY){profile=loadProfile();render()}});
document.addEventListener('visibilitychange',heartbeat);
window.addEventListener('pagehide',()=>track('game_leave',{status:'OFFLINE'}));
window.IGCHPlayer={getProfile:()=>({...profile}),getSession:()=>({...session}),getGame:()=>({slug:gameSlug(),name:gameName()}),setNickname,track,trackSim:(event,payload)=>track(event,payload,'SIM'),setTelemetryEndpoint,getTelemetryEndpoint:endpoint,getLocalEvents:()=>localEvents().slice()};
let tries=0;const boot=setInterval(()=>{tries++;render();if(tries>40)clearInterval(boot)},250);
render();track('game_enter',{referrer:document.referrer||null});heartbeat();setInterval(heartbeat,HEARTBEAT_MS);
})();
