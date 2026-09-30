import 'reflect-metadata';
import { FIND_BY_METADATA } from '../constants';
import { LocatorSpec, Role as AriaRole, RoleOptions, validateSpec } from '../locators/By';

export interface FindByEntry {
  propertyKey: string | symbol;
  locatorSpec: LocatorSpec;
}

/**
 * Attach a locator strategy to a page-object field. Resolved later by `initPage`.
 *
 * Modeled on Nest's property-based `@Inject()`: each use appends a `{ key, ... }` entry to an
 * array stored on `target.constructor`, read back with `Reflect.getMetadata` (which walks the
 * prototype chain, so subclasses see parent entries).
 */
export function FindBy(locatorSpec: LocatorSpec): PropertyDecorator {
  validateSpec(locatorSpec);
  return (target, propertyKey) => {
    const ctor = target.constructor;
    const entries: FindByEntry[] = Reflect.getMetadata(FIND_BY_METADATA, ctor) || [];
    Reflect.defineMetadata(FIND_BY_METADATA, [...entries, { propertyKey, locatorSpec }], ctor);
  };
}

/** Entries for a class incl. inherited ones; when a field is redeclared, the last one wins. */
export function getFindByEntries(ctor: Function): FindByEntry[] {
  const entries: FindByEntry[] = Reflect.getMetadata(FIND_BY_METADATA, ctor) || [];
  return [...new Map(entries.map((e) => [e.propertyKey, e])).values()];
}

// Shorthand decorators, the way Nest offers @Get()/@Post() as shorthands over @RequestMapping().
const createFindByDecorator =
  <A extends unknown[]>(build: (...args: A) => LocatorSpec) =>
  (...args: A): PropertyDecorator =>
    FindBy(build(...args));

export const Css = createFindByDecorator((css: string) => ({ css }));
export const XPath = createFindByDecorator((xpath: string) => ({ xpath }));
export const Id = createFindByDecorator((id: string) => ({ id }));
type TextMatch = string | RegExp;

export const TestId = createFindByDecorator((testId: TextMatch) => ({ testId }));
export const Text = createFindByDecorator((text: TextMatch, exact?: boolean) => ({ text, exact }));
export const Label = createFindByDecorator((label: TextMatch, exact?: boolean) => ({ label, exact }));
export const Placeholder = createFindByDecorator((placeholder: TextMatch, exact?: boolean) => ({
  placeholder,
  exact,
}));
export const AltText = createFindByDecorator((altText: TextMatch, exact?: boolean) => ({
  altText,
  exact,
}));
export const Title = createFindByDecorator((title: TextMatch, exact?: boolean) => ({ title, exact }));
export const Role = createFindByDecorator((role: AriaRole, options: RoleOptions = {}) => ({
  role,
  ...options,
}));
