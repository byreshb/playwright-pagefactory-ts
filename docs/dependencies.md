# Dependencies and config: what each one is for

## Runtime dependency (ships to users)
| Package | Why |
|---------|-----|
| `reflect-metadata` | Lets a decorator attach data to a class (`Reflect.defineMetadata`) and lets `initPage` read it back (`Reflect.getMetadata`). This is the same mechanism NestJS, Angular and TypeORM use. Without it we'd have to invent our own hidden registry. Imported once in `src/index.ts`. |

## Peer dependency (the user brings it)
| Package | Why |
|---------|-----|
| `@playwright/test` (`>=1.40.0`) | The library returns Playwright `Locator`s and takes a Playwright `Page`, so the user's own Playwright must be the one used. A *peer* dependency avoids installing a second copy. |

## Dev dependencies (only for working on this repo)
| Package | Why |
|---------|-----|
| `@playwright/test` (`^1.49.1`) | Installed here so we can run the real tests: the test runner (`playwright test`), the `test`/`expect` API, and headless Chromium. |
| `typescript` | Compiles `src/` to JavaScript, type-checks, and — importantly — compiles the decorator syntax. |

Nothing else. There is no separate unit-test framework: every test is a real Playwright spec in a
real browser.

## Why `npm test` is "tsc, then playwright test"
Playwright's runner compiles TypeScript itself, but with the *newer* decorator standard, so it
can't compile our `experimentalDecorators` code (`@Role(...)` on a field). `tsc` can. So:

1. `tsc -p tsconfig.e2e.json` compiles `src/`, `examples/` and `test/pages/` → plain JS in `dist-e2e/`.
2. `playwright test` runs the specs in `test/playwright/`, which import from `dist-e2e/`.

## tsconfig choices
| Setting | Why |
|---------|-----|
| `experimentalDecorators: true` | Turns on the older decorator syntax NestJS/Angular/TypeORM use. Required. |
| `emitDecoratorMetadata` | **Not set.** Nest uses it to read constructor parameter types for injection. We never read types, so it would be unused. |
| `target: ES2020` | Any target works for users. Under ES2022+ TypeScript emits each field (`todoCount;`), but `initPage` assigns after the constructor, so nothing is overwritten. CI runs every spec with both targets (`npm test` and `npm run test:es2022`). |
| `strict: true` | Normal safety. The `!` on fields says "assigned later by `initPage`". |
| `lib: [ES2020, DOM]` | Playwright's types refer to DOM types. |
| `declaration: true` | Emits `.d.ts` files so users of the built library get types. |

## Config files
- `tsconfig.json` — base settings, used by the editor and `npm run typecheck`.
- `tsconfig.build.json` — builds the publishable library into `dist/` (`npm run build`).
- `tsconfig.e2e.json` — builds `src`, `examples` and `test/pages` into `dist-e2e/` for the tests.
- `playwright.config.ts` — tells Playwright to run `test/playwright/*.spec.ts`.
- `.github/workflows/ci.yml` — type-check, build and test (default and ES2022 targets) on every push and pull request.
- `.github/workflows/release.yml` — publishes a GitHub Release when a `vX.Y.Z` tag is pushed
  (see [`releasing.md`](releasing.md)).
