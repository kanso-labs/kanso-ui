import * as stylex from '@stylexjs/stylex'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Chip from '.'
import { colors, spacing } from '../../tokens/design.tokens.stylex'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership therefore pins which token role each state
// reaches for — and unlike reading a computed colour it is a pure function of
// the styles, with no dependency on the browser having applied a rule that
// these tests are the first thing to use.
const probeStyles = stylex.create({
  padding: { paddingInline: spacing.lg },
  selectedBackground: { backgroundColor: colors.secondaryContainer },
  selectedBorder: { borderColor: 'transparent' },
  selectedColor: { color: colors.onSecondaryContainer },
  unselectedBackground: { backgroundColor: 'transparent' },
  unselectedBorder: { borderColor: colors.outlineVariant },
  unselectedColor: { color: colors.onSurfaceVariant },
})

// Takes the result of stylex.props() rather than the style itself: the
// function is variadic and its parameter type is not extractable — both
// `Parameters<...>[0]` and the whole tuple resolve to never, which only
// `tsc -b` reports. Calling it at each site keeps the types honest.
function classesOf(props: { className?: string | undefined }) {
  const classes = (props.className ?? '').split(' ').filter(Boolean)
  // A style that produced no classes would make every `every` below vacuously
  // true, so an empty list is a broken assertion rather than a passing one.
  if (classes.length === 0) {
    throw new Error('expected the probe style to generate at least one class')
  }
  return classes
}

const CLASSES = {
  padding: classesOf(stylex.props(probeStyles.padding)),
  selectedBackground: classesOf(stylex.props(probeStyles.selectedBackground)),
  selectedBorder: classesOf(stylex.props(probeStyles.selectedBorder)),
  selectedColor: classesOf(stylex.props(probeStyles.selectedColor)),
  unselectedBackground: classesOf(
    stylex.props(probeStyles.unselectedBackground),
  ),
  unselectedBorder: classesOf(stylex.props(probeStyles.unselectedBorder)),
  unselectedColor: classesOf(stylex.props(probeStyles.unselectedColor)),
}

// The check, or null where the chip draws none. It is the only SVG a chip
// renders, and it is `aria-hidden` — a chip announces its state through
// `aria-pressed`, so a role query would not find it and should not.
function checkIn(chip: HTMLElement) {
  return chip.querySelector('svg')
}

function hasClasses(element: HTMLElement, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

function setup(props: Partial<Parameters<typeof Chip>[0]> = {}) {
  const view = render(<Chip {...props}>Label</Chip>)
  return { ...view, chip: view.getByRole('button') }
}

describe('chip', () => {
  describe('selection', () => {
    // aria-pressed is how a two-state button announces itself. Without it a
    // screen reader hears an ordinary button and never learns it is on.
    it('announces its selected state through aria-pressed', () => {
      const { chip, unmount } = setup()
      expect(chip.getAttribute('aria-pressed')).toBe('false')
      unmount()

      const { chip: selected } = setup({ defaultSelected: true })
      expect(selected.getAttribute('aria-pressed')).toBe('true')
    })

    // fireEvent dispatches inside act(), so React has flushed the state
    // update by the time these read the attribute back. A bare
    // element.click() fires the handler but leaves the re-render pending.
    it('keeps its own state when uncontrolled', () => {
      const { chip } = setup()
      fireEvent.click(chip)
      expect(chip.getAttribute('aria-pressed')).toBe('true')
      fireEvent.click(chip)
      expect(chip.getAttribute('aria-pressed')).toBe('false')
    })

    // Controlled means the call site owns the value: a press reports the
    // change and nothing moves until the prop comes back different.
    it('does not move on its own when controlled', () => {
      const onChange = vi.fn<() => void>()
      const { chip } = setup({ isSelected: false, onChange })
      fireEvent.click(chip)
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(chip.getAttribute('aria-pressed')).toBe('false')
    })

    it('does not respond at all when disabled', () => {
      const onChange = vi.fn<() => void>()
      const { chip } = setup({ isDisabled: true, onChange })
      fireEvent.click(chip)
      expect(onChange).not.toHaveBeenCalled()
      expect(chip.getAttribute('aria-pressed')).toBe('false')
    })
  })

  // React Aria builds a button's DOM props from an allowlist: no keyboard
  // handler is on it, and of the `aria-*` props only the labelling four plus
  // the handful `useButton` re-adds for state it manages itself. Everything
  // else a call site passes is dropped before it reaches the element, which
  // is what `src/render/aria.tsx` exists to put back.
  describe('what it puts on the element', () => {
    it('calls a keyboard handler the call site passed', () => {
      const onKeyDown = vi.fn<() => void>()
      const onKeyUp = vi.fn<() => void>()
      const { chip } = setup({ onKeyDown, onKeyUp })

      fireEvent.keyDown(chip, { key: 'a' })
      fireEvent.keyUp(chip, { key: 'a' })

      expect(onKeyDown).toHaveBeenCalledTimes(1)
      expect(onKeyUp).toHaveBeenCalledTimes(1)
    })

    // React Aria wraps a handler it is given so that it stops propagation
    // unless the handler asks otherwise, which is its convention rather than
    // the DOM's. On the element directly it bubbles, so an Escape pressed on
    // a chip inside a dialog still reaches the dialog.
    //
    // The chip has to carry its own handler for this to mean anything: React
    // Aria installs no wrapper when there is none to wrap, so a chip without
    // one bubbles either way and would pass whatever this component did.
    it('lets that handler bubble to an ancestor', () => {
      const onAncestorKeyDown = vi.fn<() => void>()
      const onKeyDown = vi.fn<() => void>()
      const view = render(
        // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- the listener is the subject of the test
        <div onKeyDown={onAncestorKeyDown}>
          <Chip onKeyDown={onKeyDown}>Label</Chip>
        </div>,
      )

      fireEvent.keyDown(view.getByRole('button'), { bubbles: true, key: 'a' })

      expect(onKeyDown).toHaveBeenCalledTimes(1)
      expect(onAncestorKeyDown).toHaveBeenCalledTimes(1)
    })

    // Rendered directly rather than through `setup`, which takes a
    // `Partial<ChipProps>` object: an object literal is excess-property
    // checked against it, where a JSX attribute is not.
    it('keeps a non-labelling aria attribute the call site set', () => {
      const view = render(<Chip aria-keyshortcuts="Control+K">Label</Chip>)

      expect(view.getByRole('button').getAttribute('aria-keyshortcuts')).toBe(
        'Control+K',
      )
    })

    // The labelling four are React Aria's own, and may combine with what a
    // parent gives through context, so they are left to it rather than
    // written over with the call site's copy.
    it('leaves the labelling attributes to React Aria', () => {
      const { chip } = setup({ 'aria-label': 'Label' })

      expect(chip.getAttribute('aria-label')).toBe('Label')
      // The state React Aria manages itself still reaches the element too.
      expect(chip.getAttribute('aria-pressed')).toBe('false')
    })
  })

  // These assert on class membership rather than computed colour. StyleX
  // injects a class's CSS the first time that class is used, and these tests
  // are the only thing that uses the chip's selected styles — read
  // synchronously, getComputedStyle could beat the browser applying the rule
  // and report an unstyled button, which made this file pass or fail
  // depending on what had run before it.
  describe('appearance', () => {
    it('takes the secondary container pair when selected', () => {
      const { chip } = setup({ defaultSelected: true })
      expect(hasClasses(chip, CLASSES.selectedBackground)).toBe(true)
      expect(hasClasses(chip, CLASSES.selectedColor)).toBe(true)
    })

    it('is transparent with an outline variant border when unselected', () => {
      const { chip } = setup()
      expect(hasClasses(chip, CLASSES.unselectedBackground)).toBe(true)
      expect(hasClasses(chip, CLASSES.unselectedBorder)).toBe(true)
      expect(hasClasses(chip, CLASSES.unselectedColor)).toBe(true)
    })

    // The chips spec page gives 16dp of inline padding for a chip without
    // icons, pinned to the token rather than the number.
    it("pads its label by the spec's 16dp at either end", () => {
      const { chip } = setup()
      expect(hasClasses(chip, CLASSES.padding)).toBe(true)
      expect(getComputedStyle(chip).paddingLeft).toBe('16px')
    })

    // The selected chip has a container of its own to define its edge, so a
    // border on top of it would read as a second, competing outline.
    it('drops the border once selected', () => {
      const { chip } = setup({ defaultSelected: true })
      expect(hasClasses(chip, CLASSES.selectedBorder)).toBe(true)
      expect(hasClasses(chip, CLASSES.unselectedBorder)).toBe(false)
    })

    // Styling comes from React Aria's state callback rather than from a CSS
    // selector, so this is what proves the callback actually re-runs.
    it('restyles itself when an uncontrolled chip is pressed', () => {
      const { chip } = setup()
      expect(hasClasses(chip, CLASSES.unselectedBackground)).toBe(true)

      fireEvent.click(chip)
      expect(hasClasses(chip, CLASSES.selectedBackground)).toBe(true)
      expect(hasClasses(chip, CLASSES.unselectedBackground)).toBe(false)
    })
  })

  // The two containers differ in colour alone, so without the check a reader
  // who does not see colour has nothing to read the selection off — and a
  // scheme whose secondary container sits near the surface loses it for
  // everyone.
  describe('the check', () => {
    it('draws the check once selected and none before', () => {
      const { chip, unmount } = setup()
      expect(checkIn(chip)).toBeNull()
      unmount()

      const { chip: selected } = setup({ defaultSelected: true })
      expect(checkIn(selected)).not.toBeNull()
    })

    it('follows the state a press puts the chip in', () => {
      const { chip } = setup()
      fireEvent.click(chip)
      expect(checkIn(chip)).not.toBeNull()

      fireEvent.click(chip)
      expect(checkIn(chip)).toBeNull()
    })

    it("draws it at the page's 18dp icon size", () => {
      const { chip } = setup({ defaultSelected: true })
      const check = checkIn(chip)
      const box = check?.parentElement?.getBoundingClientRect()

      expect(box?.width).toBe(18)
      expect(box?.height).toBe(18)
    })

    // The page gives 16dp of inline padding for a chip without icons and 8dp
    // on the side an icon is on. The chip keeps the 16 and the slot pulls
    // back 8, which is what leaves the padding test above reading 16px on an
    // unselected chip while a selected one measures the page's 8.
    it("insets it by the page's 8dp rather than the bare 16", () => {
      const { chip } = setup({ defaultSelected: true })
      const check = checkIn(chip)
      const slot = check?.parentElement?.getBoundingClientRect()
      const box = chip.getBoundingClientRect()
      const border = Number.parseFloat(getComputedStyle(chip).borderLeftWidth)

      expect((slot?.left ?? 0) - box.left - border).toBe(8)
    })

    // A chip is flow content in a row that wraps, so it is free to grow: the
    // slot plus the chip's own 8dp gap, less the 8dp the padding gives back.
    it('widens the chip by the slot it adds', () => {
      const { chip, unmount } = setup()
      const unselected = chip.getBoundingClientRect().width
      unmount()

      const { chip: selected } = setup({ defaultSelected: true })

      expect(selected.getBoundingClientRect().width - unselected).toBe(18)
    })

    // `aria-pressed` is what announces the selection, so a check that also
    // reached the accessibility tree would say it a second time.
    it('keeps the check out of the accessibility tree', () => {
      const { chip } = setup({ defaultSelected: true })

      expect(checkIn(chip)?.getAttribute('aria-hidden')).toBe('true')
    })
  })
})
