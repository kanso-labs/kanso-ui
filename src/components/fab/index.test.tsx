import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Fab from '.'
import { declarationsHeld } from '../../styles/stylesheet.testing'
import {
  colors,
  radii,
  shadows,
  typography,
} from '../../tokens/design.tokens.stylex'

const FORCED_COLORS = 'forced-colors: active'

// Each pair compared by what it resolves to, so a test pins the role rather
// than the colour it happens to be today.
const probeStyles = stylex.create({
  extraLarge: { borderRadius: radii.xl },
  filledPrimary: { backgroundColor: colors.primary, color: colors.onPrimary },
  filledTertiary: {
    backgroundColor: colors.tertiary,
    color: colors.onTertiary,
  },
  headlineSmall: { fontSize: typography.headlineSmallSize },
  large: { borderRadius: radii.lg },
  liftFour: { boxShadow: shadows.elevation4 },
  liftThree: { boxShadow: shadows.elevation3 },
  // A container narrower than the long label below, as a phone's column is.
  narrow: { inlineSize: '200px' },
  primaryContainer: {
    backgroundColor: colors.primaryContainer,
    color: colors.onPrimaryContainer,
  },
  secondaryContainer: {
    backgroundColor: colors.secondaryContainer,
    color: colors.onSecondaryContainer,
  },
  tertiaryContainer: {
    backgroundColor: colors.tertiaryContainer,
    color: colors.onTertiaryContainer,
  },
  titleLarge: { fontSize: typography.titleLargeSize },
  titleMedium: { fontSize: typography.titleMediumSize },
})

// An icon as the README asks for one: `1em` square in `currentColor`, hidden
// from assistive technology. Hoisted, since react-perf rejects an element
// built at the prop.
const ICON = (
  <svg
    aria-hidden="true"
    data-testid="icon"
    fill="currentColor"
    height="1em"
    viewBox="0 0 24 24"
    width="1em"
  />
)

// Focus as a keyboard brings it, which is what React Aria reports as
// focus-visible and what the focus layer is drawn from.
function focusByKeyboard(element: HTMLElement) {
  fireEvent.keyDown(document.body, { key: 'Tab' })
  act(() => {
    element.focus()
  })
}

// The boxes of the lines a label's text is laid out on, one per line: a
// flex item reports a single box of its own however many lines it holds.
function lineBoxes(element: HTMLElement) {
  const range = document.createRange()
  range.selectNodeContents(element)
  return range.getClientRects()
}

// What a probe style resolves to in the page, with the probe torn down again.
function resolved(style: stylex.StyleXStyles) {
  const view = render(<div data-testid="probe" {...stylex.props(style)} />)
  const computed = getComputedStyle(view.getByTestId('probe'))
  const values = {
    background: computed.backgroundColor,
    color: computed.color,
    fontSize: computed.fontSize,
    radius: computed.borderTopLeftRadius,
    shadow: computed.boxShadow,
  }
  view.unmount()
  return values
}

// The label's text alone, measured from its glyphs: the button holds the
// icon and the ripple's surface beside it.
function textBox(element: HTMLElement) {
  const text = [...element.childNodes].find(
    (node) => node.nodeType === Node.TEXT_NODE,
  )
  if (text === undefined) {
    throw new Error('expected the label to hold its text directly')
  }
  const range = document.createRange()
  range.selectNode(text)
  return range.getBoundingClientRect()
}

describe('FAB', () => {
  describe('structure', () => {
    it('is a button named by its aria-label', () => {
      const view = render(<Fab aria-label="Label">{ICON}</Fab>)
      expect(view.getByRole('button', { name: 'Label' }).tagName).toBe('BUTTON')
    })

    it('takes its name from the label in the extended form', () => {
      const view = render(<Fab label="Label">{ICON}</Fab>)
      expect(view.getByRole('button', { name: 'Label' })).toBeDefined()
    })

    it('renders an anchor when given href', () => {
      const view = render(
        <Fab aria-label="Label" href="#first">
          {ICON}
        </Fab>,
      )
      const link = view.getByRole('link', { name: 'Label' })
      expect(link.tagName).toBe('A')
      expect(link).toHaveAttribute('href', '#first')
    })

    it('answers a press from the keyboard', () => {
      const onPress = vi.fn<() => void>()
      const view = render(
        <Fab aria-label="Label" onPress={onPress}>
          {ICON}
        </Fab>,
      )
      const button = view.getByRole('button')

      fireEvent.keyDown(button, { key: 'Enter' })
      fireEvent.keyUp(button, { key: 'Enter' })

      expect(onPress).toHaveBeenCalledTimes(1)
    })
  })

  // The pages' FAB, medium FAB and large FAB.
  describe('sizes', () => {
    it.each([
      ['md', 56, 24, probeStyles.large],
      ['lg', 80, 28, undefined],
      ['xl', 96, 36, probeStyles.extraLarge],
    ] as const)(
      'draws the %s FAB %ipx square with a %ipx icon',
      (size, edge, icon, corner) => {
        const view = render(
          <Fab aria-label="Label" size={size}>
            {ICON}
          </Fab>,
        )
        const button = view.getByRole('button')
        const box = button.getBoundingClientRect()
        const glyph = view.getByTestId('icon').getBoundingClientRect()

        expect([box.width, box.height]).toEqual([edge, edge])
        expect([glyph.width, glyph.height]).toEqual([icon, icon])
        expect(getComputedStyle(button).borderTopLeftRadius).toBe(
          corner === undefined ? '20px' : resolved(corner).radius,
        )
      },
    )

    it.each([
      ['md', 56, 16, 8, probeStyles.titleMedium],
      ['lg', 80, 26, 12, probeStyles.titleLarge],
      ['xl', 96, 28, 16, probeStyles.headlineSmall],
    ] as const)(
      'draws the %s extended FAB %ipx tall, %ipx in, %ipx before its label',
      (size, height, padding, gap, type) => {
        const view = render(
          <Fab label="Label" size={size}>
            {ICON}
          </Fab>,
        )
        const button = view.getByRole('button')
        const computed = getComputedStyle(button)
        const icon = view.getByTestId('icon').getBoundingClientRect()
        const label = textBox(view.getByText('Label'))

        expect(button.getBoundingClientRect().height).toBe(height)
        expect(computed.paddingLeft).toBe(`${padding}px`)
        expect(label.left - icon.right).toBeCloseTo(gap, 0)
        expect(computed.fontSize).toBe(resolved(type).fontSize)
      },
    )

    it('leads the label from the other side under right-to-left', () => {
      const view = render(
        <div dir="rtl">
          <Fab label="Label">{ICON}</Fab>
        </div>,
      )
      const icon = view.getByTestId('icon').getBoundingClientRect()
      const label = textBox(view.getByText('Label'))

      expect(icon.left).toBeGreaterThan(label.right)
    })
  })

  // A label wider than the FAB's container wrapped onto lines the FAB's
  // fixed height had no room for. It stays on one line, cut short with an
  // ellipsis, and its full text stays reachable.
  describe('a long label', () => {
    const LONG = 'A label long enough to be cut short in a narrow column'

    function renderNarrow() {
      return render(
        <div {...stylex.props(probeStyles.narrow)}>
          <Fab label={LONG}>{ICON}</Fab>
        </div>,
      )
    }

    it('stays on one line, inside its container, ending in an ellipsis', () => {
      const view = renderNarrow()
      const button = view.getByRole('button')
      const label = view.getByText(LONG)
      const computed = getComputedStyle(label)
      const lines = new Set(
        [...lineBoxes(label)].map((rect) => Math.round(rect.top)),
      )

      expect(label).not.toBe(button)
      expect(lines.size).toBe(1)
      expect(button.getBoundingClientRect().width).toBeLessThanOrEqual(200)
      expect(label.scrollWidth).toBeGreaterThan(label.clientWidth)
      expect([computed.whiteSpace, computed.textOverflow]).toEqual([
        'nowrap',
        'ellipsis',
      ])
    })

    // Clipped across and never down, so a reader's wider text spacing
    // keeps the bottom of the line, as Navigation's labels do.
    it('clips across and never down', () => {
      const computed = getComputedStyle(renderNarrow().getByText(LONG))

      expect([computed.overflowX, computed.overflowY]).toEqual([
        'clip',
        'visible',
      ])
    })

    it('keeps the whole label as its name', () => {
      expect(
        renderNarrow().getByRole('button', { name: LONG }),
      ).toBeInTheDocument()
    })

    it('shows the whole label in a tooltip once it is cut short', () => {
      const label = renderNarrow().getByText(LONG)

      fireEvent.pointerOver(label)

      expect(label).toHaveAttribute('title', LONG)
    })

    it('leaves a label that fits untitled', () => {
      const view = render(<Fab label="Label">{ICON}</Fab>)
      const label = view.getByText('Label')

      fireEvent.pointerOver(label)

      expect(label).not.toHaveAttribute('title')
    })
  })

  describe('colour', () => {
    it.each([
      ['primary', 'tonal', probeStyles.primaryContainer],
      ['secondary', 'tonal', probeStyles.secondaryContainer],
      ['tertiary', 'tonal', probeStyles.tertiaryContainer],
      ['primary', 'filled', probeStyles.filledPrimary],
      ['tertiary', 'filled', probeStyles.filledTertiary],
    ] as const)('draws the %s tone %s', (tone, variant, pair) => {
      const expected = resolved(pair)
      const view = render(
        <Fab aria-label="Label" tone={tone} variant={variant}>
          {ICON}
        </Fab>,
      )
      const computed = getComputedStyle(view.getByRole('button'))

      expect(computed.backgroundColor).toBe(expected.background)
      expect(computed.color).toBe(expected.color)
    })

    it('rests on primary container by default', () => {
      const expected = resolved(probeStyles.primaryContainer)
      const view = render(<Fab aria-label="Label">{ICON}</Fab>)
      expect(getComputedStyle(view.getByRole('button')).backgroundColor).toBe(
        expected.background,
      )
    })
  })

  describe('elevation and layers', () => {
    it('rests on the level 3 shadow and lifts to level 4 under a pointer', () => {
      const rest = resolved(probeStyles.liftThree).shadow
      const lifted = resolved(probeStyles.liftFour).shadow
      expect(rest).not.toBe(lifted)

      const view = render(<Fab aria-label="Label">{ICON}</Fab>)
      const button = view.getByRole('button')
      expect(getComputedStyle(button).boxShadow).toBe(rest)

      fireEvent.pointerOver(button, { pointerType: 'mouse' })

      expect(getComputedStyle(button).boxShadow).toBe(lifted)
      expect(getComputedStyle(button).backgroundImage).not.toBe('none')
    })

    it('lays the focus layer over the container for a keyboard', () => {
      const view = render(<Fab aria-label="Label">{ICON}</Fab>)
      const button = view.getByRole('button')
      expect(getComputedStyle(button).backgroundImage).toBe('none')

      focusByKeyboard(button)

      expect(getComputedStyle(button).backgroundImage).not.toBe('none')
      expect(getComputedStyle(button).outlineStyle).toBe('solid')
    })

    it('draws no layer and no shadow while disabled', () => {
      const view = render(
        <Fab aria-label="Label" isDisabled>
          {ICON}
        </Fab>,
      )
      const button = view.getByRole('button')
      fireEvent.pointerOver(button, { pointerType: 'mouse' })

      expect(getComputedStyle(button).boxShadow).toBe('none')
      expect(getComputedStyle(button).backgroundImage).toBe('none')
    })
  })

  // The mode drops the shadow and paints the container over, which left the
  // FAB an icon with nothing round it.
  describe('under forced colours', () => {
    it('draws its container as a ButtonText rule', () => {
      const view = render(<Fab aria-label="Label">{ICON}</Fab>)
      const rules = declarationsHeld(view.getByRole('button'), FORCED_COLORS)

      expect(rules.get('border-top-color')).toBe('buttontext')
      expect(rules.get('border-top-width')).toBe('1px')
    })
  })
})
