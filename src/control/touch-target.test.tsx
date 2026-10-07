import type { ReactElement } from 'react'

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Button from '../components/button'
import Checkbox from '../components/checkbox'
import Chip from '../components/chip'
import ChipGroup from '../components/chip-group'
import IconButton from '../components/icon-button'
import NumberField from '../components/number-field'
import RadioGroup, { Radio } from '../components/radio-group'
import SegmentedButton from '../components/segmented-button'
import Switch from '../components/switch'

// The 48dp target the checkbox, radio button, switch and icon button pages
// each give as a measurement of their own, beside the smaller box they draw.
// Every one of them is reached by a transparent `::before` rather than by a
// larger container, so what a test can ask is where a press lands — a size
// read off the element would report the visible box and miss the point.
const TARGET = 48

// Room around every render, so a point just outside the control is still a
// point on the page. Rendered flush at the viewport's corner, a press 3px
// above or before the control is a press at a negative coordinate, which
// `elementFromPoint` answers with null whatever is drawn there — and the
// target read as missing on every side it actually reaches.
const ROOM = { padding: '24px' }

// Narrow enough that three chips wrap onto more than one row, so the gap
// between rows is there to be measured across.
const NARROW = { inlineSize: '160px', padding: '24px' }

// A remove handler that does nothing, hoisted so its identity is stable,
// which is what react-perf is after. What is measured is the target, not
// what a press on it does.
const noop = () => {}

/** An icon button at `size`, rendered with room around it. */
function buttonOf(size: 'lg' | 'md' | 'xl' | 'xs' | 'xxl') {
  const view = renderWithRoom(
    <IconButton aria-label="Label" size={size}>
      <span />
    </IconButton>,
  )

  return view.getByRole('button', { name: 'Label' })
}

/** The element drawn at exactly `width` by `height` under `root`. */
function drawnAt(root: ParentNode, width: number, height: number) {
  const found = [...root.querySelectorAll('span')].find((span) => {
    const box = span.getBoundingClientRect()

    return box.width === width && box.height === height
  })

  if (found === undefined) {
    throw new Error(`expected an element drawn at ${width} by ${height}`)
  }

  return found
}

/**
 * Whether a press `distance` outside `element`'s own edge still reaches it,
 * on each of the three sides a neighbour could sit.
 *
 * `document.elementFromPoint` answers with the element a press at that point
 * would go to, which is what makes it the right question here: a pseudo-element
 * is not returned itself, the element it belongs to is, so a target drawn that
 * way reads exactly as one drawn any other way.
 */
function reaches(element: Element, distance: number) {
  const box = element.getBoundingClientRect()
  const points = {
    above: [box.left + box.width / 2, box.top - distance],
    before: [box.left - distance, box.top + box.height / 2],
    below: [box.left + box.width / 2, box.bottom + distance],
  } as const

  return Object.fromEntries(
    Object.entries(points).map(([side, [x, y]]) => [
      side,
      document.elementFromPoint(x, y) === element,
    ]),
  )
}

function renderWithRoom(element: ReactElement) {
  return render(<div style={ROOM}>{element}</div>)
}

// NumberField's two steppers, found by the slot React Aria wires each one
// through rather than by name: the field labels its steppers with the field's
// own label as well as the button's, so the accessible name is the pair and
// not either half.
function steppersOf(element: ReactElement) {
  const view = renderWithRoom(element)
  const find = (slot: string) => {
    const found = view.container.querySelector(`button[slot="${slot}"]`)

    if (!(found instanceof HTMLElement)) {
      throw new Error(`expected the field to draw its ${slot} stepper`)
    }

    return found
  }

  return { minus: find('decrement'), plus: find('increment') }
}

const DISCED: ReadonlyArray<{ element: ReactElement; name: string }> = [
  { element: <Checkbox>Label</Checkbox>, name: 'Checkbox' },
  {
    element: (
      <RadioGroup label="Group">
        <Radio value="first">First item</Radio>
      </RadioGroup>
    ),
    name: 'Radio',
  },
]

describe('the 40dp control, which presses to 48', () => {
  // The pair is the point: a layer grown to 48 would pass the reach below
  // while moving every row in every form that draws one.
  it.each(DISCED)(
    'draws $name a 40dp state layer, not a 48dp one',
    ({ element }) => {
      const view = renderWithRoom(element)

      expect(() => drawnAt(view.container, 40, 40)).not.toThrow()
    },
  )

  it.each(DISCED)(
    'takes a press just inside 4dp outside $name',
    ({ element }) => {
      const view = renderWithRoom(element)
      const reach = (TARGET - 40) / 2

      expect(reaches(drawnAt(view.container, 40, 40), reach - 1)).toEqual({
        above: true,
        before: true,
        below: true,
      })
    },
  )

  // The other half: the box stops at the target rather than growing without
  // bound, which a reach tested from inside alone would never notice.
  it.each(DISCED)(
    'stops taking presses past 4dp outside $name',
    ({ element }) => {
      const view = renderWithRoom(element)
      const reach = (TARGET - 40) / 2

      expect(reaches(drawnAt(view.container, 40, 40), reach + 1)).toEqual({
        above: false,
        before: false,
        below: false,
      })
    },
  )
})

describe('the switch, whose track carries its own layer', () => {
  it('takes a press just inside 4dp above and below its 40dp control', () => {
    const view = renderWithRoom(<Switch>Label</Switch>)
    const control = drawnAt(view.container, 52, 40)
    const reach = (TARGET - 40) / 2

    expect(reaches(control, reach - 1)).toMatchObject({
      above: true,
      below: true,
    })
  })

  // Across, the control is already 52 and clears the target, so nothing is
  // drawn past its side — a reach there would be room taken from the label.
  it('draws nothing past its side, where 52 already clears the target', () => {
    const view = renderWithRoom(<Switch>Label</Switch>)

    expect(reaches(drawnAt(view.container, 52, 40), 1).before).toBe(false)
  })
})

describe('the icon button, of which the page requires two sizes', () => {
  const REQUIRED: ReadonlyArray<{ drawn: number; size: 'md' | 'xs' }> = [
    { drawn: 32, size: 'xs' },
    { drawn: 40, size: 'md' },
  ]

  it.each(REQUIRED)('keeps $size drawn at $drawn', ({ drawn, size }) => {
    const box = buttonOf(size).getBoundingClientRect()

    expect(box.width).toBe(drawn)
    expect(box.height).toBe(drawn)
  })

  it.each(REQUIRED)('takes a press out to 48 for $size', ({ drawn, size }) => {
    const reach = (TARGET - drawn) / 2

    expect(reaches(buttonOf(size), reach - 1)).toEqual({
      above: true,
      before: true,
      below: true,
    })
  })

  it.each(REQUIRED)('stops at 48 for $size', ({ drawn, size }) => {
    const reach = (TARGET - drawn) / 2

    expect(reaches(buttonOf(size), reach + 1)).toEqual({
      above: false,
      before: false,
      below: false,
    })
  })

  // The three larger sizes are over the target already, so nothing is drawn
  // around them — a reach there would be room taken from whatever sits beside
  // the button for no gain.
  it.each(['lg', 'xl', 'xxl'] as const)('draws no target around %s', (size) => {
    expect(reaches(buttonOf(size), 1)).toEqual({
      above: false,
      before: false,
      below: false,
    })
  })
})

describe('the number field, where two targets share a row', () => {
  // Side by side they are extra-small icon buttons, so each reaches 8dp past
  // its own edge. Flush, those reaches would cross into the neighbour's glyph
  // and a press on minus would increment; the gap is what keeps each press on
  // the button under it.
  it('keeps each inline stepper pressable over the whole of its glyph', () => {
    const { minus, plus } = steppersOf(
      <NumberField label="Label" steppers="horizontal" />,
    )

    for (const stepper of [minus, plus]) {
      const box = stepper.getBoundingClientRect()
      const middle = box.top + box.height / 2

      expect([
        document.elementFromPoint(box.left + 1, middle),
        document.elementFromPoint(box.right - 1, middle),
      ]).toEqual([stepper, stepper])
    }
  })

  // The stacked column is the library's one control under the target, and the
  // reason is in the component's header comment: two 48dp targets inside a
  // 56dp column would overlap over most of their height, so a press in the
  // overlap would go to whichever box was uppermost rather than to the glyph
  // under the finger.
  it('leaves the stacked steppers at the size the column has room for', () => {
    const { plus } = steppersOf(<NumberField label="Label" />)
    const box = plus.getBoundingClientRect()

    expect(box.width).toBe(32)
    expect(box.height).toBeLessThan(TARGET)
  })
})

/**
 * The element whose text is `label` climbs to, found by what it is rather
 * than by a class: the chip or segment that holds the label.
 */
function holding(view: ReturnType<typeof render>, label: string, role: string) {
  const found = view.getByText(label).closest(`[role="${role}"], ${role}`)

  if (found === null) {
    throw new Error(`expected ${label} inside a ${role}`)
  }

  return found
}

/** A labelled button at `size`, rendered with room around it. */
function labelledButton(size: 'lg' | 'md' | 'xs') {
  return renderWithRoom(<Button size={size}>Label</Button>).getByRole('button')
}

/** The first of two segments, rendered with room around the track. */
function segment() {
  const view = renderWithRoom(
    <SegmentedButton aria-label="Label">
      <SegmentedButton.Segment id="first">First item</SegmentedButton.Segment>
      <SegmentedButton.Segment id="second">Second item</SegmentedButton.Segment>
    </SegmentedButton>,
  )

  return holding(view, 'First item', 'button')
}

// A button and a segment are wide enough across, so the target reaches above
// and below alone — a reach past the side would be room taken from whatever
// sits beside them, and the segments sit flush against each other.
describe('the button, of which the page requires two sizes', () => {
  const REQUIRED: ReadonlyArray<{ drawn: number; size: 'md' | 'xs' }> = [
    { drawn: 32, size: 'xs' },
    { drawn: 40, size: 'md' },
  ]

  it.each(REQUIRED)('keeps $size drawn at $drawn', ({ drawn, size }) => {
    expect(labelledButton(size).getBoundingClientRect().height).toBe(drawn)
  })

  it.each(REQUIRED)(
    'takes a press out to 48 above and below $size',
    ({ drawn, size }) => {
      const reach = (TARGET - drawn) / 2

      expect(reaches(labelledButton(size), reach - 1)).toEqual({
        above: true,
        before: false,
        below: true,
      })
    },
  )

  it.each(REQUIRED)('stops at 48 for $size', ({ drawn, size }) => {
    const reach = (TARGET - drawn) / 2

    expect(reaches(labelledButton(size), reach + 1)).toMatchObject({
      above: false,
      below: false,
    })
  })

  // Its 12 a side clears 48 across only for a label at least 24 wide, so a
  // narrower extra-small button reaches past its sides as well, and only as
  // far as 48. The labelled cases above are wider, and stop at the sides.
  it('takes a press out to 48 across an xs narrower than that', () => {
    const button = renderWithRoom(
      <Button aria-label="Label" size="xs">
        <span />
      </Button>,
    ).getByRole('button')
    const reach = (TARGET - button.getBoundingClientRect().width) / 2

    // A button already 48 across would leave nothing to measure.
    expect(reach).toBeGreaterThan(1)
    expect(reaches(button, reach - 1).before).toBe(true)
    expect(reaches(button, reach + 1).before).toBe(false)
  })

  it('draws no target around lg, which is over it already', () => {
    expect(reaches(labelledButton('lg'), 1)).toMatchObject({
      above: false,
      below: false,
    })
  })
})

describe('the segmented button, whose track is 40', () => {
  it('takes a press out to 48 above and below a segment', () => {
    expect(reaches(segment(), (TARGET - 40) / 2 - 1)).toEqual({
      above: true,
      before: false,
      below: true,
    })
  })

  it('stops at 48 for a segment', () => {
    expect(reaches(segment(), (TARGET - 40) / 2 + 1)).toMatchObject({
      above: false,
      below: false,
    })
  })
})

describe('the chip, which is 32', () => {
  it('takes a press out to 48 above and below a chip on its own', () => {
    const chip = renderWithRoom(<Chip>Label</Chip>).getByRole('button')

    expect(reaches(chip, (TARGET - 32) / 2 - 1)).toEqual({
      above: true,
      before: false,
      below: true,
    })
    expect(reaches(chip, (TARGET - 32) / 2 + 1)).toMatchObject({
      above: false,
      below: false,
    })
  })

  // In a group the rows wrap 8dp apart, and a full 48dp target on each chip
  // would lay one row's reach over the next one's. Each reaches halfway
  // across the gap instead, so the two meet without either covering the
  // other, and a press between rows goes to the nearer chip.
  it('reaches halfway across the gap between the rows of a group', () => {
    const view = render(
      <div style={NARROW}>
        <ChipGroup label="Label">
          <ChipGroup.Chip id="first">First item</ChipGroup.Chip>
          <ChipGroup.Chip id="second">Second item</ChipGroup.Chip>
          <ChipGroup.Chip id="third">Third item</ChipGroup.Chip>
        </ChipGroup>
      </div>,
    )
    const first = holding(view, 'First item', 'row')
    const second = holding(view, 'Second item', 'row')

    // The case only means something once the chips have wrapped.
    expect(second.getBoundingClientRect().top).toBeGreaterThan(
      first.getBoundingClientRect().bottom,
    )
    expect(reaches(first, 3).below).toBe(true)
    expect(reaches(first, 5).below).toBe(false)
  })

  // The close target sits inside a chip that is itself a press target when
  // the group selects, so WCAG's 24px minimum is its own box to meet: the
  // chip around it is no spacing to lean on.
  it('gives the close target 24px of its own', () => {
    const view = renderWithRoom(
      <ChipGroup label="Label" onRemove={noop} selectionMode="multiple">
        <ChipGroup.Chip id="first">First item</ChipGroup.Chip>
      </ChipGroup>,
    )
    const remove = view.getByRole('button', { name: /Remove/ })

    expect(remove.getBoundingClientRect().width).toBe(18)
    expect(reaches(remove, 2)).toEqual({
      above: true,
      before: true,
      below: true,
    })
    expect(reaches(remove, 4)).toEqual({
      above: false,
      before: false,
      below: false,
    })
  })
})
