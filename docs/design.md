# Design notes

Why the library looks the way it does. For the step-by-step mechanics, see
[`how-the-factory-works.md`](how-the-factory-works.md).

## Which decorators, and why

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
the pattern this library copies — it's the most battle-tested option, and reusing it
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

## How the Java sibling actually does this

In `../playwright-pagefactory` (Java), a page object looks like:

```java
public class LoginPage {
  @FindBy(id = "username") Locator username;
  @FindBy(css = "input[type=password]") Locator password;
  @FindBy(role = "button", roleName = "Sign in") Locator signIn;

  public LoginPage(Page page) {
    PageFactory.initElements(page, this);
  }
}
```

`@FindBy` is a Java annotation (`FindBy.java`) with one attribute per locator strategy
(`id`, `css`, `xpath`, `role`, `testId`, `text`, ... — Selenium's strategies plus
Playwright's `getBy*` ones), retained at runtime (`@Retention(RUNTIME)`) so it can be read
back later.

`PageFactory.initElements(page, this)` then, via plain Java reflection:

1. walks every declared field of the class and its superclasses (`PageFactory.java`,
   `proxyFields`),
2. skips `static`/`final` fields (a final field means the constructor already assigned it
   — usually a component's root locator — and must not be overwritten; TypeScript has no
   runtime `final`, so here the rule is simply "don't decorate a field you assign by hand"),
3. for each remaining field, asks a `FieldDecorator` (`DefaultFieldDecorator.java`)
   whether the field carries a locating annotation (`FindBy`/`FindBys`/`FindAll`),
4. if so, converts that annotation into a `By` locator spec (`AbstractFindByBuilder`) and
   resolves a real Playwright `Locator` from it,
5. and assigns it onto the field with `field.setAccessible(true); field.set(...)`.

The TypeScript version does the same five steps, just with TypeScript's
equivalents standing in for Java's reflection API:

| Java                                   | TypeScript                                            |
|-----------------------------------------|--------------------------------------------------------|
| `@FindBy(css = "...")` annotation        | `@FindBy({ css: '...' })` decorator                    |
| Annotation retained at runtime (`RUNTIME`) | `Reflect.defineMetadata(...)` inside the decorator   |
| `PageFactory.initElements(page, obj)`    | `initPage(PageClass, page)`                            |
| `Field[] declaredFields` + reflection    | `Reflect.getMetadata(...)` reading back what `@FindBy` stored |
| `AbstractFindByBuilder` → `By`           | `resolveLocator` in `src/locators/By.ts`                |
| `field.set(pageObject, locator)`         | plain property assignment on the new instance           |

So there's no invention needed on the "how do I read metadata off a field and turn it
into a Playwright `Locator`" question — it's a direct port of what `PageFactory.java` /
`DefaultFieldDecorator.java` / `FindBy.java` already do, translated from Java's
`java.lang.reflect` to TypeScript's `reflect-metadata`.

## How this follows NestJS's decorator conventions

The decorator design here is deliberately modeled on NestJS (`@nestjs/common`, checked against
v12.1.1's source), not invented from scratch. Nest itself uses the legacy decorators +
`reflect-metadata` combination (`experimentalDecorators`). Mapping:

| NestJS                                                       | This library                                              |
|--------------------------------------------------------------|-----------------------------------------------------------|
| `@Injectable()` sets a watermark via `Reflect.defineMetadata` | `@PageObject()` sets `__pageObject__` the same way        |
| Property-level `@Inject()` appends `{ key, type }` to an array on `target.constructor`, read with `Reflect.getMetadata` | `@FindBy()` appends `{ propertyKey, locatorSpec }` to an array on `target.constructor`, read the same way |
| `@Get()` / `@Post()` are shorthands built by `createMappingDecorator` over `@RequestMapping()` | `@Css()`, `@TestId()`, `@Role()`, ... are shorthands built by `createFindByDecorator` over `@FindBy()` |
| Namespaced string metadata keys in `constants.ts`            | Same, in `src/constants.ts`                               |

Where it deliberately differs: Nest also does constructor-parameter injection using
`design:paramtypes`; `@FindBy` only needs property-level metadata, so it doesn't. The
`initPage` step (reading the metadata back and building the instance) plays the role of Nest's
DI container, but is a direct port of the Java sibling's `PageFactory.initElements`.

## Why this saves time

Compared to hand-writing `page.locator(...)` calls in every page object's constructor:

- **Less to write, less to get wrong.** One line per field (`@FindBy({...})` + the
  declaration) instead of a declaration *and* a matching constructor assignment that has
  to be kept in sync by hand as fields are added/renamed/reordered.
- **Locator and field live in one place.** Reviewing a diff that adds a field shows the
  selector right next to it, instead of sending the reviewer to scroll down to the
  constructor to see what it's bound to.
- **Same shape as the Java sibling.** A team (or a single person) moving between the Java
  Playwright suite and a TypeScript one doesn't re-learn a pattern — `@FindBy(css = "...")`
  and `@FindBy({ css: '...' })` are the same idea in each language's own idiom.
- **Same shape as tools the TS ecosystem already knows.** Anyone who's used NestJS
  controllers, Angular components, or TypeORM entities already has the muscle memory for
  "decorator declares intent, framework wires it up at init time" — there's near-zero
  ramp-up cost to reading a `@FindBy`-based page object for the first time.

To be clear, none of this is about *runtime* speed (decorators run once per class definition, which is noise next to
any browser action). The time saved is authoring and review time, not test
execution time.

## Non-goals for now

- No attempt to abstract over frameworks other than Playwright.
- No attempt to support both decorator generations simultaneously — pick legacy
  decorators + `reflect-metadata` and move on; see "Upgrade path" above for why that's
  fine to defer.
- No speed claims, benchmarks, or optimization work until the API shape is settled.
