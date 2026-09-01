(()=>{'use strict';
const VERSION='1.3.2',KEY='sonicrush_config_v2',SEEN='igch.sonic.config.seen.v132';
let pending=false,reloading=false,last='';
function sig(){try{const c=JSON.parse(localStorage.getItem(KEY)||'{}');return JSON.stringify({v:c.configVersion,m:c.targetProfitMargin,r:c.targetRtp,p:c.payoutBudgetPct,max:c.maxMultiplier,gr:c.growthRate,liab:c.liabilityCoverageEnabled})}catch{return''}}
function mark(){last=sig();sessionStorage.setItem(SEEN,last)}
function safeState(){return String(document.body?.dataset?.state||'').toUpperCase()}
function hasLocalBet(){return !!document.querySelector('.igch-real-player,[data-source="REAL"][data-player-id]')}
function canReload(){const s=safeState();if(!s||s==='SETTLED')return true;if(s==='BETTING'&&!hasLocalBet())return true;return false}
function request(){const n=sig();if(!n||n===last)return;pending=true;attempt()}
function attempt(){if(!pending||reloading)return;if(canReload()){reloading=true;sessionStorage.setItem(SEEN,sig());setTimeout(()=>location.reload(),80)}}
window.addEventListener('storage',e=>{if(e.key===KEY)request()});
window.addEventListener('igch:sonic:state',attempt);
setInterval(()=>{const n=sig();if(!last){last=sessionStorage.getItem(SEEN)||n;sessionStorage.setItem(SEEN,last)}if(n&&n!==last){pending=true;attempt()}},500);
mark();
window.IGCHSonicConfigSync={version:VERSION,get pending(){return pending},check:request};
})();