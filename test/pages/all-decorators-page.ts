import type { Locator } from '@playwright/test';
import {
  AltText,
  By,
  Css,
  FindBy,
  Id,
  Label,
  PageObject,
  Placeholder,
  Role,
  TestId,
  Text,
  Title,
  XPath,
} from '../../src';

/** Every decorator, with awkward inputs. Used by test/playwright/decorators.spec.ts. */
@PageObject()
export class AllDecoratorsPage {
  @Css(`[data-x="it's"]`) cssWithQuotes!: Locator;
  @XPath('//p[@class="x"]') xpath!: Locator;
  @XPath('(//li)[2]') xpathIndexed!: Locator;

  @Id('plain') idPlain!: Locator;
  @Id('a"b\\c') idQuoteAndBackslash!: Locator;
  @Id('user:name') idWithColon!: Locator;
  @Id('1st') idStartingWithDigit!: Locator;

  @TestId('status') testId!: Locator;
  @TestId(/^row-\d+$/) testIdRegex!: Locator;

  @Text('Hello') textSubstring!: Locator;
  @Text('Hello', true) textExact!: Locator;
  @Text('He said "hi"') textWithQuotes!: Locator;
  @Text(/wor\w+/i) textRegex!: Locator;

  @Label('Email') labelFor!: Locator;
  @Label('Search box', true) labelAria!: Locator;
  @Placeholder('Your name') placeholder!: Locator;
  @Placeholder(/^zip/i) placeholderRegex!: Locator;
  @AltText('Company logo') altText!: Locator;
  @Title('Tooltip here') title!: Locator;

  @Role('button', { name: 'Save' }) roleName!: Locator;
  @Role('button', { name: 'Save', exact: true }) roleNameExact!: Locator;
  @Role('button', { name: /^save draft$/i }) roleNameRegex!: Locator;
  @Role('heading', { name: 'Section', level: 2 }) roleLevel!: Locator;
  @Role('checkbox', { checked: true }) roleChecked!: Locator;
  @Role('button', { disabled: true }) roleDisabled!: Locator;
  @Role('button', { name: 'Hidden', includeHidden: true }) roleIncludeHidden!: Locator;

  @FindBy({ css: '#plain' }) findByObject!: Locator;
  @FindBy(By.role('heading', { level: 1 })) findByBuilder!: Locator;
}

export class BasePage {
  @Css('#plain') inherited!: Locator;
  @Css('.old') overridden!: Locator;
}

export class ChildPage extends BasePage {
  // `declare` re-types the inherited field without redefining it; required under ES2022+ targets.
  @Css('.new') declare overridden: Locator;
  @TestId('status') own!: Locator;
}

export const FIXTURE = `
  <div data-x="it's">css quotes</div>
  <p class="x">xpath p</p>
  <ul><li>one</li><li>two</li></ul>
  <div id="plain">plain id</div>
  <div id='a"b\\c'>quote and backslash</div>
  <div id="user:name">colon</div>
  <div id="1st">digit</div>
  <span data-testid="status">ok</span>
  <div data-testid="row-1">r1</div><div data-testid="row-22">r2</div><div data-testid="row-x">rx</div>
  <p>Hello</p><p>Hello there</p>
  <p>He said "hi"</p>
  <p>Hello WORLD</p>
  <label for="e">Email</label><input id="e">
  <input aria-label="Search box"><input aria-label="Search box extra">
  <input placeholder="Your name">
  <input placeholder="ZIP code">
  <img alt="Company logo" src="data:,">
  <span title="Tooltip here">t</span>
  <button>Save</button><button>Save draft</button>
  <button disabled>Nope</button>
  <button style="display:none">Hidden</button>
  <h1>Section</h1><h2>Section</h2>
  <input type="checkbox" aria-label="on" checked><input type="checkbox" aria-label="off">
  <div class="old">old</div><div class="new">new</div>
`;
