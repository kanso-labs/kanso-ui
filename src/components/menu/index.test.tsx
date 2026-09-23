import type { PopoverRenderProps } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { I18nProvider } from 'react-aria-components'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { MenuSubmenuProps } from '.'

import Menu from '.'
import {
  firePointer,
  hasRipple,
  installFakeAnimate,
  isPressed,
} from '../../hooks/useRipple.testing'
import { colors, stateLayerOpacity } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import Keycap from '../keycap'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for without
// depending on the browser having applied a rule these tests are the first
// thing to use — see chip/index.test.tsx for the flake behind this.
// Hoisted so the key list is not a new array on every render.
const FIRST = ['first']

const probeStyles = stylex.create({
  disabled: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  selected: { color: colors.onTertiaryContainer },
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
  disabled: classesOf(stylex.props(probeStyles.disabled)),
  selected: classesOf(stylex.props(probeStyles.selected)),
  surface: classesOf(stylex.props(probeStyles.surface)),
}

const SECOND = ['second']
// Hoisted so the slot is not a new element on every render.
const SEARCH = <input aria-label="Search" />
const SHORTCUT = <Keycap>⌘X</Keycap>

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

function setup(
  props: Partial<Parameters<typeof Menu.Content<object>>[0]> = {},
  children?: Parameters<typeof Menu.Content<object>>[0]['children'],
) {
  return render(
    <Menu defaultOpen>
      <Button>Open</Button>
      <Menu.Content {...props}>
        {children ?? (
          <>
            <Menu.Item id="first">First item</Menu.Item>
            <Menu.Item id="second">Second item</Menu.Item>
            <Menu.Item id="third">Third item</Menu.Item>
          </>
        )}
      </Menu.Content>
    </Menu>,
  )
}

/**
 * The transform the browser resolved for the chevron on an item that opens a
 * submenu, with the menu rendered under `locale`.
 *
 * The locale rather than a `dir` on a wrapper, since that is what reaches the
 * chevron: React Aria portals the menu's popover to the body, and stamps it
 * with a `dir` of its own taken from the locale, so a wrapper's — or even the
 * document's — never gets there.
 */
function submenuChevronUnder(locale: string) {
  const view = render(
    <I18nProvider locale={locale}>
      <Menu defaultOpen>
        <Button>Open</Button>
        <Menu.Content>
          <Menu.Submenu>
            <Menu.Item id="more">More</Menu.Item>
            <Menu.Content aria-label="More">
              <Menu.Item id="first">First item</Menu.Item>
            </Menu.Content>
          </Menu.Submenu>
        </Menu.Content>
      </Menu>
    </I18nProvider>,
  )
  const chevron = view
    .getByRole('menuitem', { name: 'More' })
    .querySelector('svg')
  if (chevron === null) {
    throw new Error('expected the item to draw its chevron')
  }
  const { transform } = getComputedStyle(chevron)
  view.unmount()
  return transform
}

/** The positioned surface the menu is drawn on. */
function surfaceOf(menu: HTMLElement) {
  const surface = menu.parentElement
  if (surface === null) {
    throw new Error('expected the menu to sit on a surface')
  }
  return surface
}

describe('menu', () => {
  // The ripple List's rows draw — see the same block there. Only the press
  // is read here: releasing an item chooses it, which closes the menu.
  describe('the press ripple', () => {
    let restoreAnimate: () => void

    beforeEach(() => {
      vi.useFakeTimers()
      restoreAnimate = installFakeAnimate()
    })

    afterEach(() => {
      restoreAnimate()
      vi.useRealTimers()
    })

    it('ripples from a press on an item', () => {
      const view = setup()
      const [item] = view.getAllByRole('menuitem')

      firePointer(item, 'pointerdown', { buttons: 1 })
      expect(isPressed(item)).toBe(true)
    })

    it('draws no ripple on a disabled item', () => {
      const view = setup({ disabledKeys: FIRST })
      const [item] = view.getAllByRole('menuitem')

      expect(hasRipple(item)).toBe(false)
    })
  })

  describe('semantics', () => {
    it('renders a menu of items named by its label', () => {
      const view = setup()
      expect(view.getByRole('menu', { name: 'Open' })).not.toBeNull()
      expect(view.getAllByRole('menuitem')).toHaveLength(3)
    })

    it('renders nothing until it is open', () => {
      const view = render(
        <Menu>
          <Button>Open</Button>
          <Menu.Content>
            <Menu.Item id="first">First item</Menu.Item>
          </Menu.Content>
        </Menu>,
      )
      expect(view.queryByRole('menu')).toBeNull()
      expect(view.getByRole('button', { name: 'Open' })).not.toBeNull()
    })

    it('opens from a button placed inside it', async () => {
      const view = render(
        <Menu>
          <Button>Open</Button>
          <Menu.Content>
            <Menu.Item id="first">First item</Menu.Item>
          </Menu.Content>
        </Menu>,
      )
      fireEvent.click(view.getByRole('button', { name: 'Open' }))
      await waitFor(() => {
        expect(view.getByRole('menu', { name: 'Open' })).not.toBeNull()
      })
    })

    it('names a section by its header', () => {
      const view = setup(
        {},
        <Menu.Section header="First group">
          <Menu.Item id="first">First item</Menu.Item>
        </Menu.Section>,
      )
      expect(view.getByRole('group', { name: 'First group' })).not.toBeNull()
    })

    // React Aria's menu provides the separator context, which is what makes
    // a plain Separator inside one report the right role.
    it('draws a separator that takes its role from the menu', () => {
      const view = setup(
        {},
        <>
          <Menu.Item id="first">First item</Menu.Item>
          <Menu.Separator />
          <Menu.Item id="second">Second item</Menu.Item>
        </>,
      )
      expect(view.getAllByRole('separator')).toHaveLength(1)
    })

    // A menu's children are a collection, so React Aria drops anything that
    // is not an item. Content that has to sit above them goes in the
    // surface's own slot instead.
    it('draws the search slot above the items', () => {
      const view = setup({ search: SEARCH })
      const search = view.getByRole('textbox', { name: 'Search' })
      const menu = view.getByRole('menu', { name: 'Open' })

      expect(search).not.toBeNull()
      expect(menu.contains(search)).toBe(false)
      expect(
        search.compareDocumentPosition(menu) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).not.toBe(0)
    })

    it('reports a disabled item as one', () => {
      const view = setup(
        {},
        <>
          <Menu.Item id="first">First item</Menu.Item>
          <Menu.Item id="second" isDisabled>
            Second item
          </Menu.Item>
        </>,
      )
      const [, second] = view.getAllByRole('menuitem')
      expect(second.getAttribute('aria-disabled')).toBe('true')
    })
  })

  describe('actions', () => {
    it('runs an item and closes the menu', async () => {
      const onAction = vi.fn<() => void>()
      const view = setup(
        {},
        <Menu.Item id="first" onAction={onAction}>
          First item
        </Menu.Item>,
      )

      fireEvent.click(view.getByRole('menuitem', { name: 'First item' }))

      await waitFor(() => {
        expect(onAction).toHaveBeenCalledTimes(1)
      })
      await waitFor(() => {
        expect(view.queryByRole('menu')).toBeNull()
      })
    })

    it('leaves a disabled item unrunnable', () => {
      const onAction = vi.fn<() => void>()
      const view = setup(
        {},
        <Menu.Item id="first" isDisabled onAction={onAction}>
          First item
        </Menu.Item>,
      )

      fireEvent.click(view.getByRole('menuitem', { name: 'First item' }))

      expect(onAction).not.toHaveBeenCalled()
    })
  })

  describe('selection', () => {
    it('selects one item at a time', () => {
      const view = setup({ selectionMode: 'single' })
      const [first, second] = view.getAllByRole('menuitemradio')

      fireEvent.click(first)
      expect(first.getAttribute('aria-checked')).toBe('true')

      fireEvent.click(second)
      expect(second.getAttribute('aria-checked')).toBe('true')
      expect(first.getAttribute('aria-checked')).toBe('false')
    })

    it('keeps its own selection from defaultSelectedKeys', () => {
      const view = setup({
        defaultSelectedKeys: SECOND,
        selectionMode: 'single',
      })
      const [, second] = view.getAllByRole('menuitemradio')
      expect(second.getAttribute('aria-checked')).toBe('true')
    })

    it('does not select on its own when controlled', () => {
      const onSelectionChange = vi.fn<(keys: unknown) => void>()
      const view = setup({
        onSelectionChange,
        selectedKeys: ['first'],
        selectionMode: 'single',
      })
      const [first, second] = view.getAllByRole('menuitemradio')

      fireEvent.click(second)

      expect(onSelectionChange).toHaveBeenCalledTimes(1)
      expect(first.getAttribute('aria-checked')).toBe('true')
    })
  })

  describe('keyboard', () => {
    it('moves through the items with the arrow keys', () => {
      const view = setup()
      const menu = view.getByRole('menu', { name: 'Open' })
      const [first, second] = view.getAllByRole('menuitem')

      act(() => {
        first.focus()
      })
      fireEvent.keyDown(menu, { key: 'ArrowDown' })
      fireEvent.keyUp(menu, { key: 'ArrowDown' })

      expect(document.activeElement).toBe(second)
    })

    it('closes on Escape', async () => {
      const view = setup()
      fireEvent.keyDown(view.getByRole('menu', { name: 'Open' }), {
        key: 'Escape',
      })
      await waitFor(() => {
        expect(view.queryByRole('menu')).toBeNull()
      })
    })
  })

  describe('the shortcut', () => {
    // React Aria's keyboard slot is what keeps the shortcut out of the
    // item's accessible name, so a screen reader reads the label and
    // announces the keystroke apart from it.
    it('draws a shortcut without adding it to the name', () => {
      const view = setup(
        {},
        <Menu.Item id="first" shortcut={SHORTCUT}>
          First item
        </Menu.Item>,
      )
      const item = view.getByRole('menuitem', { name: 'First item' })

      expect(item.querySelector('kbd')).not.toBeNull()
      expect(view.getByText('⌘X')).not.toBeNull()
      // The name is the label alone: the item points its aria-labelledby at
      // the labelled text rather than taking its whole text content.
      expect(item.textContent).toContain('⌘X')
    })

    it('draws nothing after the label without one', () => {
      const view = setup({}, <Menu.Item id="first">First item</Menu.Item>)
      expect(
        view.getByRole('menuitem', { name: 'First item' }).querySelector('kbd'),
      ).toBeNull()
    })
  })

  describe('submenus', () => {
    // The two-element tuple is the half that matters: `tsc -b` checks this
    // file, so a submenu given one element, or a third, fails to compile.
    // React Aria's SubmenuTrigger reads the first two children and no
    // others, so at runtime a third is dropped without a word and a missing
    // second leaves the item nothing to open.
    //
    // Checked on the props type rather than through JSX, for both ends. A
    // lone JSX child is not an array, so JSX refuses one whatever the tuple
    // says. And TypeScript counts a `{/* */}` comment among the children as
    // a child when it reports a third, so that error lands on the
    // directive's own line, which the directive does not cover.
    it('types its children as the item and the menu it opens, and no more', () => {
      const item = <Menu.Item id="more">More</Menu.Item>
      // @ts-expect-error -- the menu the item opens is missing
      const missing: MenuSubmenuProps['children'] = [item]
      // @ts-expect-error -- a third element has nowhere to go
      const extra: MenuSubmenuProps['children'] = [item, item, item]

      expect(missing).toHaveLength(1)
      expect(extra).toHaveLength(3)
    })

    // React Aria reports `hasSubmenu` on the item inside a SubmenuTrigger,
    // so the chevron is drawn from state rather than named twice.
    it('marks the item that opens one and draws its chevron', () => {
      const view = setup(
        {},
        <Menu.Submenu>
          <Menu.Item id="more">More</Menu.Item>
          <Menu.Content aria-label="More">
            <Menu.Item id="first">First item</Menu.Item>
          </Menu.Content>
        </Menu.Submenu>,
      )
      const item = view.getByRole('menuitem', { name: 'More' })

      expect(item.getAttribute('aria-haspopup')).toBe('menu')
      expect(item.querySelector('svg')).not.toBeNull()
    })

    // The chevron points to the inline end, where the submenu opens, so it
    // turns over with the writing direction. Read as the browser resolved it,
    // since the point is that the `:dir(rtl)` rule reaches the element.
    it('mirrors the chevron under a right-to-left locale', () => {
      expect(submenuChevronUnder('en-US')).toBe('none')
      expect(submenuChevronUnder('ar-EG')).toBe('matrix(-1, 0, 0, 1, 0, 0)')
    })

    it('opens the submenu from its item', async () => {
      const view = setup(
        {},
        <Menu.Submenu>
          <Menu.Item id="more">More</Menu.Item>
          <Menu.Content aria-label="More">
            <Menu.Item id="first">First item</Menu.Item>
          </Menu.Content>
        </Menu.Submenu>,
      )
      const item = view.getByRole('menuitem', { name: 'More' })

      act(() => {
        item.focus()
      })
      fireEvent.keyDown(item, { key: 'ArrowRight' })
      fireEvent.keyUp(item, { key: 'ArrowRight' })

      await waitFor(() => {
        expect(view.getByRole('menu', { name: 'More' })).not.toBeNull()
      })
    })
  })

  describe('appearance', () => {
    // The menus page's surface: the Expressive column's container colour, a
    // 4dp corner, 8dp above and below the items, and 112 to 280 wide.
    it('draws the page surface', () => {
      const view = setup()
      const surface = surfaceOf(view.getByRole('menu', { name: 'Open' }))
      const style = getComputedStyle(surface)

      expect(hasClasses(surface, CLASSES.surface)).toBe(true)
      expect(style.borderTopLeftRadius).toBe('4px')
      expect(style.paddingTop).toBe('8px')
      expect(style.paddingBottom).toBe('8px')
      expect(style.minInlineSize).toBe('112px')
      expect(style.maxInlineSize).toBe('280px')
    })

    // The surface is the element a layout positions: it carries the
    // background, the corner and the width range, and the list inside it has
    // none of them. A width landing on the list would change nothing a call
    // site can see, which is what makes this worth pinning to an element
    // rather than to the document.
    it('lands the call site styles on the surface, not the list', () => {
      const view = setup({ className: 'probe', style: { inlineSize: '240px' } })
      const menu = view.getByRole('menu', { name: 'Open' })
      const surface = surfaceOf(menu)

      expect(surface.classList).toContain('probe')
      expect(surface.style.inlineSize).toBe('240px')
      expect(menu.classList).not.toContain('probe')
      expect(menu.style.inlineSize).toBe('')
      // The surface keeps its own compiled classes beside the call site's.
      expect(hasClasses(surface, CLASSES.surface)).toBe(true)
    })

    it('computes those styles from the surface render state', () => {
      const className = vi.fn<
        (
          state: PopoverRenderProps & { defaultClassName: string | undefined },
        ) => string
      >(() => 'computed')
      const view = setup({ className })
      const surface = surfaceOf(view.getByRole('menu', { name: 'Open' }))

      expect(surface.classList).toContain('computed')
      // The popover's render state rather than the menu's, since that is the
      // element the class lands on. `placement` is the one a call site keying
      // a style on which way the menu opened would reach for, and the menu's
      // own state does not carry it.
      expect(className.mock.calls.at(-1)?.[0]).toHaveProperty('placement')
    })

    // The menus page's item: 48dp tall, in the row module's menu variant.
    it('draws the page item height', () => {
      const view = setup()
      const [first] = view.getAllByRole('menuitem')
      expect(getComputedStyle(first).minBlockSize).toBe('48px')
    })

    it('draws a selected item on tertiary container', () => {
      const view = setup({
        defaultSelectedKeys: SECOND,
        selectionMode: 'single',
      })
      const [first, second] = view.getAllByRole('menuitemradio')

      expect(hasClasses(second, CLASSES.selected)).toBe(true)
      expect(hasClasses(first, CLASSES.selected)).toBe(false)
    })

    it('draws a disabled item in the disabled role', () => {
      const view = setup(
        {},
        <Menu.Item id="first" isDisabled>
          First item
        </Menu.Item>,
      )
      expect(
        hasClasses(
          view.getByRole('menuitem', { name: 'First item' }),
          CLASSES.disabled,
        ),
      ).toBe(true)
    })
  })

  describe('loading more', () => {
    it('draws the ring while it is loading', () => {
      const view = setup(
        {},
        <>
          <Menu.Item id="first">First item</Menu.Item>
          <Menu.LoadMore isLoading />
        </>,
      )
      expect(
        view.getByRole('progressbar', { name: 'Loading more' }),
      ).not.toBeNull()
    })

    it('draws nothing while it is not', () => {
      const view = setup(
        {},
        <>
          <Menu.Item id="first">First item</Menu.Item>
          <Menu.LoadMore />
        </>,
      )
      expect(view.queryByRole('progressbar')).toBeNull()
    })
  })
})
