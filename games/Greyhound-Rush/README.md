# Greyhound Rush

**Current version:** v1.2  
**Player URL:** https://alekberqasimov.github.io/igaming-crash-hub/games/greyhound-rush/  
**Admin URL:** https://alekberqasimov.github.io/igaming-crash-hub/games/greyhound-rush/admin.html

## Short description
A real-time greyhound racing crash game with animated runners, manual and auto staking, live cashout, simulation, and treasury-aware risk controls.

## Main gameplay logic
Players join an automatically running greyhound race, follow a rising multiplier, and cash out before the mathematically pre-locked round endpoint. Manual and Auto Play share one compact stake-control block; the admin layer exposes configuration, treasury/risk, simulation, and round logs.

## Update date
2026-08-31

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
