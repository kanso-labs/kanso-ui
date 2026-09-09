import * as stylex from '@stylexjs/stylex'
import { FormContext, useSlottedContext } from 'react-aria-components'

// What a field applies to its own root, which is React Aria's field element
// rather than a part of the chrome. Apart from the parts in ./index.tsx so
// that file exports components alone, which is what keeps fast refresh working
// for it.

/**
 * What a field passes React Aria for `validationBehavior` outside a `Form`.
 * The message under a field is the library's to show, so validation only
 * marks the control rather than surfacing the browser's own constraint UI.
 * One constant rather than a literal in each field, so the decision has one
 * place to be changed.
 */
const FIELD_VALIDATION_BEHAVIOR = 'aria'

/**
 * What a field passes React Aria for `isInvalid`, from its `error` prop. Any
 * value there, `false` included, makes the field's validation controlled: it
 * is exactly as invalid as the prop says, and what a `Form` reports for it —
 * a server's errors, or the browser's own — is never shown. So the prop is
 * left unset while the field has no error of its own, which is what lets
 * the form's reach it.
 */
function invalidFrom(error: string | undefined): true | undefined {
  return error === undefined ? undefined : true
}

/**
 * The validation behaviour a field passes React Aria: its `Form`'s, where it
 * is inside one, and {@link FIELD_VALIDATION_BEHAVIOR} otherwise. React Aria
 * takes a field's own prop over its form's, so a field that passed the
 * constant could never be opted into the native behaviour by the form around
 * it; reading the form here is what lets `Form` decide for every field at
 * once.
 */
function useFieldValidationBehavior(): 'aria' | 'native' {
  const form = useSlottedContext(FormContext)
  return form?.validationBehavior ?? FIELD_VALIDATION_BEHAVIOR
}

/**
 * Whether this field is inside a `Form`. A form is where a message arrives
 * after the fact — a server's answer, or the browser's own on submit — so it
 * is where the line under a field is kept clear whether or not there is
 * anything to say, and the fields below it stay where they are.
 */
function useInsideForm() {
  return useSlottedContext(FormContext) !== null
}

const fieldStyles = stylex.create({
  root: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  },
})

export {
  FIELD_VALIDATION_BEHAVIOR,
  fieldStyles,
  invalidFrom,
  useFieldValidationBehavior,
  useInsideForm,
}
