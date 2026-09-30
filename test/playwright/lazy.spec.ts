import { expect, test } from '@playwright/test';
import { initPage } from '../../dist-e2e/src';
import { TodoMvcPage } from '../../dist-e2e/examples/todomvc-page';
import { TodoMvcConstructorPage } from '../../dist-e2e/examples/todomvc-constructor-page';

// Decorated fields are lazy, exactly like locators created by hand in a constructor:
// creating the page object never touches the browser; each action looks the element up fresh.

test('creating the page object makes no browser call', async ({ page }) => {
  await page.close();
  // Any DOM query against a closed page would throw. Both styles construct fine.
  const decorated = initPage(TodoMvcPage, page);
  const handWritten = new TodoMvcConstructorPage(page);
  expect(decorated.newTodoInput).toBeDefined();
  expect(handWritten.newTodoInput).toBeDefined();
  // The first real action is where the browser is contacted, so that is where it fails.
  await expect(decorated.newTodoInput.fill('x')).rejects.toThrow(/closed/);
});

test('page object can be created before the elements exist', async ({ page }) => {
  const todoPage = initPage(TodoMvcPage, page); // page is still about:blank
  await page.setContent(`
    <input placeholder="What needs to be done?">
    <span data-testid="todo-count">0 items left</span>`);
  await todoPage.newTodoInput.fill('found after init');
  await expect(todoPage.newTodoInput).toHaveValue('found after init');
  await expect(todoPage.todoCount).toHaveText('0 items left');
});

test('each use re-queries the DOM, so re-rendered elements are found', async ({ page }) => {
  await page.setContent(`<span data-testid="todo-count">1 item left</span>`);
  const todoPage = initPage(TodoMvcPage, page);
  await expect(todoPage.todoCount).toHaveText('1 item left');
  // Replace the element with a brand-new node; the same field still works.
  await page.setContent(`<span data-testid="todo-count">5 items left</span>`);
  await expect(todoPage.todoCount).toHaveText('5 items left');
});
