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

import type { Selection } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Tree from '.'
import { colors, spacing } from '../../tokens/design.tokens.stylex'

const probeStyles = stylex.create({
  onSurfaceVariant: { color: colors.onSurfaceVariant },
  primaryContainer: { color: colors.primaryContainer },
  xl: { inlineSize: spacing.xl },
})

// A branch with one leaf under it, plus a leaf sibling — the smallest tree
// that has every shape in it: a row that opens, a row nested under it, and a
// row that does not open.
function Basic(props: {
  expanded?: boolean
  loadMore?: boolean
  loadMoreLabel?: string
  onExpandedChange?: (keys: Set<unknown>) => void
  onSelectionChange?: (keys: Selection) => void
  selectionMode?: 'multiple' | 'none' | 'single'
  selectLabel?: string
}) {
  return (
    <Tree
      aria-label="Label"
      defaultExpandedKeys={props.expanded === false ? [] : ['first']}
      onExpandedChange={props.onExpandedChange}
      onSelectionChange={props.onSelectionChange}
      selectionMode={props.selectionMode}
      selectLabel={props.selectLabel}
    >
      <Tree.Item headline="First item" id="first">
        <Tree.Item headline="Child item" id="child" />
      </Tree.Item>
      <Tree.Item headline="Second item" id="second" />
      {props.loadMore === true ? (
        <Tree.LoadMore isLoading label={props.loadMoreLabel} />
      ) : null}
    </Tree>
  )
}

function probe(style: stylex.StyleXStyles) {
  const view = render(<span data-testid="probe" {...stylex.props(style)} />)
  const computed = getComputedStyle(view.getByTestId('probe'))
  const read = { color: computed.color, inlineSize: computed.inlineSize }
  view.unmount()
  return read
}

describe('tree', () => {
  describe('structure', () => {
    it('renders the treegrid roles React Aria gives a tree', () => {
      const view = render(<Basic />)

      expect(view.getByRole('treegrid', { name: 'Label' })).not.toBeNull()
      // The open branch, its child, and the leaf beside it.
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
      const branchInset = Number.parseFloat(
        getComputedStyle(branch).paddingInlineStart,
      )
      const childInset = Number.parseFloat(
        getComputedStyle(child).paddingInlineStart,
      )

      expect(childInset - branchInset).toBe(step)
    })

    it('leaves a leaf undrawn until its parent is opened', () => {
      const view = render(<Basic expanded={false} />)

      expect(view.queryByText('Child item')).toBeNull()
      expect(view.getAllByRole('row')).toHaveLength(2)
    })
  })

  describe('the caret', () => {
    it('draws one on a row that has children, and none on one that does not', () => {
      const view = render(<Basic />)

      // React Aria names it for what pressing it does, and composes that with
      // the row — so the branch's says Collapse while it is open.
      expect(
        view.getByRole('button', { name: 'Collapse First item' }),
      ).not.toBeNull()
      expect(view.getAllByRole('button')).toHaveLength(1)
    })

    it('draws no chrome of its own behind the glyph', () => {
      const view = render(<Basic />)
      const caret = view.getByRole('button', { name: 'Collapse First item' })

      // The row around it already carries the state layers, and a `<button>`
      // left with its own background shows the browser's grey chrome.
      expect(getComputedStyle(caret).backgroundColor).toBe('rgba(0, 0, 0, 0)')
      expect(getComputedStyle(caret).borderTopWidth).toBe('0px')
    })

    it('says Expand once the row is closed', () => {
      const view = render(<Basic expanded={false} />)

      expect(
        view.getByRole('button', { name: 'Expand First item' }),
      ).not.toBeNull()
    })

    it('opens and closes the row it belongs to', () => {
      const onExpandedChange = vi.fn<(keys: Set<unknown>) => void>()
      const view = render(
        <Basic expanded={false} onExpandedChange={onExpandedChange} />,
      )

      fireEvent.click(view.getByRole('button', { name: 'Expand First item' }))

      expect([...onExpandedChange.mock.calls[0][0]]).toEqual(['first'])
    })

    it('holds a leaf headline in line with a branch one', () => {
      const view = render(<Basic />)

      // Both rows sit at the top level, so the only thing that could put
      // their headlines out of line is the caret one has and the other does
      // not. The leaf takes the caret's space rather than nothing.
      const branch = view.getByText('First item').getBoundingClientRect().left
      const leaf = view.getByText('Second item').getBoundingClientRect().left

      expect(leaf).toBe(branch)
    })
  })

  describe('selection', () => {
    it('draws a checkbox on every row when the tree toggles', () => {
      const view = render(<Basic selectionMode="multiple" />)

      expect(view.getAllByRole('checkbox')).toHaveLength(3)
      expect(
        view.getByRole('checkbox', { name: 'Select First item' }),
      ).not.toBeNull()
    })

    it('takes the label the tree was given', () => {
      const view = render(
        <Basic selectionMode="multiple" selectLabel="Choose" />,
      )

      expect(
        view.getByRole('checkbox', { name: 'Choose First item' }),
      ).not.toBeNull()
    })

    it('draws none when the tree does not select', () => {
      const view = render(<Basic />)

      expect(view.queryByRole('checkbox')).toBeNull()
    })

    it('reports the row keys it was left holding', () => {
      const onSelectionChange = vi.fn<(keys: Selection) => void>()
      const view = render(
        <Basic
          onSelectionChange={onSelectionChange}
          selectionMode="multiple"
        />,
      )

      fireEvent.click(view.getByRole('checkbox', { name: 'Select Child item' }))

      const keys = onSelectionChange.mock.calls[0][0]
      if (keys === 'all') {
        throw new Error('expected the keys rather than all of them')
      }

      expect([...keys]).toEqual(['child'])
    })

    it('draws a selected row on the page own container', () => {
      const view = render(<Basic selectionMode="multiple" />)
      const [branch] = view.getAllByRole('row')

      fireEvent.click(view.getByRole('checkbox', { name: 'Select First item' }))

      expect(getComputedStyle(branch).backgroundColor).toBe(
        probe(probeStyles.primaryContainer).color,
      )
    })
  })

  describe('keyboard', () => {
    it('opens a row with the end arrow and closes it with the start one', () => {
      const onExpandedChange = vi.fn<(keys: Set<unknown>) => void>()
      const view = render(
        <Basic expanded={false} onExpandedChange={onExpandedChange} />,
      )
      const [branch] = view.getAllByRole('row')

      branch.focus()
      fireEvent.keyDown(branch, { key: 'ArrowRight' })
      fireEvent.keyUp(branch, { key: 'ArrowRight' })

      expect([...onExpandedChange.mock.calls[0][0]]).toEqual(['first'])
    })

    it('moves between rows with the up and down arrows', () => {
      const view = render(<Basic />)
      const [branch, child] = view.getAllByRole('row')

      branch.focus()
      expect(branch.contains(document.activeElement)).toBe(true)

      fireEvent.keyDown(branch, { key: 'ArrowDown' })
      fireEvent.keyUp(branch, { key: 'ArrowDown' })

      expect(child.contains(document.activeElement)).toBe(true)
    })
  })

  describe('load more', () => {
    it('shows the ring while it is fetching, named for a reader', () => {
      const view = render(<Basic loadMore />)

      expect(
        view.getByRole('progressbar', { name: 'Loading more' }),
      ).not.toBeNull()
    })

    it('takes the label it was given', () => {
      const view = render(<Basic loadMore loadMoreLabel="Fetching" />)

      expect(view.getByRole('progressbar', { name: 'Fetching' })).not.toBeNull()
    })

    it('shows nothing while it is not fetching', () => {
      const view = render(<Basic />)

      expect(view.queryByRole('progressbar')).toBeNull()
    })
  })

  describe('sections', () => {
    it('names a group by its header', () => {
      const view = render(
        <Tree aria-label="Label">
          <Tree.Section header="Headline" id="section">
            <Tree.Item headline="First item" id="first" />
          </Tree.Section>
        </Tree>,
      )

      expect(view.getByText('Headline')).not.toBeNull()
      expect(view.getByText('First item')).not.toBeNull()
    })

    it('draws the header in the muted role rather than the row one', () => {
      const view = render(
        <Tree aria-label="Label">
          <Tree.Section header="Headline" id="section">
            <Tree.Item headline="First item" id="first" />
          </Tree.Section>
        </Tree>,
      )

      // React Aria's header wraps its text in a cell of its own that carries
      // no class, so the styled element is the one holding that cell.
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
