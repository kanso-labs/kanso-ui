// Checks .design-sync/conventions.md, the header the design agent reads,
// against the built bundle in ds-bundle/: every --kui-* name it gives must be
// declared, every component it names must be an export, every other name in
// code quotes must appear in some component's types, and its example must
// render. A name the build lacks is worse than none: the agent trusts it and
// ships CSS or props that resolve to nothing. Run it after any build that
// ships the header; it exits 1 on the first sync that breaks one.
//   node .design-sync/check-conventions.mjs
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { serveDir } from '../.ds-sync/storybook/http-serve.mjs';

const OUT = resolve('ds-bundle');
const { chromium } = await import(resolve('.ds-sync/node_modules/playwright/index.mjs'));
const { transform } = await import(resolve('.ds-sync/node_modules/esbuild/lib/main.js'));

// Words in code quotes that are CSS or browser vocabulary, not kanso's.
const WEB = new Set(['currentColor', 'prefers-color-scheme']);

const md = readFileSync('.design-sync/conventions.md', 'utf8');
const css = readFileSync(join(OUT, '_ds_bundle.css'), 'utf8');
const declared = new Set([...css.matchAll(/(--kui-[a-z0-9-]*[a-z0-9])\s*:/g)].map((m) => m[1]));
const types = [];
for (const group of readdirSync(join(OUT, 'components'))) {
  for (const name of readdirSync(join(OUT, 'components', group))) {
    types.push(readFileSync(join(OUT, 'components', group, name, `${name}.d.ts`), 'utf8'));
  }
}
const corpus = types.join('\n');
const failures = [];

// Tokens: every full name, and each `-suffix` shorthand, which takes the
// family of the last full name before it on its line.
const prose = md.replace(/```[\s\S]*?```/g, '');
for (const name of md.matchAll(/--kui-[a-z0-9-]*[a-z0-9]/g)) {
  if (!declared.has(name[0])) failures.push(`token ${name[0]} is not declared in _ds_bundle.css`);
}
for (const line of prose.split('\n')) {
  let family = null;
  for (const [, quoted] of line.matchAll(/`([^`]+)`/g)) {
    if (/^--kui-[a-z0-9-]+$/.test(quoted)) family = quoted.replace(/-[a-z0-9]+$/, '-');
    else if (/^-[a-z][a-z0-9-]*$/.test(quoted)) {
      const full = family ? family + quoted.slice(1) : quoted;
      if (!declared.has(full)) failures.push(`token ${full} (written ${quoted}) is not declared`);
    }
  }
}

// Other names in code quotes: components are checked against the bundle's
// exports in the browser below; props and values against the types.
const components = new Set();
for (const [, quoted] of prose.matchAll(/`([^`]+)`/g)) {
  if (/^[A-Z][A-Za-z0-9]*$/.test(quoted)) components.add(quoted);
  else if (/^[a-z][A-Za-z0-9]*(-[a-z]+)*$/.test(quoted) && !WEB.has(quoted)) {
    const asProp = new RegExp(`["']?\\b${quoted}["']?\\??:`);
    const asValue = new RegExp(`["']${quoted}["']`);
    if (!asProp.test(corpus) && !asValue.test(corpus)) failures.push(`\`${quoted}\` is in no component's types`);
  }
}

// The example: compile its JSX, mount it on a page with the bundle, and
// check it renders without an error.
const example = /```jsx\n([\s\S]*?)```/.exec(md)?.[1];
if (!example) failures.push('no ```jsx example');
const root = /function (\w+)\(/.exec(example ?? '')?.[1];
for (const [, list] of (example ?? '').matchAll(/const \{([^}]+)\} = window\.KansoLabsKansoUi/g)) {
  for (const name of list.split(',')) components.add(name.trim());
}
const dir = join(OUT, '_screenshots', 'conventions');
mkdirSync(dir, { recursive: true });
const { code } = await transform(example ?? '', { jsx: 'transform', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment', loader: 'jsx' });
writeFileSync(
  join(dir, 'index.html'),
  `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../../styles.css">
<body style="margin:0"><div id="root"></div>
<script src="../../_vendor/react.js"></script><script src="../../_vendor/react-dom.js"></script><script src="../../_ds_bundle.js"></script>
<script>${code}\nReactDOM.createRoot(document.getElementById('root')).render(React.createElement(${root}))</script>`,
);
const { port, srv } = await serveDir(OUT);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { height: 600, width: 480 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
await page.goto(`http://127.0.0.1:${port}/_screenshots/conventions/index.html`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const exported = await page.evaluate(() => Object.keys(window.KansoLabsKansoUi ?? {}));
for (const name of components) {
  if (!exported.includes(name)) failures.push(`\`${name}\` is not a KansoLabsKansoUi export`);
}
const text = await page.evaluate(() => document.getElementById('root').innerText.trim());
if (!text) failures.push(`the example ${root} rendered nothing`);
for (const error of errors) failures.push(`the example logged: ${error}`);
await page.screenshot({ fullPage: true, path: join(dir, 'example.png') });
await browser.close();
srv.close();

console.log(failures.length ? failures.map((f) => `✗ ${f}`).join('\n') : '✓ every name in the header exists in the build, and its example renders');
console.log(`  example: ${join(dir, 'example.png')}`);
process.exit(failures.length ? 1 : 0);
