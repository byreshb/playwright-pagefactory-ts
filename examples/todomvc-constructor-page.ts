import type { Locator, Page } from '@playwright/test';

/**
 * The same TodoMVC page object written the classic way: no decorators, no library.
 * Every locator is assigned by hand in the constructor.
 */
export class TodoMvcConstructorPage {
  readonly newTodoInput: Locator;
  readonly todoTitles: Locator;
  readonly todoToggles: Locator;
  readonly todoCount: Locator;
  readonly activeFilter: Locator;
  readonly completedFilter: Locator;

  constructor(page: Page) {
    this.newTodoInput = page.getByPlaceholder('What needs to be done?');
    this.todoTitles = page.locator('[data-testid=todo-title]');
    this.todoToggles = page.getByRole('checkbox', { name: 'Toggle Todo' });
    this.todoCount = page.getByTestId('todo-count');
    this.activeFilter = page.getByRole('link', { name: 'Active' });
    this.completedFilter = page.getByRole('link', { name: 'Completed' });
  }

  async addTodo(text: string) {
    await this.newTodoInput.fill(text);
    await this.newTodoInput.press('Enter');
  }

  async toggleTodo(index: number) {
    await this.todoToggles.nth(index).check();
  }
}
