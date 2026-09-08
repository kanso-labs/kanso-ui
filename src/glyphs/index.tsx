import type { SVGProps } from 'react'

// The glyphs the library's own controls draw: the check and the dash a
// checkbox shows. Inline SVG in `currentColor`, sized by whatever renders
// them, and private to the library — a call site with icons of its own
// passes them to IconButton and the slots that take a node, which is why
// nothing here is exported from the package.
//
// The paths are the check and the horizontal rule from Material Symbols on
// their 24-unit grid, which is what the checkbox page draws at 18dp.

type GlyphProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'viewBox'>

function CheckGlyph(props: GlyphProps) {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  )
}

function IndeterminateGlyph(props: GlyphProps) {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M19 13H5v-2h14v2z" />
    </svg>
  )
}

export type { GlyphProps }

export { CheckGlyph, IndeterminateGlyph }
