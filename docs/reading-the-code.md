# Reading the code

Read the files in this order. Each is short.

| # | File | Lines | What it does |
|---|------|-------|--------------|
| 1 | `examples/todomvc-page.ts` | 44 | **User-facing.** A page object for the TodoMVC demo. Start here to see how the library is *used*. |
| 2 | `src/index.ts` | 19 | The public API: everything a user can import. |
| 3 | `src/constants.ts` | 3 | The two metadata keys (string names for the notes we store). |
| 4 | `src/decorators/FindBy.ts` | 61 | `@FindBy` (writes the note), `getFindByEntries` (reads notes back), and the shorthands `@Css`, `@Role`, `@TestId`, ... |
| 5 | `src/locators/By.ts` | 74 | `LocatorSpec` (the shape of a note), `By.*` builders, `validateSpec`, and `resolveLocator` (spec → real Playwright `Locator`). |
| 6 | `src/initPage.ts` | 18 | `initPage(Class, page)`: create instance, read notes, resolve each, assign. |
| 7 | `src/decorators/PageObject.ts` | 9 | `@PageObject()`: marks a class as a page object. Currently just a marker. |

## The two phases (the core idea)

```
 PHASE 1: class definition (once)         PHASE 2: initPage(...) (per test)
 ─────────────────────────────────        ─────────────────────────────────
 @Role('link', {name:'Active'})           new TodoMvcPage()
 activeFilter!: Locator;                  read list of notes for the class
        │                                 for each note:
        ▼                                   page.getByRole('link',{name:'Active'})
 store on the class:                        └─▶ assign to instance.activeFilter
 { propertyKey: 'activeFilter',
   locatorSpec: {role:'link', name:'Active'} }
```

## Where is "the annotation"?
Everything starting with `@` in `examples/todomvc-page.ts` is a decorator (TypeScript's word for
what Java calls an annotation). They are *defined* in `src/decorators/FindBy.ts` and
`src/decorators/PageObject.ts`.

## Things that look odd
- `newTodoInput!: Locator;` — the `!` tells TypeScript "this will be assigned later (by
  `initPage`), don't complain it's uninitialized."
- `Reflect.defineMetadata` / `Reflect.getMetadata` — provided by the `reflect-metadata` package,
  which attaches key/value data to a class. Imported once in `src/index.ts`.
- `target.constructor` — for a property decorator, `target` is the class's prototype; its
  `.constructor` is the class itself, which is where we store the notes.
- The specs import from `dist-e2e/`, not `src/` — see Step 9 of the syllabus.
