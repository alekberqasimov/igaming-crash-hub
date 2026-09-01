# Sonic Crash Best

Clean-room stabilization workspace for the next Sonic crash game architecture.

## Goal
Build a single-source-of-truth Sonic implementation without touching the existing `games/sonic-rush/` game until this version is validated.

## Planned v1.4 architecture
- One canonical room/round coordinator
- One config source of truth
- One finance/risk state
- One round ID sequence
- One multiplier/bust source
- One persistent history
- Admin reads the same live room state as Player View
- Config revisions apply atomically at round boundaries
- Refresh/rejoin preserves current round, active bet and history
- No valid multiplier below 1.00x

## Isolation
This folder is independent from `games/sonic-rush/` and must not import or mutate its runtime state while v1.4 is under development.

Status: scaffold created, implementation pending.
