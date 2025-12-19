import type {
  FieldLabelProps as BaseUIFieldLabelProps,
  FieldRootProps as BaseUIFieldProps,
} from '@base-ui/react/field'

import { Field as BaseUIField } from '@base-ui/react/field'
import * as stylex from '@stylexjs/stylex'

const styles = stylex.create({
  control: {
    borderRadius: '1em',
    borderWidth: 1,
    fontFamily: "'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: 1,
    padding: '11px 20px',
  },
  label: {
    fontFamily: "'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: 1,
  },
})

interface FieldProps {
  disabled?: BaseUIFieldProps['disabled']
  label: BaseUIFieldLabelProps['children']
}

function Field({ disabled = false, label }: FieldProps) {
  return (
    <BaseUIField.Root disabled={disabled}>
      <BaseUIField.Label {...stylex.props(styles.label)}>
        {label}
      </BaseUIField.Label>

      <div>
        <BaseUIField.Control {...stylex.props(styles.control)} />
      </div>
    </BaseUIField.Root>
  )
}

export type { FieldProps }

export default Field
