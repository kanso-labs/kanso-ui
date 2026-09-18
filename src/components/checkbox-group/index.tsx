import type { ReactNode } from 'react'
import type {
  CheckboxGroupRenderProps,
  CheckboxGroupProps as RACCheckboxGroupProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { CheckboxGroup as RACCheckboxGroup } from 'react-aria-components'

import { FieldLabel, FieldMessage } from '../../field'
import { invalidFrom, useFieldValidationBehavior } from '../../field/root'
import { groupStyles } from '../../field/styles'
import { mergeStatefulStyles } from '../../styles/merge'

// A labelled set of checkboxes sharing one value. The checkbox page draws
// the boxes; the group is what the ARIA pattern asks for around them — a
// group named by its label, described by its description, and invalid as a
// whole — and its label, description and error are the field chrome's, so a
// group reads like the fields beside it. The label is label-large, the role
// a field's label takes at rest, since a group has no box to float it in.
const styles = stylex.create({
  items: {
    display: 'flex',
    flexDirection: 'column',
  },
})

type CheckboxGroupProps = {
  /** The checkboxes, each with a `value` of its own. */
  children?: ReactNode
  /**
   * A hint under the group. Replaced by `error` when there is one, so the
   * two never stack.
   */
  description?: string
  /**
   * The problem with the current selection, in words. Its presence is what
   * puts the group in its error state — the message, the boxes' error
   * colours and `aria-invalid` all follow from it.
   *
   * Outside a `Form` the message line arrives with the message, so the
   * field grows when this does and moves what is under it. A `Form` holds
   * that space from the start; so does a permanent `description`.
   */
  error?: string
  /**
   * What the group is for. Required rather than optional: a group of
   * checkboxes with no name is a set of boxes a screen reader cannot
   * introduce.
   */
  label: string
} & Omit<RACCheckboxGroupProps, 'children' | 'isInvalid' | 'validationBehavior'>

/**
 * A labelled set of checkboxes with one value between them. The value is
 * React Aria's: pass `value` with `onChange` to control it, or
 * `defaultValue` to let the group keep its own, and each `Checkbox` inside
 * names the entry it stands for with `value`. Disabled, read-only and the
 * error state reach every checkbox from here.
 *
 * The call site's `className` and `style` land on the group as a whole,
 * which is the element a layout positions.
 */
function CheckboxGroup({
  children,
  description,
  error,
  label,
  ...props
}: CheckboxGroupProps) {
  const validationBehavior = useFieldValidationBehavior()

  return (
    <RACCheckboxGroup
      isInvalid={invalidFrom(error)}
      validationBehavior={validationBehavior}
      {...props}
      {...mergeStatefulStyles(stylex.props(groupStyles.root), props)}
    >
      {groupContent(label, children, description, error)}
    </RACCheckboxGroup>
  )
}

// Built by a call rather than written inline at the prop, which is what
// react-perf's no-new-function-as-prop is after; the React Compiler memoises
// the result on its inputs. The label takes the group's render state, so
// its colour follows disabled and invalid the way a field's follows its box.
function groupContent(
  label: string,
  children: ReactNode,
  description: string | undefined,
  error: string | undefined,
) {
  return (state: CheckboxGroupRenderProps) => (
    <>
      <FieldLabel state={state} variant="group">
        {label}
      </FieldLabel>
      <div {...stylex.props(styles.items)}>{children}</div>
      <FieldMessage description={description} error={error} inset={false} />
    </>
  )
}

export type { CheckboxGroupProps }

export default CheckboxGroup
