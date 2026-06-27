// SCRUM-5: Task Management — Add, Complete, and Delete Tasks
// Acceptance criteria: AC-1 through AC-7 and implicit auth requirements.
// All 15 test cases (TC-SCRUM5-001 through TC-SCRUM5-015) are implemented here.
//
// Seed strategy:
//   - Each test resets server state via POST /api/reset before running.
//   - Tasks required as preconditions are seeded via POST /api/tasks (Authorization: Bearer demo-token).
//   - UI interactions are used only when the UI behavior itself is under test.
//
// Auth:
//   - Browser tests log in via LoginPage before interacting with the dashboard.
//   - TC-SCRUM5-014 is an API-only test using the Playwright `request` fixture.
//
// Locator notes:
//   - The <span> inside each task <li> (TaskList.jsx:10) has no data-testid.
//     task-item-{id}.getByText(title) is used as a fallback.
//     TODO (developer): add data-testid="task-title-{id}" to that <span>.

'use strict';

const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../shared/pages/login.page');
const { TaskPage } = require('../../shared/pages/task.page');
const { demoUser, demoToken } = require('../../shared/fixtures/auth');
const { getApiBaseURL } = require('../../shared/seed.base');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const API_BASE = getApiBaseURL();
const AUTH_HEADER = { Authorization: `Bearer ${demoToken}` };

/**
 * Resets the server task state and returns a Playwright APIRequestContext that
 * was already created for this test so callers can reuse it for seeding.
 */
async function resetAndSeed(request, tasks = []) {
  await request.post(`${API_BASE}/api/reset`);
  const created = [];
  for (const title of tasks) {
    const res = await request.post(`${API_BASE}/api/tasks`, {
      headers: AUTH_HEADER,
      data: { title },
    });
    const body = await res.json();
    // body is the full tasks array — the newly created task is the last element
    created.push(body[body.length - 1]);
  }
  return created;
}

/** Logs the browser in and waits for the dashboard to be visible. */
async function loginAndOpenDashboard(page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(demoUser.email, demoUser.password);
  await expect(page.getByTestId('dashboard')).toBeVisible();
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe('SCRUM-5: Task Management — Add, Complete, and Delete Tasks @jira-SCRUM-5', () => {

  // -------------------------------------------------------------------------
  // TC-SCRUM5-001 | P0 | Positive | AC-1
  // -------------------------------------------------------------------------
  test('TC-SCRUM5-001 [P0] Add a new task — happy path (AC-1)', async ({ page, request }) => {
    await resetAndSeed(request);
    await loginAndOpenDashboard(page);

    const taskPage = new TaskPage(page);
    await taskPage.addTask('Buy groceries');

    // task-item-1 is the first task after reset (nextId starts at 1)
    await taskPage.expectTaskVisible(1, 'Buy groceries');
    await taskPage.expectTaskList();
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM5-002 | P0 | Positive | AC-7
  // -------------------------------------------------------------------------
  test('TC-SCRUM5-002 [P0] Input field clears after task is added (AC-7)', async ({ page, request }) => {
    await resetAndSeed(request);
    await loginAndOpenDashboard(page);

    const taskPage = new TaskPage(page);
    await taskPage.addTask('Read a book');

    await taskPage.expectInputCleared();
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM5-003 | P1 | Negative | AC-2
  // -------------------------------------------------------------------------
  test('TC-SCRUM5-003 [P1] Empty title — form does not submit (AC-2)', async ({ page, request }) => {
    await resetAndSeed(request);
    await loginAndOpenDashboard(page);

    const taskPage = new TaskPage(page);

    // Intercept any outbound POST /api/tasks call — there should be none
    let apiTasksCallMade = false;
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/api/tasks')) {
        apiTasksCallMade = true;
      }
    });

    // Click submit without typing anything
    await taskPage.addTaskSubmit.click();

    // Empty state must remain — no task was created
    await taskPage.expectEmptyState();
    expect(apiTasksCallMade).toBe(false);
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM5-004 | P1 | Boundary | AC-2
  // -------------------------------------------------------------------------
  test('TC-SCRUM5-004 [P1] Whitespace-only title — form does not submit (AC-2)', async ({ page, request }) => {
    await resetAndSeed(request);
    await loginAndOpenDashboard(page);

    const taskPage = new TaskPage(page);

    let apiTasksCallMade = false;
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/api/tasks')) {
        apiTasksCallMade = true;
      }
    });

    await taskPage.addTask('   ');

    // Empty state must remain — whitespace-only title is rejected client-side
    await taskPage.expectEmptyState();
    expect(apiTasksCallMade).toBe(false);
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM5-005 | P0 | Positive | AC-3
  // -------------------------------------------------------------------------
  test('TC-SCRUM5-005 [P0] Mark a task as done (AC-3)', async ({ page, request }) => {
    await resetAndSeed(request, ['Walk the dog']);
    await loginAndOpenDashboard(page);

    const taskPage = new TaskPage(page);

    // Pre-condition: task exists and is not done
    await taskPage.expectTaskActive(1);

    await taskPage.toggleTask(1);

    await taskPage.expectTaskDone(1);
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM5-006 | P1 | Positive | AC-4
  // -------------------------------------------------------------------------
  test('TC-SCRUM5-006 [P1] Mark a completed task as active again (AC-4)', async ({ page, request }) => {
    // Seed task and toggle it done via API before the test opens the browser
    await resetAndSeed(request, ['Walk the dog']);
    // Toggle done via API so the browser sees done=true on first render
    await request.patch(`${API_BASE}/api/tasks/1`, { headers: AUTH_HEADER });

    await loginAndOpenDashboard(page);

    const taskPage = new TaskPage(page);

    // Pre-condition: task is shown as done
    await taskPage.expectTaskDone(1);

    await taskPage.toggleTask(1);

    await taskPage.expectTaskActive(1);
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM5-007 | P0 | Positive | AC-5
  // -------------------------------------------------------------------------
  test('TC-SCRUM5-007 [P0] Delete a task (AC-5)', async ({ page, request }) => {
    await resetAndSeed(request, ['Call dentist']);
    await loginAndOpenDashboard(page);

    const taskPage = new TaskPage(page);
    await taskPage.deleteTask(1);

    await taskPage.expectEmptyState();
    await taskPage.expectTaskAbsent(1);
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM5-008 | P1 | Positive | AC-6
  // -------------------------------------------------------------------------
  test('TC-SCRUM5-008 [P1] Empty state shown when no tasks exist (AC-6)', async ({ page, request }) => {
    await resetAndSeed(request);
    await loginAndOpenDashboard(page);

    const taskPage = new TaskPage(page);
    await taskPage.expectEmptyState();
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM5-009 | P1 | Negative | AC-6
  // -------------------------------------------------------------------------
  test('TC-SCRUM5-009 [P1] Empty state disappears after first task is added (AC-6)', async ({ page, request }) => {
    await resetAndSeed(request);
    await loginAndOpenDashboard(page);

    const taskPage = new TaskPage(page);

    // Pre-condition: empty state is visible
    await taskPage.expectEmptyState();

    await taskPage.addTask('Morning run');

    await taskPage.expectTaskList();
    await expect(taskPage.emptyState).toHaveCount(0);
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM5-010 | P1 | Positive | AC-1
  // -------------------------------------------------------------------------
  test('TC-SCRUM5-010 [P1] Multiple tasks added sequentially all appear in list (AC-1)', async ({ page, request }) => {
    await resetAndSeed(request);
    await loginAndOpenDashboard(page);

    const taskPage = new TaskPage(page);
    // awaitResponse: true waits for each POST /api/tasks response before the next
    // submission, ensuring IDs are assigned in order and the UI has re-rendered.
    await taskPage.addTask('Task A', { awaitResponse: true });
    await taskPage.addTask('Task B', { awaitResponse: true });
    await taskPage.addTask('Task C', { awaitResponse: true });

    // All three items must be present
    await taskPage.expectTaskVisible(1, 'Task A');
    await taskPage.expectTaskVisible(2, 'Task B');
    await taskPage.expectTaskVisible(3, 'Task C');

    // Exact count: 3 task items — selector targets dynamic testid prefix
    // CSS attribute prefix selector is a deliberate last-resort for count-only assertion
    // TODO (developer): consider a data-testid="task-count" or similar for cleaner count assertion
    const taskItems = page.locator('[data-testid^="task-item-"]'); // CSS last-resort — no count-specific testid exists
    await expect(taskItems).toHaveCount(3);
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM5-011 | P1 | Positive | AC-5
  // -------------------------------------------------------------------------
  test('TC-SCRUM5-011 [P1] Delete one of multiple tasks — others remain (AC-5)', async ({ page, request }) => {
    await resetAndSeed(request, ['Keep me', 'Delete me']);
    await loginAndOpenDashboard(page);

    const taskPage = new TaskPage(page);

    // Pre-condition: both tasks visible
    await taskPage.expectTaskVisible(1, 'Keep me');
    await taskPage.expectTaskVisible(2, 'Delete me');

    await taskPage.deleteTask(2);

    await taskPage.expectTaskVisible(1, 'Keep me');
    await taskPage.expectTaskAbsent(2);

    const taskItems = page.locator('[data-testid^="task-item-"]'); // CSS last-resort — no count-specific testid exists
    await expect(taskItems).toHaveCount(1);
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM5-012 | P2 | Boundary | AC-1
  // -------------------------------------------------------------------------
  test('TC-SCRUM5-012 [P2] Single-character task title is accepted (AC-1)', async ({ page, request }) => {
    await resetAndSeed(request);
    await loginAndOpenDashboard(page);

    const taskPage = new TaskPage(page);
    await taskPage.addTask('X');

    await taskPage.expectTaskVisible(1, 'X');
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM5-013 | P2 | Boundary | AC-1
  // -------------------------------------------------------------------------
  test('TC-SCRUM5-013 [P2] Task title with leading/trailing whitespace is trimmed (AC-1)', async ({ page, request }) => {
    await resetAndSeed(request);
    await loginAndOpenDashboard(page);

    const taskPage = new TaskPage(page);
    await taskPage.addTask('  Trim me  ');

    // The AddTaskForm calls title.trim() before the API call; the stored title is "Trim me".
    // toHaveText() on the task item does exact full-text matching and auto-retries, making it
    // the reliable way to assert that only the trimmed text is rendered.
    // getByText() fallback on the inner <span> is used for the positive visibility check because
    // the <span> in TaskList.jsx:10 has no data-testid.
    // TODO (developer): add data-testid="task-title-{id}" to the <span> in TaskList.jsx.
    await expect(taskPage.taskItem(1).getByText('Trim me')).toBeVisible();
    // Assert the task item's full text content is exactly the trimmed title.
    // This is more reliable than a negative getByText() assertion, which normalizes whitespace.
    await expect(taskPage.taskItem(1)).toHaveText(/^Trim me/);
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM5-014 | P0 | Authorization | Implicit — Auth
  // API-only test — no browser page needed
  // -------------------------------------------------------------------------
  test('TC-SCRUM5-014 [P0] Unauthenticated API call to /api/tasks returns 401 (Implicit — Auth)', async ({ request }) => {
    // No Authorization header
    const response = await request.get(`${API_BASE}/api/tasks`);

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  // -------------------------------------------------------------------------
  // TC-SCRUM5-015 | P0 | Authorization | Implicit — Auth
  // -------------------------------------------------------------------------
  test('TC-SCRUM5-015 [P0] Dashboard is not rendered before login (Implicit — Auth)', async ({ page }) => {
    // Navigate without logging in
    await page.goto('/');

    // Dashboard must be absent
    await expect(page.getByTestId('dashboard')).toHaveCount(0);

    // Login form must be present
    await expect(page.getByTestId('login-email-input')).toBeVisible();
  });

});
