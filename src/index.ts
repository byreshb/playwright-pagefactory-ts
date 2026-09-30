import 'reflect-metadata';

export { PageObject } from './decorators/PageObject';
export {
  FindBy,
  Css,
  XPath,
  Id,
  TestId,
  Text,
  Label,
  Placeholder,
  AltText,
  Title,
  Role,
} from './decorators/FindBy';
export { By } from './locators/By';
export type { LocatorSpec } from './locators/By';
export { initPage } from './initPage';
