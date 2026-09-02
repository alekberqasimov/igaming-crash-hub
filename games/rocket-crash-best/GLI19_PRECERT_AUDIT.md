# GLI-19 v3.0 Pre-Certification Gap Audit

Status: **PRE-CERTIFICATION ENGINEERING REVIEW — NOT A GLI CERTIFICATE**

## Ready for laboratory review

| Area | Status | Evidence |
| --- | --- | --- |
| Fixed theoretical RTP | Ready | RCB-GLOBAL-95 locks 95% RTP / 5% edge |
| Outcome independence | Ready | No previous result, treasury or liability input enters the RNG mapping |
| CSPRNG reference | Partial | Web Crypto supplies 53-bit uniform draws; production authority is still client-side |
| Distribution tests | Ready for pre-cert | 1M-draw reach tests and serial-correlation check |
| 10K reporting horizon | Ready | Session closes for reporting only and does not reset/adapt RNG |
| Config traceability | Partial | Config revision, math profile, settlement ID and audit events are retained locally |
| Player rules/RTP disclosure | Partial | Player UI discloses theoretical RTP, edge, max multiplier and demo status |
| Risk separation | Ready | Treasury may ALLOW/LIMIT/REJECT a wager but cannot modify the selected outcome |

## Certification blockers

1. **Authoritative backend/RGS:** outcome selection and settlement currently run in a browser-elected P2P leader. Production requires a secured authoritative service.
2. **Player ledger:** wallet and settlement must be transactional, server-side, idempotent and reconcilable.
3. **Account controls:** registration, age/identity verification, MFA, exclusion/limits and inactivity re-authentication are outside this demo.
4. **Program verification:** critical components need signed releases, independent hashes and scheduled/on-demand integrity verification.
5. **Clock and records:** authoritative synchronized time, immutable game records, full player-facing recall and regulator-grade exports are required.
6. **Security operations:** access control, segregation of duties, monitoring, incident response, penetration testing, backups and disaster recovery are required.
7. **Interrupted games:** deterministic recovery and pending-wager reconciliation must be implemented server-side.
8. **Independent lab work:** source review, math review, RNG testing and production-equivalent environment testing must be performed by the laboratory.

## Conclusion

The v1.7 build is a stronger **certification candidate prototype**, not a certified gambling system. It deliberately avoids adaptive RTP and documents the remaining production controls rather than presenting demo controls as compliance.
