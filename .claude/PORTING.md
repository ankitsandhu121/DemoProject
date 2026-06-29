# Porting the Agentic E2E Framework to Another Project

This file lists every project-specific reference baked into the agent definitions
(`.claude/agents/` and `.github/agents/`). Change these when adopting the framework
in a different repo.

---

## 1. Directory layout

The agents hard-code this folder structure. Recreate it in the new repo, or update
every path reference.

| What | This project | Change to |
|---|---|---|
| Acceptance plans | `e2e/acceptance/specs/` | your path |
| Acceptance specs | `e2e/acceptance/tests/` | your path |
| Regression specs | `e2e/regression/` | your path |
| Shared page objects | `e2e/shared/pages/` | your path |
| Shared fixtures | `e2e/shared/fixtures/` | your path |
| Shared utilities | `e2e/shared/utils/` | your path |
| Frontend source | `apps/web/src/` | your frontend src root |
| Frontend root (write-guard) | `apps/web/**` | your frontend root |
| Backend root (write-guard) | `apps/api/**` | your backend root |
| Skills | `.github/skills/` | your skills path |

**Files to update:** all five agents in `.claude/agents/` and `.github/agents/`.

---

## 2. Playwright config paths

| Config | This project |
|---|---|
| Acceptance | `e2e/acceptance/playwright.config.js` |
| Regression | `e2e/regression/playwright.config.js` |

Referenced in: `e2e-test-orchestrator`, `acceptance-healer`, `regression-healer`.

---

## 3. Jira / MCP integration

| Setting | This project | Change to |
|---|---|---|
| MCP server name | `atlassian-rovo-mcp` | your MCP server name |
| MCP tool: fetch issue | `atlassian-rovo-mcp/getJiraIssue` | your tool name |
| MCP tool: remote links | `atlassian-rovo-mcp/getJiraIssueRemoteIssueLinks` | your tool name |
| MCP tool: JQL search | `atlassian-rovo-mcp/searchJiraIssuesUsingJql` | your tool name |
| Ticket key example | `SCRUM-5`, `SCRUM-2` | your project prefix, e.g. `PROJ-5` |
| Spec tag convention | `@jira-SCRUM-*` | `@jira-<YOUR-PREFIX>-*` |
| Plan filename pattern | `{TICKET-ID}-{slug}.md` | keep or adjust |

**Files to update:** `acceptance-planner`, `e2e-test-orchestrator` (both `.claude` and
`.github` copies), and the `tools:` frontmatter in the `.github/agents/` variants.

If the new project does not use Jira at all, remove steps 2–4 from `acceptance-planner`
and the Jira routing logic from `e2e-test-orchestrator`.

---

## 4. Test attribute convention

All agents assume `data-testid` as the locator attribute.

| Setting | This project | Change to |
|---|---|---|
| Test attribute | `data-testid` | `data-cy`, `data-test`, etc. |
| Grep command | `grep -rn "data-testid" apps/web/src/` | update both attribute and path |

**Files to update:** `acceptance-planner`, `acceptance-generator`, `acceptance-healer`,
`regression-healer`, `e2e-test-orchestrator` (all copies).

---

## 5. Language and module convention

| Setting | This project | Change to |
|---|---|---|
| Language | JavaScript (no TypeScript) | TypeScript if needed (remove the no-TS rule) |
| Module system | `require` / CommonJS | ESM if your project uses `import` |
| POM style | Class-based `.page.js` files | adjust naming/style convention |
| File extension | `.spec.js` | `.spec.ts` for TypeScript |

**Files to update:** `acceptance-generator` (the convention note in step 4 and the no-TS rule in the last step).

---

## 6. Named fixtures and utilities

These concrete names are cited as examples in the generator's reuse pre-flight step.
Replace them with whatever your new project's shared fixtures actually export.

| Name | Role in this project |
|---|---|
| `demoUser` | Authenticated user object from `fixtures/auth.js` |
| `demoToken` | Auth token from `fixtures/auth.js` |
| `LoginPage.login` | Login helper on the shared login page object |
| `resetTestData` | Test-data teardown helper from `seed.base.js` |
| `getApiBaseURL` | Base URL helper from `seed.base.js` |

**File to update:** `acceptance-generator`, step 3 bullet (the `fixtures/auth.js` example line).

---

## 7. Inline interaction examples

The agents use `nav-*` clicks as a concrete example of repeated inline interactions
that should be extracted into a shared page object. Update to a representative
navigation pattern from the new project.

**File to update:** `acceptance-generator` step 4, `e2e-test-orchestrator` structural
audit step 3.

---

## What does NOT need to change

These are framework-level concerns that travel intact to any project:

- The two-lane model (acceptance vs regression)
- The reuse pre-flight and reuse-before-create ladder
- The structural audit in the orchestrator
- The locator priority ladder and fallback strategy (from `source-grounded-locators`)
- The write-guard rule (never edit app source to create a locator)
- The BDD/traceability plan format
- The Sources header in acceptance plans (comments, attachments, linked issues, PR)
- The zero-retry / no-`waitForTimeout` test quality rules
