import type { IconWeight, Icon as PhosphorIcon } from '@phosphor-icons/react'

// M3-sourced (§3.3 filter-chip/input-chip `with-icon-icon-size` and list/
// text-field/icon-button `icon-size`): sm=18 for chip/dense contexts,
// md=24 everywhere else.
const SIZE_PX = {
  md: 24,
  sm: 18,
} as const

type IconProps = {
  /** A Phosphor icon component, e.g. `Plus` from '@phosphor-icons/react'. */
  icon: PhosphorIcon
  /**
   * Accessible label. When present the icon is announced (role="img");
   * when absent it is decorative (aria-hidden).
   */
  label?: string
  /**
   * Visual size, both M3-sourced: sm=18 (chip/dense contexts), md=24 (the
   * default — list items, text fields, and icon buttons all use 24 per M3).
   * @default 'md'
   */
  size?: 'md' | 'sm'
  /** Phosphor weight. @default 'regular' */
  weight?: IconWeight
}

function Icon({
  icon: IconComponent,
  label,
  size = 'md',
  weight = 'regular',
}: IconProps) {
  return (
    <IconComponent
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      size={SIZE_PX[size]}
      weight={weight}
    />
  )
}

export type { IconProps }

export default Icon
