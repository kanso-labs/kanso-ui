import * as stylex from '@stylexjs/stylex'

import {
  colors,
  motion,
  radii,
  spacing,
  stateLayerOpacity,
  typography,
} from '../tokens/design.tokens.stylex'

// Windows High Contrast and the rest of the forced-colours modes. Declared
// here rather than imported from src/styles/ripple.ts, which spells the same
// query: the StyleX compiler resolves a constant across files only out of a
// `.stylex.ts` module, and the one this repository has is generated from the
// design tokens, where a user-preference query does not belong beside the
// window size classes.
const FORCED_COLORS = '@media (forced-colors: active)'

// What the box is tall enough for, rather than the 56dp the text fields page
// draws it at. The page's number is the sum of these under the default
// tokens, and stating it instead made the box right only there: a theme with
// a longer body line — `Editorial` in src/theming/themes.ts, at body-small
// 20 and body-large 28 on a 10dp `sm` — needs 68, and in a fixed 56 the
// value's line ran past the underline with nothing left beneath it.
//
// The filled box holds its padding twice over, the floated label's line and
// the control's; the outlined box holds its own padding twice and the
// control's line alone, since its label sits on the outline rather than
// above the value. The two agree at 56 under the default tokens, which is
// what keeps the default stories' snapshots where they are.
//
// The resting label's line is written against the same expressions below, so
// one derivation feeds both the box and the label that centres in it.
const BOX_BLOCK_SIZE = `calc(2 * ${spacing.sm} + ${typography.bodySmallLineHeight} + ${typography.bodyLargeLineHeight})`
const BOX_OUTLINED_BLOCK_SIZE = `calc(2 * ${spacing.lg} + ${typography.bodyLargeLineHeight})`

// The chrome's styles. Apart from the parts in ./index.tsx so that file
// exports components alone, which is what keeps fast refresh working for it —
// the same reason ./root.ts gives for the root style beside it.
//
// The focus indicator is an inset box-shadow on the bottom edge rather than a
// border that thickens. A real border going 1px -> 2px on focus grows the
// box, which pushes every sibling below it down by a pixel — so a form
// twitches each time focus moves between its fields. A shadow is drawn inside
// the box and changes nothing about its size.
//
// The label floats, as the text fields page draws it: body-large and centred
// in an empty, unfocused box, body-small at the top once the field is focused
// or holds a value. `floatingLabel={false}` keeps it small at the top in
// every state instead.
//
// Where the label sits depends on the box's state, and a child cannot select
// on its parent's state while the box can select on its own. So the label's
// type is set on the box and inherited: the box changes the font size and
// line height it hands down when focus is within it, or when its control
// shows something other than its placeholder, and the label transitions
// between the two. Resting, the line is the box less its padding, which is
// what centres the label without a position to move — the move to the top is
// a change of type alone. The control sets its own type, so none of this
// reaches it.
//
// The label's colour follows the control's focus the same way: the box is
// React Aria's Group, which reports focus within it as render state, and the
// label takes `labelFocused` from that.
//
// The box is a row: an icon slot at either end, if the field has one, with
// the label and control between them. The page gives the icons 24dp, 12dp
// from the box's edge and 16dp from the text, centred in the box's height;
// the slot cancels the box's top padding and stretches to its full height,
// so it centres whatever it holds — a 24dp icon, or an icon button around
// one. The label and the control sit in a column of their own, which is
// what the label is positioned against, so it moves past a leading icon
// with the text.
//
// A prefix or suffix sits on the control's line, in the control's type and
// the muted role, and shows only while the field is focused or holds a
// value, as the placeholder does — at rest the label is where it would be.
// It is the column's colour it takes, inherited, since the column can
// select on its own focus and content and the affix cannot select on
// either.
//
// The outlined variant is the page's outlined text field: no fill, a 1dp
// outline in the outline role with 4dp corners all round, 2dp and primary
// while focused, on surface while hovered, the error role with an error,
// and the label cutting the outline once it floats, with the page's 4dp
// beside it. The value is centred, 16dp from the top and bottom, and the
// label rests on its line and moves up onto the outline — a move, where the
// filled label only changes type.
//
// The outline is a fieldset laid over the box: a browser draws a fieldset's
// border around its legend, so a legend holding a copy of the label, in the
// label's floated type, is what cuts the outline to the label's width with
// nothing measured. Empty, it cuts nothing, which is the closed notch.
const fieldChromeStyles = stylex.create({
  affix: {
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    flexShrink: 0,
    fontFamily: typography.bodyLargeFont,
    fontSize: typography.bodyLargeSize,
    fontWeight: typography.bodyLargeWeight,
    letterSpacing: typography.bodyLargeTracking,
    lineHeight: typography.bodyLargeLineHeight,
    transitionDuration: motion.durationShort3,
    transitionProperty: 'color',
    transitionTimingFunction: motion.easingStandard,
    whiteSpace: 'nowrap',
  },
  // The control's line, holding the affixes beside it. The 2dp is Compose's
  // padding between the two, since the page gives none.
  affixLine: {
    alignItems: 'baseline',
    display: 'flex',
    gap: spacing.xxs,
  },
  // A text area and its replica in one grid cell, which is as tall as the
  // taller of the two: the rows the control asks for, or the text it holds.
  // That is what grows the box with typing without measuring anything — the
  // replica is the value in the control's own type, wrapped the same way,
  // and never seen.
  autosize: {
    display: 'grid',
  },
  autosizeCell: {
    gridArea: '1 / 1 / 2 / 2',
  },
  box: {
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceContainerHighest,
    blockSize: BOX_BLOCK_SIZE,
    // What the box draws under forced colours, where the `boxShadow` below
    // is gone. A UA in that mode drops box shadows outright and paints the
    // background in a system colour, so the resting underline and the focus
    // indicator — one shadow in two states — disappear together. The control
    // inside suppresses its own ring, see `input`, so a focused Select or
    // picker, whose control is a button with no caret to fall back on, is
    // left showing nothing at all.
    //
    // A border and an outline are two properties that mode keeps, so they
    // take the shadow's two jobs apart: the border is the boundary, the
    // outline is focus. Naming the system colours is what holds them apart —
    // left alone both are forced to `CanvasText`, and the ring then reads as
    // the boundary thickening rather than as focus. Neither is drawn while
    // forced colours are off.
    borderBlockEndStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderBlockEndWidth: { default: null, [FORCED_COLORS]: '1px' },
    // Square at the bottom, where the focus indicator is drawn — a rounded
    // corner there would cut the ends off the underline.
    borderEndEndRadius: 0,
    borderEndStartRadius: 0,
    borderStartEndRadius: radii.xs,
    borderStartStartRadius: radii.xs,
    boxShadow: {
      ':focus-within': `inset 0 -2px 0 0 ${colors.primary}`,
      default: `inset 0 -1px 0 0 ${colors.outline}`,
    },
    boxSizing: 'border-box',
    display: 'flex',
    gap: spacing.lg,
    // The ring's offset and width are the library's own, from
    // src/styles/focus.ts, so a field's focus is the size every other
    // component's is. Its colour is the keyword a forced palette gives the
    // thing it marks as active.
    outlineColor: { default: null, [FORCED_COLORS]: 'Highlight' },
    outlineOffset: { default: null, [FORCED_COLORS]: '2px' },
    outlineStyle: {
      default: null,
      [FORCED_COLORS]: { ':focus-within': 'solid', default: null },
    },
    outlineWidth: { default: null, [FORCED_COLORS]: '2px' },
    paddingBlockEnd: 0,
    paddingBlockStart: spacing.sm,
    paddingInline: spacing.lg,
    // What `trigger` is positioned against: a box whose whole surface opens
    // something covers itself with one press target rather than leaving its
    // padding dead.
    position: 'relative',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'box-shadow',
    transitionTimingFunction: motion.easingStandard,
  },
  boxDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
    // Forced colours has one keyword for disabled, and a box is where it has
    // to be said: the control inside is a real disabled input or button, so a
    // UA greys that itself, while the box is a `Group` — a div, which it has
    // no reason to treat as disabled at all. Without this the boundary a
    // disabled field draws is the one an editable field draws.
    borderBlockEndColor: { default: null, [FORCED_COLORS]: 'GrayText' },
    boxShadow: `inset 0 -1px 0 0 color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), transparent)`,
  },
  // Error is the one state with nothing to add here. Forced colours takes the
  // colour and leaves the shape, and colour is all this changes — the
  // boundary and the ring are `box`'s, unchanged by an error. What says so
  // instead is the message under the box, which is text rather than a colour
  // and so survives, and `aria-invalid` on the control for anything reading
  // rather than looking. Restoring the red would mean inventing a second
  // shape that the spec's error state does not have.
  boxError: {
    boxShadow: {
      ':focus-within': `inset 0 -2px 0 0 ${colors.error}`,
      default: `inset 0 -1px 0 0 ${colors.error}`,
    },
  },
  // The fixed label's type: label-medium, small at the top in every state.
  boxFixed: {
    fontFamily: typography.labelMediumFont,
    fontSize: typography.labelMediumSize,
    fontWeight: typography.labelMediumWeight,
    letterSpacing: typography.labelMediumTracking,
    lineHeight: typography.labelMediumLineHeight,
  },
  // The floating label's two types. Populated is read off the control itself:
  // `:placeholder-shown` holds while it is empty, whatever put the value there,
  // so a browser filling the field in floats the label as typing does. The
  // control always carries a placeholder for it — see FieldInput.
  boxFloating: {
    fontFamily: {
      ':focus-within': typography.bodySmallFont,
      ':has(:is(input, textarea):not(:placeholder-shown))':
        typography.bodySmallFont,
      default: typography.bodyLargeFont,
    },
    fontSize: {
      ':focus-within': typography.bodySmallSize,
      ':has(:is(input, textarea):not(:placeholder-shown))':
        typography.bodySmallSize,
      default: typography.bodyLargeSize,
    },
    fontWeight: {
      ':focus-within': typography.bodySmallWeight,
      ':has(:is(input, textarea):not(:placeholder-shown))':
        typography.bodySmallWeight,
      default: typography.bodyLargeWeight,
    },
    letterSpacing: {
      ':focus-within': typography.bodySmallTracking,
      ':has(:is(input, textarea):not(:placeholder-shown))':
        typography.bodySmallTracking,
      default: typography.bodyLargeTracking,
    },
    lineHeight: {
      ':focus-within': typography.bodySmallLineHeight,
      ':has(:is(input, textarea):not(:placeholder-shown))':
        typography.bodySmallLineHeight,
      default: `calc(${BOX_BLOCK_SIZE} - 2 * ${spacing.sm})`,
    },
  },
  // Where the box puts its label: at the top of the column the control is
  // in. Kept apart from `label`, which is the colour alone, so a field that
  // lays its label out differently — a checkbox, a slider — can take the
  // one without the other.
  boxLabel: {
    insetBlockStart: 0,
    insetInlineStart: 0,
    position: 'absolute',
  },
  // The floated label's type, for a field whose control CSS cannot ask
  // about. `boxFloating` shrinks the label by keying the box on
  // `:focus-within` or on an input that is not showing its placeholder, and
  // a select has no input to ask — so where React knows the field holds
  // something, it says so here. The properties are the same five, and StyleX
  // replaces each whole, so this wins over the box's conditional value
  // without the two having to agree on the condition.
  boxLabelFloated: {
    fontFamily: typography.bodySmallFont,
    fontSize: typography.bodySmallSize,
    fontWeight: typography.bodySmallWeight,
    letterSpacing: typography.bodySmallTracking,
    lineHeight: typography.bodySmallLineHeight,
  },
  // Outlined, the label rests on the value's line and moves up onto the
  // outline, with the page's 4dp beside it — which the notch has too, so
  // the two line up.
  boxLabelOutlined: {
    insetInlineStart: `calc(-1 * ${spacing.xs})`,
    paddingInline: spacing.xs,
  },
  // Floated: half the label's own 16dp line above the column, which is
  // 16dp of padding below the box's top edge, so it lands centred on it.
  boxLabelOutlinedFloated: {
    insetBlockStart: `calc(-1 * (${spacing.lg} + ${spacing.sm}))`,
  },
  // The page's 12dp beside an icon, in place of the 16dp beside text.
  boxLeading: {
    paddingInlineStart: spacing.md,
  },
  // A box that takes its height from the control inside it, for a text
  // area: the page's 56dp at least, with the 8dp under the control that the
  // page gives the box above it.
  boxMultiline: {
    blockSize: 'auto',
    minBlockSize: BOX_BLOCK_SIZE,
    paddingBlockEnd: spacing.sm,
  },
  // Outlined: no fill and no underline, the value centred with 16dp above
  // and below, and the outline's colour by state — the outline role, on
  // surface while hovered, primary while focused — for the fieldset to
  // inherit. The corners are the page's 4dp all round, since there is no
  // underline for a bottom corner to cut.
  boxOutlined: {
    backgroundColor: 'transparent',
    blockSize: BOX_OUTLINED_BLOCK_SIZE,
    // The fieldset laid over the box draws a border of its own, which forced
    // colours keeps, so the boundary `box` restores there would be a second
    // one under the first. The ring is not cancelled: outlined expresses
    // focus as a colour change plus one more pixel of border, and forced
    // colours takes the colour, which leaves the pixel saying it alone.
    borderBlockEndStyle: { default: null, [FORCED_COLORS]: 'none' },
    borderEndEndRadius: radii.xs,
    borderEndStartRadius: radii.xs,
    boxShadow: 'none',
    color: {
      ':focus-within': colors.primary,
      ':hover': colors.onSurface,
      default: colors.outline,
    },
    paddingBlockEnd: spacing.lg,
    paddingBlockStart: spacing.lg,
    position: 'relative',
  },
  boxOutlinedDisabled: {
    backgroundColor: 'transparent',
    boxShadow: 'none',
    // The fieldset's border is `currentColor`, so this is where a disabled
    // outlined field is greyed — the same keyword `boxDisabled` uses, said on
    // the colour the border follows rather than on the border.
    color: {
      default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
      [FORCED_COLORS]: 'GrayText',
    },
  },
  boxOutlinedError: {
    color: {
      ':focus-within': colors.error,
      ':hover': colors.onErrorContainer,
      default: colors.error,
    },
  },
  // The resting label's line is the box less 16dp above and below, which
  // centres it on the value's line.
  boxOutlinedFloating: {
    lineHeight: {
      ':focus-within': typography.bodySmallLineHeight,
      ':has(:is(input, textarea):not(:placeholder-shown))':
        typography.bodySmallLineHeight,
      default: `calc(${BOX_OUTLINED_BLOCK_SIZE} - 2 * ${spacing.lg})`,
    },
  },
  boxTrailing: {
    paddingInlineEnd: spacing.md,
  },
  // The label and control's column. Its colour is the affixes', which have
  // none of their own: the muted role while the field is focused or holds a
  // value, and nothing at rest under a floating label.
  column: {
    color: colors.onSurfaceVariant,
    flexGrow: 1,
    minInlineSize: 0,
    position: 'relative',
  },
  columnDisabled: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  columnDisabledFloating: {
    color: {
      ':has(:is(input, textarea):not(:placeholder-shown))': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      default: 'transparent',
    },
  },
  columnFloating: {
    color: {
      ':focus-within': colors.onSurfaceVariant,
      ':has(:is(input, textarea):not(:placeholder-shown))':
        colors.onSurfaceVariant,
      default: 'transparent',
    },
  },
  // The count of characters, at the end of the message line in tabular
  // figures so it does not jitter as it counts.
  counter: {
    flexShrink: 0,
    fontVariantNumeric: 'tabular-nums',
    marginInlineStart: 'auto',
    whiteSpace: 'nowrap',
  },
  // An icon slot: the page's 24dp icon in the muted role, centred in the
  // box's full height. An icon drawn in `em` follows the slot's size.
  icon: {
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    alignItems: 'center',
    alignSelf: 'stretch',
    color: colors.onSurfaceVariant,
    display: 'flex',
    flexShrink: 0,
    fontSize: '24px',
    justifyContent: 'center',
    marginBlockStart: `calc(-1 * ${spacing.sm})`,
    transitionDuration: motion.durationShort3,
    transitionProperty: 'color',
    transitionTimingFunction: motion.easingStandard,
  },
  iconDisabled: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  // The page colours the trailing icon with the error, and the leading one
  // not.
  iconError: {
    color: colors.error,
  },
  input: {
    '::placeholder': {
      color: colors.onSurfaceVariant,
    },
    backgroundColor: 'transparent',
    borderWidth: 0,
    boxSizing: 'border-box',
    color: colors.onSurface,
    fontFamily: typography.bodyLargeFont,
    fontSize: typography.bodyLargeSize,
    fontWeight: typography.bodyLargeWeight,
    inlineSize: '100%',
    letterSpacing: typography.bodyLargeTracking,
    lineHeight: typography.bodyLargeLineHeight,
    // The field around the control draws the focus indicator, so a second
    // ring around the control inside it would be two focus treatments for
    // one focus.
    outlineStyle: 'none',
    padding: 0,
  },
  inputDisabled: {
    '::placeholder': {
      color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
    },
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  // Under a floating label the placeholder shows only while the control is
  // focused: unfocused and empty, the label sits where the placeholder would.
  inputUnderFloatingLabel: {
    '::placeholder': {
      color: {
        ':focus': colors.onSurfaceVariant,
        default: 'transparent',
      },
    },
  },
  // Clears the label at the top of the box, which is one small line tall
  // whether it floated there or is fixed there.
  inputUnderLabel: {
    marginBlockStart: typography.bodySmallLineHeight,
  },
  // The colour alone. The type is inherited from whatever renders the label,
  // which is what lets the box move it — and the transition is here so the
  // inherited change animates on the label rather than snapping.
  label: {
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    color: colors.onSurfaceVariant,
    transitionDuration: motion.durationShort3,
    transitionProperty:
      'color, font-size, inset-block-start, letter-spacing, line-height',
    transitionTimingFunction: motion.easingStandard,
  },
  labelDisabled: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  labelError: {
    color: colors.error,
  },
  labelFocused: {
    color: colors.primary,
  },
  message: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.bodySmallFont,
    fontSize: typography.bodySmallSize,
    fontWeight: typography.bodySmallWeight,
    letterSpacing: typography.bodySmallTracking,
    lineHeight: typography.bodySmallLineHeight,
    marginBlock: 0,
  },
  messageError: {
    color: colors.error,
  },
  // Indented to the box's own inline padding, so the message starts where
  // the value above it does rather than at the box's edge. A field whose
  // label is not in a box — a checkbox, a group — leaves it out.
  messageInset: {
    marginInline: spacing.lg,
  },
  // The line under the box: the message at the start, the counter at the
  // end, the page's 4dp under the box and 16dp between the two.
  messageLine: {
    alignItems: 'baseline',
    display: 'flex',
    gap: spacing.lg,
    marginBlockStart: spacing.xs,
    // As tall as one line of its own type whether or not it is holding
    // anything, so a message arriving does not move the field below it —
    // see `FieldMessage`, which is where the line is drawn empty.
    minBlockSize: typography.bodySmallLineHeight,
  },
  numeric: {
    fontFamily: typography.fontFamilyMono,
    // Amounts are read in columns and compared against each other, so the
    // digits have to be one width.
    fontVariantNumeric: 'tabular-nums',
  },
  // The outline: a fieldset over the whole box, its border in the box's
  // colour. Its padding is where the notch starts — the page's 16dp to the
  // label, less the 4dp the notch adds beside it — and its type is the
  // label's floated type, so an open notch is exactly the label's width.
  outline: {
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    borderColor: 'currentColor',
    borderRadius: radii.xs,
    borderStyle: 'solid',
    borderWidth: '1px',
    boxSizing: 'border-box',
    fontFamily: typography.bodySmallFont,
    fontSize: typography.bodySmallSize,
    fontWeight: typography.bodySmallWeight,
    inset: 0,
    letterSpacing: typography.bodySmallTracking,
    margin: 0,
    minInlineSize: 0,
    paddingBlock: 0,
    paddingInline: `calc(${spacing.lg} - ${spacing.xs})`,
    pointerEvents: 'none',
    position: 'absolute',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'border-color, border-width',
    transitionTimingFunction: motion.easingStandard,
  },
  outlineFocused: {
    borderWidth: '2px',
  },
  // Past a leading icon: the page's 12dp, the icon and its 16dp.
  outlineLeading: {
    paddingInlineStart: `calc(${spacing.md} + 24px + ${spacing.lg} - ${spacing.xs})`,
  },
  // The notch: the legend, holding the label's text out of sight and no
  // height of its own, so the border stays on the box's edge.
  outlineNotch: {
    blockSize: 0,
    lineHeight: 0,
    maxInlineSize: '100%',
    overflow: 'hidden',
    padding: 0,
    visibility: 'hidden',
    whiteSpace: 'nowrap',
  },
  // Open, it takes the label's own 4dp on either side, so the two are the
  // same width. Closed it has none, or it would cut 8dp of outline away
  // with nothing in it.
  outlineNotchOpen: {
    paddingInline: spacing.xs,
  },
  // Wrapped as the browser wraps a text area, so the two break their lines
  // at the same places.
  replica: {
    overflowWrap: 'break-word',
    visibility: 'hidden',
    whiteSpace: 'pre-wrap',
  },
  // No handle, since the page draws none; the rows scroll instead.
  textArea: {
    display: 'block',
    overflow: 'auto',
    resize: 'none',
  },
  // Growing with its text, the control never has anything to scroll.
  textAreaAutosize: {
    overflow: 'hidden',
  },
  // The press target over a box whose whole surface opens something. Drawn
  // as nothing: the box already carries the fill, the underline and the
  // focus indicator, so a second treatment here would be two for one press.
  trigger: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    boxSizing: 'border-box',
    cursor: 'pointer',
    inset: 0,
    outlineStyle: 'none',
    padding: 0,
    position: 'absolute',
  },
  // A value that was chosen rather than typed. The input's type and its
  // place on the line, laid out as a row so it does not stretch to the box's
  // height, and truncating rather than wrapping — the box is one line tall.
  value: {
    alignItems: 'center',
    display: 'flex',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  // Nothing chosen yet: the placeholder's muted role, and hidden under a
  // floating label until the field is focused, exactly as an input's is.
  valuePlaceholder: {
    color: colors.onSurfaceVariant,
  },
  valuePlaceholderHidden: {
    color: 'transparent',
  },
})

// The chrome a label sitting above a group takes, rather than inside a box.
// CheckboxGroup, ChipGroup, RadioGroup, Slider and ColorSlider each wrote both
// of these out: the type override on the label, and the column its label and
// control sit in.
//
// The label is label-large, the role a field's label takes at rest, since a
// group has no box to float it in.
//
// The two sliders compose an inline size of their own on the root, since a
// slider fills the width it is given where a group of controls does not.
const groupStyles = stylex.create({
  label: {
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
  },
  root: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
})

export { fieldChromeStyles, groupStyles }
