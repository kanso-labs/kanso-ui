import type { ReactNode } from 'react'

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import AppBar from './app-bar'
import List from './list'
import ListItem from './list-item'
import Meter from './meter'
import ProgressIndicator from './progress-indicator'

// What a call site passes for "nothing here": `leading={user.avatar &&
// <Avatar />}`, a note that is `null`, an empty string. React draws none of
// them, and each slot below once took them for content — drawing an empty
// wrapper and its gap, counting a line it never showed, or naming a meter
// after an empty label.
const NOTHING: ReadonlyArray<[string, ReactNode]> = [
  ['null', null],
  ['false', false],
  ['an empty string', ''],
]

/** A ListItem with `value` in every slot. */
function itemOf(value: ReactNode) {
  return render(
    <ListItem
      leading={value}
      overline={value}
      supporting={value}
      trailing={value}
    >
      Headline
    </ListItem>,
  )
}

/** A List row with `value` in every slot. */
function listOf(value: ReactNode) {
  return render(
    <List aria-label="Label">
      <List.Item
        id="first"
        leading={value}
        overline={value}
        supporting={value}
        trailing={value}
      >
        Headline
      </List.Item>
    </List>,
  )
}

/** A row's height and where its headline starts, for comparing two rows. */
function shapeOf(container: HTMLElement, headline: string) {
  const row = container.querySelector('[role="row"], [data-rac], div, button')
  const text = [...container.querySelectorAll('span')].find(
    (span) => span.textContent === headline,
  )
  if (!(row instanceof HTMLElement) || text === undefined) {
    throw new Error('expected a row with its headline')
  }
  return {
    height: Math.round(row.getBoundingClientRect().height),
    start: Math.round(
      text.getBoundingClientRect().left - row.getBoundingClientRect().left,
    ),
  }
}

describe('an empty slot', () => {
  it.each(NOTHING)(
    'draws a List row with %s as it draws one with nothing',
    (_name, nothing) => {
      const bare = listOf(undefined)
      const expected = shapeOf(bare.container, 'Headline')
      bare.unmount()

      expect(shapeOf(listOf(nothing).container, 'Headline')).toEqual(expected)
    },
  )

  it.each(NOTHING)(
    'draws a ListItem with %s as it draws one with nothing',
    (_name, nothing) => {
      const bare = itemOf(undefined)
      const expected = shapeOf(bare.container, 'Headline')
      bare.unmount()

      expect(shapeOf(itemOf(nothing).container, 'Headline')).toEqual(expected)
    },
  )

  it.each(NOTHING)(
    'draws no empty part of an AppBar for %s',
    (_name, nothing) => {
      const view = render(
        <AppBar
          headline={nothing}
          leading={nothing}
          subtitle={nothing}
          trailing={nothing}
        />,
      )

      expect(view.queryByRole('heading')).toBeNull()
      expect(view.container.querySelector('p')).toBeNull()
      // The bar's row holds the text block alone.
      const row = view.container.firstElementChild!.firstElementChild!
      expect(row.children).toHaveLength(1)
    },
  )

  it.each(NOTHING)(
    'names neither indicator after a label of %s',
    (_name, nothing) => {
      const view = render(
        <>
          <Meter
            aria-label="First"
            label={nothing}
            showValue={false}
            value={40}
          />
          <ProgressIndicator aria-label="Second" label={nothing} value={40} />
        </>,
      )

      expect(view.getByRole('meter').getAttribute('aria-labelledby')).toBeNull()
      expect(
        view.getByRole('progressbar').getAttribute('aria-labelledby'),
      ).toBeNull()
    },
  )
})
