const IGCH_SONIC_P2P = (() => {
  'use strict';

  const VERSION = '1.0.0';
  const APP_ID = 'az.alekberqasimov.igaming-crash-hub.sonic-pilot.v1';
  const ROOM_ID = 'sonic-global-demo-v1';
  const TRYSTERO_URL = 'https://esm.run/trystero@0.25.4';
  const HEARTBEAT_MS = 5000;
  const STALE_MS = 22000;
  const GAME = 'sonic-rush';

  const peers = new Map();
  let room = null;
  let presence = null;
  let started = false;
  let rendering = false;
  let feedObserver = null;
  let bodyObserver = null;
  let heartbeatTimer = null;
  let pruneTimer = null;
  let lastSignature = '';
  let connectionState = 'DISCOVERING';

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function escapeText(value) {
    return String(value == null ? '' : value);
  }

  function profile() {
    try {
      if (window.IGCHPlayer && typeof window.IGCHPlayer.getProfile === 'function') {
        return window.IGCHPlayer.getProfile();
      }
    } catch (e) {}
    return { id: 'REAL-LOCAL', nickname: 'YOU', type: 'REAL' };
  }

  function session() {
    try {
      if (window.IGCHPlayer && typeof window.IGCHPlayer.getSession === 'function') {
        return window.IGCHPlayer.getSession();
      }
    } catch (e) {}
    return { id: 'LOCAL' };
  }

  function feed() {
    return document.querySelector('[data-feed]');
  }

  function engineLocalRow() {
    const el = feed();
    if (!el) return null;
    return el.querySelector('.igch-real-player:not([data-igch-p2p])');
  }

  function localSnapshot() {
    const p = profile();
    const s = session();
    const state = String(document.body?.dataset?.state || 'ONLINE').toUpperCase();
    const row = engineLocalRow();
    let stake = null;
    let result = '';
    let status = 'ONLINE';

    if (row) {
      const stakeText = row.querySelector('span')?.textContent || '';
      const parsedStake = Number(String(stakeText).replace(/[^0-9.,-]/g, '').replace(',', '.'));
      if (Number.isFinite(parsedStake)) stake = parsedStake;

      const outcome = row.querySelector('strong');
      result = String(outcome?.textContent || '').trim();
      if (outcome?.classList.contains('loss') || /LOST/i.test(result)) status = 'LOST';
      else if (outcome?.classList.contains('win') || (/x$/i.test(result) && result !== '—')) status = 'CASHED_OUT';
      else if (state === 'RUNNING') status = 'PLAYING';
      else if (state === 'COUNTDOWN') status = 'READY';
      else status = 'BETTING';
    } else if (state === 'RUNNING') {
      status = 'WATCHING';
    }

    return {
      v: 1,
      playerId: escapeText(p.id || 'REAL-LOCAL'),
      nickname: escapeText(p.nickname || 'YOU').slice(0, 24),
      sessionId: escapeText(s.id || 'LOCAL'),
      source: 'REAL',
      game: GAME,
      status,
      stake,
      result,
      state,
      ts: Date.now()
    };
  }

  function snapshotSignature(data) {
    return JSON.stringify({
      playerId: data.playerId,
      nickname: data.nickname,
      sessionId: data.sessionId,
      status: data.status,
      stake: data.stake,
      result: data.result,
      state: data.state
    });
  }

  function publish(force = false, target = null) {
    if (!presence) return;
    const data = localSnapshot();
    const sig = snapshotSignature(data);
    if (!force && sig === lastSignature) return;
    lastSignature = sig;
    const options = target ? { target } : undefined;
    try {
      const sent = presence.send(data, options);
      if (sent && typeof sent.catch === 'function') sent.catch(() => {});
    } catch (e) {}
    render();
  }

  function uniqueRemotePlayers() {
    const now = Date.now();
    const byPlayer = new Map();
    for (const [peerId, item] of peers) {
      if (!item || now - item.lastSeen > STALE_MS) continue;
      const data = item.data || {};
      if (data.game !== GAME || data.source !== 'REAL' || !data.playerId) continue;
      const current = byPlayer.get(data.playerId);
      if (!current || item.lastSeen > current.lastSeen) {
        byPlayer.set(data.playerId, { peerId, data, lastSeen: item.lastSeen });
      }
    }
    return [...byPlayer.values()].sort((a, b) =>
      String(a.data.nickname || '').localeCompare(String(b.data.nickname || ''))
    );
  }

  function statusLabel(data) {
    if (data.status === 'CASHED_OUT') return data.result || 'WON';
    if (data.status === 'LOST') return 'LOST';
    if (data.status === 'PLAYING') return 'PLAYING';
    if (data.status === 'BETTING') return 'BET';
    if (data.status === 'READY') return 'READY';
    if (data.status === 'WATCHING') return 'WATCH';
    return 'ONLINE';
  }

  function makeRealRow(data, isSelf = false) {
    const row = document.createElement('div');
    row.className = 'feed-row igch-p2p-real-player' + (isSelf ? ' igch-p2p-self' : '');
    row.dataset.source = 'REAL';
    row.dataset.igchP2p = '1';
    row.dataset.playerId = data.playerId || '';

    const name = document.createElement('b');
    name.textContent = data.nickname || (isSelf ? 'YOU' : 'REAL PLAYER');

    const badge = document.createElement('em');
    badge.className = 'igch-p2p-real-badge';
    badge.textContent = isSelf ? 'YOU · REAL' : 'REAL · P2P';
    name.appendChild(badge);

    const stake = document.createElement('span');
    stake.textContent = Number.isFinite(Number(data.stake)) && Number(data.stake) > 0
      ? `${Number(data.stake).toFixed(0)} AZN`
      : '—';

    const result = document.createElement('strong');
    result.textContent = statusLabel(data);
    if (data.status === 'CASHED_OUT') result.classList.add('win');
    if (data.status === 'LOST') result.classList.add('loss');

    row.append(name, stake, result);
    return row;
  }

  function ensureStyle() {
    if (document.querySelector('style[data-igch-sonic-p2p-style]')) return;
    const style = document.createElement('style');
    style.dataset.igchSonicP2pStyle = '';
    style.textContent = `
      [data-feed] .igch-p2p-real-player{grid-column:1/-1;background:rgba(25,215,255,.065);border-bottom:1px solid rgba(25,215,255,.18);border-left:2px solid rgba(25,215,255,.52)}
      [data-feed] .igch-p2p-self{background:rgba(66,229,143,.075);border-left-color:rgba(66,229,143,.72)}
      [data-feed] .igch-p2p-real-badge{display:inline-block;margin-left:5px;padding:2px 5px;border:1px solid rgba(66,229,143,.3);border-radius:999px;background:rgba(66,229,143,.08);color:var(--green,#42e58f);font-size:6px;font-style:normal;font-weight:1000;letter-spacing:.06em;vertical-align:1px}
      [data-igch-p2p-status]{display:inline-flex;align-items:center;gap:5px;margin-left:7px;padding:3px 6px;border:1px solid rgba(25,215,255,.2);border-radius:999px;background:rgba(25,215,255,.06);color:var(--cyan,#19d7ff);font-size:7px;font-weight:1000;letter-spacing:.06em;white-space:nowrap}
      [data-igch-p2p-status].offline{border-color:rgba(255,88,115,.22);background:rgba(255,88,115,.06);color:var(--red,#ff5873)}
      [data-igch-p2p-status] i{width:6px;height:6px;border-radius:50%;background:currentColor;box-shadow:0 0 8px currentColor}
    `;
    document.head.appendChild(style);
  }

  function ensureStatusBadge(realCount) {
    const el = feed();
    if (!el) return;
    const card = el.closest('.mini') || el.parentElement;
    const header = card?.querySelector('.mini-head') || card?.firstElementChild;
    if (!header) return;

    let badge = header.querySelector('[data-igch-p2p-status]');
    if (!badge) {
      badge = document.createElement('span');
      badge.dataset.igchP2pStatus = '';
      badge.innerHTML = '<i></i><span></span>';
      header.appendChild(badge);
    }
    badge.classList.toggle('offline', connectionState === 'OFFLINE');
    const label = badge.querySelector('span');
    if (label) {
      label.textContent = connectionState === 'OFFLINE'
        ? 'P2P OFFLINE'
        : connectionState === 'DISCOVERING'
          ? `P2P · ${realCount} REAL · SEARCHING`
          : `P2P · ${realCount} REAL`;
    }
  }

  function render() {
    const el = feed();
    if (!el || rendering) return;
    rendering = true;
    try {
      el.querySelectorAll('[data-igch-p2p]').forEach(node => node.remove());

      const remotes = uniqueRemotePlayers();
      const local = localSnapshot();
      const localEngine = engineLocalRow();
      const rows = [];

      if (!localEngine) rows.push(makeRealRow(local, true));
      for (const remote of remotes) rows.push(makeRealRow(remote.data, false));

      let anchor = localEngine ? localEngine.nextSibling : el.firstChild;
      for (const row of rows) {
        el.insertBefore(row, anchor);
      }

      const realCount = 1 + remotes.length;
      const simCount = el.querySelectorAll('.feed-row[data-source="SIM"]').length;
      const liveCount = document.querySelector('[data-live-count]');
      if (liveCount) liveCount.textContent = String(simCount + realCount);
      ensureStatusBadge(realCount);
    } finally {
      rendering = false;
    }
  }

  function scheduleSync() {
    queueMicrotask(() => {
      if (rendering) return;
      publish(false);
      render();
    });
  }

  function observeUi() {
    const el = feed();
    if (el && !feedObserver) {
      feedObserver = new MutationObserver(() => {
        if (!rendering) scheduleSync();
      });
      feedObserver.observe(el, { childList: true, subtree: true, characterData: true });
    }

    if (document.body && !bodyObserver) {
      bodyObserver = new MutationObserver(() => scheduleSync());
      bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['data-state'] });
    }

    document.addEventListener('click', event => {
      const button = event.target.closest?.('[data-place-bet],[data-cashout],[data-auto-start],[data-auto-stop]');
      if (button) setTimeout(scheduleSync, 40);
    }, true);

    window.addEventListener('igch:telemetry', () => setTimeout(scheduleSync, 0));
    window.addEventListener('pagehide', () => {
      try { publish(true); } catch (e) {}
      try { room?.leave?.(); } catch (e) {}
    });
  }

  function receive(data, meta) {
    const peerId = meta?.peerId;
    if (!peerId || !data || data.game !== GAME || data.source !== 'REAL') return;
    peers.set(peerId, { data, lastSeen: Date.now() });
    connectionState = 'CONNECTED';
    render();
  }

  function prune() {
    const now = Date.now();
    let changed = false;
    for (const [peerId, item] of peers) {
      if (!item || now - item.lastSeen > STALE_MS) {
        peers.delete(peerId);
        changed = true;
      }
    }
    if (changed) render();
  }

  async function waitForIdentity() {
    for (let i = 0; i < 50; i++) {
      if (window.IGCHPlayer) return;
      await sleep(100);
    }
  }

  async function start() {
    if (started) return;
    started = true;
    ensureStyle();
    observeUi();
    render();

    try {
      await waitForIdentity();
      const mod = await import(TRYSTERO_URL);
      if (!mod || typeof mod.joinRoom !== 'function') throw new Error('Trystero joinRoom unavailable');

      room = mod.joinRoom({ appId: APP_ID }, ROOM_ID);
      presence = room.makeAction('igch-presence-v1');
      presence.onMessage = receive;

      room.onPeerJoin = peerId => {
        connectionState = 'CONNECTED';
        publish(true, peerId);
        render();
      };

      room.onPeerLeave = peerId => {
        peers.delete(peerId);
        render();
      };

      connectionState = 'CONNECTED';
      publish(true);
      heartbeatTimer = setInterval(() => publish(true), HEARTBEAT_MS);
      pruneTimer = setInterval(prune, HEARTBEAT_MS);
      render();
    } catch (error) {
      console.warn('[IGCH Sonic P2P] unavailable:', error);
      connectionState = 'OFFLINE';
      render();
    }
  }

  function stop() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (pruneTimer) clearInterval(pruneTimer);
    feedObserver?.disconnect();
    bodyObserver?.disconnect();
    try { room?.leave?.(); } catch (e) {}
    peers.clear();
    connectionState = 'OFFLINE';
    render();
  }

  const api = {
    version: VERSION,
    appId: APP_ID,
    roomId: ROOM_ID,
    start,
    stop,
    getLocal: () => localSnapshot(),
    getPeers: () => uniqueRemotePlayers().map(x => ({ ...x.data })),
    getRealCount: () => 1 + uniqueRemotePlayers().length,
    getState: () => connectionState
  };

  window.IGCHSonicRoom = api;
  start();
  return api;
})();

export default IGCH_SONIC_P2P;
