const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const nodeCrypto=require('crypto').webcrypto;

class MemoryStorage{
  constructor(seed={}){this.m=new Map(Object.entries(seed))}
  getItem(k){return this.m.has(k)?this.m.get(k):null}
  setItem(k,v){this.m.set(k,String(v))}
  removeItem(k){this.m.delete(k)}
  clear(){this.m.clear()}
}
class CustomEventMock{constructor(type,init={}){this.type=type;this.detail=init.detail}}

const fastConfig={
  schemaVersion:14,configRevision:1,targetProfitMargin:.07,targetRtp:.93,
  payoutBudgetPct:.50,minBet:1,maxBet:500,maxMultiplier:2,
  maxPayoutPerBet:50000,maxPayoutPerRound:150000,maxSessionExposure:250000,
  growthRate:1,bettingMs:3000,countdownMs:400,settledMs:500,
  reserveTargetAmount:20000,usableReservePct:1,reserveRestorePct:.25,
  liabilityCoverageEnabled:true,
  riskThresholds:{warningCoverage:2,stressCoverage:1.35,criticalCoverage:1.05},
  riskPressure:{reserveWeight:.45,marginWeight:.35,budgetWeight:.20,coverageWeight:.35,maxRtpReduction:.70}
};
const seedState={version:'1.4.0',roomId:'SONIC-CRASH-BEST',epoch:1,leaderId:null,updatedAt:Date.now(),config:fastConfig,pendingConfig:null,finance:{houseCash:0,reserveBalance:20000,totalStake:0,totalPayout:0,rounds:0,openExposure:0,reserveUsed:0,reserveRestored:0},roundSeq:0,round:null,history:[],players:{}};
const localStorage=new MemoryStorage({'scb.v14.state':JSON.stringify(seedState),'scb.v14.wallet':JSON.stringify({balance:1000})});
const events=[];
const ctx={console,localStorage,sessionStorage:new MemoryStorage(),crypto:nodeCrypto,CustomEvent:CustomEventMock,Date,Math,JSON,Number,String,Object,Array,Map,Set,Promise,setTimeout,clearTimeout,setInterval,clearInterval};
ctx.window=ctx;
ctx.window.addEventListener=()=>{};
ctx.window.removeEventListener=()=>{};
ctx.window.dispatchEvent=e=>{events.push(e);return true};
vm.createContext(ctx);
const code=fs.readFileSync(require('path').join(__dirname,'..','core.js'),'utf8');
new vm.Script(code,{filename:'core.js'}).runInContext(ctx);
const api=ctx.SonicCrashBest;
assert(api,'SonicCrashBest API must exist');
assert.strictEqual(api.VERSION,'1.4.0');
assert.strictEqual(api.ROOM_ID,'SONIC-CRASH-BEST');

const def=api.defaultConfig();
assert.strictEqual(def.targetProfitMargin,.07);
assert.strictEqual(def.targetRtp,.93);
assert.strictEqual(def.schemaVersion,14);

const cfg=api.normConfig({...def,targetProfitMargin:.12,targetRtp:.11});
assert.strictEqual(cfg.targetProfitMargin,.12);
assert(Math.abs(cfg.targetRtp-.88)<1e-12,'RTP must be derived from margin');
assert.strictEqual(api.validMult(null),null);
assert.strictEqual(api.validMult(undefined),null);
assert.strictEqual(api.validMult(0),null);
assert.strictEqual(api.validMult(.99),null);
assert.strictEqual(api.validMult(1),1);
assert.strictEqual(api.validMult(2.349),2.34);

api.start({role:'player'});
let s=api.getState();
assert(s.round,'SOLO start must create a round');
assert.strictEqual(s.round.phase,'BETTING');
assert.strictEqual(s.round.bust,null,'Bust must NOT exist during BETTING');
assert.strictEqual(s.round.configRevision,1);
assert(api.getMeta().isLeader,'Single player must be SOLO leader');

const bet=api.placeBet(1,1.5);
assert(bet.ok,'Leader must accept a valid real bet during BETTING');
s=api.getState();
const pid=api.playerProfile().id;
assert(s.round.realBets[pid],'Accepted bet must exist in canonical ledger');
assert(s.finance.openExposure>0,'Accepted bet must affect canonical exposure');

api.proposeConfig({...s.config,targetProfitMargin:.12,targetRtp:.88,configRevision:2,bettingMs:3000,countdownMs:400,settledMs:500,growthRate:1,maxMultiplier:2});
s=api.getState();
assert.strictEqual(s.config.configRevision,1,'Pending config must not alter current round config');
assert(s.pendingConfig,'Pending config must be stored');
assert.strictEqual(s.pendingConfig.configRevision,2);

const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  await delay(6500);
  const end=api.getState();
  assert(end.history.length>=1,'At least one completed canonical round expected');
  for(const h of end.history) assert(h.bust>=1,'History must never contain multiplier below 1.00x');
  assert(end.round.id>=2,'Round sequence must continue forward');
  assert(end.config.configRevision>=2,'Pending config must apply at next round boundary');
  assert(Math.abs(end.config.targetProfitMargin-.12)<1e-12);
  assert(Math.abs(end.config.targetRtp-.88)<1e-12);
  assert(end.round.configRevision===end.config.configRevision,'New round must use applied config revision');

  const risk=api.riskSnapshot();
  assert(Number.isFinite(risk.effectiveRtp));
  assert(risk.effectiveRtp>=.05 && risk.effectiveRtp<=end.config.targetRtp+1e-12);

  for(const name of ['index.html','admin.html']){
    const html=fs.readFileSync(require('path').join(__dirname,'..',name),'utf8');
    assert(html.includes('core.js?v=1.4.0'),name+' must load v1.4 core');
    assert(!html.includes('</body<script'),name+' must not contain malformed body/script tail');
    assert(/<\/html>\s*$/i.test(html),name+' must close html cleanly');
  }
  console.log('SCB QA PASS');
  console.log(JSON.stringify({round:end.round.id,history:end.history.length,configRevision:end.config.configRevision,lastBust:end.history.at(-1)?.bust,riskPressure:risk.pressure,effectiveRtp:risk.effectiveRtp},null,2));
  process.exit(0);
})().catch(err=>{console.error(err);process.exit(1)});
