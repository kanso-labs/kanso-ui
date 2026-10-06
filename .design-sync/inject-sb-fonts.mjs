// Gives the reference Storybook the Roboto faces the sync ships, so compare.mjs
// grades previews and stories in the same fonts. kanso's Storybook loads no
// fonts, so without this every story renders in the type stacks' fallbacks
// while the previews render in Roboto. Run it after every rebuild of
// .design-sync/sb-reference; it is idempotent.
//   node .design-sync/inject-sb-fonts.mjs
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const fonts = '.design-sync/fonts';
const sb = '.design-sync/sb-reference';
const marker = '<!-- design-sync: Roboto -->';

mkdirSync(join(sb, 'ds-fonts'), { recursive: true });
for (const file of readdirSync(fonts).filter((f) => f.endsWith('.woff2'))) {
  copyFileSync(join(fonts, file), join(sb, 'ds-fonts', file));
}

const css = readFileSync(join(fonts, 'roboto.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\/\s*/g, '')
  .replaceAll("url('./", "url('./ds-fonts/");
const path = join(sb, 'iframe.html');
const html = readFileSync(path, 'utf8').replace(new RegExp(`${marker}<style>[\\s\\S]*?</style>\\n?\\s*`), '');
writeFileSync(path, html.replace('</head>', `${marker}<style>${css}</style>\n  </head>`));
console.log(`Roboto injected into ${path}`);
