import type {
  FocusEventHandler,
  KeyboardEventHandler,
  PointerEventHandler,
} from 'react'
import type {
  Key,
  ToggleButtonGroupProps,
  ToggleGroupState,
} from 'react-aria-components'

import { createElement, useContext } from 'react'
import { ToggleGroupStateContext } from 'react-aria-components'

// What SegmentedButton and a ButtonGroup given `selectionMode` lay over
// React Aria's `ToggleButtonGroup`, in two parts.
//
// The first is for both modes. React Aria's toolbar hands focus back to the
// item it last left from whenever focus comes back into the group, which is
// the toolbar pattern's own memory for the keyboard, and a pointer pressing
// an item is focus coming back too: the pressed item was chosen while focus
// went to the one the keyboard had left, so the next arrow moved on from
// there. The group keeps that memory here instead, and lets a pointer's
// focus stay on the item it pressed.
//
// The second is the radio group pattern from the ARIA Authoring Practices,
// where the group chooses one item at a time. React Aria announces that
// mode as a radio group of radios but behaves as a toolbar: its arrows move
// focus alone and stop at the ends, so a screen reader reaches each radio
// without it being checked, and every item is a Tab stop, so Tab enters on
// the first whatever is checked. Two halves take the rest of the pattern:
//
// - `toggleGroupRenderer`'s keys, in that mode, move focus and the choice
//   together, wrapping at either end, with Home and End choosing the first
//   and last item.
// - `useRadioItem` is each item's. It writes the item's key onto its element
//   for those keys to choose it by, and keeps every item but the checked one
//   out of the Tab order, so Tab lands on the choice.
//
// The third part, keeping the choice from being pressed off, is the group's
// own `disallowEmptySelection`, which each component defaults to `true` in
// that mode.

type GroupDOMProps = Parameters<NonNullable<GroupRender>>[0]

type GroupRender = ToggleButtonGroupProps['render']

type RadioItemProps = {
  'data-key'?: string
  excludeFromTabOrder?: boolean
}

const NOT_A_RADIO: RadioItemProps = {}

// The item each group last held focus on as focus left it, to hand focus
// back to when it returns.
const lastFocused = new WeakMap<Element, HTMLElement>()

// The element a pointer last went down on in each group, until the focus
// that press moves arrives, or focus leaves.
const pressed = new WeakMap<Element, Element>()

// The toolbar's focus memory, kept by the group rather than by React Aria:
// the same record, taken as Tab leaves the group or as focus moves out of it
// some other way, and the same hand-back when focus returns, unless the
// focus arriving is a pointer's on the item it pressed. React Aria's record
// is private to its hook, so its two handlers are replaced rather than
// wrapped: let run, the hand-back would move focus off the pressed item.
//
// React Aria leaves all of this off a group inside another toolbar, whose
// own memory is the one that applies, and so does this.
function focusMemory(
  domProps: GroupDOMProps,
  keys: KeyboardEventHandler<HTMLDivElement> | undefined,
): Pick<
  GroupDOMProps,
  | 'onBlurCapture'
  | 'onFocusCapture'
  | 'onKeyDownCapture'
  | 'onPointerDownCapture'
> {
  if (domProps.onFocusCapture === undefined) {
    return { onKeyDownCapture: keys }
  }
  return {
    onBlurCapture: rememberLeaving,
    onFocusCapture: handBack,
    onKeyDownCapture: rememberTab(keys),
    onPointerDownCapture: rememberPress,
  }
}

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
 * The group's element, with the group's own memory of where focus left it in
 * place of React Aria's, and with the radio group's keys in place of React
 * Aria's keyboard handler while `single` — then handed to the call site's own
 * `render` if it passed one.
 */
function toggleGroupRenderer(
  render: GroupRender,
  single: boolean,
): NonNullable<GroupRender> {
  return (domProps, renderProps) => {
    const keys = single
      ? radioKeys(renderProps.state, domProps.onKeyDownCapture)
      : domProps.onKeyDownCapture
    const merged = { ...domProps, ...focusMemory(domProps, keys) }
    return render === undefined
      ? createElement('div', merged)
      : render(merged, renderProps)
  }
}

const rememberLeaving: FocusEventHandler<HTMLDivElement> = (event) => {
  const group = event.currentTarget
  pressed.delete(group)
  if (
    !group.contains(event.relatedTarget) &&
    !lastFocused.has(group) &&
    event.target instanceof HTMLElement
  ) {
    lastFocused.set(group, event.target)
  }
}

const handBack: FocusEventHandler<HTMLDivElement> = (event) => {
  const group = event.currentTarget
  const press = pressed.get(group)
  pressed.delete(group)
  // Focus moving between items, or arriving in a portal the group renders,
  // which React carries up to the group as though it were inside it.
  if (group.contains(event.relatedTarget) || !group.contains(event.target)) {
    return
  }
  const last = lastFocused.get(group)
  lastFocused.delete(group)
  const isPress = press !== undefined && event.target.contains(press)
  if (!isPress && last !== undefined && group.contains(last)) {
    last.focus()
  }
}

const rememberPress: PointerEventHandler<HTMLDivElement> = (event) => {
  if (event.target instanceof Element) {
    pressed.set(event.currentTarget, event.target)
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

// Tab leaves from the item it is pressed on, which is the record: React
// Aria's handler then moves focus to the group's last item for the browser's
// own Tab to carry it out from, so the focus leaving is that item's.
function rememberTab(
  keys: KeyboardEventHandler<HTMLDivElement> | undefined,
): KeyboardEventHandler<HTMLDivElement> {
  return (event) => {
    if (event.key === 'Tab' && event.target instanceof HTMLElement) {
      lastFocused.set(event.currentTarget, event.target)
    }
    keys?.(event)
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
 * one at a time: its key, written where `toggleGroupRenderer`'s keys read it,
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

export { toggleGroupRenderer, useRadioItem }
