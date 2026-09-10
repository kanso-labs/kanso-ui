import type { SeparatorProps as RACSeparatorProps } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  Separator as RACSeparator,
  SeparatorContext,
  useSlottedContext,
} from 'react-aria-components'

import { mergeStyles } from '../../styles/merge'
import { colors } from '../../tokens/design.tokens.stylex'

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

type SeparatorProps = {
  /**
   * Which way the rule runs. A vertical separator takes its length from a
   * flex or grid parent and has none of its own. Defaults to whatever the
   * container asks for — a `Toolbar` asks for the rule across its own
   * direction — and to horizontal outside one.
   */
  orientation?: 'horizontal' | 'vertical'
} & Omit<RACSeparatorProps, 'orientation'>

/**
 * A 1px rule between items. The orientation drives the accessibility tree as
 * well as which side the rule is drawn on: horizontal renders an `<hr>`,
 * whose role and orientation are implicit, and vertical a `<div>` given the
 * separator role and `aria-orientation="vertical"`.
 *
 * React Aria's rather than a styled element of the library's own, so a
 * `Menu` or `Toolbar` around it reaches it through context — a separator
 * between menu items is part of the collection, and one in a toolbar takes
 * the rule across the toolbar's own direction. `elementType` picks a
 * different element, and `render` is React Aria's function form.
 */
function Separator({ orientation, ...props }: SeparatorProps) {
  const context = useSlottedContext(SeparatorContext, props.slot)
  const resolved = orientation ?? context?.orientation ?? 'horizontal'

  return (
    <RACSeparator
      orientation={resolved}
      {...props}
      {...mergeStyles(stylex.props(styles.base, styles[resolved]), props)}
    />
  )
}

export type { SeparatorProps }

export default Separator
