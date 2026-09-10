import type { ReactNode, RefObject } from 'react'
import type {
  SelectProps as RACSelectProps,
  SelectRenderProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { useContext, useRef } from 'react'
import {
  Popover as RACPopover,
  Select as RACSelect,
  SelectValue as RACSelectValue,
  SelectStateContext,
} from 'react-aria-components'

import type { FieldVariant } from '../../field'

import { FieldBox, FieldMessage, FieldTrigger, FieldValue } from '../../field'
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

// The menus page's exposed dropdown menu: a text field that opens a list
// rather than taking a keystroke. Everything above the list is the field
// chrome in `src/field` — the same box, label, supporting line and error
// treatment every other field draws — and the list is ListBox on the shared
// overlay surface. What is here is React Aria's `Select` around the two, and
// the three things that are this component's own.
//
// **The whole box opens the list.** The chrome's `FieldTrigger` covers the
// box rather than sitting on the value's line, so the padding, the label and
// the icons all open it, which is what the page draws and what a native
// select does. It draws nothing itself: the box already carries the fill,
// the underline and the focus indicator.
//
// **The chevron turns.** The page's trailing icon points down while the list
// is closed and up while it is open. React Aria reports which through the
// select's render state, so it is drawn from that rather than swapped for a
// second glyph.
//
// **The list is the field's width.** The page draws it under the field and
// as wide as it, which React Aria reports as `--trigger-width` — of whatever
// it is anchored to. Left alone that is the button, which fills the box's
// value column rather than the box, so the list came out narrower than the
// field by the icons either side of it. Pointing the popover's `triggerRef`
// at the box is what makes the two agree. The overlay's own 112 to 280 range
// is a menu opened from a button rather than from a field, so it goes.
//
// A select's value is chosen rather than typed, which the chrome had no
// notion of until this component: `useFieldPopulated` now reads the select's
// own state, so the floating label floats once something is chosen.

// Hoisted, and the chevron built by a call, so neither is a new element on
// every render — which is what react-perf's jsx-no-jsx-as-prop is after.
const TRIGGER = <FieldTrigger />

function chevronFor(isOpen: boolean) {
  return (
    <ChevronEndGlyph
      {...stylex.props(styles.chevron, isOpen && styles.chevronOpen)}
    />
  )
}

const styles = stylex.create({
  // The page's trailing icon. It points down closed and up open, turned
  // rather than swapped, so the two states are one glyph.
  chevron: {
    blockSize: '24px',
    inlineSize: '24px',
    transform: 'rotate(90deg)',
    transitionDuration: '150ms',
    transitionProperty: 'transform',
  },
  chevronOpen: {
    transform: 'rotate(-90deg)',
  },
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
})

type SelectProps<T extends object = object> = {
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
   * field is focused or something is chosen. `false` keeps it small at the
   * top in every state.
   * @default true
   */
  floatingLabel?: boolean
  /**
   * What the field is for. Required rather than optional: a select with no
   * label is a box a screen reader cannot name.
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
  RACSelectProps<T>,
  | 'children'
  | 'defaultSelectedKey'
  | 'isInvalid'
  | 'onSelectionChange'
  | 'selectedKey'
  | 'validationBehavior'
>

/**
 * A labelled field that opens a list to choose from. Its value is React
 * Aria's: pass `value` with `onChange` to control it, or `defaultValue` to
 * let it keep its own. The value is an option's `id`, so give every option
 * one. React Aria's older `selectedKey` names are deprecated and are left
 * out of this component's props rather than passed through.
 *
 * ```tsx
 * <Select
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
 * The box, label, supporting line and error are the field chrome in
 * `src/field`, shared with every other field; the list is ListBox on the
 * overlay surface every anchored panel here draws.
 *
 * The call site's `className` and `style` land on the field as a whole,
 * which is the element a layout positions.
 */
function Select<T extends object = object>({
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
}: SelectProps<T>) {
  const validationBehavior = useFieldValidationBehavior()
  // What the list is anchored to and takes its width from — see the note at
  // the top of the file.
  const boxRef = useRef<HTMLDivElement>(null)

  return (
    <RACSelect<T>
      isDisabled={isDisabled}
      isInvalid={invalidFrom(error)}
      validationBehavior={validationBehavior}
      {...props}
      {...mergeStatefulStyles(stylex.props(fieldStyles.root), props)}
    >
      {selectContent(
        label,
        leadingIcon,
        floatingLabel,
        variant,
        description,
        error,
        options,
        container,
        boxRef,
      )}
    </RACSelect>
  )
}

// What the field draws, from React Aria's render state. Built by a call
// rather than written inline at the prop, which is what react-perf's
// no-new-function-as-prop is after; the React Compiler memoises the result
// on its inputs.
//
// The state is read for the chevron alone — which way it points — since
// everything else the box shows it reads from its own focus and validity.
function selectContent(
  label: string,
  leadingIcon: ReactNode,
  floatingLabel: boolean,
  variant: FieldVariant,
  description: string | undefined,
  error: string | undefined,
  options: ReactNode,
  container: Element | undefined,
  boxRef: RefObject<HTMLDivElement | null>,
) {
  return (state: SelectRenderProps) => (
    <>
      <FieldBox
        floatingLabel={floatingLabel}
        // React Aria's `TextField` hands its group the field's disabled and
        // invalid state through context; its `Select` does not, so the box is
        // told outright or its label and its underline never turn.
        isDisabled={state.isDisabled}
        isInvalid={state.isInvalid}
        label={label}
        leading={leadingIcon}
        ref={boxRef}
        trailing={chevronFor(state.isOpen)}
        trigger={TRIGGER}
        variant={variant}
      >
        <SelectedValue isFocused={state.isFocused} />
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
    </>
  )
}

/**
 * What has been chosen, drawn on the value's line. The chrome's `FieldValue`
 * is the styled element and React Aria's `SelectValue` sits inside it, since
 * the wrapper is the box's flex item.
 */
function SelectedValue({ isFocused }: { isFocused: boolean }) {
  const state = useContext(SelectStateContext)
  const isPlaceholder = (state?.selectionManager.selectedKeys.size ?? 0) === 0

  return (
    <FieldValue isFocused={isFocused} isPlaceholder={isPlaceholder}>
      <RACSelectValue />
    </FieldValue>
  )
}

export type { SelectProps }

export default Select
