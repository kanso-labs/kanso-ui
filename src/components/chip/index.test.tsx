import * as stylex from '@stylexjs/stylex'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Chip from '.'
import { colors } from '../../tokens/design.tokens.stylex'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership therefore pins which token role each state
// reaches for — and unlike reading a computed colour it is a pure function of
// the styles, with no dependency on the browser having applied a rule that
// these tests are the first thing to use.
const probeStyles = stylex.create({
  selectedBackground: { backgroundColor: colors.secondaryContainer },
  selectedBorder: { borderColor: 'transparent' },
  selectedColor: { color: colors.onSecondaryContainer },
  unselectedBackground: { backgroundColor: 'transparent' },
  unselectedBorder: { borderColor: colors.outline },
  unselectedColor: { color: colors.onSurfaceVariant },
})

// Takes the whole parameter tuple rather than its first element: stylex.props
// is variadic, so indexing [0] resolves to never and only `tsc -b` says so.
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
  selectedBackground: classesOf(stylex.props(probeStyles.selectedBackground)),
  selectedBorder: classesOf(stylex.props(probeStyles.selectedBorder)),
  selectedColor: classesOf(stylex.props(probeStyles.selectedColor)),
  unselectedBackground: classesOf(
    stylex.props(probeStyles.unselectedBackground),
  ),
  unselectedBorder: classesOf(stylex.props(probeStyles.unselectedBorder)),
  unselectedColor: classesOf(stylex.props(probeStyles.unselectedColor)),
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

      const { chip: selected } = setup({ defaultPressed: true })
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
      const onPressedChange = vi.fn<() => void>()
      const { chip } = setup({ onPressedChange, pressed: false })
      fireEvent.click(chip)
      expect(onPressedChange).toHaveBeenCalledTimes(1)
      expect(chip.getAttribute('aria-pressed')).toBe('false')
    })

    it('does not respond at all when disabled', () => {
      const onPressedChange = vi.fn<() => void>()
      const { chip } = setup({ disabled: true, onPressedChange })
      fireEvent.click(chip)
      expect(onPressedChange).not.toHaveBeenCalled()
      expect(chip.getAttribute('aria-pressed')).toBe('false')
    })
  })

  // StyleX injects a class's CSS the first time that class is used, and these
  // are the only tests that use the chip's selected styles at all. Read
  // synchronously, getComputedStyle can beat the browser applying the rule and
  // report an unstyled button — which is stable only as long as some earlier
  // file happens to have warmed the same classes. waitFor removes that
  // dependency on run order.
  describe('appearance', () => {
    it('takes the secondary container pair when selected', () => {
      const { chip } = setup({ defaultPressed: true })
      expect(hasClasses(chip, CLASSES.selectedBackground)).toBe(true)
      expect(hasClasses(chip, CLASSES.selectedColor)).toBe(true)
    })

    it('is transparent with an outline when unselected', () => {
      const { chip } = setup()
      expect(hasClasses(chip, CLASSES.unselectedBackground)).toBe(true)
      expect(hasClasses(chip, CLASSES.unselectedBorder)).toBe(true)
      expect(hasClasses(chip, CLASSES.unselectedColor)).toBe(true)
    })

    // The selected chip has a container of its own to define its edge, so a
    // border on top of it would read as a second, competing outline.
    it('drops the border once selected', () => {
      const { chip } = setup({ defaultPressed: true })
      expect(hasClasses(chip, CLASSES.selectedBorder)).toBe(true)
      expect(hasClasses(chip, CLASSES.unselectedBorder)).toBe(false)
    })

    // Styling comes from Base UI's state callback rather than from a CSS
    // selector, so this is what proves the callback actually re-runs.
    it('restyles itself when an uncontrolled chip is pressed', () => {
      const { chip } = setup()
      expect(hasClasses(chip, CLASSES.unselectedBackground)).toBe(true)

      fireEvent.click(chip)
      expect(hasClasses(chip, CLASSES.selectedBackground)).toBe(true)
      expect(hasClasses(chip, CLASSES.unselectedBackground)).toBe(false)
    })
  })
})
