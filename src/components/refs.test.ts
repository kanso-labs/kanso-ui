import type { ComponentProps } from 'react'

import { describe, expectTypeOf, it } from 'vitest'

import type * as components from '.'

type Barrel = typeof components

// The compound parts, which the barrel also exports by name — `SheetContent`
// beside `Sheet.Content` — so a server component can render one. Read off the
// statics rather than listed, so a part added later is one too. `List.Item`
// is the exception: it is exported as `ListRow`, since the standalone
// `ListItem` already has that name.
//
// Left out of the check below, which covers the components themselves, as it
// always has: whether every part should take a ref of its own is a question
// for the parts, and the content part of each overlay is held to it by name
// further down.
type PartName =
  | 'ListRow'
  | Exclude<
      {
        [Owner in keyof Barrel]: `${Owner}${keyof Barrel[Owner] & string}`
      }[keyof Barrel],
      'ListItem'
    >

// Every component in the barrel whose props have no `ref`. React 19 passes a
// ref as a prop, so a props type without one rejects `<Button ref={r}>` at
// the call site even where the ref would reach the element at runtime —
// styling.test.tsx renders every component with one and pins where it lands.
type Refless = {
  [Name in Exclude<keyof Barrel, PartName>]: Barrel[Name] extends (
    props: infer Props,
  ) => unknown
    ? 'ref' extends keyof Props
      ? never
      : Name
    : never
}[Exclude<keyof Barrel, PartName>]

describe('a ref, as a call site writes one', () => {
  // The ones that render no element of their own: Autocomplete and
  // FileTrigger, which wrap whatever they are given, and the overlays whose
  // root is a trigger, which take a ref on their content part instead.
  it('is accepted by every component that renders an element', () => {
    expectTypeOf<Refless>().toEqualTypeOf<
      | 'Autocomplete'
      | 'Dialog'
      | 'FileTrigger'
      | 'Menu'
      | 'Popover'
      | 'SearchView'
      | 'Sheet'
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
    expectTypeOf<
      ComponentProps<Barrel['SearchView']['Content']>
    >().toHaveProperty('ref')
    expectTypeOf<ComponentProps<Barrel['Sheet']['Content']>>().toHaveProperty(
      'ref',
    )
  })
})
