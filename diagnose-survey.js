// diagnose-survey.js  –  inspect the live published survey DOM
'use strict';
const { chromium } = require('@playwright/test');
const dotenv = require('dotenv');
dotenv.config({ override: true });

(async () => {
  const base = (process.env.BASE_URL || 'https://dev-genforms.mobilityeye.com:8443/').replace(/\/$/, '');
  const browser = await chromium.launch({ headless: false });
  const ctx    = await browser.newContext();
  const page   = await ctx.newPage();

  // ── Login ──────────────────────────────────────────────────────────────────
  await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.fill('input[name="Username"]', process.env.USERNAME);
  await page.fill('input[name="Password"]', process.env.PASSWORD);
  await page.locator('button#the-button').first().click();
  await page.waitForURL(/\/en\/(?!auth)/, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  console.log('Logged in ->', page.url());

  // ── Grab a publish URL from the latest campaign ───────────────────────────
  await page.goto(base + '/#/en/campaign', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // click first card
  const card = page.locator('mat-card, .campaign-card, .global-list-card').first();
  if (await card.isVisible().catch(() => false)) {
    await card.click({ force: true });
    await page.waitForTimeout(2500);
  }

  // wait for table / token column
  await page.waitForSelector('table', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const publishUrl = await page.evaluate(() => {
    const a = document.querySelector('a[href*="/survey/publish/"]');
    return a ? (a.getAttribute('href') || a.href) : null;
  });

  if (!publishUrl) {
    console.log('No publish URL – page HTML:\n', await page.content().then(h => h.substring(0, 3000)));
    await browser.close(); return;
  }
  console.log('Publish URL ->', publishUrl);

  // ── Open survey in new tab ─────────────────────────────────────────────────
  const sp = await ctx.newPage();
  await sp.goto(publishUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sp.waitForLoadState('networkidle').catch(() => {});
  await sp.waitForTimeout(4000);
  console.log('Survey URL  ->', sp.url());

  // ── DOM introspection ──────────────────────────────────────────────────────
  const d = await sp.evaluate(() => {
    const out = {};

    // radio groups
    out.radioGroups = [...document.querySelectorAll('mat-radio-group')].map((g, gi) => ({
      gi,
      radios: [...g.querySelectorAll('mat-radio-button')].map((rb, ri) => {
        const inp = rb.querySelector('input[type="radio"]');
        return {
          ri,
          text: rb.textContent.trim(),
          inputChecked: inp ? inp.checked : null,
          classCheckedMDC: rb.classList.contains('mat-mdc-radio-checked'),
          classCheckedLeg: rb.classList.contains('mat-radio-checked'),
          fullClass: rb.className,
        };
      }),
    }));

    // checkboxes
    out.checkboxes = [...document.querySelectorAll('mat-checkbox')].map((cb, i) => {
      const inp = cb.querySelector('input[type="checkbox"]');
      return {
        i,
        text: cb.textContent.trim(),
        inputChecked: inp ? inp.checked : null,
        classCheckedMDC: cb.classList.contains('mat-mdc-checkbox-checked'),
        classCheckedLeg: cb.classList.contains('mat-checkbox-checked'),
        fullClass: cb.className,
      };
    });

    // rating containers – try several selectors
    out.ratings = {
      'div.sp-rating-control-svg-container': document.querySelectorAll('div.sp-rating-control-svg-container').length,
      '[class*="sp-rating"]': document.querySelectorAll('[class*="sp-rating"]').length,
      '[class*="rating"]': document.querySelectorAll('[class*="rating"]').length,
    };
    // grab first few rating elements' full classes
    out.ratingElements = [...document.querySelectorAll('[class*="rating"]')].slice(0, 15).map(el => ({
      tag: el.tagName, cls: el.className, childCount: el.children.length,
    }));

    // submit / nav buttons
    out.navButtons = [...document.querySelectorAll('button')].map(b => ({
      text: b.textContent.trim().substring(0, 60),
      id: b.id,
      cls: b.className.substring(0, 120),
      disabled: b.disabled,
      visible: b.offsetParent !== null,
    })).filter(b => b.visible);

    // snt-stage nav label spans
    out.sntLabels = [...document.querySelectorAll('.snt-stage__nav-btn-label')].map(s => ({
      text: s.textContent.trim(),
      parentTag: s.parentElement ? s.parentElement.tagName : '?',
      parentClass: s.parentElement ? s.parentElement.className.substring(0, 120) : '',
    }));

    // question-container selectors
    out.qContainers = {};
    for (const sel of ['[class*="snt-question"]','[class*="sp-question"]','[class*="survey-question"]',
                        '[class*="question-body"]','[class*="question-wrap"]','[class*="question-item"]']) {
      out.qContainers[sel] = document.querySelectorAll(sel).length;
    }

    // visible text headings
    out.visibleTexts = [...new Set(
      [...document.querySelectorAll('h1,h2,h3,h4,h5,label,[class*="title"],[class*="heading"],[class*="label"]')]
        .filter(e => e.offsetParent !== null)
        .map(e => e.textContent.trim())
        .filter(t => t.length > 4 && t.length < 200)
    )].slice(0, 40);

    return out;
  });

  // ── Print results ──────────────────────────────────────────────────────────
  console.log('\n══ RADIO GROUPS ══');
  d.radioGroups.forEach(g => {
    console.log(`\n  Group #${g.gi}:`);
    g.radios.forEach(r => {
      const sel = r.inputChecked || r.classCheckedMDC || r.classCheckedLeg;
      console.log(`    [${sel ? 'X' : ' '}] "${r.text}"`);
      console.log(`         inputChecked=${r.inputChecked}  MDCclass=${r.classCheckedMDC}  legClass=${r.classCheckedLeg}`);
      console.log(`         fullClass: ${r.fullClass.substring(0,120)}`);
    });
  });

  console.log('\n══ CHECKBOXES ══');
  d.checkboxes.slice(0, 15).forEach(c => {
    const sel = c.inputChecked || c.classCheckedMDC || c.classCheckedLeg;
    console.log(`  [${sel?'X':' '}] #${c.i} "${c.text}"`);
    console.log(`       inputChecked=${c.inputChecked}  MDCclass=${c.classCheckedMDC}  legClass=${c.classCheckedLeg}`);
    console.log(`       fullClass: ${c.fullClass}`);
  });

  console.log('\n══ RATING ELEMENTS ══');
  console.log('  counts:', JSON.stringify(d.ratings));
  d.ratingElements.forEach(r => console.log(`  <${r.tag}> children=${r.childCount} class="${r.cls}"`));

  console.log('\n══ VISIBLE NAV BUTTONS ══');
  d.navButtons.forEach(b => console.log(`  "${b.text}"  id="${b.id}"  cls: ${b.cls}`));

  console.log('\n══ SNT-STAGE LABEL SPANS ══');
  d.sntLabels.forEach(s => console.log(`  text="${s.text}"  parent=${s.parentTag} cls="${s.parentClass}"`));

  console.log('\n══ QUESTION CONTAINERS ══');
  Object.entries(d.qContainers).forEach(([k,v]) => console.log(`  ${k}: ${v}`));

  console.log('\n══ VISIBLE TEXTS ══');
  d.visibleTexts.forEach(t => console.log('  >', t));

  console.log('\nClosing in 8s...');
  await new Promise(r => setTimeout(r, 8000));
  await browser.close();
})();
