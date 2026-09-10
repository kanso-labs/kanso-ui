import type { ReactNode } from 'react'
import type { DisclosureGroupProps as RACDisclosureGroupProps } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { Children, Fragment, isValidElement } from 'react'
import { DisclosureGroup as RACDisclosureGroup } from 'react-aria-components'

import { mergeStatefulStyles } from '../../styles/merge'
import Separator from '../separator'

// A stack of Disclosures that agree with each other about what is open —
// the lists page's accordion. The sections are the library's own
// `Disclosure`, unchanged: this adds only the agreement between them and the
// rule that divides them.
//
// Give each section an `id`, which is the key the group reports as expanded.
// Whether one opens at a time or several is `allowsMultipleExpanded`, and it
// is React Aria's rather than two components — a group that closes the last
// section when a new one opens is the same stack with a different word.
//
// Two things are this component's own.
//
// **A rule between the sections, and none at the ends.** The group renders
// the library's `Separator` between each pair rather than asking each
// section to draw a border, so a section drawn on its own and a section in a
// group stay the same component. `divided={false}` leaves them undivided,
// for a stack sitting on cards of its own.
//
// **Nothing else is added.** The group draws no container, no corner and no
// colour: an accordion inside a card and one running down a page want
// different surroundings, and the page is what knows which it is.
//
// The lists page keeps its expand-interaction tokens behind a token-set menu
// that does not open to a script, so what is drawn here is what the page
// states in words plus what `Disclosure` already carries; see that
// component's comment for the same note.

const styles = stylex.create({
  root: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  },
})

type DisclosureGroupProps = Omit<RACDisclosureGroupProps, 'children'> & {
  /** The sections, as `Disclosure` elements each given an `id`. */
  children?: ReactNode
  /**
   * Whether a rule is drawn between the sections. There is never one above
   * the first or below the last.
   * @default true
   */
  divided?: boolean
}

/**
 * A stack of `Disclosure` sections that agree about what is open. Which are
 * expanded is React Aria's: pass `expandedKeys` with `onExpandedChange` to
 * control it, or `defaultExpandedKeys` to let the group keep its own.
 *
 * ```tsx
 * <DisclosureGroup defaultExpandedKeys={FIRST}>
 *   <Disclosure id="first">
 *     <Disclosure.Header>Headline</Disclosure.Header>
 *     <Disclosure.Panel>Supporting line</Disclosure.Panel>
 *   </Disclosure>
 * </DisclosureGroup>
 * ```
 *
 * One section opens at a time unless `allowsMultipleExpanded` says otherwise.
 * Give every section an `id` — that is the key the group reports.
 *
 * The call site's `className` and `style` land on the container, which is the
 * element a layout positions.
 */
function DisclosureGroup({
  children,
  divided = true,
  ...props
}: DisclosureGroupProps) {
  return (
    <RACDisclosureGroup
      {...props}
      {...mergeStatefulStyles(stylex.props(styles.root), props)}
    >
      {divided ? dividedChildren(children) : children}
    </RACDisclosureGroup>
  )
}

// The sections with a rule between each pair, and none at the ends.
function dividedChildren(children: ReactNode) {
  const sections = flatten(children)

  return sections.map((section, index) => (
    <Fragment key={keyOf(section, index)}>
      {index === 0 ? null : <Separator />}
      {section}
    </Fragment>
  ))
}

// The sections, with any fragment around them opened up first.
// `Children.toArray` flattens arrays but hands back a fragment as one child,
// and a call site that writes its sections inside one — or maps over data and
// wraps the result — would otherwise get a single entry and no rules at all.
// Recursive, since a fragment may hold another.
function flatten(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) => {
    if (isValidElement<{ children?: ReactNode }>(child)) {
      if (child.type === Fragment) {
        return flatten(child.props.children)
      }
    }
    return [child]
  })
}

// The key `Children.toArray` put on the entry, falling back to its position
// for anything that is not an element — a string between two sections is not
// a thing this component expects, but it should render rather than throw.
function keyOf(section: ReactNode, index: number) {
  if (isValidElement(section)) {
    return section.key ?? String(index)
  }
  return String(index)
}

export type { DisclosureGroupProps }

export default DisclosureGroup
