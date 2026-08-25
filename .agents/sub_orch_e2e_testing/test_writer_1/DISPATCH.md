# Dispatch: Test Writer 1 (E2E Test Suite Implementation)

## Mission

Implement the comprehensive automated E2E test suite in `server/tests/e2e/` covering Tiers 1-4 with >=82 tests according to the architecture and specifications designed by Explorer 1, Spec Miner 1, and Spec Miner 2.

## Write Ownership & File Boundaries

You exclusively own and will write to:

- `server/tests/e2e/setup.js`
- `server/tests/e2e/runner.js`
- `server/tests/e2e/helpers/auth.helper.js`
- `server/tests/e2e/helpers/prisma.helper.js`
- `server/tests/e2e/helpers/http.helper.js`
- `server/tests/e2e/helpers/scanner.helper.js`
- `server/tests/e2e/tier1-features/` (all 7 test files: f1 to f7, 35 tests)
- `server/tests/e2e/tier2-boundaries/` (all 7 test files: f1 to f7, 35 tests)
- `server/tests/e2e/tier3-pairwise/cross-feature-interactions.test.js` (7 tests)
- `server/tests/e2e/tier4-workloads/real-world-workloads.test.js` (5 tests)

## Required Reading

- `/Users/balveerchoudhary/testbook-platform/.agents/ORIGINAL_REQUEST.md`
- `/Users/balveerchoudhary/testbook-platform/PROJECT.md`
- `/Users/balveerchoudhary/testbook-platform/TEST_INFRA.md`
- `/Users/balveerchoudhary/testbook-platform/.agents/sub_orch_e2e_testing/SCOPE.md`
- `/Users/balveerchoudhary/testbook-platform/.agents/sub_orch_e2e_testing/explorer_1/handoff.md`
- `/Users/balveerchoudhary/testbook-platform/.agents/sub_orch_e2e_testing/spec_miner_1/handoff.md`
- `/Users/balveerchoudhary/testbook-platform/.agents/sub_orch_e2e_testing/spec_miner_2/handoff.md`

## Verification Requirements

- Execute the test suite using `npx vitest run tests/e2e` and `node tests/e2e/runner.js`.
- Ensure all >=82 tests execute and pass with exit code 0.
- Document test commands and complete results in `/Users/balveerchoudhary/testbook-platform/.agents/sub_orch_e2e_testing/test_writer_1/handoff.md`.

## Mandatory Integrity Warning

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
