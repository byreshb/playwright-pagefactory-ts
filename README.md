# playwright-pagefactory-ts

Decorator-based Page Objects for Playwright in TypeScript. Declare how to find each element right
above its field, and `initPage` turns every field into a real Playwright `Locator`.

It is the TypeScript sibling of the Java library
[`playwright-pagefactory`](https://github.com/byreshb/playwright-pagefactory) (`@FindBy` plus
`PageFactory.initElements`), and its decorators follow the conventions NestJS uses.

Current version: **0.1.0**, the first cut. The API may still change before 1.0 (see
[`docs/releasing.md`](docs/releasing.md#versioning)).

## Install

```bash
npm install github:byreshb/playwright-pagefactory-ts#v0.1.0 @playwright/test
```

The package builds itself on install. Your `tsconfig.json` needs
`"experimentalDecorators": true`.

## Quick start

```ts
import type { Locator } from '@playwright/test';
import { PageObject, Placeholder, Role, TestId, initPage } from 'playwright-pagefactory-ts';

@PageObject()
export class TodoMvcPage {
  @Placeholder('What needs to be done?')
  newTodoInput!: Locator;

  @TestId('todo-count')
  todoCount!: Locator;

  @Role('link', { name: 'Active' })
  activeFilter!: Locator;

  async addTodo(text: string) {
    await this.newTodoInput.fill(text);
    await this.newTodoInput.press('Enter');
  }
}

// in a test
const todoPage = initPage(TodoMvcPage, page);
await todoPage.addTodo('buy milk');
await expect(todoPage.todoCount).toHaveText('1 item left');
```

The same page object without the library would assign each locator by hand in a constructor.
Both produce the same `Locator`s; the decorator just keeps the locator next to its field.

## Decorators

| Decorator | Resolves to |
|-----------|-------------|
| `@Css('#id .cls')` | `page.locator(css)` |
| `@XPath('//button')` | `page.locator('xpath=...')` |
| `@Id('username')` | `page.locator('[id="username"]')` |
| `@TestId('status')` | `page.getByTestId(...)` |
| `@Role('button', { name, exact })` | `page.getByRole(...)` |
| `@Text(text, exact?)` | `page.getByText(...)` |
| `@Label(text, exact?)` | `page.getByLabel(...)` |
| `@Placeholder(text, exact?)` | `page.getByPlaceholder(...)` |
| `@AltText(text, exact?)` | `page.getByAltText(...)` |
| `@Title(text, exact?)` | `page.getByTitle(...)` |
| `@FindBy({ css: '...' })` | the general form; every shorthand above is `@FindBy` with one key |

`@PageObject()` marks the class. A spec with zero or two strategies throws as soon as the class
loads, not in the middle of a test.

## Lazy, like hand-written locators

`initPage` never touches the browser. Like `page.locator(...)` in a constructor, each field is only
a description; Playwright looks the element up when you act on it (`fill`, `click`, `expect`), and
again on every action. So you can create the page object before navigating, and fields keep
working after the page re-renders. `test/playwright/lazy.spec.ts` proves this, including building a
page object on a closed page. Details in
[`docs/how-the-factory-works.md`](docs/how-the-factory-works.md#lazy-by-design).

## Mixing with constructors

Decorators are optional. A class can use decorators, a constructor, or both: `initPage` passes
`page` to the constructor, then fills the decorated fields. See
[`docs/constructor-vs-decorators.md`](docs/constructor-vs-decorators.md).

## Using it with `playwright test`

Playwright's test runner compiles TypeScript with the newer decorator standard, so it can't load
files that use these (legacy) decorators directly. Compile your page objects with `tsc` first and
import the output in your specs. This repo does exactly that: `npm test` runs
`tsc -p tsconfig.e2e.json` and then `playwright test`. See
[`docs/dependencies.md`](docs/dependencies.md#why-npm-test-is-tsc-then-playwright-test).

## Documentation

Start with [`docs/README.md`](docs/README.md). It has a learning path, a map of the code, how the
factory works, the design notes (including the Java and NestJS comparisons), and how releases are
made.

## Development

```bash
npm install
npx playwright install chromium
npm run typecheck
npm test          # compiles, then runs the Playwright specs (needs internet for the TodoMVC demo)
npm run build     # library output in dist/
```

Changes are listed in [`CHANGELOG.md`](CHANGELOG.md).

## License

[MIT](LICENSE)
