import type { ButtonProps as BaseUIButtonProps } from '@base-ui-components/react/button'

import { Button as BaseUIButton } from '@base-ui-components/react/button'
import * as stylex from '@stylexjs/stylex'

const styles = stylex.create({
  base: {
    borderRadius: '3em',
    borderWidth: 0,
    cursor: 'pointer',
    display: 'inline-block',
    fontFamily: "'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: '14px',
    fontWeight: 700,
    lineHeight: 1,
    padding: '11px 20px',
  },
})

type ButtonProps = Omit<BaseUIButtonProps, 'children'> & {
  label: BaseUIButtonProps['children']
}

function Button({ label, ...props }: ButtonProps) {
  return (
    <BaseUIButton {...props} {...stylex.props(styles.base)}>
      {label}
    </BaseUIButton>
  )
}

export type { ButtonProps }

export default Button
