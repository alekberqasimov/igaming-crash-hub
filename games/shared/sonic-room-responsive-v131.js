(()=>{'use strict';
const VERSION='1.3.1';
let timer=null;
function style(){if(document.querySelector('style[data-sonic-room-responsive]'))return;const s=document.createElement('style');s.dataset.sonicRoomResponsive='';s.textContent=`
[data-sonic-room-badge]{display:none!important}
.igch-sonic-room-bar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:stretch;width:100%;margin:0 0 9px;padding:0;min-width:0}
.igch-sonic-room-summary,.igch-sonic-room-history{border:1px solid rgba(25,215,255,.22);background:rgba(25,215,255,.055);color:var(--cyan,#19d7ff);border-radius:11px;min-height:36px}
.igch-sonic-room-summary{display:flex;align-items:center;gap:8px;min-width:0;padding:7px 10px;text-align:left;overflow:hidden}
.igch-sonic-room-dot{width:7px;height:7px;flex:0 0 7px;border-radius:50%;background:var(--green,#42e58f);box-shadow:0 0 10px rgba(66,229,143,.8)}
.igch-sonic-room-dot.offline{background:var(--red,#ff5873);box-shadow:0 0 10px rgba(255,88,115,.7)}
.igch-sonic-room-copy{display:flex;align-items:center;gap:7px;min-width:0;flex:1;flex-wrap:wrap}
.igch-sonic-room-kicker{font:1000 7px/1 Inter,system-ui,sans-serif;letter-spacing:.12em;color:#8ea0c3;flex:0 0 auto}
.igch-sonic-room-name{font:1000 9px/1 Inter,system-ui,sans-serif;letter-spacing:.07em;color:#fff;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:210px}
.igch-sonic-room-meta{font:1000 7px/1 Inter,system-ui,sans-serif;letter-spacing:.06em;color:var(--cyan,#19d7ff);flex:0 0 auto}
.igch-sonic-room-role{font:1000 7px/1 Inter,system-ui,sans-serif;letter-spacing:.06em;padding:4px 6px;border-radius:999px;background:rgba(157,67,255,.11);color:#c99aff;flex:0 0 auto}
.igch-sonic-room-history{display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:0 11px;font:1000 8px/1 Inter,system-ui,sans-serif;letter-spacing:.07em;white-space:nowrap;cursor:pointer}
.igch-sonic-room-history:hover{filter:brightness(1.12)}
.igch-sonic-room-short{display:none}
@media(max-width:720px){.igch-sonic-room-bar{gap:6px;margin-bottom:7px}.igch-sonic-room-summary{min-height:34px;padding:6px 8px}.igch-sonic-room-name{max-width:160px}.igch-sonic-room-copy{gap:5px}.igch-sonic-room-history{min-height:34px;padding:0 9px}}
@media(max-width:480px){.igch-sonic-room-bar{grid-template-columns:minmax(0,1fr) auto}.igch-sonic-room-name{max-width:118px}.igch-sonic-room-role{padding:3px 5px}.igch-sonic-room-history{padding:0 8px}.igch-sonic-room-full{display:none}.igch-sonic-room-short{display:inline}}
@media(max-width:370px){.igch-sonic-room-kicker{display:none}.igch-sonic-room-name{max-width:94px}.igch-sonic-room-summary{gap:6px}.igch-sonic-room-meta{font-size:6px}.igch-sonic-room-role{font-size:6px}.igch-sonic-room-history{padding:0 7px}}
`;document.head.appendChild(s)}
function host(){const shell=document.querySelector('.shell')||document.body;const top=shell.querySelector('.top');return{shell,top}}
function ensureBar(){style();let bar=document.querySelector('.igch-sonic-room-bar');if(!bar){bar=document.createElement('div');bar.className='igch-sonic-room-bar';bar.dataset.sonicRoomResponsive='';bar.innerHTML=`<div class="igch-sonic-room-summary" role="status" aria-live="polite"><i class="igch-sonic-room-dot"></i><div class="igch-sonic-room-copy"><span class="igch-sonic-room-kicker">ROOM</span><span class="igch-sonic-room-name">SONIC-GLOBAL</span><span class="igch-sonic-room-meta">1 REAL</span><span class="igch-sonic-room-role">SOLO</span></div></div><button type="button" class="igch-sonic-room-history"><span class="igch-sonic-room-full">HISTORY</span><span class="igch-sonic-room-short">HIST</span><span aria-hidden="true">›</span></button>`;const h=host();if(h.top?.parentElement)h.top.insertAdjacentElement('afterend',bar);else h.shell.prepend(bar);bar.querySelector('.igch-sonic-room-history').addEventListener('click',()=>window.IGCHSonicRoom?.openHistory?.())}const h=host();if(h.top?.parentElement&&bar.previousElementSibling!==h.top)h.top.insertAdjacentElement('afterend',bar);return bar}
function update(){const bar=ensureBar(),api=window.IGCHSonicRoom;const room=api?.roomId||'SONIC-GLOBAL';const count=Math.max(1,Number(api?.getRealCount?.()||1));const state=String(api?.getState?.()||'DISCOVERING');const role=count>=2?(api?.isLeader?.()?'LEADER':'SYNC'):'SOLO';const name=bar.querySelector('.igch-sonic-room-name'),meta=bar.querySelector('.igch-sonic-room-meta'),roleEl=bar.querySelector('.igch-sonic-room-role'),dot=bar.querySelector('.igch-sonic-room-dot');if(name)name.textContent=room;if(meta)meta.textContent=`${count} REAL`;if(roleEl)roleEl.textContent=role;if(dot)dot.classList.toggle('offline',state==='OFFLINE');bar.title=`${room} · ${count} REAL · ${role} · ${state} · UI ${VERSION}`}
function start(){if(timer)return;update();timer=setInterval(update,500);window.addEventListener('resize',update,{passive:true});window.addEventListener('orientationchange',()=>setTimeout(update,120),{passive:true})}
window.IGCHSonicResponsiveRoom={version:VERSION,start,update};start();
})();