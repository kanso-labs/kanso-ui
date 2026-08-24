import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'

import { mergeStyles } from '../../styles/merge'
import { colors, typography } from '../../tokens/design.tokens.stylex'

// One key per style in the 15-entry type scale, named exactly as the token
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
const styles = stylex.create({
  base: {
    margin: 0,
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
// 15 scale styles in any of these colors. Kept to the roles text actually
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
   * Which style of the type scale to render.
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
  return useRender({
    defaultTagName: 'span',
    props: {
      ...props,
      ...mergeStyles(
        stylex.props(styles.base, styles[variant], tones[tone]),
        props,
      ),
    },
    render,
  })
}

export type { TextProps }

export default Text
