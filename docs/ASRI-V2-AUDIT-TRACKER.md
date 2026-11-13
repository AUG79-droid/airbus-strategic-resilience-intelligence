# ASRI 2.0 — audit remediation register

**Scope:** external audit dated 2026-11-13, issues ASRI-001–ASRI-024.
**Protection:** development changes occur only on `asri-v2-audit-remediation`; the public `main` demo remains unchanged.
**Status vocabulary:** FIXED = code change verified in tests; PARTIAL = a control improves the issue but does not satisfy the complete audit recommendation; OPEN = substantial work still needed; NEEDS AIRBUS = cannot establish real-world validity from fictional data or public code.

| Audit ID | Status | Remediation / remaining acceptance condition |
|---|---|---|
| 001 — two mathematical engines | OPEN | Unify model semantics or clearly label domain-specific validity; demonstrate equivalent inputs give equivalent outcomes. Existing DEMO-60 and Case Studio are separate. |
| 002 — independent additive hazards | PARTIAL | v2 adds optional explicit joint failure/disruption likelihood for Case Studio; Fréchet limits, four probability branches and old-file migration tested. Add non-additive delays, distributions, queues, capacity and risk correlations beyond two binary events. |
| 003 — unmodeled routes and common causes | PARTIAL | Translate no longer claims an alternative supplier is independent without verification. Implement a graph of suppliers, routes, assets, capacities and shared upstream hazards and show its impact on outcomes. |
| 004 — incorrect sensitivity | PARTIAL | One-at-a-time parameter perturbation already replaces the old delta-margin heuristic. Add coordinated variation, switch points, output bands and baseline calibration. |
| 005 — contradictory Engineering text | FIXED | Text avoids calling a deterioration an improvement. Regression coverage needed for all case families. |
| 006 — user-declared evidence review | PARTIAL | Different named owner/reviewer required; still no authentication or approved external verification. |
| 007 — unchecked methodology approvals | OPEN / NEEDS AIRBUS | Implement authenticated roles and role separation using an approved internal identity system; current checkmarks remain declarations. |
| 008 — non-comparable environment inventories | OPEN / NEEDS AIRBUS | Require functional units, shared boundaries, versioned sources/factors, allocation rules and uncertainty before asserting comparable benefits. |
| 009 — component versus mission impact | OPEN / NEEDS AIRBUS | Model component → system → asset → mission bridges explicitly, with no automated readiness inference. |
| 010 — vulnerable development Vite | FIXED | Vite pinned to patched 8.3.8, lockfile consistent. |
| 011 — malformed JSON import | FIXED / PARTIAL | IDs, bounds, dates and core shapes validated; formal discriminated schema and migration tests across versions still recommended. |
| 012 — language switch resets selection | FIXED | Workspace no longer remounts solely on locale changes. |
| 013 — broken Unicode in PDF | PARTIAL | Meaningful symbol replacements and font-width wrapping added; full Unicode requires embedded font and visual PDF regression. |
| 014 — Markdown whitespace loss | FIXED | Report blank lines preserved in Markdown. |
| 015 — missing CI E2E | PARTIAL | Browser journeys, translator and PDF/JSON export now run in quality workflow; add all remaining guided/evidence/lab checks. |
| 016 — inconsistent manifests | FIXED | Package and lockfile now both 0.6.0-phase-6. |
| 017 — economics too simple | OPEN | Extend to time-valued losses, contractual terms, discounting, capacity constraints, conditional cost and simulation bands. |
| 018 — falsely precise uncertainty | OPEN | Add credible ranges and scenario bands; do not portray fictional point estimates as calibrated forecasts. |
| 019 — localization/numeration | PARTIAL | Translate step number and selected English/Spanish strings corrected; comprehensive audit still needed. |
| 020 — English grammar | FIXED | Singular days and subject/verb agreement corrected. |
| 021 — mobile hidden tabs | FIXED | All four steps available in two-column small-screen tabs. |
| 022 — lost unsaved drafts | PARTIAL | Browser leave warning added; approved autosave, recovery and revision history not implemented. |
| 023 — exposed maps | FIXED | Production source maps disabled. |
| 024 — unverifiable document integrity | OPEN / NEEDS AIRBUS | Add document revision/digest and signed audit history; acceptance requires approved evidence storage and authenticated reviewers. |

## Current v2 changes and tests

- Optional **jointFailureShock** probability per strategy, explicitly marked not-applicable by default (independence is an assumption, not a fact).
- Exactly four joint probability branches calculated; impossible overlaps rejected instead of clamped.
- Deadline attainment reflects an entered joint risk. **Expected recovery and cost remain additive marginal-event estimates:** the improved dependency handling does *not* certify these other outputs.
- Parameter catalogue expanded from 19 to 20, across all case types.
- Existing version-1 JSON files are migrated in-memory to include the new optional field, with independence as a documented legacy assumption.
- User-facing input fields show admissible overlap bounds by scenario.
- Strategic text no longer implies a second supplier is independent without route verification.
- Unit tests cover independence, correlation, mutually exclusive events, invalid probabilities, exported case migration.
- Run `npm test`, `npm run build` and the GitHub browser/export quality workflow before merging.

## Release and verification gates

**Educational prototype release:** all unit, typecheck/build and browser/export checks pass; synthetic labels and limitations retained; Spanish/English texts reviewed.

**Operational-model release:** additionally requires all high-severity methodological issues closed and proof of calibration, validated boundaries, realistic route assumptions, constraints and independent reproducibility.

**Airbus operational approval:** separate decision by appropriate internal authorities; cannot be supplied by Codex, ChatGPT, synthetic data or automated tests.
