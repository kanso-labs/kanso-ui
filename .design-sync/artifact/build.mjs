// Writes every file of the Design System artifact that comes from this
// repository into <dir>/project/, at the path the artifact serves it from: the
// fonts, components/bundle.js, bundle.css, index.d.ts and the two React files
// in components/lib/. It reads dist/, so `npm run build` first. tokens.json is
// kanso-ui-core's, written into the same directory by that repository's half
// of the sync. The README, the cover and each component's preview and
// guidelines are the artifact's own and are never written here; README.md
// beside this file says how a sync treats them.
//
//   node .design-sync/artifact/build.mjs <dir>
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const ROOT = new URL('../..', import.meta.url).pathname;
const require = createRequire(`${ROOT}package.json`);
const { build } = require('esbuild');
const { Extractor, ExtractorConfig } = require('@microsoft/api-extractor');

const NAMESPACE = 'KansoLabsKansoUi';
const dir = process.argv[2];
if (!dir) throw new Error('usage: build.mjs <dir>');
const ref = `main@${execFileSync('git', ['-C', ROOT, 'rev-parse', '--short=7', 'HEAD'], { encoding: 'utf8' }).trim()}`;
if (!existsSync(`${ROOT}dist/index.js`)) throw new Error('dist/ is missing: run npm run build first');

const P = `${dir}/project`;
for (const d of ['components/lib', 'fonts']) mkdirSync(`${P}/${d}`, { recursive: true });
const written = [];
const write = (path, contents) => {
  writeFileSync(`${P}/${path}`, contents);
  written.push(path);
};

// Each public component by its export name, with its entry: every
// src/components/<dir> with an index.tsx, its name in PascalCase. The bundle's
// header lists them, and kanso-ui-core's half reads the same list from a
// checkout of this repository for tokens.json's meta.
const components = Object.fromEntries(
  readdirSync(`${ROOT}src/components`)
    .filter((d) => existsSync(`${ROOT}src/components/${d}/index.tsx`))
    .sort()
    .map((d) => [d.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join(''), `src/components/${d}/index.tsx`]),
);

// Fonts: the woff2 file of each family tokens.json names, and its licence.
const FONTS = readdirSync(`${ROOT}.design-sync/fonts`);
for (const f of ['roboto-flex', 'roboto-mono', 'roboto-serif']) {
  const woff = `fonts/${FONTS.find((x) => x.startsWith(`${f}-`) && x.endsWith('.woff2'))}`;
  copyFileSync(`${ROOT}.design-sync/${woff}`, `${P}/${woff}`);
  copyFileSync(`${ROOT}.design-sync/fonts/${f}.LICENSE`, `${P}/fonts/${f}-OFL.txt`);
  written.push(woff, `fonts/${f}-OFL.txt`);
}

// components/bundle.css: the package's own stylesheet, then the bridge that
// lets a family edited in tokens.json reach the components.
write(
  'components/bundle.css',
  `${readFileSync(`${ROOT}dist/styles.css`, 'utf8')}\n/* Kanso UI design system: the type families tokens.json declares reach the components. */\n:root{--kui-typography-font-family-brand:var(--font-brand);--kui-typography-font-family-plain:var(--font-plain);--kui-typography-font-family-mono:var(--font-mono)}\n`,
);

// components/bundle.js and the React files it reads from window. React 19
// ships no UMD build, so both are built here as classic scripts.
const toGlobal = (name, global) => ({
  name,
  setup(b) {
    b.onResolve({ filter: name === 'react-global' ? /^react$/ : /^react(-dom(\/client)?)?$/ }, (a) => ({ namespace: 'g', path: a.path === 'react' ? 'React' : global }));
    b.onLoad({ filter: /.*/, namespace: 'g' }, (a) => ({ contents: `module.exports = window.${a.path};`, loader: 'js' }));
    b.onResolve({ filter: /\.css$/ }, () => ({ namespace: 'empty', path: 'css' }));
    b.onLoad({ filter: /.*/, namespace: 'empty' }, () => ({ contents: '', loader: 'js' }));
  },
});
async function script(path, contents, plugins = [], header = '') {
  const r = await build({
    absWorkingDir: ROOT,
    bundle: true,
    define: { 'process.env.NODE_ENV': '"production"' },
    format: 'iife',
    legalComments: 'none',
    minify: true,
    platform: 'browser',
    plugins,
    stdin: { contents, loader: 'js', resolveDir: ROOT },
    target: 'es2022',
    write: false,
  });
  // The page inlines these files, so neither sequence may survive.
  const code = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
  write(path, header + code);
}
await script('components/lib/react.production.min.js', `window.React = require('react');`);
await script('components/lib/react-dom.production.min.js', `window.ReactDOM = Object.assign({}, require('react-dom'), require('react-dom/client'));`, [toGlobal('react-global', 'React')]);
// The header in the order format.md documents it.
const header = `/* @ds-bundle: ${JSON.stringify({ format: 4, namespace: NAMESPACE, components: Object.keys(components).sort().map((name) => ({ name })) })} */\n`;
await script(
  'components/bundle.js',
  `import * as date from './dist/date.js';\nimport * as ui from './dist/index.js';\nwindow.${NAMESPACE} = Object.assign({}, date, ui);`,
  [toGlobal('globals', 'ReactDOM')],
  header,
);

// components/index.d.ts: the package's declarations rolled into one file.
const configPath = `${ROOT}etc/api-extractor.json`;
const configObject = ExtractorConfig.loadFile(configPath);
configObject.projectFolder = ROOT;
configObject.apiReport = { enabled: false, reportFileName: 'unused' };
configObject.dtsRollup = { enabled: true, untrimmedFilePath: `${P}/components/index.d.ts` };
// The API report is etc/'s business; the messages it records are noise here.
configObject.messages = { compilerMessageReporting: { default: { logLevel: 'none' } }, extractorMessageReporting: { default: { logLevel: 'none' } }, tsdocMessageReporting: { default: { logLevel: 'none' } } };
const result = Extractor.invoke(ExtractorConfig.prepare({ configObject, configObjectFullPath: configPath, packageJsonFullPath: `${ROOT}package.json` }), { localBuild: true });
if (!result.succeeded) throw new Error('api-extractor could not roll up the declarations');
written.push('components/index.d.ts');

const versions = ['react', 'react-dom'].map((n) => `${n} ${require(`${n}/package.json`).version}`).join(', ');
console.log(`${ref}: wrote ${written.length} files to ${P} (${versions})\n${written.map((w) => `  project/${w}`).join('\n')}`);
