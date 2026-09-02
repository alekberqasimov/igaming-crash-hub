const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');

const math=read('math-core-v15.js');
const risk=read('risk-engine-v15.js');
const core=read('core-v15.js');
const player=read('index.html');
const admin=read('admin.html');

// Certified/global math core must not inspect treasury or player exposure.
for(const token of ['houseCash','reserveBalance','openExposure','liabilityCoverage','availableLiquidity']){
  assert.equal(math.includes(token),false,`math core illegally references treasury token: ${token}`);
}
assert.ok(math.includes('cryptoUniform53'),'CSPRNG function missing');
assert.ok(math.includes('getRandomValues'),'crypto.getRandomValues missing');
assert.ok(math.includes("DEFAULT_RTP=0.97"),'locked reference RTP missing');

// Risk module must not contain outcome-generation APIs.
for(const token of ['generateBust','bustFromUniform','crypto.getRandomValues','Math.random']){
  assert.equal(risk.includes(token),false,`risk engine illegally contains outcome/RNG token: ${token}`);
}
assert.ok(risk.includes("decision:'REJECT'"));
assert.ok(risk.includes("'LIMIT'"));
assert.ok(risk.includes("'ALLOW'"));

// Canonical engine integration contract.
assert.ok(core.includes('MathCore.generateBust(state.config.mathProfile)'),'canonical engine not using fixed Math Core');
assert.ok(core.includes('Risk.evaluateBet'),'canonical engine not using Risk acceptance engine');
assert.ok(core.includes("phase:'BETTING'"));
assert.ok(core.includes("r.phase='COUNTDOWN'"));
assert.ok(core.includes("r.phase='RUNNING'"));
assert.ok(core.includes("r.phase='SETTLED'"));
assert.ok(core.includes('settlementId'),'settlement idempotency marker missing');
assert.ok(core.includes('stateRevision'),'monotonic state revision missing');
assert.ok(core.includes('epoch'),'leader epoch missing');

// Player must not expose operator-sensitive treasury/risk/admin controls.
const playerLower=player.toLowerCase();
for(const forbidden of ['house cash','reserve target','open exposure','available liquidity','critical coverage','save for next round','certification state']){
  assert.equal(playerLower.includes(forbidden),false,`player leaks admin-only UI: ${forbidden}`);
}
for(const required of ['round history','live / real players','auto cashout','bet / play','cash out']){
  assert.ok(playerLower.includes(required),`player UI missing: ${required}`);
}

// Admin must expose the required operational sections.
const adminLower=admin.toLowerCase();
for(const required of ['game math','treasury','risk & liability','max payout / bet','max payout / round','max session exposure','reserve target','usable reserve','liability coverage','critical coverage','round history','real player bets','audit']){
  assert.ok(adminLower.includes(required),`admin UI missing: ${required}`);
}

// Both views must load the same canonical v1.5 stack.
for(const html of [player,admin]){
  for(const dep of ['math-core-v15.js','risk-engine-v15.js','core-v15.js'])assert.ok(html.includes(dep),`view missing ${dep}`);
}

console.log('PASS architecture-v15');
