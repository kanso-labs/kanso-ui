import * as stylex from '@stylexjs/stylex'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Breadcrumbs from '.'
import { colors } from '../../tokens/design.tokens.stylex'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for without
// depending on the browser having applied a rule these tests are the first
// thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  current: { color: colors.onSurface },
  muted: { color: colors.onSurfaceVariant },
})

function classesOf(props: { className?: string | undefined }) {
  const classes = (props.className ?? '').split(' ').filter(Boolean)
  // An empty list would make every `every` below vacuously true, so it is a
  // broken assertion rather than a passing one.
  if (classes.length === 0) {
    throw new Error('expected the probe style to generate at least one class')
  }
  return classes
}

const CLASSES = {
  current: classesOf(stylex.props(probeStyles.current)),
  muted: classesOf(stylex.props(probeStyles.muted)),
}

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

function setup(
  props: Partial<Parameters<typeof Breadcrumbs>[0]> = {},
  children?: Parameters<typeof Breadcrumbs>[0]['children'],
) {
  return render(
    <Breadcrumbs aria-label="Label" {...props}>
      {children ?? (
        <>
          <Breadcrumbs.Item href="#first" id="first">
            First item
          </Breadcrumbs.Item>
          <Breadcrumbs.Item href="#second" id="second">
            Second item
          </Breadcrumbs.Item>
          <Breadcrumbs.Item id="third">Third item</Breadcrumbs.Item>
        </>
      )}
    </Breadcrumbs>,
  )
}

describe('breadcrumbs', () => {
  describe('semantics', () => {
    it('is an ordered list named by its label', () => {
      const view = setup()
      const list = view.getByRole('list', { name: 'Label' })

      expect(list.tagName).toBe('OL')
      expect(view.getAllByRole('listitem')).toHaveLength(3)
    })

    it('links every item but the last', () => {
      const view = setup()
      const links = view.getAllByRole('link')

      expect(links.map((link) => link.textContent)).toStrictEqual([
        'First item',
        'Second item',
      ])
    })

    // React Aria's own answer for the current item is a disabled link, which
    // takes the library's disabled treatment and fades the one item the trail
    // exists to name. This draws it as text carrying the current-page mark
    // instead.
    it('draws the last item as text announced as the current page', () => {
      const view = setup()
      const current = view.getByText('Third item')

      expect(current.tagName).toBe('SPAN')
      expect(current.getAttribute('aria-current')).toBe('page')
      expect(current.hasAttribute('role')).toBe(false)
    })

    it('renders an anchor for an item given an href', () => {
      const view = setup()
      const [first] = view.getAllByRole('link')

      expect(first.tagName).toBe('A')
      expect(first.getAttribute('href')).toBe('#first')
    })

    // A page routing on its own gives no href, and React Aria still announces
    // the item as a link so the trail reads the same either way.
    it('announces an item with no href as a link', () => {
      const view = setup(
        {},
        <>
          <Breadcrumbs.Item id="first">First item</Breadcrumbs.Item>
          <Breadcrumbs.Item id="second">Second item</Breadcrumbs.Item>
        </>,
      )
      const [first] = view.getAllByRole('link')

      expect(first.tagName).toBe('SPAN')
      expect(first.getAttribute('role')).toBe('link')
    })
  })

  describe('the chevron', () => {
    // One after every item but the current, which puts a separator between
    // each pair and none at the end.
    it('draws one between each pair and none after the last', () => {
      const view = setup()
      const items = view.getAllByRole('listitem')

      expect(
        items.map((item) => item.querySelectorAll('svg').length),
      ).toStrictEqual([1, 1, 0])
    })

    it('is hidden from a screen reader', () => {
      const view = setup()
      const [chevron] = [...view.container.querySelectorAll('svg')]

      expect(chevron.getAttribute('aria-hidden')).toBe('true')
    })
  })

  describe('pressing an item', () => {
    it('reports the key that was pressed', () => {
      const onAction = vi.fn<(key: unknown) => void>()
      const view = setup({ onAction })

      fireEvent.click(view.getByText('First item'))

      expect(onAction).toHaveBeenCalledWith('first')
    })

    it('reports nothing for the current item', () => {
      const onAction = vi.fn<(key: unknown) => void>()
      const view = setup({ onAction })

      fireEvent.click(view.getByText('Third item'))

      expect(onAction).not.toHaveBeenCalled()
    })

    it('reports nothing while the trail is disabled', () => {
      const onAction = vi.fn<(key: unknown) => void>()
      const view = setup({ isDisabled: true, onAction })

      fireEvent.click(view.getByText('First item'))

      expect(onAction).not.toHaveBeenCalled()
    })
  })

  describe('keyboard', () => {
    it('reaches each link in turn', () => {
      const view = setup()
      const links = view.getAllByRole('link')

      expect(links.every((link) => link.getAttribute('tabindex') === '0')).toBe(
        true,
      )
      expect(view.getByText('Third item').hasAttribute('tabindex')).toBe(false)
    })
  })

  describe('appearance', () => {
    // The row takes the top app bar's muted content role and the current item
    // the full-strength one, so the page you are on is the most legible thing
    // in the trail rather than the least.
    it('draws the row muted and the current item at full strength', () => {
      const view = setup()

      expect(hasClasses(view.getByRole('list'), CLASSES.muted)).toBe(true)
      expect(hasClasses(view.getByText('Third item'), CLASSES.current)).toBe(
        true,
      )
    })

    it('gives the links the row colour rather than one of their own', () => {
      const view = setup()
      const [first] = view.getAllByRole('link')
      const list = view.getByRole('list')

      expect(getComputedStyle(first).color).toBe(getComputedStyle(list).color)
    })

    // The trail wraps rather than scrolling or truncating, so a deep one in a
    // narrow column stays readable.
    it('wraps rather than running off the edge', () => {
      const view = setup()
      expect(getComputedStyle(view.getByRole('list')).flexWrap).toBe('wrap')
    })

    it('carries no list marker or indent of its own', () => {
      const view = setup()
      const style = getComputedStyle(view.getByRole('list'))

      expect(style.listStyleType).toBe('none')
      expect(style.paddingInlineStart).toBe('0px')
      expect(style.marginBlockStart).toBe('0px')
    })
  })
})
