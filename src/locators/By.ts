import type { Locator, Page } from '@playwright/test';

type Role = Parameters<Page['getByRole']>[0];

/** Declarative description of how to find an element. Resolved lazily by `resolveLocator`. */
export type LocatorSpec =
  | { css: string }
  | { xpath: string }
  | { id: string }
  | { testId: string }
  | { text: string; exact?: boolean }
  | { label: string; exact?: boolean }
  | { placeholder: string; exact?: boolean }
  | { altText: string; exact?: boolean }
  | { title: string; exact?: boolean }
  | { role: Role; name?: string | RegExp; exact?: boolean };

/** Builders mirroring the Java project's `By` vocabulary. Each returns a plain `LocatorSpec`. */
export const By = {
  css: (css: string): LocatorSpec => ({ css }),
  xpath: (xpath: string): LocatorSpec => ({ xpath }),
  id: (id: string): LocatorSpec => ({ id }),
  testId: (testId: string): LocatorSpec => ({ testId }),
  text: (text: string, exact?: boolean): LocatorSpec => ({ text, exact }),
  label: (label: string, exact?: boolean): LocatorSpec => ({ label, exact }),
  placeholder: (placeholder: string, exact?: boolean): LocatorSpec => ({ placeholder, exact }),
  altText: (altText: string, exact?: boolean): LocatorSpec => ({ altText, exact }),
  title: (title: string, exact?: boolean): LocatorSpec => ({ title, exact }),
  role: (role: Role, options: { name?: string | RegExp; exact?: boolean } = {}): LocatorSpec => ({
    role,
    ...options,
  }),
};

const STRATEGY_KEYS = [
  'css',
  'xpath',
  'id',
  'testId',
  'text',
  'label',
  'placeholder',
  'altText',
  'title',
  'role',
] as const;

/** Throws unless the spec names exactly one locator strategy. Called at decoration time. */
export function validateSpec(spec: LocatorSpec): void {
  const used = STRATEGY_KEYS.filter((k) => (spec as Record<string, unknown>)[k] !== undefined);
  if (used.length !== 1) {
    throw new Error(
      `@FindBy requires exactly one locator strategy (${STRATEGY_KEYS.join(', ')}); got ${
        used.length === 0 ? 'none' : used.join(', ')
      }`,
    );
  }
}

/** Turn a spec into a real Playwright Locator against `page`. */
export function resolveLocator(page: Page, spec: LocatorSpec): Locator {
  const s = spec as Record<string, any>;
  if (s.css !== undefined) return page.locator(s.css);
  if (s.xpath !== undefined) return page.locator(`xpath=${s.xpath}`);
  if (s.id !== undefined) return page.locator(`[id="${String(s.id).replace(/"/g, '\\"')}"]`);
  if (s.testId !== undefined) return page.getByTestId(s.testId);
  if (s.text !== undefined) return page.getByText(s.text, { exact: s.exact });
  if (s.label !== undefined) return page.getByLabel(s.label, { exact: s.exact });
  if (s.placeholder !== undefined) return page.getByPlaceholder(s.placeholder, { exact: s.exact });
  if (s.altText !== undefined) return page.getByAltText(s.altText, { exact: s.exact });
  if (s.title !== undefined) return page.getByTitle(s.title, { exact: s.exact });
  if (s.role !== undefined) return page.getByRole(s.role, { name: s.name, exact: s.exact });
  throw new Error('Unrecognized locator spec');
}
