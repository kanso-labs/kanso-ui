import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'

import { mergeStyles } from '../../styles/merge'
import { spacing } from '../../tokens/design.tokens.stylex'

// Short names rather than the CSS values they map to, so a call site reads
// `align="start"` instead of `align="flex-start"`. A lookup is unavoidable
// either way — `alignItems` takes `flex-start` and `justifyContent` takes
// `space-between`, neither of which is a word anyone wants in a prop.
const alignments = stylex.create({
  baseline: { alignItems: 'baseline' },
  center: { alignItems: 'center' },
  end: { alignItems: 'flex-end' },
  start: { alignItems: 'flex-start' },
  stretch: { alignItems: 'stretch' },
})

// One key per step of the spacing scale, named exactly as the token group
// names it, so `gaps[gap]` indexes straight off the prop with no lookup table
// to keep in sync — the same arrangement Text's type scale uses.
//
// `none` is the one key with no token behind it, and deliberately so: zero is
// the absence of a spacing decision rather than a step of the scale, so there
// is nothing for the scale to name. It exists because a stack that only wants
// the direction and the alignment is otherwise a plain flex container written
// out by hand.
const gaps = stylex.create({
  lg: { gap: spacing.lg },
  md: { gap: spacing.md },
  none: { gap: 0 },
  sm: { gap: spacing.sm },
  xl: { gap: spacing.xl },
  xs: { gap: spacing.xs },
  xxl: { gap: spacing.xxl },
  xxs: { gap: spacing.xxs },
  xxxl: { gap: spacing.xxxl },
})

const justifications = stylex.create({
  around: { justifyContent: 'space-around' },
  between: { justifyContent: 'space-between' },
  center: { justifyContent: 'center' },
  end: { justifyContent: 'flex-end' },
  start: { justifyContent: 'flex-start' },
})

const styles = stylex.create({
  base: {
    boxSizing: 'border-box',
    display: 'flex',
  },
  column: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
  },
  wrap: {
    flexWrap: 'wrap',
  },
})

type StackAlign = 'baseline' | 'center' | 'end' | 'start' | 'stretch'

type StackGap =
  | 'lg'
  | 'md'
  | 'none'
  | 'sm'
  | 'xl'
  | 'xs'
  | 'xxl'
  | 'xxs'
  | 'xxxl'

type StackJustify = 'around' | 'between' | 'center' | 'end' | 'start'

type StackProps = {
  /**
   * How the children line up across the stack: down the inline axis of a
   * column, down the block axis of a row. Left unset, they stretch, which is
   * what makes every card in a column the same width.
   *
   * `start` is what an inline-sized child needs in a column — a Badge or a
   * Chip spans the whole width otherwise.
   */
  align?: StackAlign
  /**
   * Which way the children run.
   * @default 'column'
   */
  direction?: 'column' | 'row'
  /**
   * The space between children, as a step of the spacing scale. `none` closes
   * it entirely.
   *
   * Worth setting. The default is a middle step, and how much air a group of
   * things wants is the one thing a stack cannot work out for itself.
   * @default 'md'
   */
  gap?: StackGap
  /**
   * How leftover space is distributed along the stack. Left unset, the
   * children sit at the start and the space collects after them.
   *
   * `between` is the one that puts a headline at one end of a row and its
   * actions at the other.
   */
  justify?: StackJustify
  /**
   * Lets a row wrap onto further lines rather than overflowing. Has no effect
   * on a column, which has as many lines as it has children.
   * @default false
   */
  wrap?: boolean
} & useRender.ComponentProps<'div'>

/**
 * A row or a column of children with one gap between them, taken from the
 * spacing scale.
 *
 * Layout only — it paints no surface and wraps no child, so each child is a
 * flex item exactly as it was written. It is the answer to spacing a group of
 * things, which is why no component here carries a margin of its own: the
 * space between two things belongs to whatever holds both of them.
 *
 * `render` swaps the element, for a stack that should be a `<ul>`, a `<nav>`,
 * or a `<section>` rather than a `<div>`.
 */
function Stack({
  align,
  direction = 'column',
  gap = 'md',
  justify,
  render,
  wrap = false,
  ...props
}: StackProps) {
  return useRender({
    defaultTagName: 'div',
    props: {
      ...props,
      ...mergeStyles(
        stylex.props(
          styles.base,
          styles[direction],
          gaps[gap],
          align !== undefined && alignments[align],
          justify !== undefined && justifications[justify],
          wrap && styles.wrap,
        ),
        props,
      ),
    },
    render,
  })
}

export type { StackAlign, StackGap, StackJustify, StackProps }

export default Stack
