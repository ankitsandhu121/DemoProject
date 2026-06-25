---
name: promote-to-regression
description: >-
  Use when an acceptance test has shipped to QA and should join the
  permanent regression suite.
---

# Promote To Regression

Use this skill when an acceptance test has shipped to QA and should become durable regression coverage.

1. Copy the markdown plan from `e2e/acceptance/specs/` to `e2e/regression/specs/`.
2. Copy the generated Playwright test from `e2e/acceptance/tests/` to `e2e/regression/tests/`.
3. Re-point environment assumptions from acceptance config to regression config: use `QA_BASE_URL` and any QA auth or API variables instead of local/dev URLs.
4. Hand the promoted test to `regression-healer` once to confirm a clean run against QA.
5. Remove the promoted plan and test from `e2e/acceptance/`; acceptance is for in-sprint stories only.
