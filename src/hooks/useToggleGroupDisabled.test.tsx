import type { Key } from 'react-aria-components'

import { render } from '@testing-library/react'
import { ToggleButton, ToggleButtonGroup } from 'react-aria-components'
import { describe, expect, it } from 'vitest'

import { useToggleGroupDisabled } from './useToggleGroupDisabled'

function Probe({ id }: { id?: Key }) {
  return <output>{String(useToggleGroupDisabled(id))}</output>
}

function probed(view: ReturnType<typeof render>) {
  return view.container.querySelector('output')?.textContent
}

describe('useToggleGroupDisabled', () => {
  it('reads false outside a group', () => {
    expect(probed(render(<Probe id="first" />))).toBe('false')
  })

  it('reads false in a group that is enabled', () => {
    const view = render(
      <ToggleButtonGroup>
        <Probe id="first" />
      </ToggleButtonGroup>,
    )
    expect(probed(view)).toBe('false')
  })

  // React Aria's own toggle beside the probe is what says the rule is React
  // Aria's: a toggle with an `id` is one of the group's and disabled with it,
  // and one without keeps its own state, enabled whatever the group says.
  it.each([
    ['with an id', 'first', true],
    ['without one', undefined, false],
  ] as const)(
    'agrees with React Aria about a toggle %s in a disabled group',
    (_name, id, disabled) => {
      const view = render(
        <ToggleButtonGroup isDisabled>
          <ToggleButton id={id}>Label</ToggleButton>
          <Probe id={id} />
        </ToggleButtonGroup>,
      )

      expect(view.container.querySelector('button')?.disabled).toBe(disabled)
      expect(probed(view)).toBe(String(disabled))
    },
  )
})
