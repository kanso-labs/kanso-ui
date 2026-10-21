'use client'

import type { Ref, RefAttributes } from 'react'
import type {
  SearchFieldProps as RACSearchFieldProps,
  SearchFieldRenderProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  FieldInputContext,
  Label,
  SearchField as RACSearchField,
  useSlottedContext,
  VisuallyHidden,
} from 'react-aria-components'

import { FieldInput, FieldMessage } from '../../field'
import { focusesControl } from '../../field/press'
import {
  fieldStyles,
  invalidFrom,
  useFieldValidationBehavior,
} from '../../field/root'
import { CloseGlyph, SearchGlyph } from '../../glyphs'
import { mergeStatefulStyles } from '../../styles/merge'
import {
  colors,
  motion,
  radii,
  sizing,
  spacing,
  stateLayerOpacity,
} from '../../tokens/design.tokens.stylex'
import IconButton from '../icon-button'

// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

// A pointer that can hover: a mouse or a trackpad, not a finger. The bar is a
// plain element around the input rather than a part React Aria hosts, so its
// hover layer is a pseudo-class, and Chromium leaves `:hover` on whatever a
// touch last tapped. Inside this query a touch screen draws no hover at all;
// a touchscreen laptop still matches it for its trackpad.
const HOVER_CAPABLE = '@media (hover: hover)'

// The search page's search bar, on its own: a 56dp container with a full
// corner on surface container high, a 24dp magnifier in on surface at the
// start, the supporting text in on surface variant and the input text in on
// surface, both body-large, and a trailing icon button in on surface
// variant that clears the field while it holds anything. The page's
// 16dp of padding is to a 48dp tap target, and the icon sits 12dp inside
// that, so the magnifier starts 28dp in and the text 4dp past the target,
// at 68dp; the clear button is the medium icon button, 40dp around a 24dp
// icon, set 4dp in from the padding so its icon ends 28dp from the end. The
// container follows its own width up to the page's 720dp; the page's 360dp
// floor is left to the call site, since a phone's width less its margins is
// under it. The list of suggestions the page draws under the bar is
// Autocomplete's, and nothing here.
//
// The page gives the container level 3 elevation, and the bar casts no
// shadow for it. Surface container high is the tone that level stands for,
// and Google's own search bars draw it so: Compose's defaults give the bar
// a shadow elevation of level 0, and the Android library keeps its 6dp but
// makes the shadow transparent. The docked SearchView, which floats over
// the page, is what casts level 3.
//
// The page's hovered and pressed states are on surface state layers over
// the container, at the opacities the tokens hold. It names a focused state
// and draws nothing for it, so the bar takes the 2dp primary ring the text
// fields page gives a focused field, drawn inside the pill as a shadow for
// the reason the chrome's box draws its underline that way: a shadow
// changes nothing about the bar's size, and clipped to the corner it stays
// inside the pill. It shows on any focus, as the underline does; a text
// control matches `:focus-visible` on every focus anyway. Disabled takes
// the chrome's dimmed container and content, since the page has no disabled
// state and the sibling fields already agree on one.
//
// React Aria's `SearchField` is the root, a div holding the label,
// description and error slots and the clear button's context; the bar is
// its own element around the field chrome's input, and the label is
// visually hidden, since the bar carries no label of its own and the
// supporting text is what a person reads.
const styles = stylex.create({
  bar: {
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    alignItems: 'center',
    // `:active` is written twice, bare for a touch and again inside the
    // query: StyleX orders a rule by the sum of its conditions, so a hover
    // inside the query would otherwise come after a bare press and win while
    // both held.
    //
    // The clear button draws its own hovered and pressed layers, and `:hover`
    // and `:active` hold on the bar whenever they hold on anything inside it,
    // so under the button the bar goes back to its resting colour rather
    // than stacking a second layer beneath the button's. Each `:has` rule is
    // more specific than the state it undoes, so it wins over that state
    // wherever the two are written.
    backgroundColor: {
      ':active': {
        ':has(button:active)': colors.surfaceContainerHigh,
        default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), ${colors.surfaceContainerHigh})`,
        [HOVER_CAPABLE]: {
          ':has(button:active)': colors.surfaceContainerHigh,
          default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), ${colors.surfaceContainerHigh})`,
        },
      },
      ':hover': {
        default: null,
        [HOVER_CAPABLE]: {
          ':has(button:hover)': colors.surfaceContainerHigh,
          default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), ${colors.surfaceContainerHigh})`,
        },
      },
      default: colors.surfaceContainerHigh,
    },
    blockSize: sizing.controlLg,
    // What the bar draws under forced colours, where the shadow below is
    // gone. That mode drops box shadows outright and paints the background
    // in a system colour, so the bar's boundary and its only focus indicator
    // — one shadow in two states — would disappear together, exactly as the
    // field chrome's box would without its own branch. The border is the
    // boundary and the outline is focus, which is how that box splits them.
    borderColor: { default: null, [FORCED_COLORS]: 'ButtonText' },
    borderRadius: radii.pill,
    borderStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderWidth: { default: null, [FORCED_COLORS]: '1px' },
    boxShadow: {
      ':focus-within': `inset 0 0 0 2px ${colors.primary}`,
      default: 'none',
    },
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    // The whole bar takes a press for the input — see `fieldContent` — so
    // it says as much under a pointer, not only over the input's own line.
    cursor: 'text',
    display: 'flex',
    gap: spacing.lg,
    inlineSize: '100%',
    maxInlineSize: '720px',
    // The outline repeats the 2px width and 2px offset of `focus.ring` in
    // src/styles/focus.ts, so the bar's focus is the size every other
    // component's is, rather than importing it: that style draws on the
    // element's own `:focus-visible` in every mode, and this one draws on
    // `:focus-within`, since the input inside holds focus, and under forced
    // colours alone, where the shadow above is gone.
    outlineColor: { default: null, [FORCED_COLORS]: 'Highlight' },
    outlineOffset: { default: null, [FORCED_COLORS]: '2px' },
    outlineStyle: {
      default: null,
      [FORCED_COLORS]: { ':focus-within': 'solid', default: null },
    },
    outlineWidth: { default: null, [FORCED_COLORS]: '2px' },
    paddingInlineEnd: spacing.lg,
    paddingInlineStart: `calc(${spacing.lg} + ${spacing.md})`,
    transitionDuration: motion.durationShort2,
    transitionProperty: 'background-color, box-shadow',
    transitionTimingFunction: motion.easingStandard,
  },
  barDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
    // Grey under forced colours, which no UA greys for itself: the fades
    // above are author colours the mode repaints, so a disabled bar would
    // otherwise be drawn exactly like one that can be typed into.
    borderColor: { default: null, [FORCED_COLORS]: 'GrayText' },
    // Applied after `barError`, so a disabled field is never drawn invalid,
    // as the chrome's disabled box takes over its error underline.
    boxShadow: 'none',
    color: {
      default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      [FORCED_COLORS]: 'GrayText',
    },
    // The cursor the disabled clear button inside it shows, as every
    // disabled button here does, so a pointer crossing a disabled bar is
    // told one thing from end to end. The input takes it from the bar.
    cursor: 'not-allowed',
  },
  // The text fields page's error state, which the search page does not
  // name: the outline in the error role, 1dp at rest and 2dp once focused,
  // so a focused invalid bar keeps its error colour rather than taking the
  // primary ring. The chrome's `boxError` draws an underline, which a pill
  // has no edge for, so the bar draws the whole ring, as its focus does.
  // Forced colours drops the ring with every other shadow and leaves the
  // border and outline above as they are: the error state changes a colour,
  // not a shape, so what says so in that mode is the message under the bar
  // and `aria-invalid` on the input, as for the chrome's box.
  barError: {
    boxShadow: {
      ':focus-within': `inset 0 0 0 2px ${colors.error}`,
      default: `inset 0 0 0 1px ${colors.error}`,
    },
  },
  // 4dp in from the padding, so the icon inside the 40dp button ends 28dp
  // from the end, where the page's 48dp target puts it.
  clear: {
    marginInlineEnd: spacing.xs,
  },
  // The button sizes its icon through its font size.
  clearGlyph: {
    blockSize: '1em',
    display: 'block',
    inlineSize: '1em',
  },
  // The page's leading icon is on surface, a step stronger than the
  // supporting text beside it, which takes the bar's on surface variant.
  glyph: {
    blockSize: '24px',
    color: colors.onSurface,
    display: 'block',
    flexShrink: 0,
    inlineSize: '24px',
  },
  // The disabled bar's faded colour, and its `GrayText` under forced
  // colours, which the glyph's own colour would otherwise hold against.
  glyphDisabled: {
    color: 'inherit',
  },
  // The chrome's input, taking the room between the two icons. A search
  // input is the one type the browser decorates on its own — WebKit's
  // rounded field and its cancel button — and the bar draws both itself.
  input: {
    '::-webkit-search-cancel-button': {
      display: 'none',
    },
    '::-webkit-search-decoration': {
      display: 'none',
    },
    appearance: 'none',
    // The bar's, rather than the one a browser gives a disabled input, so a
    // disabled bar shows one cursor over its whole length.
    cursor: 'inherit',
    flexGrow: 1,
    minInlineSize: 0,
  },
})

type SearchFieldProps = {
  /**
   * The name of the button that clears the field, for a screen reader.
   * Left out, React Aria names it in the reader's locale — "Clear search" in
   * English.
   */
  clearLabel?: string
  /**
   * A hint shown under the bar. Replaced by `error` when there is one, so
   * the two never stack.
   */
  description?: string
  /**
   * The action an on-screen keyboard labels its Enter key with. A search
   * field asks for Search, which iOS otherwise shows only for a search input
   * inside a form with an action, so a field submitted through `onSubmit`
   * alone gets it too. Inside an `Autocomplete` the field takes the Go key
   * React Aria gives it there, for the option Enter picks.
   *
   * @default 'search'
   */
  enterKeyHint?: RACSearchFieldProps['enterKeyHint']
  /**
   * The problem with the current value, in words. Its presence is what puts
   * the field in its error state — the message and `aria-invalid` follow
   * from it.
   *
   * Outside a `Form` the message line arrives with the message, so the
   * field grows when this does and moves what is under it. A `Form` holds
   * that space from the start; so does a permanent `description`.
   */
  error?: string
  /**
   * A ref to the field's own `<input>`, which is the element a call site moves
   * focus to — after a server's error, say. `ref` is the field as a whole.
   */
  inputRef?: Ref<HTMLInputElement>
  /**
   * What the field searches, for a screen reader. The bar draws no label,
   * so this is read and never shown; `placeholder` is what is seen.
   */
  label: string
  /** The supporting text in the empty bar, which is what a person reads. */
  placeholder?: string
} & Omit<
  RACSearchFieldProps,
  'children' | 'enterKeyHint' | 'isInvalid' | 'validationBehavior'
>

// What the bar draws, from the field's render state: the clear button only
// while the field holds something, and the error ring while it is invalid. Built by a call rather than written
// inline at the prop, which is what react-perf's no-new-function-as-prop is
// after; the React Compiler memoises the result on its inputs.
//
// A press anywhere on the bar focuses the input, as a press anywhere on the
// box of every other field does. The bar is 56dp and the input's line 24dp
// of it, so the magnifier, the padding at either end and the strips above
// and below the text took a press, darkened the bar for it, and focused
// nothing. A press on the input itself or on the clear button is left to
// them, and a disabled field takes none.
function fieldContent(
  label: string,
  placeholder: string | undefined,
  clearLabel: string | undefined,
  description: string | undefined,
  error: string | undefined,
  inputRef: Ref<HTMLInputElement> | undefined,
) {
  return (state: SearchFieldRenderProps) => (
    <>
      <VisuallyHidden>
        <Label>{label}</Label>
      </VisuallyHidden>
      <div
        onPointerDown={focusesControl(undefined)}
        {...stylex.props(
          styles.bar,
          state.isInvalid && styles.barError,
          state.isDisabled && styles.barDisabled,
        )}
      >
        <SearchGlyph
          {...stylex.props(
            styles.glyph,
            state.isDisabled && styles.glyphDisabled,
          )}
        />
        <FieldInput
          placeholder={placeholder}
          ref={inputRef}
          {...stylex.props(styles.input)}
        />
        {state.isEmpty ? null : (
          <IconButton aria-label={clearLabel} {...stylex.props(styles.clear)}>
            <CloseGlyph {...stylex.props(styles.clearGlyph)} />
          </IconButton>
        )}
      </div>
      <FieldMessage description={description} error={error} />
    </>
  )
}

/**
 * A search bar: a keyword typed into a pill, submitted with Enter and
 * cleared with Escape or its button. Its value is React Aria's: pass
 * `value` with `onChange` to control it, or `defaultValue` to let it keep
 * its own; `onSubmit` is handed the value on Enter and `onClear` is called
 * when it is emptied.
 *
 * ```tsx
 * <SearchField label="Label" onSubmit={search} />
 * ```
 *
 * The call site's `className` and `style` land on the field as a whole,
 * which is the element a layout positions. The input and the message are
 * drawn as every field in the library draws them; the pill around them is
 * Material Design's search bar rather than the box of its text fields.
 */
function SearchField({
  clearLabel,
  description,
  enterKeyHint,
  error,
  inputRef,
  isDisabled = false,
  label,
  placeholder,
  ...props
}: RefAttributes<HTMLDivElement> & SearchFieldProps) {
  const validationBehavior = useFieldValidationBehavior()
  // An Autocomplete hands its input `go` through this context, and a prop
  // written here would replace it, so the default steps aside for it; an
  // undefined prop leaves the context's value standing.
  const inherited = useSlottedContext(FieldInputContext)?.enterKeyHint

  return (
    <RACSearchField
      enterKeyHint={
        enterKeyHint ?? (inherited === undefined ? 'search' : undefined)
      }
      isDisabled={isDisabled}
      isInvalid={invalidFrom(error)}
      validationBehavior={validationBehavior}
      {...props}
      {...mergeStatefulStyles(stylex.props(fieldStyles.root), props)}
    >
      {fieldContent(
        label,
        placeholder,
        clearLabel,
        description,
        error,
        inputRef,
      )}
    </RACSearchField>
  )
}

export type { SearchFieldProps }

export default SearchField
