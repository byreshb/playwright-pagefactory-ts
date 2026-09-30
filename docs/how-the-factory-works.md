# How the page object factory works

This is the actual logic, from the `@` line on a field to a working `Locator`.

## The approach in one paragraph
A decorator **doesn't create anything**. When the class is defined, each decorator only
*records a note* about a field ("`activeFilter` = role link named Active") on the class itself.
Later, `initPage(Class, page)` builds an instance, reads those notes, and for each one calls the
matching Playwright method and assigns the result to the field. This is the same shape as
NestJS (decorators record metadata; a container reads it later) and as the Java sibling
(`@FindBy` records; `PageFactory.initElements` reads).

## Phase 1: class definition (runs once, when the file loads)

```ts
class TodoMvcPage {
  @Role('link', { name: 'Active' })
  activeFilter!: Locator;
}
```

TypeScript compiles this into roughly:

```js
__decorate([ Role('link', { name: 'Active' }) ], TodoMvcPage.prototype, 'activeFilter');
```

Step by step:

1. `Role('link', { name: 'Active' })` runs first. It is a *factory* (`createFindByDecorator` in
   `src/decorators/FindBy.ts`) that builds the spec `{ role: 'link', name: 'Active' }` and returns
   `FindBy(spec)`.
2. `FindBy(spec)` calls `validateSpec(spec)` immediately, so a bad spec (zero or two strategies,
   like `{ css: 'a', xpath: 'b' }`) fails when the class loads, not mid-test. It then returns the
   actual property decorator.
3. TypeScript calls that decorator with `(target, propertyKey)`. For a property, `target` is the
   class's prototype and `propertyKey` is `'activeFilter'`.
4. The decorator reads the current list from `target.constructor` (the class) with
   `Reflect.getMetadata(FIND_BY_METADATA, ...)`, adds `{ propertyKey, locatorSpec }`, and writes it
   back with `Reflect.defineMetadata`.

After all fields are decorated, the class carries a list like:

```
[ { propertyKey: 'newTodoInput', locatorSpec: { placeholder: 'What needs to be done?' } },
  { propertyKey: 'todoCount',    locatorSpec: { testId: 'todo-count' } },
  { propertyKey: 'activeFilter', locatorSpec: { role: 'link', name: 'Active' } } ]
```

Nothing has touched a browser yet. Nothing is a `Locator` yet.

`@PageObject()` (a class decorator) writes one more note: a boolean marker under
`PAGE_OBJECT_WATERMARK`. Right now nothing reads it; it exists for future class-level options,
mirroring Nest's `@Injectable()`.

## Phase 2: `initPage(TodoMvcPage, page)` (runs per test)

`src/initPage.ts`:

```ts
const instance = new PageClass(page);                       // 1
for (const { propertyKey, locatorSpec } of getFindByEntries(PageClass)) {   // 2
  instance[propertyKey] = resolveLocator(page, locatorSpec);                // 3
}
return instance;
```

1. **Construct.** `new PageClass(page)`. If the class has a constructor, it runs now (see
   `constructor-vs-decorators.md`). If not, `page` is ignored.
2. **Read the notes.** `getFindByEntries` returns the recorded list. Because
   `Reflect.getMetadata` walks the prototype chain, a subclass also sees its parent's entries.
   If a field is redeclared, the list is de-duplicated by field name and the **last** entry wins,
   so a subclass can override a parent's locator.
3. **Resolve and assign.** `resolveLocator` (`src/locators/By.ts`) looks at which key the spec
   has and calls the matching Playwright method:

| Spec | Playwright call |
|------|-----------------|
| `{ css }` | `page.locator(css)` |
| `{ xpath }` | `page.locator('xpath=' + xpath)` |
| `{ id }` | `page.locator('[id="..."]')` |
| `{ testId }` | `page.getByTestId(...)` |
| `{ text, exact? }` | `page.getByText(...)` |
| `{ label, exact? }` | `page.getByLabel(...)` |
| `{ placeholder, exact? }` | `page.getByPlaceholder(...)` |
| `{ altText, exact? }` | `page.getByAltText(...)` |
| `{ title, exact? }` | `page.getByTitle(...)` |
| `{ role, name?, exact? }` | `page.getByRole(role, { name, exact })` |

The result is stored on the instance. From here on, `todoPage.activeFilter` is an ordinary
Playwright `Locator`, and Playwright's own laziness applies: the element isn't searched for
until you act on or assert against it.

Each `initPage` call creates fresh locators bound to that test's `page`, so page objects are
never shared between tests. The stored notes belong to the *class*, not the instance, and are
only data (no `page` inside them), which is why one class can be initialized for many pages.

## Design decisions and why
- **Notes on the class, resolution at init.** Decorators run at class-definition time, when there
  is no `page` yet, so they can only describe; `initPage` is where a `page` exists.
- **Specs are plain objects (`LocatorSpec`).** Easy to validate, compare, and test, and the `By.*`
  builders and shorthand decorators all reduce to the same shape.
- **One list under one key, stored on `target.constructor`.** Copied from how Nest's property
  `@Inject()` stores `{ key, type }` entries.
- **Shorthands are a thin factory.** `createFindByDecorator` is the same trick as Nest's
  `createMappingDecorator` (`@Get`/`@Post` over `@RequestMapping`).
- **No `emitDecoratorMetadata`.** We don't read field types; the spec alone says how to find the element.
- **Validation at decoration time.** Mistakes surface when the file loads.
- **`initPage`, not `new`.** A decorator can't run code on `new`; something has to do phase 2.
  (Java has the same rule: you must call `PageFactory.initElements(page, this)`.)

## Limits (by design, for v1)
- Locators are fixed per field; dynamic ones belong in methods/getters or the constructor.
- Only Playwright's `Page` is supported, not `Frame` or nested components.
- Uses the legacy (`experimentalDecorators`) decorator generation only.
