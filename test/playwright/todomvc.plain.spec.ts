import { expect, test } from '@playwright/test';

// The SAME scenario as todomvc.pageobject.spec.ts, written the ordinary Playwright way:
// every locator is spelled out inside the test.
test('todo flow — plain Playwright, no page object', async ({ page }) => {
  await page.goto('https://demo.playwright.dev/todomvc/#/');

  const newTodo = page.getByPlaceholder('What needs to be done?');
  for (const text of ['buy milk', 'walk dog', 'write tests']) {
    await newTodo.fill(text);
    await newTodo.press('Enter');
  }
  await expect(page.locator('[data-testid=todo-title]')).toHaveText([
    'buy milk',
    'walk dog',
    'write tests',
  ]);
  await expect(page.getByTestId('todo-count')).toHaveText('3 items left');

  await page.getByRole('checkbox', { name: 'Toggle Todo' }).nth(0).check();
  await expect(page.getByTestId('todo-count')).toHaveText('2 items left');

  await page.getByRole('link', { name: 'Active' }).click();
  await expect(page.locator('[data-testid=todo-title]')).toHaveText(['walk dog', 'write tests']);

  await page.getByRole('link', { name: 'Completed' }).click();
  await expect(page.locator('[data-testid=todo-title]')).toHaveText(['buy milk']);

  await page.getByRole('link', { name: 'All' }).click();
  await page.getByRole('button', { name: 'Clear completed' }).click();
  await expect(page.locator('[data-testid=todo-title]')).toHaveText(['walk dog', 'write tests']);
});
