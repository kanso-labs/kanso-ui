import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import List from '.'
import { useDragAndDrop } from '../../drag/hooks'
import {
  advance,
  firePointer,
  hasRipple,
  installFakeAnimate,
  isPressed,
  MINIMUM_PRESS_MS,
} from '../../hooks/useRipple.testing'
import { rowStyles } from '../../row/styles'
import {
  disabledContentOpacity,
  opacityWithin,
} from '../../styles/opacity.testing'
import { colors, stateLayerOpacity } from '../../tokens/design.tokens.stylex'

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
  header: { color: colors.onSurfaceVariant },
  selected: { color: colors.onPrimaryContainer },
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
  header: classesOf(stylex.props(probeStyles.header)),
  selected: classesOf(stylex.props(probeStyles.selected)),
}

const SECOND = ['second']
const LEADING = <span>Leading</span>
const TRAILING = <span>Trailing</span>
const BUTTON = <button type="button">Label</button>

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

// Hoisted, which is what react-perf's no-new-function-as-prop is after.
const NOOP = () => {}

// The row's own ripple, apart from any a control inside it draws: the last
// thing in its cell, after the row's content.
function ownSurface(row: Element) {
  const surface = row.querySelector('[role="gridcell"]')?.lastElementChild
  if (surface === null || surface === undefined) {
    throw new Error('expected the row to draw a ripple surface')
  }
  return surface
}

// The controls a row's trailing slot may hold, each pressed where a pointer
// lands on it: a checkbox through the text of the label around it. React
// Aria's own controls stop a press from reaching the row, so plain elements
// stand in here for what a call site brings of its own.
const NESTED = [
  {
    control: (
      <button onClick={NOOP} type="button">
        Label
      </button>
    ),
    name: 'a button',
    target: (view: ReturnType<typeof render>) =>
      view.getByRole('button', { name: 'Label' }),
  },
  {
    control: <a href="#label">Label</a>,
    name: 'a link',
    target: (view: ReturnType<typeof render>) =>
      view.getByRole('link', { name: 'Label' }),
  },
  {
    control: (
      <label>
        <input type="checkbox" />
        <span>Label</span>
      </label>
    ),
    name: 'the label of a checkbox',
    target: (view: ReturnType<typeof render>) => view.getByText('Label'),
  },
]

// A list whose rows drag, which needs the hook React Aria builds the drag
// state from, and so a component to call it in.
function DraggableList({ children }: { children: ReactNode }) {
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
  })
  return (
    <List aria-label="Label" dragAndDropHooks={dragAndDropHooks}>
      {children}
    </List>
  )
}

/**
 * The classes a shared row style compiles to, and so what a row drawing it
 * carries. An empty list would make an `every` vacuously true, so it throws.
 */
function layerClasses(style: stylex.StyleXStyles) {
  const classes = (stylex.props(style).className ?? '')
    .split(' ')
    .filter(Boolean)
  if (classes.length === 0) {
    throw new Error('expected the row style to generate at least one class')
  }
  return classes
}

function setup(
  props: Partial<Parameters<typeof List<object>>[0]> = {},
  children?: Parameters<typeof List<object>>[0]['children'],
) {
  return render(
    <List aria-label="Label" selectionMode="multiple" {...props}>
      {children ?? (
        <>
          <List.Item id="first">First item</List.Item>
          <List.Item id="second">Second item</List.Item>
          <List.Item id="third">Third item</List.Item>
        </>
      )}
    </List>,
  )
}

describe('list', () => {
  // React Aria reports a row hovered only when a press does something to it
  // — selects it, runs its action, or drags it — and the hover layer and the
  // pointer follow that report rather than `:hover`.
  describe('interactivity', () => {
    it('leaves a row nothing acts on untinted, and without a pointer', () => {
      const view = setup({ selectionMode: 'none' })
      const [first] = view.getAllByRole('row')

      act(() => {
        fireEvent.pointerOver(first, { pointerType: 'mouse' })
      })

      expect(
        layerClasses(rowStyles.hovered).some((name) =>
          first.classList.contains(name),
        ),
      ).toBe(false)
      expect(getComputedStyle(first).cursor).not.toBe('pointer')
    })

    it('tints a row that runs an action, and points at it', () => {
      const view = setup({ onAction: NOOP, selectionMode: 'none' })
      const [first] = view.getAllByRole('row')

      act(() => {
        fireEvent.pointerOver(first, { pointerType: 'mouse' })
      })

      expect(
        layerClasses(rowStyles.hovered).every((name) =>
          first.classList.contains(name),
        ),
      ).toBe(true)
      expect(getComputedStyle(first).cursor).toBe('pointer')
    })
  })

  describe('semantics', () => {
    it('renders a grid of rows named by its label', () => {
      const view = setup()
      expect(view.getByRole('grid', { name: 'Label' })).not.toBeNull()
      expect(view.getAllByRole('row')).toHaveLength(3)
    })

    // A listbox option is a leaf: nothing inside it can be focused. A grid
    // list's row is a row of cells, which is what lets a checkbox live in it
    // — and is why this exists beside ListBox rather than instead of it.
    it('holds a focusable control inside a row', () => {
      const view = setup()
      const [first] = view.getAllByRole('row')
      const box = first.querySelector<HTMLInputElement>(
        'input[type="checkbox"]',
      )
      if (box == null) {
        throw new Error('expected the row to hold a checkbox')
      }

      act(() => {
        box.focus()
      })
      expect(document.activeElement).toBe(box)
    })

    it('names a section by its header', () => {
      const view = setup(
        {},
        <List.Section header="First group">
          <List.Item id="first">First item</List.Item>
        </List.Section>,
      )
      expect(view.getByText('First group')).not.toBeNull()
    })

    it('reports a disabled row as one', () => {
      const view = setup({ disabledKeys: SECOND })
      const [, second] = view.getAllByRole('row')
      expect(second.getAttribute('aria-disabled')).toBe('true')
    })

    // The row's slots are the shared row's, so a supporting line and the two
    // content slots all read as part of the same row.
    it('draws the row slots inside the row', () => {
      const view = setup(
        { selectionMode: 'none' },
        <List.Item
          id="first"
          leading={LEADING}
          supporting="Supporting line"
          trailing={TRAILING}
        >
          First item
        </List.Item>,
      )
      const [row] = view.getAllByRole('row')
      expect(row.textContent).toBe('LeadingFirst itemSupporting lineTrailing')
    })
  })

  describe('the selection checkbox', () => {
    // React Aria reports the selection mode and behaviour on each row, so
    // the box is drawn from that rather than named on every item.
    it('draws one on every row while the list toggles', () => {
      const view = setup()
      expect(view.getAllByRole('checkbox')).toHaveLength(3)
    })

    it('draws none when the list does not select', () => {
      const view = setup({ selectionMode: 'none' })
      expect(view.queryAllByRole('checkbox')).toHaveLength(0)
    })

    it('draws none when selecting replaces rather than toggles', () => {
      const view = setup({ selectionBehavior: 'replace' })
      expect(view.queryAllByRole('checkbox')).toHaveLength(0)
    })

    // React Aria's own default is `toggle` in every mode, which would draw a
    // box on every row of a list that keeps one choice.
    it('draws none when the list selects one row', () => {
      const view = setup({ selectionMode: 'single' })
      expect(view.queryAllByRole('checkbox')).toHaveLength(0)
    })

    // A wrapper forwarding its own unset prop passes `undefined` rather than
    // leaving the prop out, and still gets the default.
    it('draws none when a single list is handed an unset behaviour', () => {
      const view = setup({
        selectionBehavior: undefined,
        selectionMode: 'single',
      })
      expect(view.queryAllByRole('checkbox')).toHaveLength(0)
    })

    it('draws one on every row of a single list told to toggle', () => {
      const view = setup({
        selectionBehavior: 'toggle',
        selectionMode: 'single',
      })
      expect(view.getAllByRole('checkbox')).toHaveLength(3)
    })

    // React Aria points the box's `aria-labelledby` at itself and at the row,
    // so the name is the given label followed by the row's own text — which
    // is what makes three identically labelled boxes tell each other apart.
    it('takes a label of its own', () => {
      const view = setup({ selectLabel: 'Choose' })
      expect(
        view.getByRole('checkbox', { name: 'Choose First item' }),
      ).not.toBeNull()
    })

    // The box is the 40dp an avatar is, so the page's 8dp above and below
    // puts a selecting row on the one-line height a row that does not select
    // takes. At the 12dp every row once took, selecting moved the whole list.
    it('keeps a row at the height of one that does not select', () => {
      const selecting = setup()
      const [row] = selecting.getAllByRole('row')
      const height = row.offsetHeight
      selecting.unmount()
      const plain = setup({ selectionMode: 'none' })

      expect(height).toBe(56)
      expect(plain.getAllByRole('row')[0].offsetHeight).toBe(height)
    })

    // The box takes the width of its 40dp control and no more, and the
    // headline follows it by the row's own gap, as it would an avatar.
    it('draws as wide as its control, a gap before the headline', () => {
      const view = setup()
      const [row] = view.getAllByRole('row')
      const box = row.querySelector('[slot="selection"]')
      if (!(box instanceof HTMLElement)) {
        throw new Error('expected the row to draw its selection checkbox')
      }
      const rowBox = row.getBoundingClientRect()
      const boxRect = box.getBoundingClientRect()
      const headline = view.getByText('First item').getBoundingClientRect()

      expect(boxRect.width).toBe(40)
      expect(boxRect.left - rowBox.left).toBe(16)
      expect(headline.left - boxRect.right).toBe(
        Number.parseFloat(getComputedStyle(row).columnGap),
      )
      expect(headline.left - rowBox.left).toBe(72)
    })

    // A disabled row fades what it leads with, and React Aria disables the
    // box with the row, which then draws its own disabled state. Faded with
    // the rest, it would sit at 38% of a colour already at 38%.
    it("stays out of the fade a disabled row's leading content takes", () => {
      const view = setup(
        { disabledKeys: FIRST },
        <List.Item id="first" leading={LEADING}>
          First item
        </List.Item>,
      )
      const [row] = view.getAllByRole('row')
      const box = row.querySelector('[slot="selection"]')
      if (box === null) {
        throw new Error('expected the row to draw its selection checkbox')
      }

      expect(view.getByRole('checkbox')).toHaveProperty('disabled', true)
      expect(opacityWithin(row, view.getByText('Leading'))).toBeCloseTo(
        disabledContentOpacity(),
      )
      expect(opacityWithin(row, box)).toBe(1)
    })

    it('selects the row it belongs to', () => {
      const view = setup()
      const [first] = view.getAllByRole('checkbox')

      fireEvent.click(first)

      expect(view.getAllByRole('row')[0]?.getAttribute('aria-selected')).toBe(
        'true',
      )
    })
  })

  describe('selection', () => {
    it('selects more than one', () => {
      const view = setup()
      const [first, second] = view.getAllByRole('row')

      fireEvent.click(first)
      fireEvent.click(second)

      expect(first.getAttribute('aria-selected')).toBe('true')
      expect(second.getAttribute('aria-selected')).toBe('true')
    })

    it('replaces the choice when it selects one row', () => {
      const view = setup({ selectionMode: 'single' })
      const [first, second] = view.getAllByRole('row')

      fireEvent.click(first)
      fireEvent.click(second)

      expect(first.getAttribute('aria-selected')).toBe('false')
      expect(second.getAttribute('aria-selected')).toBe('true')
    })

    it('keeps its own selection from defaultSelectedKeys', () => {
      const view = setup({ defaultSelectedKeys: SECOND })
      const [, second] = view.getAllByRole('row')
      expect(second.getAttribute('aria-selected')).toBe('true')
    })

    it('does not select on its own when controlled', () => {
      const onSelectionChange = vi.fn<(keys: unknown) => void>()
      const view = setup({ onSelectionChange, selectedKeys: ['first'] })
      const [first, second] = view.getAllByRole('row')

      fireEvent.click(second)

      expect(onSelectionChange).toHaveBeenCalledTimes(1)
      expect(first.getAttribute('aria-selected')).toBe('true')
      expect(second.getAttribute('aria-selected')).toBe('false')
    })
  })

  describe('keyboard', () => {
    // Replacing is what a single list does by default, and a replacing list
    // carries its selection with the focus.
    it('moves the choice with the arrow keys when it selects one row', () => {
      const view = setup({
        defaultSelectedKeys: FIRST,
        selectionMode: 'single',
      })
      const list = view.getByRole('grid', { name: 'Label' })
      const [first, second] = view.getAllByRole('row')

      act(() => {
        first.focus()
      })
      fireEvent.keyDown(list, { key: 'ArrowDown' })
      fireEvent.keyUp(list, { key: 'ArrowDown' })

      expect(first.getAttribute('aria-selected')).toBe('false')
      expect(second.getAttribute('aria-selected')).toBe('true')
    })

    it('moves through the rows with the arrow keys', () => {
      const view = setup({ selectionMode: 'none' })
      const list = view.getByRole('grid', { name: 'Label' })
      const [first, second] = view.getAllByRole('row')

      act(() => {
        first.focus()
      })
      fireEvent.keyDown(list, { key: 'ArrowDown' })
      fireEvent.keyUp(list, { key: 'ArrowDown' })

      expect(document.activeElement).toBe(second)
    })
  })

  describe('appearance', () => {
    it('draws a selected row in the page selected roles', () => {
      const view = setup({ defaultSelectedKeys: SECOND })
      const [first, second] = view.getAllByRole('row')

      expect(hasClasses(second, CLASSES.selected)).toBe(true)
      expect(hasClasses(first, CLASSES.selected)).toBe(false)
    })

    it('draws a disabled row in the disabled role', () => {
      const view = setup({ disabledKeys: SECOND })
      const [, second] = view.getAllByRole('row')
      expect(hasClasses(second, CLASSES.disabled)).toBe(true)
    })

    // React Aria draws the header as a row holding a `rowheader` cell, and
    // the styled element is the row — the cell inside it is `display:
    // contents`, so it carries neither the padding nor the colour.
    it('draws a section heading in the muted role', () => {
      const view = setup(
        {},
        <List.Section header="First group">
          <List.Item id="first">First item</List.Item>
        </List.Section>,
      )
      const header = view.getByRole('rowheader', {
        name: 'First group',
      }).parentElement
      if (header === null) {
        throw new Error('expected the header cell to sit in a row')
      }

      expect(hasClasses(header, CLASSES.header)).toBe(true)
    })

    // The lists page's row: a 56dp floor with 16 either side and 8 above and
    // below, which the shared row module gives every collection item here.
    it('draws the page row height and inset', () => {
      const view = setup()
      const [first] = view.getAllByRole('row')
      const style = getComputedStyle(first)

      expect(style.minBlockSize).toBe('56px')
      expect(style.paddingLeft).toBe('16px')
      expect(style.paddingRight).toBe('16px')
      expect(style.paddingTop).toBe('8px')
      expect(style.paddingBottom).toBe('8px')
    })
  })

  // The ripple ListItem draws, so a row looks the same pressed in a list as
  // on its own. React Aria keeps a row's clicks for its own press handling,
  // so the press ends on the release; a row waiting for a click would stay
  // pressed.
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

    it('ripples from a press on a row, and lets go once the press ends', async () => {
      const view = render(
        <List aria-label="Label" onAction={NOOP}>
          <List.Item id="first">First item</List.Item>
        </List>,
      )
      const row = view.getByRole('row')

      firePointer(row, 'pointerdown', { buttons: 1 })
      expect(isPressed(row)).toBe(true)

      firePointer(row, 'pointerup', { buttons: 0 })
      await advance(MINIMUM_PRESS_MS)
      expect(isPressed(row)).toBe(false)
    })

    // A row a press does nothing to takes no hover layer and no pointer, and
    // a ripple would say the press did something.
    it('draws no ripple on a row a press does nothing to', () => {
      const view = render(
        <List aria-label="Label">
          <List.Item id="first">First item</List.Item>
        </List>,
      )
      const row = view.getByRole('row')

      expect(hasRipple(row)).toBe(false)
      firePointer(row, 'pointerdown', { buttons: 1 })
      expect(isPressed(row)).toBe(false)
    })

    it.each([
      {
        element: (
          <List aria-label="Label" onAction={NOOP}>
            <List.Item id="first">First item</List.Item>
          </List>
        ),
        name: 'the list acts on',
      },
      {
        element: (
          <List aria-label="Label" selectionMode="single">
            <List.Item id="first">First item</List.Item>
          </List>
        ),
        name: 'the list selects',
      },
      {
        element: (
          <List aria-label="Label">
            <List.Item id="first" onAction={NOOP}>
              First item
            </List.Item>
          </List>
        ),
        name: 'acts on its own',
      },
      {
        element: (
          <List aria-label="Label">
            <List.Item href="#first" id="first">
              First item
            </List.Item>
          </List>
        ),
        name: 'links',
      },
      {
        element: (
          <DraggableList>
            <List.Item id="first">First item</List.Item>
          </DraggableList>
        ),
        name: 'drags',
      },
    ])('ripples a row that $name', ({ element }) => {
      const row = render(element).getByRole('row')

      firePointer(row, 'pointerdown', { buttons: 1 })
      expect(isPressed(row)).toBe(true)
    })

    // A press on the headline is still a press on the row.
    it('ripples from a press on the text inside a row', () => {
      const view = render(
        <List aria-label="Label" onAction={NOOP}>
          <List.Item id="first">First item</List.Item>
        </List>,
      )

      firePointer(view.getByText('First item'), 'pointerdown', { buttons: 1 })
      expect(isPressed(view.getByRole('row'))).toBe(true)
    })

    // The control answers the press itself; a ripple across the whole row
    // said the row had been pressed.
    it('leaves a press on a control inside the row to the control', () => {
      const onClick = vi.fn<() => void>()
      const onPointerDown = vi.fn<() => void>()
      const view = render(
        <List aria-label="Label" onAction={NOOP}>
          <List.Item id="first" onPointerDown={onPointerDown} trailing={BUTTON}>
            First item
          </List.Item>
        </List>,
      )
      const button = view.getByRole('button', { name: 'Label' })
      button.addEventListener('click', onClick)

      firePointer(button, 'pointerdown', { buttons: 1 })
      expect(isPressed(view.getByRole('row'))).toBe(false)
      // The call site's own handler on the row still hears it.
      expect(onPointerDown).toHaveBeenCalledOnce()

      fireEvent.click(button)
      expect(onClick).toHaveBeenCalledOnce()
    })

    it.each(NESTED)(
      'draws no row ripple for a press on $name inside it',
      ({ control, target }) => {
        const view = render(
          <List aria-label="Label" onAction={NOOP}>
            <List.Item id="first" trailing={control}>
              First item
            </List.Item>
          </List>,
        )

        firePointer(target(view), 'pointerdown', { buttons: 1 })
        expect(isPressed(ownSurface(view.getByRole('row')))).toBe(false)
      },
    )

    it('draws no ripple on a disabled row', () => {
      const view = render(
        <List aria-label="Label" disabledKeys={FIRST}>
          <List.Item id="first">First item</List.Item>
        </List>,
      )

      expect(hasRipple(view.getByRole('row'))).toBe(false)
    })
  })

  describe('loading more', () => {
    it('draws the ring while it is loading', () => {
      const view = setup(
        {},
        <>
          <List.Item id="first">First item</List.Item>
          <List.LoadMore isLoading />
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
          <List.Item id="first">First item</List.Item>
          <List.LoadMore />
        </>,
      )
      expect(view.queryByRole('progressbar')).toBeNull()
    })
  })
})
