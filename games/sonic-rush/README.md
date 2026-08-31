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

