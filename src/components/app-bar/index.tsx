'use client'

import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'
import { createElement } from 'react'

import type { RenderComponentProps } from '../../render/useRender'

import { hasContent } from '../../render/content'
import { useRender } from '../../render/useRender'
import { mergeStyles } from '../../styles/merge'
import {
  colors,
  motion,
  sizing,
  spacing,
} from '../../tokens/design.tokens.stylex'
import Text from '../text'

// Material Design's app bar, in the three sizes the spec recommends.
//
// `md` and `lg` are Material Design's medium and large *flexible* bars, the
// newer of the two sets the spec gives and the one it recommends, which is why
// those two steps are theirs.
//
// Material Design also merged the old center-aligned variant into small as a
// configuration rather than a variant, which is why alignment is a prop here
// and applies to every size.
//
// Heights are Material Design's, and they are minimums rather than fixed. The
// spec says the flexible bars "hug the text contents" and gives them multi-line
// support and text wrapping, so a headline long enough to wrap has to be able
// to make its bar taller. Fixing the height would truncate exactly the case
// the variant was redesigned for.

// The geometry Material Design lays a bar's icon buttons out on. Its tokens
// give a 4dp leading and trailing space between the bar's edge and the first
// button's 48dp target, no space between one target and the next, and a 24dp
// icon centred in each — so a glyph lands 4 + 12 = 16dp in, on the page's own
// margin.
//
// The library's icon button draws a 40dp box with its 48dp target out of
// flow, so a slot pads half the difference either side and puts the whole
// difference between two buttons, which lays the targets edge to edge as the
// tokens do. The target is IconButton's TARGET_SIZE, a literal there for the
// reason it gives: it is a floor the page states, not a step of the control
// scale.
const ICON_BUTTON_TARGET = '48px'
const ICON_SIZE = '24px'

// How far an icon sits inside its target, which is how much less than the
// content inset the row is padded on an edge that holds a slot. That is what
// puts a leading glyph, rather than the edge of its target, at the inset.
const GLYPH_INSET = `(${ICON_BUTTON_TARGET} - ${ICON_SIZE}) / 2`

const HEIGHTS = {
  lg: { plain: '120px', withSubtitle: '152px' },
  md: { plain: '112px', withSubtitle: '136px' },
  sm: { plain: '64px', withSubtitle: '64px' },
} as const

// What a flexible bar collapses to, which is the small bar exactly. Material
// Design does not describe the collapsed large bar as a state of its own — it
// describes it as becoming the small bar, which is why this reads off the same
// table rather than being a fourth height.
const COLLAPSED_HEIGHT = HEIGHTS.sm.plain

// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

const styles = stylex.create({
  // Collapsing swaps the headline's type role, which is a change of class
  // rather than of value — but the properties underneath still transition,
  // so the type resizes with the bar instead of snapping when it arrives.
  headline: {
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    transitionDuration: motion.durationMedium1,
    transitionProperty: 'font-size, letter-spacing, line-height',
    transitionTimingFunction: motion.easingEmphasized,
  },
  root: {
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
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
  // Material Design replaced the drop shadow it once gave a scrolled bar with
  // a colour fill, so a bar over scrolled content separates by sitting on a
  // different surface rather than by casting anything.
  //
  // Forced colours paints that fill in the page's own `Canvas`, so the bar
  // and the content under it ran together; there it draws an edge instead.
  scrolled: {
    backgroundColor: colors.surfaceContainer,
    borderBlockEndColor: { default: null, [FORCED_COLORS]: 'CanvasText' },
    borderBlockEndStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderBlockEndWidth: { default: null, [FORCED_COLORS]: '1px' },
  },
  // Slots hold their own size rather than being squeezed by a long headline,
  // and draw their icon buttons on the targets the spec spaces them by — see
  // ICON_BUTTON_TARGET.
  slot: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    flexShrink: 0,
    gap: `calc(${ICON_BUTTON_TARGET} - ${sizing.controlSm})`,
    paddingInline: `calc((${ICON_BUTTON_TARGET} - ${sizing.controlSm}) / 2)`,
  },
  // The text block takes the space the slots leave, and wraps inside it —
  // inside a word too, where a word is wider than the room. A line breaks
  // only between words otherwise, so one long compound held its line at its
  // own width, ran under the trailing slot and widened the page. Hyphenated
  // in the page's language where it has one, and broken anywhere where it
  // does not.
  text: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    hyphens: 'auto',
    justifyContent: 'center',
    minInlineSize: 0,
    overflowWrap: 'anywhere',
    paddingBlock: spacing.sm,
  },
  textCenter: {
    textAlign: 'center',
  },
})

// One entry per size, and each names a type role rather than a figure.
// Material Design's own tokens are `md.comp.app-bar.<size>.title.font`,
// aliases onto the type scale rather than sizes of their own, so this maps to
// the scale the same way and lets Text apply it.
const HEADLINE_VARIANT = {
  lg: 'headlineMedium',
  md: 'headlineSmall',
  sm: 'titleLarge',
} as const

// The headline is the page's title in Material Design's model, so it is the
// page's <h1> unless the call site says otherwise. `headingLevel` is what says
// otherwise, and a bar drawn beside another bar — one per pane in a
// `ListDetail` or a `SupportingPane` — or under a page heading of its own
// should lower it.
//
// Built here rather than kept as a constant per level: `headline` becomes the
// heading's children, so a call site cannot demote the heading by passing one
// of its own. `headline={<h2>…</h2>}` renders an h2 inside the h1 — two
// headings where one was wanted, which React does not warn about.
//
// The level is looked up rather than interpolated into a tag name. `h7` is a
// custom element as far as React is concerned, so it renders without a word
// said and leaves the outline worse than the default would have. Disclosure's
// own `headingLevel` hands the number to React Aria, which is why that one
// needs no equivalent.
const HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const

function heading(level: number) {
  const index = Math.min(Math.max(Math.round(level), 1), HEADINGS.length) - 1
  return createElement(HEADINGS[index])
}

const PARAGRAPH = <p />

// Height is the one value the call site does not choose, and it depends on two
// props at once, so it is a function style rather than one key per
// combination. StyleX writes it to a custom property inline, the same
// mechanism Feed uses for its cell minimum.
const heightStyles = stylex.create({
  root: (minBlockSize: string) => ({ minBlockSize }),
})

// The row's measure and inset both come from the call site, so both are
// function styles too. Each edge is worked out on its own: where it holds a
// slot the row stops short of the inset by GLYPH_INSET, so the glyph rather
// than its target is what sits at the inset, and where it holds none the
// headline itself starts there. Clamped at zero, since an inset smaller than
// a glyph's own room would otherwise ask for a negative padding, which CSS
// throws away whole.
const rowStyles = stylex.create({
  root: (start: string, end: string, maxInlineSize: string) => ({
    maxInlineSize,
    paddingInlineEnd: end,
    paddingInlineStart: start,
  }),
})

type AppBarProps = Omit<RenderComponentProps<'header'>, 'children'> & {
  /**
   * Which of Material Design's alignments the text takes. `center` is the
   * configuration that replaced the old center-aligned variant.
   * @default 'start'
   */
  align?: 'center' | 'start'
  /**
   * Collapses a flexible bar to the height and headline of the small one, for
   * a pinned bar over content that has been scrolled. Material Design
   * specifies it for the flexible sizes, and without it a pinned `lg` costs
   * 152px of the viewport for as long as the page is open.
   *
   * Controlled, and for the same reason `scrolled` is: only the app knows
   * which element scrolls, and how far into it the bar should have finished
   * collapsing. Usually set from the same handler.
   *
   * Ignored on `sm`, which is already the height this collapses to. The
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
   * Where the bar's content starts on each edge: the headline where nothing
   * comes before it, and the leading icon's glyph where something does, with
   * the headline after the icon button's target. The trailing edge is the
   * same mirrored. Any length works, `0` included, for a bar drawn flush.
   *
   * The default is Material Design's own margin for a top app bar, the
   * spacing scale's `lg` step, which is also the margin it gives body
   * content, so a bar and the page beneath line up without either being told
   * about the other. Set it to the page's gutter where that differs.
   * @default spacing.lg
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
  /**
   * Where the headline sits in the page's outline. A screen reader moves
   * between headings, so a bar drawn beside another bar, or under a page
   * heading of its own, should lower it.
   * @default 1
   */
  headingLevel?: number
  /** The page's title. Wraps rather than truncating, and grows the bar with it. */
  headline?: ReactNode
  /** Usually a back or menu icon button. Sits before the text. */
  leading?: ReactNode
  /**
   * Whether the content beneath has been scrolled. Material Design separates
   * a bar from scrolled content with a fill colour rather than a shadow, and
   * this is what applies it.
   *
   * Controlled, with no listener of its own: only the app knows which element
   * scrolls, and a bar that watched the window would be wrong inside every
   * pane and dialog that scrolls independently.
   * @default false
   */
  scrolled?: boolean
  /**
   * Height and headline size, as steps of the library's size scale. `sm` is
   * Material Design's small bar, a fixed 64px; `md` and `lg` are its medium
   * and large flexible bars, which hug their text.
   * @default 'sm'
   */
  size?: 'lg' | 'md' | 'sm'
  /** A second line under the headline. Makes `md` and `lg` taller. */
  subtitle?: ReactNode
  /** Actions, at the far end. Usually icon buttons. */
  trailing?: ReactNode
}

/**
 * Material Design's app bar: the container at the top of a page carrying its
 * title, one or two actions, and the way back out.
 *
 * Three sizes. `sm` is a fixed 64px bar for a page whose title is a label;
 * `md` and `lg` are the flexible bars, which give the headline a larger
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
  contentInset = spacing.lg,
  contentMaxInlineSize = 'none',
  headingLevel = 1,
  headline,
  leading,
  render,
  scrolled = false,
  size = 'sm',
  subtitle,
  trailing,
  ...props
}: AppBarProps) {
  // `sm` is already what the flexible bars collapse to, so collapsing it is
  // a no-op rather than an error. A bar whose size is chosen at the call site
  // from a breakpoint would otherwise have to guard the prop as well.
  const collapse = collapsed && size !== 'sm'
  const expandedHeight = hasContent(subtitle)
    ? HEIGHTS[size].withSubtitle
    : HEIGHTS[size].plain
  const height = collapse ? COLLAPSED_HEIGHT : expandedHeight
  const hasLeading = hasContent(leading)
  const hasTrailing = hasContent(trailing)

  return useRender({
    defaultTagName: 'header',
    props: {
      ...props,
      children: (
        <div
          {...stylex.props(
            styles.row,
            rowStyles.root(
              edgePadding(contentInset, hasLeading),
              edgePadding(contentInset, hasTrailing),
              contentMaxInlineSize,
            ),
          )}
        >
          {!hasLeading ? null : (
            <div {...stylex.props(styles.slot)}>{leading}</div>
          )}
          <div
            {...stylex.props(
              styles.text,
              align === 'center' && styles.textCenter,
            )}
          >
            {!hasContent(headline) ? null : (
              <Text
                {...stylex.props(styles.headline)}
                render={heading(headingLevel)}
                variant={
                  collapse ? HEADLINE_VARIANT.sm : HEADLINE_VARIANT[size]
                }
              >
                {headline}
              </Text>
            )}
            {!hasContent(subtitle) || collapse ? null : (
              <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
                {subtitle}
              </Text>
            )}
          </div>
          {!hasTrailing ? null : (
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

/**
 * The row's padding on one edge, for the inset the call site gave.
 *
 * A bare `0` is the one length CSS accepts without a unit, and the one it
 * rejects inside `max()`, where it reads as a number, so it is given its
 * unit before the arithmetic sees it.
 */
function edgePadding(contentInset: string, hasSlot: boolean) {
  const inset = contentInset.trim() === '0' ? '0px' : contentInset
  return hasSlot ? `max(0px, ${inset} - ${GLYPH_INSET})` : inset
}

export type { AppBarProps }

export default AppBar
