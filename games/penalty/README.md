# Casino Penalty v25.14 — GitHub Pages split

Files:
- `index.html` — PLAYER client only.
- `admin.html` — ADMIN/CMS page with demo PIN `12345`.
- `.nojekyll` — disables Jekyll processing.
- `robots.txt` — advisory crawler rule.

## GitHub Pages update
Upload these files into the ROOT of the existing repository and replace the old files.
Do not upload the ZIP itself.

Player URL: `https://USERNAME.github.io/REPOSITORY/`
Admin URL: `https://USERNAME.github.io/REPOSITORY/admin.html`
PIN: `12345`

Both pages use the same browser `localStorage` on the same GitHub Pages origin, so demo balances/config/treasury state are shared in the same browser.

> Demo only: a static GitHub Pages PIN is not production authentication. Real production admin/authentication and game engine controls must live server-side.

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
