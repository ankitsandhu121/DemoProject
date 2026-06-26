# TaskFlow Repository Context

TaskFlow is a monorepo with a React/Vite frontend in `apps/web` and a Node.js/Express API in `apps/api`.

The E2E framework has two lanes:

- `e2e/acceptance/**` targets dev/local in-sprint Jira story validation.
- `e2e/regression/**` targets QA durable regression coverage.

Custom agent definitions live in `.github/agents/`, and project skills live in `.github/skills/`. Use `e2e-test-orchestrator` as the main entry point for E2E testing tasks; it routes acceptance work to `acceptance-planner`, `acceptance-generator`, and `acceptance-healer`, and routes QA regression work to `regression-healer`. General Playwright authoring guidance lives in the `playwright-e2e` skill, repo-specific locator rules live in `source-grounded-locators`, and Jira story test-case conventions live in `test-case-generator-user-stories`.
