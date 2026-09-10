import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Toolbar from '.'
import { colors } from '../../tokens/design.tokens.stylex'
import IconButton from '../icon-button'
import Separator from '../separator'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each tone reaches for without
// depending on the browser having applied a rule these tests are the first
// thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  standard: { backgroundColor: colors.surfaceContainer },
  vibrant: { backgroundColor: colors.primaryContainer },
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
  standard: classesOf(stylex.props(probeStyles.standard)),
  vibrant: classesOf(stylex.props(probeStyles.vibrant)),
}

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

function setup(
  props: Partial<Parameters<typeof Toolbar>[0]> = {},
  children?: Parameters<typeof Toolbar>[0]['children'],
) {
  return render(
    <Toolbar aria-label="Label" {...props}>
      {children ?? (
        <>
          <IconButton aria-label="First item">{null}</IconButton>
          <Separator />
          <IconButton aria-label="Second item">{null}</IconButton>
        </>
      )}
    </Toolbar>,
  )
}

describe('toolbar', () => {
  describe('semantics', () => {
    it('is a toolbar named by its label', () => {
      const view = setup()
      expect(view.getByRole('toolbar', { name: 'Label' })).not.toBeNull()
    })

    it('reports the direction it runs in', () => {
      const horizontal = setup()
      expect(
        horizontal.getByRole('toolbar').getAttribute('aria-orientation'),
      ).toBe('horizontal')
      horizontal.unmount()

      const view = setup({ orientation: 'vertical' })
      expect(view.getByRole('toolbar').getAttribute('aria-orientation')).toBe(
        'vertical',
      )
    })

    // Pinned because the toolbar pattern usually implies a roving tabindex
    // and React Aria's does not do one: every control stays tabbable, so the
    // arrows are a second way to move rather than the only one. A version
    // that started roving would change what Tab does on every page using
    // this, and should fail here first.
    it('leaves every control tabbable', () => {
      const view = setup()
      const stops = view
        .getAllByRole('button')
        .filter((button) => button.getAttribute('tabindex') === '0')
      expect(stops).toHaveLength(2)
    })
  })

  describe('keyboard', () => {
    it('moves between the controls with the arrow keys', () => {
      const view = setup()
      const [first, second] = view.getAllByRole('button')

      act(() => {
        first.focus()
      })
      fireEvent.keyDown(first, { key: 'ArrowRight' })
      fireEvent.keyUp(first, { key: 'ArrowRight' })

      expect(document.activeElement).toBe(second)
    })

    it('moves with the down arrow while it runs vertically', () => {
      const view = setup({ orientation: 'vertical' })
      const [first, second] = view.getAllByRole('button')

      act(() => {
        first.focus()
      })
      fireEvent.keyDown(first, { key: 'ArrowDown' })
      fireEvent.keyUp(first, { key: 'ArrowDown' })

      expect(document.activeElement).toBe(second)
    })
  })

  // React Aria's own toolbar puts its orientation on itself and nowhere
  // else, so this component provides the separator context and `Separator`
  // reads it. Without that a rule between two controls in a row draws along
  // the row, where it is invisible.
  describe('a rule inside it', () => {
    it('runs across a horizontal bar', () => {
      const view = setup()
      const rule = view.getByRole('separator')

      expect(rule.getAttribute('aria-orientation')).toBe('vertical')
      expect(getComputedStyle(rule).inlineSize).toBe('1px')
    })

    it('runs across a vertical bar', () => {
      const view = setup({ orientation: 'vertical' })
      const rule = view.getByRole('separator')

      // A horizontal separator is an `<hr>`, whose orientation is implicit
      // and so carries no attribute of its own.
      expect(rule.tagName).toBe('HR')
      expect(getComputedStyle(rule).blockSize).toBe('1px')
      expect(getComputedStyle(rule).inlineSize).not.toBe('1px')
    })

    it('stays horizontal outside one', () => {
      const view = render(<Separator />)
      expect(view.getByRole('separator').tagName).toBe('HR')
    })

    it('takes an orientation of its own over the bar', () => {
      const view = setup(
        {},
        <>
          <IconButton aria-label="First item">{null}</IconButton>
          <Separator orientation="horizontal" />
        </>,
      )
      expect(view.getByRole('separator').tagName).toBe('HR')
    })
  })

  describe('appearance', () => {
    it('draws the standard scheme on surface container', () => {
      const view = setup()
      expect(hasClasses(view.getByRole('toolbar'), CLASSES.standard)).toBe(true)
    })

    it('moves the vibrant scheme to primary container', () => {
      const view = setup({ tone: 'vibrant' })
      const toolbar = view.getByRole('toolbar')
      expect(hasClasses(toolbar, CLASSES.vibrant)).toBe(true)
      expect(hasClasses(toolbar, CLASSES.standard)).toBe(false)
    })

    // The page's measurements, stated there in words: 64dp across the bar,
    // 16dp of padding at its two ends, and 8dp between the items.
    it('draws the page measurements', () => {
      const view = setup()
      const style = getComputedStyle(view.getByRole('toolbar'))

      expect(style.minBlockSize).toBe('64px')
      expect(style.paddingLeft).toBe('16px')
      expect(style.paddingRight).toBe('16px')
      expect(style.columnGap).toBe('8px')
    })

    it('turns the measurements a quarter when it runs vertically', () => {
      const view = setup({ orientation: 'vertical' })
      const style = getComputedStyle(view.getByRole('toolbar'))

      expect(style.minInlineSize).toBe('64px')
      expect(style.paddingTop).toBe('16px')
      expect(style.paddingBottom).toBe('16px')
    })

    // A bar that floats over a page rather than docking to its edge, so it
    // is as wide as its controls rather than as wide as what holds it.
    it('is as wide as what it holds', () => {
      const view = setup()
      expect(getComputedStyle(view.getByRole('toolbar')).display).toBe(
        'inline-flex',
      )
    })
  })
})
