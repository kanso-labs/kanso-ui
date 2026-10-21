import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { I18nProvider } from 'react-aria-components'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'

import type { SheetContentProps } from '.'

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

/**
 * Waits for the panel around `dialog` to come to rest and returns it. React
 * Aria marks the layer as entering until the scroll that brings the panel in
 * has ended, and the panel lies wholly inside the window only once it is
 * where it rests.
 */
async function arrived(dialog: HTMLElement) {
  const panel = panelOf(dialog)
  await waitFor(
    () => {
      expect(layerOf(dialog).hasAttribute('data-entering')).toBe(false)
      expect(inWindow(panel)).toBe(true)
    },
    { timeout: 3000 },
  )
  return panel
}

/**
 * Waits for a bottom sheet with snap points to come to rest at its first,
 * 200 of the panel showing, and for React Aria's observer to have looked at
 * it there, and returns the panel.
 *
 * The look matters to whatever moves the sheet next. React Aria's observer
 * reads the first entry of each batch it is handed, so a move made before
 * that look was delivered arrives in the same batch behind it, and the
 * sheet rests fully open without `data-expanded`. Two frames are what the
 * look takes to land, as for a swipe in "a swipe" above.
 */
async function collapsed(dialog: HTMLElement) {
  const panel = panelOf(dialog)
  await waitFor(
    () => {
      expect(layerOf(dialog).hasAttribute('data-entering')).toBe(false)
      expect(showing(panel)).toBe(200)
    },
    { timeout: 3000 },
  )
  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  })
  return panel
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

/**
 * Whether `element` was drawn in a box that lies wholly inside the window,
 * to a hundredth of a pixel, which is where a panel comes to rest. Not to
 * half a pixel: a smooth scroll moves the panel by fractions, so one coming
 * in from the left passes through a box a fraction of a pixel outside the
 * window on its last frames, and a read there is not a panel at rest.
 */
function inWindow(element: Element) {
  const box = element.getBoundingClientRect()
  return (
    box.left >= -0.01 &&
    box.top >= -0.01 &&
    box.right <= window.innerWidth + 0.01 &&
    box.bottom <= window.innerHeight + 0.01
  )
}

/**
 * The layer React Aria lays over the page, holding the scrim and the
 * scroller the panel sits on.
 */
function layerOf(dialog: HTMLElement) {
  const layer = scrollerOf(dialog).parentElement
  if (!layer) {
    throw new Error('expected the scroller to sit inside the layer')
  }
  return layer
}

/**
 * Waits for React Aria to have seen the panel whole in the window, which it
 * says with `data-expanded` on the layer. Its observer closes a sheet only
 * once it has seen it in the window and then out of it, so a swipe made
 * before that first look is one it never notices.
 */
async function observed(dialog: HTMLElement) {
  const panel = await arrived(dialog)
  await waitFor(
    () => {
      expect(layerOf(dialog).hasAttribute('data-expanded')).toBe(true)
    },
    { timeout: 3000 },
  )
  return panel
}

/** The panel around the element with the dialog role, which is what is sized and shaped. */
function panelOf(dialog: HTMLElement) {
  const panel = dialog.parentElement
  if (!panel) {
    throw new Error('expected the dialog to sit inside its panel')
  }
  return panel
}

/**
 * Answers the reduced-motion query as matching, and every other query the
 * way the page would, until the mocks are restored. React Aria then scrolls
 * the panel in and out in one step rather than smoothly, which is what lets
 * every case but the ones about that movement read a sheet where it rests
 * without waiting on the browser's own scroll. A stub rather than Chromium's
 * emulation, for the reason src/hooks/useRipple.test.tsx gives.
 */
function reduceMotion() {
  const matchMedia = window.matchMedia.bind(window)
  vi.spyOn(window, 'matchMedia').mockImplementation((query) =>
    matchMedia(query.includes('prefers-reduced-motion') ? 'all' : query),
  )
}

/**
 * Sizes the window and waits for the page inside it to see the new size.
 * The sheet picks its presentation from `matchMedia` as it renders, so a
 * render that lands before the resize does is drawn for the old window: a
 * side sheet where a bottom sheet was asked for, and only turned once the
 * query catches up.
 */
async function resize(width: number, height: number) {
  await page.viewport(width, height)
  await waitFor(() => {
    expect([window.innerWidth, window.innerHeight]).toEqual([width, height])
  })
}

/** The scrim, which React Aria draws in the layer ahead of the scroller. */
function scrimOf(dialog: HTMLElement) {
  const scrim = scrollerOf(dialog).previousElementSibling
  if (!(scrim instanceof HTMLElement)) {
    throw new Error('expected the scrim ahead of the scroller')
  }
  return scrim
}

/**
 * The scroller the panel sits on, which is what a swipe moves: scrolled
 * toward the edge the panel rests on, it carries the panel out of the window.
 */
function scrollerOf(dialog: HTMLElement) {
  const scroller = dialog.closest('[data-sheet-scroll]')
  if (!(scroller instanceof HTMLElement)) {
    throw new Error('expected the panel to sit on a scroller')
  }
  return scroller
}

// One word longer than a phone-width header holds, which a German compound
// easily is.
const LONG_WORD = 'Headline'.repeat(4)

/**
 * A press on the scrim, outside the panel, which is what React Aria reads as
 * outside: on whatever is drawn at a point the panel does not cover, as a
 * finger would land, once the panel has come to rest. React is let catch up
 * on either side of it, so a sheet the press closed has started leaving by
 * the time this returns, and one still resting was held open.
 */
async function pressScrim(dialog: HTMLElement) {
  const panel = await arrived(dialog)
  const box = panel.getBoundingClientRect()
  // The far side of the window from the panel, or above a bottom sheet.
  const x = box.left > window.innerWidth / 2 ? 8 : window.innerWidth - 8
  const target = document.elementFromPoint(x, 8)
  if (target === null || panel.contains(target)) {
    throw new Error('expected the scrim beside the panel')
  }
  const init = {
    button: 0,
    isPrimary: true,
    pointerId: 1,
    pointerType: 'mouse',
  }
  await settle()
  fireEvent.pointerDown(target, init)
  fireEvent.pointerUp(target, init)
  fireEvent.click(target, init)
  await settle()
}

async function settle() {
  await act(async () => {})
}

/**
 * A sheet with a handle, a header with a close button, a body and a footer
 * with a Cancel button, open from the start, in `locale`.
 */
function setup(
  props: Partial<Parameters<typeof Sheet>[0]> = {},
  content: Partial<SheetContentProps> = {},
  locale = 'en-US',
  body: ReactNode = 'Supporting line',
) {
  const view = render(
    <I18nProvider locale={locale}>
      <Sheet defaultOpen {...props}>
        <Button>Open</Button>
        <Sheet.Content {...content}>
          <Sheet.Handle data-testid="handle" />
          <Sheet.Header>
            <Sheet.Title>Headline</Sheet.Title>
            <IconButton aria-label="Close" slot="close">
              ×
            </IconButton>
          </Sheet.Header>
          <Sheet.Body data-testid="body">{body}</Sheet.Body>
          <Sheet.Footer>
            <Button slot="close">Cancel</Button>
          </Sheet.Footer>
        </Sheet.Content>
      </Sheet>
    </I18nProvider>,
  )
  return view
}

/**
 * A sheet with the given headline and actions, read once it has arrived, so
 * every box read from it is where it comes to rest.
 */
async function sheetHolding(title: string, actions: string[]) {
  const view = render(
    <Sheet defaultOpen>
      <Button>Open</Button>
      <Sheet.Content>
        <Sheet.Header>
          <Sheet.Title>{title}</Sheet.Title>
          <IconButton aria-label="Close" slot="close">
            ×
          </IconButton>
        </Sheet.Header>
        <Sheet.Body>Supporting line</Sheet.Body>
        <Sheet.Footer>
          {actions.map((label) => (
            <Button key={label} slot="close">
              {label}
            </Button>
          ))}
        </Sheet.Footer>
      </Sheet.Content>
    </Sheet>,
  )
  const panel = await arrived(view.getByRole('dialog'))
  return { panel, view }
}

/** How much of a bottom sheet's panel shows above the window's bottom edge. */
function showing(panel: Element) {
  return Math.round(window.innerHeight - panel.getBoundingClientRect().top)
}

/**
 * A sheet with no trigger: the content part on its own, holding the open
 * state `Sheet` would otherwise hold.
 */
function standalone(content: Partial<SheetContentProps> = {}) {
  return render(
    <Sheet.Content {...content}>
      <Sheet.Title>Headline</Sheet.Title>
      <Button slot="close">Cancel</Button>
    </Sheet.Content>,
  )
}

/** Whether `inner` lies wholly inside `outer`, to the subpixel. */
function within(inner: Element, outer: Element) {
  const a = inner.getBoundingClientRect()
  const b = outer.getBoundingClientRect()
  return (
    a.left >= b.left - 0.5 &&
    a.right <= b.right + 0.5 &&
    a.top >= b.top - 0.5 &&
    a.bottom <= b.bottom + 0.5
  )
}

// Sixty lines of body, far more than any viewport holds, which is what shows
// whether the body scrolls or the panel clips it.
const LONG_BODY = Array.from({ length: 60 }, (_, index) => (
  <p key={index}>Supporting line</p>
))

// Twelve, which a phone shows whole, in a panel tall enough that a snap
// point of 200 shows only its top.
const SOME_BODY = LONG_BODY.slice(0, 12)

// A collapsed height of 200 and the whole panel.
const SNAP_POINTS = [200, '100%']

/**
 * A sheet whose body runs past its panel, read once it has arrived. The body
 * takes `label` as its own name, and holds a field ahead of its lines with
 * `field`.
 */
async function longSheet({
  field = false,
  label,
}: { field?: boolean; label?: string } = {}) {
  const view = render(
    <Sheet defaultOpen>
      <Button>Open</Button>
      <Sheet.Content>
        <Sheet.Header>
          <Sheet.Title>Headline</Sheet.Title>
          <IconButton aria-label="Close" slot="close">
            ×
          </IconButton>
        </Sheet.Header>
        <Sheet.Body aria-label={label} data-testid="body">
          {field ? <input aria-label="Field" /> : null}
          {LONG_BODY}
        </Sheet.Body>
        <Sheet.Footer>
          <Button slot="close">Cancel</Button>
        </Sheet.Footer>
      </Sheet.Content>
    </Sheet>,
  )
  // It arrives from an edge, so a box read before it rests is somewhere it
  // is not going to stay.
  await arrived(view.getByRole('dialog'))
  return {
    body: view.getByTestId('body'),
    cancel: view.getByRole('button', { name: 'Cancel' }),
    close: view.getByRole('button', { name: 'Close' }),
    view,
  }
}

describe('sheet', () => {
  beforeEach(() => {
    reduceMotion()
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await resize(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
  })

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

    // React Aria's sheet has one switch for every way out of it, and these
    // two props split it as the library's other modals do: Escape follows
    // `isKeyboardDismissDisabled` alone, whatever `isDismissable` says.
    it.each([
      { closes: true, isDismissable: true, isKeyboardDismissDisabled: false },
      { closes: true, isDismissable: false, isKeyboardDismissDisabled: false },
      { closes: false, isDismissable: true, isKeyboardDismissDisabled: true },
      { closes: false, isDismissable: false, isKeyboardDismissDisabled: true },
    ])(
      'answers Escape with isDismissable={$isDismissable} and isKeyboardDismissDisabled={$isKeyboardDismissDisabled}',
      async ({ closes, ...content }) => {
        const onOpenChange = vi.fn<(isOpen: boolean) => void>()
        const view = setup({ onOpenChange }, content)

        fireEvent.keyDown(view.getByRole('dialog'), { key: 'Escape' })
        await settle()

        expect(onOpenChange.mock.calls).toEqual(closes ? [[false]] : [])
      },
    )

    // An Escape an input method is composing with ends the composition, and
    // closes nothing — React Aria's own rule, kept where the dialog answers
    // for Escape instead of React Aria.
    it('leaves an Escape that ends a composition to the input method', async () => {
      const onOpenChange = vi.fn<(isOpen: boolean) => void>()
      const view = setup({ onOpenChange }, { isDismissable: false })

      fireEvent.keyDown(view.getByRole('dialog'), {
        isComposing: true,
        key: 'Escape',
      })
      await settle()

      expect(onOpenChange).not.toHaveBeenCalled()
    })

    // React Aria answers Escape only for the overlay on top, and a sheet
    // opened inside this one is in its React tree, so its keys reach this
    // one's handler too. Here the inner sheet holds Escape and the outer one
    // would close on it.
    it('leaves an Escape in a sheet opened inside it to that sheet', async () => {
      const onOpenChange = vi.fn<(isOpen: boolean) => void>()
      const view = render(
        <Sheet defaultOpen onOpenChange={onOpenChange}>
          <Button>Open</Button>
          <Sheet.Content isDismissable={false}>
            <Sheet.Title>Headline</Sheet.Title>
            <Sheet defaultOpen>
              <Button>Open</Button>
              <Sheet.Content isDismissable={false} isKeyboardDismissDisabled>
                <Sheet.Title>Supporting line</Sheet.Title>
              </Sheet.Content>
            </Sheet>
          </Sheet.Content>
        </Sheet>,
      )

      fireEvent.keyDown(view.getByRole('dialog', { name: 'Supporting line' }), {
        key: 'Escape',
      })
      await settle()

      expect(onOpenChange).not.toHaveBeenCalled()
    })

    // The dialog answers for Escape through its `render`, so a call site's
    // own goes on rendering the element.
    it("answers Escape around a call site's own render", async () => {
      const onOpenChange = vi.fn<(isOpen: boolean) => void>()
      const view = setup(
        { onOpenChange },
        {
          isDismissable: false,
          render: (props) => <section {...props} data-testid="own" />,
        },
      )

      expect(view.getByRole('dialog')).toBe(view.getByTestId('own'))

      fireEvent.keyDown(view.getByTestId('own'), { key: 'Escape' })
      await settle()

      expect(onOpenChange.mock.calls).toEqual([[false]])
    })

    // `isDismissable` defaults to true here, where React Aria's own default is
    // false, and the prop's documentation says so. This is what holds the
    // documentation to the component.
    it('closes on a press on the scrim unless told otherwise', async () => {
      const view = setup()
      await pressScrim(view.getByRole('dialog'))
      await waitFor(() => {
        expect(view.queryByRole('dialog')).toBeNull()
      })
    })

    // The same press, so a sheet still open here was held open.
    it('stays open on a press on the scrim with isDismissable={false}', async () => {
      const onOpenChange = vi.fn<(isOpen: boolean) => void>()
      const view = setup({ onOpenChange }, { isDismissable: false })
      await pressScrim(view.getByRole('dialog'))

      expect(onOpenChange).not.toHaveBeenCalled()
      expect(view.getByRole('dialog')).not.toBeNull()
    })

    // Holding Escape is one switch of React Aria's turned off, and the scrim
    // is behind the same switch, so this is what shows the two came apart.
    it('closes on a press on the scrim with isKeyboardDismissDisabled', async () => {
      const view = setup({}, { isKeyboardDismissDisabled: true })
      await pressScrim(view.getByRole('dialog'))
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

  // React Aria's sheet sits on a scroller, and a swipe toward the edge it
  // rests on scrolls it out of the window, which closes it. Scrolling the
  // scroller there is that swipe without the finger.
  describe('a swipe', () => {
    const SWIPES = [
      {
        edge: 'the bottom',
        height: 812,
        locale: 'en-US',
        swipe: (scroller: HTMLElement) => {
          scroller.scrollTop = 0
        },
        width: 375,
      },
      {
        edge: 'the right',
        height: 768,
        locale: 'en-US',
        swipe: (scroller: HTMLElement) => {
          scroller.scrollLeft = 0
        },
        width: 1024,
      },
      {
        edge: 'the left',
        height: 768,
        locale: 'ar-EG',
        swipe: (scroller: HTMLElement) => {
          scroller.scrollLeft = scroller.scrollWidth
        },
        width: 1024,
      },
    ]

    it.each(SWIPES)(
      'toward $edge closes a sheet resting on it',
      async ({ height, locale, swipe, width }) => {
        await resize(width, height)
        const onOpenChange = vi.fn<(isOpen: boolean) => void>()
        const view = setup({ onOpenChange }, {}, locale)
        const dialog = view.getByRole('dialog')
        await observed(dialog)

        swipe(scrollerOf(dialog))

        // React Aria closes it once its observer sees the panel out of the
        // window, a frame or more after the scroll, and the panel then leaves.
        await waitFor(
          () => {
            expect(view.queryByRole('dialog')).toBeNull()
          },
          { timeout: 3000 },
        )
        expect(onOpenChange.mock.calls).toEqual([[false]])
      },
    )

    // Held where it rests, by a scroller with no room to carry it out, so
    // the same swipe moves it a pixel at most.
    it.each(SWIPES)(
      'toward $edge leaves a sheet with isDismissable={false} where it rests',
      async ({ height, locale, swipe, width }) => {
        await resize(width, height)
        const onOpenChange = vi.fn<(isOpen: boolean) => void>()
        const view = setup({ onOpenChange }, { isDismissable: false }, locale)
        const dialog = view.getByRole('dialog')
        const panel = await observed(dialog)
        const resting = panel.getBoundingClientRect()

        swipe(scrollerOf(dialog))
        // Two frames, so React Aria's observer has had its chance to see the
        // panel leave the window.
        await new Promise((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(resolve))
        })
        await settle()

        const box = panel.getBoundingClientRect()
        expect(Math.abs(box.left - resting.left)).toBeLessThanOrEqual(1)
        expect(Math.abs(box.top - resting.top)).toBeLessThanOrEqual(1)
        expect(onOpenChange).not.toHaveBeenCalled()
        expect(view.getByRole('dialog')).toBe(dialog)
      },
    )
  })

  // A sheet nothing on the page opens, such as one a route shows, is the
  // content part on its own, holding the open state the trigger would have.
  describe('without a trigger', () => {
    it('opens from isOpen, named by its title', () => {
      const view = standalone({ isOpen: true })

      expect(view.getByRole('dialog').getAttribute('aria-labelledby')).toBe(
        view.getByText('Headline').id,
      )
    })

    it('renders nothing while isOpen is false', () => {
      expect(standalone({ isOpen: false }).queryByRole('dialog')).toBeNull()
    })

    // Controlled, as through `Sheet`: closing reports it, and nothing moves
    // until the prop comes back different.
    it('reports a close from a slot="close" button to onOpenChange', async () => {
      const onOpenChange = vi.fn<(isOpen: boolean) => void>()
      const view = standalone({ isOpen: true, onOpenChange })

      fireEvent.click(view.getByRole('button', { name: 'Cancel' }))
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false)
      })
      expect(view.getByRole('dialog')).not.toBeNull()
    })

    it('closes itself when it keeps its own state', async () => {
      const view = standalone({ defaultOpen: true })

      fireEvent.keyDown(view.getByRole('dialog'), { key: 'Escape' })
      await waitFor(() => {
        expect(view.queryByRole('dialog')).toBeNull()
      })
    })

    // `Sheet` with no button inside it warns that React Aria's press
    // responder found nothing to press, which leaving it out is for.
    it('warns about nothing', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      try {
        // Open, so a quiet console is one that rendered the whole sheet.
        expect(standalone({ isOpen: true }).getByRole('dialog')).not.toBeNull()
        expect(warn).not.toHaveBeenCalled()
      } finally {
        warn.mockRestore()
      }
    })
  })

  describe('appearance', () => {
    // React Aria nests the panel inside the scroller it moves on, inside the
    // layer that also holds the scrim — so each is reached by walking out
    // from the element that carries the role.
    it('draws the panel on the surface container role', () => {
      const view = setup()
      expect(
        hasClasses(panelOf(view.getByRole('dialog')), CLASSES.surface),
      ).toBe(true)
    })

    // Behind it, which is what a press shows: one at the panel's centre
    // lands on the panel rather than on the scrim drawn under it.
    it('lays a scrim behind the panel', async () => {
      const view = setup()
      const dialog = view.getByRole('dialog')
      const panel = await arrived(dialog)
      const scrim = scrimOf(dialog)
      // React Aria makes everything outside the panel inert, the scrim among
      // it, and an inert element is passed over by a hit test wherever it is
      // painted. Taken out of that, the scrim is found at the panel's centre
      // only if it is drawn over the panel.
      scrim.inert = false
      const box = panel.getBoundingClientRect()
      const hit = document.elementFromPoint(
        box.left + box.width / 2,
        box.top + box.height / 2,
      )

      expect(hasClasses(scrim, CLASSES.scrim)).toBe(true)
      expect(hit !== null && panel.contains(hit)).toBe(true)
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
    // The scrim and the layer holding it are elements the library renders,
    // so they are border-box like every other rather than depending on a
    // reset the consumer might not have.
    it('draws its scrim border-box, over the whole window', () => {
      const view = setup()
      const dialog = view.getByRole('dialog')
      const scrim = scrimOf(dialog)
      const box = scrim.getBoundingClientRect()

      expect(getComputedStyle(layerOf(dialog)).boxSizing).toBe('border-box')
      expect(getComputedStyle(scrim).boxSizing).toBe('border-box')
      expect([box.left, box.top]).toEqual([0, 0])
      expect(box.width).toBeGreaterThanOrEqual(window.innerWidth)
      expect(box.height).toBeGreaterThanOrEqual(window.innerHeight)
    })

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
  // which half is on show.
  describe('presentation', () => {
    it('is a side sheet above the medium breakpoint', async () => {
      await resize(1024, 768)
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

    // The inline end is the right, or the left in a right-to-left locale,
    // and the rounded edge is the one facing the page in both. React Aria
    // reads the direction from the locale rather than the document, which is
    // why this sets it through `I18nProvider`.
    it.each([
      {
        corners: {
          bottomLeft: '16px',
          bottomRight: '0px',
          topLeft: '16px',
          topRight: '0px',
        },
        edge: (box: DOMRect) => box.right,
        locale: 'en-US',
        resting: 1024,
      },
      {
        corners: {
          bottomLeft: '0px',
          bottomRight: '16px',
          topLeft: '0px',
          topRight: '16px',
        },
        edge: (box: DOMRect) => box.left,
        locale: 'ar-EG',
        resting: 0,
      },
    ])(
      'rests a side sheet against the inline end in $locale',
      async ({ corners, edge, locale, resting }) => {
        await resize(1024, 768)
        const view = setup({}, {}, locale)
        const panel = await arrived(view.getByRole('dialog'))
        const box = panel.getBoundingClientRect()

        expect(edge(box)).toBe(resting)
        expect([box.top, box.bottom]).toEqual([0, 768])
        expect(cornersOf(panel)).toEqual(corners)
      },
    )

    // The block axis is the same in either direction, so the bottom sheet
    // is too.
    it.each(['en-US', 'ar-EG'])(
      'rests a bottom sheet on the bottom edge in %s',
      async (locale) => {
        await resize(375, 812)
        const view = setup({}, {}, locale)
        const panel = await arrived(view.getByRole('dialog'))
        const box = panel.getBoundingClientRect()

        expect([box.left, box.right, box.bottom]).toEqual([0, 375, 812])
        expect(cornersOf(panel)).toMatchObject({
          topLeft: '28px',
          topRight: '28px',
        })
      },
    )

    it('is a bottom sheet below it', async () => {
      await resize(375, 812)
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

    // A window resized across the breakpoint, or a phone turned, turns the
    // open sheet over to the other presentation, which moves along the other
    // axis. It goes on resting where that one rests rather than being left
    // where the old scroll puts it, which is out of the window.
    it('keeps an open sheet where it rests as the window crosses the breakpoint', async () => {
      await resize(1024, 768)
      const view = setup()
      const dialog = view.getByRole('dialog')
      const panel = await arrived(dialog)

      await resize(375, 812)
      await waitFor(() => {
        expect(layerOf(dialog).dataset.position).toBe('bottom')
        expect(panel.getBoundingClientRect().bottom).toBe(812)
      })

      await resize(1024, 768)
      await waitFor(() => {
        expect(layerOf(dialog).dataset.position).toBe('right')
        expect(panel.getBoundingClientRect().right).toBe(1024)
      })
      expect(view.getByRole('dialog')).toBe(dialog)
    })
  })

  // The body is the one part that scrolls: a body longer than the room
  // leaves the header and the actions where they are, and the rest of the
  // text a scroll away rather than clipped past the panel's edge.
  describe('a body longer than the room', () => {
    it.each([
      { height: 812, name: 'the bottom sheet', width: 375 },
      { height: 768, name: 'the side sheet', width: 1024 },
    ])(
      'scrolls the body of $name and keeps its actions on screen',
      async ({ height, width }) => {
        await resize(width, height)
        const { body, cancel } = await longSheet()

        expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
        body.scrollTop = 200
        expect(body.scrollTop).toBe(200)
        // A tab stop while it scrolls, so a keyboard can scroll it too.
        expect(body.tabIndex).toBe(0)
        expect(cancel.getBoundingClientRect().bottom).toBeLessThanOrEqual(
          window.innerHeight,
        )
      },
    )

    // A body that shows whole has nothing to scroll, so it is no stop at all.
    it('leaves a body that fits out of the tab order', () => {
      const view = setup()

      expect(view.getByText('Supporting line').hasAttribute('tabindex')).toBe(
        false,
      )
    })

    // While it is a tab stop it is a region named by the title, so a screen
    // reader landing on it says what it is rather than announcing a group.
    it('names a body that scrolls by the title', async () => {
      await resize(375, 812)
      const { body, view } = await longSheet()

      expect(view.getByRole('region', { name: 'Headline' })).toBe(body)
    })

    it("keeps a call site's own label on a body that scrolls", async () => {
      await resize(375, 812)
      const { body, view } = await longSheet({ label: 'Label' })

      expect(view.getByRole('region', { name: 'Label' })).toBe(body)
    })

    // A field inside is how a keyboard reaches the body and scrolls it, so
    // Tab goes from the close button straight to the field, with no stop on
    // the body between them.
    it('makes no stop of a body holding a field', async () => {
      await resize(375, 812)
      const { body, close, view } = await longSheet({ field: true })

      expect(body.hasAttribute('tabindex')).toBe(false)
      expect(body.hasAttribute('role')).toBe(false)
      act(() => {
        close.focus()
      })
      fireEvent.keyDown(close, { key: 'Tab' })
      expect(document.activeElement).toBe(
        view.getByRole('textbox', { name: 'Field' }),
      )
    })

    // A string with nowhere to break wraps, so the body has nothing to scroll
    // sideways and needs no stop for it.
    it('wraps a string with nowhere to break', async () => {
      await resize(375, 812)
      const view = render(
        <Sheet defaultOpen>
          <Button>Open</Button>
          <Sheet.Content>
            <Sheet.Header>
              <Sheet.Title>Headline</Sheet.Title>
            </Sheet.Header>
            <Sheet.Body data-testid="body">
              <p>{LONG_WORD.repeat(3)}</p>
            </Sheet.Body>
            <Sheet.Footer>
              <Button slot="close">Confirm</Button>
            </Sheet.Footer>
          </Sheet.Content>
        </Sheet>,
      )
      const body = view.getByTestId('body')

      expect(body.scrollWidth).toBe(body.clientWidth)
      expect(body.hasAttribute('tabindex')).toBe(false)
    })
  })

  // The bottom sheets page's element, so it is drawn on that presentation
  // alone.
  describe('the drag handle', () => {
    it('draws nothing on the side sheet', async () => {
      await resize(1024, 768)
      const view = setup()

      expect(getComputedStyle(view.getByTestId('handle')).display).toBe('none')
    })

    // The page's bar: 32 by 4 in on surface variant, centred, with 22 above
    // and below it.
    it('draws the page bar on the bottom sheet', async () => {
      await resize(375, 812)
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
      await resize(375, 812)
      const view = setup()

      expect(view.getByTestId('handle').getAttribute('aria-hidden')).toBe(
        'true',
      )
      expect(view.queryAllByRole('separator')).toHaveLength(0)
    })
  })

  // A bottom sheet given snap points rests at each of them: it opens at the
  // first, shows all of itself at the last, and its handle is the control
  // that moves it between them. At a phone's size, since the side sheet has
  // one width and ignores them.
  describe('snap points', () => {
    beforeEach(async () => {
      await resize(375, 812)
    })

    it('open a bottom sheet with its first showing', async () => {
      const view = setup({}, { snapPoints: SNAP_POINTS }, 'en-US', SOME_BODY)
      const dialog = view.getByRole('dialog')
      const panel = await collapsed(dialog)

      expect(panel.getBoundingClientRect().height).toBeGreaterThan(400)
      expect(layerOf(dialog).hasAttribute('data-expanded')).toBe(false)
    })

    it('rest it fully open, and expanded, at the last', async () => {
      const view = setup({}, { snapPoints: SNAP_POINTS }, 'en-US', SOME_BODY)
      const dialog = view.getByRole('dialog')
      await collapsed(dialog)
      const scroller = scrollerOf(dialog)

      scroller.scrollTop = scroller.scrollHeight

      const panel = await observed(dialog)
      expect(panel.getBoundingClientRect().bottom).toBe(window.innerHeight)
    })

    // Swiped down from the first, it goes the way a sheet without them does.
    it('close it on a swipe down from the first', async () => {
      const onOpenChange = vi.fn<(isOpen: boolean) => void>()
      const view = setup(
        { onOpenChange },
        { snapPoints: SNAP_POINTS },
        'en-US',
        SOME_BODY,
      )
      const dialog = view.getByRole('dialog')
      await collapsed(dialog)

      scrollerOf(dialog).scrollTop = 0

      await waitFor(
        () => {
          expect(view.queryByRole('dialog')).toBeNull()
        },
        { timeout: 3000 },
      )
      expect(onOpenChange.mock.calls).toEqual([[false]])
    })

    // Named, and saying whether the sheet is expanded, where without snap
    // points it is decoration hidden from assistive technology.
    it('make the handle a button, saying whether the sheet is expanded', async () => {
      const view = setup({}, { snapPoints: SNAP_POINTS }, 'en-US', SOME_BODY)
      await collapsed(view.getByRole('dialog'))
      const handle = view.getByRole('button', { name: 'Drag handle' })

      expect(handle.getAttribute('aria-expanded')).toBe('false')
      expect(view.getByTestId('handle').hasAttribute('aria-hidden')).toBe(false)
      expect(view.getByTestId('handle').contains(handle)).toBe(true)
    })

    // The page's 48 target, centred over the bar, which stays where the
    // decoration draws it: 22 below the top of a row still 48 tall.
    it("give the handle the page's 48 target around the bar", async () => {
      const view = setup({}, { snapPoints: SNAP_POINTS }, 'en-US', SOME_BODY)
      await collapsed(view.getByRole('dialog'))
      const row = view.getByTestId('handle').getBoundingClientRect()
      const handle = view.getByRole('button', { name: 'Drag handle' })
      const target = handle.getBoundingClientRect()
      const bar = handle.firstElementChild?.getBoundingClientRect()

      expect([target.width, target.height]).toEqual([48, 48])
      expect(row.height).toBe(48)
      expect(bar?.top).toBe(row.top + 22)
      expect([bar?.width, bar?.height]).toEqual([32, 4])
      expect(Math.round(target.left + target.width / 2)).toBe(
        Math.round(row.left + row.width / 2),
      )
    })

    it('move the sheet to the next on a press of the handle, and from the last back to the first', async () => {
      const onOpenChange = vi.fn<(isOpen: boolean) => void>()
      const view = setup(
        { onOpenChange },
        { snapPoints: SNAP_POINTS },
        'en-US',
        SOME_BODY,
      )
      const dialog = view.getByRole('dialog')
      await collapsed(dialog)
      const handle = view.getByRole('button', { name: 'Drag handle' })

      fireEvent.click(handle)
      await observed(dialog)
      expect(handle.getAttribute('aria-expanded')).toBe('true')

      fireEvent.click(handle)
      await collapsed(dialog)
      await waitFor(() => {
        expect(handle.getAttribute('aria-expanded')).toBe('false')
      })
      expect(onOpenChange).not.toHaveBeenCalled()
    })

    it('move it from the keyboard too', async () => {
      const view = setup({}, { snapPoints: SNAP_POINTS }, 'en-US', SOME_BODY)
      const dialog = view.getByRole('dialog')
      await collapsed(dialog)
      const handle = view.getByRole('button', { name: 'Drag handle' })

      act(() => {
        handle.focus()
      })
      fireEvent.keyDown(handle, { key: 'Enter' })
      fireEvent.keyUp(handle, { key: 'Enter' })

      await observed(dialog)
      expect(handle.getAttribute('aria-expanded')).toBe('true')
    })

    // Three, so the handle is seen to move on to the next rather than
    // between the two ends.
    it('move through each of three in turn', async () => {
      const view = setup(
        {},
        { snapPoints: [200, '50%', '100%'] },
        'en-US',
        SOME_BODY,
      )
      const dialog = view.getByRole('dialog')
      const panel = await collapsed(dialog)
      const handle = view.getByRole('button', { name: 'Drag handle' })
      const half = Math.round(panel.getBoundingClientRect().height / 2)

      fireEvent.click(handle)
      await waitFor(() => {
        expect(Math.abs(showing(panel) - half)).toBeLessThanOrEqual(1)
      })

      fireEvent.click(handle)
      await observed(dialog)

      fireEvent.click(handle)
      await collapsed(dialog)
    })

    // Short of the last, a swipe on the body moves the sheet, so the body is
    // no scroll container until the sheet is expanded.
    it('keep the body from scrolling until the sheet is expanded', async () => {
      const view = setup({}, { snapPoints: SNAP_POINTS }, 'en-US', LONG_BODY)
      const dialog = view.getByRole('dialog')
      await collapsed(dialog)
      const body = view.getByTestId('body')

      expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
      body.scrollTop = 100
      expect(body.scrollTop).toBe(0)

      fireEvent.click(view.getByRole('button', { name: 'Drag handle' }))
      await observed(dialog)

      body.scrollTop = 100
      expect(body.scrollTop).toBe(100)
    })

    it("name the handle in the locale's words, or the call site's", () => {
      const french = setup({}, { snapPoints: SNAP_POINTS }, 'fr-FR')
      expect(
        french.getByRole('button', { name: 'Poignée de déplacement' }),
      ).not.toBeNull()
      french.unmount()

      const own = render(
        <Sheet defaultOpen>
          <Button>Open</Button>
          <Sheet.Content snapPoints={SNAP_POINTS}>
            <Sheet.Handle aria-label="Label" />
            <Sheet.Title>Headline</Sheet.Title>
          </Sheet.Content>
        </Sheet>,
      )
      expect(own.getByRole('button', { name: 'Label' })).not.toBeNull()
    })

    it('leave the side sheet as it is', async () => {
      await resize(1024, 768)
      const view = setup({}, { snapPoints: SNAP_POINTS }, 'en-US', SOME_BODY)
      await observed(view.getByRole('dialog'))

      expect(document.querySelector('[data-sheet-detent]')).toBeNull()
      expect(view.getByTestId('handle').getAttribute('aria-hidden')).toBe(
        'true',
      )
      expect(view.queryByRole('button', { name: 'Drag handle' })).toBeNull()
    })
  })

  // The header and footer are sized for a one-line headline and a row of two
  // short actions. Each case here is content that runs past that on a phone,
  // which the panel's `overflow: hidden` used to clip or squeeze.
  describe('content longer than the bars', () => {
    // The headline is the part that gives way, so the close button keeps its
    // size and stays inside the panel.
    it('breaks one long word in the title rather than pushing the close button out', async () => {
      await resize(360, 640)
      const { panel, view } = await sheetHolding(LONG_WORD, ['Confirm'])
      const close = view.getByRole('button', { name: 'Close' })
      const title = view.getByRole('heading', { name: LONG_WORD })

      expect(within(title, panel)).toBe(true)
      expect(within(close, panel)).toBe(true)
      expect(close.getBoundingClientRect().width).toBe(
        close.getBoundingClientRect().height,
      )
    })

    // Two actions too long to share a row used to be squeezed onto it, each
    // label broken over two or three lines; each now keeps its one-line
    // height on a row of its own.
    it('wraps actions onto another row, each at its one-line height', async () => {
      await resize(360, 640)
      const { panel, view } = await sheetHolding('Headline', [
        'First long action label',
        'Second long action label',
      ])
      const [first, second] = [
        'First long action label',
        'Second long action label',
      ].map((name) => view.getByRole('button', { name }))

      expect(second.getBoundingClientRect().top).toBeGreaterThan(
        first.getBoundingClientRect().top,
      )
      for (const action of [first, second]) {
        expect(within(action, panel)).toBe(true)
        expect(action.getBoundingClientRect().height).toBe(40)
      }
    })
  })
})

// The panel's movement, with the reader's preference left as the page has
// it, so React Aria scrolls smoothly and these wait on the browser's own
// scroll. Kept to the few cases that are about that movement.
describe('sheet, moving', () => {
  afterEach(async () => {
    vi.restoreAllMocks()
    await resize(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
  })

  // It opens outside the window, past the edge it rests on, and scrolls in,
  // drawn across that edge on the frames between, as the panel is on its
  // way out below. A panel put straight where it rests is never drawn there.
  // Whether the scroll has started when the render returns is React Aria's
  // business: it waits two frames for a software keyboard wherever it
  // thinks one might open, so only the box is read at that point.
  it.each([
    {
      across: (box: DOMRect) =>
        box.left < window.innerWidth && box.right > window.innerWidth,
      edge: 'the right',
      height: 768,
      locale: 'en-US',
      outside: (box: DOMRect) => box.left >= window.innerWidth,
      resting: (box: DOMRect) => box.right === window.innerWidth,
      width: 1024,
    },
    {
      across: (box: DOMRect) => box.left < 0 && box.right > 0,
      edge: 'the left',
      height: 768,
      locale: 'ar-EG',
      outside: (box: DOMRect) => box.right <= 0,
      resting: (box: DOMRect) => box.left === 0,
      width: 1024,
    },
    {
      across: (box: DOMRect) =>
        box.top < window.innerHeight && box.bottom > window.innerHeight,
      edge: 'the bottom',
      height: 812,
      locale: 'en-US',
      outside: (box: DOMRect) => box.top >= window.innerHeight,
      resting: (box: DOMRect) => box.bottom === window.innerHeight,
      width: 375,
    },
  ])(
    'scrolls in from $edge, where it comes to rest',
    async ({ across, height, locale, outside, resting, width }) => {
      await resize(width, height)
      const view = setup({}, {}, locale)
      const dialog = view.getByRole('dialog')
      const panel = panelOf(dialog)
      const crossings: boolean[] = []
      scrollerOf(dialog).addEventListener('scroll', () => {
        crossings.push(across(panel.getBoundingClientRect()))
      })

      expect(outside(panel.getBoundingClientRect())).toBe(true)

      await arrived(dialog)
      expect(resting(panel.getBoundingClientRect())).toBe(true)
      expect(crossings).toContain(true)
    },
  )

  // And leaves the way it came, still mounted while it scrolls out.
  it('scrolls out toward the edge it rests on as it closes', async () => {
    await resize(1024, 768)
    const view = setup()
    const dialog = view.getByRole('dialog')
    const panel = await arrived(dialog)
    const resting = panel.getBoundingClientRect().left
    const lefts: number[] = []
    scrollerOf(dialog).addEventListener('scroll', () => {
      lefts.push(panel.getBoundingClientRect().left)
    })

    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(layerOf(dialog).hasAttribute('data-exiting')).toBe(true)

    await waitFor(
      () => {
        expect(view.queryByRole('dialog')).toBeNull()
      },
      { timeout: 3000 },
    )
    expect(lefts.some((left) => left > resting)).toBe(true)
  })

  // The scrim follows the panel's scroll, darkening as it comes in and
  // lifting as a swipe takes it out, through a swipe animation React Aria
  // sets on it inline and runs on the panel's view timeline: whole while the
  // panel rests, and half lifted with the panel half way out. A panel nearly
  // the window's height is the case a timeline reading the wrong scroller
  // got wrong, holding the scrim clear while the panel rested. Snapping is
  // turned off for the read, so the scroller stays where the swipe left it
  // rather than settling back.
  it.each([
    {
      body: 'Supporting line',
      height: 768,
      locale: 'en-US',
      sheet: 'a sheet on the right',
      swipe: (scroller: HTMLElement, box: DOMRect) => {
        scroller.scrollLeft -= box.width / 2
      },
      width: 1024,
    },
    {
      body: 'Supporting line',
      height: 768,
      locale: 'ar-EG',
      sheet: 'a sheet on the left',
      swipe: (scroller: HTMLElement, box: DOMRect) => {
        scroller.scrollLeft += box.width / 2
      },
      width: 1024,
    },
    {
      body: 'Supporting line',
      height: 812,
      locale: 'en-US',
      sheet: 'a bottom sheet',
      swipe: (scroller: HTMLElement, box: DOMRect) => {
        scroller.scrollTop -= box.height / 2
      },
      width: 375,
    },
    {
      body: LONG_BODY,
      height: 812,
      locale: 'en-US',
      sheet: "a bottom sheet nearly the window's height",
      swipe: (scroller: HTMLElement, box: DOMRect) => {
        scroller.scrollTop -= box.height / 2
      },
      width: 375,
    },
  ])(
    'keeps the scrim whole behind $sheet, and lifts it with a swipe',
    async ({ body, height, locale, swipe, width }) => {
      await resize(width, height)
      const view = setup({}, {}, locale, body)
      const dialog = view.getByRole('dialog')
      const scrim = scrimOf(dialog)
      await arrived(dialog)

      expect(scrim.style.animationTimeline).toMatch(/^--sheet-timeline-/)
      expect(getComputedStyle(scrim).opacity).toBe('1')

      const scroller = scrollerOf(dialog)
      scroller.style.scrollSnapType = 'none'
      swipe(scroller, dialog.getBoundingClientRect())
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      })

      const opacity = Number(getComputedStyle(scrim).opacity)
      expect(opacity).toBeGreaterThan(0.4)
      expect(opacity).toBeLessThan(0.6)
    },
  )

  // A sheet resting at its first snap point is as modal as one showing all
  // of itself, so the scrim is whole there and lifts only below it: half
  // lifted with the panel half way from there to closed.
  it('keeps the scrim whole at the first snap point, and lifts it below', async () => {
    await resize(375, 812)
    const view = setup({}, { snapPoints: SNAP_POINTS }, 'en-US', SOME_BODY)
    const dialog = view.getByRole('dialog')
    const scrim = scrimOf(dialog)
    await collapsed(dialog)

    expect(Number(getComputedStyle(scrim).opacity)).toBeGreaterThan(0.95)

    const scroller = scrollerOf(dialog)
    scroller.style.scrollSnapType = 'none'
    scroller.scrollTop -= 100
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    })

    const opacity = Number(getComputedStyle(scrim).opacity)
    expect(opacity).toBeGreaterThan(0.4)
    expect(opacity).toBeLessThan(0.6)
  })

  // Under reduced motion the panel arrives in place, and the scrim keeps its
  // own fade, at the scrim's duration, as the one cue that the sheet opened.
  it('fades the scrim in its own time under reduced motion', () => {
    reduceMotion()
    const view = setup()
    const scrim = scrimOf(view.getByRole('dialog'))
    const style = getComputedStyle(scrim)

    expect(scrim.style.animationName).toBe('')
    expect(style.animationName).not.toBe('none')
    expect(style.animationDuration).not.toBe('0s')
  })
})
