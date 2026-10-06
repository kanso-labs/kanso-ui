// Writes .design-sync/docs/<Name>.md for every component the package exports,
// from kanso's own JSDoc in dist/components/*/index.d.ts. cfg.docsDir hands
// them to the converter as each component's usage doc. The storybook source
// adapter reads no component descriptions, so without these every
// <Name>.prompt.md carries only generated boilerplate, which for a compound
// component names parts (`Dialog.Item`, `Dialog.Group`) that don't exist.
// Run it after `npm run build`, as buildCmd does; it rewrites the folder whole.
//   node .design-sync/gen-docs.mjs
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = '.design-sync/docs';

// The JSDoc block that ends right before `declare <kind> <name>`, if any.
function jsdocBefore(text, name) {
  const decl = new RegExp(`declare\\s+(?:function|const|class)\\s+${name.replace(/\$/g, '\\$')}\\b`).exec(text);
  if (!decl) return '';
  const before = text.slice(0, decl.index);
  const end = before.lastIndexOf('*/');
  if (end < 0 || before.slice(end + 2).trim() !== '') return '';
  const start = before.lastIndexOf('/**', end);
  return before
    .slice(start + 3, end)
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, ''))
    .join('\n')
    .trim();
}

// A type alias's definition, up to the `;` that ends it at depth zero.
function typeDef(text, name) {
  const at = text.indexOf(`type ${name} = `);
  if (at < 0) return null;
  let depth = 0;
  for (let i = at + `type ${name} = `.length, start = i; i < text.length; i++) {
    const ch = text[i];
    if (ch === '=' && text[i + 1] === '>') i++;
    else if ('{(<'.includes(ch)) depth++;
    else if ('})>'.includes(ch)) depth--;
    else if (ch === ';' && depth === 0) return text.slice(start, i);
  }
  return null;
}

// Splits a definition at the `&`s that join its top-level members.
function intersected(def) {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < def.length; i++) {
    const ch = def[i];
    if (ch === '=' && def[i + 1] === '>') i++;
    else if ('{(<'.includes(ch)) depth++;
    else if ('})>'.includes(ch)) depth--;
    else if (ch === '&' && depth === 0) {
      out.push(def.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(def.slice(start).trim());
  return out;
}

// The first paragraph of a JSDoc body, on one line.
const firstParagraph = (doc) =>
  doc
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, ''))
    .join('\n')
    .split(/\n\s*\n|\n@/)[0]
    .replace(/\s+/g, ' ')
    .trim();

// A part's props: its own members with their docs, and what it extends.
function propsOf(text, fn) {
  const sig = new RegExp(`declare function ${fn.replace(/\$/g, '\\$')}\\(([^)]*)\\)`).exec(text)?.[1] ?? '';
  const type = /:\s*([A-Za-z0-9_$.<>]+)\s*$/.exec(sig)?.[1];
  if (!type) return '';
  const shown = type.replace(/\$\d+$/, '');
  const def = typeDef(text, type);
  if (!def) return `Props: \`${shown}\`.`;
  const lines = [];
  const bases = [];
  for (const member of intersected(def)) {
    if (!member.startsWith('{')) {
      bases.push(`\`${member.replace(/\s+/g, ' ')}\``);
      continue;
    }
    for (const m of member.matchAll(/(?:\/\*\*([\s\S]*?)\*\/\s*)?\n {2}(?:readonly )?["']?([\w-]+)["']?\??:/g)) {
      const doc = m[1] ? firstParagraph(m[1]) : '';
      lines.push(`- \`${m[2]}\`${doc ? `: ${doc}` : ''}`);
    }
  }
  if (bases.length) lines.push(`- everything in ${bases.join(' and ')}`);
  return `Props (\`${shown}\`):\n\n${lines.join('\n')}`;
}

const index = readFileSync('dist/index.d.ts', 'utf8');
const components = [...index.matchAll(/^import (\w+)(?:, \{[^}]*\})? from "\.\/components\/([\w-]+)\/index\.js";$/gm)];

rmSync(OUT, { force: true, recursive: true });
mkdirSync(OUT, { recursive: true });
const thin = [];
for (const [, name, dir] of components) {
  const file = join('dist', 'components', dir, 'index.d.ts');
  if (!existsSync(file)) continue;
  const text = readFileSync(file, 'utf8');
  const local = new RegExp(`(\\w+\\$?\\d*) as default\\b`).exec(text)?.[1] ?? name;
  const doc = jsdocBefore(text, local);
  const ns = new RegExp(`declare namespace ${local.replace(/\$/g, '\\$')} \\{([\\s\\S]*?)\\n\\}`).exec(text)?.[1] ?? '';
  const parts = [...ns.matchAll(/var (\w+): typeof (\w+);/g)].map(([, part, fn]) => {
    const partDoc = jsdocBefore(text, fn);
    const props = propsOf(text, fn);
    return `### \`${name}.${part}\`\n\n${partDoc ? `${partDoc}\n\n` : ''}${props}`.trimEnd();
  });
  if (!doc && !parts.length) {
    thin.push(name);
    continue;
  }
  const sections = [doc, parts.length ? `## Parts\n\n${parts.join('\n\n')}` : ''].filter(Boolean);
  writeFileSync(join(OUT, `${name}.md`), `${sections.join('\n\n')}\n`);
}
console.log(`docs: ${components.length - thin.length}/${components.length} written to ${OUT}`);
if (thin.length) console.log(`  no JSDoc and no parts, left to the converter's generated doc: ${thin.join(', ')}`);
