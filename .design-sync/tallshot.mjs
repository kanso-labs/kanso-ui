// Full-height captures of preview stories, for grading stories taller than
// compare.mjs's 900x700 preview viewport (its storybook side screenshots the
// whole story root, its preview side only the viewport). Writes to
// ds-bundle/_screenshots/tall/<Name>__<Story>.png. Grading aid only: it
// changes nothing that is uploaded or keyed.
//   node .design-sync/tallshot.mjs <Name>:<Story>[,<Story>] ...
import { mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { serveDir } from '../.ds-sync/storybook/http-serve.mjs';

const { chromium } = await import(resolve('.ds-sync/node_modules/playwright/index.mjs'));

const OUT = resolve('ds-bundle');
const dir = join(OUT, '_screenshots', 'tall');
mkdirSync(dir, { recursive: true });

// components/<group>/<Name>/<Name>.html, whichever group the build chose.
const groups = readdirSync(join(OUT, 'components'));
const htmlFor = (name) => {
  for (const g of groups) {
    try {
      if (readdirSync(join(OUT, 'components', g)).includes(name)) return `components/${g}/${name}/${name}.html`;
    } catch { /* not a directory */ }
  }
  throw new Error(`no preview for ${name}`);
};

const { srv, port } = await serveDir(OUT);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { height: 700, width: 900 } });
// compare.mjs pins the clock to this instant, so a date component's "today"
// matches the reference capture; without it the real today shows as a delta.
await page.clock.setFixedTime(new Date('2030-01-15T12:00:00Z'));
// It settles animations as compare does too, or a spinner is caught mid-spin.
await page.emulateMedia({ reducedMotion: 'reduce' });
for (const arg of process.argv.slice(2)) {
  const [name, stories] = arg.split(':');
  for (const story of stories.split(',')) {
    await page.goto(`http://127.0.0.1:${port}/${htmlFor(name)}?story=${encodeURIComponent(story)}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const path = join(dir, `${name}__${story}.png`);
    await page.screenshot({ animations: 'disabled', fullPage: true, path });
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    console.log(`${name} ${story}: ${h}px -> ${path}`);
  }
}
await browser.close();
srv.close();
