import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Toolbar from '.'
import { colors } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import Dialog from '../dialog'
import IconButton from '../icon-button'
import Popover from '../popover'
import Separator from '../separator'
import Sheet from '../sheet'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each tone reaches for without
// depending on the browser having applied a rule these tests are the first
// thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  neutral: { backgroundColor: colors.surfaceContainer },
  vibrant: { backgroundColor: colors.primaryContainer },
})

const testStyles = stylex.create({
  // Narrower than the row of controls `narrow()` puts in the bar.
  narrow: { inlineSize: '240px' },
  // A width for the rule inside an overlay to run across: a popover is as
  // wide as what it holds, and a rule alone holds nothing.
  span: { inlineSize: '200px' },
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
  neutral: classesOf(stylex.props(probeStyles.neutral)),
  vibrant: classesOf(stylex.props(probeStyles.vibrant)),
}

// An overlay opened from inside the bar, holding a rule of its own. Each is a
// portal, which React context crosses, so the bar's separator context
// reached the rule inside before the overlay's content cleared it.
const OVERLAYS = [
  [
    'a popover',
    <Popover defaultOpen key="popover">
      <Button>Open</Button>
      <Popover.Content>
        <div {...stylex.props(testStyles.span)}>
          <Separator data-testid="inside" />
        </div>
      </Popover.Content>
    </Popover>,
  ],
  [
    'a modal popover',
    <Popover defaultOpen key="modal" modal>
      <Button>Open</Button>
      <Popover.Content aria-label="Label">
        <div {...stylex.props(testStyles.span)}>
          <Separator data-testid="inside" />
        </div>
      </Popover.Content>
    </Popover>,
  ],
  [
    'a sheet',
    <Sheet defaultOpen key="sheet">
      <Button>Open</Button>
      <Sheet.Content aria-label="Label">
        <div {...stylex.props(testStyles.span)}>
          <Separator data-testid="inside" />
        </div>
      </Sheet.Content>
    </Sheet>,
  ],
  [
    'a dialog',
    <Dialog defaultOpen key="dialog">
      <Button>Open</Button>
      <Dialog.Content aria-label="Label">
        <div {...stylex.props(testStyles.span)}>
          <Separator data-testid="inside" />
        </div>
      </Dialog.Content>
    </Dialog>,
  ],
] as const

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

// Three icon buttons, a rule and a text button, in a parent 240px wide: the
// row needs about 250px at its own widths.
function narrow() {
  return render(
    <div {...stylex.props(testStyles.narrow)}>
      <Toolbar aria-label="Label">
        <IconButton aria-label="First item">{null}</IconButton>
        <IconButton aria-label="Second item">{null}</IconButton>
        <IconButton aria-label="Third item">{null}</IconButton>
        <Separator />
        <Button variant="tonal">Label</Button>
      </Toolbar>
    </div>,
  )
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
    // and React Aria's does not do one: the bar is a single Tab stop because
    // a Tab inside it moves focus to the control at the end it leaves by
    // before the browser moves on, while every control keeps its own
    // `tabindex`. A version that started roving would change what each
    // control reports on every page using this, and should fail here first.
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

    // The bar's context reaches its own controls and stops at an overlay:
    // a rule inside one runs across the overlay, horizontally, while a rule
    // among the bar's controls still turns across the bar.
    it.each(OVERLAYS)(
      'leaves a rule inside %s opened from the bar horizontal',
      (_overlay, opened) => {
        const view = setup(
          {},
          <>
            <Separator data-testid="among" />
            {opened}
          </>,
        )
        const inside = view.getByTestId('inside')

        expect(inside.tagName).toBe('HR')
        expect(inside.getBoundingClientRect().width).toBeGreaterThan(0)
        expect(view.getByTestId('among').getAttribute('aria-orientation')).toBe(
          'vertical',
        )
      },
    )

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
    // The page's standard scheme, which `tone` spells `neutral` as every
    // other tone in the library spells its neutral role.
    it('draws the neutral scheme on surface container, by default and when asked', () => {
      const unset = setup()
      expect(hasClasses(unset.getByRole('toolbar'), CLASSES.neutral)).toBe(true)
      unset.unmount()

      const neutral = setup({ tone: 'neutral' })
      expect(hasClasses(neutral.getByRole('toolbar'), CLASSES.neutral)).toBe(
        true,
      )
    })

    it('moves the vibrant scheme to primary container', () => {
      const view = setup({ tone: 'vibrant' })
      const toolbar = view.getByRole('toolbar')
      expect(hasClasses(toolbar, CLASSES.vibrant)).toBe(true)
      expect(hasClasses(toolbar, CLASSES.neutral)).toBe(false)
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
        'inline-grid',
      )
    })
  })

  // A Button wraps its label rather than overflow a container narrower than
  // it, and as a flex item that let the bar squeeze it until the label broke
  // after every letter. The bar keeps every control at its own width and
  // scrolls, inside what holds it, once they no longer fit.
  describe('narrower than its controls', () => {
    it('keeps a button label on one line', () => {
      const view = narrow()
      const button = view.getByRole('button', { name: 'Label' })

      // The button's 40dp container, which a second line of label grows.
      expect(button.getBoundingClientRect().height).toBe(40)
      expect(view.getByRole('toolbar').getBoundingClientRect().height).toBe(64)
    })

    it('scrolls inside what holds it rather than overflow it', () => {
      const view = narrow()
      const toolbar = view.getByRole('toolbar')

      expect(toolbar.getBoundingClientRect().width).toBe(240)
      expect(toolbar.scrollWidth).toBeGreaterThan(toolbar.clientWidth)
    })

    // Centring a row wider than the bar pushed part of it past the start
    // edge, where no scroll reaches: the first control starts after the
    // bar's own padding, unscrolled.
    it('starts the row at the bar’s start edge', () => {
      const view = narrow()
      const toolbar = view.getByRole('toolbar')
      const [first] = view.getAllByRole('button')

      expect(toolbar.scrollLeft).toBe(0)
      expect(
        first.getBoundingClientRect().left -
          toolbar.getBoundingClientRect().left,
      ).toBe(16)
    })
  })
})
