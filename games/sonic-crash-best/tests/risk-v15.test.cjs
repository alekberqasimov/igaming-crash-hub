const assert=require('node:assert/strict');
const R=require('../risk-engine-v15.js');

const cfg={minBet:1,maxBet:500,maxMultiplier:100,maxPayoutPerBet:50000,maxPayoutPerRound:150000,maxSessionExposure:250000,reserveTargetAmount:100000,usableReservePct:.5,reserveRestorePct:.25,liabilityCoverageEnabled:true,warningCoverage:2,stressCoverage:1.35,criticalCoverage:1.05};

let f={houseCash:40000,reserveBalance:100000,openExposure:20000,roundExposure:20000,sessionExposure:20000,totalStake:0,totalPayout:0};
let s=R.snapshot(f,cfg);
assert.equal(s.availableLiquidity,90000);
assert.equal(s.coverage,4.5);
assert.equal(s.band,'HEALTHY');

let d=R.evaluateBet({stake:100,maxCashout:5,finance:f,config:cfg});
assert.equal(d.decision,'ALLOW');
assert.equal(d.acceptedStake,100);
assert.equal(d.liability,500);

// maxBet cap must limit a larger request even with plenty of liquidity.
d=R.evaluateBet({stake:2000,maxCashout:2,finance:f,config:cfg});
assert.equal(d.decision,'LIMIT');
assert.equal(d.acceptedStake,500);

// Low liquidity + high exposure: reject or materially limit without changing any RNG result.
f={houseCash:0,reserveBalance:1000,openExposure:450,roundExposure:450,sessionExposure:450};
d=R.evaluateBet({stake:500,maxCashout:100,finance:f,config:{...cfg,reserveTargetAmount:1000,usableReservePct:1}});
assert.ok(['LIMIT','REJECT'].includes(d.decision));
assert.ok(d.acceptedStake<=500);

// Exposure limits are hard constraints.
f={houseCash:1e9,reserveBalance:1e9,openExposure:0,roundExposure:149900,sessionExposure:249900};
d=R.evaluateBet({stake:500,maxCashout:10,finance:f,config:cfg});
assert.equal(d.decision,'LIMIT');
assert.ok(d.acceptedStake<=10.01);

// Below minimum is always rejected.
d=R.evaluateBet({stake:.5,maxCashout:2,finance:{houseCash:1e6,reserveBalance:1e6},config:cfg});
assert.equal(d.decision,'REJECT');
assert.equal(d.reason,'BELOW_MIN_BET');

// Treasury settlement: stake first, payout from house, then usable reserve.
let settled=R.settleTreasury({finance:{houseCash:100,reserveBalance:1000},stake:50,payout:400,config:{...cfg,usableReservePct:.5}});
assert.equal(settled.paid,400);
assert.equal(settled.houseCash,0);
assert.equal(settled.reserveUsed,250);
assert.equal(settled.reserveBalance,750);
assert.equal(settled.unpaid,0);

// No outcome/RNG APIs may exist in the risk module.
for(const forbidden of ['generateBust','bustFromUniform','cryptoUniform53','random']){
  assert.equal(Object.prototype.hasOwnProperty.call(R,forbidden),false,`risk module exposes forbidden outcome API: ${forbidden}`);
}

console.log('PASS risk-v15', {version:R.VERSION});
