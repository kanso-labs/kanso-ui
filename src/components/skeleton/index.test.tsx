import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { I18nProvider } from 'react-aria-components'
import { describe, expect, it } from 'vitest'

import Skeleton from '.'
import { reducedMotionOf } from '../../styles/stylesheet.testing'
import { colors } from '../../tokens/design.tokens.stylex'

// The role every shape is drawn in, read off a probe drawn in it.
const roleStyles = stylex.create({
  surfaceContainerHighest: {
    backgroundColor: colors.surfaceContainerHighest,
  },
})

function boxOf(element: Element) {
  return element.getBoundingClientRect()
}

function surfaceContainerHighest() {
  const probe = document.createElement('span')
  probe.className =
    stylex.props(roleStyles.surfaceContainerHighest).className ?? ''
  document.body.append(probe)
  const colour = getComputedStyle(probe).backgroundColor
  probe.remove()
  return colour
}

// Hoisted so each is one stable element per render, which is what
// react-perf's no-jsx-as-prop is after.
const CIRCLE = <Skeleton.Circle data-testid="circle" />
const FIGURE = <Skeleton.Bar data-testid="figure" size="md" width="48px" />

/** The element everything inside fades on. */
function fadingIn(skeleton: HTMLElement) {
  const fading = skeleton.firstElementChild
  if (!(fading instanceof HTMLElement)) {
    throw new Error('expected the skeleton to hold its shapes in one element')
  }
  return fading
}

function Rows() {
  return (
    <Skeleton data-testid="skeleton">
      <Skeleton.Row data-testid="one">
        <Skeleton.Bar data-testid="title" size="md" width="60%" />
      </Skeleton.Row>
      <Skeleton.Row
        data-testid="two"
        leading={CIRCLE}
        lines={2}
        trailing={FIGURE}
      >
        <Skeleton.Bar data-testid="eyebrow" width="40%" />
        <Skeleton.Bar data-testid="headline" size="lg" width="120px" />
      </Skeleton.Row>
    </Skeleton>
  )
}

describe('skeleton', () => {
  describe('for a screen reader', () => {
    it('is one busy progress bar named "Loading", its shapes hidden', () => {
      const view = render(<Rows />)
      const skeleton = view.getByRole('progressbar', { name: 'Loading' })

      expect(skeleton).toHaveAttribute('aria-busy', 'true')
      expect(view.getAllByRole('progressbar')).toHaveLength(1)
      expect(fadingIn(skeleton)).toHaveAttribute('aria-hidden', 'true')
    })

    it('says loading in the locale around it', () => {
      const view = render(
        <I18nProvider locale="de-DE">
          <Skeleton />
        </I18nProvider>,
      )

      expect(view.getByRole('progressbar')).not.toHaveAccessibleName('Loading')
    })

    it('takes the name a call site gives it', () => {
      const view = render(<Skeleton aria-label="Label" />)

      expect(
        view.getByRole('progressbar', { name: 'Label' }),
      ).toBeInTheDocument()
    })
  })

  describe('rows', () => {
    it("draws the lists page's 56px and 72px rows", () => {
      const view = render(<Rows />)

      expect(boxOf(view.getByTestId('one')).height).toBe(56)
      expect(boxOf(view.getByTestId('two')).height).toBe(72)
    })

    it('draws a 40px circle 16px in, and the lines 16px after it', () => {
      const view = render(<Rows />)
      const row = boxOf(view.getByTestId('two'))
      const circle = boxOf(view.getByTestId('circle'))
      const eyebrow = boxOf(view.getByTestId('eyebrow'))

      expect([circle.width, circle.height]).toEqual([40, 40])
      expect(circle.left - row.left).toBe(16)
      expect(eyebrow.left - circle.right).toBe(16)
      expect(boxOf(view.getByTestId('figure')).right).toBe(row.right - 16)
    })
  })

  describe('bars', () => {
    it('stands 12, 14 and 28px tall for an eyebrow, a title and a headline', () => {
      const view = render(<Rows />)

      expect(boxOf(view.getByTestId('eyebrow')).height).toBe(12)
      expect(boxOf(view.getByTestId('title')).height).toBe(14)
      expect(boxOf(view.getByTestId('headline')).height).toBe(28)
    })

    it('takes the width the call site gives', () => {
      const view = render(<Rows />)

      expect(boxOf(view.getByTestId('headline')).width).toBe(120)
      expect(boxOf(view.getByTestId('figure')).width).toBe(48)
    })

    it('draws every shape in surface container highest, bars at a 4px corner', () => {
      const view = render(<Rows />)
      const bar = getComputedStyle(view.getByTestId('title'))
      const circle = getComputedStyle(view.getByTestId('circle'))

      expect(bar.backgroundColor).toBe(surfaceContainerHighest())
      expect(circle.backgroundColor).toBe(surfaceContainerHighest())
      expect(bar.borderTopLeftRadius).toBe('4px')
      expect(circle.borderTopLeftRadius).not.toBe('4px')
    })
  })

  describe('the fade', () => {
    it('fades everything inside together, 1.5s down to 60% and back', () => {
      const view = render(<Rows />)
      const style = getComputedStyle(fadingIn(view.getByTestId('skeleton')))

      expect(style.animationDuration).toBe('1.5s')
      expect(style.animationDirection).toBe('alternate')
      expect(style.animationIterationCount).toBe('infinite')
      expect(style.animationTimingFunction).toBe('ease-in-out')
      expect(style.animationName).not.toBe('none')
      const [keyframes] = fadingIn(view.getByTestId('skeleton'))
        .getAnimations()
        .map((animation) =>
          animation.effect instanceof KeyframeEffect
            ? animation.effect.getKeyframes().map((frame) => frame.opacity)
            : [],
        )
      expect(keyframes).toEqual(['1', '0.6'])
    })

    // Read out of the stylesheet rather than by emulating the media query —
    // see AGENTS.md's "Media queries a test cannot set".
    it('stops under reduced motion', () => {
      const view = render(<Rows />)

      const { reduced, resting } = reducedMotionOf(
        fadingIn(view.getByTestId('skeleton')),
        'animation-name',
      )

      expect(resting).not.toBe('none')
      expect(reduced).toBe('none')
    })
  })
})
