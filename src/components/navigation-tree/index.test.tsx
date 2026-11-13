// A row's slots take nodes, so passing JSX to them is this component's API
// rather than a misuse of it. react-perf guards against a fresh element
// identity defeating memoization, which the React Compiler this repo builds
// with already handles; the object and function rules are off for the same
// reason plus one of their own — a case here renders its fixture, asserts and
// unmounts, so there is no second render for a fresh identity to cost
// anything on.
// oxlint-disable react-perf/jsx-no-jsx-as-prop
// oxlint-disable react-perf/jsx-no-new-array-as-prop
// oxlint-disable react-perf/jsx-no-new-function-as-prop
// oxlint-disable react-perf/jsx-no-new-object-as-prop

import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { RouterProvider } from 'react-aria-components'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import NavigationTree from '.'
import {
  advance,
  firePointer,
  hasRipple,
  installFakeAnimate,
  isPressed,
  MINIMUM_PRESS_MS,
  surfaceOf,
} from '../../hooks/useRipple.testing'
import { rowStyles } from '../../row/styles'
import { rulesReaching, valueIn } from '../../styles/stylesheet.testing'
import { colors, spacing, typography } from '../../tokens/design.tokens.stylex'

const probeStyles = stylex.create({
  labelLarge: { fontSize: typography.labelLargeSize },
  onSurfaceVariant: { color: colors.onSurfaceVariant },
  primaryContainer: { color: colors.primaryContainer },
  secondaryContainer: { color: colors.secondaryContainer },
  xl: { inlineSize: spacing.xl },
})

// A branch with one leaf under it, plus a leaf sibling — the smallest tree
// that has every shape in it: a row that opens, a row nested under it, and a
// row that does not open.
// Hoisted so the key list is not a new array on every render.
const FIRST = ['first']

function Basic(props: {
  expanded?: boolean
  onExpandedChange?: (keys: Set<unknown>) => void
  route?: null | string
}) {
  return (
    <NavigationTree
      aria-label="Label"
      defaultExpandedKeys={props.expanded === false ? [] : ['first']}
      onExpandedChange={props.onExpandedChange}
      selectedRoute={props.route === undefined ? '#child' : props.route}
    >
      <NavigationTree.Item href="#first" id="first" label="First item">
        <NavigationTree.Item href="#child" id="child" label="Child item" />
      </NavigationTree.Item>
      <NavigationTree.Item href="#second" id="second" label="Second item" />
    </NavigationTree>
  )
}

// A button either side of what it holds, so a Tab has somewhere to come from
// and somewhere to go.
function Between(props: { children: ReactNode }) {
  return (
    <>
      <button type="button">Before</button>
      {props.children}
      <button type="button">After</button>
    </>
  )
}

/**
 * Where the caret's glyph points, as the browser resolved its transform with
 * the tree inside a `<div>` carrying `dir`: the image of the glyph's own
 * axis, which points to the inline end at rest. `{ x: 1, y: 0 }` is right and
 * `{ x: 0, y: 1 }` down.
 */
function caretPointsUnder(dir: 'ltr' | 'rtl', expanded: boolean) {
  const view = render(
    <div dir={dir}>
      <Basic expanded={expanded} />
    </div>,
  )
  const name = expanded ? 'Collapse First item' : 'Expand First item'
  const glyph = view.getByRole('button', { name }).querySelector('svg')
  if (glyph === null) {
    throw new Error('expected the caret to draw its glyph')
  }
  const { a, b } = new DOMMatrixReadOnly(getComputedStyle(glyph).transform)
  view.unmount()
  return { x: Math.round(a), y: Math.round(b) }
}

// A key dispatched at whatever has focus, then a frame: a row hands focus on
// to its link a frame after it takes it.
async function dispatch(key: string) {
  const target = document.activeElement ?? document.body
  fireEvent.keyDown(target, { key })
  fireEvent.keyUp(target, { key })
  await nextFrame()
}

/** The outline offset the forced-colours mode gives `row`. */
function forcedOutlineOffsetOf(row: Element) {
  return valueIn(
    rulesReaching(row, { holding: 'forced-colors: active' }),
    'outline-offset',
  )
}

async function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve))
}

// A real key press, through the browser. Only Tab and Enter need one: the
// tree keeps to one Tab stop by moving focus itself while the browser
// performs the Tab, and React Aria leaves a native link's Enter to the
// browser, which turns it into the click that follows the link. Every other
// key is dispatched, which costs no round trip to the page while the rest of
// the suite is running.
async function press(keys: string) {
  await userEvent.keyboard(keys)
  await nextFrame()
}

function probe(style: stylex.StyleXStyles) {
  const view = render(<span data-testid="probe" {...stylex.props(style)} />)
  const computed = getComputedStyle(view.getByTestId('probe'))
  const read = {
    color: computed.color,
    fontSize: computed.fontSize,
    inlineSize: computed.inlineSize,
  }
  view.unmount()
  return read
}

describe('navigation tree', () => {
  // The ripple List's rows draw — see the same block there.
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
      const view = render(<Basic />)
      const [row] = view.getAllByRole('row')

      firePointer(row, 'pointerdown', { buttons: 1 })
      expect(isPressed(row)).toBe(true)

      firePointer(row, 'pointerup', { buttons: 0 })
      await advance(MINIMUM_PRESS_MS)
      expect(isPressed(row)).toBe(false)
    })

    // A drawer row is a pill, and React Aria puts a cell with a square corner
    // of its own between the row and its content, so a ripple inheriting its
    // corner from its parent painted past the pill's ends.
    it("clips the ripple to the row's pill", () => {
      const view = render(<Basic />)
      const [row] = view.getAllByRole('row')
      const pill = getComputedStyle(row).borderRadius

      expect(Number.parseFloat(pill)).toBeGreaterThan(0)
      expect(getComputedStyle(surfaceOf(row)).borderRadius).toBe(pill)
    })

    it('draws no ripple on a disabled row', () => {
      const view = render(
        <NavigationTree aria-label="Label" disabledKeys={FIRST}>
          <NavigationTree.Item href="#first" id="first" label="First item" />
        </NavigationTree>,
      )

      expect(hasRipple(view.getByRole('row'))).toBe(false)
    })
  })

  describe('structure', () => {
    it('renders the treegrid roles React Aria gives it', () => {
      const view = render(<Basic />)

      expect(view.getByRole('treegrid', { name: 'Label' })).not.toBeNull()
      expect(view.getAllByRole('row')).toHaveLength(3)
    })

    it('says how deep each row is', () => {
      const view = render(<Basic />)
      const [branch, child, leaf] = view.getAllByRole('row')

      expect(branch.getAttribute('aria-level')).toBe('1')
      expect(child.getAttribute('aria-level')).toBe('2')
      expect(leaf.getAttribute('aria-level')).toBe('1')
    })

    it('indents a nested row by one caret width past its parent', () => {
      const view = render(<Basic />)
      const [branch, child] = view.getAllByRole('row')

      const step = Number.parseFloat(probe(probeStyles.xl).inlineSize)
      const parent = Number.parseFloat(
        getComputedStyle(branch).paddingInlineStart,
      )
      const nested = Number.parseFloat(
        getComputedStyle(child).paddingInlineStart,
      )

      expect(nested - parent).toBe(step)
    })

    it('sets the label in the page own role rather than a list headline', () => {
      const view = render(<Basic />)

      // The drawer page gives its row a label-large label, where the lists
      // page gives a list item a body-large headline.
      expect(getComputedStyle(view.getByText('Second item')).fontSize).toBe(
        probe(probeStyles.labelLarge).fontSize,
      )
    })

    it('holds a leaf label in line with a branch one', () => {
      const view = render(<Basic />)

      const branch = view.getByText('First item').getBoundingClientRect().left
      const leaf = view.getByText('Second item').getBoundingClientRect().left

      expect(leaf).toBe(branch)
    })
  })

  // A row is a link, which a press acts on, so React Aria reports it hovered
  // and the row takes the hover layer and the pointer from that report — the
  // current row too, where the layer lies over the pill's container. One row
  // at a time, since React Aria ends a row's hover once the pointer is over
  // another.
  describe('the state layers', () => {
    it('lays the hover layer over a row, the current one included', () => {
      const view = render(<Basic />)
      const [first, child] = view.getAllByRole('row')
      const hovered = (stylex.props(rowStyles.hovered).className ?? '')
        .split(' ')
        .filter(Boolean)
      expect(hovered.length).toBeGreaterThan(0)

      for (const row of [first, child]) {
        act(() => {
          fireEvent.pointerOver(row, { pointerType: 'mouse' })
        })
        expect(hovered.every((name) => row.classList.contains(name))).toBe(true)
        expect(getComputedStyle(row).cursor).toBe('pointer')
      }
    })
  })

  describe('the current row', () => {
    it('marks the row whose href matches the route', () => {
      const view = render(<Basic />)
      const [, child] = view.getAllByRole('row')

      expect(child.getAttribute('data-current')).toBe('true')
    })

    it('draws it on the page own container, not the list one', () => {
      const view = render(<Basic />)
      const [, child] = view.getAllByRole('row')

      // Secondary container is the drawer page's active indicator; a selected
      // list row takes primary container, and the two must not be confused.
      expect(getComputedStyle(child).backgroundColor).toBe(
        probe(probeStyles.secondaryContainer).color,
      )
      expect(getComputedStyle(child).backgroundColor).not.toBe(
        probe(probeStyles.primaryContainer).color,
      )
    })

    it('draws it as a pill held off each edge', () => {
      const view = render(<Basic />)
      const [, child] = view.getAllByRole('row')
      const style = getComputedStyle(child)

      // 336dp of indicator in the page's 360dp container is 12dp off each
      // side, and the page's own images show it fully rounded.
      expect(style.marginInlineStart).toBe('12px')
      expect(style.marginInlineEnd).toBe('12px')
      expect(Number.parseFloat(style.borderTopLeftRadius)).toBeGreaterThan(20)
    })

    it('keeps the pill inside its container rather than overflowing it', () => {
      const view = render(<Basic />)
      const tree = view.getByRole('treegrid')
      const [, child] = view.getAllByRole('row')

      // A margin sits outside the box, so the row has to give up the `100%`
      // width the shared base carries or it overflows by exactly the inset.
      expect(child.getBoundingClientRect().right).toBeLessThanOrEqual(
        tree.getBoundingClientRect().right,
      )
      expect(child.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        tree.getBoundingClientRect().left,
      )
    })

    it('marks the rows on the way to it, without the pill', () => {
      const view = render(<Basic />)
      const [branch, child] = view.getAllByRole('row')

      expect(branch.getAttribute('data-current-ancestor')).toBe('true')
      // The trail says the route passes through here; only the end of it
      // takes the container.
      expect(getComputedStyle(branch).backgroundColor).not.toBe(
        getComputedStyle(child).backgroundColor,
      )
      // Read off the label rather than the row. The row's own weight never
      // reaches the text: RowContent draws the label in a span that states
      // the label-large role in full, weight included, and an inherited
      // value does not reach an element declaring its own.
      expect(
        getComputedStyle(view.getByText('First item')).fontWeight,
      ).not.toBe(getComputedStyle(view.getByText('Second item')).fontWeight)
    })

    it('marks an ancestor even while its child is collapsed out of sight', () => {
      const view = render(<Basic expanded={false} />)
      const [branch] = view.getAllByRole('row')

      expect(view.queryByText('Child item')).toBeNull()
      expect(branch.getAttribute('data-current-ancestor')).toBe('true')
    })

    // Under forced colours the current row is `Highlight`, and its ring in
    // `HighlightText` has to sit inside that rather than along its edge —
    // see `focusVisibleSelected` in src/row/styles.ts.
    it('insets the ring of the focused current row under forced colours', async () => {
      const view = render(<Basic />)
      const [first, child] = view.getAllByRole('row')

      act(() => {
        view.getByRole('link', { name: 'Child item' }).focus()
      })
      // The row above is on the way to the current one, not current itself,
      // so it keeps the ring every other row draws.
      await dispatch('ArrowUp')
      expect(first.getAttribute('data-focus-visible')).toBe('true')
      expect(forcedOutlineOffsetOf(first)).toBe('-2px')

      await dispatch('ArrowDown')
      expect(child.getAttribute('data-focus-visible')).toBe('true')
      expect(forcedOutlineOffsetOf(child)).toBe('-4px')
    })

    it('marks nothing when no route matches', () => {
      const view = render(<Basic route="#nowhere" />)

      for (const row of view.getAllByRole('row')) {
        expect(row.getAttribute('data-current')).toBeNull()
        expect(row.getAttribute('data-current-ancestor')).toBeNull()
      }
    })
  })

  describe('the caret', () => {
    it('draws one on a row that has children, and none on one that does not', () => {
      const view = render(<Basic />)

      expect(
        view.getByRole('button', { name: 'Collapse First item' }),
      ).not.toBeNull()
      expect(view.getAllByRole('button')).toHaveLength(1)
    })

    it('opens and closes the row it belongs to', () => {
      const onExpandedChange = vi.fn<(keys: Set<unknown>) => void>()
      const view = render(
        <Basic expanded={false} onExpandedChange={onExpandedChange} />,
      )

      fireEvent.click(view.getByRole('button', { name: 'Expand First item' }))

      expect([...onExpandedChange.mock.calls[0][0]]).toEqual(['first'])
    })

    it('draws no chrome of its own behind the glyph', () => {
      const view = render(<Basic />)
      const caret = view.getByRole('button', { name: 'Collapse First item' })

      expect(getComputedStyle(caret).backgroundColor).toBe('rgba(0, 0, 0, 0)')
      expect(getComputedStyle(caret).borderTopWidth).toBe('0px')
    })

    // The glyph points to the inline end, so a right-to-left direction
    // mirrors it while the row is closed. Open, it points down either way,
    // since the block axis does not turn over with the writing direction.
    it('points to the inline end while closed, and down once open', () => {
      expect(caretPointsUnder('ltr', false)).toEqual({ x: 1, y: 0 })
      expect(caretPointsUnder('rtl', false)).toEqual({ x: -1, y: 0 })
      expect(caretPointsUnder('ltr', true)).toEqual({ x: 0, y: 1 })
      expect(caretPointsUnder('rtl', true)).toEqual({ x: 0, y: 1 })
    })
  })

  // React Aria gives a row with an `href` its Tab stop, its `aria-current`
  // and its press through the link inside it, so a row drawn without one
  // could be reached by nothing but a pointer.
  describe('the keyboard', () => {
    it('takes one Tab stop, on the current row link', async () => {
      const view = render(
        <Between>
          <Basic />
        </Between>,
      )

      act(() => {
        view.getByRole('button', { name: 'Before' }).focus()
      })
      await press('{Tab}')
      expect(document.activeElement).toBe(
        view.getByRole('link', { name: 'Child item' }),
      )

      await press('{Tab}')
      expect(document.activeElement).toBe(
        view.getByRole('button', { name: 'After' }),
      )
    })

    it('names the current row a page to a reader', () => {
      const view = render(<Basic />)
      const current = (name: string) =>
        view.getByRole('link', { name }).getAttribute('aria-current')

      expect(current('Child item')).toBe('page')
      expect(current('First item')).toBeNull()
      expect(current('Second item')).toBeNull()
    })

    it('moves between rows with the up and down arrows', async () => {
      const view = render(<Basic />)

      act(() => {
        view.getByRole('link', { name: 'Child item' }).focus()
      })
      await dispatch('ArrowDown')
      expect(document.activeElement).toBe(
        view.getByRole('link', { name: 'Second item' }),
      )

      await dispatch('ArrowUp')
      await dispatch('ArrowUp')
      expect(document.activeElement).toBe(
        view.getByRole('link', { name: 'First item' }),
      )
    })

    it('closes and opens a row with the start and end arrows', async () => {
      const onExpandedChange = vi.fn<(keys: Set<unknown>) => void>()
      const view = render(<Basic onExpandedChange={onExpandedChange} />)

      // Reached by the keys, as a reader would: a row opens and closes only
      // while it is the one the tree has focused, and a script's `focus()`
      // moves the browser's focus without telling the tree.
      act(() => {
        view.getByRole('link', { name: 'Child item' }).focus()
      })
      await dispatch('ArrowUp')
      await dispatch('ArrowLeft')
      expect([...onExpandedChange.mock.calls[0][0]]).toEqual([])

      await dispatch('ArrowRight')
      expect([...onExpandedChange.mock.calls[1][0]]).toEqual(['first'])
    })

    it('follows the row link on Enter', async () => {
      const navigate = vi.fn<(path: string) => void>()
      const view = render(
        <RouterProvider navigate={navigate}>
          <Basic />
        </RouterProvider>,
      )

      act(() => {
        view.getByRole('link', { name: 'Child item' }).focus()
      })
      await dispatch('ArrowDown')
      await press('{Enter}')

      expect(navigate).toHaveBeenCalledWith('#second', undefined)
    })

    it('draws the focus ring on the row, not on the link inside it', async () => {
      const view = render(<Basic />)
      const second = view.getByRole('link', { name: 'Second item' })

      act(() => {
        view.getByRole('link', { name: 'Child item' }).focus()
      })
      await dispatch('ArrowDown')

      expect(document.activeElement).toBe(second)
      expect(
        second.closest('[role="row"]')?.getAttribute('data-focus-visible'),
      ).toBe('true')
      expect(getComputedStyle(second).outlineStyle).toBe('none')
    })
  })

  describe('sections', () => {
    it('names a group by its header, in the muted role', () => {
      const view = render(
        <NavigationTree aria-label="Label">
          <NavigationTree.Section header="Headline" id="section">
            <NavigationTree.Item href="#first" id="first" label="First item" />
          </NavigationTree.Section>
        </NavigationTree>,
      )

      expect(view.getByText('First item')).not.toBeNull()

      const header = view.getByText('Headline').closest('[role="row"]')
      if (!(header instanceof HTMLElement)) {
        throw new Error('expected the header to render a row')
      }

      expect(getComputedStyle(header).color).toBe(
        probe(probeStyles.onSurfaceVariant).color,
      )
    })
  })
})
