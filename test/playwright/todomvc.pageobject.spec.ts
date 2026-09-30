import { expect, test } from '@playwright/test';
import { initPage } from '../../dist-e2e/src';
import { TodoMvcPage } from '../../dist-e2e/examples/todomvc-page';

// The SAME scenario as todomvc.plain.spec.ts, but locators live in examples/todomvc-page.ts.
// (Imported from dist-e2e because Playwright's runner can't compile legacy decorators itself.)
test('todo flow — with the decorator-based page object', async ({ page }) => {
  await page.goto('https://demo.playwright.dev/todomvc/#/');
  const todoPage = initPage(TodoMvcPage, page);

  for (const text of ['buy milk', 'walk dog', 'write tests']) {
    await todoPage.addTodo(text);
  }
  await expect(todoPage.todoTitles).toHaveText(['buy milk', 'walk dog', 'write tests']);
  await expect(todoPage.todoCount).toHaveText('3 items left');

  await todoPage.toggleTodo(0);
  await expect(todoPage.todoCount).toHaveText('2 items left');

  await todoPage.activeFilter.click();
  await expect(todoPage.todoTitles).toHaveText(['walk dog', 'write tests']);

  await todoPage.completedFilter.click();
  await expect(todoPage.todoTitles).toHaveText(['buy milk']);

  await todoPage.allFilter.click();
  await todoPage.clearCompletedButton.click();
  await expect(todoPage.todoTitles).toHaveText(['walk dog', 'write tests']);
});
