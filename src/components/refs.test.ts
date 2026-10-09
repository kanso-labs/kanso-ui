import type { ComponentProps } from 'react'

import { describe, expectTypeOf, it } from 'vitest'

import type * as components from '.'

type Barrel = typeof components

// Every export of the barrel whose props have no `ref`: the components, and
// the compound parts it also exports by name — `TableRow` beside
// `Table.Row`, and `ListRow` for `List.Item`. React 19 passes a ref as a
// prop, so a props type without one rejects `<TableRow ref={r}>` at the call
// site even where the ref would reach the element at runtime —
// styling.test.tsx renders each of them with one and pins where it lands.
// Read off the capitalised names alone: `useAppBarScroll` is a function too,
// but a hook, which takes options rather than props.
type Refless = {
  [Name in keyof Barrel]: Name extends Capitalize<Name>
    ? Barrel[Name] extends (props: infer Props) => unknown
      ? 'ref' extends keyof Props
        ? never
        : Name
      : never
    : never
}[keyof Barrel]

describe('a ref, as a call site writes one', () => {
  // The ones that render no element of their own: Autocomplete and
  // FileTrigger, which wrap whatever they are given; the overlays whose root
  // is a trigger, which take a ref on their content part instead;
  // Menu.Submenu, which pairs the item it is given with a menu; and
  // SplitButton.Menu, a Menu with its trigger built in. Disclosure.Header is
  // the one that renders an element and still takes none, since it takes no
  // `className` or `style` for a ref to land beside — what it renders is
  // the disclosure's own heading and button, as FileTrigger's input is its
  // own.
  it('is accepted by every component and part that renders an element', () => {
    expectTypeOf<Refless>().toEqualTypeOf<
      | 'Autocomplete'
      | 'Dialog'
      | 'DisclosureHeader'
      | 'FileTrigger'
      | 'Menu'
      | 'MenuSubmenu'
      | 'Popover'
      | 'SearchView'
      | 'Sheet'
      | 'SplitButtonMenu'
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
