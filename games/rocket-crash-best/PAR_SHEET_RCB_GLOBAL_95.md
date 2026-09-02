# Rocket Crash Best — PAR Sheet

## Locked reference profile

- Profile ID: **RCB-GLOBAL-95**
- Math version: **1.7.0**
- Theoretical RTP: **95.00%**
- Theoretical house edge: **5.00%**
- Maximum multiplier: **100.00x**
- Production profile is immutable in the browser demo. Test-only custom profiles are explicitly marked non-certified.

## Outcome mapping

The engine draws one independent uniform value `u` in `[0,1)` using Web Crypto and maps it to:

`bust = floor_2(clamp(0.95 / (1-u), 1.00, 100.00))`

For a fixed cashout target `m` from 1.01x to 100x:

`P(reach m) ≈ 0.95 / m`

Therefore the uncapped theoretical return for a fixed target is approximately:

`m × P(reach m) = 0.95`

Flooring to two decimals is conservative and can only reduce the realized RTP slightly.

## 10,000-round reference audit

The repository test runs 200 independent 10,000-round batches with the reference simulated stake/target mix (32 wagers per round). The acceptance criterion applies to the **mean of batches**, not to each individual block.

Independent 400-batch research run:

- Mean margin: **4.97%**
- Median margin: **5.02%**
- 95% empirical interval for one 10K block: approximately **2.75%–7.02%**
- Observed research range: approximately **1.38%–8.16%**

No result-balancing mechanism is used. Treasury, reserve, liability and previous outcomes do not alter the RNG draw.

## Important limitation

This PAR sheet documents the reference mathematics. Formal certification requires independent laboratory source review, independently selected statistical tests and a production-equivalent authoritative RGS environment.
