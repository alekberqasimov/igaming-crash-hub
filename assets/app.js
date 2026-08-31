const DEFAULT_GAMES = [
  {folder:"camel-rush",name:"Camel Rush",version:"v1.9.1",status:"LIVE DEMO",category:"Race · Crash · Cashout",description:"Always-on desert race with rising multiplier, Auto Play, Auto Cashout and live-room simulation.",tags:["Crash","Race","Cashout"],art:"camel",order:10},
  {folder:"goal-rush",name:"Goal Rush",version:"v6.4.02",status:"LIVE DEMO",category:"Football · Run · Cashout",description:"Football-driven progressive cashout experience with manual play, Auto Play and live-result presentation.",tags:["Football","Cashout","Auto Play"],art:"goal",order:20},
  {folder:"penalty",name:"Casino Penalty",version:"v25.14",status:"LIVE DEMO",category:"Football · Penalty · Progressive",description:"Penalty-based progressive prototype with player/admin views, treasury controls and multiplier logic.",tags:["Penalty","Progressive","Treasury"],art:"penalty",order:30},
  {folder:"horse-rush",name:"Horse Rush",version:"1.2",status:"LIVE DEMO",category:"Race · Crash · Cashout",description:"Real-time horse racing crash game with manual and auto staking, live cashout, simulation and treasury-aware risk controls.",tags:["Crash","Horse Racing","Cashout"],art:"horse",order:40},
  {folder:"Greyhound-Rush",name:"Greyhound Rush",version:"1.2",status:"LIVE DEMO",category:"Race · Crash · Cashout",description:"Real-time greyhound racing crash game with animated runners, manual and auto staking, live cashout and simulation.",tags:["Crash","Greyhound Racing","Cashout"],art:"greyhound",order:50}
];

function esc(value){
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
}
function titleFromFolder(name){
  return String(name || "New Game").replace(/[-_]+/g," ").replace(/\b\w/g,c=>c.toUpperCase());
}
function artMarkup(game){
  const title = esc(game.name).toUpperCase();
  if(game.art === "camel"){
    return `<div class="game-art art-camel"><div class="art-grid"></div><div class="shape">🐪</div><div class="art-tag">DESERT / CRASH</div><div class="art-title"><small>REALTIME CASHOUT RACE</small><strong>${title}</strong></div></div>`;
  }
  if(game.art === "goal"){
    return `<div class="game-art art-goal"><div class="art-grid"></div><div class="goalbox"></div><div class="ball"></div><div class="art-tag">FOOTBALL / CASHOUT</div><div class="art-title"><small>PROGRESSIVE RUN</small><strong>${title}</strong></div></div>`;
  }
  if(game.art === "penalty"){
    return `<div class="game-art art-penalty"><div class="art-grid"></div><div class="net"></div><div class="ball"></div><div class="art-tag">FOOTBALL / PROGRESSIVE</div><div class="art-title"><small>PENALTY EXPERIENCE</small><strong>${title}</strong></div></div>`;
  }
  if(game.art === "horse"){
    return `<div class="game-art art-horse"><div class="art-grid"></div><div class="race-streaks"></div><div class="shape horse-shape">🐎</div><div class="art-tag">HORSE / CRASH</div><div class="art-title"><small>REALTIME CASHOUT RACE</small><strong>${title}</strong></div></div>`;
  }
  if(game.art === "greyhound"){
    return `<div class="game-art art-greyhound"><div class="art-grid"></div><div class="race-streaks"></div><div class="track-arc"></div><div class="shape greyhound-shape">🐕</div><div class="art-tag">TRACK / CASHOUT</div><div class="art-title"><small>LIVE GREYHOUND CASHOUT RACE</small><strong>${title}</strong></div></div>`;
  }
  if(game.art === "cover" && game.cover){
    const cover = `./games/${encodeURIComponent(game.folder)}/${encodeURIComponent(game.cover)}`;
    return `<div class="game-art art-cover" style="background-image:linear-gradient(to top,rgba(4,12,8,.72),rgba(4,12,8,.12)),url('${cover}')"><div class="art-tag">HUB GAME</div><div class="art-title"><small>INTERACTIVE PROTOTYPE</small><strong>${title}</strong></div></div>`;
  }
  const initial = esc((game.name || "G").charAt(0).toUpperCase());
  return `<div class="game-art art-generic"><div class="art-grid"></div><div class="symbol">${initial}</div><div class="art-tag">HUB GAME</div><div class="art-title"><small>INTERACTIVE PROTOTYPE</small><strong>${title}</strong></div></div>`;
}
function renderGames(games){
  games = [...games].sort((a,b)=>(a.order ?? 1000)-(b.order ?? 1000) || String(a.name).localeCompare(String(b.name)));
  document.getElementById("gameCount").textContent = games.length;
  document.getElementById("gamesGrid").innerHTML = games.map(game => `
    <article class="game-card">
      ${artMarkup(game)}
      <div class="card-body">
        <div class="card-meta"><span class="status">${esc(game.status || "LIVE DEMO")}</span><span class="version">${esc(game.version || "Latest")}</span></div>
        <h3>${esc(game.name)}</h3>
        <p class="category">${esc(game.category || "iGaming · Interactive Prototype")}</p>
        <p class="description">${esc(game.description || "Interactive browser game prototype.")}</p>
        <div class="tags">${(game.tags || []).slice(0,4).map(tag=>`<span>${esc(tag)}</span>`).join("")}</div>
        <a class="play" href="./games/${encodeURIComponent(game.folder)}/">PLAY GAME ↗</a>
      </div>
    </article>`).join("");
}
function setSync(message, ok=false){
  const badge = document.getElementById("syncBadge");
  badge.className = "sync-badge" + (ok ? " ok" : "");
  badge.innerHTML = `<i></i> ${esc(message)}`;
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
  if(location.protocol === "file:") throw new Error("Local preview");
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
    return {...fallback,...meta,folder:folder.name,name:meta.name||fallback.name||titleFromFolder(folder.name),version:meta.version||fallback.version||"Latest",art:meta.art||fallback.art||"generic",order:Number.isFinite(Number(meta.order))?Number(meta.order):(fallback.order??1000)};
  }));
  return games.filter(game=>game.hidden!==true);
}
(async function start(){
  const config=await loadConfig();
  const fallback=config.fallback_games?.length?config.fallback_games:DEFAULT_GAMES;
  renderGames(fallback);
  try{
    const discovered=await discoverGames(config);
    if(discovered.length){renderGames(discovered);setSync(`${discovered.length} game folders discovered`,true);}else{setSync("Migration pending · showing expected games");}
  }catch(error){console.warn("Folder discovery unavailable",error);setSync("Showing built-in game catalog");}
})();
