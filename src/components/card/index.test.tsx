import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Card from '.'
import { rippleStyles } from '../../styles/ripple'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'

// Compared against elements styled straight from the tokens rather than
// literals, so the assertions pin which role each variant reaches for without
// also pinning what that role currently resolves to.
const probeStyles = stylex.create({
  corner: { borderRadius: radii.md },
  outlineVariant: { color: colors.outlineVariant },
  padding: { padding: spacing.lg },
  surface: { backgroundColor: colors.surface },
  surfaceContainerHighest: { backgroundColor: colors.surfaceContainerHighest },
  surfaceContainerLow: { backgroundColor: colors.surfaceContainerLow },
})

// A column shorter than the card it holds, scrolling whatever overflows it:
// the shape a sheet's body takes once the sheet reaches its cap.
const columnStyles = stylex.create({
  column: {
    blockSize: '48px',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  content: {
    blockSize: '120px',
  },
  giveWay: {
    minBlockSize: 0,
  },
})

// Taller than the content any case below gives a card, which is what a row
// of cards stretching to its tallest does to the rest.
const stretchedStyles = stylex.create({
  tall: { blockSize: '200px' },
})

// How far the card's first child sits below the card's own top.
function firstOffset(view: ReturnType<typeof render>) {
  const card = cardIn(view.container)
  return (
    view.getByTestId('first').getBoundingClientRect().top -
    card.getBoundingClientRect().top
  )
}

// The same children in every card the stretched cases compare: a block, and
// a line holding text and an inline element.
function stretchedContent() {
  return (
    <>
      <p data-testid="first">Headline</p>
      <span data-testid="line">
        Supporting <strong data-testid="inline">line</strong>
      </span>
    </>
  )
}

// Empty and hoisted for the same reasons the stories hoist theirs: useRender
// injects the children, so jsx-a11y sees an anchor with no content yet, and a
// fresh element per render would trip react-perf's no-jsx-as-prop.
const ARTICLE = <article />
// oxlint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/control-has-associated-label -- filled by useRender
const EXAMPLE_LINK = <a href="https://example.com" />

// The ripple's inner span carries these classes only while the hook considers
// itself pressed, so their presence is an observable signal for its state
// without reaching into React internals. Matches button/index.test.tsx.
const pressedClassNames = (stylex.props(rippleStyles.pressed).className ?? '')
  .split(' ')
  .filter(Boolean)

// Narrows with instanceof rather than an assertion, so a card that failed to
// render fails the test here instead of further down with something obscure.
function cardIn(container: HTMLElement) {
  const card = container.firstElementChild
  if (!(card instanceof HTMLElement)) {
    throw new Error('expected the card to render an element')
  }
  return card
}

/**
 * Whether the ripple is mid-press. The length check matters: `[].every()` is
 * vacuously true, so an empty class list would report "pressed" for a press
 * that never happened.
 */
function isPressed(container: HTMLElement) {
  const span = container.querySelector('span[aria-hidden="true"] > span')
  if (!span) {
    return false
  }
  return (
    pressedClassNames.length > 0 &&
    pressedClassNames.every((name) => span.classList.contains(name))
  )
}

/**
 * Presses with a primary mouse button. `buttons: 1` is load-bearing — the
 * hook ignores a non-touch pointerdown without it — and the press registers
 * synchronously, since the hook only awaits before a touch's scroll delay.
 */
function pressWithMouse(target: Element) {
  const rect = target.getBoundingClientRect()
  fireEvent(
    target,
    new PointerEvent('pointerdown', {
      bubbles: true,
      buttons: 1,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'mouse',
    }),
  )
}

// Takes the element rather than the style, so the caller does the
// stylex.props() spread and this helper needs no StyleX types of its own.
function probe(element: ReactElement) {
  const view = render(element)
  const computed = getComputedStyle(view.getByTestId('probe'))
  const read = {
    background: computed.backgroundColor,
    borderRadius: computed.borderRadius,
    color: computed.color,
    padding: computed.paddingTop,
  }
  view.unmount()
  return read
}

describe('card', () => {
  describe('element', () => {
    it('renders a plain container by default', () => {
      const view = render(<Card>content</Card>)
      expect(view.queryByRole('button')).toBeNull()
      expect(view.container.firstElementChild?.tagName).toBe('DIV')
    })

    // The whole point of `interactive`: a card that is itself the control has
    // to be focusable and activatable, which a div is not.
    it('renders a button when interactive', () => {
      const view = render(<Card interactive>content</Card>)
      const button = view.getByRole('button')
      expect(button.tagName).toBe('BUTTON')
      expect(button.getAttribute('type')).toBe('button')
    })

    it('calls onClick when an interactive card is pressed', () => {
      const onClick = vi.fn<() => void>()
      const view = render(
        <Card interactive onClick={onClick}>
          content
        </Card>,
      )
      view.getByRole('button').click()
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('renders no ripple surface when it is not interactive', () => {
      const view = render(<Card>content</Card>)
      expect(
        view.container.querySelector('span[aria-hidden="true"]'),
      ).toBeNull()
    })

    it('renders a ripple surface when it is interactive', () => {
      const view = render(<Card interactive>content</Card>)
      expect(
        view.container.querySelector('span[aria-hidden="true"]'),
      ).not.toBeNull()
    })
  })

  describe('render', () => {
    it('renders the element it is given instead of the default', () => {
      const view = render(<Card render={ARTICLE}>content</Card>)

      expect(view.container.firstElementChild?.tagName).toBe('ARTICLE')
    })

    it('renders an interactive card as an anchor when given one', () => {
      const view = render(
        <Card interactive render={EXAMPLE_LINK}>
          content
        </Card>,
      )
      const link = view.getByRole('link')

      expect(link.tagName).toBe('A')
      expect(link.getAttribute('href')).toBe('https://example.com')
    })

    // The reason Card reaches for useRender rather than React Aria's Button,
    // whose useButton stamps role="button" onto any non-native element. A
    // card that navigates should be announced as a link and activate on
    // Enter alone, not answer to Space as a button does.
    it('leaves a link card announced as a link, not a button', () => {
      const view = render(
        <Card interactive render={EXAMPLE_LINK}>
          content
        </Card>,
      )

      expect(view.queryByRole('button')).toBeNull()
      expect(view.getByRole('link').getAttribute('role')).toBeNull()
    })

    // `type` on an <a> is a hint about the MIME type of what it links to, so
    // carrying the button default across would be actively misleading.
    it('does not put a button type on an element it did not choose', () => {
      const view = render(
        <Card interactive render={EXAMPLE_LINK}>
          content
        </Card>,
      )

      expect(view.getByRole('link').hasAttribute('type')).toBe(false)
    })

    it('still ripples and takes the interactive styling as a link', () => {
      const view = render(
        <Card interactive render={EXAMPLE_LINK}>
          content
        </Card>,
      )

      expect(
        view.container.querySelector('span[aria-hidden="true"]'),
      ).not.toBeNull()
      expect(getComputedStyle(view.getByRole('link')).cursor).toBe('pointer')
    })

    // The UA gives an anchor a link colour and an underline, neither of which
    // belongs on a surface holding a whole card's worth of content.
    it('strips the underline a link would otherwise arrive with', () => {
      const view = render(<Card render={EXAMPLE_LINK}>content</Card>)

      expect(getComputedStyle(view.getByRole('link')).textDecorationLine).toBe(
        'none',
      )
    })
  })

  describe('pointer handlers', () => {
    // Ripple's handlers used to be spread and then overwritten by the call
    // site's, so a card given its own onPointerDown stopped rippling. They
    // are merged now, and both have to run.
    it('keeps rippling when the call site supplies its own handler', () => {
      const onPointerDown = vi.fn<() => void>()
      const view = render(
        <Card interactive onPointerDown={onPointerDown}>
          content
        </Card>,
      )

      pressWithMouse(view.getByRole('button'))

      expect(onPointerDown).toHaveBeenCalledTimes(1)
      expect(isPressed(view.container)).toBe(true)
    })
  })

  describe('variants', () => {
    it('gives each variant its own surface', () => {
      const expected = {
        elevated: probe(
          <div
            data-testid="probe"
            {...stylex.props(probeStyles.surfaceContainerLow)}
          />,
        ).background,
        filled: probe(
          <div
            data-testid="probe"
            {...stylex.props(probeStyles.surfaceContainerHighest)}
          />,
        ).background,
        outlined: probe(
          <div data-testid="probe" {...stylex.props(probeStyles.surface)} />,
        ).background,
      }
      // Guards the comparisons: three roles resolving to one colour would let
      // every assertion below pass without proving anything.
      expect(new Set(Object.values(expected)).size).toBe(3)

      for (const variant of ['elevated', 'filled', 'outlined'] as const) {
        const view = render(<Card variant={variant}>content</Card>)
        expect(getComputedStyle(cardIn(view.container)).backgroundColor).toBe(
          expected[variant],
        )
        view.unmount()
      }
    })

    it('draws a border on the outlined variant only', () => {
      const borderColor = probe(
        <div
          data-testid="probe"
          {...stylex.props(probeStyles.outlineVariant)}
        />,
      ).color

      const outlined = render(<Card variant="outlined">content</Card>)
      const outlinedStyle = getComputedStyle(cardIn(outlined.container))
      expect(outlinedStyle.borderTopWidth).toBe('1px')
      expect(outlinedStyle.borderTopColor).toBe(borderColor)
      outlined.unmount()

      const elevated = render(<Card variant="elevated">content</Card>)
      expect(getComputedStyle(cardIn(elevated.container)).borderTopWidth).toBe(
        '0px',
      )
    })

    it('casts a shadow on the elevated variant only', () => {
      const elevated = render(<Card variant="elevated">content</Card>)
      const shadow = getComputedStyle(cardIn(elevated.container)).boxShadow
      expect(shadow).not.toBe('none')
      elevated.unmount()

      const filled = render(<Card variant="filled">content</Card>)
      expect(getComputedStyle(cardIn(filled.container)).boxShadow).toBe('none')
    })
  })

  describe('shape', () => {
    // A child that reaches the card's edges is square where the card is
    // round, so its background — a row's hover tint, a ripple — paints over
    // the corner arcs unless the card clips. Asserted together with the
    // radius, since clipping only matters while there is a corner to clip to.
    // `clip` rather than `hidden`, for the reason the column tests give.
    it('clips its contents to its rounded corners', () => {
      const view = render(<Card padding="none">content</Card>)
      const computed = getComputedStyle(cardIn(view.container))
      expect(computed.overflow).toBe('clip')
      expect(computed.borderRadius).not.toBe('0px')
    })

    // The corner is the cards spec page's 12dp, the medium shape, pinned to
    // the token rather than the number so a retuned scale moves it too.
    it('rounds its corners to the medium shape', () => {
      const expected = probe(
        <div data-testid="probe" {...stylex.props(probeStyles.corner)} />,
      ).borderRadius
      const view = render(<Card>content</Card>)
      expect(getComputedStyle(cardIn(view.container)).borderRadius).toBe(
        expected,
      )
      expect(expected).not.toBe('0px')
    })
  })

  describe('in a column', () => {
    // Under `overflow: hidden` the card was a scroll container, whose
    // automatic minimum size as a flex item is zero, so it was the item that
    // gave way: it shrank to the column and hid the rest of itself, and the
    // column, with nothing left to overflow, never scrolled.
    it('keeps its full height in a column too short for it', () => {
      const view = render(
        <div data-testid="column" {...stylex.props(columnStyles.column)}>
          <Card padding="none">
            <div
              data-testid="content"
              {...stylex.props(columnStyles.content)}
            />
          </Card>
        </div>,
      )
      const column = view.getByTestId('column')
      const content = view.getByTestId('content')
      // Guards the comparisons: in a column with room to spare, the card
      // keeps its height without ever having been asked to give way.
      expect(column.clientHeight).toBeLessThan(content.offsetHeight)

      expect(cardIn(column).offsetHeight).toBe(content.offsetHeight)
      expect(column.scrollHeight).toBeGreaterThan(column.clientHeight)
    })

    // The way out the component's comment names, for a card that scrolls
    // content of its own. Pinned so that nothing the card sets on itself
    // comes to stand in the way of it.
    it('gives way when its minimum size is zeroed', () => {
      const view = render(
        <div data-testid="column" {...stylex.props(columnStyles.column)}>
          <Card padding="none" {...stylex.props(columnStyles.giveWay)}>
            <div {...stylex.props(columnStyles.content)} />
          </Card>
        </div>,
      )
      const column = view.getByTestId('column')

      expect(cardIn(column).offsetHeight).toBe(column.clientHeight)
    })
  })

  // A row of cards stretches each to the tallest, and a <button> centres its
  // content top to bottom on its own, so an interactive card drew its
  // content in the middle where a static one draws it at the top.
  describe('stretched taller than its content', () => {
    it('starts the content under the padding whatever the element', () => {
      const offsets = [
        <Card key="static" {...stylex.props(stretchedStyles.tall)}>
          {stretchedContent()}
        </Card>,
        <Card interactive key="button" {...stylex.props(stretchedStyles.tall)}>
          {stretchedContent()}
        </Card>,
        <Card
          interactive
          key="anchor"
          render={EXAMPLE_LINK}
          {...stylex.props(stretchedStyles.tall)}
        >
          {stretchedContent()}
        </Card>,
      ].map((card) => {
        // One at a time, since each case names its children the same.
        const view = render(card)
        const offset = firstOffset(view)
        view.unmount()
        return offset
      })

      // The padding's 16 and the paragraph's own 16 above it, in every one.
      expect(offsets).toEqual([32, 32, 32])
    })

    // Laid out as a block, as the static card is, rather than as a flex or
    // grid container, which would put each inline child on a line of its own.
    it('keeps inline content on one line', () => {
      const view = render(
        <Card interactive {...stylex.props(stretchedStyles.tall)}>
          {stretchedContent()}
        </Card>,
      )
      const line = view.getByTestId('line').getBoundingClientRect()
      const inline = view.getByTestId('inline').getBoundingClientRect()

      expect(inline.top).toBe(line.top)
    })
  })

  describe('padding', () => {
    it('pads its contents by default', () => {
      const expected = probe(
        <div data-testid="probe" {...stylex.props(probeStyles.padding)} />,
      ).padding
      const view = render(<Card>content</Card>)
      expect(getComputedStyle(cardIn(view.container)).paddingTop).toBe(expected)
      expect(expected).not.toBe('0px')
    })

    // This is what makes the design's bordered list container possible: rows
    // reach the card's edges and the rules between them span its full width.
    it('drops its padding entirely when asked', () => {
      const view = render(<Card padding="none">content</Card>)
      const computed = getComputedStyle(cardIn(view.container))
      expect(computed.paddingTop).toBe('0px')
      expect(computed.paddingLeft).toBe('0px')
    })
  })
})
