import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import List from '../components/list'
import ListBox from '../components/list-box'
import Tree from '../components/tree'
import { collectionStyles } from './styles'

// The chrome is shared, and each component composes it at its own
// `stylex.props` call — StyleX cannot share a declaration inside `create`, so
// composition is what carries it. Dropping one of those arguments is silent:
// the component still renders, the stylesheet still holds every rule, and
// only that element stops drawing the box, the subhead or the loading row.
//
// Nothing caught that before. Removing the container from List left its own
// suite green at 20 passed.
//
// Menu and NavigationTree are not here. Their subhead and loading row follow
// the menus page and the navigation drawer page rather than the lists page,
// so they keep their own and this list is the three that share.
const classesOf = (style: stylex.StyleXStyles) =>
  (stylex.props(style).className ?? '').split(' ').filter(Boolean)

const CONTAINER = classesOf(collectionStyles.container)
const HEADER = classesOf(collectionStyles.header)
const LOADING = classesOf(collectionStyles.loading)

const CASES: ReadonlyArray<{ element: ReactElement; name: string }> = [
  {
    element: (
      <List aria-label="Label">
        <List.Section header="First group">
          <List.Item id="first">First item</List.Item>
        </List.Section>
        <List.LoadMore isLoading />
      </List>
    ),
    name: 'List',
  },
  {
    element: (
      <ListBox aria-label="Label">
        <ListBox.Section header="First group">
          <ListBox.Item id="first">First item</ListBox.Item>
        </ListBox.Section>
        <ListBox.LoadMore isLoading />
      </ListBox>
    ),
    name: 'ListBox',
  },
  {
    element: (
      <Tree aria-label="Label">
        <Tree.Section header="First group">
          <Tree.Item headline="First item" id="first" />
        </Tree.Section>
        <Tree.LoadMore isLoading />
      </Tree>
    ),
    name: 'Tree',
  },
]

// Selected on the whole class list rather than the first name: StyleX emits
// one class per declaration, so a name like the one for `box-sizing` is on
// most elements on the page and would match the wrong one.
function find(container: HTMLElement, classes: ReadonlyArray<string>) {
  const selector = classes.map((name) => `.${name}`).join('')
  const element = container.querySelector(selector)
  if (!(element instanceof HTMLElement)) {
    throw new Error(`expected an element carrying ${selector}`)
  }

  return element
}

function missing(classes: ReadonlyArray<string>, element: Element) {
  const applied = new Set(element.classList)

  return classes.filter((name) => !applied.has(name))
}

describe('the shared collection chrome', () => {
  it('compiles to classes at all', () => {
    // Empty lists would make every case below pass for the wrong reason,
    // since `filter` over nothing is empty.
    expect(CONTAINER.length).toBeGreaterThan(0)
    expect(HEADER.length).toBeGreaterThan(0)
    expect(LOADING.length).toBeGreaterThan(0)
  })

  it.each(CASES)('draws $name in the shared container', ({ element }) => {
    const view = render(element)

    expect(missing(CONTAINER, find(view.container, CONTAINER))).toEqual([])
  })

  it.each(CASES)('gives $name the shared subhead', ({ element }) => {
    const view = render(element)

    expect(missing(HEADER, find(view.container, HEADER))).toEqual([])
  })

  it.each(CASES)('gives $name the shared loading row', ({ element }) => {
    const view = render(element)

    expect(missing(LOADING, find(view.container, LOADING))).toEqual([])
  })
})
