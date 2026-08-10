import * as stylex from '@stylexjs/stylex'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'

import Sheet from '.'
import { colors } from '../../tokens/design.tokens.stylex'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for without
// depending on the browser having applied a rule these tests are the first
// thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  scrim: {
    backgroundColor: `color-mix(in srgb, ${colors.scrim} 32%, transparent)`,
  },
  surface: { backgroundColor: colors.surfaceContainerLow },
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
  scrim: classesOf(stylex.props(probeStyles.scrim)),
  surface: classesOf(stylex.props(probeStyles.surface)),
}

// The runner's own viewport, restored after any test that changes it. It sits
// at 414px by default — below the medium breakpoint — so every test that does
// not say otherwise is looking at the bottom-sheet presentation.
const DEFAULT_VIEWPORT = {
  height: window.innerHeight,
  width: window.innerWidth,
}

// Reads the four corners as the browser resolved them. Which two are rounded
// is the whole difference between the two presentations, so this is what
// proves the media query switched rather than that the declaration exists.
function cornersOf(element: Element) {
  const style = getComputedStyle(element)
  return {
    bottomLeft: style.borderBottomLeftRadius,
    bottomRight: style.borderBottomRightRadius,
    topLeft: style.borderTopLeftRadius,
    topRight: style.borderTopRightRadius,
  }
}

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

function setup(props: Partial<Parameters<typeof Sheet>[0]> = {}) {
  const view = render(
    <Sheet defaultOpen {...props}>
      <Sheet.Trigger>Open</Sheet.Trigger>
      <Sheet.Content>
        <Sheet.Header>
          <Sheet.Title>Headline</Sheet.Title>
          <Sheet.Close aria-label="Close">×</Sheet.Close>
        </Sheet.Header>
        <Sheet.Body>Supporting line</Sheet.Body>
        <Sheet.Footer>
          <Sheet.Close>Cancel</Sheet.Close>
        </Sheet.Footer>
      </Sheet.Content>
    </Sheet>,
  )
  return view
}

describe('sheet', () => {
  describe('semantics', () => {
    // The roles are the reason this wraps Base UI rather than styling a fixed
    // <div>: a dialog traps focus and announces itself, and a positioned div
    // does neither.
    it('renders a dialog named by its title', () => {
      const view = setup()
      const dialog = view.getByRole('dialog')

      expect(dialog.getAttribute('aria-labelledby')).toBe(
        view.getByText('Headline').id,
      )
    })

    it('renders nothing until it is open', () => {
      const view = render(
        <Sheet>
          <Sheet.Trigger>Open</Sheet.Trigger>
          <Sheet.Content>
            <Sheet.Title>Headline</Sheet.Title>
          </Sheet.Content>
        </Sheet>,
      )
      expect(view.queryByRole('dialog')).toBeNull()
    })

    it('opens from its trigger', async () => {
      const view = render(
        <Sheet>
          <Sheet.Trigger>Open</Sheet.Trigger>
          <Sheet.Content>
            <Sheet.Title>Headline</Sheet.Title>
          </Sheet.Content>
        </Sheet>,
      )
      fireEvent.click(view.getByRole('button', { name: 'Open' }))
      await waitFor(() => {
        expect(view.getByRole('dialog')).not.toBeNull()
      })
    })
  })

  describe('dismissal', () => {
    it('closes from any Sheet.Close, wherever it sits', async () => {
      const view = setup()
      fireEvent.click(view.getByRole('button', { name: 'Cancel' }))
      await waitFor(() => {
        expect(view.queryByRole('dialog')).toBeNull()
      })
    })

    it('closes on Escape', async () => {
      const view = setup()
      fireEvent.keyDown(view.getByRole('dialog'), { key: 'Escape' })
      await waitFor(() => {
        expect(view.queryByRole('dialog')).toBeNull()
      })
    })

    // Controlled means the call site owns the state: closing reports it and
    // nothing moves until the prop comes back different.
    it('does not close on its own when controlled', async () => {
      const onOpenChange = vi.fn<() => void>()
      const view = setup({ onOpenChange, open: true })

      fireEvent.click(view.getByRole('button', { name: 'Cancel' }))
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledTimes(1)
      })
      expect(view.getByRole('dialog')).not.toBeNull()
    })
  })

  describe('appearance', () => {
    it('draws the panel on the surface container role', () => {
      const view = setup()
      expect(hasClasses(view.getByRole('dialog'), CLASSES.surface)).toBe(true)
    })

    // The scrim is a sibling of the panel rather than a parent, so it is
    // found through the portal root rather than from the dialog.
    it('lays a scrim behind the panel', () => {
      const view = setup()
      const scrim = view
        .getByRole('dialog')
        .parentElement?.querySelector('[data-open]:not([role=dialog])')

      expect(scrim).not.toBeNull()
      expect(hasClasses(scrim!, CLASSES.scrim)).toBe(true)
    })
  })

  // The component is a responsive pair, and the runner's viewport decides
  // which half is on show — so these are the only tests that resize it.
  describe('presentation', () => {
    afterEach(async () => {
      await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
    })

    it('is a side sheet above the medium breakpoint', async () => {
      await page.viewport(1024, 768)
      const view = setup()
      const dialog = view.getByRole('dialog')

      expect(getComputedStyle(dialog).inlineSize).toBe('400px')
      // Rounded down the content-facing edge, square where it meets the edge
      // of the screen.
      expect(cornersOf(dialog)).toEqual({
        bottomLeft: '16px',
        bottomRight: '0px',
        topLeft: '16px',
        topRight: '0px',
      })
    })

    it('is a bottom sheet below it', async () => {
      await page.viewport(375, 812)
      const view = setup()
      const dialog = view.getByRole('dialog')

      expect(getComputedStyle(dialog).inlineSize).toBe('375px')
      expect(cornersOf(dialog)).toEqual({
        bottomLeft: '0px',
        bottomRight: '0px',
        topLeft: '28px',
        topRight: '28px',
      })
    })

    // Both sizes have to carry a width of their own, or `styles[size]`
    // resolves to nothing and the panel collapses onto its content. Only
    // visible on the side sheet, since the bottom sheet is full width either
    // way.
    it.each([
      ['md', '400px'],
      ['sm', '320px'],
    ] as const)(
      'gives the %s side sheet a width of %s',
      async (size, width) => {
        await page.viewport(1024, 768)
        const view = setup({ size })

        expect(getComputedStyle(view.getByRole('dialog')).inlineSize).toBe(
          width,
        )
      },
    )
  })
})
