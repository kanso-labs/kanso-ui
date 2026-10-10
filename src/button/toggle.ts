import type { ButtonDOMProps } from '.'

type PressHandler = NonNullable<ButtonDOMProps['onPress']>

/**
 * A toggle's press: the call site's own `onPress` first, then the change of
 * state, which is the order React Aria's own toggle reports them in. Built by
 * a call rather than written inline at the prop, which is what react-perf's
 * no-new-function-as-prop is after.
 */
function pressThen(onPress: PressHandler | undefined, then: () => void) {
  return (...event: Parameters<PressHandler>) => {
    onPress?.(...event)
    then()
  }
}

export { pressThen }
