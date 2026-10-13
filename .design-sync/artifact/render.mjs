// Renders <dir>/project/components/<Name>/preview.html in light and dark the
// way the Design System page frames a preview: its tokens.css compiled from
// tokens.json, the fonts, bundle.css, the React files and bundle.js preloaded,
// and data-theme on <html>. Prints one line per preview and theme, with what
// is wrong, and writes a screenshot of each to <dir>/shots/ to look at.
//
//   node .design-sync/artifact/render.mjs <dir> [<Name> ... | all]
//   WIDTH=960 node .design-sync/artifact/render.mjs <dir> Cover
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('../..', import.meta.url).pathname;
const { chromium } = createRequire(`${ROOT}package.json`)('playwright');

const [dir, ...rest] = process.argv.slice(2);
if (!dir) throw new Error('usage: render.mjs <dir> [<Name> ... | all]');
const P = `${dir}/project`;
mkdirSync(`${dir}/shots`, { recursive: true });

// tokens.css as the page compiles it (format.md, "tokens.css as compiled").
function tokensCss(t) {
  const themes = t.color.themes.map((x) => x.id);
  const cv = (v) => (v.startsWith('{') ? `var(--${v.slice(1, -1)})` : v);
  const of = (v, th) => (typeof v === 'string' ? (th === themes[0] ? v : undefined) : v[th]);
  const out = [];
  const first = [...t.color.tokens.map((x) => `--${x.name}: ${cv(of(x.value, themes[0]))};`), ...(t.shadow?.tokens ?? []).map((x) => `--${x.name}: ${x.value};`)];
  out.push(`:root, [data-theme="${themes[0]}"] { ${first.join(' ')} }`);
  for (const th of themes.slice(1)) {
    const decl = t.color.tokens.filter((x) => of(x.value, th)).map((x) => `--${x.name}: ${cv(of(x.value, th))};`);
    out.push(`[data-theme="${th}"] { ${decl.join(' ')} }`);
  }
  const rest = [];
  for (const [k, v] of Object.entries(t)) {
    if (['name', 'version', 'color', 'type', 'shadow', 'meta'].includes(k)) continue;
    for (const x of v.tokens) rest.push(`--${x.name}: ${x.value};`);
  }
  for (const [k, v] of Object.entries(t.type.families)) rest.push(`--font-${k}: ${v};`);
  out.push(`:root { ${rest.join(' ')} }`);
  for (const g of t.type.groups) {
    for (const s of g.styles) {
      out.push(`.${s.name} { font-family: var(--font-${s.family ?? g.family}); font-size: ${s.fontSize}; line-height: ${s.lineHeight}; font-weight: ${s.fontWeight}; letter-spacing: ${s.letterSpacing ?? 'normal'}; }`);
    }
  }
  for (const f of t.type.fonts) out.push(`@font-face { font-family: '${f.family}'; src: url('file://${P}/${f.file}') format('woff2'); font-weight: ${f.weight}; font-style: ${f.style}; font-display: block; }`);
  return `${out.join('\n')}\n`;
}
writeFileSync(`${dir}/shots/tokens.css`, tokensCss(JSON.parse(readFileSync(`${P}/tokens.json`, 'utf8'))));

let names = rest;
if (!names.length || names[0] === 'all') names = readdirSync(`${P}/components`).filter((n) => existsSync(`${P}/components/${n}/preview.html`));
const themes = (process.env.THEMES || 'light,dark').split(',');
// The cover is laid out at 960px, as Overview shows it (cover.md); every
// other preview at the 728px a component row gives it.
const widthOf = (name) => Number(process.env.WIDTH || (name === 'Cover' ? 960 : 728));
const preload = `<link rel="stylesheet" href="file://${dir}/shots/tokens.css"><link rel="stylesheet" href="file://${P}/components/bundle.css">
<script src="file://${P}/components/lib/react.production.min.js"></script><script src="file://${P}/components/lib/react-dom.production.min.js"></script><script src="file://${P}/components/bundle.js"></script>`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC', viewport: { height: 100, width: 728 } });
let bad = 0;
for (const name of names) {
  const src = readFileSync(`${P}/components/${name}/preview.html`, 'utf8');
  const first = src.split('\n')[0];
  const height = Number(/height=(\d+)/.exec(first)?.[1] || 120);
  const width = widthOf(name);
  for (const theme of themes) {
    const file = `${dir}/shots/${name}-${theme}.html`;
    writeFileSync(file, src.replace(/<html([^>]*)>/i, `<html$1 data-theme="${theme}">`).replace(/<head>/i, `<head>${preload}`));
    const page = await ctx.newPage();
    await page.setViewportSize({ height: 100, width });
    const issues = [];
    page.on('pageerror', (e) => issues.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error' || m.type() === 'warning') issues.push(`${m.type()}: ${m.text().slice(0, 300)}`);
    });
    // A fixed clock, so a date component never outlines the real today.
    await page.clock.install({ time: new Date('2030-01-15T12:00:00Z') }).catch(() => {});
    await page.goto(`file://${file}`);
    await page.clock.runFor(1500).catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const info = await page.evaluate(() => {
      const root = document.getElementById('root') || document.body;
      const faces = new Set();
      for (const el of document.querySelectorAll('body *')) {
        if ([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) faces.add(getComputedStyle(el).fontFamily.split(',')[0]);
      }
      return { children: root.children.length, faces: [...faces], h: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight), w: document.documentElement.scrollWidth };
    });
    await page.setViewportSize({ height: Math.min(Math.max(info.h, height, 100), 4000), width });
    await page.screenshot({ fullPage: true, path: `${dir}/shots/${name}-${theme}.png` });
    if (!/^<!-- @dsCard\b.*-->$/.test(first)) issues.push('line 1 is not an @dsCard marker');
    if (info.h > height + 8) issues.push(`content is ${info.h}px tall but the marker says height=${height}`);
    if (!info.children) issues.push('root rendered nothing');
    if (info.w > width + 1) issues.push(`horizontal overflow: ${info.w}px at ${width}px`);
    const fallback = info.faces.filter((f) => !/Roboto|monospace/i.test(f));
    if (theme === themes[0] && fallback.length) issues.push(`text set in a fallback face: ${fallback.join(', ')}`);
    console.log(`${issues.length ? '✗' : '✓'} ${name} [${theme}] marker height ${height}, content ${info.h}px${issues.length ? `\n    ${issues.join('\n    ')}` : ''}`);
    if (issues.length) bad++;
    await page.close();
  }
}
await browser.close();
console.log(`${names.length} previews, ${bad} with issues`);
process.exitCode = bad ? 1 : 0;
