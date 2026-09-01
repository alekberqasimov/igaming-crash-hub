const IGCH_SONIC_P2P = (() => {
  'use strict';

  const VERSION = '1.2.0';
  const APP_ID = 'az.alekberqasimov.igaming-crash-hub.sonic-pilot.v1';
  const ROOM_ID = 'sonic-global-demo-v1';
  const TRYSTERO_URL = 'https://esm.run/@trystero-p2p/mqtt@0.25.4';
  const HEARTBEAT_MS = 4000;
  const STALE_MS = 18000;
  const GAME = 'sonic-rush';

  const peers = new Map();
  const peerIds = new Set();
  let room = null;
  let presence = null;
  let roundOpen = null;
  let roundCountdown = null;
  let syncRequest = null;
  let selfPeerId = '';
  let leaderPeerId = '';
  let activeRound = null;
  let activeCountdown = null;
  let roundSeq = 0;
  let started = false;
  let ready = false;
  let rendering = false;
  let feedObserver = null;
  let bodyObserver = null;
  let heartbeatTimer = null;
  let pruneTimer = null;
  let lastPresenceSignature = '';
  let connectionState = 'DISCOVERING';

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function profile() {
    try {
      if (window.IGCHPlayer && typeof window.IGCHPlayer.getProfile === 'function') return window.IGCHPlayer.getProfile();
    } catch (e) {}
    return {id: 'REAL-LOCAL', nickname: 'YOU', type: 'REAL'};
  }

  function session() {
    try {
      if (window.IGCHPlayer && typeof window.IGCHPlayer.getSession === 'function') return window.IGCHPlayer.getSession();
    } catch (e) {}
    return {id: 'LOCAL'};
  }

  function engine() {
    return window.IGCHSonicEngineBridge || null;
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
    const bridge = engine();
    let bridgeState = null;
    try { bridgeState = bridge && typeof bridge.getState === 'function' ? bridge.getState() : null; } catch (e) {}

    const row = engineLocalRow();
    let stake = bridgeState && Number.isFinite(Number(bridgeState.userStake)) ? Number(bridgeState.userStake) : null;
    let result = bridgeState && bridgeState.userResult ? String(bridgeState.userResult) : '';
    let status = bridgeState && bridgeState.userStatus ? String(bridgeState.userStatus) : 'ONLINE';

    if (!bridgeState && row) {
      const stakeText = row.querySelector('span')?.textContent || '';
      const parsedStake = Number(String(stakeText).replace(/[^0-9.,-]/g, '').replace(',', '.'));
      if (Number.isFinite(parsedStake)) stake = parsedStake;
      const outcome = row.querySelector('strong');
      result = String(outcome?.textContent || '').trim();
      if (outcome?.classList.contains('loss') || /LOST/i.test(result)) status = 'LOST';
      else if (outcome?.classList.contains('win')) status = 'CASHED_OUT';
      else status = 'BETTING';
    }

    return {
      v: 2,
      playerId: String(p.id || 'REAL-LOCAL'),
      nickname: String(p.nickname || 'YOU').slice(0, 24),
      sessionId: String(s.id || 'LOCAL'),
      source: 'REAL',
      game: GAME,
      status,
      stake,
      result,
      roundUid: bridgeState?.roundUid || activeRound?.roundUid || null,
      ts: Date.now()
    };
  }

  function presenceSignature(data) {
    return JSON.stringify({
      playerId: data.playerId,
      nickname: data.nickname,
      sessionId: data.sessionId,
      status: data.status,
      stake: data.stake,
      result: data.result,
      roundUid: data.roundUid
    });
  }

  function publishPresence(force = false, target = null) {
    if (!presence) return;
    const data = localSnapshot();
    const sig = presenceSignature(data);
    if (!force && sig === lastPresenceSignature) return;
    lastPresenceSignature = sig;
    try {
      const sent = presence.send(data, target ? {target} : undefined);
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
      if (!current || item.lastSeen > current.lastSeen) byPlayer.set(data.playerId, {peerId, data, lastSeen: item.lastSeen});
    }
    return [...byPlayer.values()].sort((a, b) => String(a.data.nickname || '').localeCompare(String(b.data.nickname || '')));
  }

  function electLeader() {
    const ids = [selfPeerId, ...peerIds].filter(Boolean).sort();
    const previous = leaderPeerId;
    leaderPeerId = ids[0] || selfPeerId || '';
    if (previous !== leaderPeerId) {
      render();
      if (leaderPeerId && leaderPeerId !== selfPeerId && syncRequest) {
        try { syncRequest.send({want: 'round', ts: Date.now()}, {target: leaderPeerId}); } catch (e) {}
      }
    }
    return leaderPeerId;
  }

  function isLeader() {
    electLeader();
    return Boolean(selfPeerId) && leaderPeerId === selfPeerId;
  }

  function makeRoundUid() {
    roundSeq += 1;
    return `${selfPeerId || 'leader'}-${Date.now().toString(36)}-${roundSeq}`;
  }

  function sendRoundPacket(packet, target = null) {
    if (!roundOpen || !packet) return;
    try {
      const sent = roundOpen.send(packet, target ? {target} : undefined);
      if (sent && typeof sent.catch === 'function') sent.catch(() => {});
    } catch (e) {}
  }

  function sendCountdownPacket(packet, target = null) {
    if (!roundCountdown || !packet) return;
    try {
      const sent = roundCountdown.send(packet, target ? {target} : undefined);
      if (sent && typeof sent.catch === 'function') sent.catch(() => {});
    } catch (e) {}
  }

  function beginEngineRound() {
    if (!ready || !engine()) return false;
    electLeader();
    const bridge = engine();

    if (isLeader()) {
      const roundUid = makeRoundUid();
      let packet = null;
      try {
        packet = bridge.openLeaderRound({roundUid, leaderId: selfPeerId});
      } catch (e) {
        console.warn('[IGCH Sonic Room] leader round open failed', e);
        return false;
      }
      if (!packet) return false;
      activeRound = {...packet, roundUid, leaderId: selfPeerId, source: 'ROOM', sentAt: Date.now()};
      activeCountdown = null;
      sendRoundPacket(activeRound);
      publishPresence(true);
      return true;
    }

    try { bridge.setWaitingForRoom?.({leaderId: leaderPeerId}); } catch (e) {}
    if (leaderPeerId && syncRequest) {
      try { syncRequest.send({want: 'round', ts: Date.now()}, {target: leaderPeerId}); } catch (e) {}
    }
    return true;
  }

  function handleEngineCountdown() {
    if (!ready || !engine()) return false;
    electLeader();
    const bridge = engine();

    if (isLeader()) {
      if (activeCountdown && activeCountdown.roundUid === activeRound?.roundUid) return true;
      let packet = null;
      try { packet = bridge.startLeaderCountdown({leaderId: selfPeerId}); } catch (e) {
        console.warn('[IGCH Sonic Room] leader countdown failed', e);
        return false;
      }
      if (!packet) return false;
      activeCountdown = {...packet, leaderId: selfPeerId, source: 'ROOM', sentAt: Date.now()};
      sendCountdownPacket(activeCountdown);
      publishPresence(true);
      return true;
    }

    try { bridge.setWaitingForCountdown?.({leaderId: leaderPeerId}); } catch (e) {}
    if (leaderPeerId && syncRequest) {
      try { syncRequest.send({want: 'countdown', roundUid: activeRound?.roundUid || null, ts: Date.now()}, {target: leaderPeerId}); } catch (e) {}
    }
    return true;
  }

  function receiveRound(packet, meta) {
    const peerId = meta?.peerId;
    if (!peerId || !packet || !packet.roundUid || !packet.leaderId) return;
    peerIds.add(peerId);
    electLeader();
    if (leaderPeerId && packet.leaderId !== leaderPeerId) return;
    activeRound = packet;
    activeCountdown = null;
    try {
      const applied = engine()?.applyRoomOpen?.(packet);
      if (applied === false) {
        // Do not interrupt a running local round. The next room round will sync.
      }
    } catch (e) {
      console.warn('[IGCH Sonic Room] follower round apply failed', e);
    }
    publishPresence(true);
    render();
  }

  function receiveCountdown(packet, meta) {
    const peerId = meta?.peerId;
    if (!peerId || !packet || !packet.roundUid || !packet.leaderId) return;
    peerIds.add(peerId);
    electLeader();
    if (leaderPeerId && packet.leaderId !== leaderPeerId) return;
    if (activeRound && packet.roundUid !== activeRound.roundUid) return;
    activeCountdown = packet;
    try { engine()?.applyRoomCountdown?.(packet); } catch (e) {
      console.warn('[IGCH Sonic Room] follower countdown apply failed', e);
    }
    publishPresence(true);
    render();
  }

  function receiveSyncRequest(data, meta) {
    const peerId = meta?.peerId;
    if (!peerId || !isLeader()) return;
    if (activeRound) sendRoundPacket(activeRound, peerId);
    if (activeCountdown) sendCountdownPacket(activeCountdown, peerId);
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

  function makeRealRow(data) {
    const row = document.createElement('div');
    row.className = 'feed-row igch-p2p-real-player';
    row.dataset.source = 'REAL';
    row.dataset.igchP2p = '1';
    row.dataset.playerId = data.playerId || '';

    const name = document.createElement('b');
    name.textContent = data.nickname || 'REAL PLAYER';
    const badge = document.createElement('em');
    badge.className = 'igch-p2p-real-badge';
    badge.textContent = 'REAL';
    name.appendChild(badge);

    const stake = document.createElement('span');
    stake.textContent = Number.isFinite(Number(data.stake)) && Number(data.stake) > 0 ? `${Number(data.stake).toFixed(0)} AZN` : '-';

    const result = document.createElement('strong');
    result.textContent = statusLabel(data);
    if (data.status === 'CASHED_OUT') result.classList.add('win');
    if (data.status === 'LOST') result.classList.add('loss');

    row.append(name, stake, result);
    return row;
  }

  function ensureStyle() {
    if (document.querySelector('style[data-igch-sonic-room-style]')) return;
    const style = document.createElement('style');
    style.dataset.igchSonicRoomStyle = '';
    style.textContent = `
      [data-feed] .igch-p2p-real-player{grid-column:1/-1;background:rgba(25,215,255,.065);border-bottom:1px solid rgba(25,215,255,.18);border-left:2px solid rgba(25,215,255,.52)}
      [data-feed] .igch-p2p-real-badge{display:inline-block;margin-left:5px;padding:2px 5px;border:1px solid rgba(66,229,143,.3);border-radius:999px;background:rgba(66,229,143,.08);color:var(--green,#42e58f);font-size:6px;font-style:normal;font-weight:1000;letter-spacing:.06em;vertical-align:1px}
      [data-igch-room-chip]{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:5px 9px;border:1px solid rgba(25,215,255,.2);border-radius:10px;background:rgba(25,215,255,.055);white-space:nowrap}
      [data-igch-room-chip] span,[data-igch-room-chip] strong{display:block;line-height:1}
      [data-igch-room-chip] span{font-size:6px;letter-spacing:.14em;color:var(--muted,#8ea0c3)}
      [data-igch-room-chip] strong{margin-top:3px;font-size:8px;color:var(--cyan,#19d7ff)}
      [data-igch-room-dot]{width:6px;height:6px;border-radius:50%;background:var(--cyan,#19d7ff);box-shadow:0 0 8px rgba(25,215,255,.7)}
      [data-igch-room-chip].offline [data-igch-room-dot]{background:var(--red,#ff5873);box-shadow:0 0 8px rgba(255,88,115,.7)}
      @media(max-width:720px){[data-igch-room-chip]{min-height:32px;padding:4px 7px}[data-igch-room-chip] strong{font-size:7px}}
    `;
    document.head.appendChild(style);
  }

  function ensureRoomChip(realCount) {
    const host = document.querySelector('.top-actions,.header-actions,.topbar-actions,.nav-actions');
    if (!host) return;
    let chip = document.querySelector('[data-igch-room-chip]');
    if (!chip) {
      chip = document.createElement('div');
      chip.dataset.igchRoomChip = '';
      chip.innerHTML = '<i data-igch-room-dot></i><div><span>ROOM</span><strong data-igch-room-value>GLOBAL</strong></div>';
      host.insertBefore(chip, host.firstChild);
    }
    chip.classList.toggle('offline', connectionState === 'OFFLINE');
    const value = chip.querySelector('[data-igch-room-value]');
    if (value) {
      if (connectionState === 'OFFLINE') value.textContent = 'OFFLINE';
      else if (!ready) value.textContent = 'CONNECTING';
      else value.textContent = `${realCount} REAL`;
    }
    chip.title = `Sonic Global Demo Room | leader ${leaderPeerId || '-'} | v${VERSION}`;
  }

  function render() {
    const el = feed();
    if (rendering) return;
    rendering = true;
    try {
      if (el) {
        el.querySelectorAll('[data-igch-p2p]').forEach(node => node.remove());
        const remotes = uniqueRemotePlayers();
        const localEngine = engineLocalRow();
        const anchor = localEngine ? localEngine.nextSibling : el.firstChild;
        for (const remote of remotes) el.insertBefore(makeRealRow(remote.data), anchor);
        const realCount = 1 + remotes.length;
        const simCount = el.querySelectorAll('.feed-row[data-source="SIM"]').length;
        const liveCount = document.querySelector('[data-live-count]');
        if (liveCount) liveCount.textContent = String(simCount + realCount);
        ensureRoomChip(realCount);
      } else {
        ensureRoomChip(1 + uniqueRemotePlayers().length);
      }
    } finally {
      rendering = false;
    }
  }

  function scheduleSync() {
    queueMicrotask(() => {
      if (rendering) return;
      publishPresence(false);
      render();
    });
  }

  function isOnlyP2PMutation(records) {
    if (!records.length) return false;
    return records.every(record => {
      if (record.type === 'characterData') return Boolean(record.target.parentElement?.closest?.('[data-igch-p2p]'));
      const nodes = [...record.addedNodes, ...record.removedNodes].filter(node => node.nodeType === 1);
      return nodes.length > 0 && nodes.every(node => node.matches?.('[data-igch-p2p]') || node.closest?.('[data-igch-p2p]'));
    });
  }

  function observeUi() {
    const el = feed();
    if (el && !feedObserver) {
      feedObserver = new MutationObserver(records => {
        if (rendering || isOnlyP2PMutation(records)) return;
        scheduleSync();
      });
      feedObserver.observe(el, {childList: true, subtree: true, characterData: true});
    }

    if (document.body && !bodyObserver) {
      bodyObserver = new MutationObserver(() => scheduleSync());
      bodyObserver.observe(document.body, {attributes: true, attributeFilter: ['data-state']});
    }

    document.addEventListener('click', event => {
      const button = event.target.closest?.('[data-place-bet],[data-cashout],[data-auto-start],[data-auto-stop]');
      if (button) setTimeout(scheduleSync, 40);
    }, true);

    window.addEventListener('igch:telemetry', () => setTimeout(scheduleSync, 0));
    window.addEventListener('pagehide', () => {
      try { publishPresence(true); } catch (e) {}
      try { room?.leave?.(); } catch (e) {}
    });
  }

  function receivePresence(data, meta) {
    const peerId = meta?.peerId;
    if (!peerId || !data || data.game !== GAME || data.source !== 'REAL') return;
    peerIds.add(peerId);
    peers.set(peerId, {data, lastSeen: Date.now()});
    connectionState = 'CONNECTED';
    electLeader();
    render();
  }

  function prune() {
    const now = Date.now();
    let changed = false;
    for (const [peerId, item] of peers) {
      if (!item || now - item.lastSeen > STALE_MS) {
        peers.delete(peerId);
        peerIds.delete(peerId);
        changed = true;
      }
    }
    if (changed) {
      electLeader();
      render();
    }
  }

  async function waitForIdentity() {
    for (let i = 0; i < 60; i++) {
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
      selfPeerId = String(mod.selfId || '');
      room = mod.joinRoom({appId: APP_ID, relayConfig: {redundancy: 2}}, ROOM_ID);
      presence = room.makeAction('igch-presence-v2');
      roundOpen = room.makeAction('igch-round-open-v1');
      roundCountdown = room.makeAction('igch-round-countdown-v1');
      syncRequest = room.makeAction('igch-sync-request-v1');

      presence.onMessage = receivePresence;
      roundOpen.onMessage = receiveRound;
      roundCountdown.onMessage = receiveCountdown;
      syncRequest.onMessage = receiveSyncRequest;

      room.onPeerJoin = peerId => {
        peerIds.add(peerId);
        connectionState = 'CONNECTED';
        electLeader();
        publishPresence(true, peerId);
        if (isLeader()) {
          if (activeRound) sendRoundPacket(activeRound, peerId);
          if (activeCountdown) sendCountdownPacket(activeCountdown, peerId);
        } else if (leaderPeerId) {
          try { syncRequest.send({want: 'round', ts: Date.now()}, {target: leaderPeerId}); } catch (e) {}
        }
        render();
      };

      room.onPeerLeave = peerId => {
        peerIds.delete(peerId);
        peers.delete(peerId);
        electLeader();
        render();
      };

      ready = true;
      connectionState = 'CONNECTED';
      electLeader();
      publishPresence(true);
      heartbeatTimer = setInterval(() => {
        publishPresence(true);
        if (isLeader()) {
          if (activeRound) sendRoundPacket(activeRound);
          if (activeCountdown) sendCountdownPacket(activeCountdown);
        }
      }, HEARTBEAT_MS);
      pruneTimer = setInterval(prune, HEARTBEAT_MS);
      render();
    } catch (error) {
      console.warn('[IGCH Sonic Room] unavailable:', error);
      connectionState = 'OFFLINE';
      ready = false;
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
    peerIds.clear();
    ready = false;
    connectionState = 'OFFLINE';
    render();
  }

  const api = {
    version: VERSION,
    appId: APP_ID,
    roomId: ROOM_ID,
    start,
    stop,
    isReady: () => ready,
    isLeader,
    getLeaderId: () => leaderPeerId,
    getSelfPeerId: () => selfPeerId,
    beginEngineRound,
    handleEngineCountdown,
    getActiveRound: () => activeRound ? {...activeRound} : null,
    getActiveCountdown: () => activeCountdown ? {...activeCountdown} : null,
    getLocal: () => localSnapshot(),
    getPeers: () => uniqueRemotePlayers().map(x => ({...x.data})),
    getRealCount: () => 1 + uniqueRemotePlayers().length,
    getState: () => connectionState
  };

  window.IGCHSonicRoom = api;
  start();
  return api;
})();

export default IGCH_SONIC_P2P;
