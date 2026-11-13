import type { KeyboardEventHandler } from 'react'
import type {
  Key,
  ToggleButtonGroupProps,
  ToggleGroupState,
} from 'react-aria-components'

import { createElement, useContext } from 'react'
import { ToggleGroupStateContext } from 'react-aria-components'

// The radio group pattern from the ARIA Authoring Practices, laid over React
// Aria's `ToggleButtonGroup` where it chooses one item at a time. React Aria
// announces that mode as a radio group of radios but behaves as a toolbar:
// its arrows move focus alone and stop at the ends, so a screen reader
// reaches each radio without it being checked, and every item is a Tab stop,
// so Tab enters on the first whatever is checked. SegmentedButton and a
// single-selecting ButtonGroup both take the rest of the pattern from here,
// in two halves:
//
// - `radioGroupRenderer` is the group's `render`. Its keys move focus and
//   the choice together, wrapping at either end, with Home and End choosing
//   the first and last item.
// - `useRadioItem` is each item's. It writes the item's key onto its element
//   for those keys to choose it by, and keeps every item but the checked one
//   out of the Tab order, so Tab lands on the choice.
//
// The third part, keeping the choice from being pressed off, is the group's
// own `disallowEmptySelection`, which each component defaults to `true` in
// this mode.

type GroupRender = ToggleButtonGroupProps['render']

type RadioItemProps = {
  'data-key'?: string
  excludeFromTabOrder?: boolean
}

const NOT_A_RADIO: RadioItemProps = {}

// An item's key, back from the attribute `useRadioItem` writes it into. JSON
// rather than the key as written, so a numeric key comes back a number and
// matches the one React Aria's selection holds.
function keyOf(item: HTMLElement): Key | null {
  const written = item.dataset.key
  if (written === undefined) {
    return null
  }
  const key: unknown = JSON.parse(written)
  return typeof key === 'string' || typeof key === 'number' ? key : null
}

/**
 * The group's element, with the radio group's keys in place of React Aria's
 * keyboard handler, then handed to the call site's own `render` if it passed
 * one. For a `ToggleButtonGroup` choosing one item at a time.
 */
function radioGroupRenderer(render: GroupRender): NonNullable<GroupRender> {
  return (domProps, renderProps) => {
    const merged = {
      ...domProps,
      onKeyDownCapture: radioKeys(renderProps.state, domProps.onKeyDownCapture),
    }
    return render === undefined
      ? createElement('div', merged)
      : render(merged, renderProps)
  }
}

// The radio group's keys, taken ahead of React Aria's toolbar ones on the
// same capture listener: the arrows, Home and End move focus to an item and
// choose it, wrapping at the ends and passing over a disabled item, which is
// what the toolbar's own handler would otherwise do with focus alone.
// Everything else — Tab, and an arrow held with a modifier the browser may
// want — is handed to the toolbar as before.
function radioKeys(
  state: ToggleGroupState,
  toolbar: KeyboardEventHandler<HTMLDivElement> | undefined,
): KeyboardEventHandler<HTMLDivElement> {
  return (event) => {
    const group = event.currentTarget
    const items = [
      ...group.querySelectorAll<HTMLElement>('[data-key]:not([data-disabled])'),
    ].filter((item) => item.closest('[role="radiogroup"]') === group)
    const from = items.findIndex((item) => item === event.target)
    const step =
      event.altKey || event.ctrlKey || event.metaKey
        ? null
        : stepOf(event.key, getComputedStyle(group).direction === 'rtl')
    if (from === -1 || step === null) {
      toolbar?.(event)
      return
    }

    event.preventDefault()
    event.stopPropagation()
    const to =
      step === 'first'
        ? 0
        : step === 'last'
          ? items.length - 1
          : (from + step + items.length) % items.length
    const item = items[to]
    const key = keyOf(item)
    if (key === null) {
      return
    }
    item.focus()
    state.setSelected(key, true)
  }
}

// Where a key moves the choice in a radio group: one item on, one back, or
// to either end. Right and left follow the direction the group is drawn in,
// read off the group itself rather than the locale, so a `dir` on a wrapper
// turns them over as it turns the group over; up and down, and Home and End,
// follow the document order whatever the direction.
function stepOf(key: string, rtl: boolean): -1 | 1 | 'first' | 'last' | null {
  switch (key) {
    case 'ArrowDown': {
      return 1
    }
    case 'ArrowLeft': {
      return rtl ? 1 : -1
    }
    case 'ArrowRight': {
      return rtl ? -1 : 1
    }
    case 'ArrowUp': {
      return -1
    }
    case 'End': {
      return 'last'
    }
    case 'Home': {
      return 'first'
    }
    default: {
      return null
    }
  }
}

/**
 * The props an item of a `ToggleButtonGroup` takes while the group chooses
 * one at a time: its key, written where `radioGroupRenderer`'s keys read it,
 * since React Aria keeps an item's key off its element, and whether it stays
 * out of the Tab order. Every item but the checked one does while one is
 * checked, which is the radio group's single Tab stop; with nothing checked
 * every item keeps its own, and Tab enters on the first. Nothing outside a
 * single-selecting group, or for an item without an `id`, which React Aria
 * leaves out of the group's selection.
 */
function useRadioItem(id: Key | undefined): RadioItemProps {
  const group = useContext(ToggleGroupStateContext)
  if (group?.selectionMode !== 'single' || id === undefined) {
    return NOT_A_RADIO
  }
  return {
    'data-key': JSON.stringify(id),
    excludeFromTabOrder:
      group.selectedKeys.size > 0 && !group.selectedKeys.has(id),
  }
}

export { radioGroupRenderer, useRadioItem }
