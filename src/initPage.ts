import 'reflect-metadata';
import type { Page } from '@playwright/test';
import { getFindByEntries } from './decorators/FindBy';
import { resolveLocator } from './locators/By';

/**
 * TypeScript analogue of Java's `PageFactory.initElements`: instantiates `PageClass` (passing
 * `page` to its constructor, if it takes one), then assigns a resolved Locator to every
 * `@FindBy`-decorated field. Fields the constructor set up by hand are left alone unless they
 * are also decorated.
 */
export function initPage<T extends object>(PageClass: new (page: Page) => T, page: Page): T {
  const instance = new PageClass(page);
  for (const { propertyKey, locatorSpec } of getFindByEntries(PageClass)) {
    (instance as any)[propertyKey] = resolveLocator(page, locatorSpec);
  }
  return instance;
}
