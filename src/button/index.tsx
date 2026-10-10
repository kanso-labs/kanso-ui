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
import { useToggleGroupDisabled } from '../hooks/useToggleGroupDisabled'
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
// `ToggleButton` inside a selecting group, and around each this adds what
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
  /**
   * A toggle's state, for a button that reports one through `aria-pressed`.
   * Left undefined, the button reports none. Handed to every function of the
   * render state, so the classes can draw it.
   */
  isSelected?: boolean
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

/**
 * The three forms a button takes, of which a call site writes exactly one:
 * a plain button, a link, or a toggle. Each names the props of the other two
 * as `never`, so a combination the rendered form would ignore — a toggle
 * given `href`, a link given `isPending` — is a compile error rather than a
 * prop that silently does nothing.
 */
type ButtonForm = ButtonLinkForm | ButtonPressForm | ButtonToggleForm

type ButtonLinkForm = {
  defaultSelected?: never
  /**
   * Where the button leads. Given one, the button is rendered as a link —
   * an `<a>`, announced as the link it is — with the same styles and ripple.
   * A link is never a toggle and never pending, and `render`, `type` and the
   * form props apply to the other two forms only.
   */
  href: string
  isPending?: never
  isSelected?: never
  onChange?: never
  pendingLabel?: never
  /** The link's `rel`. */
  rel?: string
  /** The link's `target`. */
  target?: string
}

type ButtonPressForm = {
  defaultSelected?: never
  href?: never
  isSelected?: never
  onChange?: never
  rel?: never
  target?: never
}

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

type ButtonToggleForm = {
  /**
   * Whether a toggle starts selected, when it keeps its own state. Passing
   * this, `isSelected` or `onChange` is what makes the button a toggle.
   */
  defaultSelected?: boolean
  href?: never
  /**
   * Whether a toggle is selected, when the call site holds the state. Pass
   * it with `onChange`; passing this, `defaultSelected` or `onChange` is what
   * makes the button a toggle. A value still loading may be `undefined` for a
   * while: the button stays the same element when it arrives.
   */
  isSelected?: boolean
  /**
   * Called with the new state when a toggle is pressed. Passing this,
   * `isSelected` or `defaultSelected` is what makes the button a toggle.
   */
  onChange?: (isSelected: boolean) => void
  rel?: never
  target?: never
}

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
  isSelected,
  pendingLabel,
  rel,
  render,
  target,
  ...input
}: ButtonBaseProps) {
  const messages = useMessages()
  const base = useButtonBase(input, isPending)
  const { disabled, props, ref, ripple } = base
  const merged = mergeStatefulStyles(classes, props)

  // A toggle is still React Aria's `Button`, which knows nothing of a
  // selected state, so the state goes onto the element as `aria-pressed` and
  // into every function of the render state from here. Being the same
  // component as the plain button is what keeps a button the same element
  // when it becomes a toggle — `isSelected` arriving once its data loads.
  const element =
    isSelected === undefined
      ? base.element
      : {
          ...base.element,
          aria: { ...base.element.aria, 'aria-pressed': isSelected },
        }
  const styleProps =
    isSelected === undefined
      ? merged
      : {
          className: (state: Parameters<typeof merged.className>[0]) =>
            merged.className({ ...state, isSelected }),
          style: (state: Parameters<typeof merged.style>[0]) =>
            merged.style({ ...state, isSelected }),
        }

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
      render={buttonRenderer(element, selectedRender(render, isSelected))}
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
            diameter="1em"
            isIndeterminate
            tone="inherit"
            variant="circular"
          />
        </span>
      ) : null}
      {surface}
    </>
  )
}

// A toggle drawn through ButtonBase hands a call site's `render` the state of
// React Aria's plain button, which has no `isSelected`; this fills it in.
function selectedRender(
  render: RACButtonProps['render'],
  isSelected: boolean | undefined,
): RACButtonProps['render'] {
  if (render === undefined || isSelected === undefined) {
    return render
  }
  // Through a binding rather than as a literal at the call: React Aria types
  // the state as its plain button's, and a call site's `render` is written
  // against ButtonState, which is that plus `isSelected`.
  return (props, state) => {
    const selected = { ...state, isSelected }
    return render(props, selected)
  }
}

/**
 * A toggle in a selecting group, drawn with the classes a component hands
 * it: React Aria's `ToggleButton`, which is what takes part in the group's
 * selection and reports its state through `aria-pressed`. A toggle on its
 * own is ButtonBase given `isSelected` instead — see there. React Aria's
 * toggle takes no pending state, so `isPending` reaches it only to keep the
 * ripple off.
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
  // A selecting ButtonGroup disables its toggles through React Aria's group
  // state, which no prop here carries, so the ripple would stay on in a
  // disabled group and answer a press with an animation. Handed on as the
  // toggle's own `isDisabled`, which is what React Aria makes of it anyway.
  const disabledByGroup = useToggleGroupDisabled(input.id)
  const { disabled, element, props, ref, ripple } = useButtonBase(
    disabledByGroup ? { ...input, isDisabled: true } : input,
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

export type {
  ButtonDOMProps,
  ButtonForm,
  ButtonLinkForm,
  ButtonPressForm,
  ButtonState,
  ButtonToggleForm,
}

export { ButtonBase, ToggleButtonBase }
