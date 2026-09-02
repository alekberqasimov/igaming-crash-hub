const assert=require('assert'),path=require('path');
global.crypto=require('crypto').webcrypto;
const MathCore=require(path.resolve(__dirname,'../math-core-v17.js'));
function rng(seed){let x=seed>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}
const R=rng(0x51e5ff),n=1000000,thresholds=[1.2,2,5,10,100],hits=Object.fromEntries(thresholds.map(x=>[x,0]));
let sx=0,sy=0,sxx=0,syy=0,sxy=0,prev=R();
for(let i=1;i<n;i++){const u=R(),b=MathCore.bustFromUniform(u);for(const t of thresholds)if(b>=t)hits[t]++;sx+=prev;sy+=u;sxx+=prev*prev;syy+=u*u;sxy+=prev*u;prev=u}
for(const t of thresholds){const observed=hits[t]/(n-1),expected=.95/t,se=Math.sqrt(expected*(1-expected)/(n-1));assert(Math.abs(observed-expected)<5*se+.00002,`reach distribution failed at ${t}x`)}
const count=n-1,cov=sxy/count-(sx/count)*(sy/count),vx=sxx/count-(sx/count)**2,vy=syy/count-(sy/count)**2,corr=cov/Math.sqrt(vx*vy);
assert(Math.abs(corr)<.01,'serial correlation outside pre-cert threshold');
console.log(JSON.stringify({draws:n-1,hits,serialCorrelation:corr}));
