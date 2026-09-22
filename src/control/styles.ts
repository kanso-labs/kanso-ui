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
// The two sizes the checkbox, radio button and switch pages each give, and
// the decision the three of them share.
//
// Every one of those pages lists them as separate measurements — a 40dp state
// layer and a 48dp target — and all three components here recorded the pair in
// their header comments while drawing only the first. The target is what the
// pages ask a press to reach, so it is drawn: `disc` carries a transparent
// `::before` that reaches the 4dp either side, taking the press because a
// pseudo-element is part of the element it belongs to. Nothing moves, since
// that box is out of flow — the alternative, a 48dp disc, would have grown
// every form in every consuming app by 8dp a row.
//
// Switch composes neither of these. Its track is its own 52 by 40, so it
// carries the same `::before` in its own file, over the one axis that is
// short.
//
// The layer is also what the label centres its first line on, and the two
// have to agree: a disc resized without the label following it would put the
// control off its own label again, which is the drift this row already had
// once. The target is deliberately not in that sum — a label centred on an
// invisible box would sit 4dp below the disc a reader can see.
//
// Literals rather than `sizing.controlSm` and `controlMd`, which happen to
// hold the same two numbers. Those are steps of the control scale, spent on
// button heights; these are one page's state layer and one page's target, and
// a consumer resizing their buttons should not move either.
const LAYER_SIZE = '40px'
const TARGET_SIZE = '48px'

/** How far the target reaches past the layer on each side: 4dp. */
const TARGET_REACH = `calc((${LAYER_SIZE} - ${TARGET_SIZE}) / 2)`

const controlStyles = stylex.create({
  // The cursors the control itself takes. The label has its own pair, since
  // the two are separate elements in the grid.
  controlDisabled: {
    cursor: 'not-allowed',
  },
  controlReadOnly: {
    cursor: 'default',
  },
  // The 40dp state layer, and the 48dp target drawn around it — see the two
  // constants above for why the pages give both and why only one is visible.
  // Switch has none of this: its track is 52 by 40 and carries the layer
  // itself.
  disc: {
    '::before': {
      content: '""',
      inset: TARGET_REACH,
      position: 'absolute',
    },
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    alignItems: 'center',
    backgroundColor: 'transparent',
    blockSize: LAYER_SIZE,
    borderRadius: radii.circle,
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
    inlineSize: LAYER_SIZE,
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
    paddingBlock: `calc((${LAYER_SIZE} - ${typography.bodyLargeLineHeight}) / 2)`,
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
