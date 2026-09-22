import type { ReactNode } from 'react'
import type {
  FocusableElement,
  ToggleButtonGroupProps as RACToggleButtonGroupProps,
  ToggleButtonProps as RACToggleButtonProps,
  SharedElementRenderProps,
  ToggleButtonRenderProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { createContext, useContext } from 'react'
import {
  SelectionIndicator as RACSelectionIndicator,
  ToggleButton as RACToggleButton,
  ToggleButtonGroup as RACToggleButtonGroup,
} from 'react-aria-components'

import { CheckGlyph } from '../../glyphs'
import { useRipple } from '../../hooks/useRipple'
import { focus } from '../../styles/focus'
import { mergeStatefulStyles } from '../../styles/merge'
import {
  colors,
  motion,
  radii,
  sizing,
  spacing,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'

// The segmented buttons page's outlined segmented button: two to five
// segments joined into one outlined track, of which one or several are
// chosen. A segment is Button's default size and type role — a 40dp
// container with a label-large label — which is what that page gives too.
//
// What a screen reader hears follows the selection mode, and React Aria
// decides it rather than this component. Choosing one of the segments is a
// radio group, so the track is a `radiogroup` and each segment a `radio`
// reporting `aria-checked`; choosing several is a `toolbar` of buttons each
// reporting `aria-pressed`. That is the right mapping for both, and it is
// why the mode is a word on the group rather than two components.
//
// Six things are this component's own.
//
// **The segments are one track, not a row of buttons.** Every segment
// carries the page's 1dp outline, and each one after the first drops its
// leading edge so neighbours share a single rule rather than drawing two
// against each other. The outer ends are the page's fully rounded shape and
// the inner joins are square.
//
// **Every segment is the same width.** The page gives the segment width as
// the container's divided by their number, so the track is a grid of equal
// columns; the container itself is still as wide as its widest label asks,
// plus the room described next.
//
// **A chosen segment says so with a check.** The page draws it in the icon
// slot, so a segment given an `icon` shows the icon while unselected and the
// check once chosen. `showSelectedIcon` turns it off for a set whose labels
// already read as chosen or not.
//
// That slot is drawn out of flow, and every segment that could ever use it
// keeps room for it whether or not it is drawing one. Laid out in flow it
// was part of the segment's content size, so the widest segment was
// whichever one was chosen and the whole track changed width with the
// choice — moving every label, and moving the ground under the chosen
// container while it was sliding across it. The mechanism is Angular
// Material's button toggle: the slot is absolute at the leading padding
// edge and opens from 0 to 18dp, and the label's own margins open the space
// it lands in, both over `durationShort2`. Two things here are not theirs.
// The room is a margin on the label rather than padding on the segment,
// because padding would be part of the content size the equal columns are
// measured from — which is the thing being fixed. And it is split across
// both of the label's sides while nothing is drawn, so a bare label stays
// centred; Angular Material has no such case, since its toggles are sized
// by their own content rather than by the widest of them.
//
// The cost is that a track able to draw a check is 26dp per segment wider
// than its labels alone would ask for. It is not wider than it used to
// get, though, and that falls out rather than being arranged: the reserve
// puts every column at the widest label plus the room, which is exactly
// what the widest column already measured while its own segment was the
// chosen one. What changes is that the track is always that, instead of
// only while the longest label is the one chosen.
//
// Angular Material delays the check's own transition by 45ms so the space
// opens before the glyph arrives. That is dropped rather than carried as a
// literal: there is no motion token for it, and the slot here opens from its
// centre rather than its leading edge, so the check and the label never
// cross even when the two run together.
//
// **The chosen container is an element of its own, and it moves.** It is
// React Aria's `SelectionIndicator`, a shared element rendered inside every
// segment and drawn in the chosen one: on a change it keeps the old one
// until it has finished moving, so two exist while it slides. No
// `SharedElementTransition` is rendered here, because `ToggleButtonGroup`
// wraps its children in one already — worth saying, since the primitive
// throws outside a scope wherever else it is used.
//
// It is the page's chosen container rather than a smaller pill: it covers
// the segment, which is the box a background painted, so the fill is all
// that travels. Three things follow. It is drawn behind the segments rather
// than inside one, or a container crossing a neighbour would pass over that
// neighbour's label and the rule beside it. Its corners have to match
// whichever segment it is in, which the segment hands down as a custom
// property, because a child cannot read its own parent's place in the track.
// And the state layers move onto a layer of their own above it, since a
// container that slides away would otherwise take the hover with it and off
// the segment under the pointer.
//
// **Choosing several animates differently, rather than the same way twice.**
// A shared element is one element: it can move between segments, but with
// several chosen there is no single segment for it to be at. So
// `selectionMode="multiple"` names only `opacity` in the transition, nothing
// positional is snapshotted, and each container fades in and out where it
// is; `single` names `translate` and `border-radius` as well, and the one
// container travels between segments.
//
// **Two of the page's values are the library's instead**, both for
// consistency with the controls beside them: the focus ring, which is
// primary at 2dp offset 2dp everywhere here rather than the page's secondary
// at 3dp, and the press, which is the library's ripple rather than a flat
// state layer. The page names a ripple as the pressed state, so the second
// is a departure only in how it is drawn.
//
// **The density steps are not drawn.** The page removes 4dp of height per
// step down, for denser interfaces; nothing else in the library takes a
// density, and one component that did would be the odd one out. A shorter
// track is a `className` away.
//
// Vertical is React Aria's and is not passed through, since the page draws
// one row and a column of joined segments is a different shape — the outer
// corners, the shared rule and the equal columns would all have to mean
// something else.

// Whether a chosen segment draws the check. A context rather than a prop on
// each segment, since it is the set's decision and repeating it on every
// segment is how the two drift.
const ShowSelectedIconContext = createContext(true)

// Which of the two animations the chosen container plays. Read from a
// context for the same reason, and because React Aria's own state context
// holds the mode in a shape this would have to narrow before using.
const SelectionModeContext = createContext<SelectionMode>('single')

type Ripple = ReturnType<typeof useRipple<FocusableElement>>

type SelectionMode = NonNullable<RACToggleButtonGroupProps['selectionMode']>

// The page's 18dp icon slot, and the room a segment keeps for it: the slot
// plus the gap between it and the label. Half of that room sits on each side
// of the label while nothing is drawn, which is what keeps a bare label
// centred; see `labelReserved`.
const GLYPH_SIZE = '18px'
const GLYPH_RESERVE = `calc(${GLYPH_SIZE} + ${spacing.sm})`
const GLYPH_RESERVE_HALF = `calc((${GLYPH_SIZE} + ${spacing.sm}) / 2)`

const styles = stylex.create({
  // The check, or the icon a segment carries: the page's 18dp icon, pinned
  // to the leading padding edge and taken out of the segment's flow.
  //
  // Out of flow is the point. A glyph laid out beside the label is part of
  // the segment's content size, and with `1fr` columns every column is as
  // wide as the widest one asks — so a check that only a chosen segment
  // draws made the whole track's width depend on the choice. Absolute, it
  // contributes nothing, and the room it needs is reserved on the label
  // instead, where it is reserved whether or not anything is drawn.
  //
  // `fontSize` as well as the box, so a glyph drawn in `em` or an icon font
  // lands at the same size an SVG does, exactly as the field chrome sizes
  // the icons it is handed. `insetInlineStart` rather than `left` is what
  // mirrors it under RTL.
  //
  // The slot is 0 wide and clips until something is drawn in it, so the
  // check wipes out from the centre rather than appearing at full size. It
  // is kept in the DOM either way: this is Angular Material's button toggle,
  // whose comment records that adding and removing the element is what broke
  // layouts there before the transition was added.
  glyph: {
    '@media (prefers-reduced-motion: reduce)': {
      transitionDuration: '0s',
    },
    alignItems: 'center',
    blockSize: GLYPH_SIZE,
    display: 'inline-flex',
    fontSize: GLYPH_SIZE,
    inlineSize: 0,
    insetBlockStart: '50%',
    insetInlineStart: spacing.md,
    justifyContent: 'center',
    overflow: 'hidden',
    // Neither the check nor an icon is a press target; the segment is.
    pointerEvents: 'none',
    position: 'absolute',
    transform: 'translate3d(0, -50%, 0)',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'inline-size',
    transitionTimingFunction: motion.easingStandard,
  },
  glyphDrawn: {
    inlineSize: GLYPH_SIZE,
  },
  // Sized rather than filling the slot, so that a slot part-way through its
  // transition clips the glyph instead of squashing it.
  glyphSvg: {
    blockSize: '100%',
    flexShrink: 0,
    inlineSize: GLYPH_SIZE,
  },
  // The chosen container, drawn as an element rather than as the segment's
  // own background so that it can move between segments.
  //
  // `inset` is negative by the segment's border width, so the element covers
  // the border box — where a background paints, and so where this one has to
  // paint to look the same standing still. `zIndex` then puts it behind the
  // segments rather than inside one, which is what the negative inset needs
  // and what a slide needs too: the labels and the track's rules are drawn
  // over it, so a container crossing a neighbour passes behind its label
  // instead of over it, and the rules stay unbroken. See `root` for the one
  // line that keeps "behind" inside the track.
  //
  // The corners come from the segment through custom properties rather than
  // `inherit`, and the difference is the whole reason they exist: `inherit`
  // would hand over the token's own 9999px, and the browser clamps that to
  // half the box before drawing it. A clamped value cannot be interpolated —
  // a transition from 9999px to 0 holds the clamped shape for 99.8% of its
  // run and then collapses in the last frame — so the segment passes down a
  // value already taken down to what it draws.
  indicator: {
    backgroundColor: colors.secondaryContainer,
    borderEndEndRadius: 'var(--segment-indicator-radius-end)',
    borderEndStartRadius: 'var(--segment-indicator-radius-start)',
    borderStartEndRadius: 'var(--segment-indicator-radius-end)',
    borderStartStartRadius: 'var(--segment-indicator-radius-start)',
    boxSizing: 'border-box',
    inset: '-1px',
    // Neither this nor the state layer is a press target; the segment is.
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: -1,
  },
  // The container a chosen segment keeps while disabled. The page names no
  // disabled container of its own, and dropping this one to transparent
  // would take with it the only thing saying which segment is chosen — so it
  // flattens to the surface at 12% instead, which is what every other
  // disabled container here does; see `src/chip/styles.ts`.
  indicatorDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
  },
  // Arriving with nowhere to move from, and leaving with nowhere to move to.
  // React Aria marks both states on the element, and the container fades
  // through them rather than appearing and vanishing at full strength.
  indicatorHidden: {
    opacity: 0,
  },
  // Choosing several. Naming `opacity` alone is what keeps each container
  // where it is: React Aria's shared element snapshots the properties a
  // transition names, so with nothing positional among them there is no
  // position to move from.
  indicatorInPlace: {
    '@media (prefers-reduced-motion: reduce)': {
      transitionDuration: '0s',
    },
    transitionDuration: motion.durationShort2,
    transitionProperty: 'opacity',
    transitionTimingFunction: motion.easingStandard,
  },
  // Choosing one. `transitionProperty` is what makes the container slide
  // rather than jump, and it is load-bearing in a way nothing here shows:
  // the shared element snapshots only the properties a transition names, and
  // takes `none` as "this element does not animate". Drop the line and the
  // container still draws, in the right place, without ever moving.
  //
  // `translate` is the one React Aria computes itself, from the gap between
  // where the container was and where it now is. `border-radius` is the
  // plain kind, and it is named as the shorthand so all four corners
  // interpolate: the ends of the track are round and the joins are square,
  // so a container crossing between them changes shape as it goes.
  //
  // Reduced motion zeroes the duration rather than dropping the transition,
  // which would take the snapshot with it and leave the container no longer
  // positioned correctly.
  indicatorSliding: {
    '@media (prefers-reduced-motion: reduce)': {
      transitionDuration: '0s',
    },
    transitionDuration: motion.durationMedium1,
    transitionProperty: 'translate, border-radius, opacity',
    transitionTimingFunction: motion.easingEmphasized,
  },
  // The label truncates rather than wrapping: the track is one row 40dp
  // tall, and a second line would push its neighbours out of shape.
  //
  // It is also the element that carries the room the glyph slot needs, which
  // is why it transitions: the slot is absolute, so the label's own margins
  // are what open the space it is drawn in. Both margins move together and
  // their total never changes, so the segment asks for the same width in
  // every state — which is the whole of the fix.
  label: {
    '@media (prefers-reduced-motion: reduce)': {
      transitionDuration: '0s',
    },
    minInlineSize: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'margin-inline-start, margin-inline-end',
    transitionTimingFunction: motion.easingStandard,
    whiteSpace: 'nowrap',
  },
  // Nothing drawn in the slot: half the room on each side, so the label sits
  // in the middle of the segment. A whole reserve on the leading side alone
  // would hold the track just as still, and is what the first attempt at
  // this did — it leaves every unchosen label 13px off centre.
  labelReserved: {
    marginInlineEnd: GLYPH_RESERVE_HALF,
    marginInlineStart: GLYPH_RESERVE_HALF,
  },
  // Something drawn in it: the same room, moved to the leading side. The
  // label shifts by half the reserve, which is exactly what centres the
  // glyph and the label together — Angular Material's `padding-left` while
  // checked, written as a margin because padding on the segment would be
  // part of its content size again.
  labelShifted: {
    marginInlineEnd: 0,
    marginInlineStart: GLYPH_RESERVE,
  },
  // The track: equal columns, each as wide as the widest segment asks for,
  // which is the page's segment width of the container over their number.
  // A grid rather than a flex row because `1fr` columns are equal where
  // `flex: 1` only shares out what is left over.
  //
  // `isolation` is what keeps the chosen container and the state layer
  // inside the track. Both are drawn behind the segments with a negative
  // `zIndex`, and a segment is a positioning context rather than a stacking
  // one, so without a stacking context here "behind" would mean behind
  // whatever the page happens to provide — and the two would disappear under
  // it.
  root: {
    boxSizing: 'border-box',
    display: 'inline-grid',
    gridAutoColumns: '1fr',
    gridAutoFlow: 'column',
    isolation: 'isolate',
  },
  // One segment. The leading edge is dropped on all but the first so two
  // neighbours share one rule, and the outer ends carry the page's fully
  // rounded shape.
  //
  // The two custom properties are that shape again, taken down to the 20dp
  // the browser draws it at — half the track's height — so that the chosen
  // container can interpolate between them. See `indicator`.
  //
  // There is no `gap`: the label is the only child laid out in flow, since
  // the glyph slot, the chosen container, the state layer and the ripple are
  // all positioned. The page's 8dp between a glyph and its label is part of
  // the room the label reserves instead — see `label`.
  segment: {
    '--segment-indicator-radius-end': {
      ':last-child': `min(${radii.pill}, 20px)`,
      default: radii.none,
    },
    '--segment-indicator-radius-start': {
      ':first-child': `min(${radii.pill}, 20px)`,
      default: radii.none,
    },
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    alignItems: 'center',
    backgroundColor: 'transparent',
    blockSize: sizing.controlSm,
    borderColor: colors.outline,
    borderEndEndRadius: { ':last-child': radii.pill, default: radii.none },
    borderEndStartRadius: { ':first-child': radii.pill, default: radii.none },
    borderInlineStartWidth: { ':first-child': '1px', default: 0 },
    borderStartEndRadius: { ':last-child': radii.pill, default: radii.none },
    borderStartStartRadius: { ':first-child': radii.pill, default: radii.none },
    borderStyle: 'solid',
    borderWidth: '1px',
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'inline-flex',
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    justifyContent: 'center',
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
    minInlineSize: 0,
    paddingBlock: 0,
    paddingInline: spacing.md,
    // The ripple fills and clips to this, and the chosen container and the
    // state layer are placed against it, so it only has to be a positioning
    // context.
    position: 'relative',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'color',
    transitionTimingFunction: motion.easingStandard,
  },
  // The page's disabled treatment: the outline at 12% and everything in it
  // at 38%. The container is `indicatorDisabled`, since that is the element
  // it is drawn on.
  segmentDisabled: {
    borderColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), transparent)`,
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
    cursor: 'not-allowed',
  },
  segmentSelected: {
    color: colors.onSecondaryContainer,
  },
  segmentUnselected: {
    color: colors.onSurface,
  },
  // The hover, focus and press layers. Behind the segments with the chosen
  // container, and written after it so it is drawn over it, which is what
  // leaves a hover on the segment under the pointer when the container has
  // slid off to another one.
  //
  // A state layer is the content's own colour at the state's opacity, and
  // the segment's `color` is already that colour in every state — chosen or
  // not — so the layer is `currentColor` at the opacity rather than a
  // `color-mix` per state and per container. The three states come from
  // React Aria's render state rather than from `:hover`, `:active` and
  // `:focus-visible`, because two of those three match the segment and not
  // this element, and it also leaves the layer inert while the segment is
  // disabled: React Aria reports none of the three for a control that
  // cannot be pressed.
  stateLayer: {
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    backgroundColor: 'currentColor',
    borderRadius: 'inherit',
    boxSizing: 'border-box',
    inset: '-1px',
    opacity: 0,
    pointerEvents: 'none',
    position: 'absolute',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'opacity',
    transitionTimingFunction: motion.easingStandard,
    zIndex: -1,
  },
  stateLayerFocus: {
    opacity: stateLayerOpacity.focus,
  },
  stateLayerHover: {
    opacity: stateLayerOpacity.hover,
  },
  stateLayerPressed: {
    opacity: stateLayerOpacity.pressed,
  },
})

type SegmentedButtonProps = Omit<
  RACToggleButtonGroupProps,
  'className' | 'orientation' | 'style'
> & {
  /** A function may compute the class from the set's render state. */
  className?: RACToggleButtonGroupProps['className']
  /**
   * Whether a chosen segment draws a check before its label, as the page
   * has it. `false` leaves the segment's own icon in place while selected.
   * @default true
   */
  showSelectedIcon?: boolean
  /** A function may compute the style from the set's render state. */
  style?: RACToggleButtonGroupProps['style']
}

type SegmentedButtonSegmentProps = Omit<
  RACToggleButtonProps,
  'children' | 'className' | 'style'
> & {
  /** The segment's label. */
  children?: ReactNode
  /** A function may compute the class from the segment's render state. */
  className?: RACToggleButtonProps['className']
  /**
   * Disables the press ripple. The hover and pressed state layers are
   * unaffected.
   * @default false
   */
  disableRipple?: boolean
  /**
   * An icon before the label, in the page's 18dp size. Replaced by the check
   * while the segment is chosen, unless the set turns that off. An icon drawn
   * in `em` takes that size from the slot.
   */
  icon?: ReactNode
  /** A function may compute the style from the segment's render state. */
  style?: RACToggleButtonProps['style']
}

/**
 * What the glyph slot draws: the check on a chosen segment, or the segment's
 * own icon. `null` for a segment with neither, which leaves the slot empty
 * and closed rather than unrendered. Returns a node rather than letting the
 * type be inferred, since `ReactNode` is a union that includes a promise and
 * an inferred one has to be `async`.
 */
function glyphFor(
  state: ToggleButtonRenderProps,
  icon: ReactNode,
  showSelectedIcon: boolean,
): ReactNode {
  if (state.isSelected && showSelectedIcon) {
    return <CheckGlyph {...stylex.props(styles.glyphSvg)} />
  }
  return icon ?? null
}

// The chosen container's class, from the segment's own state and the shared
// element's. A function, because React Aria hands the indicator the entering
// and leaving states the fade is drawn from, and those are the only two the
// element knows about itself.
function indicatorClassName(
  isDisabled: boolean,
  selectionMode: SelectionMode,
): (state: SharedElementRenderProps) => string {
  return (state) =>
    stylex.props(
      styles.indicator,
      selectionMode === 'multiple'
        ? styles.indicatorInPlace
        : styles.indicatorSliding,
      isDisabled && styles.indicatorDisabled,
      (state.isEntering || state.isExiting) && styles.indicatorHidden,
    ).className ?? ''
}

// What a segment draws, from React Aria's render state. Built by a call
// rather than written inline at the prop, which is what react-perf's
// no-new-function-as-prop is after; the React Compiler memoises the result
// on its inputs.
function segmentContent(
  children: ReactNode,
  icon: ReactNode,
  ripple: Ripple,
  selectionMode: SelectionMode,
  showSelectedIcon: boolean,
) {
  // Whether this segment can ever draw a glyph, and so whether it keeps room
  // for one. A set that draws no check and a segment with no icon of its own
  // never needs the slot, and reserving it there would be dead space in
  // every segment of the track.
  const reserves = showSelectedIcon || icon !== undefined

  return (state: ToggleButtonRenderProps) => {
    const glyph = glyphFor(state, icon, showSelectedIcon)

    return (
      <>
        <RACSelectionIndicator
          className={indicatorClassName(state.isDisabled, selectionMode)}
        />
        <span
          {...stylex.props(
            styles.stateLayer,
            state.isHovered && styles.stateLayerHover,
            state.isFocusVisible && styles.stateLayerFocus,
            state.isPressed && styles.stateLayerPressed,
          )}
        />
        {reserves && (
          <span
            {...stylex.props(styles.glyph, glyph !== null && styles.glyphDrawn)}
          >
            {glyph}
          </span>
        )}
        <span
          {...stylex.props(
            styles.label,
            reserves &&
              (glyph === null ? styles.labelReserved : styles.labelShifted),
          )}
        >
          {children}
        </span>
        {ripple.surface}
      </>
    )
  }
}

/**
 * A row of two to five joined segments, of which one — or with
 * `selectionMode="multiple"`, several — is chosen. Selection is React Aria's:
 * pass `selectedKeys` with `onSelectionChange` to control it, or
 * `defaultSelectedKeys` to let it keep its own. Give every segment an `id`,
 * which is the key selection is reported by.
 *
 * ```tsx
 * <SegmentedButton aria-label="Label" defaultSelectedKeys={['first']}>
 *   <SegmentedButton.Segment id="first">First item</SegmentedButton.Segment>
 *   <SegmentedButton.Segment id="second">Second item</SegmentedButton.Segment>
 * </SegmentedButton>
 * ```
 *
 * Name the set with `aria-label` or `aria-labelledby` — nothing here labels
 * it for you, and a set with no name is a group a screen reader cannot
 * announce. What it is announced as follows the selection mode: choosing one
 * is a radio group, choosing several a toolbar of two-state buttons. So does
 * how the chosen container moves: it slides between segments while one is
 * chosen, and fades in place while several may be.
 *
 * The call site's `className` and `style` land on the track, which is the
 * element a layout positions.
 */
function SegmentedButton({
  selectionMode = 'single',
  showSelectedIcon = true,
  ...props
}: SegmentedButtonProps) {
  return (
    <ShowSelectedIconContext value={showSelectedIcon}>
      <SelectionModeContext value={selectionMode}>
        <RACToggleButtonGroup
          {...props}
          selectionMode={selectionMode}
          {...mergeStatefulStyles(stylex.props(styles.root), props)}
        />
      </SelectionModeContext>
    </ShowSelectedIconContext>
  )
}

/**
 * One segment. Its `id` is what selection is reported by, and its label is
 * what names it. A chosen segment draws a check before the label; an
 * unchosen one draws whatever `icon` holds, if anything.
 */
function SegmentedButtonSegment({
  children,
  disableRipple = false,
  icon,
  ...props
}: SegmentedButtonSegmentProps) {
  const selectionMode = useContext(SelectionModeContext)
  const showSelectedIcon = useContext(ShowSelectedIconContext)
  // Off while disabled, as in Button: a control that cannot be pressed
  // should not answer a press with an animation.
  const ripple = useRipple<FocusableElement>(
    !disableRipple && props.isDisabled !== true,
  )

  return (
    <RACToggleButton
      {...props}
      {...ripple.handlers}
      {...mergeStatefulStyles(segmentStyles, props)}
    >
      {segmentContent(children, icon, ripple, selectionMode, showSelectedIcon)}
    </RACToggleButton>
  )
}

// StyleX cannot target `[data-selected]` on the element it is styling, so a
// segment's state comes from the render state React Aria hands its
// className. `disabled` is applied last so its label colour wins over both
// of the others.
function segmentStyles(state: ToggleButtonRenderProps) {
  return stylex.props(
    styles.segment,
    focus.ring,
    state.isSelected ? styles.segmentSelected : styles.segmentUnselected,
    state.isDisabled && styles.segmentDisabled,
  )
}

SegmentedButton.Segment = SegmentedButtonSegment

export type { SegmentedButtonProps, SegmentedButtonSegmentProps }

export default SegmentedButton
