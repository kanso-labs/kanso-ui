// Counts the pixels that differ between each storybook shot of a component
// and its preview shot. The preview pads a story 24px where storybook pads
// 16px, so in-flow content sits at (+8, +8); centred content moves (0, +8),
// and an overlay fixed to the viewport does not move at all, so each pair is
// diffed at all four offsets and the closest is reported. Both canvases count
// as one background. A story with 0 differing pixels renders identically;
// Overviews compare against the full-height shot tallshot.mjs writes, when
// there is one, and differ where prose rewraps on the narrower frame. A
// channel above the threshold counts: 24 by default, which antialiasing and
// the canvas tint stay under; 8 asks whether a token moved, since the tint
// moves a channel by 8 at most. Grading aid only.
//   node .design-sync/pairdiff.mjs <Name>[,<Name>] [--threshold 8]
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const { chromium } = await import(resolve('.ds-sync/node_modules/playwright/index.mjs'));

const RAW = 'ds-bundle/_screenshots/compare/raw';
const TALL = 'ds-bundle/_screenshots/tall';
const base64 = (file) => readFileSync(file).toString('base64');
const at = process.argv.indexOf('--threshold');
const threshold = at > 0 ? Number(process.argv[at + 1]) : 24;
const OFFSETS = [[8, 8], [0, 8], [0, 0], [8, 0]];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const name of process.argv[2].split(',')) {
  const pairs = readdirSync(RAW).filter((f) => f.startsWith(`components__${name}__`) && f.endsWith('__sb.png'));
  for (const storybook of pairs) {
    const story = storybook.slice(`components__${name}__`.length, -'__sb.png'.length);
    const tall = join(TALL, `${name}__Overview.png`);
    const preview = story.endsWith('overview') && existsSync(tall) ? tall : join(RAW, storybook.replace('__sb.png', '__ds.png'));
    const result = await page.evaluate(
      async ({ a, b, offsets, threshold }) => {
        const pixels = async (data) => {
          const image = new Image();
          image.src = `data:image/png;base64,${data}`;
          await image.decode();
          const canvas = new OffscreenCanvas(image.width, image.height);
          const context = canvas.getContext('2d');
          context.drawImage(image, 0, 0);
          return { data: context.getImageData(0, 0, image.width, image.height).data, height: image.height, width: image.width };
        };
        const sb = await pixels(a);
        const ds = await pixels(b);
        const sbCanvas = (o) => Math.abs(sb.data[o] - 254) <= 2 && Math.abs(sb.data[o + 1] - 247) <= 2 && Math.abs(sb.data[o + 2] - 255) <= 2;
        const dsCanvas = (o) => ds.data[o] >= 253 && ds.data[o + 1] >= 253 && ds.data[o + 2] >= 253;
        const diff = ([dx, dy]) => {
          let differing = 0;
          const bands = new Set();
          for (let y = 0; y < sb.height && y + dy < ds.height; y++) {
            for (let x = 0; x < sb.width && x + dx < ds.width; x++) {
              const o = (y * sb.width + x) * 4;
              const p = ((y + dy) * ds.width + x + dx) * 4;
              if (sbCanvas(o) && dsCanvas(p)) continue;
              const delta = Math.max(...[0, 1, 2].map((c) => Math.abs(sb.data[o + c] - ds.data[p + c])));
              if (delta > threshold) {
                differing++;
                bands.add(Math.floor(y / 20));
              }
            }
          }
          return { bands: bands.size, differing, offset: `(${dx}, ${dy})` };
        };
        const best = offsets.map(diff).reduce((a, b) => (b.differing < a.differing ? b : a));
        return { ...best, ds: `${ds.width}x${ds.height}`, sb: `${sb.width}x${sb.height}` };
      },
      { a: base64(join(RAW, storybook)), b: base64(preview), offsets: OFFSETS, threshold },
    );
    const from = preview.startsWith(TALL) ? ' (full-height shot)' : '';
    console.log(`${name} ${story}${from}: ${result.differing} px differ at ${result.offset}, in ${result.bands} 20px bands (storybook ${result.sb}, preview ${result.ds})`);
  }
}
await browser.close();
