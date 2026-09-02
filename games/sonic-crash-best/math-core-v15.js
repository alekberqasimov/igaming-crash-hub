(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.RCBMathV15=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='1.5.0';
  const PROFILE_ID='RCB-GLOBAL-97';
  const SCHEMA_VERSION=15;
  const DEFAULT_RTP=0.97;
  const DEFAULT_MAX_MULTIPLIER=100;

  const clamp=(v,min,max)=>Math.min(max,Math.max(min,Number(v)));
  const floor2=v=>Math.floor((Number(v)+Number.EPSILON)*100)/100;

  function normalizeProfile(input={}){
    const testMode=input.testMode===true;
    const requestedRtp=Number(input.rtp);
    const requestedMax=Number(input.maxMultiplier);
    const rtp=testMode&&Number.isFinite(requestedRtp)?clamp(requestedRtp,0.50,0.999):DEFAULT_RTP;
    const maxMultiplier=testMode&&Number.isFinite(requestedMax)?clamp(requestedMax,2,100000):DEFAULT_MAX_MULTIPLIER;
    return Object.freeze({
      schemaVersion:SCHEMA_VERSION,
      mathVersion:VERSION,
      profileId:testMode?'RCB-TEST-CUSTOM':PROFILE_ID,
      rtp,
      houseEdge:1-rtp,
      maxMultiplier,
      testMode,
      certificationState:testMode?'NON_CERTIFIED_TEST':'REFERENCE_PROFILE_LOCKED'
    });
  }

  function cryptoUniform53(){
    const c=(typeof globalThis!=='undefined'&&globalThis.crypto)||null;
    if(!c||typeof c.getRandomValues!=='function'){
      throw new Error('CSPRNG_UNAVAILABLE');
    }
    const a=new Uint32Array(2);
    c.getRandomValues(a);
    const hi=a[0]>>>5;
    const lo=a[1]>>>6;
    return (hi*67108864+lo)/9007199254740992;
  }

  function validateUniform(u){
    const n=Number(u);
    if(!Number.isFinite(n)||n<0||n>=1)throw new RangeError('RNG_UNIFORM_OUT_OF_RANGE');
    return n;
  }

  function bustFromUniform(u,profileInput={}){
    const p=normalizeProfile(profileInput);
    const x=validateUniform(u);
    // Fixed crash distribution. For any target m in [1,max], P(Bust >= m) ~= RTP/m.
    // Values below 1 are clamped to 1.00x, creating the intended house edge mass at 1.00x.
    const raw=p.rtp/(1-x);
    const bounded=clamp(raw,1,p.maxMultiplier);
    const bust=floor2(bounded);
    if(!Number.isFinite(bust)||bust<1)throw new Error('INVALID_BUST');
    return bust;
  }

  function generateBust(profileInput={},rngFn=cryptoUniform53){
    if(typeof rngFn!=='function')throw new TypeError('RNG_FUNCTION_REQUIRED');
    const u=validateUniform(rngFn());
    return {bust:bustFromUniform(u,profileInput),uniform:u,profile:normalizeProfile(profileInput)};
  }

  function theoreticalReachProbability(multiplier,profileInput={}){
    const p=normalizeProfile(profileInput);
    const m=Number(multiplier);
    if(!Number.isFinite(m)||m<1)return 0;
    if(m>p.maxMultiplier)return 0;
    if(m===1)return 1;
    return Math.min(1,p.rtp/m);
  }

  function theoreticalAutoCashoutRtp(target,profileInput={}){
    const p=normalizeProfile(profileInput);
    const t=Number(target);
    if(!Number.isFinite(t)||t<1||t>p.maxMultiplier)return 0;
    return t*theoreticalReachProbability(t,p);
  }

  function auditSample({iterations=100000,profile={},seedUniforms=null}={}){
    const p=normalizeProfile(profile);
    const n=Math.max(1000,Math.floor(Number(iterations)||100000));
    let min=Infinity,max=-Infinity,sum=0,belowOne=0,invalid=0;
    const counts={reach2:0,reach5:0,reach10:0};
    let idx=0;
    const rng=Array.isArray(seedUniforms)&&seedUniforms.length?()=>{
      const u=seedUniforms[idx%seedUniforms.length];idx++;return validateUniform(u);
    }:cryptoUniform53;
    for(let i=0;i<n;i++){
      let b;
      try{b=bustFromUniform(rng(),p)}catch{invalid++;continue}
      if(b<1)belowOne++;
      if(b>=2)counts.reach2++;
      if(b>=5)counts.reach5++;
      if(b>=10)counts.reach10++;
      min=Math.min(min,b);max=Math.max(max,b);sum+=b;
    }
    return {iterations:n,profile:p,min,max,meanBust:sum/Math.max(1,n-invalid),belowOne,invalid,
      empiricalReach:{x2:counts.reach2/n,x5:counts.reach5/n,x10:counts.reach10/n},
      theoreticalReach:{x2:theoreticalReachProbability(2,p),x5:theoreticalReachProbability(5,p),x10:theoreticalReachProbability(10,p)}};
  }

  return Object.freeze({VERSION,SCHEMA_VERSION,PROFILE_ID,DEFAULT_RTP,DEFAULT_MAX_MULTIPLIER,normalizeProfile,cryptoUniform53,bustFromUniform,generateBust,theoreticalReachProbability,theoreticalAutoCashoutRtp,auditSample});
});
