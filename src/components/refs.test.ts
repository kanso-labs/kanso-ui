import type { ComponentProps } from 'react'

import { describe, expectTypeOf, it } from 'vitest'

import type * as components from '.'

type Barrel = typeof components

// Every component in the barrel whose props have no `ref`. React 19 passes a
// ref as a prop, so a props type without one rejects `<Button ref={r}>` at
// the call site even where the ref would reach the element at runtime —
// styling.test.tsx renders every component with one and pins where it lands.
type Refless = {
  [Name in keyof Barrel]: Barrel[Name] extends (props: infer Props) => unknown
    ? 'ref' extends keyof Props
      ? never
      : Name
    : never
}[keyof Barrel]

describe('a ref, as a call site writes one', () => {
  // The four that render no element of their own: Autocomplete and
  // FileTrigger, which wrap whatever they are given, and the overlays whose
  // root is a trigger, which take a ref on their content part instead.
  it('is accepted by every component that renders an element', () => {
    expectTypeOf<Refless>().toEqualTypeOf<
      'Autocomplete' | 'Dialog' | 'FileTrigger' | 'Menu' | 'Popover' | 'Sheet'
    >()
  })

  it('is accepted by the content part of each overlay', () => {
    expectTypeOf<ComponentProps<Barrel['Dialog']['Content']>>().toHaveProperty(
      'ref',
    )
    expectTypeOf<ComponentProps<Barrel['Menu']['Content']>>().toHaveProperty(
      'ref',
    )
    expectTypeOf<ComponentProps<Barrel['Popover']['Content']>>().toHaveProperty(
      'ref',
    )
    expectTypeOf<ComponentProps<Barrel['Sheet']['Content']>>().toHaveProperty(
      'ref',
    )
  })
})
