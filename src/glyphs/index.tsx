import type { ReactNode, SVGProps } from 'react'

import * as stylex from '@stylexjs/stylex'

import { mergeStyles } from '../styles/merge'
import { glyphStyles } from './styles'

// The glyphs the library's own controls draw: the check and the dash a
// checkbox shows, the plus and minus a number field's steppers show, and
// the magnifier and cross a search field shows. Inline SVG in
// `currentColor`, sized by whatever renders them, and private to the
// library — a call site with icons of its own passes them to IconButton and
// the slots that take a node, which is why nothing here is exported from
// the package.
//
// The paths are the check, the horizontal rule, the plus, the search, the
// close, the right and down chevrons, the two sort arrows, the back arrow,
// the drop-down arrow, the calendar, the schedule clock and the keyboard from
// Material Symbols on their 24-unit grid, which is what the checkbox page
// draws at 18dp, the icon buttons page at 20 and the search, menus, date
// picker and time picker pages at 24 — the date picker's menu
// buttons draw their arrow at 18, and a split button's menu button its
// chevron at between 22 and 50.

type GlyphProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'viewBox'>

// What a search view's back button draws, pointing at the page it returns
// to. It says "back" rather than "to the left", so whatever renders it
// mirrors it under a right-to-left writing mode, as ChevronEndGlyph's
// renderers do.
function ArrowBackGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </Glyph>
  )
}

// Which way a sorted column is ordered. Up is ascending and down is
// descending, which is the direction the data tables page puts beside a
// column header's name. Neither mirrors under a right-to-left writing mode:
// they say "up" and "down" rather than "onward", and those do not flip.
function ArrowDownwardGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" />
    </Glyph>
  )
}

// What a menu button draws after its label, pointing at the list it opens.
// Down is down in either writing direction, so it does not mirror.
function ArrowDropDownGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M7 10l5 5 5-5z" />
    </Glyph>
  )
}

function ArrowUpwardGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" />
    </Glyph>
  )
}

// What the date picker's trigger draws: the calendar a date is picked from.
function CalendarGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
    </Glyph>
  )
}

function CheckGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </Glyph>
  )
}

// What the time picker's trigger draws, and the button that takes its
// keyboard entry back to the dial: the clock a time is picked from.
function ClockGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
    </Glyph>
  )
}

/**
 * The svg every glyph draws: the 24-unit grid its path is on, the colour it
 * takes from the text around it, and its box. The call site's `className`
 * and `style` are merged with the glyph's own rather than replacing them.
 */
function Glyph({ children, ...props }: GlyphProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 24 24"
      {...props}
      {...mergeStyles(stylex.props(glyphStyles.glyph), props)}
    >
      {children}
    </svg>
  )
}

// What the time picker's dial draws on the button that switches it to typed
// entry.
function KeyboardGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 12H4V7h16v10zm-9-9h2v2h-2zm0 3h2v2h-2zM8 8h2v2H8zm0 3h2v2H8zm-3 0h2v2H5zm0-3h2v2H5zm3 6h8v2H8zm6-3h2v2h-2zm0-3h2v2h-2zm3 3h2v2h-2zm0-3h2v2h-2z" />
    </Glyph>
  )
}

// The same rule stands for a partly selected checkbox and for a stepper's
// decrement; the two names say which is meant at the call site.
function MinusGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M19 13H5v-2h14v2z" />
    </Glyph>
  )
}

const IndeterminateGlyph = MinusGlyph

// Points down at the menu a split button's second half opens.
function ChevronDownGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z" />
    </Glyph>
  )
}

// Points at the submenu a menu item opens. It says "further in" rather than
// "to the right", so whatever renders it mirrors it under a right-to-left
// writing mode — the glyph itself carries no direction of its own, since a
// transform here would be an inline style.
function ChevronEndGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
    </Glyph>
  )
}

function CloseGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </Glyph>
  )
}

function PlusGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </Glyph>
  )
}

function SearchGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </Glyph>
  )
}

export {
  ArrowBackGlyph,
  ArrowDownwardGlyph,
  ArrowDropDownGlyph,
  ArrowUpwardGlyph,
  CalendarGlyph,
  CheckGlyph,
  ChevronDownGlyph,
  ChevronEndGlyph,
  ClockGlyph,
  CloseGlyph,
  IndeterminateGlyph,
  KeyboardGlyph,
  MinusGlyph,
  PlusGlyph,
  SearchGlyph,
}
