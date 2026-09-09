import type { SVGProps } from 'react'

// The glyphs the library's own controls draw: the check and the dash a
// checkbox shows, and the plus and minus a number field's steppers show.
// Inline SVG in `currentColor`, sized by whatever renders them, and private
// to the library — a call site with icons of its own passes them to
// IconButton and the slots that take a node, which is why nothing here is
// exported from the package.
//
// The paths are the check, the horizontal rule and the plus from Material
// Symbols on their 24-unit grid, which is what the checkbox page draws at
// 18dp and the icon buttons page at 20.

type GlyphProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'viewBox'>

function CheckGlyph(props: GlyphProps) {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  )
}

// The same rule stands for a partly selected checkbox and for a stepper's
// decrement; the two names say which is meant at the call site.
function MinusGlyph(props: GlyphProps) {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M19 13H5v-2h14v2z" />
    </svg>
  )
}

const IndeterminateGlyph = MinusGlyph

function PlusGlyph(props: GlyphProps) {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  )
}

export type { GlyphProps }

export { CheckGlyph, IndeterminateGlyph, MinusGlyph, PlusGlyph }
