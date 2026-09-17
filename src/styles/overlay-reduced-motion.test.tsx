import { act, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Button from '../components/button'
import Dialog from '../components/dialog'
import Popover from '../components/popover'
import Sheet from '../components/sheet'
import Snackbar from '../components/snackbar'

const REDUCE = 'prefers-reduced-motion: reduce'

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
 * the one `@media (prefers-reduced-motion: reduce)` gives it — read out of
 * the stylesheet rather than off a page put into that state.
 *
 * Chromium's media emulation is the direct way to check this, and nothing in
 * the suite uses it. `Emulation.setEmulatedMedia` is a page-level command and
 * Vitest runs each test file as an iframe inside one shared page, which costs
 * two ways: two files driving it write one setting, and the send waits on
 * whatever the whole page is doing — 1ms on its own against 14.9s under a full
 * run. Assertions here failed in a full run and passed alone, in both
 * directions and sometimes as a timed-out CDP call. Reading the rule is
 * deterministic, and it is what src/field/forced-colors.test.tsx does for the
 * query it cannot emulate and segmented-button/index.test.tsx for the
 * container that slides.
 */
function animationDurations(element: Element): {
  reduced: string | undefined
  resting: string | undefined
} {
  let reduced: string | undefined
  let resting: string | undefined

  for (const sheet of document.styleSheets) {
    walk([...sheet.cssRules], false)
  }

  return { reduced, resting }

  function walk(rules: CSSRule[], inReduce: boolean) {
    for (const rule of rules) {
      if (rule instanceof CSSMediaRule) {
        walk(
          [...rule.cssRules],
          inReduce || rule.conditionText.includes(REDUCE),
        )
        continue
      }

      if (rule instanceof CSSGroupingRule) {
        walk([...rule.cssRules], inReduce)
        continue
      }

      if (!(rule instanceof CSSStyleRule)) {
        continue
      }

      // StyleX writes one class per declaration and repeats it to raise
      // specificity, so a selector is a run of the same class.
      const className = rule.selectorText.split('.').find(Boolean)

      if (className === undefined || !element.classList.contains(className)) {
        continue
      }

      const duration = rule.style.getPropertyValue('animation-duration')

      if (duration === '') {
        continue
      }

      if (inReduce) {
        reduced = duration
      } else {
        resting = duration
      }
    }
  }
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
