# Rocket Crash Best v1.8.1

Production-test/demo crash game for the IGAMING CRASH HUB.

## Unified test workspace

- Player, Admin and pre-cert Audit views are reachable from the in-game icon dock.
- Admin opens as an embedded full-screen workspace, so a tester does not leave the game URL.
- The player UI kit includes Manual / Auto Play modes, quick stake controls, preset auto-cashout targets, session HUD, status feedback and responsive mobile controls.
- The flight multiplier is rendered on every animation frame, so its growth stays visibly continuous between engine state events.

## Runtime architecture
- Fixed reference math profile: 95% theoretical RTP / 5% theoretical house edge.
- Browser CSPRNG reference implementation for the static demo; production certification still requires an authoritative RGS.
- Treasury/Risk engine controls bet capacity using ALLOW / LIMIT / REJECT and does not modify the RNG result.
- Canonical round state shared between Player/Admin demo peers.
- Config changes apply on the next round boundary.
- Admin-only treasury, reserve, exposure and risk controls.
- Player/Admin languages: Azerbaijani, Russian, English.

## Session horizon
Admin can select 10,000 / 100,000 / 1,000,000 / 100,000,000 settled rounds. A session is an accounting and audit reporting block. When the selected number of settled rounds is reached, the current session statistics are closed and a new session begins. The RNG, fixed theoretical RTP and global treasury do not reset or adapt to force a target result within a session.

## Certification note
This GitHub Pages build is not itself GLI-certified and is not a production RGS. Real-money certification requires an authoritative backend/RGS, laboratory review of source/math/RNG, security controls and jurisdiction-specific approval.

## Audit evidence

- `PAR_SHEET_RCB_GLOBAL_95.md`
- `GLI19_PRECERT_AUDIT.md`
- `tests/rng-stat-v17.test.cjs`
- `tests/margin-10k-v17.test.cjs`
