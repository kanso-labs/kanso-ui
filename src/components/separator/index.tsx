import type { SeparatorProps as BaseUISeparatorProps } from '@base-ui/react/separator'

import { Separator as BaseUISeparator } from '@base-ui/react/separator'
import * as stylex from '@stylexjs/stylex'

import { mergeStatefulStyles } from '../../styles/merge'
import { colors } from '../../tokens/design.tokens.stylex'

// A divider is the same colour as a border, so it draws from outlineVariant
// rather than a role of its own — the design system treats the two as one
// decision, and a separator that drifted from the borders around it would
// read as a mistake.
//
// Drawn as a background on a 1px box rather than as a border, so the rule is
// the element itself. A border would leave the element's own box at zero
// size, which makes it invisible to flex `gap` and to anything measuring it.
//
// Vertical has no length of its own. `alignSelf: stretch` takes it from the
// flex or grid parent, since a divider between two rows should match
// whatever they turn out to be rather than being told a height at the call
// site. In a plain block parent there is nothing to stretch to and it will
// have no height — that is the documented cost of the prop.
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

type SeparatorProps = Omit<BaseUISeparatorProps, 'orientation'> & {
  /**
   * Which way the rule runs. A vertical separator takes its length from a
   * flex or grid parent and has none of its own.
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical'
}

function Separator({ orientation = 'horizontal', ...props }: SeparatorProps) {
  return (
    <BaseUISeparator
      orientation={orientation}
      {...props}
      {...mergeStatefulStyles(
        stylex.props(styles.base, styles[orientation]),
        props,
      )}
    />
  )
}

export type { SeparatorProps }

export default Separator
