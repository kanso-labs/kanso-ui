import * as stylex from '@stylexjs/stylex'
import { fireEvent, render } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import Link from '.'
import { colors, stateLayerOpacity } from '../../tokens/design.tokens.stylex'

// Compared against elements styled straight from the tokens rather than hex
// literals, so the assertions pin which role a tone reaches for without also
// pinning what that role currently resolves to.
const probeStyles = stylex.create({
  // The same declaration the component writes for its disabled state, so it
  // hashes to the same atomic class — see chip/index.test.tsx for the pattern.
  disabledColor: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  primary: { color: colors.primary },
})

const harnessStyles = stylex.create({
  prose: {
    color: 'rgb(10, 20, 30)',
    fontFamily: 'Georgia, serif',
    fontSize: '29px',
  },
})

function classesOf(props: { className?: string | undefined }) {
  const classes = (props.className ?? '').split(' ').filter(Boolean)
  // An empty list would make `every` below vacuously true, so it is a broken
  // assertion rather than a passing one.
  if (classes.length === 0) {
    throw new Error('expected the probe style to generate at least one class')
  }
  return classes
}

const DISABLED_CLASSES = classesOf(stylex.props(probeStyles.disabledColor))

function primaryColor() {
  const probe = render(
    <div data-testid="probe" {...stylex.props(probeStyles.primary)} />,
  )
  const value = getComputedStyle(probe.getByTestId('probe')).color
  probe.unmount()
  return value
}

function setup(props: Partial<Parameters<typeof Link>[0]> = {}) {
  const view = render(
    <Link data-testid="link" href="#first" {...props}>
      Label
    </Link>,
  )
  return { ...view, link: view.getByTestId('link') }
}

describe('link', () => {
  describe('structure', () => {
    it('renders an anchor carrying its href and children', () => {
      const { link } = setup()
      expect(link.tagName).toBe('A')
      expect(link.getAttribute('href')).toBe('#first')
      expect(link.textContent).toBe('Label')
    })

    it('passes attributes through to the element', () => {
      const { link } = setup({ rel: 'noreferrer', target: '_blank' })
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toBe('noreferrer')
    })

    // React Aria's `render` is a function handed the anchor's props, which is
    // how a router's own link component takes the place of the plain <a>.
    it('hands its props to a render function from the call site', () => {
      const { link } = setup({
        render: (props) => createElement('a', { ...props, 'data-wrapped': '' }),
      })
      expect(link.tagName).toBe('A')
      expect(link.getAttribute('href')).toBe('#first')
      expect(link.hasAttribute('data-wrapped')).toBe(true)
    })

    // An anchor with nowhere to go is not a link to a browser, so React Aria
    // renders a span and gives it the role instead.
    it('renders a span announced as a link when it has no href', () => {
      const view = render(<Link data-testid="link">Label</Link>)
      const link = view.getByTestId('link')
      expect(link.tagName).toBe('SPAN')
      expect(link.getAttribute('role')).toBe('link')
      expect(link.hasAttribute('href')).toBe(false)
    })
  })

  describe('disabled', () => {
    it('renders a span announced as a disabled link', () => {
      const { link } = setup({ isDisabled: true })
      expect(link.tagName).toBe('SPAN')
      expect(link.getAttribute('role')).toBe('link')
      expect(link.hasAttribute('href')).toBe(false)
      expect(link.getAttribute('aria-disabled')).toBe('true')
    })

    // No `:disabled` matches a span, so the colour has to come from the render
    // state — and it has to replace the tone's colour outright.
    it('takes the disabled colour in place of its tone', () => {
      const { link } = setup({ isDisabled: true })
      expect(
        DISABLED_CLASSES.every((name) => link.classList.contains(name)),
      ).toBe(true)

      const view = render(
        <Link data-testid="enabled" href="#first">
          Label
        </Link>,
      )
      const enabled = view.getByTestId('enabled')
      expect(
        DISABLED_CLASSES.some((name) => enabled.classList.contains(name)),
      ).toBe(false)
    })
  })

  describe('behaviour', () => {
    it('reports a press', () => {
      const onPress = vi.fn<() => void>()
      const { link } = setup({ onPress })
      fireEvent.click(link)
      expect(onPress).toHaveBeenCalledOnce()
    })

    // React Aria forwards only the labelling `aria-*` props on its own, so
    // a link marked current or in control of something would lose the mark.
    it('forwards aria attributes React Aria would drop', () => {
      const { link } = setup({ 'aria-current': 'page', 'aria-expanded': true })
      expect(link.getAttribute('aria-current')).toBe('page')
      expect(link.getAttribute('aria-expanded')).toBe('true')
    })

    // React Aria's own keyboard handlers stop propagation, which is its
    // convention rather than the DOM's; put on the element directly, an
    // Escape pressed on a link inside a dialog still reaches the dialog.
    it('keeps its keyboard handlers on the element, where they bubble', () => {
      const inner = vi.fn<() => void>()
      const outer = vi.fn<() => void>()
      const view = render(
        <div onKeyDown={outer} role="presentation">
          <Link href="#first" onKeyDown={inner}>
            Label
          </Link>
        </div>,
      )
      fireEvent.keyDown(view.getByRole('link'), { key: 'Escape' })
      expect(inner).toHaveBeenCalledOnce()
      expect(outer).toHaveBeenCalledOnce()
    })
  })

  // A link is a run of words inside something else, so it must not impose a
  // size or a face on the sentence it interrupts.
  describe('typography', () => {
    it('takes its type from the surrounding text', () => {
      const view = render(
        <div {...stylex.props(harnessStyles.prose)}>
          <Link data-testid="link" href="#first">
            Label
          </Link>
        </div>,
      )
      const computed = getComputedStyle(view.getByTestId('link'))
      expect(computed.fontSize).toBe('29px')
      expect(computed.fontFamily).toContain('Georgia')
    })

    it('takes the surrounding colour when told to inherit', () => {
      const view = render(
        <div {...stylex.props(harnessStyles.prose)}>
          <Link data-testid="link" href="#first" tone="inherit">
            Label
          </Link>
        </div>,
      )
      expect(getComputedStyle(view.getByTestId('link')).color).toBe(
        'rgb(10, 20, 30)',
      )
    })
  })

  describe('tone', () => {
    it('marks itself out from the surrounding text by default', () => {
      const expected = primaryColor()
      const view = render(
        <div {...stylex.props(harnessStyles.prose)}>
          <Link data-testid="link" href="#first">
            Label
          </Link>
        </div>,
      )
      const actual = getComputedStyle(view.getByTestId('link')).color
      expect(actual).toBe(expected)
      // Without this the assertion above would also pass if primary happened
      // to resolve to the prose colour the harness sets.
      expect(actual).not.toBe('rgb(10, 20, 30)')
    })
  })

  // Colour alone fails anyone who cannot separate the two hues, so the rule
  // has to be there without hovering.
  describe('underline', () => {
    it('draws the rule at rest by default', () => {
      const { link } = setup()
      expect(getComputedStyle(link).textDecorationLine).toBe('underline')
    })

    it('holds the rule back until hover when asked', () => {
      const { link } = setup({ underline: 'hover' })
      expect(getComputedStyle(link).textDecorationLine).toBe('none')
    })

    it('draws no rule at all when asked', () => {
      const { link } = setup({ underline: 'none' })
      expect(getComputedStyle(link).textDecorationLine).toBe('none')
    })
  })

  describe('focus', () => {
    // Keyboard focus has to be visible, and the ring is the only thing that
    // shows it — the colour and underline are already there at rest.
    it('shows a ring on keyboard focus and none at rest', () => {
      const { link } = setup()
      expect(getComputedStyle(link).outlineStyle).toBe('none')

      link.focus()
      expect(document.activeElement).toBe(link)
      expect(getComputedStyle(link).outlineStyle).toBe('solid')
      expect(getComputedStyle(link).outlineWidth).toBe('2px')
    })
  })
})
