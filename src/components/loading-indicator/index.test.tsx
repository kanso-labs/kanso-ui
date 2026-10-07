import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import LoadingIndicator from '.'
import {
  declarationsHeld,
  reducedMotionOf,
} from '../../styles/stylesheet.testing'
import { colors } from '../../tokens/design.tokens.stylex'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces —
// see progress-indicator/index.test.tsx.
const probeStyles = stylex.create({
  container: { backgroundColor: colors.primaryContainer },
  onContainer: { color: colors.onPrimaryContainer },
  primary: { color: colors.primary },
})

function classesOf(props: { className?: string | undefined }) {
  const classes = (props.className ?? '').split(' ').filter(Boolean)
  // An empty list would make every `every` below vacuously true.
  if (classes.length === 0) {
    throw new Error('expected the probe style to generate at least one class')
  }
  return classes
}

/** The frames of a `@keyframes` rule, in order. */
function framesOf(rule: CSSKeyframesRule) {
  return [...rule.cssRules].filter((frame) => frame instanceof CSSKeyframeRule)
}

function hasClasses(element: Element, props: { className?: string }) {
  return classesOf(props).every((name) => element.classList.contains(name))
}

/** The `@keyframes` rules an element's `animation-name` names, by name. */
function keyframesOf(element: Element) {
  const names = getComputedStyle(element)
    .animationName.split(',')
    .map((name) => name.trim())
  const found = new Map<string, CSSKeyframesRule>()
  for (const sheet of document.styleSheets) {
    walk([...sheet.cssRules])
  }
  return names.map((name) => {
    const rule = found.get(name)
    if (rule === undefined) {
      throw new Error(`expected a @keyframes rule named ${name}`)
    }
    return rule
  })

  function walk(rules: CSSRule[]) {
    for (const rule of rules) {
      if (rule instanceof CSSKeyframesRule) {
        found.set(rule.name, rule)
      } else if (rule instanceof CSSGroupingRule) {
        walk([...rule.cssRules])
      }
    }
  }
}

/** The points of a `polygon()`, as percentages of the container. */
function pointsOf(clipPath: string) {
  const inner = /^polygon\((.*)\)$/u.exec(clipPath)?.[1]
  if (inner === undefined) {
    throw new Error(`expected a polygon, got ${clipPath}`)
  }
  return inner.split(',').map((point) => {
    const [x = Number.NaN, y = Number.NaN] = point
      .trim()
      .split(/\s+/u)
      .map((value) => Number.parseFloat(value))
    return { x, y }
  })
}

function setup(props: Parameters<typeof LoadingIndicator>[0] = {}) {
  const view = render(<LoadingIndicator aria-label="Label" {...props} />)
  const indicator = view.getByRole('progressbar')
  const shape = indicator.querySelector('[aria-hidden] > span')
  if (!(shape instanceof HTMLElement)) {
    throw new Error('expected the indicator to draw a shape')
  }
  return { ...view, indicator, shape }
}

/** What a property is set to in each frame of a `@keyframes` rule. */
function valuesOf(rule: CSSKeyframesRule, property: string) {
  return framesOf(rule).map((frame) => frame.style.getPropertyValue(property))
}

describe('loading indicator', () => {
  describe('semantics', () => {
    it('is an indeterminate progress bar named by its aria-label', () => {
      const { indicator } = setup()
      expect(indicator.getAttribute('aria-label')).toBe('Label')
      expect(indicator.hasAttribute('aria-valuenow')).toBe(false)
    })

    it('hides the shape it draws from assistive technology', () => {
      const { indicator, shape } = setup()
      expect(indicator.textContent).toBe('')
      expect(shape.closest('[aria-hidden="true"]')).not.toBeNull()
    })
  })

  describe('container', () => {
    it('is a 48px circle', () => {
      const { indicator } = setup()
      const style = getComputedStyle(indicator)
      expect(style.inlineSize).toBe('48px')
      expect(style.blockSize).toBe('48px')
      expect(style.borderTopLeftRadius).not.toBe('0px')
    })

    it('draws the bare shape in primary by default', () => {
      const { indicator } = setup()
      expect(hasClasses(indicator, stylex.props(probeStyles.primary))).toBe(
        true,
      )
      expect(hasClasses(indicator, stylex.props(probeStyles.container))).toBe(
        false,
      )
      expect(getComputedStyle(indicator).backgroundColor).toBe(
        'rgba(0, 0, 0, 0)',
      )
    })

    it('draws the shape on primary container when contained', () => {
      const { indicator } = setup({ contained: true })
      expect(hasClasses(indicator, stylex.props(probeStyles.container))).toBe(
        true,
      )
      expect(hasClasses(indicator, stylex.props(probeStyles.onContainer))).toBe(
        true,
      )
      expect(hasClasses(indicator, stylex.props(probeStyles.primary))).toBe(
        false,
      )
    })

    it('fills the shape with the colour the container sets', () => {
      const { indicator, shape } = setup({ contained: true })
      expect(getComputedStyle(shape).backgroundColor).toBe(
        getComputedStyle(indicator).color,
      )
    })
  })

  describe('shapes', () => {
    it('morphs through seven shapes and back to the first', () => {
      const { shape } = setup()
      const [morph] = keyframesOf(shape)
      const paths = valuesOf(morph, 'clip-path')
      expect(paths).toHaveLength(8)
      expect(new Set(paths.slice(0, 7)).size).toBe(7)
      expect(paths.at(-1)).toBe(paths[0])
    })

    // clip-path interpolates between two polygons only when they have the
    // same number of points; otherwise it jumps from one to the next.
    it('traces every shape with the same number of points', () => {
      const { shape } = setup()
      const [morph] = keyframesOf(shape)
      const counts = valuesOf(morph, 'clip-path').map(
        (path) => pointsOf(path).length,
      )
      expect(new Set(counts)).toEqual(new Set([90]))
    })

    // The active indicator is 38dp across inside the 48dp container, so no
    // point may sit further than 19dp from the centre at any angle the shape
    // turns through, and turning it changes no point's distance.
    it('keeps every shape inside the 38dp active indicator', () => {
      const { shape } = setup()
      const [morph] = keyframesOf(shape)
      const reach = Math.max(
        ...valuesOf(morph, 'clip-path').flatMap((path) =>
          pointsOf(path).map(({ x, y }) => Math.hypot(x - 50, y - 50)),
        ),
      )
      // 19 of 48, plus the rounding of the points to a tenth of a percent.
      expect(reach).toBeLessThanOrEqual((19 / 48) * 100 + 0.05)
      expect(reach).toBeGreaterThan((18 / 48) * 100)
    })

    it('turns a quarter with each morph, on the same spring', () => {
      const { shape } = setup()
      const [morph, turn] = keyframesOf(shape)
      const turns = valuesOf(turn, 'transform')
      expect(turns).toEqual([
        'rotate(0deg)',
        'rotate(90deg)',
        'rotate(180deg)',
        'rotate(270deg)',
        'rotate(360deg)',
      ])
      const [spring] = valuesOf(morph, 'animation-timing-function')
      expect(spring).toMatch(/^linear\(/u)
      expect(valuesOf(turn, 'animation-timing-function')[0]).toBe(spring)
    })
  })

  describe('motion', () => {
    it('morphs every 650ms, turning once every 4666ms underneath', () => {
      const { shape } = setup()
      const spin = shape.parentElement
      expect(getComputedStyle(shape).animationDuration).toBe('4.55s, 2.6s')
      expect(spin && getComputedStyle(spin).animationDuration).toBe('4.666s')
    })

    it('slows rather than stopping for reduced motion', () => {
      const { shape } = setup()
      const spin = shape.parentElement
      expect(reducedMotionOf(shape, 'animation-duration')).toEqual({
        reduced: '5.6875s, 3.25s',
        resting: '4.55s, 2.6s',
      })
      expect(spin && reducedMotionOf(spin, 'animation-duration')).toEqual({
        reduced: '5.833s',
        resting: '4.666s',
      })
    })
  })

  describe('forced colours', () => {
    it('paints the shape in CanvasText and keeps the mode off it', () => {
      const { shape } = setup()
      const held = declarationsHeld(shape, 'forced-colors: active')
      expect(held.get('background-color')?.toLowerCase()).toBe('canvastext')
      expect(held.get('forced-color-adjust')).toBe('none')
    })
  })
})
