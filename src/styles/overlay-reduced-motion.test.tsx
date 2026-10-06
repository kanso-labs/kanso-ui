import { act, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Button from '../components/button'
import Dialog from '../components/dialog'
import FabMenu from '../components/fab-menu'
import Popover from '../components/popover'
import Sheet from '../components/sheet'
import Snackbar from '../components/snackbar'
import Tooltip from '../components/tooltip'
import { reducedMotionOf } from './stylesheet.testing'

/**
 * The element the entry animation is on, which is never the one carrying the
 * role: React Aria nests the dialog inside the panel that moves, so this
 * walks out to the animated ancestor rather than assuming a depth.
 */
function animatedAncestor(from: Element): HTMLElement {
  for (
    let element: Element | null = from;
    element !== null;
    element = element.parentElement
  ) {
    if (
      element instanceof HTMLElement &&
      getComputedStyle(element).animationName !== 'none'
    ) {
      return element
    }
  }

  throw new Error('expected an ancestor to carry an entry animation')
}

/**
 * The two animation durations that reach `element` — the one it rests at and
 * the one `@media (prefers-reduced-motion: reduce)` gives it — read out of the
 * stylesheet through the shared walker in ./stylesheet.testing.ts rather than
 * off a page put into that state.
 */
function animationDurations(element: Element) {
  return reducedMotionOf(element, 'animation-duration')
}

function openDialog() {
  const view = render(
    <Dialog defaultOpen>
      <Button>Open</Button>
      <Dialog.Content>
        <Dialog.Title>Headline</Dialog.Title>
      </Dialog.Content>
    </Dialog>,
  )

  return animatedAncestor(view.getByRole('dialog'))
}

// The surface carries no role of its own; the menu inside it does.
function openFabMenu() {
  const view = render(
    <FabMenu aria-label="Label" defaultOpen icon={null}>
      <FabMenu.Item id="first">First item</FabMenu.Item>
    </FabMenu>,
  )

  return animatedAncestor(view.getByRole('menu'))
}

function openPopover() {
  const view = render(
    <Popover defaultOpen>
      <Button>Open</Button>
      <Popover.Content>
        <Popover.Title>Headline</Popover.Title>
      </Popover.Content>
    </Popover>,
  )

  return animatedAncestor(view.getByRole('dialog'))
}

function openSheet() {
  const view = render(
    <Sheet defaultOpen>
      <Button>Open</Button>
      <Sheet.Content>
        <Sheet.Title>Headline</Sheet.Title>
      </Sheet.Content>
    </Sheet>,
  )

  return animatedAncestor(view.getByRole('dialog'))
}

// The tooltip carries the role itself, so the walk out to the animated
// ancestor stops where it starts.
function openTooltip() {
  const view = render(
    <Tooltip defaultOpen label="Supporting text">
      <Button>Open</Button>
    </Tooltip>,
  )

  return animatedAncestor(view.getByRole('tooltip'))
}

function showSnackbar() {
  const queue = new Snackbar.Queue()
  const view = render(<Snackbar queue={queue} />)

  act(() => {
    queue.add('First item')
  })

  return animatedAncestor(view.getByRole('alertdialog'))
}

const OVERLAYS: ReadonlyArray<{ name: string; open: () => HTMLElement }> = [
  { name: "a sheet's panel", open: openSheet },
  { name: "a dialog's container", open: openDialog },
  { name: "a snackbar's strip", open: showSnackbar },
  { name: "a popover's surface", open: openPopover },
  { name: "a FAB menu's actions", open: openFabMenu },
  { name: "a tooltip's container", open: openTooltip },
]

describe('an overlay that moves as it arrives', () => {
  it.each(OVERLAYS)('animates $name at all', ({ open }) => {
    const { resting } = animationDurations(open())

    expect(resting).toBeDefined()
    expect(resting).not.toBe('0s')
  })

  it.each(OVERLAYS)(
    'stops moving $name for a reader who asked for less motion',
    ({ open }) => {
      expect(animationDurations(open()).reduced).toBe('0s')
    },
  )
})
