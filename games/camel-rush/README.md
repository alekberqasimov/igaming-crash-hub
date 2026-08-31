# Camel Rush V2

Variant: **WITH Camel-style Liability Coverage**

Core V2:
- Target Profit Margin default: 50% (editable)
- Target Payout/RTP = 1 - Target Profit Margin
- Payout Budget = House Cash × Payout Budget %
- House Cash, Reserve and Realized Profit are separate
- Reserve Target / Reserve Balance are separate
- Reserve restore uses positive round GGR × Restore %
- Risk Pressure feeds Effective Payout Profile and early-stop distribution
- AZ / RU / EN admin info help
- Admin PIN: 12345

Camel-style coverage uses Available Liquidity = House Cash + Usable Reserve and Coverage = Available Liquidity / Current Open Liability. Coverage thresholds also affect risk state and stake acceptance.

Demo / simulation build. Real-money deployment requires independent math, fairness and regulatory certification.

## V2.1 Selectable Risk Model
Admin Config includes **Liability Coverage / Risk Model**:
- **ON — V2 + Liability Coverage**: Reserve Health + Profit Margin + Payout Budget + real Open Liability/Coverage drive risk pressure. Camel-style coverage also tightens allowed stake when exposure grows.
- **OFF — V2 Treasury Only**: Reserve Health + Profit Margin + Payout Budget drive risk pressure; coverage does not add probability pressure. Hard per-bet, per-round and session payout limits remain.

The selected model is snapshotted at the start of each live round, so changing the switch during a running round applies from the **next round**.
Admin info text is available in AZ / RU / EN.

