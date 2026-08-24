import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'

import { mergeStyles } from '../../styles/merge'
import { colors, motion, radii } from '../../tokens/design.tokens.stylex'

// Deliberately sets no font size or family. A link is nearly always a run of
// words inside something else — a paragraph, a list, a table cell — so its
// type is the surrounding text's decision. What is here is only what makes it
// read as a link: the colour, the rule under it, and the focus ring.
//
// The underline is on by default rather than an opt-in. Colour alone fails
// anyone who cannot separate the two hues, so a link in prose that is not
// underlined is only distinguishable to some readers.
const styles = stylex.create({
  base: {
    // The focus ring follows the box, and an inline link's box is tight to
    // the text. A small radius keeps the ring from reading as a hard-edged
    // rectangle dropped over a word mid-sentence.
    borderRadius: radii.xs,
    cursor: 'pointer',
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
    textDecorationThickness: '1px',
    // Far enough off the baseline that the rule clears descenders rather than
    // cutting through the tail of a 'g' or 'y'.
    textUnderlineOffset: '0.2em',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'color, text-decoration-color',
    transitionTimingFunction: motion.easingStandard,
  },
})

// Each tone gets a hover that means something. `primary` is already the accent
// colour, so hovering it deepens the rule instead of restating the colour;
// `inherit` sits in body text, so hovering moves it to the accent — which is
// what tells the reader the words are a link and not emphasis.
const tones = stylex.create({
  inherit: {
    color: { ':hover': colors.primary, default: 'inherit' },
    textDecorationColor: { ':hover': colors.primary, default: colors.outline },
  },
  primary: {
    color: colors.primary,
    textDecorationColor: {
      ':hover': colors.primary,
      default: `color-mix(in srgb, ${colors.primary} 45%, transparent)`,
    },
  },
})

const underlines = stylex.create({
  always: {
    textDecorationLine: 'underline',
  },
  hover: {
    textDecorationLine: { ':hover': 'underline', default: 'none' },
  },
  none: {
    textDecorationLine: 'none',
  },
})

type LinkProps = {
  /**
   * Which colour role to render in. `primary` marks the link out from the
   * text around it; `inherit` takes the surrounding colour and leans on the
   * underline alone, for a link in a place already understood to be links —
   * a footer, a breadcrumb, a nav.
   * @default 'primary'
   */
  tone?: LinkTone
  /**
   * When to draw the rule. Leave it at `always` in prose: without it, colour
   * is the only thing separating the link from the sentence, which some
   * readers cannot see. `hover` and `none` are for links whose position
   * already announces them, such as a row of footer links.
   * @default 'always'
   */
  underline?: LinkUnderline
} & useRender.ComponentProps<'a'>

type LinkTone = 'inherit' | 'primary'

type LinkUnderline = 'always' | 'hover' | 'none'

/**
 * A navigational link. It renders an `<a>` and sets no type of its own, so it
 * takes the size and face of the text it sits in.
 */
function Link({
  render,
  tone = 'primary',
  underline = 'always',
  ...props
}: LinkProps) {
  return useRender({
    defaultTagName: 'a',
    props: {
      ...props,
      ...mergeStyles(
        stylex.props(styles.base, tones[tone], underlines[underline]),
        props,
      ),
    },
    render,
  })
}

export type { LinkProps }

export default Link
