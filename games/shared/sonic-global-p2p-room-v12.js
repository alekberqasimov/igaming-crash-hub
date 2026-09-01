const IGCH_SONIC_ROOM_V12 = (() => {
  'use strict';
  const VERSION='1.2.0';
  const APP_ID='az.alekberqasimov.igaming-crash-hub.sonic-pilot.v1';
  const ROOM_ID='SONIC-GLOBAL';
  const TRYSTERO_URL='https://esm.run/@trystero-p2p/mqtt@0.25.4';
  const peers=new Map();
  let room=null,presence=null,roundAction=null,simAction=null,selfId='';
  let nextRound=null,currentRound=null,authoritativeSim=null;
  let connectionState='DISCOVERING',started=false,lastPresence='';
  const now=()=>Date.now();
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const profile=()=>{try{return window.IGCHPlayer?.getProfile?.()||{id:'REAL-LOCAL',nickname:'YOU'}}catch{return{id:'REAL-LOCAL',nickname:'YOU'}}};
  const session=()=>{try{return window.IGCHPlayer?.getSession?.()||{id:'LOCAL'}}catch{return{id:'LOCAL'}}};
  const engine=()=>window.IGCHSonicEngineV12||null;
  function livePeers(){const t=now();return [...peers.entries()].filter(([,x])=>t-x.lastSeen<22000)}
  function leaderId(){const ids=[selfId,...livePeers().map(([id])=>id)].filter(Boolean).sort();return ids[0]||selfId}
  function isLeader(){return Boolean(selfId)&&leaderId()===selfId}
  function realCount(){return 1+livePeers().length}
  function snapshot(){const p=profile(),s=session(),e=engine();const state=e?.getState?.()||document.body?.dataset?.state||'ONLINE';const bet=e?.getUserBet?.()||null;let status='ONLINE',result='';if(bet){if(bet.settled&&bet.payout>0){status='CASHED_OUT';result=bet.cashout?Number(bet.cashout).toFixed(2)+'x':'WON'}else if(bet.settled){status='LOST';result='LOST'}else status=state==='RUNNING'?'PLAYING':'BETTING'}else if(state==='RUNNING')status='WATCHING';return{v:12,playerId:p.id,nickname:p.nickname||'YOU',sessionId:s.id,source:'REAL',game:'sonic-rush',status,stake:bet?.stake||null,result,state,ts:now()}}
  function sendPresence(force=false,target=null){if(!presence)return;const d=snapshot(),sig=JSON.stringify(d);if(!force&&sig===lastPresence)return;lastPresence=sig;try{presence.send(d,target?{target}:undefined).catch?.(()=>{})}catch{}}
  function makeRound(){const e=engine();if(!e?.generateBust)return null;const bust=Number(e.generateBust());if(!Number.isFinite(bust))return null;const r={v:12,roomId:ROOM_ID,seq:(currentRound?.seq||0)+1,bust,createdAt:now(),leaderId:selfId};nextRound=r;try{roundAction?.send(r).catch?.(()=>{})}catch{};updateRoomBadge();return r}
  function ensureNextRound(){if(realCount()<2)return null;if(isLeader()&&!nextRound)makeRound();return nextRound}
  function hasAuthoritativeBust(){if(realCount()<2)return true;if(isLeader())return Boolean(ensureNextRound());return Boolean(nextRound)}
  function shouldWaitForRound(){return connectionState==='CONNECTED'&&realCount()>=2&&!hasAuthoritativeBust()}
  function takeAuthoritativeBust(){if(realCount()<2)return null;ensureNextRound();if(!nextRound)return null;currentRound=nextRound;nextRound=null;const value=Number(currentRound.bust);setTimeout(()=>{if(isLeader())makeRound()},250);updateRoomBadge();return Number.isFinite(value)?value:null}
  function publishSimRoom(){if(!isLeader()||realCount()<2)return;const list=engine()?.getSimBets?.();if(!Array.isArray(list))return;authoritativeSim=list.map(b=>({name:b.name,stake:Number(b.stake),target:Number(b.target)}));try{simAction?.send({v:12,seq:currentRound?.seq||nextRound?.seq||0,list:authoritativeSim,ts:now()}).catch?.(()=>{})}catch{}}
  function getAuthoritativeSimBets(){return realCount()>=2&&Array.isArray(authoritativeSim)&&authoritativeSim.length?authoritativeSim:null}
  function updateRoomBadge(){let b=document.querySelector('[data-sonic-room-badge]');if(!b){b=document.createElement('div');b.dataset.sonicRoomBadge='';b.style.cssText='display:inline-flex;align-items:center;gap:6px;min-height:26px;padding:0 8px;border:1px solid rgba(25,215,255,.22);border-radius:9px;background:rgba(25,215,255,.055);color:var(--cyan,#19d7ff);font:900 7px/1 Inter,system-ui,sans-serif;letter-spacing:.06em;white-space:nowrap';const host=document.querySelector('.top-actions')||document.querySelector('.top')||document.body;host.appendChild(b)}const role=realCount()>=2?(isLeader()?'LEADER':'SYNC'):'SOLO';b.textContent=`ROOM · ${ROOM_ID} · ${realCount()} REAL · ${role}`;b.title=`Room ${ROOM_ID} | v${VERSION} | ${connectionState}`}
  function renderPeers(){const feed=document.querySelector('[data-feed]');if(!feed)return;feed.querySelectorAll('[data-p2p-v12]').forEach(n=>n.remove());const remote=livePeers().map(([,x])=>x.data).filter(x=>x?.source==='REAL');for(const d of remote){const row=document.createElement('div');row.className='feed-row igch-p2p-real-player';row.dataset.p2pV12='1';row.dataset.source='REAL';const n=document.createElement('b');n.textContent=d.nickname||'REAL';const em=document.createElement('em');em.textContent=' REAL · P2P';em.style.cssText='font-size:6px;color:var(--green,#42e58f);font-style:normal;margin-left:4px';n.appendChild(em);const st=document.createElement('span');st.textContent=d.stake?`${Number(d.stake).toFixed(0)} AZN`:'—';const rs=document.createElement('strong');rs.textContent=d.result||d.status||'ONLINE';if(d.status==='LOST')rs.classList.add('loss');if(d.status==='CASHED_OUT')rs.classList.add('win');row.append(n,st,rs);feed.insertBefore(row,feed.firstChild)}updateRoomBadge()}
  function onPresence(data,{peerId}={}){if(!peerId||!data)return;peers.set(peerId,{data,lastSeen:now()});connectionState='CONNECTED';renderPeers();if(isLeader()){ensureNextRound();publishSimRoom()}}
  function onRound(data,{peerId}={}){if(!data||!peerId)return;if(peerId!==leaderId()&&leaderId()!==selfId)return;if(!isLeader()){nextRound={...data};updateRoomBadge()}}
  function onSim(data,{peerId}={}){if(!data||!peerId||isLeader())return;if(peerId!==leaderId())return;if(Array.isArray(data.list)){authoritativeSim=data.list;engine()?.refreshFeed?.();updateRoomBadge()}}
  async function start(){if(started)return;started=true;for(let i=0;i<50&&!window.IGCHPlayer;i++)await sleep(100);try{const mod=await import(TRYSTERO_URL);selfId=mod.selfId||Math.random().toString(36).slice(2);room=mod.joinRoom({appId:APP_ID},ROOM_ID);presence=room.makeAction('presence-v12');roundAction=room.makeAction('round-v12');simAction=room.makeAction('sim-v12');presence.onMessage=onPresence;roundAction.onMessage=onRound;simAction.onMessage=onSim;room.onPeerJoin=id=>{connectionState='CONNECTED';sendPresence(true,id);setTimeout(()=>{if(isLeader()){ensureNextRound();publishSimRoom()}},300);renderPeers()};room.onPeerLeave=id=>{peers.delete(id);if(!isLeader())nextRound=null;setTimeout(()=>{if(isLeader()){ensureNextRound();publishSimRoom()}},100);renderPeers()};connectionState='CONNECTED';sendPresence(true);setInterval(()=>{sendPresence(true);const t=now();for(const[id,x]of peers)if(t-x.lastSeen>22000)peers.delete(id);if(isLeader()){ensureNextRound();publishSimRoom()}renderPeers()},5000);window.addEventListener('igch:sonic:new-round',()=>{setTimeout(()=>{if(isLeader())publishSimRoom()},30)});window.addEventListener('igch:sonic:state',()=>sendPresence(false));updateRoomBadge()}catch(err){connectionState='OFFLINE';console.warn('[SONIC ROOM v1.2]',err);updateRoomBadge()}}
  const api={version:VERSION,roomId:ROOM_ID,start,isLeader,leaderId,getRealCount:realCount,shouldWaitForRound,hasAuthoritativeBust,takeAuthoritativeBust,getAuthoritativeSimBets,publishSimRoom,getState:()=>connectionState};
  window.IGCHSonicRoom=api;start();return api;
})();
export default IGCH_SONIC_ROOM_V12;
