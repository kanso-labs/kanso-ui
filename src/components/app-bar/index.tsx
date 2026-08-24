import type { ReactNode } from 'react'

import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'

import { mergeStyles } from '../../styles/merge'
import { colors, motion, spacing } from '../../tokens/design.tokens.stylex'
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

// How far the headline sits inside whatever comes before it, and the figure
// an icon button's glyph is inset from the edge of its own touch target. M3
// leans on the two agreeing, which is what makes a bar with a leading icon
// and one without start their text in the same place.
const HEADLINE_OFFSET = '12px'

// Where the bar's visible content starts by default, which is M3's own
// margin for a top app bar and the same margin its body content takes.
const DEFAULT_CONTENT_INSET = '16px'

const HEIGHTS = {
  large: { plain: '120px', withSubtitle: '152px' },
  medium: { plain: '112px', withSubtitle: '136px' },
  small: { plain: '64px', withSubtitle: '64px' },
} as const

// What a flexible bar collapses to, which is the small bar exactly. M3 does
// not describe the collapsed large bar as a state of its own — it describes it
// as becoming the small bar, which is why this reads off the same table rather
// than being a fourth height.
const COLLAPSED_HEIGHT = HEIGHTS.small.plain

const styles = stylex.create({
  // Collapsing swaps the headline's type role, which is a change of class
  // rather than of value — but the properties underneath still transition,
  // so the type resizes with the bar instead of snapping when it arrives.
  headline: {
    transitionDuration: motion.durationMedium1,
    transitionProperty: 'font-size, letter-spacing, line-height',
    transitionTimingFunction: motion.easingEmphasized,
  },
  root: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    boxSizing: 'border-box',
    display: 'flex',
    // The bar paints edge to edge and its contents sit in a measured row
    // inside it, so a full-bleed bar can still line its contents up with the
    // page beneath.
    justifyContent: 'center',
    // `scrolled` moves the fill and `collapsed` moves the height, and both
    // answer the same scroll, so the two have to move together. One duration
    // and one curve across both is what keeps them from looking like separate
    // events — a fill that has finished settling while the bar is still
    // shrinking reads as two things happening rather than one.
    transitionDuration: motion.durationMedium1,
    transitionProperty: 'background-color, min-block-size',
    transitionTimingFunction: motion.easingEmphasized,
  },
  row: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    gap: spacing.xs,
    inlineSize: '100%',
    marginInline: 'auto',
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
    // M3 puts part of the bar's inset on the text rather than all of it on the
    // container, so a bar with no leading slot still starts its headline in
    // the same place as one that has it. An icon button's glyph is centred in
    // a touch target this much wider than itself, so the two land together.
    paddingInline: HEADLINE_OFFSET,
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

// The row's measure and inset both come from the call site, so both are
// function styles too. The inset is where the bar's visible content starts,
// and the row carries `contentInset` minus the offset the text block already
// holds — which is what keeps a leading icon's glyph and a headline with no
// icon before it starting in the same place.
const rowStyles = stylex.create({
  root: (contentInset: string, maxInlineSize: string) => ({
    maxInlineSize,
    paddingInline: `calc(${contentInset} - ${HEADLINE_OFFSET})`,
  }),
})

type AppBarProps = Omit<useRender.ComponentProps<'header'>, 'children'> & {
  /**
   * Which of M3's alignments the text takes. `center` is the configuration
   * that replaced the old center-aligned variant.
   * @default 'start'
   */
  align?: 'center' | 'start'
  /**
   * Collapses a flexible bar to the height and headline of the small one, for
   * a pinned bar over content that has been scrolled. M3 specifies it for the
   * flexible sizes, and without it a pinned `large` costs 152px of the
   * viewport for as long as the page is open.
   *
   * Controlled, and for the same reason `scrolled` is: only the app knows
   * which element scrolls, and how far into it the bar should have finished
   * collapsing. Usually set from the same handler.
   *
   * Ignored on `small`, which is already the height this collapses to. The
   * subtitle goes with the height, since there is no room for a second line
   * in the small bar.
   *
   * **The scroll container needs `overflow-anchor: none`.** Collapsing hands
   * the page back the height the bar gives up, and browsers answer a change
   * in height above the viewport by moving the scroll offset by exactly that
   * amount, so the content underneath stays where it was. That offset is
   * what the call site derived `collapsed` from, so it lands back under the
   * threshold, the bar expands, the offset is restored, and the two take
   * turns for as long as the reader stays in that band. Turning anchoring off
   * is what breaks the loop, and it is also the movement you want: the
   * content follows the bar's bottom edge up rather than standing still while
   * the bar shrinks behind it.
   *
   * No threshold avoids this on its own. The unstable band is as tall as the
   * height the bar gives back and it sits directly above wherever the
   * threshold is put, so moving the threshold moves the band with it.
   * @default false
   */
  collapsed?: boolean
  /**
   * Where the bar's content starts, measured to the headline. A leading slot
   * sits 12px before that, which is the room an icon button's own padding
   * fills around its glyph — M3's arrangement, and what makes a bar with an
   * icon and one without start their text in the same place.
   *
   * The default is M3's own margin for a top app bar, which is also the
   * margin it gives body content, so a bar and the page beneath line up
   * without either being told about the other. Set it to the page's gutter
   * where that differs.
   * @default '16px'
   */
  contentInset?: string
  /**
   * How wide the bar's contents may run before they stop growing, with the
   * row centred in whatever is left. The bar's own surface still paints edge
   * to edge.
   *
   * This is what lines a full-bleed bar up with a page whose content sits in
   * a measure: give it the page's measure, and `contentInset` the page's
   * gutter. Unset, the row is as wide as the bar.
   */
  contentMaxInlineSize?: string
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
 * and `collapsed` exist. Neither watches the page: only the app knows which
 * element scrolls, so both are set from its own scroll handler.
 */
function AppBar({
  align = 'start',
  collapsed = false,
  contentInset = DEFAULT_CONTENT_INSET,
  contentMaxInlineSize = 'none',
  headline,
  leading,
  render,
  scrolled = false,
  size = 'small',
  subtitle,
  trailing,
  ...props
}: AppBarProps) {
  // `small` is already what the flexible bars collapse to, so collapsing it is
  // a no-op rather than an error. A bar whose size is chosen at the call site
  // from a breakpoint would otherwise have to guard the prop as well.
  const collapse = collapsed && size !== 'small'
  const expandedHeight =
    subtitle === undefined || subtitle === null
      ? HEIGHTS[size].plain
      : HEIGHTS[size].withSubtitle
  const height = collapse ? COLLAPSED_HEIGHT : expandedHeight

  return useRender({
    defaultTagName: 'header',
    props: {
      ...props,
      children: (
        <div
          {...stylex.props(
            styles.row,
            rowStyles.root(contentInset, contentMaxInlineSize),
          )}
        >
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
              <Text
                {...stylex.props(styles.headline)}
                render={HEADING_1}
                variant={
                  collapse ? HEADLINE_VARIANT.small : HEADLINE_VARIANT[size]
                }
              >
                {headline}
              </Text>
            )}
            {subtitle === undefined || collapse ? null : (
              <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
                {subtitle}
              </Text>
            )}
          </div>
          {trailing === undefined ? null : (
            <div {...stylex.props(styles.slot)}>{trailing}</div>
          )}
        </div>
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
