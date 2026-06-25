---
applyTo: "e2e/acceptance/**"
---

# Acceptance E2E Instructions

The target is dev/local only, never QA. Spec filenames must start with the Jira ticket ID. Apply the `source-grounded-locators` skill before writing any locator. Acceptance tests use zero retries; a flaky acceptance test should be fixed or flagged, not masked.
