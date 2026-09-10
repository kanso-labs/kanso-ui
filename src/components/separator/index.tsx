import type { SeparatorProps as RACSeparatorProps } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  Separator as RACSeparator,
  SeparatorContext,
  useSlottedContext,
} from 'react-aria-components'

import { mergeStyles } from '../../styles/merge'
import { colors, spacing } from '../../tokens/design.tokens.stylex'

// A divider is the same colour as a border, so it draws from outlineVariant
// rather than a role of its own — the design system treats the two as one
// decision, and a separator that drifted from the borders around it would
// read as a mistake.
//
// Drawn as a background on a 1px box rather than as a border, so the rule is
// the element itself. A border would leave the element's own box at zero
// size, which makes it invisible to flex `gap` and to anything measuring it.
// The horizontal element is an <hr>, which arrives with a border and a
// margin of its own; both are zeroed here so it is the same 1px box a <div>
// would be.
//
// Vertical has no length of its own. `alignSelf: stretch` takes it from the
// flex or grid parent, since a divider between two rows should match
// whatever they turn out to be rather than being told a height at the call
// site. In a plain block parent there is nothing to stretch to and it will
// have no height — that is the documented cost of the prop.
//
// The divider page gives three forms and this draws all three: full width,
// inset by 16dp at the leading end, and middle-inset by 16dp at both. The
// page names them "inset" and "middle-inset"; the prop says `start` and
// `both` instead, since `inset="inset"` reads as nothing at all and the two
// words say which ends move.
//
// The inset is drawn as a margin on the logical axis the rule runs along, so
// it follows the writing mode and works for a vertical rule as well — the
// page only draws horizontal ones, but a shortened vertical rule between two
// columns is the same idea and would otherwise have to be written at the
// call site. An inset rule also drops its `100%` length: a margin sits
// outside the box, so a full-width rule with one would overflow its parent
// by exactly the inset.
//
// The orientation is resolved rather than defaulted eagerly, so a container
// that sets one through React Aria's separator context reaches it. Toolbar
// is what needs that: a rule between two controls in a row is vertical, and
// a `Separator` written inside one should not have to say so. React Aria's
// own `Toolbar` sets no such context — it puts the orientation on itself and
// nothing else — so ours provides it, and this is the half that reads it.
const styles = stylex.create({
  base: {
    backgroundColor: colors.outlineVariant,
    borderWidth: 0,
    boxSizing: 'border-box',
    flexShrink: 0,
    margin: 0,
  },
  horizontal: {
    blockSize: '1px',
    inlineSize: '100%',
  },
  vertical: {
    alignSelf: 'stretch',
    inlineSize: '1px',
  },
})

// The page's 16dp, on whichever axis the rule runs along. `auto` replaces the
// `100%` a full-width rule takes, since a margin outside a 100% box overflows
// the parent by the inset.
const horizontalInsets = stylex.create({
  both: {
    inlineSize: 'auto',
    marginInlineEnd: spacing.lg,
    marginInlineStart: spacing.lg,
  },
  none: {},
  start: { inlineSize: 'auto', marginInlineStart: spacing.lg },
})

// A vertical rule takes its length from the parent through `alignSelf`, so
// the margin shortens it from the end it is on rather than moving it.
const verticalInsets = stylex.create({
  both: { marginBlockEnd: spacing.lg, marginBlockStart: spacing.lg },
  none: {},
  start: { marginBlockStart: spacing.lg },
})

const insets = { horizontal: horizontalInsets, vertical: verticalInsets }

type SeparatorInset = 'both' | 'none' | 'start'

type SeparatorProps = Omit<RACSeparatorProps, 'orientation'> & {
  /**
   * How far the rule is held off the edges it runs between. `start` holds it
   * 16dp off the leading end, which is the page's inset divider; `both`
   * holds it off each end, which is its middle-inset one. The inset follows
   * the writing mode rather than a fixed side.
   * @default 'none'
   */
  inset?: SeparatorInset
  /**
   * Which way the rule runs. A vertical separator takes its length from a
   * flex or grid parent and has none of its own. Defaults to whatever the
   * container asks for — a `Toolbar` asks for the rule across its own
   * direction — and to horizontal outside one.
   */
  orientation?: 'horizontal' | 'vertical'
}

/**
 * A 1px rule between items. The orientation drives the accessibility tree as
 * well as which side the rule is drawn on: horizontal renders an `<hr>`,
 * whose role and orientation are implicit, and vertical a `<div>` given the
 * separator role and `aria-orientation="vertical"`.
 *
 * `inset` holds the rule off the ends it runs between — `start` off the
 * leading one, `both` off each — which is what a rule between list rows
 * takes so it lines up with their text rather than the container's edge.
 *
 * React Aria's rather than a styled element of the library's own, so a
 * `Menu` or `Toolbar` around it reaches it through context — a separator
 * between menu items is part of the collection, and one in a toolbar takes
 * the rule across the toolbar's own direction. `elementType` picks a
 * different element, and `render` is React Aria's function form.
 */
function Separator({ inset = 'none', orientation, ...props }: SeparatorProps) {
  const context = useSlottedContext(SeparatorContext, props.slot)
  const resolved = orientation ?? context?.orientation ?? 'horizontal'

  return (
    <RACSeparator
      orientation={resolved}
      {...props}
      {...mergeStyles(
        stylex.props(styles.base, styles[resolved], insets[resolved][inset]),
        props,
      )}
    />
  )
}

export type { SeparatorInset, SeparatorProps }

export default Separator
