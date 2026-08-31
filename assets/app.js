const DEFAULT_GAMES = [
  {folder:"camel-rush",name:"Camel Rush",version:"v1.9.1",status:"LIVE DEMO",category:"Race · Crash · Cashout",description:"Always-on desert race with rising multiplier, Auto Play, Auto Cashout and live-room simulation.",tags:["Crash","Race","Cashout"],art:"camel",order:10},
  {folder:"goal-rush",name:"Goal Rush",version:"v6.4.02",status:"LIVE DEMO",category:"Football · Run · Cashout",description:"Football-driven progressive cashout experience with manual play, Auto Play and live-result presentation.",tags:["Football","Cashout","Auto Play"],art:"goal",order:20},
  {folder:"penalty",name:"Casino Penalty",version:"v25.14",status:"LIVE DEMO",category:"Football · Penalty · Progressive",description:"Penalty-based progressive prototype with player/admin views, treasury controls and multiplier logic.",tags:["Penalty","Progressive","Treasury"],art:"penalty",order:30},
  {folder:"horse-rush",name:"Horse Rush",version:"1.2",status:"LIVE DEMO",category:"Race · Crash · Cashout",description:"Real-time horse racing crash game with manual and auto staking, live cashout, simulation and treasury-aware risk controls.",tags:["Crash","Horse Racing","Cashout"],art:"horse",order:40},
  {folder:"Greyhound-Rush",name:"Greyhound Rush",version:"1.2",status:"LIVE DEMO",category:"Race · Crash · Cashout",description:"Real-time greyhound racing crash game with animated runners, manual and auto staking, live cashout and simulation.",tags:["Crash","Greyhound Racing","Cashout"],art:"greyhound",order:50}
];

const DEFAULT_COVERS = ["cover.webp","cover.png","cover.jpg","cover.jpeg"];
const coverProbeCache = new Map();

function esc(value){
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
}
function titleFromFolder(name){
  return String(name || "New Game").replace(/[-_]+/g," ").replace(/\b\w/g,c=>c.toUpperCase());
}
function safeRelativePath(value){
  const path=String(value||"").trim().replace(/\\/g,"/");
  if(!path || path.startsWith("/") || path.includes("..") || /^[a-z][a-z0-9+.-]*:/i.test(path)) return null;
  return path.split("/").filter(Boolean).map(encodeURIComponent).join("/");
}
function gameAssetUrl(game,file){
  const safe=safeRelativePath(file);
  if(!safe) return null;
  return `./games/${encodeURIComponent(game.folder)}/${safe}`;
}
function imageExists(url){
  if(!url) return Promise.resolve(false);
  if(coverProbeCache.has(url)) return coverProbeCache.get(url);
  const probe=new Promise(resolve=>{
    const img=new Image();
    let done=false;
    const finish=value=>{if(done)return;done=true;clearTimeout(timer);img.onload=null;img.onerror=null;resolve(value)};
    const timer=setTimeout(()=>finish(false),3000);
    img.onload=()=>finish(img.naturalWidth>0 && img.naturalHeight>0);
    img.onerror=()=>finish(false);
    img.decoding="async";
    img.src=url;
  });
  coverProbeCache.set(url,probe);
  return probe;
}
async function resolveCover(game){
  const candidates=[];
  if(typeof game.cover==="string" && game.cover.trim()) candidates.push(game.cover.trim());
  for(const name of DEFAULT_COVERS) if(!candidates.some(x=>x.toLowerCase()===name)) candidates.push(name);
  for(const file of candidates){
    const url=gameAssetUrl(game,file);
    if(url && await imageExists(url)) return url;
  }
  return null;
}
async function resolveCovers(games){
  return Promise.all(games.map(async game=>({...game,_coverUrl:await resolveCover(game)})));
}
function hashText(value){
  let h=2166136261;
  for(const ch of String(value||"game")){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
  return h>>>0;
}
function visualInfo(game){
  const corpus=[game.name,game.folder,game.category,...(game.tags||[])].join(" ").toLowerCase();
  const iconRules=[
    [/camel/,"🐪"],[/greyhound|dog|hound/,"🐕"],[/horse|equine/,"🐎"],[/football|soccer|goal|penalty/,"⚽"],
    [/rocket|space|moon/,"🚀"],[/aviator|plane|flight|air/,"✈️"],[/shark/,"🦈"],[/fish|ocean|sea/,"🐟"],
    [/chicken|hen|rooster/,"🐔"],[/duck/,"🦆"],[/car|racing|formula/,"🏎️"],[/bike|motor/,"🏍️"],
    [/train/,"🚄"],[/balloon/,"🎈"],[/coin|gold|treasure/,"🪙"],[/dice/,"🎲"],[/card|poker/,"🂡"]
  ];
  let symbol=String(game.icon||"").trim();
  if(!symbol){for(const [rule,icon] of iconRules){if(rule.test(corpus)){symbol=icon;break}}}
  if(!symbol){
    const words=String(game.name||titleFromFolder(game.folder)).trim().split(/\s+/).filter(Boolean);
    symbol=(words.length>1?(words[0][0]+words[1][0]):(words[0]||"G").slice(0,2)).toUpperCase();
  }
  const categoryParts=String(game.category||"Interactive · Game").split(/[·|/]+/).map(x=>x.trim()).filter(Boolean);
  const label=String(game.label||game.artLabel||categoryParts.slice(0,2).join(" / ")||"HUB / GAME").toUpperCase();
  const subtitle=String(game.subtitle||game.artSubtitle||(game.tags||[]).slice(0,3).join(" · ")||"INTERACTIVE PROTOTYPE").toUpperCase();
  const seed=hashText(`${game.theme||""}|${game.folder}|${game.name}`);
  const hue=seed%360;
  const hue2=(hue+45+(seed%70))%360;
  return {symbol,label,subtitle,hue,hue2};
}
function autoStyle(info){
  return `--auto-hue:${info.hue};--auto-hue2:${info.hue2}`;
}
function autoArtMarkup(game){
  const title=esc(game.name).toUpperCase();
  const v=visualInfo(game);
  return `<div class="game-art art-auto" style="${autoStyle(v)}"><div class="art-grid"></div><div class="auto-orb"></div><div class="auto-streaks"></div><div class="auto-symbol">${esc(v.symbol)}</div><div class="art-tag">${esc(v.label)}</div><div class="art-title"><small>${esc(v.subtitle)}</small><strong>${title}</strong></div></div>`;
}
function coverArtMarkup(game){
  const title=esc(game.name).toUpperCase();
  const v=visualInfo(game);
  return `<div class="game-art art-cover art-auto" style="${autoStyle(v)}"><div class="art-grid"></div><div class="auto-orb"></div><div class="auto-streaks"></div><div class="auto-symbol">${esc(v.symbol)}</div><img class="cover-image" src="${esc(game._coverUrl)}" alt="" loading="lazy" decoding="async" onerror="this.remove()"><div class="cover-shade"></div><div class="art-tag">${esc(v.label)}</div><div class="art-title"><small>${esc(v.subtitle)}</small><strong>${title}</strong></div></div>`;
}
function artMarkup(game){
  if(game._coverUrl) return coverArtMarkup(game);
  const title=esc(game.name).toUpperCase();
  if(game.art === "camel") return `<div class="game-art art-camel"><div class="art-grid"></div><div class="shape">🐪</div><div class="art-tag">DESERT / CRASH</div><div class="art-title"><small>REALTIME CASHOUT RACE</small><strong>${title}</strong></div></div>`;
  if(game.art === "goal") return `<div class="game-art art-goal"><div class="art-grid"></div><div class="goalbox"></div><div class="ball"></div><div class="art-tag">FOOTBALL / CASHOUT</div><div class="art-title"><small>PROGRESSIVE RUN</small><strong>${title}</strong></div></div>`;
  if(game.art === "penalty") return `<div class="game-art art-penalty"><div class="art-grid"></div><div class="net"></div><div class="ball"></div><div class="art-tag">FOOTBALL / PROGRESSIVE</div><div class="art-title"><small>PENALTY EXPERIENCE</small><strong>${title}</strong></div></div>`;
  if(game.art === "horse") return `<div class="game-art art-horse"><div class="art-grid"></div><div class="race-streaks"></div><div class="shape horse-shape">🐎</div><div class="art-tag">HORSE / CRASH</div><div class="art-title"><small>REALTIME CASHOUT RACE</small><strong>${title}</strong></div></div>`;
  if(game.art === "greyhound") return `<div class="game-art art-greyhound"><div class="art-grid"></div><div class="race-streaks"></div><div class="track-arc"></div><div class="shape greyhound-shape">🐕</div><div class="art-tag">TRACK / CASHOUT</div><div class="art-title"><small>LIVE GREYHOUND CASHOUT RACE</small><strong>${title}</strong></div></div>`;
  return autoArtMarkup(game);
}
function renderGames(games){
  games=[...games].sort((a,b)=>(a.order??1000)-(b.order??1000)||String(a.name).localeCompare(String(b.name)));
  document.getElementById("gameCount").textContent=games.length;
  document.getElementById("gamesGrid").innerHTML=games.map(game=>`
    <article class="game-card">
      ${artMarkup(game)}
      <div class="card-body">
        <div class="card-meta"><span class="status">${esc(game.status||"LIVE DEMO")}</span><span class="version">${esc(game.version||"Latest")}</span></div>
        <h3>${esc(game.name)}</h3>
        <p class="category">${esc(game.category||"iGaming · Interactive Prototype")}</p>
        <p class="description">${esc(game.description||"Interactive browser game prototype.")}</p>
        <div class="tags">${(game.tags||[]).slice(0,4).map(tag=>`<span>${esc(tag)}</span>`).join("")}</div>
        <a class="play" href="./games/${encodeURIComponent(game.folder)}/">PLAY GAME ↗</a>
      </div>
    </article>`).join("");
}
function setSync(message,ok=false){
  const badge=document.getElementById("syncBadge");
  badge.className="sync-badge"+(ok?" ok":"");
  badge.innerHTML=`<i></i> ${esc(message)}`;
}
async function loadConfig(){
  try{const response=await fetch("./hub-config.json",{cache:"no-store"});if(response.ok)return await response.json();}catch(_){}
  return {owner:"alekberqasimov",repository:"igaming-crash-hub",games_path:"games",fallback_games:DEFAULT_GAMES};
}
async function loadOptionalJson(url){
  try{const response=await fetch(url,{cache:"no-store"});if(response.ok)return await response.json();}catch(_){}
  return null;
}
async function discoverGames(config){
  if(location.protocol==="file:") throw new Error("Local preview");
  const path=config.games_path||"games";
  const api=`https://api.github.com/repos/${config.owner}/${config.repository}/contents/${path}`;
  const response=await fetch(api,{headers:{"Accept":"application/vnd.github+json"},cache:"no-store"});
  if(!response.ok) throw new Error(`GitHub API ${response.status}`);
  const items=await response.json();
  const folders=(items||[]).filter(item=>item.type==="dir");
  const fallbackMap=new Map((config.fallback_games||DEFAULT_GAMES).map(game=>[String(game.folder).toLowerCase(),game]));
  const games=await Promise.all(folders.map(async folder=>{
    const fallback=fallbackMap.get(String(folder.name).toLowerCase())||{};
    const meta=await loadOptionalJson(`./${path}/${encodeURIComponent(folder.name)}/hub.json`)||{};
    return {...fallback,...meta,folder:folder.name,name:meta.name||fallback.name||titleFromFolder(folder.name),version:meta.version||fallback.version||"Latest",art:meta.art||fallback.art||"auto",order:Number.isFinite(Number(meta.order))?Number(meta.order):(fallback.order??1000)};
  }));
  return resolveCovers(games.filter(game=>game.hidden!==true));
}
(async function start(){
  const config=await loadConfig();
  const fallback=(config.fallback_games?.length?config.fallback_games:DEFAULT_GAMES).map(game=>({...game}));
  renderGames(fallback);
  resolveCovers(fallback).then(renderGames).catch(()=>{});
  try{
    const discovered=await discoverGames(config);
    if(discovered.length){renderGames(discovered);setSync(`${discovered.length} game folders discovered`,true);}else{setSync("Migration pending · showing expected games");}
  }catch(error){console.warn("Folder discovery unavailable",error);setSync("Showing built-in game catalog");}
})();
