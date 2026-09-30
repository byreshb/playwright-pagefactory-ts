import type { Locator } from '@playwright/test';
import { PageObject, Css, Placeholder, Role, TestId } from '../src';

/**
 * Page object for https://demo.playwright.dev/todomvc
 *
 * Each `@...` line below says HOW to find the element; `initPage(TodoMvcPage, page)` then
 * turns every decorated field into a real Playwright Locator. No constructor needed.
 */
@PageObject()
export class TodoMvcPage {
  @Placeholder('What needs to be done?')
  newTodoInput!: Locator;

  @Css('[data-testid=todo-title]')
  todoTitles!: Locator;

  @Role('checkbox', { name: 'Toggle Todo' })
  todoToggles!: Locator;

  @TestId('todo-count')
  todoCount!: Locator;

  @Role('link', { name: 'All' })
  allFilter!: Locator;

  @Role('link', { name: 'Active' })
  activeFilter!: Locator;

  @Role('link', { name: 'Completed' })
  completedFilter!: Locator;

  @Role('button', { name: 'Clear completed' })
  clearCompletedButton!: Locator;

  async addTodo(text: string) {
    await this.newTodoInput.fill(text);
    await this.newTodoInput.press('Enter');
  }

  async toggleTodo(index: number) {
    await this.todoToggles.nth(index).check();
  }
}
