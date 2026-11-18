const { chromium } = require('@playwright/test');
const dotenv = require('dotenv');
dotenv.config({ override: true });

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();

  // Login
  await page.goto('https://stg-genforms.mobilityeye.com/');
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="Username"]', process.env.USERNAME);
  await page.fill('input[name="Password"]', process.env.PASSWORD);
  await page.click('button#the-button');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Click "Create a new form"
  await page.getByText('Create a new form', { exact: true }).click();
  await page.waitForTimeout(3000);

  // Click "Do it Yourself"
  console.log('\n=== CLICKING "Do it Yourself" ===');
  await page.locator('.cft-title').filter({ hasText: 'Do it Yourself' }).click();
  await page.waitForTimeout(3000);

  // Dump the entire "Create from Scratch" dialog HTML structure (abbreviated)
  console.log('\n=== "Create from Scratch" DIALOG — ALL ELEMENTS ===');
  const dialogEls = await page.$$eval('.addsurvey-modalbox *, .cdk-overlay-pane:last-of-type *', els => els
    .filter(e => e.offsetParent !== null && e.children.length < 3)
    .slice(0, 80)
    .map(e => ({
      tag: e.tagName,
      text: e.innerText?.trim().slice(0, 60),
      cls: (typeof e.className === 'string' ? e.className : '').slice(0, 100),
      id: e.id,
      role: e.getAttribute('role'),
      ariaLabel: e.getAttribute('aria-label'),
    })));
  dialogEls.forEach(el => console.log(JSON.stringify(el)));

  // Specifically look for anything clickable near "folder" / "Uncategorized"
  console.log('\n=== ELEMENTS WITH "folder" or "Uncategorized" in text/class ===');
  const folderEls = await page.$$eval('.addsurvey-modalbox *', els => els
    .filter(e => {
      const t = e.innerText?.toLowerCase() || '';
      const c = (typeof e.className === 'string' ? e.className : '').toLowerCase();
      return (t.includes('folder') || t.includes('uncategorized') || c.includes('folder')) && e.offsetParent !== null;
    })
    .slice(0, 20)
    .map(e => ({
      tag: e.tagName,
      text: e.innerText?.trim().slice(0, 80),
      cls: (typeof e.className === 'string' ? e.className : '').slice(0, 120),
      id: e.id,
      clickable: e.tagName === 'BUTTON' || e.tagName === 'A' || e.getAttribute('role') === 'button' || e.style?.cursor === 'pointer',
    })));
  folderEls.forEach(f => console.log(JSON.stringify(f)));

  // Try clicking the "Uncategorized" text or the edit area
  console.log('\n=== TRYING TO CLICK "Uncategorized" area ===');
  const uncatEl = page.locator('.addsurvey-modalbox').getByText('Uncategorized');
  const uncatCount = await uncatEl.count();
  console.log('Found "Uncategorized" elements:', uncatCount);
  
  if (uncatCount > 0) {
    await uncatEl.first().click();
    await page.waitForTimeout(3000);
    
    console.log('\n=== AFTER CLICKING "Uncategorized" — OVERLAYS ===');
    const overlays = await page.$$eval('.cdk-overlay-pane', els => els
      .filter(e => e.offsetParent !== null)
      .map(e => ({
        tag: e.tagName,
        cls: (typeof e.className === 'string' ? e.className : '').slice(0, 120),
        text: e.innerText?.trim().slice(0, 400),
      })));
    overlays.forEach(o => console.log(JSON.stringify(o)));

    console.log('\n=== LOOKING FOR FOLDER NAMES/OPTIONS ===');
    const options = await page.$$eval('mat-option, [role="option"], [role="listbox"] *, mat-tree-node, [role="treeitem"]', els => els
      .filter(e => e.offsetParent !== null)
      .slice(0, 30)
      .map(e => ({
        tag: e.tagName,
        text: e.innerText?.trim().slice(0, 80),
        cls: (typeof e.className === 'string' ? e.className : '').slice(0, 120),
      })));
    options.forEach(o => console.log(JSON.stringify(o)));

    console.log('\n=== LOOKING FOR "Automation testing" TEXT ===');
    const automationEls = await page.$$eval('*', els => els
      .filter(e => e.innerText?.includes('Automation') && e.offsetParent !== null && e.children.length < 3)
      .slice(0, 10)
      .map(e => ({
        tag: e.tagName,
        text: e.innerText?.trim().slice(0, 80),
        cls: (typeof e.className === 'string' ? e.className : '').slice(0, 100),
      })));
    automationEls.forEach(a => console.log(JSON.stringify(a)));
  }

  await browser.close();
  console.log('\nDONE');
})();
