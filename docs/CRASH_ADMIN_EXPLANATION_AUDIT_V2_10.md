# Crash Admin Explanation Audit — V2.10

Date: 2026-09-01

## Corrected games
1. Camel Rush — Treasury V2 + optional Liability Coverage explanations; removed contradictory no-treasury-effect wording; active-round lock clarified.
2. Horse Rush — same V2/Liability explanation correction.
3. Greyhound Rush — same V2/Liability explanation correction.
4. Sonic Rush — same V2/Liability explanation correction.
5. Goal Rush — Build Cash Target now documents actual CRITICAL/BUILD/DEFENSIVE/NORMAL conditions and outcome-target restriction.
6. Casino Penalty — removed stale v25.12 wording; Cash Protection info renamed Treasury Target / Warning Level; explicitly preserves its different accepted-round RNG semantics.

## Semantic source of truth
- Rush V2 family: Treasury state can adapt NEXT-round probability via Risk Pressure -> Effective RTP; active round is immutable once started. Liability OFF uses Treasury V2 base pressure; Liability ON adds Coverage Pressure and coverage-based acceptance protection.
- Goal Rush: treasury/margin mode selection constrains allowed outcome multiplier targets.
- Casino Penalty professional model: Treasury/exposure controls acceptance, settlement, reserve and jackpot gating; accepted-round RNG is not steered by treasury balance.

## Player visual scope
No animation, scene, layout or game art redesign is part of this audit.
