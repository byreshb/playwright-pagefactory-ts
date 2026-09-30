import type { Locator, Page } from '@playwright/test';
import { PageObject, Placeholder, Role, TestId } from '../src';

/**
 * Both styles in one class. `initPage(TodoMvcMixedPage, page)` passes `page` to the constructor
 * first, then fills the decorated fields.
 */
@PageObject()
export class TodoMvcMixedPage {
  // Decorator style: simple, static locators.
  @Placeholder('What needs to be done?')
  newTodoInput!: Locator;

  @TestId('todo-count')
  todoCount!: Locator;

  @Role('link', { name: 'Active' })
  activeFilter!: Locator;

  // Constructor style: anything a decorator can't express, e.g. keeping `page` around
  // or building a locator by chaining.
  readonly page: Page;
  readonly firstTodoToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstTodoToggle = page
      .getByRole('listitem')
      .first()
      .getByRole('checkbox', { name: 'Toggle Todo' });
  }

  async addTodo(text: string) {
    await this.newTodoInput.fill(text);
    await this.newTodoInput.press('Enter');
  }
}
