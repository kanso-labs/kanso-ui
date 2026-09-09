import type {
  SearchFieldProps as RACSearchFieldProps,
  SearchFieldRenderProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  Label,
  SearchField as RACSearchField,
  VisuallyHidden,
} from 'react-aria-components'

import { FieldInput, FieldMessage } from '../../field'
import { FIELD_VALIDATION_BEHAVIOR, fieldStyles } from '../../field/root'
import { CloseGlyph, SearchGlyph } from '../../glyphs'
import { mergeStatefulStyles } from '../../styles/merge'
import {
  colors,
  motion,
  radii,
  spacing,
  stateLayerOpacity,
} from '../../tokens/design.tokens.stylex'
import IconButton from '../icon-button'

// The search page's search bar, on its own: a 56dp container with a full
// corner on surface container high, a 24dp magnifier in on surface variant
// at the start, the supporting text in on surface variant and the input
// text in on surface, both body-large, and a trailing icon button in on
// surface variant that clears the field while it holds anything. The page's
// 16dp of padding is to a 48dp tap target, and the icon sits 12dp inside
// that, so the magnifier starts 28dp in and the text 4dp past the target,
// at 68dp; the clear button is the medium icon button, 40dp around a 24dp
// icon, set 4dp in from the padding so its icon ends 28dp from the end. The
// container follows its own width up to the page's 720dp; the page's 360dp
// floor is left to the call site, since a phone's width less its margins is
// under it. The list of suggestions the page draws under the bar is
// Autocomplete's, and nothing here.
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
    alignItems: 'center',
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), ${colors.surfaceContainerHigh})`,
      ':hover': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), ${colors.surfaceContainerHigh})`,
      default: colors.surfaceContainerHigh,
    },
    blockSize: '56px',
    borderRadius: radii.full,
    boxShadow: {
      ':focus-within': `inset 0 0 0 2px ${colors.primary}`,
      default: 'none',
    },
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    display: 'flex',
    gap: spacing.lg,
    inlineSize: '100%',
    maxInlineSize: '720px',
    paddingInlineEnd: spacing.lg,
    paddingInlineStart: `calc(${spacing.lg} + ${spacing.md})`,
    transitionDuration: motion.durationShort2,
    transitionProperty: 'background-color, box-shadow',
    transitionTimingFunction: motion.easingStandard,
  },
  barDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
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
  glyph: {
    blockSize: '24px',
    display: 'block',
    flexShrink: 0,
    inlineSize: '24px',
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
    flexGrow: 1,
    minInlineSize: 0,
  },
})

type SearchFieldProps = {
  /**
   * The name of the button that clears the field, for a screen reader.
   * @default 'Clear'
   */
  clearLabel?: string
  /**
   * A hint shown under the bar. Replaced by `error` when there is one, so
   * the two never stack.
   */
  description?: string
  /**
   * The problem with the current value, in words. Its presence is what puts
   * the field in its error state — the message and `aria-invalid` follow
   * from it.
   */
  error?: string
  /**
   * What the field searches, for a screen reader. The bar draws no label,
   * so this is read and never shown; `placeholder` is what is seen.
   */
  label: string
  /** The supporting text in the empty bar, which is what a person reads. */
  placeholder?: string
} & Omit<RACSearchFieldProps, 'children' | 'isInvalid' | 'validationBehavior'>

// What the bar draws, from the field's render state: the clear button only
// while the field holds something. Built by a call rather than written
// inline at the prop, which is what react-perf's no-new-function-as-prop is
// after; the React Compiler memoises the result on its inputs.
function fieldContent(
  label: string,
  placeholder: string | undefined,
  clearLabel: string,
  description: string | undefined,
  error: string | undefined,
) {
  return (state: SearchFieldRenderProps) => (
    <>
      <VisuallyHidden>
        <Label>{label}</Label>
      </VisuallyHidden>
      <div
        {...stylex.props(styles.bar, state.isDisabled && styles.barDisabled)}
      >
        <SearchGlyph {...stylex.props(styles.glyph)} />
        <FieldInput placeholder={placeholder} {...stylex.props(styles.input)} />
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
 * The call site's `className` and `style` land on the field as a whole,
 * which is the element a layout positions. The input and the message are
 * the field chrome in `src/field`, shared with every other field; the bar
 * around them is the search page's rather than the box the other fields
 * share.
 */
function SearchField({
  clearLabel = 'Clear',
  description,
  error,
  isDisabled = false,
  label,
  placeholder,
  ...props
}: SearchFieldProps) {
  return (
    <RACSearchField
      isDisabled={isDisabled}
      isInvalid={error !== undefined}
      validationBehavior={FIELD_VALIDATION_BEHAVIOR}
      {...props}
      {...mergeStatefulStyles(stylex.props(fieldStyles.root), props)}
    >
      {fieldContent(label, placeholder, clearLabel, description, error)}
    </RACSearchField>
  )
}

export type { SearchFieldProps }

export default SearchField
