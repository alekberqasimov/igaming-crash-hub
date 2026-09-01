(()=>{'use strict';
const LEGACY='sonicrush_round_history_v26',MAX=120,IS_ADMIN=/\/admin\.html(?:$|\?)/i.test(location.pathname+location.search);
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}},write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const cleanMult=v=>{const n=Number(v);return Number.isFinite(n)&&n>=1?Math.floor(n*100)/100:null};
const cleanRound=v=>{const n=Math.floor(Number(v));return Number.isFinite(n)&&n>0?n:null};
function repairLegacy(){const raw=read(LEGACY,[]),map=new Map();for(const x of Array.isArray(raw)?raw:[]){const m=cleanMult(x?.multiplier),r=cleanRound(x?.round);if(m===null||r===null)continue;const old=map.get(r);const item={key:'R-'+r,round:r,multiplier:m,source:x?.source||'LEGACY',ts:Number(x?.ts)||0};if(!old||item.ts>=old.ts)map.set(r,item)}const out=[...map.values()].sort((a,b)=>a.round-b.round).slice(-MAX);write(LEGACY,out);return out}
function canonical(){const api=window.IGCHSonicRoom;if(!api?.getHistory)return null;try{const a=api.getHistory();if(!Array.isArray(a))return null;const out=[];for(const x of a){const m=cleanMult(x?.bust??x?.multiplier),r=cleanRound(x?.roundId??x?.round);if(m===null||r===null)continue;out.push({round:r,multiplier:m,ts:Number(x?.endedAt)||0})}return out.sort((a,b)=>b.round-a.round).slice(0,18)}catch{return null}}
function box(){return document.querySelector('[data-history],.history-strip')}
function render(){if(IS_ADMIN)return;const b=box();if(!b)return;let h=canonical();if(!h||!h.length)h=repairLegacy().slice(-18).reverse();b.innerHTML=h.map(x=>{const m=x.multiplier,c=m<1.5?'low':m<5?'mid':m<10?'high':'legend';return '<span class="pill '+c+'" data-shared-round="'+x.round+'">'+m.toFixed(2)+'x</span>'}).join('')}
repairLegacy();render();setInterval(render,250);window.addEventListener('igch:sonic:round-finished',()=>setTimeout(render,30));window.addEventListener('storage',e=>{if(e.key===LEGACY||e.key==='igch.sonic.history.v13')render()});
window.IGCHSonicHistoryStrip={version:'2.7.0',repair:repairLegacy,render};
})();
