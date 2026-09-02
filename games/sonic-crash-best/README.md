# Sonic Crash Best

Clean-room stabilization workspace for the next Sonic crash game architecture.

## Goal
Build a single-source-of-truth Sonic implementation without touching the existing `games/sonic-rush/` game until this version is validated.

## v1.4 architecture
- One canonical room/round coordinator
- One config source of truth
- One finance/risk state
- One round ID sequence
- One multiplier/bust source
- One persistent history
- Admin reads the same live room state as Player View
- Config revisions apply atomically at round boundaries
- Refresh/rejoin preserves canonical round state, active accepted bet ledger and history
- No valid multiplier below 1.00x

## Current implementation
- `core.js` — canonical room, round, config, finance/risk, SIM/REAL ledger, settlement, history and P2P authority
- `index.html` — responsive Player View over canonical state
- `admin.html` — observer/config controller; does not create its own rounds
- `ARCHITECTURE.md` — design and invariants
- `hub.json` — development metadata

## Important behavior
- Bust is generated only when BETTING closes, after canonical exposure is known.
- Admin SAVE creates a pending config revision that is applied before the next round starts.
- Admin never runs a separate continuous round engine.
- Player and Admin use isolated `scb.v14.*` storage keys and do not share old `sonicrush_*` runtime state.

## Isolation
This folder is independent from `games/sonic-rush/` and must not import or mutate its runtime state while v1.4 is under development.

Status: v1.4 MVP implemented on feature branch; validation and hardening pending before merge/deploy.
