import './styles.css'

export interface ChipProps {
  /** What background color to use */
  backgroundColor?: string
  /** Chip contents */
  label: string
  /** Is this the principal call to action on the page? */
  primary?: boolean
  /** How large should the chip be? */
  size?: 'large' | 'medium' | 'small'
}

/** Primary UI component for user interaction */
const Chip = ({
  backgroundColor,
  label,
  primary = false,
  size = 'medium',
  ...props
}: ChipProps) => {
  const mode = primary ? 'storybook-chip--primary' : 'storybook-chip--secondary'

  return (
    <div
      className={['storybook-chip', `storybook-chip--${size}`, mode].join(' ')}
      style={{ backgroundColor }}
      {...props}
    >
      {label}
    </div>
  )
}

export default Chip
