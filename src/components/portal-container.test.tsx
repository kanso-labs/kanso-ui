import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ColorPicker from './color-picker'
import DatePicker from './date-picker'
import DateRangePicker from './date-range-picker'

// Read as source rather than as modules, the same way the barrel's own type
// coverage is: which React Aria surface a component renders is a fact about
// where a declaration is written, and a runtime import cannot see it.
const MODULE_SOURCES = import.meta.glob('./*/index.tsx', {
  eager: true,
  import: 'default',
  query: '?raw',
})

// The React Aria surfaces that portal. Each accepts a portal container, so a
// component rendering one has somewhere to forward the prop to — and without
// the prop, an app scoping its StyleX theme to a subtree cannot reach it.
const PORTALLED = /\bRAC(Popover|Modal|Tooltip)\b|\bModalOverlay\b/

/** Somewhere to portal into, cleaned up with the render that used it. */
function containerIn(view: ReturnType<typeof render>) {
  const container = document.createElement('div')
  view.baseElement.append(container)
  return container
}

describe('a component that portals a surface', () => {
  it('reads some module sources to check', () => {
    // A glob that matched nothing would make the case below pass over an
    // empty list.
    expect(Object.keys(MODULE_SOURCES).length).toBeGreaterThan(0)
  })

  // The rule `src/components/snackbar/index.tsx` states in prose, which was
  // false for the three pickers until they took the prop. Snackbar is not
  // here because its toast region takes no container: it reads a portal
  // provider `react-aria-components` does not export.
  it('takes a container to portal it into', () => {
    const missing = Object.entries(MODULE_SOURCES)
      .filter(([, source]) => PORTALLED.test(source))
      .filter(([, source]) => !source.includes('container?: Element'))
      .map(([path]) => path)

    expect(missing).toEqual([])
  })

  // The surface each picker opens, found inside the container rather than at
  // the end of `<body>` where it lands by default.
  it("puts a date picker's calendar in the container it was given", () => {
    const view = render(<DatePicker label="Label" />)
    const container = containerIn(view)

    view.rerender(<DatePicker container={container} label="Label" />)
    fireEvent.click(view.getByRole('button', { name: /Choose a date/ }))

    expect(view.getByRole('application')).toBeDefined()
    expect(container.contains(view.getByRole('application'))).toBe(true)
  })

  it("puts a date range picker's calendar in the container it was given", () => {
    const view = render(<DateRangePicker label="Label" />)
    const container = containerIn(view)

    view.rerender(<DateRangePicker container={container} label="Label" />)
    fireEvent.click(view.getByRole('button', { name: /Choose a date range/ }))

    expect(container.contains(view.getByRole('application'))).toBe(true)
  })

  it("puts a colour picker's surface in the container it was given", () => {
    const view = render(<ColorPicker label="Label" />)
    const container = containerIn(view)

    view.rerender(<ColorPicker container={container} label="Label" />)
    fireEvent.click(view.getByRole('button', { name: /Label/ }))

    expect(container.contains(view.getByRole('dialog'))).toBe(true)
  })
})
