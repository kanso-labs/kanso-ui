// The target's children take nodes, so passing JSX to it is this component's
// API rather than a misuse of it. react-perf guards against a fresh element
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

import DropZone, { FileTrigger } from '.'
import { colors, typography } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import { rootStyles } from './styles'

const probeStyles = stylex.create({
  bodyMedium: { fontSize: typography.bodyMediumSize },
  onSurfaceVariant: { color: colors.onSurfaceVariant },
  outlineVariant: { color: colors.outlineVariant },
  primary: { color: colors.primary },
  primaryContainer: { color: colors.primaryContainer },
  surface: { color: colors.surface },
})

// The styled box is the element the call site positions, and it is what the
// render state's classes land on.
function boxOf(view: ReturnType<typeof render>) {
  const box = view.container.firstElementChild
  if (!(box instanceof HTMLElement)) {
    throw new Error('expected the target to render an element')
  }
  return box
}

function probe(style: stylex.StyleXStyles) {
  const view = render(<span data-testid="probe" {...stylex.props(style)} />)
  const computed = getComputedStyle(view.getByTestId('probe'))
  const read = { color: computed.color, fontSize: computed.fontSize }
  view.unmount()
  return read
}

// What the target's own styles come to in a given render state, applied to a
// bare element. Not to a DropZone through its `className`: two `stylex.props`
// calls on one element are resolved by compiled source order rather than by
// which was passed last, so a forced state would not reliably beat the real
// one.
function stateBox(state: { isDropTarget?: boolean; isFocusVisible?: boolean }) {
  const view = render(
    <span
      className={
        rootStyles({
          isDropTarget: state.isDropTarget ?? false,
          isFocusVisible: state.isFocusVisible ?? false,
        }).className
      }
      data-testid="state"
    />,
  )
  const computed = getComputedStyle(view.getByTestId('state'))
  // Read before unmounting, since two of these are compared in one case and
  // both would otherwise be in the document at once.
  const read = {
    backgroundColor: computed.backgroundColor,
    borderTopColor: computed.borderTopColor,
    borderTopStyle: computed.borderTopStyle,
    outlineStyle: computed.outlineStyle,
  }
  view.unmount()
  return read
}

// The visually hidden button React Aria puts inside is the drop target as
// far as the keyboard and a screen reader are concerned, so it is what these
// cases reach for rather than the styled box around it.
function targetOf(view: ReturnType<typeof render>) {
  return view.getByRole('button', { name: /Drop here|Label/ })
}

describe('drop zone', () => {
  describe('structure', () => {
    it('is named by its label, which it renders', () => {
      const view = render(<DropZone label="Drop here" />)

      expect(view.getByText('Drop here')).not.toBeNull()
      // React Aria points the hidden button at the label slot, so the name is
      // composed from it rather than given separately.
      expect(view.getByRole('button', { name: 'Drop here' })).not.toBeNull()
    })

    it('takes an aria-label instead where the page already says what it is for', () => {
      const view = render(<DropZone aria-label="Label" />)

      expect(view.getByRole('button', { name: 'Label' })).not.toBeNull()
      expect(view.queryByText('Label')).toBeNull()
    })

    it('draws its label in the muted role', () => {
      const view = render(<DropZone label="Drop here" />)
      const label = getComputedStyle(view.getByText('Drop here'))

      expect(label.color).toBe(probe(probeStyles.onSurfaceVariant).color)
      expect(label.fontSize).toBe(probe(probeStyles.bodyMedium).fontSize)
    })

    it('renders whatever else it was given, after the label', () => {
      const view = render(
        <DropZone label="Drop here">
          <span>First item</span>
        </DropZone>,
      )

      expect(view.getByText('First item')).not.toBeNull()
      expect(
        view
          .getByText('Drop here')
          .compareDocumentPosition(view.getByText('First item')) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    })
  })

  describe('at rest', () => {
    it('takes the outlined card surface and rule, dashed', () => {
      const view = render(<DropZone label="Drop here" />)
      const style = getComputedStyle(boxOf(view))

      expect(style.backgroundColor).toBe(probe(probeStyles.surface).color)
      expect(style.borderTopColor).toBe(probe(probeStyles.outlineVariant).color)
      // A solid rule reads as a card; a dashed one reads as a place to put
      // something.
      expect(style.borderTopStyle).toBe('dashed')
    })

    it('is tall enough to aim at', () => {
      const view = render(<DropZone label="Drop here" />)

      expect(boxOf(view).getBoundingClientRect().height).toBe(160)
    })
  })

  describe('while something is over it', () => {
    // React Aria decides `isDropTarget` inside its own global drag session,
    // which a synthetic DragEvent does not start — so what is checked here is
    // what the component does with that state rather than that React Aria
    // reports it. The states are applied to a bare element, which is the same
    // probe pattern the colours above are read through.
    it('fills, and goes solid', () => {
      const over = stateBox({ isDropTarget: true })
      const resting = stateBox({})

      expect(over.backgroundColor).not.toBe(resting.backgroundColor)
      expect(over.backgroundColor).toBe(
        probe(probeStyles.primaryContainer).color,
      )
      expect(over.borderTopColor).toBe(probe(probeStyles.primary).color)
      // A target about to receive something is no longer a placeholder for it.
      expect(over.borderTopStyle).toBe('solid')
    })

    it('is the only state that fills it', () => {
      const focused = stateBox({ isFocusVisible: true })
      const resting = stateBox({})

      // Keyboard focus draws a ring rather than a fill, so the two states
      // cannot be read for one another.
      expect(focused.backgroundColor).toBe(resting.backgroundColor)
      expect(focused.outlineStyle).toBe('solid')
      expect(resting.outlineStyle).toBe('none')
    })
  })

  describe('keyboard', () => {
    it('puts the target in the tab order, so a drop can be done without a pointer', () => {
      const view = render(<DropZone label="Drop here" />)

      expect(targetOf(view).getAttribute('tabindex')).toBe('0')
    })
  })
})

describe('file trigger', () => {
  it('renders what it wraps, and a hidden input beside it', () => {
    const view = render(
      <FileTrigger>
        <Button>Label</Button>
      </FileTrigger>,
    )

    expect(view.getByRole('button', { name: 'Label' })).not.toBeNull()

    const input = view.container.querySelector('input[type="file"]')
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('expected a file input')
    }

    // Hidden rather than absent: it is what the button opens, and a reader
    // should find the button rather than it.
    expect(input.style.display).toBe('none')
  })

  it('passes the picker options straight through', () => {
    const view = render(
      <FileTrigger
        acceptDirectory
        acceptedFileTypes={['image/png']}
        allowsMultiple
      >
        <Button>Label</Button>
      </FileTrigger>,
    )
    const input = view.container.querySelector('input[type="file"]')
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('expected a file input')
    }

    expect(input.accept).toBe('image/png')
    expect(input.multiple).toBe(true)
    expect(input.webkitdirectory).toBe(true)
  })

  it('reports what was picked', () => {
    const onSelect = vi.fn<(files: FileList | null) => void>()
    const view = render(
      <FileTrigger onSelect={onSelect}>
        <Button>Label</Button>
      </FileTrigger>,
    )
    const input = view.container.querySelector('input[type="file"]')
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('expected a file input')
    }

    fireEvent.change(input)

    expect(onSelect).toHaveBeenCalled()
  })
})
