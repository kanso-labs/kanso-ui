import type { ButtonProps as BaseUIButtonProps } from '@base-ui-components/react/button'

import { Button as BaseUIButton } from '@base-ui-components/react/button'

type ButtonProps = Omit<BaseUIButtonProps, 'children'> & {
  label: BaseUIButtonProps['children']
}

function Button(props: ButtonProps) {
  return <BaseUIButton {...props} />
}

export type { ButtonProps }

export default Button
