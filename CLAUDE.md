# TaskFlow Repository Context

TaskFlow is a monorepo with a React/Vite frontend in `apps/web` and a Node.js/Express API in `apps/api`.

## App Structure

- `apps/web` — React/Vite frontend
- `apps/api` — Express API
- `e2e/acceptance/**` — in-sprint Jira story acceptance plans and generated Playwright tests targeting dev/local
- `e2e/regression/**` — durable QA regression tests targeting QA environment
- `e2e/shared/**` — shared page objects, fixtures, seed helpers, and utilities

## E2E Framework

The E2E framework has two lanes:

- `e2e/acceptance/**` targets dev/local in-sprint Jira story validation.
- `e2e/regression/**` targets QA durable regression coverage.

Custom agent definitions for Claude live in `.claude/agents/`. Use `e2e-test-orchestrator` as the main entry point for all E2E testing tasks; it routes acceptance work to `acceptance-planner`, `acceptance-generator`, and `acceptance-healer`, and routes QA regression work to `regression-healer`.

Skills (shared instructions loaded by agents) live in `.github/skills/`:

- `playwright-e2e` — Playwright industry standards for Page Object Model, specs, assertions, fixtures, configuration, common scenarios, anti-patterns, and debugging.
- `source-grounded-locators` — requires locators to be grounded in actual React source and `data-testid` usage.
- `test-case-generator-user-stories` — converts Jira user stories and acceptance criteria into traceable, prioritized BDD-style test cases.
- `playwright-cli` — Playwright CLI usage for live browser validation.
- `promote-to-regression` — promotes shipped acceptance coverage into the QA regression suite.

## Running the App

Start the API:
```bash
npm run start:api
```

Start the web app:
```bash
npm run dev:web
```

Open `http://localhost:3000`. Demo credentials: `demo@taskflow.dev` / `demo1234`.

## Running Tests

```bash
# Acceptance (targets local/dev)
npm run test:acceptance

# Regression (targets QA — requires QA_BASE_URL)
QA_BASE_URL=https://qa.example.com npm run test:regression
```

## MCP

The Atlassian Jira MCP server (`atlassian-rovo-mcp`) is configured in `.vscode/mcp.json`. The acceptance-planner agent uses it to fetch Jira ticket details.
