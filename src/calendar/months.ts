// Apart from ./index.tsx so that file exports components alone, which is what
// keeps fast refresh working for it — the same arrangement `src/row` uses.

/**
 * One offset per visible month, so `visibleDuration` of more than one draws
 * the months side by side rather than one grid that scrolls between them.
 * React Aria positions each grid from its own offset; the heading names the
 * whole range, which is what its own `Heading` renders.
 */
function monthOffsets(months: number) {
  return Array.from({ length: Math.max(1, months) }, (_unused, index) => ({
    months: index,
  }))
}

export { monthOffsets }
