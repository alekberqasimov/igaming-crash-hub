# Sonic Crash Best v1.4 Architecture

## Single source of truth
`core.js` owns the canonical room state. Player and Admin are views/controllers over the same state model.

Canonical state contains:
- config + pendingConfig
- finance/risk balances
- round sequence and current round
- SIM + REAL bet ledger
- persistent round history

## Round lifecycle
1. BETTING starts with the config revision already locked for that round.
2. SIM bets are generated once by the room leader and added to canonical exposure.
3. REAL bets are accepted into the same canonical ledger.
4. When BETTING closes, the leader calculates bust using the existing treasury/risk formula and the final open exposure.
5. COUNTDOWN and RUNNING use that locked bust.
6. Settlement updates canonical finance once.
7. History receives exactly one canonical round entry.
8. Pending config revision is applied only before the next BETTING round starts.

## P2P authority
- Only player-role peers are eligible for leader election.
- Admin is observer/config-controller and never creates rounds.
- The elected leader broadcasts canonical state snapshots.
- Followers render/adopt canonical state and send bet/cashout requests to the room.
- If public P2P discovery is unavailable, a single Player tab works in SOLO mode.

## Multiplier invariant
Any bust entering canonical state/history must be finite and >= 1.00x.
Invalid values are rejected/fallback to 1.00x at settlement boundaries and must never be rendered as a valid 0.00x result.

## Config revisions
- `schemaVersion` describes data shape.
- `configRevision` describes Admin saves.
- Admin input uses human percentages (7 => 7% margin, derived RTP 93%).
- Admin SAVE creates pending config for the next round boundary; it does not reload the Player page.

## Refresh safety
Canonical room state and per-player wallet journal use isolated `scb.v14.*` localStorage keys. A connected peer can restore the latest room state through P2P snapshots. Active accepted REAL bets live in the canonical round ledger.

## Isolation
No `sonicrush_*` keys and no old Sonic Rush scripts are used by this implementation.
