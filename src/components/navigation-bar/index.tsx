'use client'

import type { RefAttributes } from 'react'

import * as stylex from '@stylexjs/stylex'
import { useLayoutEffect, useMemo, useState } from 'react'

import type { NavigationItemProps } from '../../navigation'
import type { RenderComponentProps } from '../../render/useRender'

import { NavigationItem } from '../../navigation'
import { NavigationContext } from '../../navigation/context'
import { mergeRefs } from '../../render/ref'
import { useRender } from '../../render/useRender'
import { mergeStyles } from '../../styles/merge'
import { colors, media, spacing } from '../../tokens/design.tokens.stylex'

// The navigation bar page's flexible bar: three to five destinations across
// the bottom of a compact window, on the surface container, 64dp tall. Below
// the medium breakpoint each destination is vertical and the destinations
// share the bar's width equally; at it and above, each is the page's
// horizontal pill, as wide as what it holds, and the group sits centred with
// the spare width at the bar's ends. The destinations are `src/navigation`'s,
// shared with NavigationRail, which holds the two forms' values.
//
// The 8dp between two horizontal pills is the library's own. The page puts
// each pill in an item of a fixed width it does not give, and with no space
// at all the pills met edge to edge.
//
// A horizontal destination is as wide as its icon, its label and 16dp either
// side, so five of them need far more than the 600dp the breakpoint starts
// at: five fifteen-letter labels come to about 780. Drawn anyway, every label
// was cut short the moment the window crossed the breakpoint, while one
// pixel narrower the vertical form showed them whole. So the bar measures
// what its horizontal labels lack, and keeps the vertical form until it is
// that much wider — see `useCramped`.
//
// A vertical destination's label stays on one line and is cut short with an
// ellipsis where the destination's share of the bar ends, and a label cut
// short shows its full text in the browser's tooltip on hover — see
// `src/navigation`. Five destinations give each label 69dp at a 375dp
// window and 66dp at 360dp, about ten characters of label medium, so five
// destinations' names have to be short.
//
// The 64dp is the destinations' row rather than the bar's height, and the
// bar grows past it: by padding the call site gives it, such as the inset a
// phone's home indicator asks for, and with its labels under a reader's
// wider text spacing. The bar adds no inset of its own, since only the call
// site knows whether the bar sits at the screen's edge.
//
// The bar is a `<nav>`, and a page usually has more than one navigation
// landmark, so name it with `aria-label`.

const styles = stylex.create({
  bar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    boxSizing: 'border-box',
    display: 'flex',
    gap: { default: 0, [media.medium]: spacing.sm },
    inlineSize: '100%',
    justifyContent: 'center',
    minBlockSize: '64px',
  },
  // The vertical form's spacing, at a width that would otherwise draw the
  // horizontal one.
  barCramped: {
    gap: 0,
  },
})

// The window size the bar draws its horizontal form at, which the styles read
// as `media.medium`. Spelled again for `matchMedia`, the one thing here that
// has to know it outside a stylesheet — see `useCramped`.
const HORIZONTAL = '(width >= 600px)'

type NavigationBarProps = RenderComponentProps<'nav'> & {
  /**
   * The route of the current destination, matched against each
   * destination's `href`. The match carries `aria-current="page"` and the
   * active indicator.
   */
  selectedRoute?: string
}

/**
 * The bar of three to five top-level destinations a compact window keeps at
 * its bottom edge. Each destination is a link, so it routes through React
 * Aria's `RouterProvider` when the app has one.
 *
 * ```tsx
 * <NavigationBar aria-label="Label" selectedRoute="/first">
 *   <NavigationBar.Item href="/first" icon={<FirstIcon />}>
 *     First item
 *   </NavigationBar.Item>
 *   <NavigationBar.Item href="/second" icon={<SecondIcon />}>
 *     Second item
 *   </NavigationBar.Item>
 *   <NavigationBar.Item href="/third" icon={<ThirdIcon />}>
 *     Third item
 *   </NavigationBar.Item>
 * </NavigationBar>
 * ```
 *
 * The call site's `className` and `style` land on the `<nav>`. A bar kept at
 * the bottom edge of a phone's screen clears its home indicator with padding,
 * which adds to the bar's height rather than squeezing the destinations:
 *
 * ```tsx
 * <NavigationBar
 *   aria-label="Label"
 *   style={{ paddingBlockEnd: 'env(safe-area-inset-bottom)' }}
 * >
 * ```
 */
function NavigationBar({
  render,
  selectedRoute,
  ...props
}: NavigationBarProps) {
  // The element, held as state rather than in a ref object, since the bar
  // measures it from an effect and has to run again when it changes.
  const [element, setElement] = useState<HTMLElement | null>(null)
  const isCramped = useCramped(element)
  // The call site's ref lands on the same element. Read off `props` rather
  // than destructured, as `useRender` reads it, so the compiler sees a prop
  // holding still rather than a ref read during render.
  const merged = useMemo(
    () => mergeRefs(setElement, props.ref ?? undefined),
    [props.ref],
  )
  const context = useMemo(
    () => ({
      form: isCramped ? ('barCramped' as const) : ('bar' as const),
      selectedRoute,
    }),
    [isCramped, selectedRoute],
  )
  const bar = useRender({
    defaultTagName: 'nav',
    props: {
      ...props,
      ...mergeStyles(
        stylex.props(styles.bar, isCramped && styles.barCramped),
        props,
      ),
      ref: merged,
    },
    render,
  })

  return <NavigationContext value={context}>{bar}</NavigationContext>
}

/**
 * One destination of a navigation bar — an icon, a label and, when it is the
 * current one, the active indicator. See `NavigationBar`.
 *
 * Defined here rather than re-exported from `src/navigation`: a re-export
 * let the build hand the package entry that module directly, past this
 * module's client directive, and a server component importing it got the
 * component itself rather than a reference to a client one.
 */
function NavigationBarItem(
  props: NavigationItemProps & RefAttributes<HTMLAnchorElement>,
) {
  return <NavigationItem {...props} />
}

/**
 * How much wider the bar would have to be for none of its labels to be cut
 * short: what each one lacks of its own width, summed. A label is the last
 * part of its destination.
 */
function shortfallOf(bar: HTMLElement) {
  let total = 0
  for (const destination of bar.children) {
    const label = destination.lastElementChild
    if (label instanceof HTMLElement) {
      total += Math.max(0, label.scrollWidth - label.clientWidth)
    }
  }
  return total
}

/**
 * Whether `bar`, at a width that draws its horizontal form, is too narrow
 * for it, so it draws the vertical one instead.
 *
 * The horizontal form is measured as it is drawn: where it cuts labels short,
 * the bar records the width it would need and switches, and it switches back
 * once it is that wide. A change to the destinations' text clears the record,
 * since what they need has changed with it. Measured in a layout effect, so
 * a bar that cannot fit is never painted cut short.
 */
function useCramped(bar: HTMLElement | null) {
  // The bar's width the horizontal form needs, while it is wider than the
  // bar; undefined while the horizontal form fits, or has not been measured.
  const [needed, setNeeded] = useState<number | undefined>(undefined)

  useLayoutEffect(() => {
    if (bar === null) {
      return undefined
    }

    const measure = () => {
      if (needed !== undefined) {
        if (bar.clientWidth >= needed) {
          setNeeded(undefined)
        }
        return
      }
      if (!window.matchMedia(HORIZONTAL).matches) {
        return
      }
      const shortfall = shortfallOf(bar)
      if (shortfall > 0) {
        // A pixel over, so a bar exactly as wide as the sum of fractional
        // widths does not flip back and forth.
        setNeeded(bar.clientWidth + shortfall + 1)
      }
    }
    const relabel = () => {
      setNeeded(undefined)
    }

    measure()
    const resize = new ResizeObserver(measure)
    resize.observe(bar)
    const text = new MutationObserver(relabel)
    text.observe(bar, { characterData: true, childList: true, subtree: true })

    return () => {
      resize.disconnect()
      text.disconnect()
    }
  }, [bar, needed])

  return needed !== undefined
}

NavigationBar.Item = NavigationBarItem

export type {
  NavigationItemProps as NavigationBarItemProps,
  NavigationBarProps,
}

export { NavigationBarItem }

export default NavigationBar
