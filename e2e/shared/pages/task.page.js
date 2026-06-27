// Task page object — locators grounded in apps/web/src/components/
// data-testid sources:
//   dashboard      → App.jsx:20
//   add-task-input → AddTaskForm.jsx:16
//   task-list      → TaskList.jsx:7
//   task-item-{id} → TaskList.jsx:9  (dynamic — use seeded ID)
//
// Fallback locators (no data-testid in source — role/text used instead):
//   add-task-submit    → AddTaskForm.jsx:21 button[type=submit] "Add task"
//                        TODO (developer): add data-testid="add-task-submit" to the submit button in AddTaskForm.jsx
//   task-list-empty    → TaskList.jsx:3 <p> text "No tasks yet - add one above."
//                        TODO (developer): add data-testid="task-list-empty" to the <p> in TaskList.jsx
//   task-complete-{id} → TaskList.jsx:11 first <button> inside task-item-{id}
//                        TODO (developer): add data-testid={`task-complete-${task.id}`} to the toggle button in TaskList.jsx
//   task-delete-{id}   → TaskList.jsx:14 second <button> inside task-item-{id} ("Delete")
//                        TODO (developer): add data-testid={`task-delete-${task.id}`} to the delete button in TaskList.jsx
//
// TODO (developer): The <span> inside each <li> that renders task.title (TaskList.jsx:10)
// has no data-testid. Add data-testid={`task-title-${task.id}`} to enable direct, stable
// text assertions without relying on getByText() fallback.

const { expect } = require('@playwright/test');

class TaskPage {
  constructor(page) {
    this.page = page;
    this.dashboard = page.getByTestId('dashboard');
    this.addTaskInput = page.getByTestId('add-task-input');
    // Submit button has no data-testid in AddTaskForm.jsx — label is fetched from GET /api/config at runtime.
    // API returns { submitLabel: 'Save task' }; falls back to 'Add task' on error.
    // Using getByRole with a regex to handle both the loaded label and the error fallback.
    // TODO (developer): add data-testid="add-task-submit" to the <button type="submit"> in AddTaskForm.jsx
    this.addTaskSubmit = page.getByRole('button', { name: /Save task|Add task/ });
    // Fallback: no data-testid on the empty-state <p> in TaskList.jsx — using visible text
    // TODO (developer): add data-testid="task-list-empty" to the <p> in TaskList.jsx
    this.emptyState = page.getByText('No tasks yet - add one above.');
    this.taskList = page.getByTestId('task-list');
  }

  // --- Locator helpers ---

  taskItem(id) {
    return this.page.getByTestId(`task-item-${id}`);
  }

  // Fallback: no data-testid on the toggle button in TaskList.jsx — using role scoped to task item
  // TODO (developer): add data-testid={`task-complete-${task.id}`} to the toggle button in TaskList.jsx
  taskToggle(id) {
    return this.taskItem(id).getByRole('button', { name: /Mark done|Mark active/ });
  }

  // Fallback: no data-testid on the delete button in TaskList.jsx — using role + name scoped to task item
  // TODO (developer): add data-testid={`task-delete-${task.id}`} to the delete button in TaskList.jsx
  taskDelete(id) {
    return this.taskItem(id).getByRole('button', { name: 'Delete' });
  }

  // --- Actions ---

  /**
   * Types a title in the add-task input and clicks submit.
   * Pass `awaitResponse: true` when adding tasks sequentially so the method
   * waits for the POST /api/tasks response before returning. This ensures the
   * server has assigned an ID and the UI has re-rendered before the next task
   * is submitted, preventing race conditions.
   * Default is false so that tests that expect NO submission (e.g. whitespace
   * validation) are not blocked waiting for a request that never comes.
   */
  async addTask(title, { awaitResponse = false } = {}) {
    if (awaitResponse) {
      const responsePromise = this.page.waitForResponse(
        (resp) => resp.url().includes('/api/tasks') && resp.request().method() === 'POST'
      );
      await this.addTaskInput.fill(title);
      await this.addTaskSubmit.click();
      await responsePromise;
    } else {
      await this.addTaskInput.fill(title);
      await this.addTaskSubmit.click();
    }
  }

  /** Clicks the delete button for the given task ID. */
  async deleteTask(id) {
    await this.taskDelete(id).click();
  }

  /** Clicks the toggle button for the given task ID. */
  async toggleTask(id) {
    await this.taskToggle(id).click();
  }

  // --- Assertions ---

  async expectDashboardVisible() {
    await expect(this.dashboard).toBeVisible();
  }

  /**
   * Asserts that a task item with the given ID is visible and contains the expected title text.
   * Uses getByText() as a fallback because the <span> in TaskList.jsx:10 has no data-testid.
   * TODO (developer): add data-testid="task-title-{id}" to the <span> in TaskList.jsx.
   */
  async expectTaskVisible(id, title) {
    await expect(this.taskItem(id)).toBeVisible();
    await expect(this.taskItem(id).getByText(title)).toBeVisible();
  }

  /** Asserts that the task <li> carries the CSS class 'done' (AC-3). */
  async expectTaskDone(id) {
    await expect(this.taskItem(id)).toHaveClass(/done/);
    await expect(this.taskToggle(id)).toHaveText('Mark active');
  }

  /** Asserts that the task <li> does NOT carry the CSS class 'done' (AC-4). */
  async expectTaskActive(id) {
    await expect(this.taskItem(id)).not.toHaveClass(/done/);
    await expect(this.taskToggle(id)).toHaveText('Mark done');
  }

  /** Asserts that the task-list-empty message is shown and task-list is absent (AC-6). */
  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
    await expect(this.emptyState).toHaveText('No tasks yet - add one above.');
    await expect(this.taskList).toHaveCount(0);
  }

  /** Asserts that the task list is rendered and the empty-state is absent. */
  async expectTaskList() {
    await expect(this.taskList).toBeVisible();
    await expect(this.emptyState).toHaveCount(0);
  }

  /** Asserts that a task item with the given ID is not present in the DOM. */
  async expectTaskAbsent(id) {
    await expect(this.taskItem(id)).toHaveCount(0);
  }

  /** Asserts the add-task input is empty. */
  async expectInputCleared() {
    await expect(this.addTaskInput).toHaveValue('');
  }
}

module.exports = { TaskPage };
