import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'

import { mergeStyles } from '../../styles/merge'
import {
  colors,
  radii,
  spacing,
  typography,
} from '../../tokens/design.tokens.stylex'

// Named for the physical thing it draws rather than for the element it
// renders. `Kbd` would match the tag, but a component library is read by
// people writing call sites, not markup, and `Key` in that setting is already
// spoken for several times over — an API key, an object key, React's own key
// prop. A keycap is unambiguously the one on a keyboard.
//
// Sized in em for the same reason Code is: a key named inside a footnote and
// one named inside a paragraph are the same component. The ratio is smaller
// than Code's because the border adds height that the glyphs do not, and
// matching Code's 0.875 leaves a keycap standing taller than the line it
// sits in.
//
// Transparent rather than filled, so a keycap inside a Card or a Sheet does
// not read as a nested surface. The border alone carries the metaphor.
const styles = stylex.create({
  base: {
    backgroundColor: 'transparent',
    borderColor: colors.outline,
    borderRadius: radii.xs,
    borderStyle: 'solid',
    borderWidth: '1px',
    color: colors.onSurface,
    // inline-block rather than inline, so the padding below opens up the box
    // on all four sides. An inline box takes horizontal padding only.
    display: 'inline-block',
    fontFamily: typography.fontFamilyMono,
    fontSize: '0.8125em',
    lineHeight: 1.4,
    paddingBlock: 0,
    paddingInline: spacing.xxs,
    // A key's name is a single token even when it is a word — 'Enter' broken
    // across two lines stops reading as one key.
    whiteSpace: 'nowrap',
  },
})

type KeycapProps = useRender.ComponentProps<'kbd'>

/**
 * A single key on a keyboard, as named in an instruction — `Enter`, `Esc`,
 * `Ctrl`. It renders a `<kbd>` and takes its scale from the text around it. A
 * chord is several of these, combined at the call site.
 */
function Keycap({ render, ...props }: KeycapProps) {
  return useRender({
    defaultTagName: 'kbd',
    props: {
      ...props,
      ...mergeStyles(stylex.props(styles.base), props),
    },
    render,
  })
}

export type { KeycapProps }

export default Keycap
