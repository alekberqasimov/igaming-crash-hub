# Sonic Rush

Version 1.2 — Treasury Feedback Edition

Player URL:
https://alekberqasimov.github.io/igaming-crash-hub/games/sonic-rush/

Admin URL:
https://alekberqasimov.github.io/igaming-crash-hub/games/sonic-rush/admin.html

Demo admin PIN: `12345`

## What changed in v1.2
- Separate House Cash, Reserve Balance, Reserve Target and Realized Profit/GGR.
- Default Reserve Target: 20,000 AZN.
- Default Target Profit Margin: 50%, deriving a 50% target payout/RTP profile.
- Default Payout Budget: 50% of House Cash.
- Treasury-aware outcome pressure based on reserve health, actual-vs-target margin and payout-budget coverage.
- Reserve restoration uses 25% of positive round GGR until Reserve reaches its target.
- Reset synchronizes open game/admin tabs through localStorage.
- Admin settings include AZ/RU/EN explanatory info buttons.
- Same risk-aware generator is used by live rounds and admin simulation.

## Important
This is a browser demo architecture with no backend. Real-money deployment requires independent mathematical, regulatory and fairness certification.

Updated: 2026-08-31


Admin PIN: `12345`

## V2.1 Selectable Risk Model
Admin Config includes **Liability Coverage / Risk Model**:
- **ON — V2 + Liability Coverage**: Reserve Health + Profit Margin + Payout Budget + real Open Liability/Coverage drive risk pressure. Camel-style coverage also tightens allowed stake when exposure grows.
- **OFF — V2 Treasury Only**: Reserve Health + Profit Margin + Payout Budget drive risk pressure; coverage does not add probability pressure. Hard per-bet, per-round and session payout limits remain.

The selected model is snapshotted at the start of each live round, so changing the switch during a running round applies from the **next round**.
Admin info text is available in AZ / RU / EN.


## V2.5 Continuous Admin Rounds
- Live demo rounds do not stop when navigating from Player to Admin.
- Admin automatically becomes the simulation engine when no Player page is active.
- House Cash, Payout, GGR, Reserve and round count continue changing dynamically in Admin.
- Reset clears demo balances/counters, then the engine immediately continues from zero.
- When a Player page is active, Admin follows that live engine instead of creating duplicate rounds.
- A wall-clock catch-up keeps the static GitHub Pages demo continuous after browser throttling/navigation.
- Liability Coverage ON/OFF and existing player visual/animation design are unchanged.

## V2.7 Target / Actual Semantics
- Target Profit Margin is a target, not realized payout.
- Derived Target RTP = 1 - Target Profit Margin where margin is authoritative.
- Actual RTP = Total Payout / Total Stake; Actual Margin = 1 - Actual RTP.
- Payout Budget is House Cash risk budget, not RTP.
- Admin separates target and actual metrics. Player visuals are unchanged.

## V2.8 Admin Info Audit
- Every active math/treasury/risk config now has code-accurate AZ/RU/EN info help.
- Help explicitly distinguishes Target vs Actual, RTP vs Payout Budget, soft risk feedback vs hard limits, and settings that do not change RNG.
- Explanations were written against each game's current implementation rather than copied generically across games.
- Player visuals and gameplay are unchanged.
