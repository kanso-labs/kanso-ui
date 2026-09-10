import type { ReactNode } from 'react'
import type {
  ToolbarProps as RACToolbarProps,
  SeparatorProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { useMemo } from 'react'
import { Toolbar as RACToolbar, SeparatorContext } from 'react-aria-components'

import { mergeStatefulStyles } from '../../styles/merge'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'

// The toolbars page's container: a row of frequently used controls, on a
// surface of its own, with the arrow keys moving between them rather than
// Tab. The page calls it "a container with configurable slots", so nothing
// here says what goes in one — an icon button, a button, a field or a rule
// are all the call site's to place.
//
// The measurements are the page's, stated there in words: 64dp tall,
// centred, 8dp between items and 16dp of padding outside them. The two
// colour schemes are its own too — standard on surface container, vibrant on
// primary container — and both put the muted content role on what they hold.
//
// Two things are this component's own.
//
// **A rule inside it runs across the row, not along it.** React Aria's
// `Toolbar` sets its orientation on itself and nowhere else, so a
// `Separator` written among the controls would draw the way it does anywhere
// else — along the row, where it is invisible. This provides React Aria's
// separator context with the perpendicular orientation, and `Separator`
// reads it, so a rule between two controls is correct without the call site
// saying which way it runs.
//
// **Arrow-key navigation is React Aria's and is not wrapped.** The arrows
// move between the controls, and — worth knowing, since the pattern usually
// implies otherwise — React Aria leaves every control tabbable rather than
// giving the bar a roving tabindex, so Tab still steps through them one by
// one. What the bar adds is the toolbar role, which tells a screen reader
// the controls belong together, and a second way to move between them.
//
// One departure, and it is about the shape. The page gives the container's
// corner as a token its widget draws rather than writes, so there is no
// value to read: what it states in words is the height, the alignment and
// the padding, and nothing else. The fully rounded corner here, and the
// inline box that goes with it, are the library's own choice for a bar that
// floats over a page rather than docking to its edge — a docked one spans
// its container and squares its corner, both from the call site.

const styles = stylex.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.full,
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    display: 'inline-flex',
    gap: spacing.sm,
    justifyContent: 'center',
    // React Aria moves focus to a control inside rather than to the
    // container, and each control draws its own ring.
    outlineStyle: 'none',
  },
  // The page's 64dp across the bar, and its 16dp of padding at the two ends.
  // A minimum rather than a fixed size, since a field or a button taller
  // than 64dp should make the bar taller rather than overflow it.
  //
  // The cross axis takes the 8dp the page puts between items rather than
  // nothing, and that is a layout consequence rather than a value the page
  // states: a `Separator` takes its length from the flex parent, so with no
  // padding there a rule runs the full 64dp and cuts the container in two
  // instead of dividing what is inside it.
  horizontal: {
    flexDirection: 'row',
    minBlockSize: '64px',
    paddingBlock: spacing.sm,
    paddingInline: spacing.lg,
  },
  standard: {
    backgroundColor: colors.surfaceContainer,
  },
  vertical: {
    flexDirection: 'column',
    minInlineSize: '64px',
    paddingBlock: spacing.lg,
    paddingInline: spacing.sm,
  },
  vibrant: {
    backgroundColor: colors.primaryContainer,
    color: colors.onPrimaryContainer,
  },
})

type ToolbarProps = Omit<
  RACToolbarProps,
  'children' | 'className' | 'style'
> & {
  /** The controls, and any rule between them. */
  children?: ReactNode
  /** A function may compute the class from the toolbar's render state. */
  className?: RACToolbarProps['className']
  /** A function may compute the style from the toolbar's render state. */
  style?: RACToolbarProps['style']
  /**
   * Which of the page's two colour schemes the bar takes. `standard` is the
   * surface container it draws by default; `vibrant` moves it to primary
   * container, for a bar meant to carry the page's accent.
   * @default 'standard'
   */
  tone?: ToolbarTone
}

type ToolbarTone = 'standard' | 'vibrant'

/**
 * A container for a set of controls, announced as a toolbar so a screen
 * reader reads them as one group, with the arrow keys moving between them.
 * Tab still steps through each control: React Aria's toolbar adds the arrows
 * rather than replacing what Tab does.
 *
 * ```tsx
 * <Toolbar aria-label="Label">
 *   <IconButton aria-label="First item">
 *     <FirstIcon />
 *   </IconButton>
 *   <Separator />
 *   <IconButton aria-label="Second item">
 *     <SecondIcon />
 *   </IconButton>
 * </Toolbar>
 * ```
 *
 * Name it with `aria-label` or `aria-labelledby` — nothing here labels it for
 * you, and a toolbar with no name is a group a screen reader cannot announce.
 *
 * `orientation` is React Aria's, and it decides both which arrows move and
 * which way the bar runs. A `Separator` inside draws across that direction
 * without being told.
 *
 * The call site's `className` and `style` land on the container, which is
 * the element a layout positions.
 */
function Toolbar({
  orientation = 'horizontal',
  tone = 'standard',
  ...props
}: ToolbarProps) {
  // The rule runs across the toolbar rather than along it. Memoised because
  // a fresh object here would be a new context value on every render, which
  // is what react-perf's no-new-object-as-prop is after.
  const separator = useMemo<SeparatorProps>(
    () => ({
      orientation: orientation === 'horizontal' ? 'vertical' : 'horizontal',
    }),
    [orientation],
  )

  return (
    <SeparatorContext value={separator}>
      <RACToolbar
        orientation={orientation}
        {...props}
        {...mergeStatefulStyles(
          stylex.props(styles.base, styles[orientation], styles[tone]),
          props,
        )}
      />
    </SeparatorContext>
  )
}

export type { ToolbarProps, ToolbarTone }

export default Toolbar
