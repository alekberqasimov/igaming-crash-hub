(()=>{'use strict';
const VERSION='1.3.4',KEY='sonicrush_config_v2',MIG='igch.sonic.config.migrated.v134';
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}}
function write(v){try{localStorage.setItem(KEY,JSON.stringify(v));localStorage.setItem(MIG,VERSION)}catch{}}
function migrate(){const c=read();if(!c)return false;const margin=Number(c.targetProfitMargin),rtp=Number(c.targetRtp),budget=Number(c.payoutBudgetPct),ver=Number(c.configVersion||2);const legacy=Math.abs(margin-.5)<1e-9&&Math.abs(rtp-.5)<1e-9&&Math.abs(budget-.5)<1e-9&&ver<=2;if(!legacy)return false;c.targetProfitMargin=.07;c.targetRtp=.93;c.configVersion=3;write(c);window.dispatchEvent(new CustomEvent('igch:sonic:config-migrated',{detail:{version:VERSION,targetProfitMargin:.07,targetRtp:.93}}));return true}
window.IGCHSonicConfigMigration={version:VERSION,migrate};migrate();
})();
