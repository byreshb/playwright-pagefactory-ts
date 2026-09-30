# Docs

Read in this order if you're new to the code:

1. [`syllabus.md`](syllabus.md) — the starting point: a map of the code and a step-by-step path from plain Playwright to how the decorators work.
2. [`what-is-what.md`](what-is-what.md) — what this project created versus what Playwright and other libraries provide.
3. [`constructor-vs-decorators.md`](constructor-vs-decorators.md) — page objects via constructors, decorators, or both together.
4. [`how-the-factory-works.md`](how-the-factory-works.md) — the actual logic from `@` to `Locator`, including why fields are lazy.
5. [`design.md`](design.md) — why it's built this way: decorator generations, the Java sibling, NestJS.

Reference:

- [`dependencies.md`](dependencies.md) — every dependency, config file and tsconfig setting, and why.
- [`releasing.md`](releasing.md) — versioning rules and how to cut a release.

The library itself is about 150 lines across six files in `src/`.
