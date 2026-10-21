import type { KuiTheme } from '@kanso-labs/kanso-ui-core'
import type { PopoverRenderProps } from 'react-aria-components'

import { demoThemes } from '@kanso-labs/kanso-ui-core/themes'
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
import { rulesReaching, valueIn } from '../../styles/stylesheet.testing'
import {
  colorDefaultsDarkTheme,
  colorDefaultsLightTheme,
  colors,
  stateLayerOpacity,
  tokenScope,
} from '../../tokens/design.tokens.stylex'
import Autocomplete from '../autocomplete'
import Button from '../button'
import Keycap from '../keycap'
import SearchField from '../search-field'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for without
// depending on the browser having applied a rule these tests are the first
// thing to use — see chip/index.test.tsx for the flake behind this.
// Hoisted so the key list is not a new array on every render.
const FIRST = ['first']

// A leading icon at the menus page's 24dp, which is the box a selected
// item's check takes in its place.
const iconStyles = stylex.create({
  icon: {
    blockSize: '24px',
    display: 'inline-block',
    inlineSize: '24px',
  },
})

const FIRST_ICON = (
  <span data-testid="icon-1" {...stylex.props(iconStyles.icon)} />
)
const SECOND_ICON = (
  <span data-testid="icon-2" {...stylex.props(iconStyles.icon)} />
)

const probeStyles = stylex.create({
  disabled: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  muted: { color: colors.onSurfaceVariant },
  onSurface: { color: colors.onSurface },
  outline: { color: colors.outline },
  selected: { color: colors.onTertiaryContainer },
  surface: { backgroundColor: colors.surfaceContainerLow },
})

/** The colour an element given `style` computes to. */
function colorOf(style: stylex.StyleXStyles) {
  const probe = document.createElement('span')
  probe.className = stylex.props(style).className ?? ''
  document.body.append(probe)
  const { color } = getComputedStyle(probe)
  probe.remove()
  return color
}

/** WCAG's contrast ratio between two `rgb()` colours. */
function contrastOf(one: string, two: string) {
  const a = luminanceOf(one)
  const b = luminanceOf(two)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/** WCAG's relative luminance of an `rgb()` colour. */
function luminanceOf(colour: string) {
  const [r, g, b] = (colour.match(/\d+/g) ?? []).map((part) => {
    const channel = Number(part) / 255
    return channel <= 0.039_28
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// Every scheme a selected item is drawn in: the library's own two, pinned as
// the Storybook toolbar pins them, and each demo scheme, a `--kui-*` map
// declared over the token scope as `ThemeScope` declares one.
const SCHEMES: [string, stylex.CompiledStyles[], KuiTheme][] = [
  ['light', [...tokenScope, colorDefaultsLightTheme], {}],
  ['dark', [...tokenScope, colorDefaultsDarkTheme], {}],
  ...Object.entries(demoThemes).map(
    ([name, { theme }]): [string, stylex.CompiledStyles[], KuiTheme] => [
      name,
      tokenScope,
      theme,
    ],
  ),
]

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

// The bar a searchable menu draws above its items.
const SEARCH_FIELD = <SearchField label="Search" />

// A label with one word wider than the surface's 280dp cap.
const LONG_LABEL = 'Unterstützungszeilenüberschriftenbearbeitung bearbeiten'

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

// Hoisted, which is what react-perf's no-new-object-as-prop is after.
const RIGHT_TO_LEFT = { dir: 'rtl' } as const

/** The colour the forced-colours mode is told to draw `element`'s text in. */
function forcedColorOf(element: Element) {
  return valueIn(
    rulesReaching(element, { holding: 'forced-colors: active' }),
    'color',
  )
}

/** A menu holding a plain item, then one given an `href`. */
function linkAndPlain() {
  const view = setup(
    {},
    <>
      <Menu.Item id="first">First item</Menu.Item>
      <Menu.Item href="#second" id="second">
        Second item
      </Menu.Item>
    </>,
  )
  const [plain, link] = view.getAllByRole('menuitem')
  return { link, plain }
}

/**
 * Where React Aria placed the submenu an item opens, with the menu rendered
 * under `locale`. The right-to-left case sits in a right-to-left wrapper so
 * the trigger, and the menu with it, lie against the right edge: the submenu
 * then has room at its inline end, and a placement read from it is a choice
 * rather than a flip away from an edge.
 */
async function submenuPlacementUnder(
  locale: string,
  content: Partial<Parameters<typeof Menu.Content<object>>[0]> = {},
) {
  const rtl = locale.startsWith('ar')
  const view = render(
    <I18nProvider locale={locale}>
      <div {...(rtl ? RIGHT_TO_LEFT : {})}>
        <Menu defaultOpen>
          <Button>Open</Button>
          <Menu.Content>
            <Menu.Submenu>
              <Menu.Item id="more">More</Menu.Item>
              <Menu.Content aria-label="More" {...content}>
                <Menu.Item id="first">First item</Menu.Item>
              </Menu.Content>
            </Menu.Submenu>
          </Menu.Content>
        </Menu>
      </div>
    </I18nProvider>,
  )
  const item = view.getByRole('menuitem', { name: 'More' })
  const key = rtl ? 'ArrowLeft' : 'ArrowRight'

  act(() => {
    item.focus()
  })
  fireEvent.keyDown(item, { key })
  fireEvent.keyUp(item, { key })

  const submenu = await waitFor(() => view.getByRole('menu', { name: 'More' }))
  const placement = surfaceOf(submenu).getAttribute('data-placement')
  view.unmount()
  return placement
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

  // The selected container sits as close as 1.1:1 to the surface, so a fill
  // alone left a reader who cannot tell the two apart with no sign of which
  // item is chosen. A check carries it, hidden from the tree since
  // `aria-checked` already says so.
  describe('the check on a selected item', () => {
    it.each([
      ['single', 'menuitemradio'],
      ['multiple', 'menuitemcheckbox'],
    ] as const)(
      'marks the chosen item in %s selection and no other',
      (selectionMode, role) => {
        const view = setup({ defaultSelectedKeys: SECOND, selectionMode })
        const [first, second] = view.getAllByRole(role)

        const checks = second.querySelectorAll('svg')
        expect(checks).toHaveLength(1)
        expect(checks[0]?.getAttribute('aria-hidden')).toBe('true')
        expect(first.querySelectorAll('svg')).toHaveLength(0)
      },
    )

    it('moves to the item chosen next', () => {
      const view = setup({ selectionMode: 'single' })
      const [first, second] = view.getAllByRole('menuitemradio')

      fireEvent.click(first)
      expect(first.querySelectorAll('svg')).toHaveLength(1)

      fireEvent.click(second)
      expect(second.querySelectorAll('svg')).toHaveLength(1)
      expect(first.querySelectorAll('svg')).toHaveLength(0)
    })

    // Choosing an item moves nothing in the menu: without leading content
    // the check comes at the end of the row, after a shortcut, and the label
    // starts where every other item's does.
    it('comes at the end of a row with no leading content', () => {
      const view = setup(
        { defaultSelectedKeys: SECOND, selectionMode: 'single' },
        <>
          <Menu.Item id="first">First item</Menu.Item>
          <Menu.Item id="second" shortcut={SHORTCUT}>
            Second item
          </Menu.Item>
        </>,
      )
      const [first, second] = view.getAllByRole('menuitemradio')
      const check = second.querySelector('svg')
      const shortcut = view.getByText('⌘X')

      if (check === null) {
        throw new Error('expected the chosen item to draw a check')
      }
      expect(
        shortcut.compareDocumentPosition(check) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
      expect(view.getByText('Second item').getBoundingClientRect().left).toBe(
        view.getByText('First item').getBoundingClientRect().left,
      )
      expect(first.querySelectorAll('svg')).toHaveLength(0)
    })

    // Where the item has leading content, the check takes its place in the
    // slot, which keeps the label where it was too.
    it('takes the place of leading content', () => {
      const view = setup(
        { defaultSelectedKeys: SECOND, selectionMode: 'single' },
        <>
          <Menu.Item id="first" leading={FIRST_ICON}>
            First item
          </Menu.Item>
          <Menu.Item id="second" leading={SECOND_ICON}>
            Second item
          </Menu.Item>
        </>,
      )
      const [, second] = view.getAllByRole('menuitemradio')

      expect(view.queryByTestId('icon-2')).toBeNull()
      expect(view.getByTestId('icon-1')).not.toBeNull()
      expect(second.querySelectorAll('svg')).toHaveLength(1)
      expect(view.getByText('Second item').getBoundingClientRect().left).toBe(
        view.getByText('First item').getBoundingClientRect().left,
      )
    })
  })

  // An item given an `href` is an anchor, which the browser underlines and,
  // under forced colours, draws in `LinkText` — a row standing out as a link
  // among rows that are all equally followed.
  describe('an item that is a link', () => {
    it('draws no underline, as the item beside it draws none', () => {
      const { link, plain } = linkAndPlain()

      expect(link.tagName).toBe('A')
      expect(getComputedStyle(link).textDecorationLine).toBe('none')
      expect(getComputedStyle(plain).textDecorationLine).toBe('none')
    })

    // The mode keeps a colour that is already one of its own, so naming
    // `CanvasText` is what overrides the anchor's `LinkText`.
    it('names its text in the forced-colours mode, as the item beside it does', () => {
      const { link, plain } = linkAndPlain()

      expect(forcedColorOf(link)?.toLowerCase()).toBe('canvastext')
      expect(forcedColorOf(plain)).toBe(forcedColorOf(link))
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

    // A label wider than the surface wraps and breaks inside a word that
    // has nowhere else to, rather than running out of the surface and under
    // the shortcut.
    it('keeps a long label clear of the shortcut and inside the surface', () => {
      const view = setup(
        {},
        <Menu.Item id="first" shortcut={SHORTCUT}>
          {LONG_LABEL}
        </Menu.Item>,
      )
      const label = view.getByText(LONG_LABEL)
      const keycap = view.getByText('⌘X')
      const surface = surfaceOf(view.getByRole('menu', { name: 'Open' }))

      const text = document.createRange()
      text.selectNodeContents(label)
      expect(text.getBoundingClientRect().right).toBeLessThanOrEqual(
        keycap.getBoundingClientRect().left,
      )
      expect(surface.scrollWidth).toBeLessThanOrEqual(surface.clientWidth)
    })

    it('draws nothing after the label without one', () => {
      const view = setup({}, <Menu.Item id="first">First item</Menu.Item>)
      expect(
        view.getByRole('menuitem', { name: 'First item' }).querySelector('kbd'),
      ).toBeNull()
    })

    // On the surface the shortcut is in the muted role, and a keycap in it
    // keeps the keycap's own colours.
    it('draws an item at rest in the muted role, with its keycap as it is', () => {
      const view = setup(
        {},
        <>
          <Menu.Item id="first" shortcut="⌘C">
            First item
          </Menu.Item>
          <Menu.Item id="second" shortcut={SHORTCUT}>
            Second item
          </Menu.Item>
        </>,
      )
      const keycap = getComputedStyle(view.getByText('⌘X'))

      expect(getComputedStyle(view.getByText('⌘C')).color).toBe(
        colorOf(probeStyles.muted),
      )
      expect(keycap.color).toBe(colorOf(probeStyles.onSurface))
      expect(keycap.borderTopColor).toBe(colorOf(probeStyles.outline))
    })

    // The muted role is a second colour family over the selected
    // container, and fails AA on some schemes; the container's own
    // on-colour is the one drawn for it.
    it('draws a selected item in the on-colour, its keycap included', () => {
      const view = setup(
        { defaultSelectedKeys: ['first', 'second'], selectionMode: 'multiple' },
        <>
          <Menu.Item id="first" shortcut="⌘C">
            First item
          </Menu.Item>
          <Menu.Item id="second" shortcut={SHORTCUT}>
            Second item
          </Menu.Item>
        </>,
      )
      const [first, second] = view.getAllByRole('menuitemcheckbox')
      const keycap = getComputedStyle(view.getByText('⌘X'))
      const onColor = colorOf(probeStyles.selected)

      expect(getComputedStyle(first).color).toBe(onColor)
      expect(getComputedStyle(second).color).toBe(onColor)
      expect(getComputedStyle(view.getByText('⌘C')).color).toBe(onColor)
      expect(keycap.color).toBe(onColor)
      expect(keycap.borderTopColor).toBe(onColor)
    })

    // A shortcut at full strength beside a faded label is the one thing on
    // a disabled row that stands out, and a keycap was the darkest and only
    // boxed thing there.
    it('fades a disabled item with its label, its keycap included', () => {
      const view = setup(
        {},
        <>
          <Menu.Item id="first" isDisabled shortcut="⌘C">
            First item
          </Menu.Item>
          <Menu.Item id="second" isDisabled shortcut={SHORTCUT}>
            Second item
          </Menu.Item>
        </>,
      )
      const keycap = getComputedStyle(view.getByText('⌘X'))
      const faded = colorOf(probeStyles.disabled)

      expect(
        getComputedStyle(view.getByRole('menuitem', { name: 'First item' }))
          .color,
      ).toBe(faded)
      expect(getComputedStyle(view.getByText('⌘C')).color).toBe(faded)
      expect(keycap.color).toBe(faded)
      expect(keycap.borderTopColor).toBe(faded)
      expect(keycap.color).not.toBe(colorOf(probeStyles.onSurface))
    })

    // Disabled wins, as it does for the row's ground and its label.
    it('fades a disabled item that is selected rather than taking the on-colour', () => {
      const view = setup(
        { defaultSelectedKeys: FIRST, selectionMode: 'single' },
        <Menu.Item id="first" isDisabled shortcut={SHORTCUT}>
          First item
        </Menu.Item>,
      )
      const keycap = getComputedStyle(view.getByText('⌘X'))

      expect(view.getByRole('menuitemradio').getAttribute('aria-checked')).toBe(
        'true',
      )
      expect(keycap.color).toBe(colorOf(probeStyles.disabled))
      expect(keycap.borderTopColor).toBe(colorOf(probeStyles.disabled))
    })

    // Measured before the fix: Neon at 4.33 and Marquee at 3.97, both
    // below AA, in the muted role over the selected container.
    it.each(SCHEMES)(
      'keeps a selected shortcut at AA or better under %s',
      (_name, scope, theme) => {
        const classes = (stylex.props(scope).className ?? '')
          .split(' ')
          .filter(Boolean)
        const properties = Object.entries(theme)
        document.body.classList.add(...classes)
        for (const [property, value] of properties) {
          document.body.style.setProperty(property, value)
        }
        try {
          const view = setup(
            { defaultSelectedKeys: FIRST, selectionMode: 'single' },
            <Menu.Item id="first" shortcut="⌘C">
              First item
            </Menu.Item>,
          )
          const item = getComputedStyle(view.getByRole('menuitemradio'))
          const shortcut = getComputedStyle(view.getByText('⌘C'))

          expect(
            contrastOf(shortcut.color, item.backgroundColor),
          ).toBeGreaterThanOrEqual(4.5)
          view.unmount()
        } finally {
          document.body.classList.remove(...classes)
          for (const [property] of properties) {
            document.body.style.removeProperty(property)
          }
        }
      },
    )
  })

  // A root menu takes the side and the offset React Aria gives a menu
  // trigger's popover: below the trigger, from its start, 8 away.
  describe('placement', () => {
    it('opens a menu below its trigger, 8 away', () => {
      const view = setup()
      const surface = surfaceOf(view.getByRole('menu', { name: 'Open' }))
      const trigger = view.getByRole('button', { name: 'Open' })

      expect(surface.getAttribute('data-placement')).toBe('bottom')
      expect(
        surface.getBoundingClientRect().top -
          trigger.getBoundingClientRect().bottom,
      ).toBe(8)
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

    // At the inline end of the item that opens it, where the chevron points:
    // that is where React Aria's submenu trigger places it, and a submenu
    // given no side of its own leaves the placement to it. Below the item
    // it would cover the rest of the menu it came from.
    it.each([
      ['en-US', 'right'],
      ['ar-EG', 'left'],
    ])(
      'opens the submenu beside its item under %s',
      async (locale, expected) => {
        expect(await submenuPlacementUnder(locale)).toBe(expected)
      },
    )

    // A side the call site does give still wins.
    it('opens the submenu on a side the call site names', async () => {
      expect(await submenuPlacementUnder('en-US', { side: 'bottom' })).toBe(
        'bottom',
      )
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

// A menu with a search bar above its items, filtered by an Autocomplete
// around the whole part, as the `search` prop's docs wire it.
function searchable(props: { defaultOpen?: boolean } = {}) {
  return render(
    <Menu {...props}>
      <Button>Open</Button>
      <Autocomplete>
        <Menu.Content search={SEARCH_FIELD}>
          <Menu.Item id="first">First item</Menu.Item>
          <Menu.Item id="second">Second item</Menu.Item>
          <Menu.Item id="third">Third item</Menu.Item>
        </Menu.Content>
      </Autocomplete>
    </Menu>,
  )
}

// The bar is there to be typed into, so it takes focus as the menu opens.
// React Aria's popover took focus itself when a pointer opened the menu,
// so typing went nowhere; and the Autocomplete outlives the popover, so a
// reopened menu came back still filtered.
describe('the search bar', () => {
  it('takes focus when a pointer opens the menu', async () => {
    const view = searchable()
    // A mouse's press, down and up, rather than a bare click, which React
    // Aria reads as a virtual press and answers as it would a keyboard.
    const trigger = view.getByRole('button', { name: 'Open' })
    fireEvent.pointerDown(trigger, {
      button: 0,
      pointerId: 1,
      pointerType: 'mouse',
    })
    fireEvent.mouseDown(trigger, { button: 0 })
    fireEvent.pointerUp(trigger, {
      button: 0,
      pointerId: 1,
      pointerType: 'mouse',
    })
    fireEvent.mouseUp(trigger, { button: 0 })
    fireEvent.click(trigger, { button: 0, detail: 1 })

    const field = await view.findByRole('searchbox', { name: 'Search' })
    await waitFor(() => {
      expect(document.activeElement).toBe(field)
    })
  })

  it('takes focus when the menu opens on its own', async () => {
    const view = searchable({ defaultOpen: true })
    const field = await view.findByRole('searchbox', { name: 'Search' })

    await waitFor(() => {
      expect(document.activeElement).toBe(field)
    })
  })

  it('starts empty when the menu opens again', async () => {
    const view = searchable({ defaultOpen: true })
    const field = await view.findByRole('searchbox', { name: 'Search' })
    fireEvent.change(field, { target: { value: 'fir' } })
    await waitFor(() => {
      expect(view.getAllByRole('menuitem')).toHaveLength(1)
    })

    fireEvent.click(view.getByRole('menuitem', { name: 'First item' }))
    await waitFor(() => {
      expect(view.queryByRole('menu')).toBeNull()
    })
    fireEvent.click(view.getByRole('button', { name: 'Open' }))

    const reopened = await view.findByRole('searchbox', { name: 'Search' })
    expect(reopened).toHaveProperty('value', '')
    expect(view.getAllByRole('menuitem')).toHaveLength(3)
  })
})
