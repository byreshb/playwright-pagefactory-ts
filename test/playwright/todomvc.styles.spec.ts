import { expect, test } from '@playwright/test';
import { initPage } from '../../dist-e2e/src';
import { TodoMvcConstructorPage } from '../../dist-e2e/examples/todomvc-constructor-page';
import { TodoMvcMixedPage } from '../../dist-e2e/examples/todomvc-mixed-page';

const URL = 'https://demo.playwright.dev/todomvc/#/';

test('constructor-style page object (no library)', async ({ page }) => {
  await page.goto(URL);
  const todoPage = new TodoMvcConstructorPage(page);
  await todoPage.addTodo('buy milk');
  await todoPage.addTodo('walk dog');
  await todoPage.toggleTodo(0);
  await expect(todoPage.todoCount).toHaveText('1 item left');
  await todoPage.activeFilter.click();
  await expect(todoPage.todoTitles).toHaveText(['walk dog']);
});

test('mixed page object: decorators + constructor in one class', async ({ page }) => {
  await page.goto(URL);
  const todoPage = initPage(TodoMvcMixedPage, page);
  await todoPage.addTodo('buy milk');
  await todoPage.addTodo('walk dog');
  await todoPage.firstTodoToggle.check(); // built in the constructor
  await expect(todoPage.todoCount).toHaveText('1 item left'); // built by a decorator
  await todoPage.activeFilter.click(); // built by a decorator
  await expect(page.getByTestId('todo-title')).toHaveText(['walk dog']);
  expect(todoPage.page).toBe(page);
});
