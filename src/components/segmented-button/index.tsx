import type { ReactNode } from 'react'
import type {
  FocusableElement,
  ToggleButtonGroupProps as RACToggleButtonGroupProps,
  ToggleButtonProps as RACToggleButtonProps,
  ToggleButtonRenderProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { createContext, useContext } from 'react'
import {
  ToggleButton as RACToggleButton,
  ToggleButtonGroup as RACToggleButtonGroup,
} from 'react-aria-components'

import { CheckGlyph } from '../../glyphs'
import { useRipple } from '../../hooks/useRipple'
import { mergeStatefulStyles } from '../../styles/merge'
import {
  colors,
  motion,
  radii,
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
// Four things are this component's own.
//
// **The segments are one track, not a row of buttons.** Every segment
// carries the page's 1dp outline, and each one after the first drops its
// leading edge so neighbours share a single rule rather than drawing two
// against each other. The outer ends are the page's fully rounded shape and
// the inner joins are square.
//
// **Every segment is the same width.** The page gives the segment width as
// the container's divided by their number, so the track is a grid of equal
// columns; the container itself is still as wide as its widest label asks.
//
// **A chosen segment says so with a check.** The page draws it in the icon
// slot, so a segment given an `icon` shows the icon while unselected and the
// check once chosen. `showSelectedIcon` turns it off for a set whose labels
// already read as chosen or not.
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

type Ripple = ReturnType<typeof useRipple<FocusableElement>>

const styles = stylex.create({
  // The check, and any icon a segment carries: the page's 18dp icon.
  // `fontSize` as well as the box, so a glyph drawn in `em` or an icon font
  // lands at the same size an SVG does, exactly as the field chrome sizes
  // the icons it is handed.
  glyph: {
    alignItems: 'center',
    blockSize: '18px',
    display: 'inline-flex',
    flexShrink: 0,
    fontSize: '18px',
    inlineSize: '18px',
    justifyContent: 'center',
  },
  glyphSvg: {
    blockSize: '100%',
    inlineSize: '100%',
  },
  // The label truncates rather than wrapping: the track is one row 40dp
  // tall, and a second line would push its neighbours out of shape.
  label: {
    minInlineSize: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  // The track: equal columns, each as wide as the widest segment asks for,
  // which is the page's segment width of the container over their number.
  // A grid rather than a flex row because `1fr` columns are equal where
  // `flex: 1` only shares out what is left over.
  root: {
    boxSizing: 'border-box',
    display: 'inline-grid',
    gridAutoColumns: '1fr',
    gridAutoFlow: 'column',
  },
  // One segment. The leading edge is dropped on all but the first so two
  // neighbours share one rule, and the outer ends carry the page's fully
  // rounded shape.
  segment: {
    alignItems: 'center',
    blockSize: '40px',
    borderColor: colors.outline,
    borderEndEndRadius: { ':last-child': radii.full, default: radii.none },
    borderEndStartRadius: { ':first-child': radii.full, default: radii.none },
    borderInlineStartWidth: { ':first-child': '1px', default: 0 },
    borderStartEndRadius: { ':last-child': radii.full, default: radii.none },
    borderStartStartRadius: { ':first-child': radii.full, default: radii.none },
    borderStyle: 'solid',
    borderWidth: '1px',
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'inline-flex',
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    gap: spacing.sm,
    justifyContent: 'center',
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
    minInlineSize: 0,
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
    paddingBlock: 0,
    paddingInline: spacing.md,
    // The ripple fills and clips to this, so it only has to be a positioning
    // context.
    position: 'relative',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'background-color, color',
    transitionTimingFunction: motion.easingStandard,
  },
  // The page's disabled treatment: the outline at 12% and everything in it
  // at 38%, whichever container the segment was on.
  segmentDisabled: {
    borderColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), transparent)`,
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
    cursor: 'not-allowed',
  },
  // The two containers a disabled segment can be on. The page names no
  // disabled container of its own, and dropping the chosen one to
  // transparent would take with it the only thing saying which segment is
  // chosen — so it flattens to the surface at 12% instead, which is what
  // every other disabled container here does; see `src/chip/styles.ts`.
  segmentDisabledSelected: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
  },
  segmentDisabledUnselected: {
    backgroundColor: 'transparent',
  },
  // Each state composites its own label colour over its container at the
  // interaction state's opacity, rather than swapping in a separate hover
  // colour. `calc(<opacity> * 100%)` turns the token's unitless 0-1 ratio
  // into the percentage `color-mix()` takes, and it is inlined at each
  // property because @stylexjs/babel-plugin only statically recognises
  // expressions written directly as property values.
  segmentSelected: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.pressed} * 100%), ${colors.secondaryContainer})`,
      ':focus-visible': `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.focus} * 100%), ${colors.secondaryContainer})`,
      ':hover': `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.hover} * 100%), ${colors.secondaryContainer})`,
      default: colors.secondaryContainer,
    },
    color: colors.onSecondaryContainer,
  },
  segmentUnselected: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      ':focus-visible': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.focus} * 100%), transparent)`,
      ':hover': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: 'transparent',
    },
    color: colors.onSurface,
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
   * while the segment is chosen, unless the set turns that off.
   */
  icon?: ReactNode
  /** A function may compute the style from the segment's render state. */
  style?: RACToggleButtonProps['style']
}

/**
 * The check on a chosen segment, or the segment's own icon. Returns a node
 * rather than letting the type be inferred, since `ReactNode` is a union
 * that includes a promise and an inferred one has to be `async`.
 */
function glyphFor(
  state: ToggleButtonRenderProps,
  icon: ReactNode,
  showSelectedIcon: boolean,
): ReactNode {
  if (state.isSelected && showSelectedIcon) {
    return (
      <span {...stylex.props(styles.glyph)}>
        <CheckGlyph {...stylex.props(styles.glyphSvg)} />
      </span>
    )
  }
  if (icon === undefined) {
    return null
  }
  return <span {...stylex.props(styles.glyph)}>{icon}</span>
}

// What a segment draws, from React Aria's render state. Built by a call
// rather than written inline at the prop, which is what react-perf's
// no-new-function-as-prop is after; the React Compiler memoises the result
// on its inputs.
function segmentContent(
  children: ReactNode,
  icon: ReactNode,
  ripple: Ripple,
  showSelectedIcon: boolean,
) {
  return (state: ToggleButtonRenderProps) => (
    <>
      {glyphFor(state, icon, showSelectedIcon)}
      <span {...stylex.props(styles.label)}>{children}</span>
      {ripple.surface}
    </>
  )
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
 * is a radio group, choosing several a toolbar of two-state buttons.
 *
 * The call site's `className` and `style` land on the track, which is the
 * element a layout positions.
 */
function SegmentedButton({
  showSelectedIcon = true,
  ...props
}: SegmentedButtonProps) {
  return (
    <ShowSelectedIconContext value={showSelectedIcon}>
      <RACToggleButtonGroup
        {...props}
        {...mergeStatefulStyles(stylex.props(styles.root), props)}
      />
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
      {segmentContent(children, icon, ripple, showSelectedIcon)}
    </RACToggleButton>
  )
}

// StyleX cannot target `[data-selected]` on the element it is styling, so a
// segment's state comes from the render state React Aria hands its
// className. `disabled` is applied last so it wins over both containers, and
// StyleX replaces a property whole, so it takes their hover states with it.
function segmentStyles(state: ToggleButtonRenderProps) {
  return stylex.props(
    styles.segment,
    state.isSelected ? styles.segmentSelected : styles.segmentUnselected,
    state.isDisabled && styles.segmentDisabled,
    state.isDisabled &&
      (state.isSelected
        ? styles.segmentDisabledSelected
        : styles.segmentDisabledUnselected),
  )
}

SegmentedButton.Segment = SegmentedButtonSegment

export type { SegmentedButtonProps, SegmentedButtonSegmentProps }

export default SegmentedButton
