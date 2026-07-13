import type { Icon as PhosphorIcon } from '@phosphor-icons/react'

import * as stylex from '@stylexjs/stylex'

const styles = stylex.create({
  base: {
    flexShrink: 0,
    verticalAlign: 'middle',
  },
})

const sizes = {
  lg: 24,
  md: 20,
  sm: 16,
}

interface IconProps {
  icon: PhosphorIcon
  label?: string
  size?: keyof typeof sizes
  weight?: 'bold' | 'duotone' | 'fill' | 'light' | 'regular' | 'thin'
}

function Icon({ icon: IconComponent, label, size = 'md', weight }: IconProps) {
  return (
    <IconComponent
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      size={sizes[size]}
      weight={weight}
      {...stylex.props(styles.base)}
    />
  )
}

export type { IconProps }

export default Icon
