# Syllabus: from zero to understanding this library

Each step says what to read or run, and what you should understand afterward.

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
Read `src/initPage.ts` (16 lines), then `resolveLocator` in `src/locators/By.ts`. Understand:
`initPage` makes an instance, reads the list back, and for each entry calls the matching Playwright
method (`page.getByRole`, `page.locator`, ...), assigning the result to the field.

## Step 9 — Why the test step needs `tsc` first
Playwright's own test runner can't compile the older ("legacy"/experimental) decorator syntax that
NestJS-style decorators use. So `npm test` first compiles `src/` and `examples/` to plain
JavaScript in `dist-e2e/`, and the spec imports from there. Details in
[`what-is-what.md`](what-is-what.md).

## Step 10 — Constructors, decorators, or both
Read [`constructor-vs-decorators.md`](constructor-vs-decorators.md) and
`examples/todomvc-constructor-page.ts` / `examples/todomvc-mixed-page.ts`.

## Step 11 — The design in depth
Read [`how-the-factory-works.md`](how-the-factory-works.md).

## Step 12 — Compare with NestJS and the Java sibling
See the two comparison sections in the top-level `README.md`.
