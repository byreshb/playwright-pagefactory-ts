# Syllabus: from zero to understanding this library

Each step says what to read or run, and what you should understand afterward.

## Map of the code

The whole library is six short files under `src/`. Read them in this order:

| # | File | What it does |
|---|------|--------------|
| 1 | `examples/todomvc-page.ts` | **User-facing.** A page object for the TodoMVC demo. Start here to see how the library is *used*. |
| 2 | `src/index.ts` | The public API: everything a user can import. |
| 3 | `src/constants.ts` | The two metadata keys (string names for the notes we store). |
| 4 | `src/decorators/FindBy.ts` | `@FindBy` (writes the note), `getFindByEntries` (reads notes back), and the shorthands `@Css`, `@Role`, `@TestId`, ... |
| 5 | `src/locators/By.ts` | `LocatorSpec` (the shape of a note), `By.*` builders, `validateSpec`, and `resolveLocator` (spec → real Playwright `Locator`). |
| 6 | `src/initPage.ts` | `initPage(Class, page)`: create instance, read notes, resolve each, assign. |
| 7 | `src/decorators/PageObject.ts` | `@PageObject()`: marks a class as a page object. Currently just a marker. |

Everything starting with `@` in `examples/` is a decorator (TypeScript's word for what Java calls
an annotation). The decorators are *defined* in `src/decorators/`.

## Step 1 — Plain Playwright (no library involved)
Read `test/playwright/todomvc.plain.spec.ts`.
You should see that a test finds elements with `page.getByRole(...)`, `page.getByTestId(...)`,
etc., then acts on them (`fill`, `press`, `check`, `click`) and asserts with `expect`.
All of that is Playwright. Nothing here is ours.

## Step 2 — The problem page objects solve
In the plain spec, `page.getByRole('link', { name: 'Active' })` and similar locators are written
inline. In a real suite the same locators get repeated across many tests. A **page object** is a
class that holds them once, plus helper methods (like `addTodo`).

## Step 3 — The page object, written with this library
Read `examples/todomvc-page.ts`. Each field has a decorator (`@Role(...)`, `@TestId(...)`) directly
above it saying how to find that element. There is no constructor. You should understand: "the
decorator says *how to find it*; the field is *where the result goes*."

## Step 4 — Using it in a test
Read `test/playwright/todomvc.pageobject.spec.ts`. The key line:

```ts
const todoPage = initPage(TodoMvcPage, page);
```

After that, `todoPage.activeFilter` is a normal Playwright `Locator`. Compare the two specs:
same scenario, same assertions, only where the locators come from differs.

## Step 5 — What a decorator is (background)
A decorator is a function that runs once, when the class is defined, and is handed information
about the thing it decorates (here: the class and the field name). It's the same feature NestJS
uses for `@Injectable()`, `@Get()`, etc. It does **not** run each time a test runs.

Our decorators only do one thing: **write a note** ("field `activeFilter` should be found with
role=link, name=Active") into a lookup table attached to the class, using `reflect-metadata`.

## Step 6 — How the note is written
Read `src/decorators/FindBy.ts` (top half), then `src/constants.ts`. Understand: `@FindBy`
appends `{ propertyKey, locatorSpec }` to a list stored on the class under one metadata key.

## Step 7 — How shorthands work
Still in `FindBy.ts`, bottom half. `@Role(...)`, `@TestId(...)`, `@Css(...)` just build a
locator spec object and pass it to `@FindBy`. So `@Css('#x')` ≡ `@FindBy({ css: '#x' })`.

## Step 8 — How the note is turned into a Locator
Read `src/initPage.ts`, then `resolveLocator` in `src/locators/By.ts`. Understand:
`initPage` makes an instance, reads the list back, and for each entry calls the matching Playwright
method (`page.getByRole`, `page.locator`, ...), assigning the result to the field.

## Step 9 — Why the test step needs `tsc` first
Playwright's own test runner can't compile the older ("legacy"/experimental) decorator syntax that
NestJS-style decorators use. So `npm test` first compiles `src/` and `examples/` to plain
JavaScript in `dist-e2e/`, and the spec imports from there. Details in
[`dependencies.md`](dependencies.md).

## Step 10 — Constructors, decorators, or both
Read [`constructor-vs-decorators.md`](constructor-vs-decorators.md) and
`examples/todomvc-constructor-page.ts` / `examples/todomvc-mixed-page.ts`.

## Step 11 — Laziness
Read `test/playwright/lazy.spec.ts`. Creating a page object never touches the browser; elements
are looked up on each action, exactly like hand-written locators.

## Step 12 — The mechanics in depth
Read [`how-the-factory-works.md`](how-the-factory-works.md).

## Step 13 — Why it's designed this way
Read [`design.md`](design.md): decorator generations, and the comparisons with the Java sibling
and NestJS.

## Things that look odd in the code
- `newTodoInput!: Locator;` — the `!` tells TypeScript "this will be assigned later (by
  `initPage`), don't complain it's uninitialized."
- `Reflect.defineMetadata` / `Reflect.getMetadata` — provided by the `reflect-metadata` package,
  which attaches key/value data to a class. Imported once in `src/index.ts`.
- `target.constructor` — for a property decorator, `target` is the class's prototype; its
  `.constructor` is the class itself, which is where we store the notes.
- The specs import from `dist-e2e/`, not `src/` — see Step 9 above.
