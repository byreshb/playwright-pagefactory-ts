# Page objects: constructor, decorators, or both

The decorators are **one way** to write a page object, not the only way. They are optional
sugar over ordinary Playwright. You can use plain constructors, decorators, or mix them in one
class. All three produce the same thing: fields holding real Playwright `Locator`s, which are
lazy in every style (no browser call until an action; see
[`how-the-factory-works.md`](how-the-factory-works.md#lazy-by-design)).

## 1. Constructor style (no library at all)
`examples/todomvc-constructor-page.ts`

```ts
export class TodoMvcConstructorPage {
  readonly todoCount: Locator;
  readonly activeFilter: Locator;

  constructor(page: Page) {
    this.todoCount = page.getByTestId('todo-count');
    this.activeFilter = page.getByRole('link', { name: 'Active' });
  }
}

const todoPage = new TodoMvcConstructorPage(page);
```

- Locators are assigned by hand in the constructor.
- Full power of TypeScript: loops, conditionals, chaining, computed selectors.
- Cost: every field is declared once and assigned once, and they must be kept in sync.

## 2. Decorator style (this library)
`examples/todomvc-page.ts`

```ts
@PageObject()
export class TodoMvcPage {
  @TestId('todo-count')
  todoCount!: Locator;

  @Role('link', { name: 'Active' })
  activeFilter!: Locator;
}

const todoPage = initPage(TodoMvcPage, page);
```

- Each locator is declared right next to its field. No constructor needed.
- Best for simple, static locators (which is most of them).
- You create it with `initPage(Class, page)`, not `new`.

## 3. Mixed: both in one class
`examples/todomvc-mixed-page.ts`

```ts
@PageObject()
export class TodoMvcMixedPage {
  @Placeholder('What needs to be done?')   // decorator
  newTodoInput!: Locator;

  @TestId('todo-count')                    // decorator
  todoCount!: Locator;

  readonly page: Page;                     // constructor
  readonly firstTodoToggle: Locator;       // constructor

  constructor(page: Page) {
    this.page = page;
    this.firstTodoToggle = page.getByRole('listitem').first()
      .getByRole('checkbox', { name: 'Toggle Todo' });
  }
}

const todoPage = initPage(TodoMvcMixedPage, page);
```

`initPage` does, in this order:
1. `new TodoMvcMixedPage(page)` — the constructor runs and sets `page` and `firstTodoToggle`.
2. Fills every *decorated* field.

So the two halves live side by side. `test/playwright/todomvc.styles.spec.ts` runs both the
constructor-only and the mixed classes against the real demo site.

## When to use which
| Situation | Suggested style |
|-----------|-----------------|
| A plain locator: id, css, role, test id, text | Decorator |
| Chained/filtered locators, e.g. `page.getByRole('listitem').first().getByRole(...)` | Constructor (or a getter) |
| Need to keep `page` for `goto`, waits, keyboard | Constructor: `this.page = page` |
| Locator depends on runtime data | Method or getter: `row(name) { return this.page.getByRole('row', { name }); }` |
| Team doesn't want decorators / experimental TS flag | Constructor style, no library needed |
| Page object extends a base class | Either; decorated fields are inherited (redeclaring a field in a subclass overrides it) |

## Rules to remember
- **`initPage`, not `new`, for any class with decorators.** `new` alone leaves decorated fields `undefined`.
- **A class can have no constructor** (decorator-only), **or one taking `(page)`**. `initPage` always passes `page` to it.
- **If a field is both decorated and assigned in the constructor, the decorator wins**, because it is assigned afterward. Don't do both for the same field.
- **Class field initializers** (`foo = 1`) also run before `initPage` assigns decorated fields, so decorators win there too.
- The Java sibling skips `final` fields so constructor-assigned ones aren't overwritten. TypeScript has no equivalent check at runtime, so the rule above is "don't decorate what you assign by hand."
