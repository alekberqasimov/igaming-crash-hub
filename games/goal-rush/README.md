# GOAL RUSH v6.4.02 — GitHub Pages split

This package is prepared from the v6.4.02 Live Result build for the same two-route GitHub Pages setup.

- `index.html` — public PLAYER page with manual play, AUTO PLAY, all auto-cashout targets `1.17x / 1.39x / 1.72x / 2.25x / 3.10x / 4.80x / 8.00x`, wallet/deposit, cash out, and the new readable LIVE RESULT card.
- `admin.html` — separate ADMIN control center with Treasury, RTP/Margin, Reserve, Risk, Live Simulation and configuration.
- Demo admin PIN: `12345`.

## Update the existing GitHub Pages repository

1. Extract the ZIP.
2. Open the existing Goal Rush repository.
3. Choose **Add file → Upload files**.
4. Upload the files from the extracted folder to the repository root.
5. Replace the old `index.html` and `admin.html`.
6. Commit with a message such as `Update Goal Rush v6.4.02 Live Result`.
7. GitHub Pages redeploys automatically; the public URL stays the same.

Player: `https://USERNAME.github.io/REPOSITORY/`

Admin: `https://USERNAME.github.io/REPOSITORY/admin.html`

## Security note

GitHub Pages is static hosting. The PIN gate is suitable only for a demo UI. For production, authentication, RNG/math, wallet and operator controls should be server-side.

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
