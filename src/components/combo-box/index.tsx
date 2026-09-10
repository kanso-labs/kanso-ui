import type { ReactNode } from 'react'
import type { ComboBoxProps as RACComboBoxProps } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { useContext, useRef } from 'react'
import {
  ComboBoxStateContext,
  Button as RACButton,
  ComboBox as RACComboBox,
  ComboBoxValue as RACComboBoxValue,
  Popover as RACPopover,
} from 'react-aria-components'

import type { FieldVariant } from '../../field'

import { FieldBox, FieldInput, FieldMessage, FieldValue } from '../../field'
import {
  fieldStyles,
  invalidFrom,
  useFieldValidationBehavior,
} from '../../field/root'
import { ChevronEndGlyph } from '../../glyphs'
import { mergeStatefulStyles } from '../../styles/merge'
import { overlay } from '../../styles/overlay'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import ListBox from '../list-box'

// The text fields page's autocomplete text field: a text field that filters a
// list as it is typed. Everything above the list is the field chrome in
// `src/field` — the same box, label, supporting line and error treatment
// every other field draws — and the list is ListBox on the shared overlay
// surface, positioned and sized against the box exactly as Select's is.
//
// It is Select's shape with two differences.
//
// The control is a real input, so the box is not a press target — typing has
// to reach the input — and only the chevron at the end opens the list. That
// is what the page draws too: an autocomplete text field is a text field,
// with a button on it.
//
// And the field is an element tree rather than a function of React Aria's
// render state, which every other component here writes. React Aria builds a
// combo box's collection by walking its children for options, and a function
// is opaque to that walk: with one, the collection is empty until the list
// has been opened, so a `defaultSelectedKey` resolves to no text and the
// field starts blank. What needed the render state — whether the list is
// open — reads the combo box's own state from context instead.
//
// Two more things are this component's own.
//
// **Filtering is React Aria's, and stays theirs.** `defaultFilter` takes a
// predicate, and the package re-exports `useFilter` for a locale-aware one;
// `items` with `useAsyncList` is how a list that is fetched rather than
// listed gets in. None of that is wrapped, because a combo box's whole job
// is which options it shows and a wrapper would be a second place to decide
// it.
//
// **A value that is not in the list is allowed or refused, not corrected.**
// `allowsCustomValue` is React Aria's, and with it off the input reverts to
// the last chosen option on blur rather than keeping text that means nothing.
//
// Choosing more than one is `selectionMode="multiple"`, which draws the
// chosen options before the input through React Aria's `ComboBoxValue`. For
// a field that draws each of them as a removable chip, the coverage plan has
// TokenField.

// Hoisted so it is not a new element on every render, which is what
// react-perf's jsx-no-jsx-as-prop is after.
const TOGGLE = <ComboToggle />

const styles = stylex.create({
  // The list, under the field and as wide as it. The overlay's own width
  // range belongs to a menu opened from a button, so it is replaced here.
  list: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.xs,
    inlineSize: 'var(--trigger-width)',
    maxBlockSize: 'inherit',
    maxInlineSize: 'none',
    minInlineSize: 0,
    overflowY: 'auto',
    paddingBlock: spacing.sm,
  },
  // The button that opens the list: the page's 24dp trailing icon, pressable.
  // Drawn as nothing but the glyph, since the box around it already carries
  // the fill, the underline and the focus indicator.
  toggle: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    blockSize: '24px',
    borderRadius: radii.full,
    borderWidth: 0,
    boxSizing: 'border-box',
    color: 'inherit',
    cursor: 'pointer',
    display: 'inline-flex',
    inlineSize: '24px',
    justifyContent: 'center',
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
    padding: 0,
  },
  toggleGlyph: {
    blockSize: '24px',
    inlineSize: '24px',
    transform: 'rotate(90deg)',
    transitionDuration: '150ms',
    transitionProperty: 'transform',
  },
  toggleGlyphOpen: {
    transform: 'rotate(-90deg)',
  },
  // The chosen options, before the input, when more than one may be chosen.
  values: {
    flexShrink: 0,
  },
})

type ComboBoxProps<
  T extends object = object,
  M extends ComboBoxSelectionMode = 'single',
> = {
  /**
   * Where to portal the list. Defaults to the end of `<body>`, which is
   * right for an app that sets its StyleX theme on `:root`. An app that
   * scopes the theme to a subtree has to point this at an element inside it,
   * or the list renders outside the theme and falls back to the tokens'
   * `prefers-color-scheme` default.
   */
  container?: Element
  /**
   * A hint shown under the field. Replaced by `error` when there is one, so
   * the two never stack.
   */
  description?: string
  /**
   * The problem with the current value, in words. Its presence is what puts
   * the field in its error state — the message, the red underline, and
   * `aria-invalid` all follow from it.
   */
  error?: string
  /**
   * Whether the label sits in the empty box and floats to the top once the
   * field is focused or holds a value. `false` keeps it small at the top in
   * every state.
   * @default true
   */
  floatingLabel?: boolean
  /**
   * What the field is for. Required rather than optional: a combo box with
   * no label is a box a screen reader cannot name.
   */
  label: string
  /**
   * An icon at the start of the box, before the label and the value: the
   * page's 24dp leading icon, in the muted role.
   */
  leadingIcon?: ReactNode
  /**
   * The options. `ListBox.Item` for each, and `ListBox.Section` to group
   * them — the list inside is a ListBox, and takes everything one does.
   */
  options?: ReactNode
  /**
   * The filled box, or the outlined one, as the text fields page draws them.
   * @default 'filled'
   */
  variant?: FieldVariant
} & Omit<
  RACComboBoxProps<T, M>,
  | 'children'
  | 'defaultSelectedKey'
  | 'isInvalid'
  | 'onSelectionChange'
  | 'selectedKey'
  | 'validationBehavior'
>

// React Aria's combo box takes its own two-value selection mode rather than
// the collection-wide one, which also has `none`; that type is local to its
// module, so the two values are named again here.
type ComboBoxSelectionMode = 'multiple' | 'single'

/**
 * The chosen options, drawn before the input when more than one may be
 * chosen. The chrome's `FieldValue` is the styled element and React Aria's
 * `ComboBoxValue` sits inside it, as it does in Select.
 */
function ChosenValues() {
  return (
    <FieldValue {...stylex.props(styles.values)}>
      <RACComboBoxValue />
    </FieldValue>
  )
}

/**
 * A labelled text field that filters a list as it is typed. Its value is
 * React Aria's: pass `value` with `onChange` to control which option is
 * chosen, `inputValue` with `onInputChange` to control the text, or the
 * `default` forms of either to let it keep its own. React Aria's older
 * `selectedKey` names are deprecated and are left out of this component's
 * props rather than passed through.
 *
 * ```tsx
 * <ComboBox
 *   label="Label"
 *   options={
 *     <>
 *       <ListBox.Item id="first">First item</ListBox.Item>
 *       <ListBox.Item id="second">Second item</ListBox.Item>
 *     </>
 *   }
 * />
 * ```
 *
 * Filtering is React Aria's: `defaultFilter` takes a predicate, `useFilter`
 * is re-exported for a locale-aware one, and `items` with `useAsyncList`
 * feeds a list that is fetched rather than listed. `allowsCustomValue` lets
 * the field keep text that matches nothing.
 *
 * The box, label, input, supporting line and error are the field chrome in
 * `src/field`, shared with every other field; the list is ListBox on the
 * overlay surface every anchored panel here draws.
 *
 * The call site's `className` and `style` land on the field as a whole,
 * which is the element a layout positions.
 */
function ComboBox<
  T extends object = object,
  M extends ComboBoxSelectionMode = 'single',
>({
  container,
  description,
  error,
  floatingLabel = true,
  isDisabled = false,
  label,
  leadingIcon,
  options,
  variant = 'filled',
  ...props
}: ComboBoxProps<T, M>) {
  const validationBehavior = useFieldValidationBehavior()
  // What the list is anchored to and takes its width from: the box, not the
  // button inside it, which is a 24dp icon.
  const boxRef = useRef<HTMLDivElement>(null)

  return (
    <RACComboBox<T, M>
      isDisabled={isDisabled}
      isInvalid={invalidFrom(error)}
      validationBehavior={validationBehavior}
      {...props}
      {...mergeStatefulStyles(stylex.props(fieldStyles.root), props)}
    >
      <FieldBox
        floatingLabel={floatingLabel}
        // React Aria's `TextField` hands its group the field's disabled and
        // invalid state through context; its `ComboBox` does not, so the box
        // is told outright or its label and its underline never turn.
        isDisabled={isDisabled}
        isInvalid={invalidFrom(error)}
        label={label}
        leading={leadingIcon}
        ref={boxRef}
        trailing={TOGGLE}
        variant={variant}
      >
        {props.selectionMode === 'multiple' ? <ChosenValues /> : null}
        <FieldInput />
      </FieldBox>
      <FieldMessage description={description} error={error} />
      <RACPopover
        triggerRef={boxRef}
        // oxlint-disable-next-line typescript/no-deprecated -- its replacement, UNSAFE_PortalProvider, is not exported by react-aria-components
        UNSTABLE_portalContainer={container}
        {...stylex.props(overlay.popup, styles.list)}
      >
        <ListBox>{options}</ListBox>
      </RACPopover>
    </RACComboBox>
  )
}

/**
 * The button that opens the list. It takes its press behaviour from the
 * combo box around it through React Aria's button context, and reads whether
 * the list is open from the combo box's state rather than from a render prop
 * — the whole field cannot be a render function, since React Aria builds its
 * collection by walking the children and a function is opaque to that walk.
 */
function ComboToggle() {
  const state = useContext(ComboBoxStateContext)

  return (
    <RACButton {...stylex.props(styles.toggle)}>
      <ChevronEndGlyph
        {...stylex.props(
          styles.toggleGlyph,
          state?.isOpen === true && styles.toggleGlyphOpen,
        )}
      />
    </RACButton>
  )
}

export type { ComboBoxProps, ComboBoxSelectionMode }

export default ComboBox
