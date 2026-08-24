import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'

import { mergeStyles } from '../../styles/merge'
import { spacing } from '../../tokens/design.tokens.stylex'

// The width fourteen of this library's own story files already centre their
// page on, which is what makes it the default rather than a number picked
// here. A measure is a property of the content: 960px suits a page of mixed
// components, and prose wants something nearer 58ch, which is what the story
// files that hold prose use. Say which one you mean rather than taking this.
const DEFAULT_MAX_INLINE_SIZE = '960px'

// A dynamic style rather than a static one, for the same reason Feed's is:
// the measure comes from the call site and StyleX compiles its classes ahead
// of time, so the value is written to a custom property inline instead.
const styles = stylex.create({
  paddingDefault: {
    paddingInline: spacing.xl,
  },
  paddingNone: {
    paddingInline: 0,
  },
  root: (maxInlineSize: string) => ({
    boxSizing: 'border-box',
    // So the container still fills its parent as a flex or grid item, where a
    // block box's `auto` width would shrink to its contents instead.
    inlineSize: '100%',
    marginInline: 'auto',
    maxInlineSize,
  }),
})

type ContainerProps = useRender.ComponentProps<'div'> & {
  /**
   * How wide the content may run before it stops growing. The container is
   * centred in whatever space is left over.
   *
   * Worth setting. The default suits a page of mixed components; prose wants
   * a measure in `ch`, since what makes a line hard to read is how many
   * characters it holds rather than how many pixels.
   * @default '960px'
   */
  maxInlineSize?: string
  /**
   * Inline padding, which is what keeps the content off the edge of the
   * window once it is narrower than the measure. `none` is for a container
   * nested inside one that already has it.
   * @default 'default'
   */
  padding?: 'default' | 'none'
}

/**
 * A centred measure for a page or a section of one: content grows to a width
 * and stops, with the leftover space split evenly either side.
 *
 * Layout only — it paints no surface and gives its children no container of
 * their own, which is what separates it from Card. It sets no gaps either, so
 * reach for Stack inside it for the rhythm between sections.
 *
 * `render` swaps the element, for a container that should be a `<main>` or a
 * `<section>` rather than a `<div>`.
 */
function Container({
  maxInlineSize = DEFAULT_MAX_INLINE_SIZE,
  padding = 'default',
  render,
  ...props
}: ContainerProps) {
  const padded = padding === 'none' ? styles.paddingNone : styles.paddingDefault

  return useRender({
    defaultTagName: 'div',
    props: {
      ...props,
      ...mergeStyles(stylex.props(styles.root(maxInlineSize), padded), props),
    },
    render,
  })
}

export type { ContainerProps }

export default Container
