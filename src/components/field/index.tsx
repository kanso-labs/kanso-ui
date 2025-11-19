import type {
  FieldLabelProps as BaseUIFieldLabelProps,
  FieldRootProps as BaseUIFieldProps,
} from '@base-ui-components/react/field'

import { Field as BaseUIField } from '@base-ui-components/react/field'

interface FieldProps {
  disabled?: BaseUIFieldProps['disabled']
  label: BaseUIFieldLabelProps['children']
}

function Field({ disabled = false, label }: FieldProps) {
  return (
    <BaseUIField.Root disabled={disabled}>
      <BaseUIField.Label>{label}</BaseUIField.Label>

      <div>
        <BaseUIField.Control />
      </div>
    </BaseUIField.Root>
  )
}

export type { FieldProps }

export default Field
