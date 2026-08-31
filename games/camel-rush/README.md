# Camel Rush v1.9.1 — GitHub Pages Demo

Camel Rush is a browser-based product prototype combining a desert race experience with a cashout/crash-style multiplier, an always-on shared live room, demo treasury accounting, exposure controls, and Monte Carlo / live simulation tooling.

## Files

- `index.html` — player experience; the shared live room starts automatically
- `admin.html` — admin / math / risk / simulation view; the same background live room keeps running
- `.nojekyll` — GitHub Pages compatibility
- `VERSION.txt` — build information

## Demo access

Player: `https://USERNAME.github.io/REPOSITORY/`

Admin: `https://USERNAME.github.io/REPOSITORY/admin.html`

Demo admin passcode: `12345`

## v1.9 highlights

- Always-on Aviator-style shared round cycle
- **10-second betting window** shown directly on the race animation
- Round starts automatically when the betting window reaches zero
- The human player is **not** joined automatically; manual participation requires pressing the bet/join button during the open betting window
- Auto Play becomes an explicit opt-in for automatically joining future shared rounds
- 50 simulated live-room users on the player side
- Simulated users receive independent demo balances and place random stakes from the configured minimum up to the currently permitted maximum
- Stake acceptance is constrained by user balance, current House Cash, usable Reserve, open liability, payout caps and treasury risk zone
- **House Cash starts at 0 AZN**
- Bot stakes increase House Cash during the betting window
- Payouts reduce House Cash and can draw from Reserve when required
- Admin **House & Risk** metrics read from the same live treasury state and update continuously
- Live Activity shows simulated user ID, stake amount, multiplier and result
- Responsive player UI for mobile, laptop and desktop
- Six-camel race animation with finish-line progression
- Manual Bet, Auto Play and Auto Cashout
- AZ / RU / EN interface
- Demo player wallet / deposit
- House Cash, Reserve, liquidity, liability, GGR, RTP and margin tracking
- Monte Carlo RTP simulation
- Admin simulation still supports 10 / 50 / 100 users and accelerated test speeds

## Live treasury flow

At page load, the live room immediately opens a 10-second betting window. Simulated users place accepted stakes during that window. Each accepted stake is credited to House Cash and creates open liability. At zero, the round outcome is locked and the race starts automatically. At settlement, winning simulated bets are paid from House Cash first and then from Reserve if necessary; losing liabilities are released. The next 10-second betting window then opens automatically.

The player's own wallet is separate. The player participates only after explicitly placing a bet during the betting window, unless Auto Play has been deliberately enabled.

## Math / risk principle

The round RNG is not altered by a player's balance, previous results, or the treasury state. House Cash, Reserve and open liability affect **whether a new stake can be accepted and how large it may be**, not the already locked round outcome. This keeps the demo math and audit model internally consistent.

## GitHub Pages deployment

1. Create a GitHub repository.
2. Upload all files from this package to the repository root.
3. Commit the files.
4. Open **Settings → Pages**.
5. Choose **Deploy from a branch**.
6. Select `main` and `/(root)`.
7. Save and wait for the Pages URL to become available.

## Disclaimer

**Prototype / portfolio demonstration only.** Camel Rush is a front-end product and mathematical-risk demonstrator. It is not a certified gambling product, not a production wallet, and not intended to process or solicit real-money wagers. The browser-side RNG, settlement, balances, passcode, simulated users, live-room treasury flow and accounting shown in this repository are for demonstration, portfolio presentation and testing only.

A production real-money deployment would require, at minimum, server-authoritative RNG and settlement, independently tested/certified game mathematics and RNG where required, secure wallet and ledger infrastructure, authentication and authorization, tamper-resistant audit logging, responsible-gambling controls, age/identity verification, KYC/AML processes, jurisdiction-specific licensing and regulatory review, privacy/security controls, monitoring, incident management, and independent legal/compliance approval.

No statement, metric, simulated RTP, simulated GGR, treasury result or user outcome in this demo should be interpreted as a guarantee of regulatory approval, financial performance, player returns, liquidity sufficiency, or suitability for real-money operation.


## v1.9.1 UX fixes

- Player-facing betting phase is labeled **PLAY / OYNA / ИГРАТЬ** instead of “Betting window”.
- The player status shows a direct **Round starts in X.Xs** countdown.
- Auto Cashout fields accept normal mobile typing with either dot or comma decimals (for example `1.80` or `1,80`) and normalize only after editing is finished.

## V2.5 Continuous Admin Rounds
- Live demo rounds do not stop when navigating from Player to Admin.
- Admin automatically becomes the simulation engine when no Player page is active.
- House Cash, Payout, GGR, Reserve and round count continue changing dynamically in Admin.
- Reset clears demo balances/counters, then the engine immediately continues from zero.
- When a Player page is active, Admin follows that live engine instead of creating duplicate rounds.
- A wall-clock catch-up keeps the static GitHub Pages demo continuous after browser throttling/navigation.
- Liability Coverage ON/OFF and existing player visual/animation design are unchanged.
