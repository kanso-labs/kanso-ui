import type { DOMAttributes, ReactNode, RefAttributes } from 'react'
import type {
  ButtonRenderProps,
  ClassNameOrFunction,
  ButtonProps as RACButtonProps,
  ToggleButtonProps as RACToggleButtonProps,
  StyleOrFunction,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  Button as RACButton,
  Link as RACLink,
  ToggleButton as RACToggleButton,
} from 'react-aria-components'

import ProgressIndicator from '../components/progress-indicator'
import { useMessages } from '../i18n'
import {
  buttonRenderer,
  linkRenderer,
  toggleButtonRenderer,
} from '../render/aria'
import { mergeStatefulStyles } from '../styles/merge'
import { useButtonBase } from './hooks'
import { buttonBaseStyles } from './styles'

// The press-button core Button and IconButton both render through. A button
// is React Aria's `Button`, its `Link` once given `href`, or its
// `ToggleButton` once it reports a state, and around each this adds what
// React Aria leaves out: the ripple, the disabled state a parent's context
// sets, the `aria-*` props and keyboard handlers it would drop or wrap, and
// the ring drawn over the label while the button is pending. Each component
// brings its own classes, as a function of the render state, and the call
// site's `className` and `style` are merged over them.
//
// One module rather than a copy in each, since the copies had already drifted
// once: IconButton read `ButtonContext` for a parent's disabled state and
// Button did not. Not a component of the library's own and not exported from
// the package; see `src/row` for the same arrangement around a list's row.

type ButtonBaseProps = {
  children?: ReactNode
  /**
   * The component's own classes, from the render state. The call site's
   * `className` and `style` are merged over them.
   */
  classes: (state: ButtonState) => ReturnType<typeof stylex.props>
  className?: ClassNameOrFunction<ButtonState>
  disableRipple?: boolean
  href?: string
  pendingLabel?: string
  rel?: string
  style?: StyleOrFunction<ButtonState>
  target?: string
} & ButtonDOMProps &
  RefAttributes<HTMLAnchorElement | HTMLButtonElement>

// The props a button hands React Aria. React Aria types the global DOM events
// — pointer, mouse, touch, wheel and the rest — against the element each
// component renders, and a handler written for a <button> does not type-check
// against an <a>. The keys are retyped against HTMLElement here so one set of
// props serves both forms; the events React Aria defines itself (press,
// focus, keyboard) keep its types, since it hands those its own event objects.
type ButtonDOMProps = Omit<
  RACButtonProps,
  'children' | 'className' | 'style' | GlobalEventKey
> &
  Pick<DOMAttributes<HTMLElement>, GlobalEventKey>

// The render state React Aria's three elements share. A className or style
// function written against it serves the button, the link and the toggle
// alike; `isPending` belongs to the button alone, and `isCurrent` to the
// link, so neither is here. What the button draws while pending is decided
// in `buttonContent`, which sees React Aria's own state rather than this one.
//
// `isSelected` is optional because only the toggle has one: React Aria hands
// the button and the link a state without it and the toggle a state with
// it, and a parameter type this wide accepts either.
type ButtonState = Pick<
  ButtonRenderProps,
  'isDisabled' | 'isFocused' | 'isFocusVisible' | 'isHovered' | 'isPressed'
> & { isSelected?: boolean }

type GlobalEventKey = Exclude<
  keyof DOMAttributes<HTMLElement> & keyof RACButtonProps,
  'onBlur' | 'onClick' | 'onFocus'
>

type ToggleButtonBaseProps = {
  children?: ReactNode
  /** As for ButtonBase, handed `isSelected` as well. */
  classes: (state: ButtonState) => ReturnType<typeof stylex.props>
  className?: ClassNameOrFunction<ButtonState>
  defaultSelected?: boolean
  disableRipple?: boolean
  isSelected?: boolean
  onChange?: (isSelected: boolean) => void
  style?: StyleOrFunction<ButtonState>
} & ButtonDOMProps &
  RefAttributes<HTMLAnchorElement | HTMLButtonElement>

/**
 * A button drawn with the classes a component hands it: React Aria's
 * `Button`, or its `Link` given `href`. See the header.
 */
function ButtonBase({
  children,
  classes,
  href,
  isPending = false,
  pendingLabel,
  rel,
  render,
  target,
  ...input
}: ButtonBaseProps) {
  const messages = useMessages()
  const { disabled, element, props, ref, ripple } = useButtonBase(
    input,
    isPending,
  )
  const styleProps = mergeStatefulStyles(classes, props)

  if (href !== undefined) {
    return (
      <RACLink
        href={href}
        isDisabled={disabled}
        ref={ref}
        rel={rel}
        render={linkRenderer(element)}
        target={target}
        {...ripple.handlers}
        {...props}
        {...styleProps}
      >
        {children}
        {ripple.surface}
      </RACLink>
    )
  }

  return (
    <RACButton
      isDisabled={disabled}
      isPending={isPending}
      ref={ref}
      render={buttonRenderer(element, render)}
      {...ripple.handlers}
      {...props}
      {...styleProps}
    >
      {buttonContent(
        children,
        pendingLabel ?? messages.loading,
        ripple.surface,
      )}
    </RACButton>
  )
}

// What the button draws: its label, hidden while the button is pending, with
// the ring over it. The ring takes the button's own content colour rather
// than the progress page's primary, which on a filled button is the fill
// itself and so invisible. The label stays in the flow so the button keeps its
// width, which is what stops a form jumping the moment it is submitted.
// React Aria wants the progress bar in the accessibility tree as soon as the
// button goes pending, so it is rendered from the render state rather than
// after a delay.
//
// Built by a call rather than written inline at the prop, which is what
// react-perf's no-new-function-as-prop is after; the React Compiler
// memoises the result on its inputs.
function buttonContent(
  children: ReactNode,
  pendingLabel: string,
  surface: ReactNode,
) {
  return (state: ButtonRenderProps) => (
    <>
      <span
        {...stylex.props(
          buttonBaseStyles.label,
          state.isPending && buttonBaseStyles.labelPending,
        )}
      >
        {children}
      </span>
      {state.isPending ? (
        <span {...stylex.props(buttonBaseStyles.pending)}>
          <ProgressIndicator
            aria-label={pendingLabel}
            isIndeterminate
            size="1em"
            tone="inherit"
            variant="circular"
          />
        </span>
      ) : null}
      {surface}
    </>
  )
}

/**
 * A toggle drawn with the classes a component hands it: React Aria's
 * `ToggleButton`, which reports its state through `aria-pressed`. It is never
 * a link and never pending — React Aria's toggle takes neither, and neither
 * means anything for a control whose whole job is to report which of two
 * states it is in — so `isPending` reaches it only to keep the ripple off,
 * as it does for the plain button.
 */
function ToggleButtonBase({
  children,
  classes,
  defaultSelected,
  isPending = false,
  isSelected,
  onChange,
  render,
  ...input
}: ToggleButtonBaseProps) {
  const { disabled, element, props, ref, ripple } = useButtonBase(
    input,
    isPending,
  )

  return (
    <RACToggleButton
      defaultSelected={defaultSelected}
      isDisabled={disabled}
      isSelected={isSelected}
      onChange={onChange}
      ref={ref}
      render={toggleButtonRenderer(element, toggleRender(render))}
      {...ripple.handlers}
      {...props}
      {...mergeStatefulStyles(classes, props)}
    >
      {toggleContent(children, ripple.surface)}
    </RACToggleButton>
  )
}

// What a toggle draws: its label and the ripple. No pending ring — see
// ToggleButtonBase. Built by a call for the reason `buttonContent` is.
function toggleContent(children: ReactNode, surface: ReactNode) {
  return () => (
    <>
      {children}
      {surface}
    </>
  )
}

// A call site's `render` is written for React Aria's button, whose render
// state says whether it is pending; a toggle's says nothing of it, and a
// toggle never is. So the toggle hands that function its own state with
// `isPending` filled in, which is what lets one `render` prop serve a button
// whichever element it turns out to be.
function toggleRender(
  render: RACButtonProps['render'],
): RACToggleButtonProps['render'] {
  if (render === undefined) {
    return undefined
  }
  return (props, state) => render(props, { ...state, isPending: false })
}

export type { ButtonDOMProps, ButtonState }

export { ButtonBase, ToggleButtonBase }
