const assert=require('assert'),path=require('path');
global.crypto=require('crypto').webcrypto;
const MathCore=require(path.resolve(__dirname,'../math-core-v17.js'));
function rng(seed){let x=seed>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}
const targets=[1.2,1.5,2,2.5,3,5,8],stakes=[1,2,5,10,20,25,50,100];
function session(seed){const R=rng(seed);let wager=0,payout=0;for(let round=0;round<10000;round++){const bust=MathCore.bustFromUniform(R());for(let i=0;i<32;i++){const stake=stakes[Math.floor(R()*stakes.length)],target=targets[Math.floor(R()*targets.length)];wager+=stake;if(target<=bust)payout+=stake*target}}return 1-payout/wager}
const margins=[];for(let i=1;i<=200;i++)margins.push(session(0x9e3779b9^i));margins.sort((a,b)=>a-b);
const mean=margins.reduce((a,b)=>a+b,0)/margins.length,q=p=>margins[Math.floor((margins.length-1)*p)];
assert(Math.abs(mean-.05)<.006,'mean 10K-batch margin must converge near 5%');
assert(q(.025)>0,'95% lower interval should remain operator-positive for this reference mix');
assert(q(.975)<.09,'95% upper interval unexpectedly high');
console.log(JSON.stringify({profile:'RCB-GLOBAL-95',batches:200,roundsPerBatch:10000,meanMargin:mean,p025:q(.025),median:q(.5),p975:q(.975)}));
