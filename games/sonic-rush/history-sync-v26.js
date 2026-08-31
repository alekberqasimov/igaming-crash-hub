(()=>{'use strict';
const M={prefix:'sonicrush',finance:'sonicrush_finance_v2',logs:'sonicrush_logs_v2',reset:'sonicrush_reset_v2',camel:false};
const H=M.prefix+'_round_history_v26',IS_ADMIN=/\/admin\.html(?:$|\?)/i.test(location.pathname+location.search);
const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??f}catch{return f}},write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const rounds=()=>Math.max(0,Math.floor(Number(read(M.finance,{}).rounds)||0));
const mult=x=>{for(const k of ['displayMultiplier','bustMultiplier','bust','rawBust']){const n=Number(x?.[k]);if(Number.isFinite(n)&&n>=1)return Math.floor(n*100)/100}return null};
function list(){const h=read(H,[]);return Array.isArray(h)?h:[]}
function save(h){write(H,h.filter(x=>Number.isFinite(Number(x?.multiplier))&&Number(x.multiplier)>=1).slice(-120))}
function add(r,m,source){m=Number(m);if(!Number.isFinite(m)||m<1)return false;r=Math.floor(Number(r));if(!Number.isFinite(r)||r<1)return false;const h=list(),key='R-'+r,i=h.findIndex(x=>x.key===key),item={key,round:r,multiplier:Math.floor(m*100)/100,source,ts:Date.now()};if(i>=0)h[i]=item;else h.push(item);save(h);return true}
function logFor(r){const a=read(M.logs,[]);if(!Array.isArray(a))return null;for(let i=a.length-1;i>=0;i--){const x=a[i],id=String(x?.roundId??x?.id??'');if(id==='ROOM-'+r||Number(x?.round)===r){const m=mult(x);if(m!==null)return m}}return null}
function domMult(){for(const sel of ['[data-mult]','[data-multiplier]','.mult','.multiplier']){const e=document.querySelector(sel);if(e){const n=parseFloat(String(e.textContent||'').replace(',','.'));if(Number.isFinite(n)&&n>=1)return Math.floor(n*100)/100}}return null}
function box(){return document.querySelector('[data-history],.history-strip')}
function render(){if(IS_ADMIN)return;const b=box();if(!b)return;const h=list().slice(-18).reverse();b.innerHTML=h.map(x=>{const m=Number(x.multiplier),c=m<1.5?'low':m<5?'mid':m<10?'high':'legend';return '<span class="pill '+c+'" data-shared-round="'+x.round+'">'+m.toFixed(2)+'x</span>'}).join('')}
function bootstrap(){if(list().length)return;const a=read(M.logs,[]);if(!Array.isArray(a))return;const out=[];for(const x of a){const m=mult(x);if(m===null)continue;const id=String(x?.roundId??x?.id??''),z=id.match(/ROOM-(\d+)/);if(z)out.push({key:'R-'+z[1],round:Number(z[1]),multiplier:m,source:'LOG',ts:Number(x?.time??x?.timestamp)||Date.now()})}if(out.length)save(out)}
bootstrap();let last=rounds(),lastReset=localStorage.getItem(M.reset)||'';render();
function tick(){const reset=localStorage.getItem(M.reset)||'',r=rounds();if(reset!==lastReset||r<last){lastReset=reset;save([]);last=r;render();return}if(r>last){let advanced=last;for(let n=last+1;n<=r;n++){let m=logFor(n);if(m===null&&!IS_ADMIN&&n===r)m=domMult();if(m===null)break;if(add(n,m,IS_ADMIN?'ADMIN':'PLAYER'))advanced=n}last=advanced}render()}
setInterval(tick,120);window.addEventListener('storage',e=>{if(e.key===H||e.key===M.logs||e.key===M.finance)tick()});
})();