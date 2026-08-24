import type { StyleXStyles } from '@stylexjs/stylex'

import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'

import Text from '.'
import { colors, typography } from '../../tokens/design.tokens.stylex'

// The component's own `styles`/`tones` are module-private, so the expected
// classes are rebuilt here from the same tokens. StyleX derives a class name
// from the declaration itself, so an identical declaration compiles to an
// identical class — which is what makes this an assertion about the tokens
// Text is wired to, not just about it having emitted some class.
const expected = stylex.create({
  inheritColor: {
    color: 'inherit',
  },
  mutedColor: {
    color: colors.onSurfaceVariant,
  },
  titleMediumScale: {
    fontFamily: typography.titleMediumFont,
    fontSize: typography.titleMediumSize,
    fontWeight: typography.titleMediumWeight,
    letterSpacing: typography.titleMediumTracking,
    lineHeight: typography.titleMediumLineHeight,
  },
})

// Empty on purpose — `useRender` injects the children, so jsx-a11y's
// heading-has-content is reading a template whose content it cannot see.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />

/** The classes StyleX generates for a style, guarded against being empty. */
function classesOf(style: StyleXStyles) {
  const names = (stylex.props(style).className ?? '').split(' ').filter(Boolean)
  // `[].every()` is vacuously true, so an empty list would make every
  // assertion below pass without proving anything.
  if (names.length === 0) {
    throw new Error('expected StyleX to generate at least one class')
  }
  return names
}

function hasAll(element: Element, style: StyleXStyles) {
  return classesOf(style).every((name) => element.classList.contains(name))
}

describe('element', () => {
  it('renders a span by default', () => {
    const view = render(<Text>The quick brown fox</Text>)

    expect(view.getByText('The quick brown fox').tagName).toBe('SPAN')
  })

  it('renders the element given to `render` instead, still styled', () => {
    const view = render(
      <Text render={HEADING_2} variant="titleMedium">
        Section heading
      </Text>,
    )
    const heading = view.getByRole('heading', { level: 2 })

    expect(heading.tagName).toBe('H2')
    expect(hasAll(heading, expected.titleMediumScale)).toBe(true)
  })

  it('forwards a ref to the rendered element', () => {
    const ref = createRef<HTMLSpanElement>()
    render(<Text ref={ref}>Sample text</Text>)

    expect(ref.current).toBeInstanceOf(HTMLSpanElement)
    expect(ref.current?.textContent).toBe('Sample text')
  })

  it('forwards arbitrary props', () => {
    const view = render(
      <Text data-testid="sample" id="sample-id">
        Supporting copy
      </Text>,
    )

    expect(view.getByTestId('sample').id).toBe('sample-id')
  })
})

describe('variant', () => {
  it('applies the type-scale tokens of the named variant', () => {
    const view = render(<Text variant="titleMedium">Sample text</Text>)

    expect(
      hasAll(view.getByText('Sample text'), expected.titleMediumScale),
    ).toBe(true)
  })

  it('does not apply another variant’s scale', () => {
    const view = render(<Text variant="bodySmall">Sample text</Text>)

    expect(
      hasAll(view.getByText('Sample text'), expected.titleMediumScale),
    ).toBe(false)
  })

  it('defaults to bodyMedium', () => {
    const view = render(
      <>
        <Text>implicit</Text>
        <Text variant="bodyMedium">explicit</Text>
      </>,
    )

    expect(view.getByText('implicit').className).toBe(
      view.getByText('explicit').className,
    )
  })
})

describe('tone', () => {
  it('applies the color role of the named tone', () => {
    const view = render(<Text tone="muted">Supporting copy</Text>)

    expect(hasAll(view.getByText('Supporting copy'), expected.mutedColor)).toBe(
      true,
    )
  })

  it('opts out of setting a color when inherit', () => {
    const view = render(<Text tone="inherit">Supporting copy</Text>)
    const span = view.getByText('Supporting copy')

    expect(hasAll(span, expected.inheritColor)).toBe(true)
    expect(hasAll(span, expected.mutedColor)).toBe(false)
  })

  it('composes independently of variant', () => {
    const view = render(
      <Text tone="muted" variant="titleMedium">
        Supporting copy
      </Text>,
    )
    const span = view.getByText('Supporting copy')

    expect(hasAll(span, expected.titleMediumScale)).toBe(true)
    expect(hasAll(span, expected.mutedColor)).toBe(true)
  })
})

describe('className', () => {
  // The scale is still overridden with `variant`/`tone` rather than with a
  // competing class — StyleX compiles into `@layer`, so a consumer's own
  // unlayered rule wins the cascade whatever order the two class strings are
  // written in. What is pinned here is that both survive to the element;
  // styling.test.tsx pins the same for every other component.
  it('joins a consumer className rather than replacing it', () => {
    const view = render(
      <Text className="consumer" variant="titleMedium">
        Sample text
      </Text>,
    )
    const span = view.getByText('Sample text')

    expect(span.classList.contains('consumer')).toBe(true)
    expect(hasAll(span, expected.titleMediumScale)).toBe(true)
  })
})
