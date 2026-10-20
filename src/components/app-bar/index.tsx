'use client'

import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'
import { createElement, useLayoutEffect, useRef } from 'react'

import type { RenderComponentProps } from '../../render/useRender'

import { COLLAPSED_BLOCK_SIZE } from '../../hooks/useAppBarScroll'
import { hasContent } from '../../render/content'
import { useRender } from '../../render/useRender'
import { layers } from '../../styles/layers.stylex'
import { mergeStyles } from '../../styles/merge'
import {
  colors,
  motion,
  sizing,
  spacing,
} from '../../tokens/design.tokens.stylex'
import { motionDurationMs, motionEasing } from '../../tokens/values'
import Text from '../text'

// Material Design's app bar, in the three sizes the spec recommends.
//
// `md` and `lg` are Material Design's medium and large *flexible* bars, the
// newer of the two sets the spec gives and the one it recommends, which is why
// those two steps are theirs: their heights, their two rows, and their type
// roles, which HEADLINE_VARIANT and SUBTITLE_VARIANT name.
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
//
// The small bar is one row: the leading slot, the text and the trailing slot
// side by side in a 64px strip. The flexible bars are two, as Material Design
// lays them out. The first is that same strip holding the slots alone, and the
// second runs the text under it across the whole measure, so a long headline
// wraps against the bar's width rather than against what the slots leave.
// Collapsing moves the text up into the strip, which is the small bar exactly,
// and the slots never move: they are in the strip in both states.
//
// Centred text is centred on the bar, not in the room the slots leave, which
// is how Material Design places it: with a leading icon and no actions, the
// room between the two is off the bar's middle by half the icon. So a centred
// strip's side columns share what the text leaves equally, whatever is in
// them, and the text moves off the middle only where a wide slot needs the
// room — see `centredColumns`.
//
// The slots set the colours the page gives their icons: on surface for the
// leading one and on surface variant for the trailing ones. The second is a
// standard icon button's own colour, and the first is not, so the leading
// slot also sets the property a standard icon button reads its colour from —
// see `standard` in src/components/icon-button/index.tsx.

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
  sm: {
    plain: `${COLLAPSED_BLOCK_SIZE}px`,
    withSubtitle: `${COLLAPSED_BLOCK_SIZE}px`,
  },
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
  // The slot that comes before the text, with the space between the two on
  // its own side. A margin rather than a gap on the grid, which would open
  // beside an empty column as well and push the headline off its inset.
  //
  // Its colour and the icon button's are on surface — see the header.
  leading: {
    '--icon-button-standard-color': colors.onSurface,
    color: colors.onSurface,
    gridArea: 'leading',
    justifySelf: 'start',
    marginInlineEnd: spacing.xs,
  },
  // Held at the top of the scroll container as the content scrolls beneath
  // it, and painted over that content — see `bar` in
  // src/styles/layers.stylex.ts. Without the layer, anything in the content
  // that is positioned, which is most of the library's controls, painted
  // over the bar as it passed under.
  pinned: {
    insetBlockStart: 0,
    position: 'sticky',
    zIndex: layers.bar,
  },
  root: {
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    // Stretched rather than centred, so the row is as tall as the bar and
    // its strip is at the bar's top edge.
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    boxSizing: 'border-box',
    display: 'flex',
    // The bar paints edge to edge and its contents sit in a measured row
    // inside it, so a full-bleed bar can still line its contents up with the
    // page beneath.
    justifyContent: 'center',
    // `scrolled` moves the fill and `collapsed` moves the height, and both
    // answer the same scroll, so the two have to move together. The height
    // is animated by useCollapseMotion below, on the same duration and curve,
    // which is what keeps the two from looking like separate events — a fill
    // that has finished settling while the bar is still shrinking reads as
    // two things happening rather than one.
    transitionDuration: motion.durationMedium1,
    transitionProperty: 'background-color',
    transitionTimingFunction: motion.easingEmphasized,
  },
  // The strip every bar has, and the whole of the small one: three columns,
  // the slots either side of the text. The track is the strip's height at
  // least and stays at the top of the bar, rather than stretching with it, so
  // a bar still shrinking from a flexible height already has its slots where
  // they will end. The strip's height and the columns are set beside the
  // measure, in rowStyles, and `twoRows` adds the second row.
  row: {
    alignContent: 'start',
    boxSizing: 'border-box',
    display: 'grid',
    gridTemplateAreas: '"leading text trailing"',
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
    alignSelf: 'center',
    boxSizing: 'border-box',
    display: 'flex',
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
    alignSelf: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gridArea: 'text',
    hyphens: 'auto',
    minInlineSize: 0,
    overflowWrap: 'anywhere',
    paddingBlock: spacing.sm,
  },
  // In the second row the text sits on its baseline rather than in the
  // middle — see `twoRows` — and needs no padding of its own above or below:
  // the strip is above it, and the baseline's distance from the bar's edge
  // is below.
  textBelow: {
    alignSelf: 'last baseline',
    paddingBlock: 0,
  },
  textCenter: {
    textAlign: 'center',
  },
  // The slot that comes after the text, mirroring `leading`, in the colour a
  // standard icon button already draws in.
  trailing: {
    color: colors.onSurfaceVariant,
    gridArea: 'trailing',
    justifySelf: 'end',
    marginInlineStart: spacing.xs,
  },
})

// The flexible bars' two rows: the strip with the slots at either end, and the
// text under it across all three columns. The second row takes whatever height
// the bar has beyond the strip, and the text sits at its bottom.
//
// Material Design places that text by its last baseline, 28px above the large
// bar's bottom edge and 24px above the medium one's, and that is the reading
// that makes the heights above come out, together with the reach textStyles
// gives the text: the same figures as padding under the line box would make a
// plain large bar 64 + 44 + 28 = 136px rather than 120px. CSS gives a box no
// margin below its baseline, so the strut does it.
// An empty box in the same grid area, aligned on its last baseline with the
// text, has its baseline at its own bottom edge and the margin under that, so
// the pair is held that far off the row's end. Literals rather than tokens,
// like HEIGHTS: they are measurements the spec gives this component, not steps
// of the spacing scale, which has no 28.
const twoRows = stylex.create({
  lg: {
    '::after': {
      alignSelf: 'last baseline',
      blockSize: 0,
      boxSizing: 'border-box',
      content: '""',
      gridArea: 'text',
      marginBlockEnd: '28px',
    },
    gridTemplateAreas: '"leading . trailing" "text text text"',
  },
  md: {
    '::after': {
      alignSelf: 'last baseline',
      blockSize: 0,
      boxSizing: 'border-box',
      content: '""',
      gridArea: 'text',
      marginBlockEnd: '24px',
    },
    gridTemplateAreas: '"leading . trailing" "text text text"',
  },
})

// One entry per size, and each names a type role rather than a figure.
// Material Design's own tokens are `md.comp.app-bar.<size>.title.font`,
// aliases onto the type scale rather than sizes of their own, so this maps to
// the scale the same way and lets Text apply it. The roles are the flexible
// bars': headlineMedium on medium and displaySmall on large, which is a step
// up from what the spec's other medium and large bars take, and the small
// bar's titleLarge.
const HEADLINE_VARIANT = {
  lg: 'displaySmall',
  md: 'headlineMedium',
  sm: 'titleLarge',
} as const

// The subtitle's role, by the same tokens' `subtitle.font`. Material Design
// gives each size its own rather than one role at every size, and a collapsed
// bar takes the small bar's, as it takes its headline's.
const SUBTITLE_VARIANT = {
  lg: 'titleMedium',
  md: 'labelLarge',
  sm: 'labelMedium',
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
// said and leaves the outline worse than the default would have. The prop's
// type is the six levels, and a value outside them from a call site the type
// does not reach — `NaN`, which rounded and clamped to no element at all and
// took the headline out of the outline — falls back to the default h1.
// Disclosure's own `headingLevel` hands the number to React Aria, which is
// why that one needs no equivalent.
const HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const

function heading(level: number) {
  const known = Number.isInteger(level) && level >= 1 && level <= 6
  return createElement(known ? HEADINGS[level - 1] : HEADINGS[0])
}

const PARAGRAPH = <p />

// Height is the one value the call site does not choose, and it depends on two
// props at once, so it is a function style rather than one key per
// combination. StyleX writes it to a custom property inline, the same
// mechanism Feed uses for its cell minimum.
//
// The row takes it too, and that is for the collapse's motion. The bar's
// height is animated, and a row that only stretched to it would be laid out
// at every height the bar passed through: the second row is the room the bar
// has beyond the strip, so its text would ride up and down with the bar
// rather than holding the place the animation moves it to. With the minimum
// of its own, the row is laid out once, at the height the bar is heading for,
// and the bar clips it until it gets there.
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
//
// The tracks are a function style for two other reasons: the strip is the
// small bar's height, which is the hook's constant, and the compiler cannot
// read a constant out of another module — see FORCED_COLORS; and a centred
// bar's columns depend on the inset — see `centredColumns`.
const rowStyles = stylex.create({
  root: (start: string, end: string, maxInlineSize: string) => ({
    maxInlineSize,
    paddingInlineEnd: end,
    paddingInlineStart: start,
  }),
  tracks: (gridTemplateColumns: string, gridTemplateRows: string) => ({
    gridTemplateColumns,
    gridTemplateRows,
  }),
})

// A bar's columns with its text at the start: the slots at their own widths
// and the text taking what they leave.
const START_COLUMNS = 'auto minmax(0, 1fr) auto'

// The text in the second row runs under the slots as well as between them, so
// it puts back what the row's padding held off an edge for a slot's glyph, and
// the headline starts on the inset again. A function style for the reason the
// row's padding is one.
//
// It also reaches up into the strip, by the band under the slots' targets,
// and Material Design's heights depend on that. A large bar's 36/44 headline
// with its baseline 28px above a 120px bar's edge has the top of its line box
// inside the strip, and so does the medium bar's 28/36 one: measured, the two
// bars came out 126px and 115px tall without it. What reaches in is the line's
// leading and the room above its capitals rather than any glyph, and it stops
// where the targets do, so nothing a reader can press is under it. A function
// style because the strip's height is the hook's constant — see rowStyles.
const textStyles = stylex.create({
  inset: (start: string, end: string) => ({
    paddingInlineEnd: end,
    paddingInlineStart: start,
  }),
  reach: (marginBlockStart: string) => ({ marginBlockStart }),
})

// How far the strip runs on below the slots' targets, which are centred in it.
const UNDER_TARGETS = `calc((${COLLAPSED_HEIGHT} - ${ICON_BUTTON_TARGET}) / 2)`

type AppBarProps = Omit<RenderComponentProps<'header'>, 'children'> & {
  /**
   * Which of Material Design's alignments the text takes. `center` is the
   * configuration that replaced the old center-aligned variant, and centres
   * the text on the bar rather than between the slots, so a bar with a
   * leading icon and no actions still has its headline in the middle. The
   * text moves off the middle only as far as a slot wider than the other
   * needs, rather than running under it.
   * @default 'start'
   */
  align?: 'center' | 'start'
  /**
   * Collapses a flexible bar to the height and headline of the small one, for
   * a bar `pinned` over content that has been scrolled. Material Design
   * specifies it for the flexible sizes, and without it a pinned `lg` costs
   * 152px of the viewport for as long as the page is open.
   *
   * Controlled, and for the same reason `scrolled` is: only the app knows
   * which element scrolls, and how far into it the bar should have finished
   * collapsing. `useAppBarScroll` derives both from that element's scroll,
   * and is the way to set them unless the app needs a rule of its own.
   *
   * Ignored on `sm`, which is already the height this collapses to. The
   * headline and the subtitle move up into the row the slots sit in and take
   * the small bar's type roles, which fit both lines in its 64px, and the
   * slots never leave that row: they stay where they are while the bar
   * shrinks under them.
   *
   * Collapsing hands the page back the height the bar gives up, and a bar
   * whose state is read off the scroll offset can then undo itself in two
   * ways. Both move the offset back under the threshold, so the bar expands,
   * the page regains its height, and the two take turns for as long as the
   * reader stays there.
   *
   * - **Scroll anchoring.** Browsers answer a change in height above the
   *   viewport by moving the offset by the same amount, to keep the content
   *   in place. Give the scroll container `overflow-anchor: none`, which is
   *   also the movement you want: the content follows the bar's bottom edge
   *   up rather than standing still while the bar shrinks behind it.
   * - **The shorter page.** A page that overflows by less than the threshold
   *   plus the height the bar gives back cannot scroll that far once the bar
   *   has collapsed, so the browser pulls the offset back inside it. No
   *   threshold avoids this, since the band moves with it; what does is not
   *   collapsing on such a page, which is the rule `useAppBarScroll` applies.
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
   * Where the headline sits in the page's outline, as one of the six heading
   * levels. A screen reader moves between headings, so a bar drawn beside
   * another bar, or under a page heading of its own, should lower it. A value
   * outside the six that reaches it untyped falls back to 1.
   * @default 1
   */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  /** The page's title. Wraps rather than truncating, and grows the bar with it. */
  headline?: ReactNode
  /**
   * Usually a back or menu icon button. Sits before the text, and a standard
   * icon button here draws its icon in on surface, the colour the page gives
   * a bar's leading icon, rather than its own on surface variant.
   */
  leading?: ReactNode
  /**
   * Holds the bar at the top of its scroll container while the content
   * scrolls beneath it, and keeps it painted over that content. The bar
   * still needs a scrolling ancestor to stick inside: the window, or an
   * element with its own overflow. A pinned bar is the one `collapsed` and
   * `scrolled` are for.
   * @default false
   */
  pinned?: boolean
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
   * Material Design's small bar, a fixed 64px row; `md` and `lg` are its
   * medium and large flexible bars, which put the text in a row of its own
   * under the slots and hug it.
   * @default 'sm'
   */
  size?: 'lg' | 'md' | 'sm'
  /** A second line under the headline. Makes `md` and `lg` taller. */
  subtitle?: ReactNode
  /** Actions, at the far end. Usually icon buttons. */
  trailing?: ReactNode
}

// The text block's two lines: the headline, and the subtitle beside it. The
// block holds nothing else, and each is drawn as one kind of element.
const LINES = [':scope > :is(h1, h2, h3, h4, h5, h6)', ':scope > p'] as const

/**
 * What collapsing moves, and so what its animation runs between: the bar's
 * height, and each of the text's lines, in the order LINES gives them, with
 * `null` for a line the bar does not draw.
 */
type Geometry = { height: number; lines: (Line | null)[] }

/**
 * Where one of the text's lines is drawn: the point its glyphs hang from,
 * measured from the bar's own corner, and its type size. The point is the
 * top of the line's first glyphs, on the edge the text hangs from.
 */
type Line = { size: number; x: number; y: number }

/**
 * Material Design's app bar: the container at the top of a page carrying its
 * title, one or two actions, and the way back out.
 *
 * Three sizes. `sm` is a fixed 64px bar for a page whose title is a label;
 * `md` and `lg` are the flexible bars, which give the headline a larger
 * type role in a row of its own under the slots, and grow to fit a subtitle
 * or a headline that wraps.
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
  pinned = false,
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
  // The flexible bars at their full height are the only state with a second
  // row. Collapsed, they are the small bar.
  const below = size !== 'sm' && !collapse
  const expandedHeight = hasContent(subtitle)
    ? HEIGHTS[size].withSubtitle
    : HEIGHTS[size].plain
  const height = collapse ? COLLAPSED_HEIGHT : expandedHeight
  const hasLeading = hasContent(leading)
  const hasTrailing = hasContent(trailing)
  // A centred bar pads both edges as one holding a slot would, so the row
  // is the same either side of the middle — see `centredColumns`.
  const centred = align === 'center'
  const hasSlot = hasLeading || hasTrailing
  const padsForStart = centred ? hasSlot : hasLeading
  const padsForEnd = centred ? hasSlot : hasTrailing
  const textRef = useCollapseMotion(collapse, align)

  return useRender({
    defaultTagName: 'header',
    props: {
      ...props,
      children: (
        <div
          {...stylex.props(
            styles.row,
            rowStyles.root(
              edgePadding(contentInset, padsForStart),
              edgePadding(contentInset, padsForEnd),
              contentMaxInlineSize,
            ),
            rowStyles.tracks(
              centred
                ? centredColumns(contentInset, hasLeading, hasTrailing)
                : START_COLUMNS,
              below
                ? `minmax(${COLLAPSED_HEIGHT}, auto) 1fr`
                : `minmax(${COLLAPSED_HEIGHT}, auto)`,
            ),
            heightStyles.root(height),
            below && twoRows[size],
          )}
        >
          {!hasLeading ? null : (
            <div {...stylex.props(styles.slot, styles.leading)}>{leading}</div>
          )}
          <div
            {...stylex.props(
              styles.text,
              below && styles.textBelow,
              below &&
                textStyles.inset(
                  glyphRoom(contentInset, padsForStart),
                  glyphRoom(contentInset, padsForEnd),
                ),
              below && textStyles.reach(`calc(-1 * ${UNDER_TARGETS})`),
              align === 'center' && styles.textCenter,
            )}
            ref={textRef}
          >
            {!hasContent(headline) ? null : (
              <Text
                render={heading(headingLevel)}
                variant={
                  collapse ? HEADLINE_VARIANT.sm : HEADLINE_VARIANT[size]
                }
              >
                {headline}
              </Text>
            )}
            {!hasContent(subtitle) ? null : (
              <Text
                render={PARAGRAPH}
                tone="muted"
                variant={
                  collapse ? SUBTITLE_VARIANT.sm : SUBTITLE_VARIANT[size]
                }
              >
                {subtitle}
              </Text>
            )}
          </div>
          {!hasTrailing ? null : (
            <div {...stylex.props(styles.slot, styles.trailing)}>
              {trailing}
            </div>
          )}
        </div>
      ),
      ...mergeStyles(
        stylex.props(
          styles.root,
          heightStyles.root(height),
          scrolled && styles.scrolled,
          pinned && styles.pinned,
        ),
        props,
      ),
    },
    render,
  })
}

/**
 * A centred bar's columns: the text in the middle at its own width, and a
 * column either side sharing what it leaves equally, so the text is centred
 * on the row. A side column is never narrower than its slot, which is what
 * moves the text off the middle when a slot is wider than the other side's
 * share, and never as far as overlapping it.
 *
 * The row pads both edges for a slot, so the two sides match, and an edge
 * with no slot puts back what that padding held off for a glyph as its
 * column's least width. A headline long enough to reach that edge stops on
 * the inset, as it does at the start.
 */
function centredColumns(
  contentInset: string,
  hasLeading: boolean,
  hasTrailing: boolean,
) {
  const room = glyphRoom(contentInset, hasLeading || hasTrailing)
  const side = (hasSlot: boolean) =>
    hasSlot ? 'minmax(auto, 1fr)' : `minmax(${room}, 1fr)`
  return `${side(hasLeading)} auto ${side(hasTrailing)}`
}

/**
 * Where an animation still under way has the bar and the text drawn: the
 * height it holds the bar at, and each line where its transform has taken it
 * and at the size its scale has reached. A line scales about the point it
 * hangs from, so the transform's translation is how far that point has moved.
 */
function drawnAt(
  bar: HTMLElement,
  text: HTMLElement,
  settled: Geometry,
): Geometry {
  return {
    height: bar.getBoundingClientRect().height,
    lines: LINES.map((selector, index) => {
      const line = settled.lines[index]
      const element = text.querySelector(selector)
      if (line === null || element === null) {
        return null
      }
      const moved = matrixOf(element)
      return {
        size: line.size * moved.a,
        x: line.x + moved.e,
        y: line.y + moved.f,
      }
    }),
  }
}

/** The row's padding on one edge, for the inset the call site gave. */
function edgePadding(contentInset: string, hasSlot: boolean) {
  const inset = withUnit(contentInset)
  return hasSlot ? `max(0px, ${inset} - ${GLYPH_INSET})` : inset
}

/**
 * Where the bar and each of the text's lines are drawn. A line's point is on
 * the edge its text hangs from: the middle when it is centred, and the start
 * edge otherwise, which is the right edge in a right-to-left page. Each line
 * is as wide as the text block, so that edge is its box's.
 */
function geometryOf(
  bar: HTMLElement,
  text: HTMLElement,
  align: 'center' | 'start',
): Geometry {
  const frame = bar.getBoundingClientRect()
  return {
    height: frame.height,
    lines: LINES.map((selector) => {
      const element = text.querySelector(selector)
      if (element === null) {
        return null
      }
      const box = element.getBoundingClientRect()
      const edge =
        align === 'center'
          ? (box.left + box.right) / 2
          : isRightToLeft(element)
            ? box.right
            : box.left
      return {
        size: Number.parseFloat(getComputedStyle(element).fontSize),
        x: edge - frame.left,
        y: glyphTopOf(element) - frame.top,
      }
    }),
  }
}

/**
 * What the row's padding held back on one edge for a slot's glyph, which the
 * text in the second row puts back: the inset less `edgePadding`, so the
 * smaller of the inset and GLYPH_INSET.
 */
function glyphRoom(contentInset: string, hasSlot: boolean) {
  return hasSlot ? `min(${withUnit(contentInset)}, ${GLYPH_INSET})` : '0px'
}

/**
 * Where an element's first glyphs start, which is below its box's top by
 * half its line's leading. The leading is a share of the line height, and
 * the two roles a line moves between do not keep line height and type size
 * in one ratio, so a line scaled by its type size from its box's corner
 * starts its glyphs off where they were drawn: about a pixel, for a large
 * bar's headline.
 */
function glyphTopOf(element: Element) {
  const range = document.createRange()
  range.selectNodeContents(element)
  const first = range.getClientRects().item(0)
  return first === null ? element.getBoundingClientRect().top : first.top
}

/** Whether the text runs right to left, which decides the edge it hangs from. */
function isRightToLeft(element: Element) {
  return getComputedStyle(element).direction === 'rtl'
}

/** The transform an element is drawn with, `none` reading as no change. */
function matrixOf(element: Element) {
  return new DOMMatrixReadOnly(getComputedStyle(element).transform)
}

/**
 * The point a line scales about, in its own box: the top of its glyphs, on
 * the edge its text hangs from.
 */
function originOf(element: Element, align: 'center' | 'start') {
  const edge =
    align === 'center' ? 'center' : isRightToLeft(element) ? 'right' : 'left'
  const glyphs = glyphTopOf(element) - element.getBoundingClientRect().top
  return `${edge} ${glyphs}px`
}

/**
 * Read when the bar changes state rather than once at mount, so a reader who
 * changes the setting is answered by the next collapse.
 */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Animates a flexible bar between its two states, and returns the ref for the
 * text block whose lines it moves.
 *
 * Collapsing changes the bar's layout rather than a value — the text leaves
 * the second row for the strip, both lines take the small bar's type roles,
 * and the bar's height drops from a minimum to whatever its content takes —
 * so there is nothing for a CSS transition to interpolate. This plays it the
 * other way round: the change has already been laid out when the effect runs,
 * so the bar is animated from the height it had to the one it has, and each
 * line from where and how large it was drawn to where and how large it is,
 * by a transform that starts at the difference and ends at none. A line
 * scales about the point its glyphs hang from, which is what lands its first
 * frame on the glyphs it replaces — see glyphTopOf. A scale rather than a
 * transition of the type itself, which would lay the text out again on every
 * frame and move it away from the place it was measured at. Each line moves
 * on its own rather than with the block, since the subtitle starts under the
 * headline's line, whose height changes with its role. The slots need
 * nothing: they are in the strip in both states.
 *
 * The bar's height is animated through `min-block-size` as well as its
 * height, since the minimum would otherwise hold an expanding bar at its new
 * height from the first frame, and it is clipped while it moves, since an
 * expanding bar's second row is laid out at full height from the start.
 *
 * Where the text was is measured after every commit that leaves the state
 * alone, so it is current when the state does change. A change that lands
 * while the last one is still moving starts from where the bar and the text
 * are drawn at that moment, read off the running animations, so reversing
 * mid-way turns round rather than jumping to the end first.
 *
 * Its timing is the root's `background-color` transition's, the `medium1`
 * duration and the emphasized curve, so the fill and the height move as one.
 * Those come from tokens/values rather than the theme, since `animate()`
 * throws on a var(), and the motion is skipped under reduced motion, as the
 * root's transition is.
 */
function useCollapseMotion(collapse: boolean, align: 'center' | 'start') {
  const textRef = useRef<HTMLDivElement>(null)
  const settled = useRef<Geometry | null>(null)
  const collapsedBefore = useRef(collapse)
  const animations = useRef<Animation[]>([])

  useLayoutEffect(() => {
    const text = textRef.current
    const bar = text?.parentElement?.parentElement
    if (text == null || bar == null) {
      return
    }
    const moving = animations.current.some(
      (animation) => animation.playState === 'running',
    )
    if (collapsedBefore.current === collapse) {
      if (!moving) {
        settled.current = geometryOf(bar, text, align)
      }
      return
    }
    collapsedBefore.current = collapse

    const last = settled.current
    const from = moving && last !== null ? drawnAt(bar, text, last) : last
    for (const animation of animations.current) {
      animation.cancel()
    }
    animations.current = []
    const to = geometryOf(bar, text, align)
    settled.current = to
    if (from === null || prefersReducedMotion()) {
      return
    }

    const timing = {
      duration: motionDurationMs.medium1,
      easing: motionEasing.emphasized,
    }
    const heights = [`${from.height}px`, `${to.height}px`]
    animations.current = [
      bar.animate(
        {
          blockSize: heights,
          clipPath: ['inset(0)', 'inset(0)'],
          minBlockSize: heights,
        },
        timing,
      ),
    ]
    for (const [index, selector] of LINES.entries()) {
      const element = text.querySelector(selector)
      const was = from.lines[index]
      const is = to.lines[index]
      if (element === null || was == null || is == null || is.size === 0) {
        continue
      }
      const origin = originOf(element, align)
      animations.current.push(
        element.animate(
          {
            transform: [
              `translate(${was.x - is.x}px, ${was.y - is.y}px) scale(${was.size / is.size})`,
              'none',
            ],
            transformOrigin: [origin, origin],
          },
          timing,
        ),
      )
    }
  })

  return textRef
}

/**
 * The inset as a length CSS arithmetic accepts. A bare `0` is the one length
 * CSS takes without a unit, and the one it rejects inside `max()` and `min()`,
 * where it reads as a number.
 */
function withUnit(contentInset: string) {
  return contentInset.trim() === '0' ? '0px' : contentInset
}

export type { AppBarProps }

export default AppBar
