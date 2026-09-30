import { expect, test } from '@playwright/test';
import { Css, FindBy, TestId, initPage } from '../../dist-e2e/src';
import {
  AllDecoratorsPage,
  ChildPage,
  FIXTURE,
} from '../../dist-e2e/test/pages/all-decorators-page';

// Every decorator must resolve to exactly the element(s) Playwright would find by hand.

test.describe('each decorator finds the right element', () => {
  let p: AllDecoratorsPage;
  test.beforeEach(async ({ page }) => {
    await page.setContent(FIXTURE);
    p = initPage(AllDecoratorsPage, page);
  });

  test('@Css and @XPath', async () => {
    await expect(p.cssWithQuotes).toHaveText('css quotes');
    await expect(p.xpath).toHaveText('xpath p');
    await expect(p.xpathIndexed).toHaveText('two');
  });

  test('@Id, including quotes, backslashes, colons and leading digits', async () => {
    await expect(p.idPlain).toHaveText('plain id');
    await expect(p.idQuoteAndBackslash).toHaveText('quote and backslash');
    await expect(p.idWithColon).toHaveText('colon');
    await expect(p.idStartingWithDigit).toHaveText('digit');
  });

  test('@TestId with a string and a RegExp', async () => {
    await expect(p.testId).toHaveText('ok');
    await expect(p.testIdRegex).toHaveText(['r1', 'r2']);
  });

  test('@Text: substring, exact, quotes, RegExp', async () => {
    await expect(p.textSubstring).toHaveCount(3); // Hello, Hello there, Hello WORLD
    await expect(p.textExact).toHaveCount(1);
    await expect(p.textWithQuotes).toHaveCount(1);
    await expect(p.textRegex).toHaveText('Hello WORLD');
  });

  test('@Label, @Placeholder, @AltText, @Title', async () => {
    await expect(p.labelFor).toHaveAttribute('id', 'e');
    await expect(p.labelAria).toHaveCount(1);
    await expect(p.placeholder).toHaveCount(1);
    await expect(p.placeholderRegex).toHaveAttribute('placeholder', 'ZIP code');
    await expect(p.altText).toHaveCount(1);
    await expect(p.title).toHaveText('t');
  });

  test('@Role with name, exact, RegExp and every other getByRole option', async () => {
    await expect(p.roleName).toHaveCount(2); // Save, Save draft
    await expect(p.roleNameExact).toHaveText('Save');
    await expect(p.roleNameRegex).toHaveText('Save draft');
    await expect(p.roleLevel).toHaveJSProperty('tagName', 'H2');
    await expect(p.roleChecked).toHaveAttribute('aria-label', 'on');
    await expect(p.roleDisabled).toHaveText('Nope');
    await expect(p.roleIncludeHidden).toHaveCount(1);
  });

  test('@FindBy with a plain object and with a By builder', async () => {
    await expect(p.findByObject).toHaveText('plain id');
    await expect(p.findByBuilder).toHaveJSProperty('tagName', 'H1');
  });
});

test('subclasses inherit fields and can override them', async ({ page }) => {
  await page.setContent(FIXTURE);
  const child = initPage(ChildPage, page);
  await expect(child.inherited).toHaveText('plain id');
  await expect(child.overridden).toHaveText('new');
  await expect(child.own).toHaveText('ok');
});

test('invalid usage fails when the class is defined', () => {
  expect(() => FindBy({} as any)).toThrow(/exactly one locator strategy.*got none/);
  expect(() => FindBy({ css: 'a', xpath: 'b' } as any)).toThrow(/got css, xpath/);

  class TwoDecorators {}
  Css('#a')(TwoDecorators.prototype, 'field');
  expect(() => TestId('b')(TwoDecorators.prototype, 'field')).toThrow(
    /TwoDecorators\.field has more than one locator decorator/,
  );
});
