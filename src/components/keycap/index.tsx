'use client'

import * as stylex from '@stylexjs/stylex'
import { useContext } from 'react'

import type { RenderComponentProps } from '../../render/useRender'

import { KeycapToneContext } from '../../keycap/context'
import { useRender } from '../../render/useRender'
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
//
// No Material Design page draws a keycap. Its rule is the assist chip's, 1dp
// in the outline role around a label. Its size is the text's, as above, and
// its corner is the extra-small step of the shape scale rather than the
// chip's small one, since a box the height of a line has no room for 8dp.
//
// Inside a selected or disabled menu item's shortcut it draws in the
// shortcut's colour instead, its rule included, through a context the item
// provides — see `KeycapToneContext`. Its own on surface would otherwise
// stay dark on a row that has faded, and its own colours do not belong on
// the selected container, which brings an on-colour of its own.
const styles = stylex.create({
  base: {
    backgroundColor: 'transparent',
    borderColor: colors.outline,
    borderRadius: radii.xs,
    borderStyle: 'solid',
    borderWidth: '1px',
    boxSizing: 'border-box',
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
  inherit: {
    borderColor: 'currentColor',
    color: 'inherit',
  },
})

type KeycapProps = RenderComponentProps<'kbd'>

/**
 * A single key on a keyboard, as named in an instruction — `Enter`, `Esc`,
 * `Ctrl`. It renders a `<kbd>` and takes its scale from the text around it. A
 * chord is several of these, combined at the call site.
 *
 * In a menu item's `shortcut` it follows the item: while the item is selected
 * or disabled, its text and its rule take the item's colour.
 */
function Keycap({ render, ...props }: KeycapProps) {
  const tone = useContext(KeycapToneContext)
  return useRender({
    defaultTagName: 'kbd',
    props: {
      ...props,
      ...mergeStyles(
        stylex.props(styles.base, tone === 'inherit' && styles.inherit),
        props,
      ),
    },
    render,
  })
}

export type { KeycapProps }

export default Keycap
