import type * as stylex from '@stylexjs/stylex'
import type { CSSProperties } from 'react'

// What `stylex.props()` hands back: a className, and a `style` object only
// when a dynamic style contributed one — Feed's cell minimum, for instance,
// arrives as a custom property there rather than as a class.
type CompiledStyles = ReturnType<typeof stylex.props>

// Base UI lets `className` and `style` be functions of a component's own
// render state, which is how a style can depend on something CSS cannot
// select — Chip's pressed state, a field label following its input's focus.
// A consumer may pass either form, so anything merging with one has to
// accept both.
type StatefulClassName<State> =
  | ((state: State) => string | undefined)
  | string
  | undefined

type StatefulStyle<State> =
  | ((state: State) => CSSProperties | undefined)
  | CSSProperties
  | undefined

function joinClassNames(...names: ReadonlyArray<string | undefined>) {
  // undefined rather than '' when there is nothing to say, so an element with
  // no classes on either side renders without a class attribute at all.
  return names.filter(Boolean).join(' ') || undefined
}

/**
 * {@link mergeStyles} for an element rendered by a behaviour-library
 * component, where `className` and `style` may each be a function of the
 * component's render state rather than a plain value.
 *
 * Returns functions unconditionally, since the libraries accept them
 * everywhere they accept the plain form and one shape is easier to follow
 * than a union that changes with the arguments. `compiled` is itself a
 * function where the component's own styles depend on that state.
 *
 * The two consumer functions carry their own state types rather than sharing
 * `State`: React Aria hands a `className` function the render state plus
 * `defaultClassName`, and a `style` function the same state plus
 * `defaultStyle`, and one parameter could not name both. Each extends
 * `State`, so `compiled` can be handed either.
 */
function mergeStatefulStyles<
  State,
  ClassNameState extends State,
  StyleState extends State,
>(
  compiled: ((state: State) => CompiledStyles) | CompiledStyles,
  consumer: {
    className?: StatefulClassName<ClassNameState>
    style?: StatefulStyle<StyleState>
  },
) {
  const compiledFor = (state: State) =>
    typeof compiled === 'function' ? compiled(state) : compiled

  // Resolved inline rather than through one shared helper: a generic one
  // cannot narrow `typeof value === 'function'` away from its own type
  // parameter, so it needs an assertion where these two need none.
  //
  // '' rather than undefined when there is nothing to say: a className
  // function has to return a string for React Aria, and every component that
  // reaches here has compiled classes of its own, so the case never renders.
  return {
    className: (state: ClassNameState) =>
      joinClassNames(
        compiledFor(state).className,
        typeof consumer.className === 'function'
          ? consumer.className(state)
          : consumer.className,
      ) ?? '',
    style: (state: StyleState) =>
      mergeStyleObjects(
        compiledFor(state).style,
        typeof consumer.style === 'function'
          ? consumer.style(state)
          : consumer.style,
      ),
  }
}

function mergeStyleObjects(
  compiled: CompiledStyles['style'],
  consumer: CSSProperties | undefined,
) {
  if (compiled === undefined && consumer === undefined) {
    return undefined
  }
  return { ...compiled, ...consumer }
}

/**
 * Combines the styles StyleX compiled for a component with the `className`
 * and `style` its call site passed, so both reach the element.
 *
 * Spreading `stylex.props()` after the consumer's own props is what this
 * replaces, and that spread silently dropped both: the returned object always
 * carries `className`, so it overwrote rather than merged, leaving no way to
 * position a component from outside it and no warning that the prop had gone.
 *
 * Order is presentational rather than load-bearing. StyleX compiles into
 * `@layer` (see `useCSSLayers` in tsdown.config.ts) and a consumer's own
 * stylesheet is unlayered, so the cascade already gives the call site the
 * last word whichever way round the two class strings are written.
 *
 * The call site's `style` is applied over the compiled one, which is the
 * order that matters: both are inline, so nothing but source order separates
 * them.
 */
function mergeStyles(
  compiled: CompiledStyles,
  consumer: {
    className?: string | undefined
    style?: CSSProperties | undefined
  },
) {
  return {
    ...compiled,
    className: joinClassNames(compiled.className, consumer.className),
    style: mergeStyleObjects(compiled.style, consumer.style),
  }
}

export { mergeStatefulStyles, mergeStyles }
