# Rocket Crash Best v1.5 — Compliance-Oriented Matrix

> Status: engineering readiness matrix only. This is not a GLI certificate and does not represent regulator approval.

## Design target

The v1.5 architecture separates fixed game math/RNG from treasury and liability controls.

- Fixed reference math profile: `RCB-GLOBAL-97`
- Reference RTP: `97.00%`
- Reference house edge: `3.00%`
- Reference max multiplier: `100x`
- RNG source in browser demo: `crypto.getRandomValues()`
- Treasury/Risk engine: bet acceptance and liquidity protection only
- Treasury/Risk engine does **not** generate or modify the bust result
- Canonical round lifecycle: `BETTING -> COUNTDOWN -> RUNNING -> SETTLED`
- Config changes are proposed and applied at a future round boundary
- Player and Admin consume the same canonical room state

## Engineering checks

| Control | v1.5 status | Automated audit |
|---|---|---|
| Bust is finite and >= 1.00x | PASS DESIGN | `math-v15.test.cjs` |
| Fixed production reference RTP | PASS DESIGN | `math-v15.test.cjs` |
| Test math profile visibly non-certified | PASS DESIGN | `math-v15.test.cjs` |
| Treasury cannot alter fixed math result | PASS DESIGN | `math-v15.test.cjs`, `architecture-v15.test.cjs` |
| Risk engine has no RNG/outcome API | PASS DESIGN | `risk-v15.test.cjs`, `architecture-v15.test.cjs` |
| Bet acceptance supports ALLOW/LIMIT/REJECT | PASS DESIGN | `risk-v15.test.cjs` |
| Liability coverage and reserve capacity | PASS DESIGN | `risk-v15.test.cjs` |
| One canonical round lifecycle | PASS DESIGN | `architecture-v15.test.cjs` |
| Settlement idempotency marker | PASS DESIGN | `architecture-v15.test.cjs` |
| State revision / leader epoch | PASS DESIGN | `architecture-v15.test.cjs` |
| Player hides operator treasury/risk controls | PASS DESIGN | `architecture-v15.test.cjs` |
| Admin exposes math/treasury/risk/limits/audit | PASS DESIGN | `architecture-v15.test.cjs` |
| GitHub CI on every game change | ENABLED | `.github/workflows/sonic-crash-best-qa.yml` |

## Still required before real certification submission

1. Replace browser/P2P authority with a secure server-authoritative RGS/game server.
2. Use the production RNG implementation and evidence accepted by the chosen test lab/jurisdiction.
3. Independent statistical and source-code assessment by the chosen testing laboratory.
4. Production authentication, authorization, secrets management and secure admin access.
5. Tamper-evident/immutable production audit logging and retention policy.
6. Production wallet/accounting integration and reconciliation.
7. Defined interrupted-round, reconnect, dispute and rollback procedures.
8. Jurisdiction-specific game rules, player disclosures, responsible gambling and regulatory requirements.
9. Version-controlled math package and change-control process for certified releases.
10. Formal lab submission package: source, math calculations, RNG evidence, game rules, architecture and requested jurisdictions.

## Important separation rule

```text
Fixed Math + RNG ---> Canonical Bust ---> Settlement

Treasury / Reserve / Liability ---> Bet Acceptance ---> ALLOW / LIMIT / REJECT
```

Any future change that makes House Cash, Reserve, historical payout, open liability or player identity alter the fixed production bust distribution must fail engineering review for the GLOBAL profile and requires a separate certified math scope if a jurisdiction permits it.
