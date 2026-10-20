'use client'

import type { KeyboardEventHandler, ReactNode, RefAttributes } from 'react'
import type {
  FocusableElement,
  Key,
  ToggleButtonGroupProps as RACToggleButtonGroupProps,
  ToggleButtonProps as RACToggleButtonProps,
  SharedElementRenderProps,
  ToggleButtonRenderProps,
  ToggleGroupState,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  createContext,
  createElement,
  useContext,
  useLayoutEffect,
  useState,
} from 'react'
import {
  SelectionIndicator as RACSelectionIndicator,
  ToggleButton as RACToggleButton,
  ToggleButtonGroup as RACToggleButtonGroup,
} from 'react-aria-components'

import type { LabelledByAttribute } from '../../render/name'

import { CheckGlyph } from '../../glyphs'
import { useRipple } from '../../hooks/useRipple'
import { useToggleGroupDisabled } from '../../hooks/useToggleGroupDisabled'
import { ariaAttributesOf, toggleButtonRenderer } from '../../render/aria'
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
// React Aria stops at the name, though: its single mode is announced as a
// radio group and behaves as a toolbar. So that mode takes the rest of the
// radio group pattern from the ARIA Authoring Practices, a deliberate
// departure from React Aria's `ToggleButtonGroup`, in two parts. The chosen
// segment cannot be pressed off, since a radio group always holds a choice
// and the page's single-select set always keeps one segment chosen;
// `disallowEmptySelection={false}` gives React Aria's default back. And the
// arrow keys choose as they move, wrapping at either end, with Home and End
// choosing the first and last segment. Under React Aria the arrows moved
// focus alone and stopped at the ends, so a screen reader reached each radio
// without it being checked, and choosing one took a separate Space. Choosing
// several keeps React Aria's toolbar keys, where the arrows only move between
// buttons and Space toggles one.
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
// Without the check, the page's chosen container is the only cue, and it is
// about 1.2:1 against the page in the light theme, with the same label
// colour either way — under WCAG's 3:1 for a state. So a set with the check
// off draws its chosen segment on the secondary role instead, with the label
// on it, which clears that comfortably. A departure from the page, taken
// only where the page's own cue has been turned off; with the check drawn,
// the chosen segment is the page's.
//
// A segment with an `icon` and no label is drawn that way whatever the set
// says. It keeps its icon when chosen, since the icon is all that tells it
// from its neighbours, and a check in its place would hide which of them is
// the chosen one.
//
// Under forced colours a fill is painted in the page's own `Canvas`, so the
// chosen container is `Highlight` with its label in `HighlightText` — the
// pair the mode gives whatever is chosen — and a disabled chosen one keeps
// a `GrayText` ring rather than a fill, which leaves its `GrayText` label
// readable.
//
// Every segment that could ever draw that slot keeps room for it whether
// or not it is drawing one. Sized by what it drew, the slot made the widest
// segment whichever one was chosen, and the whole track changed width with
// the choice — moving every label, and moving the ground under the chosen
// container while it was sliding across it. The mechanism is Angular
// Material's button toggle: the slot opens from 0 to 18dp and the space it
// lands in opens beside it, both over `durationShort2`. Here that space is
// two spacers either side of the label, which trade it between them: half
// on each side while nothing is drawn, so a bare label stays centred, and
// all of it on the leading side, where the slot sits, once something is.
// Their total never changes, so neither does the segment's width. Angular
// Material has no case of the first kind, since its toggles are sized by
// their own content rather than by the widest of them.
//
// That room gives way before the label does. A track with room to spare is
// the widest label plus 26dp per segment, which is what the widest column
// already measured while its own segment was the chosen one. A track
// squeezed below that — long labels on a phone — gives the reserve back
// first, then the 4dp of the page's 12dp padding beyond the 8dp a segment
// always keeps, and only then cuts a label short, with an ellipsis and a
// `title` that shows it whole. A segment drawing a glyph keeps the glyph and
// its 8dp gap, so the chosen label is the first to be cut. A label shows
// whole in a segment 16dp wider than it, or 42dp while a glyph is drawn
// beside it, plus the segment's rule. The track's width still never depends
// on the choice: squeezed, its columns are the container's, shared equally.
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

type GroupRender = RACToggleButtonGroupProps['render']

type Ripple = ReturnType<typeof useRipple<FocusableElement>>

type SelectionMode = NonNullable<RACToggleButtonGroupProps['selectionMode']>

// A segment's key, back from the attribute `SegmentedButtonSegment` writes
// it into. JSON rather than the key as written, so a numeric key comes back
// a number and matches the one React Aria's selection holds.
function keyOf(segment: HTMLElement): Key | null {
  const written = segment.dataset.key
  if (written === undefined) {
    return null
  }
  const key: unknown = JSON.parse(written)
  return typeof key === 'string' || typeof key === 'number' ? key : null
}

// The group's element, with `radioKeys` in place of React Aria's keyboard
// handler, then handed to the call site's own `render` if it passed one.
function radioGroupRenderer(render: GroupRender): NonNullable<GroupRender> {
  return (domProps, renderProps) => {
    const merged = {
      ...domProps,
      onKeyDownCapture: radioKeys(renderProps.state, domProps.onKeyDownCapture),
    }
    return render === undefined
      ? createElement('div', merged)
      : render(merged, renderProps)
  }
}

// The radio group's keys, taken ahead of React Aria's toolbar ones on the
// same capture listener: the arrows, Home and End move focus to a segment
// and choose it, wrapping at the ends and passing over a disabled segment,
// which is what the toolbar's own handler would otherwise do with focus
// alone. Everything else — Tab, and an arrow held with a modifier the
// browser may want — is handed to the toolbar as before.
function radioKeys(
  state: ToggleGroupState,
  toolbar: KeyboardEventHandler<HTMLDivElement> | undefined,
): KeyboardEventHandler<HTMLDivElement> {
  return (event) => {
    const group = event.currentTarget
    const segments = [
      ...group.querySelectorAll<HTMLElement>('[data-key]:not([data-disabled])'),
    ].filter((segment) => segment.closest('[role="radiogroup"]') === group)
    const from = segments.findIndex((segment) => segment === event.target)
    const step =
      event.altKey || event.ctrlKey || event.metaKey
        ? null
        : stepOf(event.key, getComputedStyle(group).direction === 'rtl')
    if (from === -1 || step === null) {
      toolbar?.(event)
      return
    }

    event.preventDefault()
    event.stopPropagation()
    const to =
      step === 'first'
        ? 0
        : step === 'last'
          ? segments.length - 1
          : (from + step + segments.length) % segments.length
    const segment = segments[to]
    const key = keyOf(segment)
    if (key === null) {
      return
    }
    segment.focus()
    state.setSelected(key, true)
  }
}

// Where a key moves the choice in a radio group: one segment on, one back,
// or to either end. Right and left follow the direction the track is drawn
// in, read off the track itself rather than the locale, so a `dir` on a
// wrapper turns them over as it turns the track over; up and down, and Home
// and End, follow the document order whatever the direction.
function stepOf(key: string, rtl: boolean): -1 | 1 | 'first' | 'last' | null {
  switch (key) {
    case 'ArrowDown': {
      return 1
    }
    case 'ArrowLeft': {
      return rtl ? 1 : -1
    }
    case 'ArrowRight': {
      return rtl ? -1 : 1
    }
    case 'ArrowUp': {
      return -1
    }
    case 'End': {
      return 'last'
    }
    case 'Home': {
      return 'first'
    }
    default: {
      return null
    }
  }
}

// The page's 18dp icon slot, and the room a segment keeps for it: the slot
// plus the gap between it and the label. Half of that room sits on each side
// of the label while nothing is drawn, which is what keeps a bare label
// centred; see `labelReserved`.
const GLYPH_SIZE = '18px'
const GLYPH_RESERVE = `calc(${GLYPH_SIZE} + ${spacing.sm})`
const GLYPH_RESERVE_HALF = `calc((${GLYPH_SIZE} + ${spacing.sm}) / 2)`

// The part of the page's 12dp padding a segment gives back on a narrow
// track: the padding is 8dp, and the rest sits in the spacers, which shrink.
const PADDING_GIVE = `calc(${spacing.md} - ${spacing.sm})`

// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

const styles = stylex.create({
  // The check, or the icon a segment carries: the page's 18dp icon, at the
  // end of the leading spacer, so it sits against the label it marks.
  //
  // `fontSize` as well as the box, so a glyph drawn in `em` or an icon font
  // lands at the same size an SVG does, exactly as the field chrome sizes
  // the icons it is handed.
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
    boxSizing: 'border-box',
    display: 'inline-flex',
    flexShrink: 0,
    fontSize: GLYPH_SIZE,
    inlineSize: 0,
    justifyContent: 'center',
    overflow: 'hidden',
    // Neither the check nor an icon is a press target; the segment is.
    pointerEvents: 'none',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'inline-size, margin-inline-end',
    transitionTimingFunction: motion.easingStandard,
  },
  glyphDrawn: {
    inlineSize: GLYPH_SIZE,
  },
  // The page's 8dp between a glyph and the label beside it.
  glyphGap: {
    marginInlineEnd: spacing.sm,
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
    backgroundColor: {
      default: colors.secondaryContainer,
      [FORCED_COLORS]: 'Highlight',
    },
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
    backgroundColor: {
      default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
      [FORCED_COLORS]: 'Canvas',
    },
    borderColor: { default: null, [FORCED_COLORS]: 'GrayText' },
    borderStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderWidth: { default: null, [FORCED_COLORS]: '2px' },
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
  // The chosen container of a set that draws no check — see the header.
  indicatorUnmarked: {
    backgroundColor: {
      default: colors.secondary,
      [FORCED_COLORS]: 'Highlight',
    },
  },
  // The label truncates rather than wrapping: the track is one row 40dp
  // tall, and a second line would push its neighbours out of shape.
  //
  // It holds its own width while the spacers beside it give theirs back —
  // `flexShrink: 0` is what puts the label last — and the most it can take
  // is the segment's content box, which is where it starts to be cut.
  label: {
    '@media (prefers-reduced-motion: reduce)': {
      transitionDuration: '0s',
    },
    flexShrink: 0,
    maxInlineSize: '100%',
    minInlineSize: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'max-inline-size',
    transitionTimingFunction: motion.easingStandard,
    whiteSpace: 'nowrap',
  },
  // Beside a glyph: the content box less the glyph and its gap, which the
  // leading spacer keeps however narrow the segment is.
  labelBeside: {
    maxInlineSize: `calc(100% - ${GLYPH_RESERVE})`,
  },
  // A chosen label under forced colours, which draws a `Canvas` backplate
  // behind text to keep it readable on whatever the author painted — and on
  // a `Highlight` container that backplate put `HighlightText` on white, so
  // the chosen segment's label vanished into a blank box. Opted out, the
  // label sits on the container it was coloured for, as a selected list
  // row's does.
  labelChosen: {
    forcedColorAdjust: { default: null, [FORCED_COLORS]: 'none' },
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
  // There is no `gap`: the label and the two spacers either side of it are
  // the only children laid out in flow, since the chosen container, the
  // state layer and the ripple are all positioned, and the page's 8dp
  // between a glyph and its label is the glyph's own margin — see `spacer`.
  // The padding is 8dp of the page's 12; the spacers hold the rest.
  segment: {
    '--segment-indicator-radius-end': {
      ':last-child': `min(${radii.pill}, 20px)`,
      default: radii.none,
    },
    '--segment-indicator-radius-start': {
      ':first-child': `min(${radii.pill}, 20px)`,
      default: radii.none,
    },
    // The segmented buttons page's 48dp target, over a track drawn at 40: a
    // transparent box reaching 4dp past the top and bottom, as Button's two
    // smallest sizes do. Not across, since the segments sit flush and a reach
    // there would lay each one's target over its neighbour's. A pixel longer
    // than the arithmetic, since the box is placed from inside the segment's
    // 1px border.
    '::before': {
      content: '""',
      insetBlock: `calc((${sizing.controlSm} - 48px) / 2 - 1px)`,
      insetInline: 0,
      position: 'absolute',
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
    paddingInline: spacing.sm,
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
    color: {
      default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      [FORCED_COLORS]: 'GrayText',
    },
    cursor: 'not-allowed',
  },
  segmentSelected: {
    color: {
      default: colors.onSecondaryContainer,
      [FORCED_COLORS]: 'HighlightText',
    },
  },
  // The label on `indicatorUnmarked`.
  segmentSelectedUnmarked: {
    color: { default: colors.onSecondary, [FORCED_COLORS]: 'HighlightText' },
  },
  segmentUnselected: {
    color: colors.onSurface,
  },
  // The two spacers either side of the label, which hold the room a glyph
  // needs — see the header. Each is at least the 4dp of the page's padding
  // the segment does not keep, and everything in them is given back before
  // the label is cut. A width rather than a `flex-basis`, since an empty
  // element's own size is what the track's columns are measured from.
  spacer: {
    '@media (prefers-reduced-motion: reduce)': {
      transitionDuration: '0s',
    },
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    flexShrink: 1,
    inlineSize: PADDING_GIVE,
    justifyContent: 'flex-end',
    minInlineSize: 0,
    transitionDuration: motion.durationShort2,
    transitionProperty: 'inline-size, min-inline-size',
    transitionTimingFunction: motion.easingStandard,
  },
  // Nothing drawn: half the reserve on each side, so the label sits in the
  // middle of the segment. A whole reserve on the leading side alone would
  // hold the track just as still, and is what an earlier version did — it
  // leaves every unchosen label 13px off centre.
  spacerHalf: {
    inlineSize: `calc(${PADDING_GIVE} + ${GLYPH_RESERVE_HALF})`,
  },
  // The leading spacer beside a drawn glyph: the whole reserve, which is
  // exactly what centres the glyph and the label together, and of which the
  // glyph and its gap are never given back.
  spacerHolding: {
    inlineSize: `calc(${PADDING_GIVE} + ${GLYPH_RESERVE})`,
    minInlineSize: GLYPH_RESERVE,
  },
  // The leading spacer of a segment with an icon and no label: the icon
  // alone, matched by the trailing spacer's padding, so the icon is centred.
  spacerIcon: {
    inlineSize: `calc(${PADDING_GIVE} + ${GLYPH_SIZE})`,
    minInlineSize: GLYPH_SIZE,
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

type SegmentedButtonProps = LabelledByAttribute &
  Omit<RACToggleButtonGroupProps, 'className' | 'orientation' | 'style'> & {
    /** A function may compute the class from the set's render state. */
    className?: RACToggleButtonGroupProps['className']
    /**
     * Whether the chosen segment stays chosen when it is pressed again. On
     * by default while one is chosen, since a radio group always holds a
     * choice; `false` lets a press clear it, as React Aria's own default
     * does. Off by default while several may be, where any of them can be
     * turned off.
     * @default true while one is chosen, false while several may be
     */
    disallowEmptySelection?: boolean
    /**
     * Whether a chosen segment draws a check before its label, as the page
     * has it. `false` leaves the segment's own icon in place while selected,
     * and draws the chosen segment on the stronger secondary container, since
     * the page's own is too faint to say which is chosen by itself.
     * @default true
     */
    showSelectedIcon?: boolean
    /** A function may compute the style from the set's render state. */
    style?: RACToggleButtonGroupProps['style']
  }

type SegmentedButtonSegmentProps = Omit<
  RACToggleButtonProps,
  'children' | 'className' | 'id' | 'style'
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
   *
   * Given with no label, the icon is the segment, centred in it and kept
   * while chosen; name the segment with `aria-label` then.
   */
  icon?: ReactNode
  /**
   * The key selection is reported by. Required, because React Aria joins a
   * toggle to its group's selection by this key alone: a segment without one
   * keeps a pressed state of its own, so a set where one is chosen could hold
   * two, and it is announced as a pressed button rather than a radio.
   */
  id: Key
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
  marked: boolean,
): ReactNode {
  if (state.isSelected && marked) {
    return <CheckGlyph {...stylex.props(styles.glyphSvg)} />
  }
  return icon ?? null
}

// Whether a segment has a label, rather than an icon alone. An empty string
// and a `false` from a condition at the call site are no label either.
function hasLabel(children: ReactNode) {
  return (
    children !== undefined &&
    children !== null &&
    children !== false &&
    children !== ''
  )
}

// The chosen container's class, from the segment's own state and the shared
// element's. A function, because React Aria hands the indicator the entering
// and leaving states the fade is drawn from, and those are the only two the
// element knows about itself.
function indicatorClassName(
  isDisabled: boolean,
  selectionMode: SelectionMode,
  marked: boolean,
): (state: SharedElementRenderProps) => string {
  return (state) =>
    stylex.props(
      styles.indicator,
      selectionMode === 'multiple'
        ? styles.indicatorInPlace
        : styles.indicatorSliding,
      !marked && styles.indicatorUnmarked,
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
  marked: boolean,
  labelRef: (element: HTMLSpanElement | null) => void,
  labelTitle: string | undefined,
) {
  const labelled = hasLabel(children)
  // Whether this segment can ever draw a glyph, and so whether it keeps room
  // for one. A set that draws no check and a segment with no icon of its own
  // never needs the slot, and reserving it there would be dead space in
  // every segment of the track.
  const reserves = marked || icon !== undefined

  return (state: ToggleButtonRenderProps) => {
    const glyph = glyphFor(state, icon, marked)
    const drawn = glyph !== null

    return (
      <>
        <RACSelectionIndicator
          className={indicatorClassName(
            state.isDisabled,
            selectionMode,
            marked,
          )}
        />
        <span
          {...stylex.props(
            styles.stateLayer,
            state.isHovered && styles.stateLayerHover,
            state.isFocusVisible && styles.stateLayerFocus,
            state.isPressed && styles.stateLayerPressed,
          )}
        />
        <span
          {...stylex.props(
            styles.spacer,
            reserves &&
              (drawn
                ? labelled
                  ? styles.spacerHolding
                  : styles.spacerIcon
                : styles.spacerHalf),
          )}
        >
          {reserves && (
            <span
              {...stylex.props(
                styles.glyph,
                drawn && styles.glyphDrawn,
                drawn && labelled && styles.glyphGap,
              )}
            >
              {glyph}
            </span>
          )}
        </span>
        {labelled && (
          <span
            ref={labelRef}
            title={labelTitle}
            {...stylex.props(
              styles.label,
              drawn && styles.labelBeside,
              state.isSelected && !state.isDisabled && styles.labelChosen,
            )}
          >
            {children}
          </span>
        )}
        <span
          {...stylex.props(
            styles.spacer,
            reserves && !drawn && styles.spacerHalf,
          )}
        />
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
 * Name the set with `aria-label` or `aria-labelledby`, one of which the
 * props require — nothing here labels it for you, and a set with no name is
 * a group a screen reader cannot announce. What it is announced as follows the selection mode: choosing one
 * is a radio group, choosing several a toolbar of two-state buttons. So does
 * how the chosen container moves: it slides between segments while one is
 * chosen, and fades in place while several may be.
 *
 * Choosing one behaves as a radio group too, which React Aria's
 * `ToggleButtonGroup` does not. The chosen segment stays chosen when it is
 * pressed again, unless `disallowEmptySelection` is `false`. The arrow keys
 * move to a segment and choose it, wrapping at either end, and Home and End
 * choose the first and last. Choosing several keeps React Aria's keys: the
 * arrows move between segments, and Space or Enter toggles the focused one.
 *
 * The call site's `className` and `style` land on the track, which is the
 * element a layout positions.
 */
function SegmentedButton({
  disallowEmptySelection,
  render,
  selectionMode = 'single',
  showSelectedIcon = true,
  ...props
}: RefAttributes<HTMLDivElement> & SegmentedButtonProps) {
  const single = selectionMode === 'single'

  return (
    <ShowSelectedIconContext value={showSelectedIcon}>
      <SelectionModeContext value={selectionMode}>
        <RACToggleButtonGroup
          {...props}
          disallowEmptySelection={disallowEmptySelection ?? single}
          render={single ? radioGroupRenderer(render) : render}
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
  onClick,
  onContextMenu,
  onKeyDown,
  onKeyUp,
  onPointerCancel,
  onPointerDown,
  onPointerLeave,
  onPointerUp,
  render,
  ...props
}: RefAttributes<HTMLButtonElement> & SegmentedButtonSegmentProps) {
  const selectionMode = useContext(SelectionModeContext)
  // Whether this segment draws the check when chosen: the set's choice,
  // unless the segment has no label — see the header.
  const marked = useContext(ShowSelectedIconContext) && hasLabel(children)
  const [label, setLabel] = useState<HTMLSpanElement | null>(null)
  const labelTitle = useTruncatedText(label)
  // The `aria-*` props React Aria would drop and the keyboard handlers it
  // would wrap go on the element itself, as they do on Chip, Button and
  // IconButton; see src/render/aria.tsx.
  const element = { aria: ariaAttributesOf(props), onKeyDown, onKeyUp }
  // Off while disabled, as in Button: a control that cannot be pressed
  // should not answer a press with an animation. A disabled set disables
  // its segments through React Aria's group state rather than their props,
  // so the group is read as well.
  const disabledByGroup = useToggleGroupDisabled(props.id)
  // The call site's pointer handlers go through the ripple, which calls
  // them after its own. Spread beside the ripple's, one of the two sets
  // would write over the other.
  const ripple = useRipple<FocusableElement>(
    !disableRipple && props.isDisabled !== true && !disabledByGroup,
    {
      onClick,
      onContextMenu,
      onPointerCancel,
      onPointerDown,
      onPointerLeave,
      onPointerUp,
    },
  )

  return (
    <RACToggleButton
      // The key the radio group's arrow keys choose this segment by; see
      // `radioKeys`. React Aria keeps a segment's key off its element.
      data-key={
        selectionMode === 'single' ? JSON.stringify(props.id) : undefined
      }
      render={toggleButtonRenderer(element, render)}
      {...ripple.handlers}
      {...props}
      {...mergeStatefulStyles(segmentStyles(marked), props)}
    >
      {segmentContent(
        children,
        icon,
        ripple,
        selectionMode,
        marked,
        setLabel,
        labelTitle,
      )}
    </RACToggleButton>
  )
}

// StyleX cannot target `[data-selected]` on the element it is styling, so a
// segment's state comes from the render state React Aria hands its
// className. `disabled` is applied last so its label colour wins over both
// of the others. Built by a call, since a set that draws no check labels its
// chosen segment for the container it draws instead.
function segmentStyles(marked: boolean) {
  return (state: ToggleButtonRenderProps) =>
    stylex.props(
      styles.segment,
      focus.ring,
      state.isSelected ? styles.segmentSelected : styles.segmentUnselected,
      state.isSelected && !marked && styles.segmentSelectedUnmarked,
      state.isDisabled && styles.segmentDisabled,
    )
}

// The text of a label its segment is cutting short, for a `title` that shows
// it whole; undefined while it fits. Measured again whenever the label's box
// or its text changes, which is when it can start or stop being cut.
function useTruncatedText(label: HTMLElement | null): string | undefined {
  const [text, setText] = useState<string | undefined>(undefined)

  useLayoutEffect(() => {
    if (label === null) {
      return undefined
    }

    const measure = () => {
      const cut = label.scrollWidth > label.clientWidth
      setText(cut && label.textContent !== '' ? label.textContent : undefined)
    }

    measure()
    const resize = new ResizeObserver(measure)
    resize.observe(label)
    const relabel = new MutationObserver(measure)
    relabel.observe(label, {
      characterData: true,
      childList: true,
      subtree: true,
    })

    return () => {
      resize.disconnect()
      relabel.disconnect()
    }
  }, [label])

  return text
}

SegmentedButton.Segment = SegmentedButtonSegment

export type { SegmentedButtonProps, SegmentedButtonSegmentProps }

export { SegmentedButtonSegment }

export default SegmentedButton
