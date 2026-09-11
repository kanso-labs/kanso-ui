import type { ReactNode } from 'react'
import type {
  ButtonRenderProps,
  ColorPickerProps as RACColorPickerProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  Button as RACButton,
  ColorPicker as RACColorPicker,
  Dialog as RACDialog,
  DialogTrigger as RACDialogTrigger,
  Popover as RACPopover,
} from 'react-aria-components'

import { mergeStatefulStyles } from '../../styles/merge'
import { overlay } from '../../styles/overlay'
import { picker } from '../../styles/picker'
import {
  colors,
  radii,
  spacing,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'
import ColorArea from '../color-area'
import ColorField from '../color-field'
import ColorSlider from '../color-slider'
import ColorSwatch from '../color-swatch'

// Everything in this phase, in one control: a swatch and a label as the
// trigger, and a plane, a hue slider, an alpha slider and a text field on
// the surface it opens. React Aria's `ColorPicker` renders nothing of its
// own — it is the state the five share — so what is here is the trigger,
// the overlay and the arrangement inside it.
//
// The design carries no page for a colour picker. What it does carry is the
// text fields page, which the field inside this one already draws through,
// and the overlay surface every popover here shares. Three choices are the
// library's own.
//
// **The trigger is a swatch beside a name, not a swatch alone.** A swatch
// on its own is a coloured square with no affordance — nothing says it can
// be pressed, and a screen reader is told a colour rather than an action.
// The label is what makes it a button.
//
// **Hue is a slider rather than a wheel here.** A wheel and the plane want
// the same space and would make the surface square and large; the strip
// sits under the plane at the width it already has. `ColorWheel` is for a
// picker that wants to be round, which is a different shape rather than a
// different control.
//
// **It is docked above the medium breakpoint and modal below it**, which is
// the same swap `DatePicker` and `Sheet` make — the shared one in
// `src/styles/picker.ts` rather than a third copy. A 280dp surface anchored
// to a trigger is unreachable at 375px.
//
// One thing the picker has to do that its parts do not. **The plane and the
// hue strip are pinned to HSL.** A channel has to belong to the value's own
// space or React Aria throws, and a hex parses as RGB, which has no
// saturation — so `<ColorPicker defaultValue="#6750A4" />`, the call anyone
// writes first, would throw outright. Converting here is what makes the
// picker take any notation, and it costs the caller nothing: the value
// handed back is still in whatever they passed.

const styles = stylex.create({
  // What the overlay holds, stacked: the plane, the two strips, then the
  // field. One column, so a picker reads top to bottom.
  body: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    inlineSize: '280px',
    maxInlineSize: '100%',
    padding: spacing.lg,
  },
  // The swatch in the trigger, at the size a label's line is tall rather
  // than the 40dp a swatch takes on its own.
  triggerSwatch: {
    blockSize: '24px',
    flexShrink: 0,
    inlineSize: '24px',
  },
})

const triggerStyles = stylex.create({
  base: {
    alignItems: 'center',
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), ${colors.surfaceContainerLow})`,
      ':hover': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), ${colors.surfaceContainerLow})`,
      default: colors.surfaceContainerLow,
    },
    borderRadius: radii.full,
    borderWidth: 0,
    boxSizing: 'border-box',
    color: colors.onSurface,
    cursor: 'pointer',
    display: 'inline-flex',
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    gap: spacing.sm,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
    paddingBlock: spacing.sm,
    paddingInline: spacing.md,
  },
  disabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), transparent)`,
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
    cursor: 'not-allowed',
  },
})

type ColorPickerProps = Omit<RACColorPickerProps, 'children'> & {
  /** Whether the alpha strip is drawn under the hue one. @default false */
  alpha?: boolean
  /** Replaces everything on the surface, for a picker that arranges its own parts. */
  children?: ReactNode
  /** Lands on the trigger, which is the element a layout positions. */
  className?: string
  /** Whether the surface starts open. Uncontrolled; pair `isOpen` with `onOpenChange` instead. */
  defaultOpen?: boolean
  /** Whether the whole picker is inert. @default false */
  isDisabled?: boolean
  /** Whether the surface is open. Controlled; needs `onOpenChange`. */
  isOpen?: boolean
  /** What the trigger says beside its swatch. Always rendered; it is the button's name. */
  label: string
  /** Called when the surface opens or closes. */
  onOpenChange?: (isOpen: boolean) => void
  /** Lands on the trigger, as `className` does. */
  style?: React.CSSProperties
}

/**
 * A colour picked from a plane, a hue strip and a text field, behind a
 * trigger showing the colour. The value is React Aria's: pass `value` with
 * `onChange` to control it, or `defaultValue`, as a CSS colour string or a
 * `Color` from `parseColor`, which this package re-exports.
 *
 * ```tsx
 * <ColorPicker defaultValue="#6750A4" label="Label" />
 * ```
 *
 * `alpha` adds the transparency strip. Above the medium breakpoint the
 * surface is docked to the trigger; below it, it opens centred, the same
 * swap `DatePicker` makes. `defaultOpen`, `isOpen` and `onOpenChange` reach
 * the overlay, since the picker itself carries no open state — React Aria
 * keeps that on the dialog trigger this renders inside.
 *
 * Every part inside is this package's own — `ColorArea`, `ColorSlider`,
 * `ColorField` and `ColorSwatch` — and they share the picker's value
 * through React Aria's context rather than props. Passing `children`
 * replaces all of them, for a picker that wants a different arrangement.
 *
 * The call site's `className` and `style` land on the trigger, which is the
 * element a layout positions.
 */
function ColorPicker({
  alpha = false,
  children,
  className,
  defaultOpen,
  isDisabled = false,
  isOpen,
  label,
  onOpenChange,
  style,
  ...props
}: ColorPickerProps) {
  return (
    <RACColorPicker {...props}>
      <RACDialogTrigger
        defaultOpen={defaultOpen}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <RACButton
          isDisabled={isDisabled}
          {...mergeStatefulStyles(
            // A function of the state rather than a fixed class, since the
            // trigger is the element a layout positions and the call site's
            // own class has to merge into it — a plain `className` would
            // overwrite one or the other.
            (state: ButtonRenderProps) =>
              stylex.props(
                triggerStyles.base,
                state.isDisabled && triggerStyles.disabled,
              ),
            { className, style },
          )}
        >
          <ColorSwatch {...stylex.props(styles.triggerSwatch)} />
          {label}
        </RACButton>
        <RACPopover {...stylex.props(overlay.popup, picker.popover)}>
          <RACDialog {...stylex.props(overlay.popupDialog)}>
            {children ?? (
              <div {...stylex.props(styles.body)}>
                <ColorArea
                  aria-label={label}
                  colorSpace="hsl"
                  xChannel="saturation"
                  yChannel="lightness"
                />
                <ColorSlider channel="hue" colorSpace="hsl" label="Hue" />
                {alpha ? <ColorSlider channel="alpha" label="Alpha" /> : null}
                <ColorField label={label} />
              </div>
            )}
          </RACDialog>
        </RACPopover>
      </RACDialogTrigger>
    </RACColorPicker>
  )
}

export type { ColorPickerProps }

export default ColorPicker
