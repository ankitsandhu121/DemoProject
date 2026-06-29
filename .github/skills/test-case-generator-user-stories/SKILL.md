---
name: test-case-generator-user-stories
description: >-
  Generate structured, traceable test cases from Jira user stories and
  acceptance criteria using BDD patterns, equivalence partitioning, boundary
  analysis, negative scenarios, and risk-based prioritization.
---

# Test Case Generator From User Stories

Use this skill after fetching a Jira ticket and before writing an acceptance test plan.

## Parse First

Before generating test cases, parse the story into:

1. Story ID and title.
2. Narrative: `As a`, `I want`, `So that`.
3. Acceptance criteria.
4. Business rules, constraints, limits, roles, states, and input parameters.
5. Implicit requirements such as accessibility, error handling, authorization, and performance where relevant.
6. Comments: amended or clarified acceptance criteria and out-of-scope ("won't do") notes.
7. Attachments: UI, layout, and spec requirements. Read image and PDF attachments when they can be downloaded; flag any that cannot be read.
8. Linked issues and sub-tasks: dependent constraints from `blocks` / `is blocked by` / `relates to` links and child tasks (one level deep).
9. The linked GitHub PR diff: the actual changed behavior, used to confirm what the story really does.

If a field is missing from Jira, call it out in the plan instead of inventing it.

When a comment amends or contradicts an original acceptance criterion, generate test cases against the **latest** instruction and note the conflict in the plan.

## Test Case Coverage

For each acceptance criterion, produce test cases that include:

1. At least one positive scenario.
2. Explicit negative scenarios for invalid or blocked behavior.
3. Boundary scenarios for ranges, limits, thresholds, counts, dates, text length, or numeric values.
4. Equivalence classes for inputs such as email, number, enum, boolean, date, and free text.
5. Role, permission, state, and error-handling scenarios when the story implies them.

## Format

Use a traceable BDD-style format in acceptance plan markdown:

```markdown
## Traceability Matrix

| Test Case ID | Acceptance Criterion | Priority | Type | Notes |
| --- | --- | --- | --- | --- |
| TC-{JIRA-ID}-001 | AC-1 | P0 | Positive | Happy path |

## Test Cases

### TC-{JIRA-ID}-001: {scenario title}

- Priority: P0
- Type: Positive
- Source: AC-1 (an AC, comment, linked issue key, or attachment)
- Given: {precondition}
- When: {action}
- Then: {expected result}
- Data: {input or fixture notes}
- Locators: {testid-backed locator map or TODO}
```

Use priority labels:

- `P0`: critical business flow, security, data loss, payments, auth, or merge blocker.
- `P1`: important user flow or high-likelihood failure.
- `P2`: edge case, lower-risk validation, or useful regression candidate.

Use type labels:

- `Positive`
- `Negative`
- `Boundary`
- `Equivalence`
- `Accessibility`
- `Error Handling`
- `Authorization`

## Gherkin Shape

Write scenarios in Given/When/Then language even when the final output is markdown rather than `.feature` files. Keep each scenario tied to exactly one source acceptance criterion unless it is an explicit cross-cutting scenario.

## Traceability Rules

1. Every test case must map to one source — an acceptance criterion, an implicit requirement, a comment, a linked issue key, or an attachment — and that origin must be recorded in the test case `Source` field.
2. Every acceptance criterion must have at least one test case.
3. Business rules must appear in either the scenario steps, data notes, or expected result.
4. If an acceptance criterion cannot be tested from the UI, mark it as API-only, manual, or blocked with a short reason.

## Repo Fit

This repository generates Playwright tests, not Cucumber `.feature` files. Use the BDD conventions to structure markdown plans under `e2e/acceptance/specs/`; the `acceptance-generator` converts those plans into Playwright `.spec.ts` files under `e2e/acceptance/tests/`.
