import type { CalendarDate } from '@internationalized/date'
import type { ReactElement, ReactNode, Ref } from 'react'
import type { Key, Selection } from 'react-aria-components'

import { endOfMonth, startOfMonth } from '@internationalized/date'
import * as stylex from '@stylexjs/stylex'
import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  ButtonContext,
  CalendarStateContext,
  Button as RACButton,
  CalendarGridHeader as RACCalendarGridHeader,
  CalendarHeaderCell as RACCalendarHeaderCell,
  CalendarMonthPicker as RACCalendarMonthPicker,
  CalendarYearPicker as RACCalendarYearPicker,
  Heading as RACHeading,
  ListBox as RACListBox,
  ListBoxItem as RACListBoxItem,
  RangeCalendarStateContext,
} from 'react-aria-components'

import { ArrowDropDownGlyph, CheckGlyph, ChevronEndGlyph } from '../glyphs'
import { focus } from '../styles/focus'
import { iconButton } from '../styles/icon-button'
import { calendarStyles, dateLayers, menuLayers } from './styles'

// The parts Calendar and RangeCalendar both render: the row that moves the
// month, the weekday header, and the offsets that put more than one month
// side by side. Apart from either component so the two cannot drift, and
// outside `src/components` for the reason ./styles.ts gives.

/** One entry of React Aria's month or year picker, as either lists it. */
type MenuEntry = { date: CalendarDate; formatted: string; id: number }

/** What React Aria's month and year pickers hand the element they render. */
type MenuPicker = {
  'aria-label': string
  items: MenuEntry[]
  onChange: (key: Key | null) => void
  value: Key
}

type OpenMenu = 'month' | 'year'

/**
 * What a calendar draws above its months, and the months themselves. With
 * `showMonthYearMenus` the header is the date pickers page's docked one —
 * the month and the year as menu buttons — and while either is open its list
 * takes the months' place.
 */
function CalendarFrame({
  children,
  showMonthYearMenus,
}: {
  children: ReactNode
  showMonthYearMenus: boolean
}): ReactElement {
  if (showMonthYearMenus) {
    return <CalendarMenus>{children}</CalendarMenus>
  }

  return (
    <>
      <CalendarHeader />
      {children}
    </>
  )
}

function CalendarGridHeader(): ReactElement {
  return <RACCalendarGridHeader>{calendarHeaderCell}</RACCalendarGridHeader>
}

/**
 * The two chevrons with the month between them. React Aria wires
 * `slot="previous"` and `slot="next"` on its own `Button`, and `IconButton`
 * renders React Aria's `Button` too — so nesting one inside a slot would put
 * two buttons where the date pickers page draws one. The chevrons take the
 * icon buttons page's 40dp square and its state layer instead.
 *
 * A plain element rather than a `<header>`: a header is a banner landmark,
 * landmarks may not nest, and React Aria puts a calendar in
 * `role="application"` — axe fails the page on it.
 */
function CalendarHeader(): ReactElement {
  return (
    <div {...stylex.props(calendarStyles.header)}>
      <RACButton className={chevronClassName} slot="previous">
        <ChevronEndGlyph
          {...stylex.props(
            calendarStyles.chevronGlyph,
            calendarStyles.chevronGlyphPrevious,
          )}
        />
      </RACButton>
      <RACHeading {...stylex.props(calendarStyles.heading)} />
      <RACButton className={chevronClassName} slot="next">
        <ChevronEndGlyph {...stylex.props(calendarStyles.chevronGlyph)} />
      </RACButton>
    </div>
  )
}

/** The weekday row, in the type the page gives both it and the dates. */
function calendarHeaderCell(day: string): ReactElement {
  return (
    <RACCalendarHeaderCell {...stylex.props(calendarStyles.headerCell)}>
      {day}
    </RACCalendarHeaderCell>
  )
}

/**
 * The docked header: the month's menu button between the chevrons that step
 * it, and the year's menu button at the end. A press opens the button's list
 * in the months' place, where the page draws it, rather than in a popover over
 * them; a calendar inside a picker is already in one. While a list is open
 * the chevrons are hidden and the other menu is disabled, as the page draws
 * them, and choosing an entry — or pressing the one already checked, or
 * Escape — closes the list and puts focus back on its button.
 *
 * The lists are React Aria's month and year pickers, rendered twice: the
 * header names the month short, as the page's button does, and the list in
 * full. The year list holds the years `minValue` and `maxValue` allow and no
 * others, which React Aria bounds itself; a month with no day inside them is
 * disabled here.
 */
function CalendarMenus({ children }: { children: ReactNode }): ReactElement {
  const single = useContext(CalendarStateContext)
  const range = useContext(RangeCalendarStateContext)
  const state = single ?? range
  const [open, setOpen] = useState<null | OpenMenu>(null)
  const listId = useId()
  const monthButton = useRef<HTMLButtonElement>(null)
  const yearButton = useRef<HTMLButtonElement>(null)

  // A frame after the choice, and focus back on the button before the list
  // goes, rather than lost with it. The key that chose still has a keypress
  // to deliver: React Aria leaves Enter's default alone on a Mac, and with
  // focus already moved the keypress pressed the menu button and opened the
  // list again. A frame later it has landed on the list instead, as the
  // click after a pointer's choice has.
  const close = useCallback(() => {
    const button = open === 'month' ? monthButton : yearButton
    requestAnimationFrame(() => {
      button.current?.focus()
      setOpen(null)
    })
  }, [open])
  const toggleMonth = useCallback(() => {
    setOpen((current) => (current === 'month' ? null : 'month'))
  }, [])
  const toggleYear = useCallback(() => {
    setOpen((current) => (current === 'year' ? null : 'year'))
  }, [])

  const isDisabled = state?.isDisabled ?? false
  const outsideBounds = (picker: MenuPicker) =>
    picker.items
      .filter(
        (entry) =>
          (state?.maxValue != null &&
            startOfMonth(entry.date).compare(state.maxValue) > 0) ||
          (state?.minValue != null &&
            endOfMonth(entry.date).compare(state.minValue) < 0),
      )
      .map((entry) => entry.id)

  return (
    <>
      <div {...stylex.props(calendarStyles.header)}>
        <div {...stylex.props(calendarStyles.headerGroup)}>
          <RACButton
            className={chevronClassNameWhile(open !== null)}
            slot="previous"
          >
            <ChevronEndGlyph
              {...stylex.props(
                calendarStyles.chevronGlyph,
                calendarStyles.chevronGlyphPrevious,
              )}
            />
          </RACButton>
          <RACCalendarMonthPicker>
            {(picker) => (
              <MenuButton
                controls={listId}
                isDisabled={isDisabled || open === 'year'}
                isExpanded={open === 'month'}
                onPress={toggleMonth}
                picker={picker}
                ref={monthButton}
              />
            )}
          </RACCalendarMonthPicker>
          <RACButton
            className={chevronClassNameWhile(open !== null)}
            slot="next"
          >
            <ChevronEndGlyph {...stylex.props(calendarStyles.chevronGlyph)} />
          </RACButton>
        </div>
        <RACCalendarYearPicker>
          {(picker) => (
            <MenuButton
              controls={listId}
              isDisabled={isDisabled || open === 'month'}
              isExpanded={open === 'year'}
              onPress={toggleYear}
              picker={picker}
              ref={yearButton}
            />
          )}
        </RACCalendarYearPicker>
      </div>
      {open === null ? children : null}
      {open === 'month' ? (
        <RACCalendarMonthPicker format="long">
          {(picker) => (
            <MenuList
              disabledKeys={outsideBounds(picker)}
              id={listId}
              onClose={close}
              picker={picker}
            />
          )}
        </RACCalendarMonthPicker>
      ) : null}
      {open === 'year' ? (
        <RACCalendarYearPicker>
          {(picker) => <MenuList id={listId} onClose={close} picker={picker} />}
        </RACCalendarYearPicker>
      ) : null}
    </>
  )
}

// A chevron's classes, from React Aria's own render state. React Aria
// disables one when the month it would move to is outside `minValue` and
// `maxValue`, or the whole calendar is disabled, and a press on it then does
// nothing — so it takes the shared fade, which drops the state layer too.
function chevronClassName(
  state: { isDisabled: boolean; isHovered: boolean; isPressed: boolean },
  isHidden = false,
) {
  return (
    stylex.props(
      iconButton.chrome,
      calendarStyles.chevron,
      focus.ring,
      state.isHovered && iconButton.chromeHovered,
      state.isPressed && iconButton.chromePressed,
      state.isDisabled && iconButton.chromeDisabled,
      isHidden && calendarStyles.chevronHidden,
    ).className ?? ''
  )
}

// The same, hidden while a month or year list is open.
function chevronClassNameWhile(isListOpen: boolean) {
  return (state: {
    isDisabled: boolean
    isHovered: boolean
    isPressed: boolean
  }) => chevronClassName(state, isListOpen)
}

/**
 * The month or the year as the page's menu button, opening its list. Named
 * by what it shows and then by what it is — "Sep month" — which keeps the
 * visible text the start of the name, so a reader who says what they see
 * reaches it.
 *
 * Outside React Aria's button context, which a calendar fills with its
 * `previous` and `next` slots alone: a button with no slot inside it is an
 * error, and these are not either chevron.
 */
function MenuButton({
  controls,
  isDisabled,
  isExpanded,
  onPress,
  picker,
  ref,
}: {
  controls: string
  isDisabled: boolean
  isExpanded: boolean
  onPress: () => void
  picker: MenuPicker
  ref: Ref<HTMLButtonElement>
}): ReactElement {
  const valueId = useId()
  const nameId = useId()
  const shown = picker.items.find((entry) => entry.id === picker.value)

  return (
    <ButtonContext value={null}>
      <RACButton
        aria-controls={isExpanded ? controls : undefined}
        aria-expanded={isExpanded}
        aria-haspopup="listbox"
        aria-labelledby={`${valueId} ${nameId}`}
        className={menuButtonClassName}
        isDisabled={isDisabled}
        onPress={onPress}
        ref={ref}
      >
        <span id={valueId}>{shown?.formatted}</span>
        <span hidden id={nameId}>
          {picker['aria-label']}
        </span>
        <ArrowDropDownGlyph
          {...stylex.props(
            calendarStyles.menuArrow,
            isExpanded && calendarStyles.menuArrowExpanded,
          )}
        />
      </RACButton>
    </ButtonContext>
  )
}

// A menu button's classes, from React Aria's render state, with the icon
// buttons' state layers and fade — see `menuButton`.
function menuButtonClassName(state: {
  isDisabled: boolean
  isHovered: boolean
  isPressed: boolean
}) {
  return (
    stylex.props(
      calendarStyles.menuButton,
      focus.ring,
      state.isHovered && iconButton.chromeHovered,
      state.isPressed && iconButton.chromePressed,
      state.isDisabled && iconButton.chromeDisabled,
    ).className ?? ''
  )
}

// One row of an open list: the check where the row is the one shown, the
// room it takes where it is not, then the month or the year. Built by a call
// rather than written inline at the prop, which is what react-perf's
// no-new-function-as-prop is after.
function menuEntry(entry: MenuEntry): ReactElement {
  return (
    <RACListBoxItem
      className={menuItemClassName}
      id={entry.id}
      textValue={entry.formatted}
    >
      {menuEntryContent(entry.formatted)}
    </RACListBoxItem>
  )
}

function menuEntryContent(label: string) {
  return ({ isSelected }: { isSelected: boolean }) => (
    <>
      {isSelected ? (
        <CheckGlyph {...stylex.props(calendarStyles.menuCheck)} />
      ) : (
        <span {...stylex.props(calendarStyles.menuCheck)} />
      )}
      {label}
    </>
  )
}

// A row's classes, from React Aria's render state. The layers come after the
// checked row's surface variant, written for whichever ground the row has,
// and the fade last, which StyleX lets drop them by replacing a property
// whole.
function menuItemClassName(state: {
  isDisabled: boolean
  isFocusVisible: boolean
  isHovered: boolean
  isPressed: boolean
  isSelected: boolean
}) {
  return (
    stylex.props(
      calendarStyles.menuItem,
      state.isSelected && calendarStyles.menuItemSelected,
      state.isHovered &&
        (state.isSelected
          ? menuLayers.selectedHovered
          : dateLayers.plainHovered),
      state.isPressed &&
        (state.isSelected
          ? menuLayers.selectedPressed
          : dateLayers.plainPressed),
      state.isFocusVisible && calendarStyles.menuItemFocused,
      state.isDisabled && calendarStyles.menuItemDisabled,
    ).className ?? ''
  )
}

/**
 * An open month or year list, in the months' place. React Aria's list box,
 * with the entry the calendar shows selected and focused when it opens.
 *
 * Choosing closes it, and so does pressing the checked entry or Escape. A
 * single selection that may empty is what tells those apart: choosing
 * replaces the selection, while the checked entry toggles it off and Escape
 * clears it — and the clearing is what stops Escape there rather than letting
 * it close a picker's dialog around the calendar.
 */
function MenuList({
  disabledKeys,
  id,
  onClose,
  picker,
}: {
  disabledKeys?: Key[]
  id: string
  onClose: () => void
  picker: MenuPicker
}): ReactElement {
  const list = useRef<HTMLDivElement>(null)
  const selected = useMemo(() => [picker.value], [picker.value])
  const choose = useCallback(
    (keys: Selection) => {
      // The one entry a single selection holds after a choice, and none
      // after the checked entry is pressed again or Escape clears it.
      if (keys !== 'all') {
        for (const key of keys) {
          picker.onChange(key)
        }
      }
      onClose()
    },
    [onClose, picker],
  )

  // The checked entry opens in the middle of the list, as the page draws it,
  // with the entries either side of it in view. React Aria scrolls the entry
  // it focuses only as far as the nearest edge, which left the year shown at
  // the bottom with every later year out of sight. A frame after opening,
  // since React Aria renders its entries a render after the list mounts and
  // scrolls once it has; and the list's own scroll alone moves, where
  // `scrollIntoView` would move the page around it too.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const element = list.current
      const checked = element?.querySelector('[aria-selected="true"]')
      if (element == null || !(checked instanceof HTMLElement)) {
        return
      }
      element.scrollTop +=
        checked.getBoundingClientRect().top -
        element.getBoundingClientRect().top -
        (element.clientHeight - checked.offsetHeight) / 2
    })
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <RACListBox
      aria-label={picker['aria-label']}
      // oxlint-disable-next-line jsx-a11y/no-autofocus -- a list opened from its button takes focus, as a select's does
      autoFocus
      disabledKeys={disabledKeys}
      id={id}
      items={picker.items}
      onSelectionChange={choose}
      ref={list}
      selectedKeys={selected}
      selectionMode="single"
      // On the release rather than the press, so the pointer is done with the
      // list before it closes: chosen on the press, the release landed on
      // whatever the closing list uncovered beneath it.
      shouldSelectOnPressUp
      {...stylex.props(calendarStyles.menuList)}
    >
      {menuEntry}
    </RACListBox>
  )
}

export { CalendarFrame, CalendarGridHeader }
