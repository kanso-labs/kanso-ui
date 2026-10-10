import type { MockInstance } from 'vitest'

import * as stylex from '@stylexjs/stylex'
import { act, render, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import CopyField from '.'
import { colors } from '../../tokens/design.tokens.stylex'

// A colour for the page around the field that is not the field's own, and
// the on surface role resolved the way the page resolves it, so a case
// compares computed colour with computed colour.
const probeStyles = stylex.create({
  around: { color: colors.error },
  onSurface: { color: colors.onSurface },
})

const VALUE = 'first.second.third'
const COPIED_RESET_MS = 2000

// The real clipboard is unavailable outside a secure context and gated on
// permission besides, so these drive a stand-in and assert what the component
// hands it. Restored after each test, since it is a property of the shared
// navigator rather than of the tree under test.
type WriteText = (text: string) => Promise<void>

let writeText: ReturnType<typeof vi.fn<WriteText>>
let original: PropertyDescriptor | undefined

// The button if that is what it says, and null otherwise. Both labels sit in
// the DOM so the control keeps its width when the state changes, which puts
// the hidden one in `textContent` as well. A role query names the button
// through the accessible-name algorithm instead, which accounts for the
// hidden slot — and a name carrying both labels at once would match neither.
function buttonNamed(button: HTMLElement, name: string) {
  return within(button.ownerDocument.body).queryByRole('button', { name })
}

// The click handler awaits the clipboard promise before it sets any state, so
// the microtask queue has to drain inside act for React to see the update.
async function click(button: HTMLElement) {
  await act(async () => {
    button.click()
    await Promise.resolve()
  })
}

function install(behaviour: WriteText) {
  writeText = vi.fn<WriteText>(behaviour)
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })
}

function setup(props: Partial<Parameters<typeof CopyField>[0]> = {}) {
  const view = render(
    <CopyField data-testid="field" value={VALUE} {...props} />,
  )
  const field = view.getByTestId('field')
  return {
    ...view,
    button: view.getByRole('button'),
    field,
    status: view.getByRole('status'),
  }
}

beforeEach(() => {
  original = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
  vi.useFakeTimers()
  install(async () => {})
})

afterEach(() => {
  vi.useRealTimers()
  if (original === undefined) {
    // @ts-expect-error -- removing a property the platform normally owns
    delete navigator.clipboard
  } else {
    Object.defineProperty(navigator, 'clipboard', original)
  }
})

describe('copyField', () => {
  describe('structure', () => {
    it('shows the value it would copy', () => {
      const { field } = setup()
      expect(field.textContent).toContain(VALUE)
    })

    it('offers the copy at rest', () => {
      const { button } = setup()
      expect(buttonNamed(button, 'Copy')).toBe(button)
    })

    it('takes its labels from the call site', () => {
      const { button } = setup({ copyLabel: 'Take' })
      expect(buttonNamed(button, 'Take')).toBe(button)
    })

    it('passes attributes through to the root', () => {
      const { field } = setup({ id: 'repo-url' })
      expect(field.id).toBe('repo-url')
    })
  })

  // Code takes the colour of the text around it, and the field paints a
  // surface of its own, so the value takes the role that surface pairs with
  // rather than whatever the page around the field sets.
  describe('the value', () => {
    it('is drawn in the on surface role whatever colour is around it', () => {
      const view = render(
        <div {...stylex.props(probeStyles.around)}>
          <CopyField data-testid="field" value={VALUE} />
          <span data-testid="probe" {...stylex.props(probeStyles.onSurface)} />
        </div>,
      )
      const code = view.getByTestId('field').querySelector('code')
      if (code === null) {
        throw new Error('expected the field to show its value as code')
      }

      expect(getComputedStyle(code).color).toBe(
        getComputedStyle(view.getByTestId('probe')).color,
      )
    })
  })

  // A literal to copy keeps its own order under a right-to-left page. The
  // bidi algorithm otherwise moved a leading or trailing neutral to the
  // other end, so the field showed one string and copied another.
  describe('under a right-to-left page', () => {
    it.each(['/usr/local/bin', '--flag=value', '$ npm install kanso-ui'])(
      'shows %s in the order it copies',
      (value) => {
        const view = render(
          <div dir="rtl">
            <CopyField data-testid="field" value={value} />
          </div>,
        )
        const code = view.getByTestId('field').querySelector('code')
        const text = code?.firstChild
        if (code === null || !(text instanceof Text)) {
          throw new Error('expected the field to show its value as code')
        }
        const style = getComputedStyle(code)
        // One offset per UTF-16 unit, which every value here is one of.
        const lefts = Array.from({ length: value.length }, (_unit, index) => {
          const range = document.createRange()
          range.setStart(text, index)
          range.setEnd(text, index + 1)
          return range.getBoundingClientRect().left
        })

        expect(style.direction).toBe('ltr')
        expect(style.unicodeBidi).toBe('isolate')
        // Each character to the right of the one before it: string order.
        expect(
          lefts.every((left, index) => index === 0 || left > lefts[index - 1]),
        ).toBe(true)
      },
    )

    // The box around the value keeps the page's direction, so the value
    // still starts at the row's inline start — the right, here.
    it('keeps the value at the inline start of the row', () => {
      const view = render(
        <div dir="rtl">
          <CopyField data-testid="field" value="/usr/local/bin" />
        </div>,
      )
      const field = view.getByTestId('field').getBoundingClientRect()
      const code = view
        .getByTestId('field')
        .querySelector('code')
        ?.getBoundingClientRect()

      expect(field.right - (code?.right ?? 0)).toBeLessThan(
        (code?.left ?? 0) - field.left,
      )
    })
  })

  describe('copying', () => {
    it('writes the value to the clipboard', async () => {
      const { button } = setup()
      await click(button)
      expect(writeText).toHaveBeenCalledTimes(1)
      expect(writeText).toHaveBeenCalledWith(VALUE)
    })

    it('confirms on the button once the write lands', async () => {
      const { button } = setup()
      expect(buttonNamed(button, 'Copy')).toBe(button)
      await click(button)
      expect(buttonNamed(button, 'Copied')).toBe(button)
    })

    it('reports the value to the call site', async () => {
      const onCopied = vi.fn<(value: string) => void>()
      const { button } = setup({ onCopied })
      await click(button)
      expect(onCopied).toHaveBeenCalledWith(VALUE)
    })
  })

  // The dwell is the component's own timer, so it is driven rather than
  // waited on. A real wait here would race the assertion against the timer.
  describe('the dwell', () => {
    it('returns to offering the copy after the dwell', async () => {
      const { button } = setup()
      await click(button)
      expect(buttonNamed(button, 'Copied')).toBe(button)

      act(() => {
        vi.advanceTimersByTime(COPIED_RESET_MS)
      })
      expect(buttonNamed(button, 'Copy')).toBe(button)
    })

    it('still confirms just before the dwell is up', async () => {
      const { button } = setup()
      await click(button)

      act(() => {
        vi.advanceTimersByTime(COPIED_RESET_MS - 1)
      })
      // Guards the test above: an assertion that only ever ran after the full
      // dwell could not tell a working timer from one that never fired.
      expect(buttonNamed(button, 'Copied')).toBe(button)
    })

    it('restarts the dwell when copied again', async () => {
      const { button } = setup()
      await click(button)

      act(() => {
        vi.advanceTimersByTime(COPIED_RESET_MS - 100)
      })
      await click(button)
      act(() => {
        vi.advanceTimersByTime(COPIED_RESET_MS - 100)
      })
      expect(buttonNamed(button, 'Copied')).toBe(button)
    })

    it('leaves no timer behind when unmounted mid-dwell', async () => {
      const { button, unmount } = setup()
      await click(button)

      // Counted rather than inferred from a warning: React no longer reports
      // a setState on an unmounted tree, so a leaked dwell is silent. The
      // count is a comparison rather than an exact number because the ripple
      // on the copy button schedules a timer of its own, and how many it
      // leaves pending is useRipple's business rather than this component's.
      const pending = vi.getTimerCount()
      expect(pending).toBeGreaterThan(0)

      unmount()
      expect(vi.getTimerCount()).toBeLessThan(pending)
    })
  })

  // Refused outside a secure context and wherever the permission is denied.
  // The control must not claim a value reached the clipboard when it did not.
  // The confirmation is the text written still being the value shown, and
  // the dwell is the component's own, whatever the call site's handler does.
  // A page with several fields listed one "Copy" after another, and nothing
  // named which value each one copied.
  describe('a label', () => {
    it('names the field and joins each button name', () => {
      const view = render(
        <>
          <CopyField label="Repository URL" value="https://example.com" />
          <CopyField label="Access token" value="secret-token-value" />
        </>,
      )

      expect(view.getByRole('group', { name: 'Repository URL' })).not.toBeNull()
      expect(
        view.getByRole('button', { name: 'Copy Repository URL' }),
      ).not.toBeNull()
      expect(
        view.getByRole('button', { name: 'Copy Access token' }),
      ).not.toBeNull()
    })

    // A token read aloud is a token disclosed.
    it('leaves the value out of the button name', () => {
      const view = render(
        <CopyField label="Access token" value="secret-token-value" />,
      )

      expect(
        view.getByRole('button').getAttribute('aria-labelledby'),
      ).not.toBeNull()
      expect(
        view.queryByRole('button', { name: /secret-token-value/ }),
      ).toBeNull()
    })

    it('follows the label on show once copied', async () => {
      const view = render(<CopyField label="Access token" value={VALUE} />)

      await click(view.getByRole('button'))

      expect(
        view.getByRole('button', { name: 'Copied Access token' }),
      ).not.toBeNull()
    })

    it('leaves a field without one as it was', () => {
      const { button, field } = setup()

      expect(field.getAttribute('role')).toBeNull()
      expect(button.getAttribute('aria-labelledby')).toBeNull()
      expect(buttonNamed(button, 'Copy')).toBe(button)
    })
  })

  describe('the confirmation', () => {
    // A handler that threw used to skip the timer, which left the button on
    // Copied for good. Its error still reaches the page, raised on its own.
    it('returns to Copy after the dwell when onCopied throws', async () => {
      const failure = new Error('handler threw')
      const raised: unknown[] = []
      const schedule = globalThis.queueMicrotask.bind(globalThis)
      const spy = vi
        .spyOn(globalThis, 'queueMicrotask')
        .mockImplementation((callback) => {
          schedule(() => {
            try {
              callback()
            } catch (error) {
              raised.push(error)
            }
          })
        })
      const { button } = setup({
        onCopied: () => {
          throw failure
        },
      })

      await click(button)
      await act(async () => {
        await Promise.resolve()
      })
      spy.mockRestore()

      expect(raised).toContain(failure)
      expect(buttonNamed(button, 'Copied')).toBe(button)
      act(() => {
        vi.advanceTimersByTime(COPIED_RESET_MS)
      })
      expect(buttonNamed(button, 'Copy')).toBe(button)
    })

    // A token regenerated or a selection swapped inside the dwell: the field
    // would otherwise confirm a copy of something it no longer shows.
    it('stops confirming once the value is no longer what was copied', async () => {
      const view = setup()
      await click(view.button)
      expect(view.status.textContent).toBe('Copied')

      view.rerender(<CopyField data-testid="field" value="second.value" />)

      expect(buttonNamed(view.button, 'Copy')).toBe(view.button)
      expect(view.status.textContent).toBe('')
    })

    // A second press inside the dwell left the region's text as it was, so
    // nothing was announced for a write that did happen.
    it('announces a second copy inside the dwell', async () => {
      const { button, status } = setup()
      await click(button)
      const first = status.firstChild

      await click(button)

      expect(status.textContent).toBe('Copied')
      expect(status.firstChild).not.toBe(first)
    })
  })

  // A refusal used to leave the button at rest and the region silent, and
  // the value unselected, so the reader was left with nothing. The field now
  // selects the value and tries the older copy command on it; this stub is
  // that command, refused unless a case says otherwise.
  describe('when the clipboard refuses', () => {
    // oxlint-disable-next-line typescript/no-deprecated -- the fallback under test
    let execCommand: MockInstance<Document['execCommand']>

    beforeEach(() => {
      // oxlint-disable-next-line typescript/no-deprecated -- the fallback under test
      execCommand = vi.spyOn(document, 'execCommand').mockReturnValue(false)
    })

    afterEach(() => {
      execCommand.mockRestore()
      window.getSelection()?.removeAllRanges()
    })

    // The button keeps saying Copy: a slot wide enough for the selection's
    // words would double its width at rest. The selection is what shows.
    it('selects the value and announces so rather than confirming', async () => {
      install(async () => {
        await Promise.reject(new Error('denied'))
      })
      const { button, status } = setup()
      await click(button)

      expect(window.getSelection()?.toString()).toBe(VALUE)
      expect(buttonNamed(button, 'Copy')).toBe(button)
      expect(status.textContent).toBe('Selected to copy')
    })

    it('clears the announcement after the dwell', async () => {
      install(async () => {
        await Promise.reject(new Error('denied'))
      })
      const { button, status } = setup()
      await click(button)

      act(() => {
        vi.advanceTimersByTime(COPIED_RESET_MS)
      })
      expect(status.textContent).toBe('')
    })

    it('tells the call site nothing was copied', async () => {
      install(async () => {
        await Promise.reject(new Error('denied'))
      })
      const onCopied = vi.fn<(value: string) => void>()
      const { button } = setup({ onCopied })
      await click(button)
      expect(onCopied).not.toHaveBeenCalled()
    })

    // The field's own fallback is the field's, and an app that wants to say
    // more still hears of the refusal in its own right.
    it('hands the refusal to the call site', async () => {
      const denied = new Error('denied')
      install(async () => {
        await Promise.reject(denied)
      })
      const onCopyFailed = vi.fn<(error: unknown) => void>()
      const { button } = setup({ onCopyFailed })

      await click(button)

      expect(onCopyFailed).toHaveBeenCalledTimes(1)
      expect(onCopyFailed).toHaveBeenCalledWith(denied)
    })

    it('reports nothing when the write lands', async () => {
      const onCopyFailed = vi.fn<(error: unknown) => void>()
      const { button } = setup({ onCopyFailed })

      await click(button)

      expect(onCopyFailed).not.toHaveBeenCalled()
      expect(buttonNamed(button, 'Copied')).toBe(button)
    })

    // Outside a secure context the clipboard is not there at all, so the
    // throw is a TypeError from reading `writeText` off nothing rather than
    // the DOMException a denied permission gives. Both reach the same place.
    it('falls back where the clipboard is not there at all', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: undefined,
      })
      const onCopyFailed = vi.fn<(error: unknown) => void>()
      const onCopied = vi.fn<(value: string) => void>()
      const { button } = setup({ onCopied, onCopyFailed })

      await click(button)

      expect(onCopyFailed).toHaveBeenCalledTimes(1)
      expect(onCopied).not.toHaveBeenCalled()
      expect(window.getSelection()?.toString()).toBe(VALUE)
      expect(buttonNamed(button, 'Copy')).toBe(button)
    })

    // Where the older command still copies, the value is on the clipboard
    // after all, and that is a copy like any other.
    it('confirms when the older copy command copies', async () => {
      execCommand.mockReturnValue(true)
      install(async () => {
        await Promise.reject(new Error('denied'))
      })
      const onCopied = vi.fn<(value: string) => void>()
      const onCopyFailed = vi.fn<(error: unknown) => void>()
      const { button } = setup({ onCopied, onCopyFailed })

      await click(button)

      expect(execCommand).toHaveBeenCalledWith('copy')
      expect(buttonNamed(button, 'Copied')).toBe(button)
      expect(onCopied).toHaveBeenCalledWith(VALUE)
      expect(onCopyFailed).not.toHaveBeenCalled()
    })

    // The button does not change, which is also why it keeps the width it
    // had at rest.
    it('leaves the button exactly as it was at rest', async () => {
      install(async () => {
        await Promise.reject(new Error('denied'))
      })
      const { button } = setup({ onCopyFailed: vi.fn<(e: unknown) => void>() })
      const before = button.className
      const width = button.getBoundingClientRect().width

      await click(button)

      expect(button.className).toBe(before)
      expect(button.getBoundingClientRect().width).toBe(width)
    })

    it('takes words of its own for the selection', async () => {
      install(async () => {
        await Promise.reject(new Error('denied'))
      })
      const { button, status } = setup({ selectedLabel: 'Ready to copy' })
      await click(button)

      expect(status.textContent).toBe('Ready to copy')
    })
  })

  // One click selects exactly the value for a reader copying it by hand: a
  // double-click took one dotted segment, and a triple-click the line break
  // after it.
  it('selects the whole value from one click', () => {
    const { field } = setup()
    const value = field.querySelector('code')?.parentElement
    if (!(value instanceof HTMLElement)) {
      throw new Error('expected the value in a box of its own')
    }

    expect(getComputedStyle(value).userSelect).toBe('all')
  })

  // A button's own label changing is not reliably announced, so the
  // confirmation gets a live region of its own.
  describe('announcement', () => {
    it('says nothing at rest', () => {
      const { status } = setup()
      expect(status.textContent).toBe('')
    })

    it('announces the confirmation once the write lands', async () => {
      const { button, status } = setup()
      await click(button)
      expect(status.textContent).toBe('Copied')
    })

    it('clears the announcement after the dwell', async () => {
      const { button, status } = setup()
      await click(button)
      act(() => {
        vi.advanceTimersByTime(COPIED_RESET_MS)
      })
      expect(status.textContent).toBe('')
    })
  })

  // The button sits at the trailing end of the field, so a width that grew
  // on press moved leftwards under the pointer that had just pressed it, and
  // snapped back when the dwell ended.
  describe('the button’s width', () => {
    it('does not change when the label does', async () => {
      const { button } = setup()
      const before = button.getBoundingClientRect().width

      await click(button)

      expect(button.getBoundingClientRect().width).toBe(before)
    })

    // Both labels are in the DOM to hold the width, so the one not on show
    // has to be out of the accessibility tree — otherwise the button would
    // be named for both at once.
    it('is named for the label on show, not for both', async () => {
      const { button, queryByRole } = setup()

      expect(queryByRole('button', { name: 'Copy' })).toBe(button)
      expect(queryByRole('button', { name: 'Copied' })).toBeNull()

      await click(button)

      expect(queryByRole('button', { name: 'Copied' })).toBe(button)
      expect(queryByRole('button', { name: 'Copy' })).toBeNull()
    })

    // The room is held by a label that is present but not shown. Without the
    // hiding both would draw at once, stacked in the one cell — which the
    // width and the accessible name would both survive, so it takes a case
    // of its own.
    it('shows one label at a time', () => {
      const { button } = setup()
      const shown = [...button.querySelectorAll('span')].filter(
        (span) =>
          span.children.length === 0 &&
          span.textContent !== '' &&
          getComputedStyle(span).visibility !== 'hidden',
      )

      expect(shown.map((span) => span.textContent)).toEqual(['Copy'])
    })

    // A longer pair of labels sizes the button to the longer one, and still
    // does not move when it is pressed.
    it('holds a width the call site’s own labels ask for', async () => {
      const { button } = setup({
        copiedLabel: 'Copied to the clipboard',
        copyLabel: 'Copy',
      })
      const before = button.getBoundingClientRect().width

      await click(button)

      expect(button.getBoundingClientRect().width).toBe(before)
    })
  })
})
