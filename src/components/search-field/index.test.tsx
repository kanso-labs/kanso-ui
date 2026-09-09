import * as stylex from '@stylexjs/stylex'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import SearchField from '.'
import { colors } from '../../tokens/design.tokens.stylex'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for
// without depending on the browser having applied a rule these tests are the
// first thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  errorText: { color: colors.error },
  surface: { backgroundColor: colors.surfaceContainerHigh },
})

function classesOf(props: { className?: string | undefined }) {
  const classes = (props.className ?? '').split(' ').filter(Boolean)
  // An empty list would make every `every` below vacuously true, so it is a
  // broken assertion rather than a passing one.
  if (classes.length === 0) {
    throw new Error('expected the probe style to generate at least one class')
  }
  return classes
}

const CLASSES = {
  errorText: classesOf(stylex.props(probeStyles.errorText)),
  surface: classesOf(stylex.props(probeStyles.surface)),
}

/** The bar around the input. */
function barOf(input: HTMLElement) {
  const bar = input.parentElement
  if (!(bar instanceof HTMLElement)) {
    throw new Error('expected the input to sit in the bar')
  }
  return bar
}

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

/** Finishes the bar's transitions, so a computed style is the settled one. */
function settle(bar: HTMLElement) {
  for (const animation of bar.getAnimations()) {
    animation.finish()
  }
}

function setup(props: Partial<Parameters<typeof SearchField>[0]> = {}) {
  const view = render(
    <SearchField label="Label" placeholder="Supporting text" {...props} />,
  )
  return {
    ...view,
    input: view.getByRole('searchbox', { name: 'Label' }),
  }
}

describe('search field', () => {
  describe('semantics', () => {
    // getByRole with a name resolves through the accessible name, so finding
    // the input this way is the label association itself — and the label is
    // read rather than seen, which is what the hidden wrapper is for.
    it('renders a search box named by a label that is not shown', () => {
      const { input } = setup()
      expect(input.tagName).toBe('INPUT')
      expect(input.getAttribute('type')).toBe('search')
      expect(input.getAttribute('placeholder')).toBe('Supporting text')
    })

    it('associates the description with the input', () => {
      const view = setup({ description: 'Supporting line' })
      expect(view.input.getAttribute('aria-describedby')?.split(' ')).toContain(
        view.getByText('Supporting line').id,
      )
    })

    it('marks the input invalid and shows the error', () => {
      const view = setup({ error: 'Enter a keyword.' })
      expect(view.input.getAttribute('aria-invalid')).toBe('true')
      expect(
        hasClasses(view.getByText('Enter a keyword.'), CLASSES.errorText),
      ).toBe(true)
    })
  })

  describe('value', () => {
    it('keeps its own value when uncontrolled', () => {
      const { input } = setup()
      fireEvent.change(input, { target: { value: 'typed' } })
      expect(input).toHaveProperty('value', 'typed')
    })

    // Controlled means the call site owns the value: typing reports it and
    // nothing moves until the prop comes back different.
    it('reports without moving when controlled', () => {
      const onChange = vi.fn<(value: string) => void>()
      const { input } = setup({ onChange, value: 'kept' })
      fireEvent.change(input, { target: { value: 'typed' } })
      expect(onChange).toHaveBeenCalledWith('typed')
      expect(input).toHaveProperty('value', 'kept')
    })

    it('submits the value on Enter', () => {
      const onSubmit = vi.fn<(value: string) => void>()
      const { input } = setup({ defaultValue: 'typed', onSubmit })
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(onSubmit).toHaveBeenCalledWith('typed')
    })

    it('shows the clear button only while it holds something, and clears from it', () => {
      const onClear = vi.fn<() => void>()
      const view = setup({ onClear })
      expect(view.queryByRole('button', { name: 'Clear' })).toBeNull()

      fireEvent.change(view.input, { target: { value: 'typed' } })
      fireEvent.click(view.getByRole('button', { name: 'Clear' }))
      expect(view.input).toHaveProperty('value', '')
      expect(onClear).toHaveBeenCalledTimes(1)
      expect(view.queryByRole('button', { name: 'Clear' })).toBeNull()
    })

    it('takes another name for the clear button', () => {
      const view = setup({ clearLabel: 'Reset', defaultValue: 'typed' })
      expect(view.getByRole('button', { name: 'Reset' })).not.toBeNull()
    })

    it('clears on Escape', () => {
      const { input } = setup({ defaultValue: 'typed' })
      fireEvent.keyDown(input, { key: 'Escape' })
      expect(input).toHaveProperty('value', '')
    })

    it('is disabled through the input', () => {
      const { input } = setup({ defaultValue: 'typed', isDisabled: true })
      expect(input).toHaveProperty('disabled', true)
    })
  })

  describe('focus', () => {
    it('draws the ring inside the bar while the input is focused', () => {
      const { input } = setup()
      const bar = barOf(input)
      expect(getComputedStyle(bar).boxShadow).toBe('none')
      input.focus()
      settle(bar)
      expect(getComputedStyle(bar).boxShadow).toContain('inset')
      input.blur()
      settle(bar)
      expect(getComputedStyle(bar).boxShadow).toBe('none')
    })
  })

  describe('appearance', () => {
    it('draws the bar on surface container high', () => {
      const { input } = setup()
      expect(hasClasses(barOf(input), CLASSES.surface)).toBe(true)
    })

    // The search page's bar: 56 tall with a full corner, the magnifier 28 in
    // and the text 68 in, and the clear icon ending 28 from the end.
    it('lays the bar out to the page', () => {
      const { input } = setup({ defaultValue: 'typed' })
      const bar = barOf(input)
      const edge = bar.getBoundingClientRect()
      const glyph = bar.firstElementChild
      const clearIcon = bar.querySelector('button svg')
      if (
        !(glyph instanceof SVGElement) ||
        !(clearIcon instanceof SVGElement)
      ) {
        throw new Error(
          'expected the bar to hold the magnifier and the clear icon',
        )
      }
      expect(edge.height).toBe(56)
      // A full corner: any radius from half the height up draws a pill.
      expect(
        Number.parseFloat(getComputedStyle(bar).borderTopLeftRadius),
      ).toBeGreaterThanOrEqual(28)
      expect(glyph.getBoundingClientRect().left - edge.left).toBe(28)
      expect(input.getBoundingClientRect().left - edge.left).toBe(68)
      expect(edge.right - clearIcon.getBoundingClientRect().right).toBe(28)
    })
  })
})
