(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.RCBRiskV15=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='1.5.0';
  const money=v=>Math.round((Number(v)||0)*100)/100;
  const clamp=(v,a,b,f=a)=>{const n=Number(v);return Number.isFinite(n)?Math.min(b,Math.max(a,n)):f};

  function normalizeConfig(x={}){
    const minBet=clamp(x.minBet,.01,1e8,1);
    const maxBet=clamp(x.maxBet,minBet,1e9,500);
    return Object.freeze({
      minBet,maxBet,
      maxMultiplier:clamp(x.maxMultiplier,2,1e5,100),
      maxPayoutPerBet:clamp(x.maxPayoutPerBet,minBet,1e12,50000),
      maxPayoutPerRound:clamp(x.maxPayoutPerRound,minBet,1e13,150000),
      maxSessionExposure:clamp(x.maxSessionExposure,minBet,1e14,250000),
      reserveTargetAmount:clamp(x.reserveTargetAmount,0,1e12,20000),
      usableReservePct:clamp(x.usableReservePct,0,1,1),
      reserveRestorePct:clamp(x.reserveRestorePct,0,1,.25),
      liabilityCoverageEnabled:x.liabilityCoverageEnabled!==false,
      warningCoverage:clamp(x.warningCoverage,.01,100,2),
      stressCoverage:clamp(x.stressCoverage,.01,100,1.35),
      criticalCoverage:clamp(x.criticalCoverage,.01,100,1.05)
    });
  }

  function normalizeFinance(f={}){
    return {houseCash:money(Math.max(0,Number(f.houseCash)||0)),reserveBalance:money(Math.max(0,Number(f.reserveBalance)||0)),openExposure:money(Math.max(0,Number(f.openExposure)||0)),roundExposure:money(Math.max(0,Number(f.roundExposure)||0)),sessionExposure:money(Math.max(0,Number(f.sessionExposure)||0)),totalStake:money(Math.max(0,Number(f.totalStake)||0)),totalPayout:money(Math.max(0,Number(f.totalPayout)||0))};
  }

  function snapshot(financeInput={},configInput={}){
    const c=normalizeConfig(configInput),f=normalizeFinance(financeInput);
    const usableReserve=money(f.reserveBalance*c.usableReservePct);
    const availableLiquidity=money(f.houseCash+usableReserve);
    const coverage=f.openExposure>0?availableLiquidity/f.openExposure:999;
    const reserveHealth=c.reserveTargetAmount>0?Math.min(1,f.reserveBalance/c.reserveTargetAmount):1;
    let band='HEALTHY';
    if(coverage<=c.criticalCoverage)band='CRITICAL';
    else if(coverage<=c.stressCoverage)band='STRESS';
    else if(coverage<=c.warningCoverage)band='WARNING';
    return Object.freeze({config:c,finance:f,usableReserve,availableLiquidity,coverage,reserveHealth,band});
  }

  function liabilityFor(stake,maxCashout,configInput={}){
    const c=normalizeConfig(configInput);
    const s=money(Math.max(0,Number(stake)||0));
    const m=clamp(maxCashout,1,c.maxMultiplier,c.maxMultiplier);
    return money(Math.min(c.maxPayoutPerBet,s*m));
  }

  function maxAcceptedStake(financeInput={},configInput={},requestedMaxCashout){
    const s=snapshot(financeInput,configInput),c=s.config,f=s.finance;
    const m=clamp(requestedMaxCashout,1,c.maxMultiplier,c.maxMultiplier);
    const byBet=c.maxPayoutPerBet/m;
    const roundHead=Math.max(0,c.maxPayoutPerRound-f.roundExposure);
    const byRound=roundHead/m;
    const sessionHead=Math.max(0,c.maxSessionExposure-f.sessionExposure);
    const bySession=sessionHead/m;
    let byLiquidity=Infinity;
    if(c.liabilityCoverageEnabled){
      const required=Math.max(.01,c.criticalCoverage);
      const liabilityHead=Math.max(0,s.availableLiquidity/required-f.openExposure);
      byLiquidity=liabilityHead/m;
    }
    return money(Math.max(0,Math.min(c.maxBet,byBet,byRound,bySession,byLiquidity)));
  }

  function evaluateBet({stake,maxCashout,finance={},config={}}={}){
    const c=normalizeConfig(config);
    const requested=money(Math.max(0,Number(stake)||0));
    const m=clamp(maxCashout,1,c.maxMultiplier,c.maxMultiplier);
    if(requested<c.minBet)return Object.freeze({decision:'REJECT',reason:'BELOW_MIN_BET',requestedStake:requested,acceptedStake:0,maxAcceptedStake:0,maxCashout:m,liability:0});
    const cap=maxAcceptedStake(finance,c,m);
    if(cap<c.minBet)return Object.freeze({decision:'REJECT',reason:'INSUFFICIENT_RISK_CAPACITY',requestedStake:requested,acceptedStake:0,maxAcceptedStake:cap,maxCashout:m,liability:0});
    const accepted=money(Math.min(requested,cap));
    const decision=accepted+1e-9<requested?'LIMIT':'ALLOW';
    const reason=decision==='LIMIT'?'RISK_LIMIT_APPLIED':'OK';
    return Object.freeze({decision,reason,requestedStake:requested,acceptedStake:accepted,maxAcceptedStake:cap,maxCashout:m,liability:liabilityFor(accepted,m,c),snapshot:snapshot(finance,c)});
  }

  function settleTreasury({finance={},stake=0,payout=0,config={}}={}){
    const c=normalizeConfig(config),f=normalizeFinance(finance);
    const s=money(Math.max(0,stake)),p=money(Math.max(0,payout));
    let house=money(f.houseCash+s),reserve=f.reserveBalance,remaining=p,reserveUsed=0;
    const fromHouse=Math.min(house,remaining);house=money(house-fromHouse);remaining=money(remaining-fromHouse);
    if(remaining>0&&c.liabilityCoverageEnabled){
      const usable=money(reserve*c.usableReservePct),take=Math.min(usable,remaining);reserve=money(reserve-take);remaining=money(remaining-take);reserveUsed=money(take);
    }
    return Object.freeze({houseCash:house,reserveBalance:reserve,paid:money(p-remaining),unpaid:remaining,reserveUsed});
  }

  return Object.freeze({VERSION,normalizeConfig,normalizeFinance,snapshot,liabilityFor,maxAcceptedStake,evaluateBet,settleTreasury});
});
