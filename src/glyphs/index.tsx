import type { SVGProps } from 'react'

// The glyphs the library's own controls draw: the check and the dash a
// checkbox shows, the plus and minus a number field's steppers show, and
// the magnifier and cross a search field shows. Inline SVG in
// `currentColor`, sized by whatever renders them, and private to the
// library — a call site with icons of its own passes them to IconButton and
// the slots that take a node, which is why nothing here is exported from
// the package.
//
// The paths are the check, the horizontal rule, the plus, the search, the
// close and the right chevron from Material Symbols on their 24-unit grid,
// which is what the checkbox page draws at 18dp, the icon buttons page at 20
// and the search and menus pages at 24.

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

// Points at the submenu a menu item opens. It says "further in" rather than
// "to the right", so whatever renders it mirrors it under a right-to-left
// writing mode — the glyph itself carries no direction of its own, since a
// transform here would be an inline style.
function ChevronEndGlyph(props: GlyphProps) {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
    </svg>
  )
}

function CloseGlyph(props: GlyphProps) {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  )
}

function PlusGlyph(props: GlyphProps) {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  )
}

function SearchGlyph(props: GlyphProps) {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
  )
}

export type { GlyphProps }

export {
  CheckGlyph,
  ChevronEndGlyph,
  CloseGlyph,
  IndeterminateGlyph,
  MinusGlyph,
  PlusGlyph,
  SearchGlyph,
}
