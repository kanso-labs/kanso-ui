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

import * as stylex from '@stylexjs/stylex'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import NavigationTree from '.'
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
      expect(getComputedStyle(branch).fontWeight).not.toBe(
        getComputedStyle(view.getAllByRole('row')[2]).fontWeight,
      )
    })

    it('marks an ancestor even while its child is collapsed out of sight', () => {
      const view = render(<Basic expanded={false} />)
      const [branch] = view.getAllByRole('row')

      expect(view.queryByText('Child item')).toBeNull()
      expect(branch.getAttribute('data-current-ancestor')).toBe('true')
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
