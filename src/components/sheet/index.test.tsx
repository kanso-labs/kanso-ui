import * as stylex from '@stylexjs/stylex'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'

import Sheet from '.'
import { colors } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import IconButton from '../icon-button'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for without
// depending on the browser having applied a rule these tests are the first
// thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  handleBar: { backgroundColor: colors.onSurfaceVariant },
  headline: { color: colors.onSurfaceVariant },
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
  handleBar: classesOf(stylex.props(probeStyles.handleBar)),
  headline: classesOf(stylex.props(probeStyles.headline)),
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

/** The panel around the element with the dialog role, which is what is sized and shaped. */
function panelOf(dialog: HTMLElement) {
  const panel = dialog.parentElement
  if (!panel) {
    throw new Error('expected the dialog to sit inside its panel')
  }
  return panel
}

function setup(props: Partial<Parameters<typeof Sheet>[0]> = {}) {
  const view = render(
    <Sheet defaultOpen {...props}>
      <Button>Open</Button>
      <Sheet.Content>
        <Sheet.Handle data-testid="handle" />
        <Sheet.Header>
          <Sheet.Title>Headline</Sheet.Title>
          <IconButton aria-label="Close" slot="close">
            ×
          </IconButton>
        </Sheet.Header>
        <Sheet.Body>Supporting line</Sheet.Body>
        <Sheet.Footer>
          <Button slot="close">Cancel</Button>
        </Sheet.Footer>
      </Sheet.Content>
    </Sheet>,
  )
  return view
}

describe('sheet', () => {
  describe('semantics', () => {
    // The roles are the reason this wraps React Aria rather than styling a fixed
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
          <Button>Open</Button>
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
          <Button>Open</Button>
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
    it('closes from any slot="close" button, wherever it sits', async () => {
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
      const view = setup({ isOpen: true, onOpenChange })

      fireEvent.click(view.getByRole('button', { name: 'Cancel' }))
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledTimes(1)
      })
      expect(view.getByRole('dialog')).not.toBeNull()
    })
  })

  describe('appearance', () => {
    // React Aria nests the three: the dialog sits inside the panel, which
    // sits inside the scrim — so both are reached by walking up from the
    // element that carries the role.
    it('draws the panel on the surface container role', () => {
      const view = setup()
      expect(
        hasClasses(panelOf(view.getByRole('dialog')), CLASSES.surface),
      ).toBe(true)
    })

    it('lays a scrim behind the panel', () => {
      const view = setup()
      const scrim = panelOf(view.getByRole('dialog')).parentElement

      expect(scrim).not.toBeNull()
      expect(hasClasses(scrim!, CLASSES.scrim)).toBe(true)
    })

    it('sets the headline in the on surface variant role', () => {
      const view = setup()
      expect(hasClasses(view.getByText('Headline'), CLASSES.headline)).toBe(
        true,
      )
    })
  })

  // The side sheets page's measurements, read as the browser resolved them
  // rather than as classes, since a padding is a number and not a role.
  describe('layout', () => {
    it('insets the header, body and footer by 24', () => {
      const view = setup()
      const parts = [
        view.getByText('Headline').parentElement!,
        view.getByText('Supporting line'),
        view.getByRole('button', { name: 'Cancel' }).parentElement!,
      ]

      for (const part of parts) {
        const style = getComputedStyle(part)
        expect(style.paddingInlineStart).toBe('24px')
        expect(style.paddingInlineEnd).toBe('24px')
      }
    })

    // The page's bottom actions area: 72 tall, 16 above the buttons and 24
    // below, starting at the leading edge. The 72 is a floor, since those
    // paddings around a 40px button already come to 80 — 81 with the divider
    // the footer draws along its top.
    it('starts the actions at the leading edge of a 72 area', () => {
      const view = setup()
      const footer = getComputedStyle(
        view.getByRole('button', { name: 'Cancel' }).parentElement!,
      )

      expect(footer.justifyContent).toBe('flex-start')
      expect(footer.minHeight).toBe('72px')
      expect(footer.paddingTop).toBe('16px')
      expect(footer.paddingBottom).toBe('24px')
      expect(footer.height).toBe('81px')
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
      const panel = panelOf(view.getByRole('dialog'))

      expect(getComputedStyle(panel).inlineSize).toBe('400px')
      expect(getComputedStyle(panel).maxHeight).toBe('none')
      // Rounded down the content-facing edge, square where it meets the edge
      // of the screen.
      expect(cornersOf(panel)).toEqual({
        bottomLeft: '16px',
        bottomRight: '0px',
        topLeft: '16px',
        topRight: '0px',
      })
    })

    it('is a bottom sheet below it', async () => {
      await page.viewport(375, 812)
      const view = setup()
      const panel = panelOf(view.getByRole('dialog'))

      expect(getComputedStyle(panel).inlineSize).toBe('375px')
      // Only as tall as its content, up to the bottom sheets page's 72 of top
      // margin.
      expect(getComputedStyle(panel).maxHeight).toBe('740px')
      expect(cornersOf(panel)).toEqual({
        bottomLeft: '0px',
        bottomRight: '0px',
        topLeft: '28px',
        topRight: '28px',
      })
    })
  })

  // The bottom sheets page's element, so it is drawn on that presentation
  // alone.
  describe('the drag handle', () => {
    afterEach(async () => {
      await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
    })

    it('draws nothing on the side sheet', async () => {
      await page.viewport(1024, 768)
      const view = setup()

      expect(getComputedStyle(view.getByTestId('handle')).display).toBe('none')
    })

    // The page's bar: 32 by 4 in on surface variant, centred, with 22 above
    // and below it.
    it('draws the page bar on the bottom sheet', async () => {
      await page.viewport(375, 812)
      const view = setup()
      const handle = view.getByTestId('handle')
      const bar = handle.firstElementChild

      if (!(bar instanceof HTMLElement)) {
        throw new Error('expected the handle to draw a bar')
      }

      expect(getComputedStyle(handle).display).toBe('flex')
      expect(getComputedStyle(handle).paddingTop).toBe('22px')
      expect(getComputedStyle(handle).paddingBottom).toBe('22px')
      expect(bar.getBoundingClientRect().width).toBe(32)
      expect(bar.getBoundingClientRect().height).toBe(4)
      expect(hasClasses(bar, CLASSES.handleBar)).toBe(true)

      // Centred across the panel rather than sitting at one edge.
      const room = panelOf(view.getByRole('dialog')).getBoundingClientRect()
      const box = bar.getBoundingClientRect()
      expect(Math.round(box.left - room.left)).toBe(
        Math.round(room.right - box.right),
      )
    })

    // Decoration rather than a control: it does nothing, so a screen reader
    // is not told about it.
    it('is hidden from assistive technology', async () => {
      await page.viewport(375, 812)
      const view = setup()

      expect(view.getByTestId('handle').getAttribute('aria-hidden')).toBe(
        'true',
      )
      expect(view.queryAllByRole('separator')).toHaveLength(0)
    })
  })
})
