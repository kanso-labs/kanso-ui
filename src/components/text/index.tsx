import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'

import { colors, typography } from '../../tokens/design.tokens.stylex'

// One key per style in the 16-entry type scale, named exactly as the token
// group names it, so `styles[variant]` indexes straight off the prop with no
// lookup table to keep in sync. Every style sets all five fields the scale
// defines rather than inheriting any of them: a Text nested inside another
// Text would otherwise pick up the outer line-height or tracking, which is
// the kind of drift the scale exists to prevent.
//
// `margin: 0` is the one UA reset here. Text renders a <span> by default, but
// `render` is how a consumer reaches for semantic markup — `<Text
// render={<h2 />}>` — and an h2's UA margin would then vary the spacing
// around otherwise identical type.
//
// `textTransform` is the sixth field, and the only one declared on `base`
// rather than on all sixteen styles. It is not a token — see SCALE_STYLES in
// scripts/build-tokens.mjs — and `overline` is the only style that sets it,
// so spelling `none` out fifteen times to say nothing would be noise. It
// still has to be said once: text-transform inherits, so without a reset a
// bodyMedium Text nested inside an overline would come out in capitals,
// which is exactly the drift the paragraph above describes.
const styles = stylex.create({
  base: {
    margin: 0,
    textTransform: 'none',
  },
  bodyLarge: {
    fontFamily: typography.bodyLargeFont,
    fontSize: typography.bodyLargeSize,
    fontWeight: typography.bodyLargeWeight,
    letterSpacing: typography.bodyLargeTracking,
    lineHeight: typography.bodyLargeLineHeight,
  },
  bodyMedium: {
    fontFamily: typography.bodyMediumFont,
    fontSize: typography.bodyMediumSize,
    fontWeight: typography.bodyMediumWeight,
    letterSpacing: typography.bodyMediumTracking,
    lineHeight: typography.bodyMediumLineHeight,
  },
  bodySmall: {
    fontFamily: typography.bodySmallFont,
    fontSize: typography.bodySmallSize,
    fontWeight: typography.bodySmallWeight,
    letterSpacing: typography.bodySmallTracking,
    lineHeight: typography.bodySmallLineHeight,
  },
  displayLarge: {
    fontFamily: typography.displayLargeFont,
    fontSize: typography.displayLargeSize,
    fontWeight: typography.displayLargeWeight,
    letterSpacing: typography.displayLargeTracking,
    lineHeight: typography.displayLargeLineHeight,
  },
  displayMedium: {
    fontFamily: typography.displayMediumFont,
    fontSize: typography.displayMediumSize,
    fontWeight: typography.displayMediumWeight,
    letterSpacing: typography.displayMediumTracking,
    lineHeight: typography.displayMediumLineHeight,
  },
  displaySmall: {
    fontFamily: typography.displaySmallFont,
    fontSize: typography.displaySmallSize,
    fontWeight: typography.displaySmallWeight,
    letterSpacing: typography.displaySmallTracking,
    lineHeight: typography.displaySmallLineHeight,
  },
  headlineLarge: {
    fontFamily: typography.headlineLargeFont,
    fontSize: typography.headlineLargeSize,
    fontWeight: typography.headlineLargeWeight,
    letterSpacing: typography.headlineLargeTracking,
    lineHeight: typography.headlineLargeLineHeight,
  },
  headlineMedium: {
    fontFamily: typography.headlineMediumFont,
    fontSize: typography.headlineMediumSize,
    fontWeight: typography.headlineMediumWeight,
    letterSpacing: typography.headlineMediumTracking,
    lineHeight: typography.headlineMediumLineHeight,
  },
  headlineSmall: {
    fontFamily: typography.headlineSmallFont,
    fontSize: typography.headlineSmallSize,
    fontWeight: typography.headlineSmallWeight,
    letterSpacing: typography.headlineSmallTracking,
    lineHeight: typography.headlineSmallLineHeight,
  },
  labelLarge: {
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
  },
  labelMedium: {
    fontFamily: typography.labelMediumFont,
    fontSize: typography.labelMediumSize,
    fontWeight: typography.labelMediumWeight,
    letterSpacing: typography.labelMediumTracking,
    lineHeight: typography.labelMediumLineHeight,
  },
  labelSmall: {
    fontFamily: typography.labelSmallFont,
    fontSize: typography.labelSmallSize,
    fontWeight: typography.labelSmallWeight,
    letterSpacing: typography.labelSmallTracking,
    lineHeight: typography.labelSmallLineHeight,
  },
  // The capitals are applied here rather than expected of the call site, so
  // the DOM keeps the sentence case the author wrote. That is what a screen
  // reader announces — text-transform is a rendering step and never reaches
  // the accessibility tree — and it is also what survives being copied out of
  // the page. `<Text variant="overline">Section label</Text>`, never the
  // string already shouted.
  overline: {
    fontFamily: typography.overlineFont,
    fontSize: typography.overlineSize,
    fontWeight: typography.overlineWeight,
    letterSpacing: typography.overlineTracking,
    lineHeight: typography.overlineLineHeight,
    textTransform: 'uppercase',
  },
  titleLarge: {
    fontFamily: typography.titleLargeFont,
    fontSize: typography.titleLargeSize,
    fontWeight: typography.titleLargeWeight,
    letterSpacing: typography.titleLargeTracking,
    lineHeight: typography.titleLargeLineHeight,
  },
  titleMedium: {
    fontFamily: typography.titleMediumFont,
    fontSize: typography.titleMediumSize,
    fontWeight: typography.titleMediumWeight,
    letterSpacing: typography.titleMediumTracking,
    lineHeight: typography.titleMediumLineHeight,
  },
  titleSmall: {
    fontFamily: typography.titleSmallFont,
    fontSize: typography.titleSmallSize,
    fontWeight: typography.titleSmallWeight,
    letterSpacing: typography.titleSmallTracking,
    lineHeight: typography.titleSmallLineHeight,
  },
})

// Tone is a separate axis from variant so the two compose freely — any of the
// 16 scale styles in any of these colors. Kept to the roles text actually
// takes on a surface; a consumer needing something outside this set uses
// `inherit` and colors the parent, rather than this growing a case per role.
const tones = stylex.create({
  default: { color: colors.onSurface },
  error: { color: colors.error },
  // Not a color of its own — opts out, so the nearest colored ancestor wins.
  // What a Text inside an already-colored container wants.
  inherit: { color: 'inherit' },
  muted: { color: colors.onSurfaceVariant },
  negative: { color: colors.negative },
  positive: { color: colors.positive },
  primary: { color: colors.primary },
})

type TextProps = useRender.ComponentProps<'span'> & {
  /**
   * The color role to render in. `inherit` takes the color of the nearest
   * colored ancestor instead of setting one.
   * @default 'default'
   */
  tone?:
    | 'default'
    | 'error'
    | 'inherit'
    | 'muted'
    | 'negative'
    | 'positive'
    | 'primary'
  /**
   * Which style of the type scale to render. `overline` sits outside the five
   * families: it is the eyebrow over a heading and the label down the side of
   * a section, set in the mono face and rendered in capitals from whatever
   * case you write.
   * @default 'bodyMedium'
   */
  variant?:
    | 'bodyLarge'
    | 'bodyMedium'
    | 'bodySmall'
    | 'displayLarge'
    | 'displayMedium'
    | 'displaySmall'
    | 'headlineLarge'
    | 'headlineMedium'
    | 'headlineSmall'
    | 'labelLarge'
    | 'labelMedium'
    | 'labelSmall'
    | 'overline'
    | 'titleLarge'
    | 'titleMedium'
    | 'titleSmall'
}

function Text({
  render,
  tone = 'default',
  variant = 'bodyMedium',
  ...props
}: TextProps) {
  // stylex.props() spreads after `props` for the same reason Button does it:
  // it wins over a consumer-supplied className/style rather than merging with
  // one. useRender would otherwise join the two class strings, and which of
  // the two won would come down to stylesheet order rather than anything the
  // call site can see.
  return useRender({
    defaultTagName: 'span',
    props: {
      ...props,
      ...stylex.props(styles.base, styles[variant], tones[tone]),
    },
    render,
  })
}

export type { TextProps }

export default Text
