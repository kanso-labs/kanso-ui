import * as stylex from '@stylexjs/stylex'

// What a field applies to its own root, which is React Aria's field element
// rather than a part of the chrome. Apart from the parts in ./index.tsx so
// that file exports components alone, which is what keeps fast refresh working
// for it.

/**
 * What every field passes React Aria for `validationBehavior`. The message
 * under a field is the library's to show, so validation only marks the control
 * rather than surfacing the browser's own constraint UI; a `Form` may opt a
 * field back into the native behaviour. One constant rather than a literal in
 * each field, so the decision has one place to be changed.
 */
const FIELD_VALIDATION_BEHAVIOR = 'aria'

const fieldStyles = stylex.create({
  root: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  },
})

export { FIELD_VALIDATION_BEHAVIOR, fieldStyles }
