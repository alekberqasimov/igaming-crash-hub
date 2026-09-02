const assert=require('node:assert/strict');
const M=require('../math-core-v15.js');

function approx(a,b,tol,msg){assert.ok(Math.abs(a-b)<=tol,`${msg}: got ${a}, expected ${b} ± ${tol}`)}

const prod=M.normalizeProfile({rtp:.50,maxMultiplier:500,testMode:false});
assert.equal(prod.rtp,.97,'production RTP must be locked');
assert.equal(prod.maxMultiplier,100,'production max multiplier must be locked');
assert.equal(prod.testMode,false);
assert.equal(prod.certificationState,'REFERENCE_PROFILE_LOCKED');

const test=M.normalizeProfile({rtp:.93,maxMultiplier:250,testMode:true});
assert.equal(test.rtp,.93);
assert.equal(test.maxMultiplier,250);
assert.equal(test.certificationState,'NON_CERTIFIED_TEST');

for(const u of [0,.000001,.01,.029,.03,.5,.9,.99,.999999]){
  const b=M.bustFromUniform(u,prod);
  assert.ok(Number.isFinite(b));
  assert.ok(b>=1,'bust below 1.00x');
  assert.ok(b<=prod.maxMultiplier,'bust above cap');
}

assert.throws(()=>M.bustFromUniform(-.1,prod));
assert.throws(()=>M.bustFromUniform(1,prod));
assert.throws(()=>M.bustFromUniform(NaN,prod));

approx(M.theoreticalReachProbability(2,prod),.485,1e-12,'P>=2');
approx(M.theoreticalReachProbability(5,prod),.194,1e-12,'P>=5');
approx(M.theoreticalReachProbability(10,prod),.097,1e-12,'P>=10');
approx(M.theoreticalAutoCashoutRtp(2,prod),.97,1e-12,'2x RTP');
approx(M.theoreticalAutoCashoutRtp(5,prod),.97,1e-12,'5x RTP');

// Same uniform + same certified profile must always produce same bust,
// regardless of external treasury/risk state (which is intentionally absent here).
const u=.812345678;
const expected=M.bustFromUniform(u,prod);
for(const fakeTreasury of [
  {houseCash:0,reserve:0,exposure:1e9},
  {houseCash:1e9,reserve:1e9,exposure:0},
  {houseCash:50,reserve:100000,exposure:99999}
]){
  void fakeTreasury;
  assert.equal(M.bustFromUniform(u,prod),expected,'treasury changed certified bust');
}

// Deterministic grid audit: exact expectations on a uniform lattice.
const N=200000;
let r2=0,r5=0,r10=0,min=Infinity,max=-Infinity;
for(let i=0;i<N;i++){
  const uu=(i+.5)/N;
  const b=M.bustFromUniform(uu,prod);
  if(b>=2)r2++;
  if(b>=5)r5++;
  if(b>=10)r10++;
  min=Math.min(min,b);max=Math.max(max,b);
}
assert.ok(min>=1);
assert.ok(max<=100);
approx(r2/N,.485,.001,'empirical P>=2');
approx(r5/N,.194,.001,'empirical P>=5');
approx(r10/N,.097,.001,'empirical P>=10');

console.log('PASS math-v15', {version:M.VERSION, profile:M.PROFILE_ID, N, r2:r2/N, r5:r5/N, r10:r10/N});
