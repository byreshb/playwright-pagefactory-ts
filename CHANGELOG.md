# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed
- `@Id` now escapes backslashes as well as quotes in the id value.
- `@Role` and `By.role` passed only `name` and `exact`; they now pass every `getByRole` option
  (`level`, `checked`, `disabled`, `expanded`, `pressed`, `selected`, `includeHidden`).

### Added
- `@Text`, `@Label`, `@Placeholder`, `@AltText`, `@Title` and `@TestId` accept a `RegExp` as
  well as a string.
- Two locator decorators on the same field now throw when the class loads instead of one
  silently winning.
- Browser specs covering every decorator with quotes, backslashes, regular expressions and every
  `getByRole` option, plus inheritance and invalid usage.
- Specs showing decorated fields are lazy: no browser call at `initPage`, elements looked up on
  every action.
- CI also runs every spec compiled for ES2022.

### Changed
- README rewritten as a user guide; design rationale moved to `docs/design.md`, and the code map
  folded into `docs/syllabus.md`.

## [0.1.0] - 2026-09-29

First cut: a working starting point. The API may still change before 1.0.

### Added
- `@FindBy(spec)` decorator and shorthands `@Css`, `@XPath`, `@Id`, `@TestId`, `@Text`,
  `@Label`, `@Placeholder`, `@AltText`, `@Title` and `@Role`, modeled on NestJS's decorator
  conventions.
- `@PageObject()` class marker.
- `initPage(PageClass, page)`, the TypeScript counterpart of `PageFactory.initElements`.
  It passes `page` to the constructor, so decorators and constructor-assigned locators can be
  mixed in one class.
- `By.*` locator builders and the `LocatorSpec` type.
- TodoMVC examples (plain, decorator, constructor and mixed styles) with Playwright specs that
  run against https://demo.playwright.dev/todomvc.
- Documentation under `docs/`.

[Unreleased]: https://github.com/byreshb/playwright-pagefactory-ts/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/byreshb/playwright-pagefactory-ts/releases/tag/v0.1.0
