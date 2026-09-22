import * as stylex from '@stylexjs/stylex'

import {
  colors,
  motion,
  radii,
  spacing,
  stateLayerOpacity,
  typography,
} from '../tokens/design.tokens.stylex'

// The row a selection control draws, shared by Checkbox, Switch and Radio.
// Each wrote it out in full: the two-column grid, the body-large label with
// its disabled and read-only fades, the messages cell under the text, and the
// cursors the control takes in those two states. Switch's own comment already
// said it drew "the two-column grid the checkbox uses" while keeping a second
// copy, so the coupling was recorded in prose rather than in code — the same
// thing src/field and src/row were extracted to stop.
//
// The set is closed at three. React Aria Components has no fourth component
// drawing this row, and CheckboxGroup is a container rather than a control.
// What this is worth is that the three cannot drift apart, and that the
// repository's own convention — a style more than one component draws lives
// beside src/components, not inside it — holds here too.
//
// Two things deliberately stay with each component.
//
// The state layers are three different shapes rather than one shape with
// three sets of key names. Checkbox carries an `error` key Radio has no
// equivalent for, Checkbox's pressed set inverts its own key names, and
// Switch deliberately does not invert at all. One style keyed on a `marked`
// boolean would have to encode an error branch one caller uses, an inversion
// another uses, and a documented non-inversion for the third, which costs a
// reader more than the three short `stylex.create` calls it would replace.
//
// And the disc's colour. Checkbox draws it in `onSurface` and Radio in
// `onSurfaceVariant`, which is the one declaration their otherwise identical
// discs disagree on, so `disc` holds the other fourteen and each component
// composes its own colour after.
// The control's target, which the disc draws at and the label centres its
// first line on. Stated once because those two have to agree: a disc resized
// without the label following it would put the control off its own label
// again, which is the drift this row already had once.
const TARGET_SIZE = '40px'

const controlStyles = stylex.create({
  // The cursors the control itself takes. The label has its own pair, since
  // the two are separate elements in the grid.
  controlDisabled: {
    cursor: 'not-allowed',
  },
  controlReadOnly: {
    cursor: 'default',
  },
  // The 40dp target the state layer is drawn on, which is what gives a
  // checkbox and a radio the same hit area as everything else in a form.
  // Switch has none of this: its track is 52 by 40 and carries the layer
  // itself.
  disc: {
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    alignItems: 'center',
    backgroundColor: 'transparent',
    blockSize: TARGET_SIZE,
    borderRadius: radii.circle,
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
    inlineSize: TARGET_SIZE,
    justifyContent: 'center',
    position: 'relative',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'background-color',
    transitionTimingFunction: motion.easingStandard,
  },
  field: {
    alignItems: 'start',
    boxSizing: 'border-box',
    columnGap: spacing.sm,
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
  },
  label: {
    boxSizing: 'border-box',
    color: colors.onSurface,
    cursor: 'pointer',
    fontFamily: typography.bodyLargeFont,
    fontSize: typography.bodyLargeSize,
    fontWeight: typography.bodyLargeWeight,
    letterSpacing: typography.bodyLargeTracking,
    lineHeight: typography.bodyLargeLineHeight,
    // Centres the label's first line on the 40dp control, whether the label
    // is one line or wraps to several. Half of whatever the disc has spare
    // over the line it sits beside, rather than a step of the spacing scale:
    // `sm` is that half only under the default tokens, where 8 + 24 + 8 is
    // the target, and a scheme with a longer body line left the control
    // sitting above the middle of its own label.
    //
    // A padding rather than a centred 40dp cell, which would centre the
    // whole label instead of its first line and so drop a wrapping one's
    // first line below the disc — by 8px under the default tokens, where
    // nothing is meant to move.
    //
    // A body line taller than the target has no room to centre in, and the
    // declaration falls away to nothing.
    paddingBlock: `calc((${TARGET_SIZE} - ${typography.bodyLargeLineHeight}) / 2)`,
  },
  labelDisabled: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
    cursor: 'not-allowed',
  },
  labelReadOnly: {
    cursor: 'default',
  },
  // The second column of the grid, so a message lines up under the label
  // rather than under the control.
  messages: {
    gridColumnStart: 2,
  },
})

export { controlStyles }
