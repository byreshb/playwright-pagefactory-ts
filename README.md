# playwright-pagefactory-ts

A decorator-based Page Object / Page Factory library for Playwright, written in TypeScript.

Conceptually the TypeScript sibling of [`playwright-pagefactory`](../playwright-pagefactory)
(the Java/Selenium-style `@FindBy` port for Playwright Java) — same idea, native to the
TypeScript ecosystem's own idiom: decorators, the way NestJS, Angular, and TypeORM do it.

**Status: design/spec only.** Nothing in this repo runs yet. This README is the brief for
whoever (human or agent) implements it next.

## Naming

Went with `playwright-pagefactory-ts` over something invented (e.g. "Ajapa") so it's
immediately recognizable as the TypeScript counterpart to the existing Java project, and
so it turns up in search/npm next to it. Happy to rename before first publish if you'd
rather have something more distinctive — it's cheap to change now, expensive later.

## Goal

Let a Playwright/TypeScript test author write:

```typescript
import { PageObject, FindBy, initPage } from 'playwright-pagefactory-ts';
import type { Locator, Page } from '@playwright/test';

@PageObject()
class LoginPage {
  @FindBy({ css: '#username' })
  usernameInput!: Locator;

  @FindBy({ css: '#password' })
  passwordInput!: Locator;

  @FindBy({ role: 'button', name: 'Sign in' })
  submitButton!: Locator;

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

// somewhere in a test
const loginPage = initPage(LoginPage, page);
await loginPage.login('alice', 'hunter2');
```

instead of the boilerplate version:

```typescript
class LoginPage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

Both end up doing the same thing. The decorator version just moves "which locator goes
with which field" out of a constructor body and next to the field declaration, the same
trade NestJS makes for "which service goes with which constructor param."

## Why decorators — and how NestJS / Angular / TypeORM actually do it

TypeScript decorators come in two generations. Knowing which one each framework uses (and
why) is the main design decision for this library.

### The legacy generation (what's in production today)

- Available since TS 1.5 (2015), behind `"experimentalDecorators": true` in `tsconfig.json`.
- Implements an early TC39 proposal that was never finalized in that form — "experimental"
  is a label about spec status, not about stability. TypeScript has kept this
  implementation frozen and working for ~10 years for backward compatibility.
- Decorators are pure compile-time sugar: `@Injectable()` compiles down to a plain
  `__decorate(...)` helper call before anything runs. No runtime "experimental" behavior,
  no special Node.js flag.
- Paired with the `reflect-metadata` polyfill and `"emitDecoratorMetadata": true`, which
  lets the compiler emit each constructor parameter's type as metadata the framework can
  read back at runtime.

**Angular** was the first mainstream framework to build on this (`@Component`,
`@Injectable`, `@Input`, ...), using `reflect-metadata` to drive its dependency injector.

**NestJS** copied Angular's approach on the server side almost exactly: `@Controller()`,
`@Injectable()`, `@Get()`, `@Param()`, etc. all rely on `emitDecoratorMetadata` +
`reflect-metadata` so Nest's DI container knows what to construct and inject purely from
constructor parameter types, without you writing a factory by hand.

**TypeORM** uses the identical mechanism for a different purpose: `@Entity()`,
`@Column()`, `@OneToMany()` attach schema metadata to a class and its properties, which
the ORM reads at runtime to generate SQL and hydrate query results.

All three frameworks use the *same* legacy decorator + `reflect-metadata` combo. That's
the pattern this library should copy — it's the most battle-tested option, and reusing it
means anyone who already knows Nest/Angular/TypeORM decorators will recognize the shape
immediately.

### The new (standardized) generation

TC39 eventually finalized a *different* decorators proposal, which reached Stage 3 and
shipped in TypeScript 5.0 as "standard" decorators — no `experimentalDecorators` flag
needed, and eventually usable without TypeScript at all once JS engines implement it
natively.

The catch: the new spec **dropped parameter decorators** and has a different, more
limited metadata story. That breaks the exact mechanism Nest/Angular/TypeORM depend on for
constructor-based DI — which is why none of them have switched their public decorator API
to it, even years after it landed in TypeScript. They still default to
`experimentalDecorators` + `reflect-metadata`.

### Upgrade path, if/when it matters

Nothing to do speculatively now — just don't paint this library into a corner:

- Keep all decorator logic behind this library's own small set of exported decorators
  (`@PageObject`, `@FindBy`, ...). Consumers never touch `reflect-metadata` or
  `Reflect.decorate` directly.
- Because `@FindBy` only needs *property*-level metadata (which locator goes on which
  field), not constructor parameter injection, it's actually less exposed to the
  legacy-vs-new split than Nest's DI is. A future migration would mostly be an internal
  implementation swap, not a breaking API change for users.
- Revisit once/if Nest or Angular themselves move their public decorator API to the new
  standard — at that point the ecosystem tooling (ts-jest, ts-node, bundlers) will have
  already sorted out the rough edges, and following suit will be low-risk.

## Does this need to be *faster* than plain constructors?

No — and it won't be, meaningfully, in either direction. Decorators compile down to a
handful of extra function calls executed once per class definition (not per test, not per
page-object instantiation in a hot loop). That's noise next to the cost of an actual
Playwright action (`click`, `fill`, navigation), which is milliseconds of browser IPC.

The point of `@FindBy` isn't speed — it's:
- less boilerplate (no constructor body listing every locator),
- the locator declaration lives next to the field it initializes, so page objects are
  easier to skim and diff,
- consistent with the Java sibling project's `@FindBy` API, so a team using both feels at
  home in either language.

If a benchmark ever matters, it should ship as an actual `bench/` script with numbers —
not as a claim in this README.

## Proposed shape of the library

```
playwright-pagefactory-ts/
├── src/
│   ├── decorators/
│   │   ├── PageObject.ts      # @PageObject() — marks a class as a page object
│   │   └── FindBy.ts          # @FindBy(locator) — attaches a locator strategy to a field
│   ├── locators/
│   │   └── By.ts              # css/xpath/role/text/testId locator builders (mirrors Java's `By`)
│   ├── initPage.ts            # initPage(PageClass, page) — resolves decorated fields into Locators
│   └── index.ts                # public exports
├── examples/
│   └── login-page.ts           # the LoginPage example above, runnable against a real page
├── test/
│   └── ...                     # unit tests for the decorator/metadata machinery
├── package.json
├── tsconfig.json
└── README.md
```

`initPage` is the TypeScript analogue of Selenium/Java's `PageFactory.initElements` — it
walks the class's decorator metadata and assigns a resolved `Locator` to each decorated
field.

## Suggested tooling

- **Package manager**: npm (matches most Playwright starter repos; swap for pnpm if
  preferred, no strong reason either way).
- **TypeScript config**: `"experimentalDecorators": true`, `"emitDecoratorMetadata": true`,
  target ES2020+.
- **Metadata**: `reflect-metadata`, imported once at the library's entry point.
- **Test runner**: `@playwright/test` for anything exercising a real page; `vitest` (or
  plain `node --test`) for pure decorator/metadata unit tests that don't need a browser.
- **Lint/format**: ESLint + Prettier, matching whatever defaults the other sibling
  Node/TS repos in `../` already use, for consistency.

## Suggested build order

1. Scaffold `package.json` + `tsconfig.json` with the flags above.
2. Implement `@FindBy` storing `{ propertyKey, locatorSpec }` via `Reflect.defineMetadata`
   on the class.
3. Implement `@PageObject()` (can start as a no-op marker decorator; only needed if/when
   class-level metadata is required later).
4. Implement `initPage(PageClass, page)`:
   - instantiate `new PageClass()`,
   - read back the metadata written by `@FindBy`,
   - resolve each locator spec against `page` (`page.locator(...)`, `page.getByRole(...)`,
     etc.),
   - assign each resolved `Locator` onto the instance.
5. Add `By`-style locator builders so `@FindBy` specs stay declarative and match the Java
   project's vocabulary (`By.css`, `By.role`, `By.testId`, ...).
6. Write the `examples/login-page.ts` example end-to-end against a real (or mock) page.
7. Unit-test the metadata plumbing directly (no browser needed) plus one Playwright-driven
   integration test using the example.
8. Only then: consider publishing to npm, README polish, CI.

## Non-goals for v1

- No attempt to abstract over frameworks other than Playwright.
- No attempt to support both decorator generations simultaneously — pick legacy
  decorators + `reflect-metadata` and move on; see "Upgrade path" above for why that's
  fine to defer.
- No speed claims, benchmarks, or optimization work until the API shape is settled.
