import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { I18nProvider } from 'react-aria-components'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'

import type { SearchViewContentProps, SearchViewProps } from '.'

import SearchView from '.'
import { declarationsHeld } from '../../styles/stylesheet.testing'
import { colors } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import ListBox from '../list-box'

const probeStyles = stylex.create({
  container: { backgroundColor: colors.surfaceContainerHigh },
  divider: { backgroundColor: colors.outline },
  // Taller than any window, so the page scrolls.
  tall: { blockSize: '2000px' },
})

function classesOf(props: { className?: string | undefined }) {
  const classes = (props.className ?? '').split(' ').filter(Boolean)
  // An empty list would make every `every` below vacuously true.
  if (classes.length === 0) {
    throw new Error('expected the probe style to generate at least one class')
  }
  return classes
}

const CLASSES = {
  container: classesOf(stylex.props(probeStyles.container)),
  divider: classesOf(stylex.props(probeStyles.divider)),
}

// The runner's own viewport, restored after any test that changes it. It
// sits below the medium breakpoint, so a test that does not say otherwise is
// looking at the full-screen view.
const DEFAULT_VIEWPORT = {
  height: window.innerHeight,
  width: window.innerWidth,
}

const FORCED_COLORS = 'forced-colors: active'

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

// The header: the row the back button sits in.
function headerOf(view: ReturnType<typeof setup>) {
  const header = view
    .getByRole('button', { name: 'Back' })
    .closest('div:not([role])')
  if (!(header instanceof HTMLElement)) {
    throw new Error('expected the back button to sit in a header')
  }
  return header
}

// Opens the view and plays its entry out, so a test measures the view where
// it settles rather than part-way through its scale.
async function open(view: ReturnType<typeof setup>) {
  fireEvent.click(view.trigger)
  await waitFor(() => {
    expect(view.getByRole('dialog')).not.toBeNull()
  })
  const dialog = view.getByRole('dialog')
  settle(surfaceOf(dialog))
  return dialog
}

function settle(element: Element) {
  for (const animation of element.getAnimations({ subtree: true })) {
    animation.finish()
  }
}

function setup(
  props: Partial<SearchViewProps> = {},
  content: Partial<SearchViewContentProps> = {},
) {
  const view = render(
    <SearchView {...props}>
      <Button>Open</Button>
      <SearchView.Content label="Search" placeholder="Search" {...content}>
        <ListBox aria-label="Results">
          <ListBox.Item id="first">First item</ListBox.Item>
          <ListBox.Item id="second">Second item</ListBox.Item>
          <ListBox.Item id="third">Third item</ListBox.Item>
        </ListBox>
      </SearchView.Content>
    </SearchView>,
  )
  return { ...view, trigger: view.getByRole('button', { name: 'Open' }) }
}

// The surface React Aria positions: the element around the dialog.
function surfaceOf(dialog: HTMLElement) {
  const surface = dialog.parentElement
  if (surface === null) {
    throw new Error('expected the dialog to sit in a surface')
  }
  return surface
}

describe('search view', () => {
  afterEach(async () => {
    await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
  })

  describe('semantics', () => {
    it('opens a dialog named by its label from the button inside it', async () => {
      const view = setup()
      expect(view.queryByRole('dialog')).toBeNull()

      const dialog = await open(view)

      expect(dialog).toHaveAccessibleName('Search')
    })

    it('names its input and its back button', async () => {
      const view = setup()
      await open(view)

      expect(view.getByRole('searchbox', { name: 'Search' })).not.toBeNull()
      expect(view.getByRole('button', { name: 'Back' })).not.toBeNull()
    })

    // The library's own word, in the reader's locale, unless the call site
    // says otherwise.
    it('names the back button in the reader locale', () => {
      const view = render(
        <I18nProvider locale="fr-FR">
          <SearchView defaultOpen>
            <Button>Open</Button>
            <SearchView.Content label="Search">
              <ListBox aria-label="Results">
                <ListBox.Item id="first">First item</ListBox.Item>
              </ListBox>
            </SearchView.Content>
          </SearchView>
        </I18nProvider>,
      )

      expect(view.getByRole('button', { name: 'Retour' })).not.toBeNull()
    })

    it('takes a back button name of its own', async () => {
      const view = setup({}, { backLabel: 'Close search' })
      await open(view)

      expect(view.getByRole('button', { name: 'Close search' })).not.toBeNull()
    })

    // An app scoping its theme to a subtree points the view at an element
    // inside it, or the view renders outside the theme.
    it('portals into the container it is given', () => {
      const container = document.createElement('div')
      document.body.append(container)
      try {
        render(
          <SearchView defaultOpen>
            <Button>Open</Button>
            <SearchView.Content container={container} label="Search">
              <ListBox aria-label="Results">
                <ListBox.Item id="first">First item</ListBox.Item>
              </ListBox>
            </SearchView.Content>
          </SearchView>,
        )

        expect(container.querySelector('[role="dialog"]')).not.toBeNull()
      } finally {
        container.remove()
      }
    })

    // The view opens to be typed into, rather than on the back button the
    // dialog would otherwise focus first.
    it('focuses the input when it opens', async () => {
      const view = setup()
      await open(view)

      await waitFor(() => {
        expect(view.getByRole('searchbox')).toHaveFocus()
      })
    })
  })

  describe('searching', () => {
    it('narrows the results as it is typed', async () => {
      const view = setup()
      await open(view)
      expect(view.getAllByRole('option')).toHaveLength(3)

      act(() => {
        fireEvent.change(view.getByRole('searchbox'), {
          target: { value: 'Sec' },
        })
      })

      await waitFor(() => {
        expect(view.getAllByRole('option')).toHaveLength(1)
      })
      expect(view.getByRole('option', { name: 'Second item' })).not.toBeNull()
    })

    it('draws the clear button while the input holds something, and clears it', async () => {
      const view = setup()
      await open(view)
      expect(view.queryByRole('button', { name: 'Clear search' })).toBeNull()

      act(() => {
        fireEvent.change(view.getByRole('searchbox'), {
          target: { value: 'Sec' },
        })
      })
      fireEvent.click(view.getByRole('button', { name: 'Clear search' }))

      expect(view.getByRole('searchbox')).toHaveValue('')
      await waitFor(() => {
        expect(view.getAllByRole('option')).toHaveLength(3)
      })
    })

    it('keeps what was typed when the call site controls it', async () => {
      const onInputChange = vi.fn<(value: string) => void>()
      const view = setup({}, { inputValue: 'First', onInputChange })
      await open(view)

      act(() => {
        fireEvent.change(view.getByRole('searchbox'), {
          target: { value: 'Firstly' },
        })
      })

      expect(onInputChange).toHaveBeenCalledWith('Firstly')
      expect(view.getByRole('searchbox')).toHaveValue('First')
    })
  })

  describe('closing', () => {
    it('closes from the back button', async () => {
      const view = setup()
      await open(view)

      fireEvent.click(view.getByRole('button', { name: 'Back' }))

      await waitFor(() => {
        expect(view.queryByRole('dialog')).toBeNull()
      })
    })

    it('closes on Escape', async () => {
      const view = setup()
      await open(view)

      fireEvent.keyDown(view.getByRole('searchbox'), { key: 'Escape' })

      await waitFor(() => {
        expect(view.queryByRole('dialog')).toBeNull()
      })
    })

    // React Aria's search field takes the first Escape to clear what was
    // typed, so a second one is what closes the view.
    it('clears what was typed on the first Escape, and closes on the next', async () => {
      const view = setup()
      await open(view)
      const input = view.getByRole('searchbox')
      act(() => {
        fireEvent.change(input, { target: { value: 'Sec' } })
      })

      fireEvent.keyDown(input, { key: 'Escape' })
      expect(input).toHaveValue('')
      expect(view.getByRole('dialog')).not.toBeNull()

      fireEvent.keyDown(input, { key: 'Escape' })
      await waitFor(() => {
        expect(view.queryByRole('dialog')).toBeNull()
      })
    })

    it('stays as the call site holds it when controlled', () => {
      const onOpenChange = vi.fn<(isOpen: boolean) => void>()
      const view = setup({ isOpen: true, onOpenChange })

      fireEvent.click(view.getByRole('button', { name: 'Back' }))

      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(view.getByRole('dialog')).not.toBeNull()
    })
  })

  // The page's two forms, by the window's width: docked under what opened it
  // above the medium breakpoint, full screen below it.
  describe('forms', () => {
    it('docks under what opened it above the medium breakpoint', async () => {
      await page.viewport(1024, 768)
      const view = setup()
      const surface = surfaceOf(await open(view))
      const box = surface.getBoundingClientRect()
      const trigger = view.trigger.getBoundingClientRect()

      expect(getComputedStyle(surface).borderTopLeftRadius).toBe('28px')
      expect(box.top - trigger.bottom).toBeCloseTo(8, 0)
      // Wider than the button that opened it, at the page's 360dp floor.
      expect(box.width).toBe(360)
      expect(headerOf(view).getBoundingClientRect().height).toBe(56)
    })

    // Read with the page scrolled, since a view placed against the page
    // rather than the window lands in the same place on an unscrolled one.
    it('fills the window below it, wherever the page is scrolled to', async () => {
      await page.viewport(375, 812)
      const spacer = render(<div {...stylex.props(probeStyles.tall)} />)
      const view = setup()
      window.scrollTo(0, 600)
      try {
        const surface = surfaceOf(await open(view))
        const box = surface.getBoundingClientRect()

        expect(window.scrollY).toBeGreaterThan(0)
        expect(getComputedStyle(surface).borderTopLeftRadius).toBe('0px')
        expect([box.left, box.top, box.width, box.height]).toEqual([
          0, 0, 375, 812,
        ])
        expect(headerOf(view).getBoundingClientRect().height).toBe(72)
      } finally {
        window.scrollTo(0, 0)
        spacer.unmount()
      }
    })
  })

  describe('appearance', () => {
    it('draws on surface container high, the header over an outline divider', async () => {
      const view = setup()
      const dialog = await open(view)
      const divider = dialog.querySelector('hr')
      if (divider === null) {
        throw new Error('expected the view to draw a divider')
      }

      expect(hasClasses(surfaceOf(dialog), CLASSES.container)).toBe(true)
      expect(hasClasses(divider, CLASSES.divider)).toBe(true)
      expect(divider.getBoundingClientRect().height).toBe(1)
    })

    // The page's search bar puts its magnifier 28dp in and its text at 68dp,
    // and the view's header puts its back icon and its text there too.
    it('lines its icons and text up with the search bar', async () => {
      const view = setup()
      await open(view)
      const header = headerOf(view).getBoundingClientRect()
      const back = view
        .getByRole('button', { name: 'Back' })
        .querySelector('svg')
        ?.getBoundingClientRect()
      const input = view.getByRole('searchbox').getBoundingClientRect()

      expect((back?.left ?? 0) - header.left).toBe(28)
      expect(input.left - header.left).toBe(68)
    })

    // Back points at the start, so it turns over with the text. React Aria's
    // popover takes its direction from the locale rather than the page.
    it('turns the back arrow over under right-to-left', () => {
      const view = render(
        <I18nProvider locale="ar-EG">
          <SearchView defaultOpen>
            <Button>Open</Button>
            <SearchView.Content backLabel="Back" label="Search">
              <ListBox aria-label="Results">
                <ListBox.Item id="first">First item</ListBox.Item>
              </ListBox>
            </SearchView.Content>
          </SearchView>
        </I18nProvider>,
      )
      const glyph = view
        .getByRole('button', { name: 'Back' })
        .querySelector('svg')
      if (glyph === null) {
        throw new Error('expected the back button to draw a glyph')
      }

      expect(getComputedStyle(glyph).transform).toBe(
        'matrix(-1, 0, 0, 1, 0, 0)',
      )
    })

    // Under forced colours the fill is the page's own and the shadow is
    // gone, so the docked view's edge is a border the mode keeps.
    it('draws its edge as a border under forced colours', async () => {
      const view = setup()
      const surface = surfaceOf(await open(view))
      const rules = declarationsHeld(surface, FORCED_COLORS)

      expect(rules.get('border-top-style')).toBe('solid')
      expect(rules.get('border-top-color')).toBe('canvastext')
    })
  })
})
