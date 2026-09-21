import type { HTMLAttributes, ReactNode, Ref } from 'react'
import type {
  ButtonProps,
  GroupProps,
  GroupRenderProps,
  InputProps,
  InputRenderProps,
  LabelProps,
  TextAreaProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { createContext, useContext } from 'react'
import {
  FieldError,
  FieldErrorContext,
  Group,
  Input,
  InputContext,
  Label,
  Button as RACButton,
  SelectStateContext,
  Text,
  TextArea,
  TextAreaContext,
  TextContext,
  useSlottedContext,
  VisuallyHidden,
} from 'react-aria-components'

import { mergeStatefulStyles, mergeStyles } from '../styles/merge'
import { useInsideForm } from './root'
import { fieldChromeStyles, groupStyles } from './styles'

// The chrome every field shares: the filled box with its label at the top, the
// control inside it, and the line of supporting text under it. TextField drew
// all of it on its own until the coverage plan brought a dozen more fields,
// each of which would otherwise have written the same box a second time.
//
// Not a component of the library's own and not exported. Each field is still
// React Aria's field component — TextField, NumberField, DateField — and these
// are the parts it renders inside, which is what keeps the label association,
// the description and error wiring, and validation on React Aria's side.
//
// Neither the notch nor the label can select on the state that drives them.
// Both are children of the box and the state is the box's, and the filled
// label reads it in CSS only because it changes type alone, which the box
// hands down inherited — where the notch changes what it holds and the
// label changes where it sits, and neither of those inherits. So the box's
// content computes that state in React instead: focus from the box's own
// render state, and a value from the control's context, which is where the
// character counter reads it too. The border's colour is the box's,
// inherited, which is what carries the hover, focus, error and disabled
// roles to it.

// What a control needs to know about the box around it: how the label is
// drawn, and whether the control clears it with a margin — it does under
// the filled box's label, and not under the outlined box's, whose label
// sits on the outline rather than over the value.
interface BoxControl {
  label: BoxLabel
  underLabel: boolean
}

// How the box draws its label, for the control inside it — see the context
// below.
type BoxLabel = 'fixed' | 'floating' | 'none'

type FieldBoxProps = {
  children?: ReactNode
  /**
   * Whether the label sits in the empty box and floats to the top once the
   * field is focused or holds a value, as the text fields page draws it.
   * `false` keeps it small at the top in every state.
   * @default true
   */
  floatingLabel?: boolean
  /**
   * Whether the control is holding anything, for a field whose control the
   * chrome cannot ask. It reads an input, a text area and a select's own
   * state; a control that is none of those — a token field's editable area,
   * say — says so here, and the floating label floats on it.
   */
  isPopulated?: boolean
  /** What the field is for. */
  label: string
  /** An icon at the start of the box, before the label and the control. */
  leading?: ReactNode
  /**
   * Whether the box takes its height from the control inside it rather
   * than the page's 56dp, for a text area.
   * @default false
   */
  multiline?: boolean
  /**
   * The box's own element. A field whose box is what something else is
   * anchored to needs it — a select's list is positioned against the box and
   * takes its width from it, which is what makes the two the same width.
   */
  ref?: Ref<HTMLDivElement>
  /** An icon at the end of the box, after the control. */
  trailing?: ReactNode
  /**
   * A press target covering the whole box, for a field whose box opens
   * something rather than taking a keystroke — {@link FieldTrigger}. Drawn
   * in the box itself rather than in the column the label and the control
   * share, so the padding and the icons open it too.
   */
  trigger?: ReactNode
  /**
   * The filled box, or the outlined one: no fill, an outline that thickens
   * and takes the primary role while focused, and the label cutting it once
   * it floats.
   * @default 'filled'
   */
  variant?: FieldVariant
} & Omit<GroupProps, 'children'>

// `prefix` is also an HTML attribute — the RDFa one, which nothing here
// wants — and React's element types carry it as a string, so it is left out
// of the props taken from React Aria to make room for the affix.
type FieldInputProps = Omit<InputProps, 'prefix'> & {
  /**
   * Renders the value in the mono face with tabular figures, for amounts and
   * other numbers meant to be compared down a column.
   * @default false
   */
  numeric?: boolean
  /**
   * Text before the value on its line, shown while the field is focused or
   * holds a value.
   */
  prefix?: ReactNode
  /**
   * Text after the value on its line, shown while the field is focused or
   * holds a value.
   */
  suffix?: ReactNode
}

type FieldLabelProps = LabelProps & {
  /**
   * The states the colour follows. Disabled wins over error, and error over
   * focus, so a focused invalid field keeps its error colour.
   */
  state?: Partial<FieldLabelState>
  /**
   * Where the label sits. `field` is inside a box, positioned and typed by
   * whatever renders it. `group` is above a group of controls, which has no
   * box to float a label in, so this one carries its type itself.
   * @default 'field'
   */
  variant?: FieldLabelVariant
}

type FieldLabelState = Pick<
  GroupRenderProps,
  'isDisabled' | 'isFocusWithin' | 'isInvalid'
>

type FieldLabelVariant = 'field' | 'group'

interface FieldMessageProps {
  /**
   * Whether to count the characters the control holds at the end of the
   * line, against `maxLength` where there is one. The count is read off the
   * field's own input or text area context.
   * @default false
   */
  characterCount?: boolean
  /**
   * How the limit is said to a screen reader, where there is a `maxLength`.
   * It is read with the field on focus rather than as the value changes, so
   * it names the limit and not what is left of it.
   * @default `Up to ${maxLength} characters`
   */
  characterLimitLabel?: string | undefined
  /**
   * A hint shown under the field. Replaced by `error` when there is one, so
   * the two never stack.
   */
  description?: string | undefined
  /** The problem with the current value, in words. */
  error?: string | undefined
  /**
   * Whether the line is indented to a box's inline padding, so it starts
   * where a value above it does. Off for a field with no box to line up with.
   * @default true
   */
  inset?: boolean
  /** The limit the count is shown against. */
  maxLength?: number | undefined
}

type FieldTextAreaProps = TextAreaProps & {
  /**
   * Whether the control grows with the text it holds, from the rows it asks
   * for. Off, it keeps its rows and scrolls.
   * @default false
   */
  autosize?: boolean
}

type FieldTriggerProps = ButtonProps

type FieldValueProps = HTMLAttributes<HTMLElement> & {
  /**
   * Whether the field has focus. A hidden placeholder appears while it does,
   * the way an input's does.
   * @default false
   */
  isFocused?: boolean
  /**
   * Whether nothing has been chosen yet, so what is drawn is the placeholder
   * rather than a value.
   * @default false
   */
  isPlaceholder?: boolean
}

type FieldVariant = 'filled' | 'outlined'

// A control under a floating label carries a placeholder so the box can
// tell when it is populated, shown only while focused. The default is what
// a control rendered outside any box gets — a search bar's, which has no
// label over it and shows its placeholder in every state. The four a box
// provides are hoisted so each is one stable object.
const OUTSIDE_BOX: BoxControl = { label: 'none', underLabel: false }
const BOX_CONTROLS = {
  filled: {
    fixed: { label: 'fixed', underLabel: true },
    floating: { label: 'floating', underLabel: true },
  },
  outlined: {
    fixed: { label: 'fixed', underLabel: false },
    floating: { label: 'floating', underLabel: false },
  },
} satisfies Record<FieldVariant, Record<'fixed' | 'floating', BoxControl>>

const BoxContext = createContext<BoxControl>(OUTSIDE_BOX)

// Written as calls rather than function literals at the prop, which is what
// react-perf's no-new-function-as-prop is after; the React Compiler memoises
// each result on its inputs.
function boxContent(
  label: string,
  children: ReactNode,
  floatingLabel: boolean,
  isPopulated: boolean | undefined,
  leading: ReactNode,
  trailing: ReactNode,
  trigger: ReactNode,
  variant: FieldVariant,
) {
  return (state: GroupRenderProps) => (
    <BoxContent
      floatingLabel={floatingLabel}
      isPopulated={isPopulated}
      label={label}
      leading={leading}
      state={state}
      trailing={trailing}
      trigger={trigger}
      variant={variant}
    >
      {children}
    </BoxContent>
  )
}

/**
 * What a box holds: its icons, its label and the control between them, plus
 * the outline when it has one. A component rather than the render function
 * itself, so it can read whether the control holds a value — which is what
 * the outlined box's notch and label follow, and what CSS cannot express
 * for them. See the outlined variant's note above.
 */
function BoxContent({
  children,
  floatingLabel,
  isPopulated,
  label,
  leading,
  state,
  trailing,
  trigger,
  variant,
}: {
  children: ReactNode
  floatingLabel: boolean
  isPopulated: boolean | undefined
  label: string
  leading: ReactNode
  state: GroupRenderProps
  trailing: ReactNode
  trigger: ReactNode
  variant: FieldVariant
}) {
  const read = useFieldPopulated()
  const populated = isPopulated ?? read
  const outlined = variant === 'outlined'
  const floated = !floatingLabel || state.isFocusWithin || populated

  return (
    <BoxContext
      value={BOX_CONTROLS[variant][floatingLabel ? 'floating' : 'fixed']}
    >
      {outlined ? (
        <fieldset
          aria-hidden="true"
          {...stylex.props(
            fieldChromeStyles.outline,
            leading !== undefined && fieldChromeStyles.outlineLeading,
            state.isFocusWithin && fieldChromeStyles.outlineFocused,
          )}
        >
          <legend
            {...stylex.props(
              fieldChromeStyles.outlineNotch,
              floated && fieldChromeStyles.outlineNotchOpen,
            )}
          >
            {floated ? label : null}
          </legend>
        </fieldset>
      ) : null}
      {trigger}
      {leading === undefined ? null : (
        <span
          {...stylex.props(
            fieldChromeStyles.icon,
            state.isDisabled && fieldChromeStyles.iconDisabled,
          )}
        >
          {leading}
        </span>
      )}
      <div
        {...stylex.props(
          fieldChromeStyles.column,
          floatingLabel && fieldChromeStyles.columnFloating,
          state.isDisabled &&
            (floatingLabel
              ? fieldChromeStyles.columnDisabledFloating
              : fieldChromeStyles.columnDisabled),
        )}
      >
        <FieldLabel
          state={state}
          {...stylex.props(
            fieldChromeStyles.boxLabel,
            floatingLabel && floated && fieldChromeStyles.boxLabelFloated,
            outlined && fieldChromeStyles.boxLabelOutlined,
            outlined && floated && fieldChromeStyles.boxLabelOutlinedFloated,
          )}
        >
          {label}
        </FieldLabel>
        {children}
      </div>
      {trailing === undefined ? null : (
        <span
          {...stylex.props(
            fieldChromeStyles.icon,
            state.isInvalid && fieldChromeStyles.iconError,
            state.isDisabled && fieldChromeStyles.iconDisabled,
          )}
        >
          {trailing}
        </span>
      )}
    </BoxContext>
  )
}

function boxStyles(
  floatingLabel: boolean,
  multiline: boolean,
  leading: boolean,
  trailing: boolean,
  variant: FieldVariant,
) {
  const outlined = variant === 'outlined'

  return (state: GroupRenderProps) =>
    stylex.props(
      fieldChromeStyles.box,
      floatingLabel
        ? fieldChromeStyles.boxFloating
        : fieldChromeStyles.boxFixed,
      multiline && fieldChromeStyles.boxMultiline,
      leading && fieldChromeStyles.boxLeading,
      trailing && fieldChromeStyles.boxTrailing,
      outlined && fieldChromeStyles.boxOutlined,
      outlined && floatingLabel && fieldChromeStyles.boxOutlinedFloating,
      state.isInvalid &&
        (outlined
          ? fieldChromeStyles.boxOutlinedError
          : fieldChromeStyles.boxError),
      state.isDisabled &&
        (outlined
          ? fieldChromeStyles.boxOutlinedDisabled
          : fieldChromeStyles.boxDisabled),
    )
}

/**
 * The box a control sits in, filled or outlined, with its label. React
 * Aria's `Group`, so
 * the field around it hands down `isDisabled` and `isInvalid` through context
 * and the box reports focus within it as render state, which is what the
 * label's colour follows. A field that provides no group context — one built
 * on a button rather than an input — passes the two states itself.
 */
function FieldBox({
  children,
  floatingLabel = true,
  isPopulated,
  label,
  leading,
  multiline = false,
  trailing,
  trigger,
  variant = 'filled',
  ...props
}: FieldBoxProps) {
  return (
    <Group
      {...props}
      {...mergeStatefulStyles(
        boxStyles(
          floatingLabel,
          multiline,
          leading !== undefined,
          trailing !== undefined,
          variant,
        ),
        props,
      )}
    >
      {boxContent(
        label,
        children,
        floatingLabel,
        isPopulated,
        leading,
        trailing,
        trigger,
        variant,
      )}
    </Group>
  )
}

/**
 * A field's text control, in a {@link FieldBox} or on its own. React Aria's
 * `Input`, which takes its label association, value and validation from the
 * field around it and reports its disabled state as render state.
 *
 * In a box it clears the label at the top, and under a floating label it
 * always carries a placeholder, since that is what the box reads to tell a
 * populated control from an empty one: its own where it was given one, a
 * blank otherwise. Outside a box it has no label over it and shows the
 * placeholder it was given in every state.
 */
function FieldInput({
  numeric = false,
  placeholder,
  prefix,
  suffix,
  ...props
}: FieldInputProps) {
  const box = useContext(BoxContext)

  const control = (
    <Input
      placeholder={placeholder ?? (box.label === 'floating' ? ' ' : undefined)}
      {...props}
      {...mergeStatefulStyles(
        (state: InputRenderProps) =>
          stylex.props(
            fieldChromeStyles.input,
            box.underLabel && fieldChromeStyles.inputUnderLabel,
            box.label === 'floating' &&
              fieldChromeStyles.inputUnderFloatingLabel,
            numeric && fieldChromeStyles.numeric,
            state.isDisabled && fieldChromeStyles.inputDisabled,
          ),
        props,
      )}
    />
  )

  if (prefix === undefined && suffix === undefined) {
    return control
  }

  return (
    <span {...stylex.props(fieldChromeStyles.affixLine)}>
      {prefix === undefined ? null : (
        <span
          {...stylex.props(
            fieldChromeStyles.affix,
            box.underLabel && fieldChromeStyles.inputUnderLabel,
          )}
        >
          {prefix}
        </span>
      )}
      {control}
      {suffix === undefined ? null : (
        <span
          {...stylex.props(
            fieldChromeStyles.affix,
            box.underLabel && fieldChromeStyles.inputUnderLabel,
          )}
        >
          {suffix}
        </span>
      )}
    </span>
  )
}

/**
 * A field's multi-line text control, in a {@link FieldBox} drawn `multiline`.
 * React Aria's `TextArea`, with the same label association, value and
 * validation {@link FieldInput} takes from the field around it, and the same
 * placeholder under a floating label.
 *
 * Given `autosize` it grows with its text from the rows it asks for. The
 * value it grows to fit is read off the field's context rather than
 * measured: the box holds a hidden replica of it in the control's own type,
 * in the same grid cell as the control, and the cell is as tall as whichever
 * of the two is taller.
 */
function FieldTextArea({
  autosize = false,
  placeholder,
  ...props
}: FieldTextAreaProps) {
  const box = useContext(BoxContext)
  const context = useSlottedContext(TextAreaContext)
  const value = typeof context?.value === 'string' ? context.value : ''

  const control = (
    <TextArea
      placeholder={placeholder ?? (box.label === 'floating' ? ' ' : undefined)}
      {...props}
      {...mergeStatefulStyles(
        (state: InputRenderProps) =>
          stylex.props(
            fieldChromeStyles.input,
            box.underLabel && fieldChromeStyles.inputUnderLabel,
            box.label === 'floating' &&
              fieldChromeStyles.inputUnderFloatingLabel,
            fieldChromeStyles.textArea,
            autosize && fieldChromeStyles.textAreaAutosize,
            autosize && fieldChromeStyles.autosizeCell,
            state.isDisabled && fieldChromeStyles.inputDisabled,
          ),
        props,
      )}
    />
  )

  if (!autosize) {
    return control
  }

  // A trailing space keeps a final line break of the value as a line of the
  // replica, which is how the control renders it.
  return (
    <div {...stylex.props(fieldChromeStyles.autosize)}>
      {control}
      <div
        aria-hidden="true"
        {...stylex.props(
          fieldChromeStyles.input,
          box.underLabel && fieldChromeStyles.inputUnderLabel,
          fieldChromeStyles.replica,
          fieldChromeStyles.autosizeCell,
        )}
      >
        {value}{' '}
      </div>
    </div>
  )
}

/**
 * The press target over a {@link FieldBox} whose whole surface opens
 * something — a select's list, a picker's calendar. React Aria's `Button`,
 * which takes the trigger's props from the field around it through context.
 *
 * It covers the box rather than sitting on its value's line, so the box's
 * own padding opens the field too. It draws nothing: the box already carries
 * the fill, the underline and the focus indicator, and it lights up while
 * this has focus because the indicator follows focus within.
 */
function FieldTrigger(props: FieldTriggerProps) {
  return (
    <RACButton
      {...props}
      {...mergeStatefulStyles(stylex.props(fieldChromeStyles.trigger), props)}
    />
  )
}

/**
 * A field's value where it was chosen rather than typed, in a
 * {@link FieldBox}. Put React Aria's own element inside it — a select's
 * `SelectValue`, a picker's display — and this is what carries the input's
 * type and its place on the line, clearing the label at the top and
 * truncating rather than wrapping.
 *
 * The wrapper is the styled one rather than React Aria's element, because
 * this is the box's flex item: styling the element inside instead left it
 * sizing itself against a parent that had already shrink-wrapped to it.
 *
 * `isPlaceholder` says nothing has been chosen, which takes the muted role;
 * under a floating label it is hidden until the field is focused, exactly as
 * an input's placeholder is.
 */
function FieldValue({
  isFocused = false,
  isPlaceholder = false,
  ...props
}: FieldValueProps) {
  const box = useContext(BoxContext)
  const hidden = isPlaceholder && box.label === 'floating' && !isFocused

  return (
    <span
      {...props}
      {...mergeStyles(
        stylex.props(
          fieldChromeStyles.input,
          fieldChromeStyles.value,
          box.underLabel && fieldChromeStyles.inputUnderLabel,
          isPlaceholder && fieldChromeStyles.valuePlaceholder,
          hidden && fieldChromeStyles.valuePlaceholderHidden,
        ),
        props,
      )}
    />
  )
}

function useFieldPopulated() {
  const input = useSlottedContext(InputContext)
  const textArea = useSlottedContext(TextAreaContext)
  // A field whose value is chosen rather than typed holds no input at all,
  // so being populated is a question for its own state — without this a
  // select's floating label never floats, however much is chosen.
  const select = useContext(SelectStateContext)
  if (select !== null) {
    return select.selectionManager.selectedKeys.size > 0
  }
  const value = input?.value ?? textArea?.value ?? ''
  return String(value).length > 0
}

/**
 * Whether the control in this box is holding anything, read off React
 * Aria's context for whichever control the field renders. The filled box
 * reads the same thing in CSS through `:placeholder-shown`; this is for
 * what CSS cannot express — see the outlined variant's note above.
 */
/**
 * A field's label: the colour alone, positioned and given its type by whatever
 * renders it. React Aria's `Label`, which the field around it associates with
 * its control through context.
 */
// Hoisted rather than written as the parameter's default, which would be a
// new object on every render.
const NO_STATE: Partial<FieldLabelState> = {}

function FieldLabel({
  state = NO_STATE,
  variant = 'field',
  ...props
}: FieldLabelProps) {
  const { isDisabled = false, isFocusWithin = false, isInvalid = false } = state

  return (
    <Label
      {...props}
      {...mergeStyles(
        stylex.props(
          fieldChromeStyles.label,
          variant === 'group' && groupStyles.label,
          isDisabled && fieldChromeStyles.labelDisabled,
          isInvalid && fieldChromeStyles.labelError,
          !isDisabled &&
            !isInvalid &&
            isFocusWithin &&
            fieldChromeStyles.labelFocused,
        ),
        props,
      )}
    />
  )
}

/**
 * The line under a field: the error while there is one, the description
 * otherwise. The error goes through React Aria's `FieldError`, which renders
 * only while the field is invalid and falls back to whatever validation
 * errors the field carries when no message is given — which is how a `Form`
 * with server-side errors, or the browser's own, reaches it without any
 * field changing. The description steps aside for those too, which is what
 * the field's validation state is read for.
 */
function FieldMessage({
  characterCount = false,
  characterLimitLabel,
  description,
  error,
  inset = true,
  maxLength,
}: FieldMessageProps) {
  const validation = useContext(FieldErrorContext)
  const invalid = error !== undefined || (validation?.isInvalid ?? false)
  const input = useSlottedContext(InputContext)
  const textArea = useSlottedContext(TextAreaContext)
  const insideForm = useInsideForm()
  // Read directly rather than through `useSlottedContext`, which throws for
  // a missing slot exactly as `Text` does — the throw is the thing being
  // avoided. What it is for is below, at `written`.
  const text = useContext(TextContext)

  // The limit, in words, for the description React Aria reads out with the
  // field. `maxLength` alone reaches the control as the native attribute,
  // which is not reliably announced, and the count beside the message is
  // hidden — so without this a reader is never told there is a limit.
  const limit =
    maxLength === undefined
      ? undefined
      : (characterLimitLabel ??
        `Up to ${maxLength} character${maxLength === 1 ? '' : 's'}`)

  const hidden =
    limit === undefined ? null : (
      <VisuallyHidden elementType="span">
        <Text slot="description">{limit}</Text>
      </VisuallyHidden>
    )

  // Nothing to say, and nowhere a message could arrive from: the field ends
  // at its control. Inside a form the line is drawn anyway, empty, since a
  // form is where a message appears after the fact — a server's answer, or
  // the browser's own on submit — and every field below this one would
  // otherwise move by the line's height when it does.
  //
  // A limit to announce leaves on its own rather than bringing the line with
  // it. The line is one line of type plus the 4dp above it, so drawing it
  // for something nobody can see would make a field with a limit taller than
  // the same field without one.
  if (!invalid && description === undefined && !characterCount && !insideForm) {
    return hidden
  }

  const value = input?.value ?? textArea?.value ?? ''
  const length = String(value).length

  const hint = invalid ? undefined : description

  // One slotted description, never two. React Aria hands every element in
  // its description slot the same generated id, so a second one puts a
  // duplicate id in the document and axe fails the story. The limit rides
  // inside the hint where there is one, and carries the whole slot where
  // there is not — hidden either way, since the count already draws it.
  //
  // Hidden by clipping rather than by leaving it out of the row, and the
  // difference is a gap: the row is a flex line with 16dp between its parts,
  // and an element with no width is still a part. Clipping takes it out of
  // flow, so a field with a limit and no hint has the line it had before.
  const described =
    hint === undefined ? (
      hidden
    ) : (
      <Text slot="description" {...stylex.props(fieldChromeStyles.message)}>
        {hint}
        {limit === undefined ? null : (
          // The space is load-bearing: a description is read as the text
          // content of one element, and two spans run together without it.
          <VisuallyHidden elementType="span">{` ${limit}`}</VisuallyHidden>
        )}
      </Text>
    )

  // Outside a field that validates there is nothing to hand React Aria's
  // `FieldError`, and it draws nothing without it — a group of chips is a
  // group rather than a form control, so the error it was given is written
  // out instead.
  //
  // Through the group's error slot where there is one, which is what makes
  // the message reach a screen reader at all: React Aria generates the id
  // its `aria-describedby` points at up front, then keeps it only while
  // something in the document carries it, so an element outside the slot is
  // drawn and never announced. The description beside it has always gone
  // through its own slot, which is why that half worked.
  //
  // Not every group has one. `TagGroup` wires up a description and an error;
  // `TokenField` wires up a description alone and generates no error id at
  // all, so its message has nothing to attach to and stays a bare element.
  const errorSlot =
    text !== null &&
    typeof text === 'object' &&
    'slots' in text &&
    text.slots?.errorMessage !== undefined

  const messageStyles = stylex.props(
    fieldChromeStyles.message,
    fieldChromeStyles.messageError,
  )
  const written = errorSlot ? (
    <Text slot="errorMessage" {...messageStyles}>
      {error}
    </Text>
  ) : (
    <span {...messageStyles}>{error}</span>
  )

  return (
    <div
      {...stylex.props(
        fieldChromeStyles.message,
        fieldChromeStyles.messageLine,
        inset && fieldChromeStyles.messageInset,
      )}
    >
      {validation === null && error !== undefined ? (
        written
      ) : (
        <FieldError
          {...stylex.props(
            fieldChromeStyles.message,
            fieldChromeStyles.messageError,
          )}
        >
          {error}
        </FieldError>
      )}
      {described}
      {characterCount ? (
        // Hidden from the tree, and the limit above is why. A count is the
        // one piece of supporting text that changes on every keystroke, and
        // a screen reader reading it back at that rate is worse than not
        // hearing it — the limit said once on focus is what a reader needs,
        // and this is the same fact drawn for whoever is looking.
        <span
          aria-hidden="true"
          {...stylex.props(
            fieldChromeStyles.message,
            fieldChromeStyles.counter,
            invalid && fieldChromeStyles.messageError,
          )}
        >
          {maxLength === undefined ? length : `${length}/${maxLength}`}
        </span>
      ) : null}
    </div>
  )
}

export type {
  FieldBoxProps,
  FieldInputProps,
  FieldLabelProps,
  FieldLabelState,
  FieldLabelVariant,
  FieldMessageProps,
  FieldTextAreaProps,
  FieldVariant,
}

export {
  FieldBox,
  FieldInput,
  FieldLabel,
  FieldMessage,
  FieldTextArea,
  FieldTrigger,
  FieldValue,
}
