import * as stylex from '@stylexjs/stylex'

import { typography } from '../tokens/design.tokens.stylex'

// The probe `useEnlargedText` measures, in src/hooks/useEnlargedText.ts. It is
// as wide as its own font and as tall as the same size written as a length,
// the type size navigation labels are set in. A reader's text-only zoom —
// Firefox's and Safari's "Zoom Text Only", and the text scale Firefox takes
// from Windows and Android — and a browser's minimum font size grow the font
// and leave the length alone, so the probe comes out wider than it is tall.
// Page zoom grows both, and so does a theme giving the role another size, so
// neither does.
//
// Fixed at the window's corner and hidden, so it takes no room and no
// pointer, and horizontal whatever the page's writing mode, so its width is
// the font's.
const textScaleStyles = stylex.create({
  probe: {
    blockSize: typography.labelMediumSize,
    boxSizing: 'border-box',
    display: 'block',
    fontSize: typography.labelMediumSize,
    inlineSize: '1em',
    insetBlockStart: 0,
    insetInlineStart: 0,
    pointerEvents: 'none',
    position: 'fixed',
    visibility: 'hidden',
    writingMode: 'horizontal-tb',
  },
})

export { textScaleStyles }
