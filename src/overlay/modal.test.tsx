import type { ReactNode } from 'react'

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Button from '../components/button'
import Dialog from '../components/dialog'
import Popover from '../components/popover'
import Sheet from '../components/sheet'
import TimePicker from '../components/time-picker'

// What a scrim with no fill reads as.
const NO_FILL = 'rgba(0, 0, 0, 0)'

/** A dialog open from its first render, holding `children` in its body. */
function dialogAround(children: ReactNode) {
  return (
    <Dialog defaultOpen>
      <Button>Open</Button>
      <Dialog.Content>
        <Dialog.Title>Headline</Dialog.Title>
        <Dialog.Body>{children}</Dialog.Body>
      </Dialog.Content>
    </Dialog>
  )
}

/**
 * The scrim behind the element with the dialog role. Every modal here is
 * React Aria's three nested elements — the scrim, the panel, the dialog — so
 * it is two up.
 */
function scrimOf(dialog: HTMLElement) {
  const scrim = dialog.parentElement?.parentElement
  if (!scrim) {
    throw new Error('expected the dialog to sit on a scrim')
  }
  return scrim
}

/** A sheet open from its first render, holding `children` in its body. */
function sheetAround(children: ReactNode) {
  return (
    <Sheet defaultOpen>
      <Button>Open</Button>
      <Sheet.Content>
        <Sheet.Header>
          <Sheet.Title>Headline</Sheet.Title>
        </Sheet.Header>
        <Sheet.Body>{children}</Sheet.Body>
      </Sheet.Content>
    </Sheet>
  )
}

const SECOND_DIALOG = (
  <Dialog defaultOpen>
    <Button>Open second</Button>
    <Dialog.Content>
      <Dialog.Title>Second headline</Dialog.Title>
    </Dialog.Content>
  </Dialog>
)

const SECOND_SHEET = (
  <Sheet defaultOpen>
    <Button>Open second</Button>
    <Sheet.Content>
      <Sheet.Header>
        <Sheet.Title>Second headline</Sheet.Title>
      </Sheet.Header>
    </Sheet.Content>
  </Sheet>
)

/** The first modal, which the second one hides from the tree while open. */
function firstOf(view: ReturnType<typeof render>) {
  return view.getByRole('dialog', { hidden: true, name: 'Headline' })
}

/** The fill one modal open on its own lays over the page. */
function singleFill() {
  const view = render(dialogAround(null))
  const fill = getComputedStyle(
    scrimOf(view.getByRole('dialog', { name: 'Headline' })),
  ).backgroundColor
  view.unmount()
  return fill
}

// A modal opened over another draws its scrim with no fill, so the page is
// dimmed once rather than twice and the modal beneath by the one scrim alone.
describe('a modal opened over another', () => {
  it('leaves one modal on its own with its fill and its fade', () => {
    const view = render(dialogAround(null))
    const scrim = getComputedStyle(
      scrimOf(view.getByRole('dialog', { name: 'Headline' })),
    )

    expect(scrim.backgroundColor).not.toBe(NO_FILL)
    expect(scrim.animationName).not.toBe('none')
  })

  it('draws no fill and no fade behind a dialog over a dialog', () => {
    const fill = singleFill()
    const view = render(dialogAround(SECOND_DIALOG))
    const second = getComputedStyle(
      scrimOf(view.getByRole('dialog', { name: 'Second headline' })),
    )

    expect(getComputedStyle(scrimOf(firstOf(view))).backgroundColor).toBe(fill)
    expect(second.backgroundColor).toBe(NO_FILL)
    expect(second.animationName).toBe('none')
  })

  it('draws no fill behind a sheet over a dialog', () => {
    const fill = singleFill()
    const view = render(dialogAround(SECOND_SHEET))

    expect(getComputedStyle(scrimOf(firstOf(view))).backgroundColor).toBe(fill)
    expect(
      getComputedStyle(
        scrimOf(view.getByRole('dialog', { name: 'Second headline' })),
      ).backgroundColor,
    ).toBe(NO_FILL)
  })

  it('draws no fill behind a dialog over a sheet', () => {
    const view = render(sheetAround(SECOND_DIALOG))

    expect(getComputedStyle(scrimOf(firstOf(view))).backgroundColor).not.toBe(
      NO_FILL,
    )
    expect(
      getComputedStyle(
        scrimOf(view.getByRole('dialog', { name: 'Second headline' })),
      ).backgroundColor,
    ).toBe(NO_FILL)
  })

  it("draws no fill behind a time picker's modal over a dialog", () => {
    const view = render(dialogAround(<TimePicker defaultOpen label="Label" />))

    expect(
      getComputedStyle(
        scrimOf(view.getByRole('dialog', { name: 'Select time Label' })),
      ).backgroundColor,
    ).toBe(NO_FILL)
  })

  // A popover between the two is not a modal, so it passes on what it is
  // inside: over a dialog, the second modal is still over one.
  it('reads through a popover between the two', () => {
    const view = render(
      dialogAround(
        <Popover defaultOpen>
          <Button>Open popover</Button>
          <Popover.Content>
            <Popover.Title>Popover headline</Popover.Title>
            {SECOND_DIALOG}
          </Popover.Content>
        </Popover>,
      ),
    )

    expect(
      getComputedStyle(
        scrimOf(view.getByRole('dialog', { name: 'Second headline' })),
      ).backgroundColor,
    ).toBe(NO_FILL)
  })

  it('draws the fill behind a dialog opened from a popover on the page', () => {
    const view = render(
      <Popover defaultOpen>
        <Button>Open popover</Button>
        <Popover.Content>
          <Popover.Title>Popover headline</Popover.Title>
          {SECOND_DIALOG}
        </Popover.Content>
      </Popover>,
    )

    expect(
      getComputedStyle(
        scrimOf(view.getByRole('dialog', { name: 'Second headline' })),
      ).backgroundColor,
    ).not.toBe(NO_FILL)
  })
})
