(()=>{'use strict';
const VERSION='1.3.5',APP_ID='az.alekberqasimov.igaming-crash-hub.sonic-pilot.v1',ROOM_ID='SONIC-GLOBAL',URL='https://esm.run/@trystero-p2p/mqtt@0.25.4';
const KEY='sonicrush_config_v2',STAMP='roomConfigUpdatedAt',SOURCE='roomConfigSource';
let room=null,action=null,selfId='',started=false,state='DISCOVERING';
const now=()=>Date.now(),read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}},write=c=>{try{localStorage.setItem(KEY,JSON.stringify(c));return true}catch{return false}};
function valid(c){if(!c||typeof c!=='object')return null;const m=Number(c.targetProfitMargin),r=Number(c.targetRtp);if(!Number.isFinite(m)||m<.01||m>.95)return null;if(!Number.isFinite(r)||r<.05||r>.99)return null;const out=JSON.parse(JSON.stringify(c));out.targetProfitMargin=m;out.targetRtp=1-m;out.configVersion=Math.max(2,Math.floor(Number(out.configVersion)||2));out[STAMP]=Math.max(0,Number(out[STAMP])||0);return out}
function rank(c){c=valid(c);if(!c)return[0,0];return[Number(c[STAMP])||0,Number(c.configVersion)||0]}
function newer(a,b){const A=rank(a),B=rank(b);return A[0]>B[0]||(A[0]===B[0]&&A[1]>B[1])}
function packet(){const c=valid(read());return c?{v:135,roomId:ROOM_ID,config:c,ts:now()}:null}
function send(target=null){if(!action)return false;const p=packet();if(!p)return false;try{action.send(p,target?{target}:undefined).catch?.(()=>{});return true}catch{return false}}
function applyIncoming(p){const incoming=valid(p?.config);if(!incoming)return false;const local=valid(read());if(local&&!newer(incoming,local))return false;incoming[SOURCE]='P2P';if(!write(incoming))return false;window.dispatchEvent(new CustomEvent('igch:sonic:room-config-applied',{detail:{version:VERSION,configVersion:incoming.configVersion,updatedAt:incoming[STAMP]}}));return true}
function stampAndPublish(){const c=valid(read());if(!c)return false;c[STAMP]=now();c[SOURCE]='ADMIN';c.configVersion=Math.max(3,Number(c.configVersion)||3);write(c);send();window.dispatchEvent(new CustomEvent('igch:sonic:room-config-published',{detail:{version:VERSION,configVersion:c.configVersion,updatedAt:c[STAMP]}}));return true}
async function start(){if(started)return;started=true;try{const mod=await import(URL);selfId=mod.selfId||Math.random().toString(36).slice(2);room=mod.joinRoom({appId:APP_ID},ROOM_ID);action=room.makeAction('config-v135');action.onMessage=(data)=>applyIncoming(data);room.onPeerJoin=id=>setTimeout(()=>send(id),150);state='CONNECTED';setTimeout(()=>send(),250);setInterval(()=>send(),5000)}catch(e){state='OFFLINE';console.warn('[SONIC CONFIG v1.3.5]',e)}}
window.addEventListener('igch:sonic:admin-config-saved',stampAndPublish);
window.IGCHSonicRoomConfig={version:VERSION,roomId:ROOM_ID,start,send,publish:stampAndPublish,applyIncoming,getState:()=>state,getConfig:read};start();
})();