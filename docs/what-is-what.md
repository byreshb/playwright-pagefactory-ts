# What we created vs. what Playwright provides

## Provided by Playwright (not our code)
- **Everything that touches the browser**: `page`, `Locator`, `page.goto`, `page.locator`,
  `page.getByRole`, `getByTestId`, `getByPlaceholder`, `getByText`, `getByLabel`, ...
- **Actions and assertions**: `fill`, `press`, `check`, `click`, `expect(...).toHaveText(...)`.
- **The test runner**: `test(...)`, fixtures like `{ page }`, `playwright test`, launching
  Chromium, parallel workers.
- **The TodoMVC demo site** (https://demo.playwright.dev/todomvc): hosted by the Playwright team
  for practice. We don't control it.

## Provided by other libraries
- **`reflect-metadata`**: lets us attach data to a class (`Reflect.defineMetadata`) and read it
  back. Same package NestJS, Angular, and TypeORM use.
- **TypeScript**: the decorator syntax (`@Something`) itself, enabled by
  `experimentalDecorators` in `tsconfig.json`.

## Created in this project
| Piece | Where | Purpose |
|-------|-------|---------|
| `@FindBy(spec)` | `src/decorators/FindBy.ts` | Record "this field is found with this strategy". |
| `@Css`, `@XPath`, `@Id`, `@TestId`, `@Text`, `@Label`, `@Placeholder`, `@AltText`, `@Title`, `@Role` | `src/decorators/FindBy.ts` | Shorthands over `@FindBy`. |
| `@PageObject()` | `src/decorators/PageObject.ts` | Marker for page-object classes. |
| `By.*`, `LocatorSpec`, `resolveLocator` | `src/locators/By.ts` | Describe a locator declaratively and turn it into a real Playwright `Locator`. |
| `initPage(Class, page)` | `src/initPage.ts` | Build a page object and fill its decorated fields. |
| `TodoMvcPage`, `TodoMvcConstructorPage`, `TodoMvcMixedPage` | `examples/` | The same page object written with decorators, with a plain constructor, and with both. |
| Playwright specs | `test/playwright/` | The same TodoMVC scenario in every style, plus the laziness checks. |

Important: **this library never replaces Playwright.** It only decides *which Playwright call to
make for each field*. Every value a user ends up with is a genuine Playwright `Locator`.

## Borrowed ideas (design, not code)
- **NestJS**: the decorator conventions (metadata stored on `target.constructor`, shorthands built
  from a factory, namespaced metadata keys). Checked against `@nestjs/common` v12.1.1. No Nest
  code is copied or depended on. Full mapping in [`design.md`](design.md).
- **The Java sibling** (`../playwright-pagefactory`): the overall `@FindBy` + `initElements` idea,
  ported as `@FindBy` + `initPage`.
