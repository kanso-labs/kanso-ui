import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import SearchField from '.'
import { entriesOf, rulesReaching } from '../../styles/stylesheet.testing'
import { colors } from '../../tokens/design.tokens.stylex'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for
// without depending on the browser having applied a rule these tests are the
// first thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  errorText: { color: colors.error },
  onSurfaceText: { color: colors.onSurface },
  onSurfaceVariantText: { color: colors.onSurfaceVariant },
  primaryText: { color: colors.primary },
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

/** The magnifier the bar opens on. */
function magnifierOf(bar: HTMLElement) {
  const glyph = bar.firstElementChild
  if (!(glyph instanceof SVGElement)) {
    throw new Error('expected the bar to open on the magnifier')
  }
  return glyph
}

/** A colour token as the browser resolves it, for comparing with a shadow. */
function resolvedColor(style: stylex.StyleXStyles) {
  const view = render(<span data-testid="probe" {...stylex.props(style)} />)
  const { color } = getComputedStyle(view.getByTestId('probe'))
  view.unmount()
  return color
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

    // iOS shows its Search key only for a search input inside a form with an
    // action, and the field is meant to work with `onSubmit` alone.
    it('asks an on-screen keyboard for a Search key', () => {
      const { input } = setup()
      expect(input.getAttribute('enterkeyhint')).toBe('search')
    })

    it('takes another Enter key from the call site', () => {
      const { input } = setup({ enterKeyHint: 'go' })
      expect(input.getAttribute('enterkeyhint')).toBe('go')
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
      expect(view.queryByRole('button', { name: 'Clear search' })).toBeNull()

      fireEvent.change(view.input, { target: { value: 'typed' } })
      fireEvent.click(view.getByRole('button', { name: 'Clear search' }))
      expect(view.input).toHaveProperty('value', '')
      expect(onClear).toHaveBeenCalledTimes(1)
      expect(view.queryByRole('button', { name: 'Clear search' })).toBeNull()
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

    it('disables the input and the clear button', () => {
      const view = setup({ defaultValue: 'typed', isDisabled: true })
      expect(view.input).toHaveProperty('disabled', true)
      expect(view.getByRole('button', { name: 'Clear search' })).toHaveProperty(
        'disabled',
        true,
      )
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

    // The search page names no error state, so the bar takes the text
    // fields page's: the outline in the error role, 1dp at rest and 2dp
    // focused. The valid bar's ring is pinned beside it, so an error ring
    // drawn whatever the state fails as surely as one never drawn.
    it('rings an invalid bar in the error colour, focused or not', () => {
      const error = resolvedColor(probeStyles.errorText)
      const { input } = setup({ error: 'Enter a keyword.' })
      const bar = barOf(input)
      settle(bar)
      expect(getComputedStyle(bar).boxShadow).toBe(
        `${error} 0px 0px 0px 1px inset`,
      )
      input.focus()
      settle(bar)
      expect(getComputedStyle(bar).boxShadow).toBe(
        `${error} 0px 0px 0px 2px inset`,
      )
    })

    it('rings a valid bar in the primary colour while focused', () => {
      const primary = resolvedColor(probeStyles.primaryText)
      const { input } = setup()
      const bar = barOf(input)
      input.focus()
      settle(bar)
      expect(getComputedStyle(bar).boxShadow).toBe(
        `${primary} 0px 0px 0px 2px inset`,
      )
    })

    it('draws no error ring on a disabled bar', () => {
      const { input } = setup({ error: 'Enter a keyword.', isDisabled: true })
      const bar = barOf(input)
      settle(bar)
      expect(getComputedStyle(bar).boxShadow).toBe('none')
    })

    // The bar is 56dp and the input's line 24dp of it: a press on the
    // magnifier, the padding or the strips above and below the text focused
    // nothing, though the bar darkened for it.
    it.each([
      ['the bar around the input', (bar: HTMLElement) => bar],
      ['the magnifier', (bar: HTMLElement) => bar.querySelector('svg') ?? bar],
    ])('focuses the input from a press on %s', (_case, target) => {
      const { input } = setup()
      const pressed = target(barOf(input))
      expect(pressed).not.toBe(input)

      fireEvent.pointerDown(pressed, { button: 0 })

      expect(document.activeElement).toBe(input)
    })

    // The clear button is a press of its own: it clears and hands focus back
    // to the input rather than to the bar or the page.
    it('leaves a press on the clear button to the button', () => {
      const { getByRole, input } = setup({ defaultValue: 'typed' })
      const clear = getByRole('button')

      act(() => {
        fireEvent.pointerDown(clear, { button: 0 })
        fireEvent.pointerUp(clear, { button: 0 })
        fireEvent.click(clear)
      })

      expect(input).toHaveProperty('value', '')
      expect(document.activeElement).toBe(input)
    })

    it('takes no press while disabled', () => {
      const { input } = setup({ isDisabled: true })
      const before = document.activeElement

      fireEvent.pointerDown(barOf(input), { button: 0 })

      expect(document.activeElement).toBe(before)
      expect(document.activeElement).not.toBe(input)
    })

    it('shows a text cursor over the whole bar', () => {
      const { input } = setup()
      expect(getComputedStyle(barOf(input)).cursor).toBe('text')
    })

    // The clear button is disabled with the field and shows the cursor every
    // disabled button does, so the bar and the input show it too.
    it('shows one disabled cursor over the bar, the input and the clear button', () => {
      const view = setup({ defaultValue: 'typed', isDisabled: true })
      const button = view.getByRole('button', { name: 'Clear search' })
      expect({
        bar: getComputedStyle(barOf(view.input)).cursor,
        button: getComputedStyle(button).cursor,
        input: getComputedStyle(view.input).cursor,
      }).toEqual({
        bar: 'not-allowed',
        button: 'not-allowed',
        input: 'not-allowed',
      })
    })
  })

  describe('appearance', () => {
    it('draws the bar on surface container high', () => {
      const { input } = setup()
      expect(hasClasses(barOf(input), CLASSES.surface)).toBe(true)
    })

    // The page's level 3 is the tone of the container, and Google's own
    // search bars cast no shadow for it, so every shadow the bar declares,
    // resting or focused, is a ring inside the pill.
    it.each([
      ['a valid bar', {}],
      ['an invalid bar', { error: 'Enter a keyword.' }],
      ['a disabled bar', { isDisabled: true }],
    ])('casts no shadow from %s', (_case, props) => {
      const { input } = setup(props)
      const shadows = rulesReaching(barOf(input), { holding: 'hover: hover' })
        .map((rule) => rule.style.getPropertyValue('box-shadow'))
        .filter((shadow) => shadow !== '')
      expect(shadows).not.toEqual([])
      expect(
        shadows
          .flatMap((shadow) => entriesOf(shadow))
          .filter((entry) => entry !== 'none' && !entry.startsWith('inset ')),
      ).toEqual([])
    })

    // The page's leading icon is on surface, a step stronger than the
    // supporting text beside it. The magnifier took the bar's on surface
    // variant and drew in the placeholder's colour.
    it('draws the magnifier in on surface beside an on surface variant placeholder', () => {
      const onSurface = resolvedColor(probeStyles.onSurfaceText)
      const onSurfaceVariant = resolvedColor(probeStyles.onSurfaceVariantText)
      expect(onSurface).not.toBe(onSurfaceVariant)
      const { input } = setup()
      const bar = barOf(input)
      expect({
        bar: getComputedStyle(bar).color,
        magnifier: getComputedStyle(magnifierOf(bar)).color,
        placeholder: getComputedStyle(input, '::placeholder').color,
      }).toEqual({
        bar: onSurfaceVariant,
        magnifier: onSurface,
        placeholder: onSurfaceVariant,
      })
    })

    // The magnifier's own colour would otherwise hold against the bar's faded
    // one, as it would against the `GrayText` forced colours gives the bar.
    it('fades the magnifier with the rest of a disabled bar', () => {
      const { input } = setup({ isDisabled: true })
      const bar = barOf(input)
      const faded = getComputedStyle(bar).color
      expect(faded).not.toBe(resolvedColor(probeStyles.onSurfaceText))
      expect(getComputedStyle(magnifierOf(bar)).color).toBe(faded)
    })

    // A translated placeholder is the one most likely to outrun the input,
    // and it was cut off mid-glyph.
    it('ends a placeholder wider than the input in an ellipsis', () => {
      const { input } = setup({
        placeholder:
          'Supporting text long enough to run well past the end of the bar it sits in',
      })
      expect(getComputedStyle(input).textOverflow).toBe('ellipsis')
    })

    // The clear button draws its own hovered and pressed layers, and `:hover`
    // and `:active` hold on the bar whenever they hold on the button. Neither
    // state can be driven from here, since no event moves the browser's own
    // pointer, so the rules are read: under the button, pressed or hovered,
    // the bar takes its resting colour, both for a touch and inside the
    // query a pointer that can hover matches.
    it('draws no layer of its own under the clear button', () => {
      const { input } = setup({ defaultValue: 'typed' })
      const rules = rulesReaching(barOf(input), { holding: 'hover: hover' })
      const backgroundOf = (rule: (typeof rules)[number]) =>
        rule.style.getPropertyValue('background-color')
      const resting = rules.find(
        (rule) =>
          !rule.held &&
          backgroundOf(rule) !== '' &&
          rule.selectors.every((selector) => !selector.includes(':')),
      )
      if (resting === undefined) {
        throw new Error('expected the bar to carry a resting background')
      }

      // A set, since the sheet can hold a rule twice and a rule can carry
      // more than one of these selectors.
      const underButton = new Set<string>()
      for (const rule of rules) {
        for (const selector of rule.selectors) {
          if (selector.includes(':has(button:')) {
            const state = selector.includes(':has(button:active)')
              ? 'pressed'
              : 'hovered'
            const colour =
              backgroundOf(rule) === backgroundOf(resting) ? 'resting' : 'layer'
            underButton.add(
              `${rule.held ? 'hover-capable' : 'any'} ${state} ${colour}`,
            )
          }
        }
      }

      expect(underButton).toEqual(
        new Set([
          'any pressed resting',
          'hover-capable hovered resting',
          'hover-capable pressed resting',
        ]),
      )
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
