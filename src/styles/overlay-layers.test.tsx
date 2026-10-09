import { act, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import Button from '../components/button'
import Dialog from '../components/dialog'
import Sheet from '../components/sheet'
import Snackbar from '../components/snackbar'

// A modal is portalled to the end of the body, where an element with no
// `z-index` paints level with the page's own unlayered content. A page's
// sticky header at `z-index: 1` then painted over the scrim and over the top
// of the panel — the title and the close button of a full-screen dialog
// included. These pin the order in src/styles/layers.stylex.ts.

// Hoisted so it is one stable object rather than a fresh one per render,
// which is what react-perf's no-new-object-as-prop is after.
const HEADER_STYLE = {
  blockSize: '64px',
  insetBlockStart: 0,
  insetInline: 0,
  position: 'fixed',
  zIndex: 1,
} as const

let page: HTMLElement | null = null

afterEach(() => {
  page?.remove()
  page = null
})

/**
 * The outermost ancestor the browser lays against the viewport: a modal's
 * scrim, or the snackbar's region. Walked to rather than assumed at a depth,
 * since React Aria nests the role a few elements inside it — and outermost,
 * since a sheet's panel is pinned to the viewport inside its scrim.
 */
function fixedAncestor(from: Element): HTMLElement {
  let outermost: HTMLElement | null = null
  for (
    let element: Element | null = from;
    element !== null;
    element = element.parentElement
  ) {
    if (
      element instanceof HTMLElement &&
      getComputedStyle(element).position === 'fixed'
    ) {
      outermost = element
    }
  }
  if (outermost === null) {
    throw new Error('expected a fixed ancestor')
  }
  return outermost
}

/**
 * What a press over the header lands on. React Aria makes everything outside
 * an open modal inert, which takes the header out of hit testing however it
 * paints, so that is undone first: what is left is the paint order.
 */
function hitOver(header: HTMLElement) {
  for (const element of document.querySelectorAll('[inert]')) {
    element.removeAttribute('inert')
  }
  const box = header.getBoundingClientRect()
  return document.elementFromPoint(
    box.left + box.width / 2,
    box.top + box.height / 2,
  )
}

function openDialog() {
  return render(
    <Dialog defaultOpen>
      <Button>Open</Button>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Headline</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>Supporting line</Dialog.Body>
      </Dialog.Content>
    </Dialog>,
  ).getByRole('dialog')
}

function openSheet() {
  return render(
    <Sheet defaultOpen>
      <Button>Open</Button>
      <Sheet.Content>
        <Sheet.Header>
          <Sheet.Title>Headline</Sheet.Title>
        </Sheet.Header>
        <Sheet.Body>Supporting line</Sheet.Body>
      </Sheet.Content>
    </Sheet>,
  ).getByRole('dialog')
}

/**
 * A page's own chrome over its content, as a sticky header is, mounted
 * outside anything the modal renders.
 */
function pageHeader() {
  page = document.createElement('div')
  document.body.prepend(page)
  const view = render(<header style={HEADER_STYLE}>Header</header>, {
    container: page,
  })
  return view.getByText('Header')
}

describe('overlay layers', () => {
  it.each([
    ['dialog', openDialog],
    ['sheet', openSheet],
  ])("lays a %s's scrim over the page's layered content", (_name, open) => {
    const header = pageHeader()
    const scrim = fixedAncestor(open())

    expect(Number(getComputedStyle(scrim).zIndex)).toBeGreaterThan(
      Number(getComputedStyle(header).zIndex),
    )
    const hit = hitOver(header)
    expect(hit === scrim || scrim.contains(hit)).toBe(true)
  })

  // A toast raised from inside a modal is read over it, not hidden behind
  // its scrim.
  it("lays the snackbar's region over a modal's scrim", () => {
    const scrim = fixedAncestor(openDialog())
    const queue = new Snackbar.Queue()
    const view = render(<Snackbar queue={queue} />)
    act(() => {
      queue.add('First item')
    })
    const region = fixedAncestor(view.getByText('First item'))

    expect(Number(getComputedStyle(region).zIndex)).toBeGreaterThan(
      Number(getComputedStyle(scrim).zIndex),
    )
  })
})
