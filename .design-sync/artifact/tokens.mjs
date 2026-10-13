// Maps src/tokens/design.tokens.json to the Design System artifact's
// project/tokens.json and back. README.md beside this file is the procedure
// this serves.
//
//   node .design-sync/artifact/tokens.mjs build <out.json> [--ref main@<sha>]
//       Writes the artifact's tokens.json from the repository.
//   node .design-sync/artifact/tokens.mjs pull <artifact tokens.json> [--base <sha>]
//       Applies the edits made in the artifact since <base> (default: the sha
//       in the file's meta.ref) to design.tokens.json and notes.json, and
//       prints what it changed, what clashed with a repository edit, and what
//       it could not map.
//   node .design-sync/artifact/tokens.mjs check
//       Proves the two directions agree: a pull of an unedited build changes
//       nothing, and one edit of each kind lands where it should.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('../..', import.meta.url).pathname;
const HERE = new URL('.', import.meta.url).pathname;
const TOKENS_PATH = `${ROOT}src/tokens/design.tokens.json`;
const NOTES_PATH = `${HERE}notes.json`;

// The order the artifact lists the colour roles in: Material Design's, which
// keeps a role beside its on-colour. A role the token file gains goes last.
const ROLE_ORDER = [
  'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer', 'primaryFixed', 'primaryFixedDim', 'onPrimaryFixed', 'onPrimaryFixedVariant', 'inversePrimary',
  'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer', 'secondaryFixed', 'secondaryFixedDim', 'onSecondaryFixed', 'onSecondaryFixedVariant',
  'tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer', 'tertiaryFixed', 'tertiaryFixedDim', 'onTertiaryFixed', 'onTertiaryFixedVariant',
  'error', 'onError', 'errorContainer', 'onErrorContainer', 'positive', 'onPositive', 'positiveContainer', 'onPositiveContainer', 'negative', 'onNegative', 'negativeContainer', 'onNegativeContainer',
  'surface', 'onSurface', 'surfaceVariant', 'onSurfaceVariant', 'surfaceDim', 'surfaceBright', 'surfaceContainerLowest', 'surfaceContainerLow', 'surfaceContainer', 'surfaceContainerHigh', 'surfaceContainerHighest', 'surfaceTint',
  'background', 'onBackground', 'inverseSurface', 'inverseOnSurface', 'outline', 'outlineVariant', 'scrim', 'shadow',
];
const TYPE_GROUPS = ['display', 'headline', 'title', 'body', 'label'];
const SPACING_STEPS = ['xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'];
const RADIUS_STEPS = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'pill', 'circle'];
const FONTS = [
  { family: 'Roboto Flex', file: 'fonts/roboto-flex-latin-opsz-normal.woff2', style: 'normal', weight: '100 1000' },
  { family: 'Roboto Serif', file: 'fonts/roboto-serif-latin-opsz-normal.woff2', style: 'normal', weight: '100 900' },
  { family: 'Roboto Mono', file: 'fonts/roboto-mono-latin-wght-normal.woff2', style: 'normal', weight: '100 700' },
];

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const own = (o) => Object.keys(o).filter((k) => !k.startsWith('$'));
const leaf = (ref) => ref.replace(/^\{|\}$/g, '').split('.').at(-1);
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const clone = (o) => structuredClone(o);

function paletteName(ref) {
  const m = /^\{color\.(\w+)\.(\d+)\}$/.exec(ref);
  if (!m) throw new Error(`not a palette reference: ${ref}`);
  return `color-${kebab(m[1])}-${m[2]}`;
}

function stack(list) {
  return list.map((f) => (f.includes(' ') ? `'${f}'` : f)).join(', ');
}

function unstack(s) {
  return s.split(',').map((f) => f.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
}

function shadowCss(layers) {
  return layers.map((l) => `${l.offsetX} ${l.offsetY} ${l.blur} ${l.spread} ${l.color}`).join(', ');
}

function unshadow(css) {
  const layers = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i <= css.length; i++) {
    const c = css[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if ((c === ',' && depth === 0) || i === css.length) {
      const parts = css.slice(start, i).trim().match(/(?:[^\s(]+(?:\([^)]*\))?)/g) ?? [];
      if (parts.length !== 5) return null;
      const [offsetX, offsetY, blur, spread, color] = parts;
      layers.push({ color, offsetX, offsetY, blur, spread });
      start = i + 1;
    }
  }
  return layers;
}

/** Each public component by its export name, with its entry: the folder's name in PascalCase. */
export function componentPaths() {
  const dirs = readdirSync(`${ROOT}src/components`).filter((d) => existsSync(`${ROOT}src/components/${d}/index.tsx`));
  return Object.fromEntries(dirs.sort().map((d) => [d.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join(''), `src/components/${d}/index.tsx`]));
}

const paletteUsage = (notes, palette, tone) =>
  `${notes.palettes[palette]}, tone ${tone}. Reference tier: reach for a \`kui-color-*\` role instead.`;

/** The artifact's tokens.json for a token file and its notes. */
export function toArtifact(src, notes, meta = {}) {
  const usage = (name, fallback) => notes.tokens[name] ?? fallback;
  const light = src.semantic.light;
  const dark = src.semantic.dark;
  const roles = [...ROLE_ORDER.filter((r) => r in light), ...own(light).filter((r) => !ROLE_ORDER.includes(r)).sort()];
  const color = roles.map((r) => {
    const name = `kui-color-${kebab(r)}`;
    return {
      name,
      usage: usage(name, ''),
      value: { dark: `{${paletteName(dark[r].$value)}}`, light: `{${paletteName(light[r].$value)}}` },
    };
  });
  for (const palette of own(src.color)) {
    for (const tone of own(src.color[palette])) {
      const name = `color-${kebab(palette)}-${tone}`;
      color.push({ name, usage: usage(name, paletteUsage(notes, palette, tone)), value: src.color[palette][tone].$value.toLowerCase() });
    }
  }

  const weights = Object.fromEntries(own(src.typography.fontWeight).map((k) => [k, src.typography.fontWeight[k].$value]));
  const scale = src.typography.scale;
  const groups = TYPE_GROUPS.map((g) => {
    const styles = ['Large', 'Medium', 'Small'].map((size) => {
      const name = g + size;
      const s = scale[name];
      return {
        family: leaf(s.font.$value),
        fontSize: s.size.$value,
        fontWeight: weights[leaf(s.weight.$value)],
        letterSpacing: s.tracking.$value,
        lineHeight: s.lineHeight.$value,
        name,
        sample: notes.styles[name].sample,
        usage: notes.styles[name].usage,
      };
    });
    return { family: styles[0].family, name: g[0].toUpperCase() + g.slice(1), styles };
  });
  const families = Object.fromEntries(['brand', 'plain', 'mono'].map((k) => [k, stack(src.typography.fontFamily[k].$value)]));

  const dims = (group, prefix, steps) =>
    steps.map((k) => {
      const name = `${prefix}-${kebab(k)}`;
      return { name, usage: usage(name, ''), value: src[group].primitive[leaf(src[group].component[k].$value)].$value };
    });
  const shadow = [1, 2, 3, 4, 5].map((i) => {
    const name = `kui-shadow-elevation${i}`;
    return { name, usage: usage(name, ''), value: shadowCss(src.shadow[String(i)].$value) };
  });
  const opacity = own(src.stateLayerOpacity).map((k) => {
    const name = `kui-state-layer-opacity-${kebab(k)}`;
    return { name, usage: usage(name, ''), value: String(src.stateLayerOpacity[k].$value) };
  });

  return {
    name: 'Kanso UI',
    version: 1,
    color: { themes: [{ id: 'light', name: 'Light' }, { id: 'dark', name: 'Dark' }], tokens: color },
    type: { fonts: FONTS, families, groups },
    spacing: { note: notes.families.spacing, tokens: dims('spacing', 'kui-spacing', SPACING_STEPS) },
    radius: { note: notes.families.radius, tokens: dims('radii', 'kui-radius', RADIUS_STEPS) },
    shadow: { note: notes.families.shadow, tokens: shadow },
    sizing: { note: notes.families.sizing, tokens: dims('sizing', 'kui-sizing', own(src.sizing.component)) },
    opacity: { note: notes.families.opacity, tokens: opacity },
    meta: {
      source: 'github',
      repo: 'kanso-labs/kanso-ui',
      ref: meta.ref ?? 'main',
      package: '.',
      paths: { tokens: ['src/tokens/design.tokens.json'], fonts: ['.design-sync/fonts/'], assets: [], docs: ['README.md', 'AGENTS.md', 'src/components/*/index.tsx'] },
      components: meta.components ?? {},
      synced: meta.synced ?? new Date().toISOString().slice(0, 10),
    },
  };
}

// Flattens an artifact tokens.json into "<kind> <name> <field>" -> value, the
// unit the three-way comparison works in.
function flatten(t) {
  const out = new Map();
  const put = (key, v) => out.set(key, JSON.stringify(v));
  for (const tok of t.color?.tokens ?? []) {
    const v = tok.value;
    if (typeof v === 'string') put(`color ${tok.name} value`, { dark: v, light: v });
    else put(`color ${tok.name} value`, { dark: v.dark ?? v.light, light: v.light });
    put(`color ${tok.name} usage`, tok.usage ?? '');
  }
  for (const g of t.type?.groups ?? []) {
    for (const s of g.styles) {
      for (const f of ['family', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight', 'sample', 'usage']) put(`style ${s.name} ${f}`, s[f] ?? (f === 'family' ? g.family : undefined));
    }
  }
  for (const [k, v] of Object.entries(t.type?.families ?? {})) put(`family ${k} value`, v);
  for (const fam of ['spacing', 'radius', 'shadow', 'sizing', 'opacity']) {
    put(`note ${fam} value`, t[fam]?.note ?? '');
    for (const tok of t[fam]?.tokens ?? []) {
      put(`${fam} ${tok.name} value`, tok.value);
      put(`${fam} ${tok.name} usage`, tok.usage ?? '');
    }
  }
  return out;
}

function findPrimitive(group, value, src) {
  const prims = src[group].primitive;
  const hit = own(prims).find((k) => prims[k].$value === value);
  if (hit) return hit;
  const px = /^(\d+)px$/.exec(value);
  if (px && !(px[1] in prims)) {
    prims[px[1]] = { $value: value };
    return px[1];
  }
  return null;
}

// Applies one artifact field to the token file or the notes; returns null when
// it landed, or why it could not.
function apply(key, raw, src, notes) {
  const [kind, name, field] = key.split(' ');
  const value = raw === undefined ? undefined : JSON.parse(raw);
  if (value === undefined) return 'removed in the artifact';
  if (field === 'usage') {
    if (kind === 'style') return (notes.styles[name].usage = value), null;
    notes.tokens[name] = value;
    return null;
  }
  if (kind === 'note') return (notes.families[name] = value), null;
  if (kind === 'style') {
    const s = src.typography.scale[name];
    if (!s) return 'a type style the token file does not have';
    if (field === 'sample') return (notes.styles[name].sample = value), null;
    if (field === 'family') {
      if (!(value in src.typography.fontFamily)) return `no font family "${value}"`;
      return (s.font.$value = `{typography.fontFamily.${value}}`), null;
    }
    if (field === 'fontWeight') {
      const w = own(src.typography.fontWeight).find((k) => String(src.typography.fontWeight[k].$value) === String(value));
      if (!w) return `no font weight token is ${value}`;
      return (s.weight.$value = `{typography.fontWeight.${w}}`), null;
    }
    const target = { fontSize: 'size', letterSpacing: 'tracking', lineHeight: 'lineHeight' }[field];
    return (s[target].$value = value), null;
  }
  if (kind === 'family') {
    if (!(name in src.typography.fontFamily)) return 'a font family the token file does not have';
    return (src.typography.fontFamily[name].$value = unstack(value)), null;
  }
  if (kind === 'color') {
    const palette = /^color-([a-z-]+)-(\d+)$/.exec(name);
    if (palette) {
      const p = camel(palette[1]);
      if (!src.color[p]?.[palette[2]]) return 'a palette tone the token file does not have';
      if (!/^#[0-9a-f]{6}$/i.test(value.light)) return `a palette tone takes a #rrggbb value, not ${value.light}`;
      if (value.dark !== value.light) return 'a palette tone is the same in both themes';
      const old = src.color[p][palette[2]].$value;
      if (old.toLowerCase() !== value.light.toLowerCase()) src.color[p][palette[2]].$value = value.light;
      return null;
    }
    const role = /^kui-color-([a-z-]+)$/.exec(name);
    if (!role || !(camel(role[1]) in src.semantic.light)) return 'a colour the token file does not have';
    for (const theme of ['light', 'dark']) {
      const m = /^\{color-([a-z-]+)-(\d+)\}$/.exec(value[theme]);
      if (!m || !src.color[camel(m[1])]?.[m[2]]) return `a role points at a palette tone; ${theme} is ${value[theme]}`;
    }
    for (const theme of ['light', 'dark']) {
      const m = /^\{color-([a-z-]+)-(\d+)\}$/.exec(value[theme]);
      src.semantic[theme][camel(role[1])].$value = `{color.${camel(m[1])}.${m[2]}}`;
    }
    return null;
  }
  if (kind === 'opacity') {
    const k = camel(name.replace(/^kui-state-layer-opacity-/, ''));
    if (!(k in src.stateLayerOpacity)) return 'an opacity the token file does not have';
    const n = Number(value);
    if (!(n >= 0 && n <= 1)) return `an opacity is a number from 0 to 1, not ${value}`;
    return (src.stateLayerOpacity[k].$value = n), null;
  }
  if (kind === 'shadow') {
    const level = /^kui-shadow-elevation(\d)$/.exec(name)?.[1];
    if (!level || !src.shadow[level]) return 'a shadow the token file does not have';
    const layers = unshadow(value);
    if (!layers) return `a shadow is layers of "x y blur spread colour", not ${value}`;
    return (src.shadow[level].$value = layers), null;
  }
  const group = { radius: 'radii', sizing: 'sizing', spacing: 'spacing' }[kind];
  const step = camel(name.replace(`kui-${kind}-`, ''));
  if (!group || !(step in src[group].component)) return `a ${kind} token the token file does not have`;
  const prim = findPrimitive(group, value, src);
  if (!prim) return `no ${group} primitive is ${value}, and only an Npx value can add one`;
  src[group].component[step].$value = `{${group}.primitive.${prim}}`;
  return null;
}

/**
 * Applies the artifact's edits since `base` to `head`. A field the artifact
 * left as it was at base is the repository's to keep; a field it changed wins,
 * and if the repository also changed it the clash is reported.
 */
export function pull({ artifact, base, head }) {
  const src = clone(head.src);
  const notes = clone(head.notes);
  const was = flatten(toArtifact(base.src, base.notes));
  const repo = flatten(toArtifact(head.src, head.notes));
  const now = flatten(artifact);
  const changed = [];
  const clashes = [];
  const unmapped = [];
  for (const key of new Set([...was.keys(), ...now.keys()])) {
    if (now.get(key) === was.get(key)) continue;
    if (!was.has(key)) {
      const token = key.split(' ').slice(0, 2).join(' ');
      if (!unmapped.some((u) => u.key === token)) unmapped.push({ key: token, reason: 'added in the artifact', value: now.get(key) });
      continue;
    }
    if (repo.get(key) !== was.get(key) && repo.get(key) !== now.get(key)) clashes.push({ artifact: now.get(key), key, repository: repo.get(key) });
    const reason = apply(key, now.get(key), src, notes);
    if (reason) unmapped.push({ key, reason, value: now.get(key) });
    else changed.push({ from: repo.get(key), key, to: now.get(key) });
  }
  return { changed, clashes, notes, src, unmapped };
}

function atRef(sha, path, fallback) {
  try {
    return JSON.parse(execFileSync('git', ['-C', ROOT, 'show', `${sha}:${path}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch {
    return fallback;
  }
}

// The token file keeps its own key order and escapes, and a JavaScript object
// would not: integer-like keys such as palette tones jump ahead of
// "$description". So a pull edits the file's text in place, value by value,
// and lets oxfmt rewrap what it touched.
function spans(text) {
  const map = new Map();
  let i = 0;
  const ws = () => {
    while (/\s/.test(text[i])) i++;
  };
  const str = () => {
    const s = i++;
    while (text[i] !== '"') i += text[i] === '\\' ? 2 : 1;
    i++;
    return JSON.parse(text.slice(s, i));
  };
  const value = (path) => {
    ws();
    const start = i;
    const node = { children: [], start };
    if (text[i] === '{') {
      i++;
      ws();
      while (text[i] !== '}') {
        ws();
        const keyStart = i;
        const key = str();
        ws();
        i++; // the colon
        const child = value([...path, key]);
        node.children.push({ end: child.end, key, keyStart });
        ws();
        if (text[i] === ',') i++;
        ws();
      }
      i++;
    } else if (text[i] === '[') {
      i++;
      ws();
      let n = 0;
      while (text[i] !== ']') {
        value([...path, n++]);
        ws();
        if (text[i] === ',') i++;
        ws();
      }
      i++;
    } else if (text[i] === '"') {
      str();
    } else {
      while (i < text.length && !/[\s,\]}]/.test(text[i])) i++;
    }
    node.end = i;
    map.set(JSON.stringify(path), node);
    return node;
  };
  value([]);
  return map;
}

function edits(a, b, path = [], out = []) {
  const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);
  if (isObj(a) && isObj(b)) {
    for (const key of Object.keys(b)) {
      if (!(key in a)) out.push({ key, path, type: 'insert', value: b[key] });
      else edits(a[key], b[key], [...path, key], out);
    }
  } else if (JSON.stringify(a) !== JSON.stringify(b)) {
    out.push({ path, type: 'replace', value: b });
  }
  return out;
}

export function patchText(text, before, after) {
  const map = spans(text);
  const ops = [];
  for (const e of edits(before, after)) {
    const node = map.get(JSON.stringify(e.path));
    if (e.type === 'replace') {
      ops.push({ at: node.start, end: node.end, text: JSON.stringify(e.value) });
      continue;
    }
    // A new key goes before the first sibling that sorts after it, numerically
    // where both are numbers, so a new primitive lands in its place on the scale.
    const later = node.children.find((c) => !c.key.startsWith('$') && (/^\d+$/.test(c.key) && /^\d+$/.test(e.key) ? Number(c.key) > Number(e.key) : c.key > e.key));
    const entry = `${JSON.stringify(e.key)}: ${JSON.stringify(e.value, null, 2)}`;
    if (later) ops.push({ at: later.keyStart, end: later.keyStart, text: `${entry}, ` });
    else if (node.children.length) ops.push({ at: node.children.at(-1).end, end: node.children.at(-1).end, text: `, ${entry}` });
    else ops.push({ at: node.start + 1, end: node.start + 1, text: entry });
  }
  ops.sort((x, y) => y.at - x.at);
  let out = text;
  for (const op of ops) out = out.slice(0, op.at) + op.text + out.slice(op.end);
  return out;
}

function sortKeys(o) {
  if (Array.isArray(o)) return o.map(sortKeys);
  if (o && typeof o === 'object') return Object.fromEntries(Object.keys(o).sort().map((k) => [k, sortKeys(o[k])]));
  return o;
}

function check() {
  const src = readJson(TOKENS_PATH);
  const notes = readJson(NOTES_PATH);
  const head = { notes, src };
  const built = toArtifact(src, notes, { ref: 'main@check' });
  const same = pull({ artifact: built, base: head, head });
  const fail = [];
  if (same.changed.length || same.unmapped.length) fail.push(`an unedited build pulled changes: ${JSON.stringify([...same.changed, ...same.unmapped].slice(0, 3))}`);
  const edit = (fn) => {
    const a = clone(built);
    fn(a);
    return pull({ artifact: a, base: head, head });
  };
  const tok = (a, fam, name) => (fam === 'color' ? a.color.tokens : a[fam].tokens).find((t) => t.name === name);
  const cases = [
    ['role', (a) => (tok(a, 'color', 'kui-color-primary').value.light = '{color-primary-30}'), (r) => r.src.semantic.light.primary.$value === '{color.primary.30}' && r.src.semantic.dark.primary.$value === src.semantic.dark.primary.$value],
    ['palette', (a) => (tok(a, 'color', 'color-primary-40').value = '#123456'), (r) => r.src.color.primary['40'].$value === '#123456'],
    ['usage', (a) => (tok(a, 'color', 'kui-color-surface').usage = 'Edited.'), (r) => r.notes.tokens['kui-color-surface'] === 'Edited.'],
    ['spacing', (a) => (tok(a, 'spacing', 'kui-spacing-lg').value = '20px'), (r) => r.src.spacing.component.lg.$value === '{spacing.primitive.20}'],
    ['new primitive', (a) => (tok(a, 'radius', 'kui-radius-md').value = '10px'), (r) => r.src.radii.component.md.$value === '{radii.primitive.10}' && r.src.radii.primitive['10'].$value === '10px'],
    ['sizing', (a) => (tok(a, 'sizing', 'kui-sizing-control-sm').value = '48px'), (r) => r.src.sizing.component.controlSm.$value === '{sizing.primitive.48}'],
    ['shadow', (a) => (tok(a, 'shadow', 'kui-shadow-elevation1').value = '0px 2px 4px 0px rgba(0, 0, 0, 0.2)'), (r) => JSON.stringify(r.src.shadow['1'].$value) === JSON.stringify([{ color: 'rgba(0, 0, 0, 0.2)', offsetX: '0px', offsetY: '2px', blur: '4px', spread: '0px' }])],
    ['opacity', (a) => (tok(a, 'opacity', 'kui-state-layer-opacity-hover').value = '0.12'), (r) => r.src.stateLayerOpacity.hover.$value === 0.12],
    ['type size', (a) => (a.type.groups[3].styles[0].fontSize = '17px'), (r) => r.src.typography.scale.bodyLarge.size.$value === '17px'],
    ['type weight', (a) => (a.type.groups[3].styles[0].fontWeight = 500), (r) => r.src.typography.scale.bodyLarge.weight.$value === '{typography.fontWeight.medium}'],
    ['family', (a) => (a.type.families.plain = "'Inter', system-ui, sans-serif"), (r) => JSON.stringify(r.src.typography.fontFamily.plain.$value) === '["Inter","system-ui","sans-serif"]'],
    ['unmapped', (a) => a.color.tokens.push({ name: 'brand-accent', value: '#ff0000' }), (r) => r.unmapped.length === 1 && r.changed.length === 0],
  ];
  for (const [label, fn, ok] of cases) {
    const r = edit(fn);
    if (!ok(r)) fail.push(`${label}: ${JSON.stringify({ changed: r.changed, unmapped: r.unmapped })}`);
  }
  // The text patch reproduces the object edit without reordering the file.
  const text = readFileSync(TOKENS_PATH, 'utf8');
  for (const [label, fn] of cases.slice(0, 11)) {
    const r = edit(fn);
    const patched = patchText(text, src, r.src);
    if (JSON.stringify(sortKeys(JSON.parse(patched))) !== JSON.stringify(sortKeys(r.src))) fail.push(`${label}: the text patch disagrees with the edit`);
    if (patchText(text, src, src) !== text) fail.push('an empty patch changed the text');
  }
  // A repository edit the artifact never touched survives a pull.
  const moved = clone(src);
  moved.color.primary['40'].$value = '#000001';
  const kept = pull({ artifact: built, base: head, head: { notes, src: moved } });
  if (kept.src.color.primary['40'].$value !== '#000001' || kept.changed.length) fail.push('a repository edit was reverted by a pull');
  if (fail.length) {
    console.error(fail.join('\n'));
    process.exit(1);
  }
  console.log(`tokens.mjs check: round trip clean, ${cases.length} edits land, repository edits kept`);
}

const isCli = process.argv[1] && new URL(import.meta.url).pathname === process.argv[1];
const [cmd, file, ...rest] = isCli ? process.argv.slice(2) : [];
const flag = (name) => {
  const i = rest.indexOf(name);
  return i === -1 ? undefined : rest[i + 1];
};
if (cmd === 'build') {
  const out = toArtifact(readJson(TOKENS_PATH), readJson(NOTES_PATH), { components: componentPaths(), ref: flag('--ref') });
  writeFileSync(file, `${JSON.stringify(out, null, 1)}\n`);
  console.log(`wrote ${file}: ${out.color.tokens.length} colours, ${out.type.groups.reduce((n, g) => n + g.styles.length, 0)} type styles`);
} else if (cmd === 'pull') {
  const artifact = readJson(file);
  const baseSha = flag('--base') ?? /@([0-9a-f]{7,40})$/.exec(artifact.meta?.ref ?? '')?.[1];
  if (!baseSha) throw new Error('no --base and no sha in the artifact meta.ref');
  const head = { notes: readJson(NOTES_PATH), src: readJson(TOKENS_PATH) };
  const base = { notes: atRef(baseSha, '.design-sync/artifact/notes.json', head.notes), src: atRef(baseSha, 'src/tokens/design.tokens.json') };
  if (!base.src) throw new Error(`cannot read design.tokens.json at ${baseSha}`);
  const r = pull({ artifact, base, head });
  writeFileSync(TOKENS_PATH, patchText(readFileSync(TOKENS_PATH, 'utf8'), head.src, r.src));
  execFileSync(`${ROOT}node_modules/.bin/oxfmt`, [TOKENS_PATH], { stdio: ['ignore', 'ignore', 'inherit'] });
  // The StyleX token modules are generated from the token file; a pull that
  // left them behind would change nothing a component draws.
  if (r.changed.some((c) => !c.key.endsWith(' usage') && !c.key.startsWith('note ') && !c.key.endsWith(' sample'))) {
    execFileSync(process.execPath, [`${ROOT}scripts/build-tokens.mjs`], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });
  }
  writeFileSync(NOTES_PATH, `${JSON.stringify(sortKeys(r.notes), null, 2)}\n`);
  console.log(JSON.stringify({ base: baseSha, changed: r.changed, clashes: r.clashes, unmapped: r.unmapped }, null, 2));
} else if (cmd === 'check') {
  check();
} else if (isCli) {
  console.error('usage: tokens.mjs build <out.json> [--ref main@<sha>] | pull <tokens.json> [--base <sha>] | check');
  process.exit(2);
}
