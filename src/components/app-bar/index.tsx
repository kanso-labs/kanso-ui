import type { ReactNode } from 'react'

import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'

import { mergeStyles } from '../../styles/merge'
import { colors, spacing } from '../../tokens/design.tokens.stylex'
import Text from '../text'

// Material 3's app bar, in the three sizes M3 Expressive recommends.
//
// The spec offers four variants. `search` is absent because it opens M3's
// search view when selected, and that is a component in its own right that
// this library does not have — half of a search bar would be worse than none.
// The other three are here.
//
// `medium` and `large` are M3 Expressive's *flexible* bars. The baseline
// medium and large ones they replaced are marked "not recommended" in the
// spec, so there is no ambiguity to protect against and the shorter names are
// the ones worth having at a call site.
//
// M3 also merged the old center-aligned variant into small as a configuration
// rather than a variant, which is why alignment is a prop here and applies to
// every size.
//
// Heights are M3's, and they are minimums rather than fixed. The spec says the
// flexible bars "hug the text contents", and Expressive added multi-line
// support and text wrapping, so a headline long enough to wrap has to be able
// to make its bar taller. Fixing the height would truncate exactly the case
// the variant was redesigned for.
const HEIGHTS = {
  large: { plain: '120px', withSubtitle: '152px' },
  medium: { plain: '112px', withSubtitle: '136px' },
  small: { plain: '64px', withSubtitle: '64px' },
} as const

const styles = stylex.create({
  // 4dp each side, which is M3's padding for the bar itself. It is that tight
  // because the leading and trailing slots hold icon buttons, whose own touch
  // targets carry the rest of the inset.
  root: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    boxSizing: 'border-box',
    display: 'flex',
    gap: spacing.xs,
    paddingInline: spacing.xs,
    // The spec's separation on scroll is a fill rather than a shadow, so this
    // is the only property `scrolled` moves.
    transitionDuration: '150ms',
    transitionProperty: 'background-color',
  },
  // M3 replaced M2's drop shadow with a colour fill, so a bar over scrolled
  // content separates by sitting on a different surface rather than by
  // casting anything.
  scrolled: {
    backgroundColor: colors.surfaceContainer,
  },
  // Slots hold their own size rather than being squeezed by a long headline.
  slot: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    gap: spacing.xs,
  },
  // The text block takes the space the slots leave, and wraps inside it.
  text: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    justifyContent: 'center',
    minInlineSize: 0,
    paddingBlock: spacing.sm,
    // M3 puts the bar's own inset on the text rather than the container, so a
    // bar with no leading slot still starts its headline in the same place as
    // one that has it.
    paddingInline: spacing.md,
  },
  textCenter: {
    textAlign: 'center',
  },
})

// One entry per size, and each names a type role rather than a figure. M3's
// own tokens are `md.comp.app-bar.<size>.title.font`, aliases onto the type
// scale rather than sizes of their own, so this maps to the scale the same
// way and lets Text apply it.
const HEADLINE_VARIANT = {
  large: 'headlineMedium',
  medium: 'headlineSmall',
  small: 'titleLarge',
} as const

// The headline is the page's title in M3's model, so it is the page's <h1>.
// A bar nested somewhere that already has one can pass its own heading as
// `headline` instead.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
const PARAGRAPH = <p />

// Height is the one value the call site does not choose, and it depends on two
// props at once, so it is a function style rather than one key per
// combination. StyleX writes it to a custom property inline, the same
// mechanism Feed uses for its cell minimum.
const heightStyles = stylex.create({
  root: (minBlockSize: string) => ({ minBlockSize }),
})

type AppBarProps = Omit<useRender.ComponentProps<'header'>, 'children'> & {
  /**
   * Which of M3's alignments the text takes. `center` is the configuration
   * that replaced the old center-aligned variant.
   * @default 'start'
   */
  align?: 'center' | 'start'
  /** The page's title. Wraps rather than truncating, and grows the bar with it. */
  headline?: ReactNode
  /** Usually a back or menu icon button. Sits before the text. */
  leading?: ReactNode
  /**
   * Whether the content beneath has been scrolled. M3 separates a bar from
   * scrolled content with a fill colour rather than a shadow, and this is what
   * applies it.
   *
   * Controlled, with no listener of its own: only the app knows which element
   * scrolls, and a bar that watched the window would be wrong inside every
   * pane and dialog that scrolls independently.
   * @default false
   */
  scrolled?: boolean
  /**
   * Height and headline size. `medium` and `large` are M3 Expressive's
   * flexible bars, which hug their text — the baseline variants they replaced
   * are no longer recommended and are not offered.
   * @default 'small'
   */
  size?: 'large' | 'medium' | 'small'
  /** A second line under the headline. Makes `medium` and `large` taller. */
  subtitle?: ReactNode
  /** Actions, at the far end. Usually icon buttons. */
  trailing?: ReactNode
}

/**
 * Material 3's app bar: the container at the top of a page carrying its title,
 * one or two actions, and the way back out.
 *
 * Three sizes. `small` is a fixed 64px bar for a page whose title is a label;
 * `medium` and `large` are the flexible bars, which give the headline a larger
 * type role and grow to fit a subtitle or a headline that wraps.
 *
 * It paints its own surface, unlike the layout components, because separating
 * itself from the content beneath is the job — which is also why `scrolled`
 * exists.
 */
function AppBar({
  align = 'start',
  headline,
  leading,
  render,
  scrolled = false,
  size = 'small',
  subtitle,
  trailing,
  ...props
}: AppBarProps) {
  const height =
    subtitle === undefined || subtitle === null
      ? HEIGHTS[size].plain
      : HEIGHTS[size].withSubtitle

  return useRender({
    defaultTagName: 'header',
    props: {
      ...props,
      children: (
        <>
          {leading === undefined ? null : (
            <div {...stylex.props(styles.slot)}>{leading}</div>
          )}
          <div
            {...stylex.props(
              styles.text,
              align === 'center' && styles.textCenter,
            )}
          >
            {headline === undefined ? null : (
              <Text render={HEADING_1} variant={HEADLINE_VARIANT[size]}>
                {headline}
              </Text>
            )}
            {subtitle === undefined ? null : (
              <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
                {subtitle}
              </Text>
            )}
          </div>
          {trailing === undefined ? null : (
            <div {...stylex.props(styles.slot)}>{trailing}</div>
          )}
        </>
      ),
      ...mergeStyles(
        stylex.props(
          styles.root,
          heightStyles.root(height),
          scrolled && styles.scrolled,
        ),
        props,
      ),
    },
    render,
  })
}

export type { AppBarProps }

export default AppBar
