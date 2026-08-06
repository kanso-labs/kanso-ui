import type { ButtonProps as BaseUIButtonProps } from '@base-ui/react/button'

import { Button as BaseUIButton } from '@base-ui/react/button'
import * as stylex from '@stylexjs/stylex'

import { useRipple } from '../../hooks/useRipple'
import {
  colors,
  motion,
  radii,
  stateLayerOpacity,
} from '../../tokens/design.tokens.stylex'

// Each variant composites an 'on-color' over its own container at the
// interaction state's opacity, rather than swapping in a separate hover
// color. calc(<opacity> * 100%) turns the token's unitless 0-1 ratio into the
// percentage color-mix() takes. Inlined at each property rather than factored
// into a helper: @stylexjs/babel-plugin only statically recognizes
// expressions written directly as property values.
//
// :hover and :active still match a disabled native <button>, and stylex's
// fixed pseudo-class ordering places both after :disabled, so without the
// :not(:disabled) guard a hovered disabled button would render with the
// interaction color instead of the disabled one.
//
// The corner softens from a circle to a rounded square while pressed, which
// is the shape morph the source design gives this control. The two
// transitioned properties take different curves — the colour change is
// linear-ish and the shape change is emphasized — so the timing functions are
// a matching comma list rather than one value.
const styles = stylex.create({
  base: {
    alignItems: 'center',
    borderRadius: {
      ':active:not(:disabled)': radii.md,
      default: radii.full,
    },
    borderWidth: 0,
    cursor: { ':disabled': 'not-allowed', default: 'pointer' },
    display: 'inline-flex',
    flexShrink: 0,
    justifyContent: 'center',
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
    padding: 0,
    position: 'relative',
    transitionDuration: `${motion.durationShort2}, ${motion.durationShort2}`,
    transitionProperty: 'background-color, border-radius',
    transitionTimingFunction: `${motion.easingStandard}, ${motion.easingEmphasized}`,
  },
  filled: {
    backgroundColor: {
      ':active:not(:disabled)': `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.pressed} * 100%), ${colors.primary})`,
      ':disabled': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
      ':hover:not(:disabled)': `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.hover} * 100%), ${colors.primary})`,
      default: colors.primary,
    },
    color: {
      ':disabled': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      default: colors.onPrimary,
    },
  },
  // Square, so one number sets both edges. The font size is the icon's size:
  // it scales a font-driven glyph, and an SVG drawn in `em` follows it, which
  // is what lets one icon serve all three buttons. An SVG given its own fixed
  // dimensions ignores it, which is the call site's choice to make.
  //
  // These are control metrics rather than type, so they are literals like the
  // heights beside them — the type scale has no 20px step, and taking its
  // nearest sizes instead produced an icon that barely grew while the button
  // went from 32px to 56px.
  lg: {
    blockSize: '56px',
    fontSize: '32px',
    inlineSize: '56px',
  },
  md: {
    blockSize: '40px',
    fontSize: '24px',
    inlineSize: '40px',
  },
  // Transparent, so it tints whatever it is sitting on rather than carrying a
  // container of its own — the same treatment ListItem's rows get.
  standard: {
    backgroundColor: {
      ':active:not(:disabled)': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      ':hover:not(:disabled)': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: 'transparent',
    },
    color: {
      ':disabled': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      default: colors.onSurfaceVariant,
    },
  },
  tonal: {
    backgroundColor: {
      ':active:not(:disabled)': `color-mix(in srgb, ${colors.onPrimaryContainer} calc(${stateLayerOpacity.pressed} * 100%), ${colors.primaryContainer})`,
      ':disabled': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
      ':hover:not(:disabled)': `color-mix(in srgb, ${colors.onPrimaryContainer} calc(${stateLayerOpacity.hover} * 100%), ${colors.primaryContainer})`,
      default: colors.primaryContainer,
    },
    color: {
      ':disabled': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      default: colors.onPrimaryContainer,
    },
  },
  xs: {
    blockSize: '32px',
    fontSize: '20px',
    inlineSize: '32px',
  },
})

type IconButtonProps = BaseUIButtonProps & {
  /**
   * What the button does, in words. Required rather than optional: an icon
   * on its own has no accessible name, so without this the control announces
   * nothing at all.
   */
  'aria-label': string
  /**
   * Disables the press ripple. The hover and pressed state layers are
   * unaffected.
   * @default false
   */
  disableRipple?: boolean
  /**
   * Control size: `xs` 32px, `md` 40px, `lg` 56px — the same heights `Button`
   * uses, so the two line up beside each other in a row.
   * @default 'md'
   */
  size?: 'lg' | 'md' | 'xs'
  /**
   * `standard` is transparent and tints what it sits on; `filled` and `tonal`
   * carry a container of their own.
   * @default 'standard'
   */
  variant?: 'filled' | 'standard' | 'tonal'
}

function IconButton({
  children,
  disabled = false,
  disableRipple = false,
  onClick,
  onContextMenu,
  onPointerCancel,
  onPointerDown,
  onPointerLeave,
  onPointerUp,
  size = 'md',
  variant = 'standard',
  ...props
}: IconButtonProps) {
  // `props` (className/style/render, etc.) is spread separately: `className`
  // and `style` there may be functions of render state, a Base UI extension
  // ripple's own handler-only merge doesn't need to know about.
  const ripple = useRipple<HTMLButtonElement>(!disableRipple, {
    onClick,
    onContextMenu,
    onPointerCancel,
    onPointerDown,
    onPointerLeave,
    onPointerUp,
  })

  return (
    <BaseUIButton
      disabled={disabled}
      {...ripple.handlers}
      {...props}
      {...stylex.props(styles.base, styles[variant], styles[size])}
    >
      {children}
      {ripple.surface}
    </BaseUIButton>
  )
}

export type { IconButtonProps }

export default IconButton
