import type { ReactNode, SVGProps } from 'react'

import {
  arrowBackPath,
  arrowDownwardPath,
  arrowDropDownPath,
  arrowUpwardPath,
  calendarPath,
  checkCirclePath,
  checkPath,
  chevronDownPath,
  chevronEndPath,
  clockPath,
  closePath,
  errorPath,
  gridSize,
  keyboardPath,
  minusPath,
  personPath,
  plusPath,
  searchPath,
} from '@kanso-labs/kanso-ui-core/glyphs'
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
// The paths are @kanso-labs/kanso-ui-core's, the ones react-native-kanso-ui
// draws too: the check, the horizontal rule, the plus, the search, the close,
// the right and down chevrons, the two sort arrows, the back arrow, the
// drop-down arrow, the calendar, the schedule clock, the keyboard, the person,
// and the filled error and check circles. The package is a devDependency, so
// the build writes them into dist. They are Material Symbols on their 24-unit
// grid, which is what the checkbox page
// draws at 18dp, the icon buttons page at 20 and the search, menus, date
// picker and time picker pages at 24 — the date picker's menu
// buttons draw their arrow at 18, a split button's menu button its
// chevron at between 22 and 50, and a meter its two circles at 18.

type GlyphProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'viewBox'>

// What a search view's back button draws, pointing at the page it returns
// to. It says "back" rather than "to the left", so whatever renders it
// mirrors it under a right-to-left writing mode, as ChevronEndGlyph's
// renderers do.
function ArrowBackGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d={arrowBackPath} />
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
      <path d={arrowDownwardPath} />
    </Glyph>
  )
}

// What a menu button draws after its label, pointing at the list it opens.
// Down is down in either writing direction, so it does not mirror.
function ArrowDropDownGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d={arrowDropDownPath} />
    </Glyph>
  )
}

function ArrowUpwardGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d={arrowUpwardPath} />
    </Glyph>
  )
}

// What the date picker's trigger draws: the calendar a date is picked from.
function CalendarGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d={calendarPath} />
    </Glyph>
  )
}

// What a meter in the positive tone draws beside its value: a check in a
// filled circle, the same outline as the negative tone's error so the two
// differ by the mark inside rather than by their colour alone.
function CheckCircleGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d={checkCirclePath} />
    </Glyph>
  )
}

function CheckGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d={checkPath} />
    </Glyph>
  )
}

// What the time picker's trigger draws, and the button that takes its
// keyboard entry back to the dial: the clock a time is picked from.
function ClockGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d={clockPath} />
    </Glyph>
  )
}

// What a meter in the negative tone draws beside its value: an exclamation
// mark in a filled circle — see `CheckCircleGlyph`.
function ErrorGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d={errorPath} />
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
      viewBox={`0 0 ${gridSize} ${gridSize}`}
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
      <path d={keyboardPath} />
    </Glyph>
  )
}

// The same rule stands for a partly selected checkbox and for a stepper's
// decrement; the two names say which is meant at the call site.
function MinusGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d={minusPath} />
    </Glyph>
  )
}

const IndeterminateGlyph = MinusGlyph

// Points down at the menu a split button's second half opens.
function ChevronDownGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d={chevronDownPath} />
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
      <path d={chevronEndPath} />
    </Glyph>
  )
}

function CloseGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d={closePath} />
    </Glyph>
  )
}

// What an avatar with no name to take initials from draws: Material Design's
// anonymous person, a head over shoulders.
function PersonGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d={personPath} />
    </Glyph>
  )
}

function PlusGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d={plusPath} />
    </Glyph>
  )
}

function SearchGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d={searchPath} />
    </Glyph>
  )
}

export {
  ArrowBackGlyph,
  ArrowDownwardGlyph,
  ArrowDropDownGlyph,
  ArrowUpwardGlyph,
  CalendarGlyph,
  CheckCircleGlyph,
  CheckGlyph,
  ChevronDownGlyph,
  ChevronEndGlyph,
  ClockGlyph,
  CloseGlyph,
  ErrorGlyph,
  IndeterminateGlyph,
  KeyboardGlyph,
  MinusGlyph,
  PersonGlyph,
  PlusGlyph,
  SearchGlyph,
}
