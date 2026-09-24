import * as stylex from '@stylexjs/stylex'

// The glyphs' one style, apart from the glyphs in ./index.tsx so that file
// exports components alone, which is what keeps fast refresh working for it.
//
// Every glyph is sized by whatever renders it, so the box it is sized in is
// set here rather than beside each of those sizes: an element given an
// explicit size sets `border-box`, and keeping that on the glyph is what
// stops a new call site sizing one from forgetting it.
const glyphStyles = stylex.create({
  glyph: {
    boxSizing: 'border-box',
  },
})

export { glyphStyles }
