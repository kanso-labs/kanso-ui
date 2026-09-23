import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Calendar from '../components/calendar'
import ColorPicker from '../components/color-picker'
import IconButton from '../components/icon-button'
import ProgressIndicator from '../components/progress-indicator'
import Snackbar from '../components/snackbar'
import { motion, sizing, spacing } from './design.tokens.stylex'

// `--kui-*` is the documented override contract, so a consumer who resizes or
// retimes one of these expects everything drawn from it to follow. A value
// spelled as a literal beside its own token does not: it matches while the
// token sits at its default and parts company the moment the token moves,
// which is the one condition no default-token test can see.
//
// The schemes move each step well clear of its default so a stale literal
// cannot pass by coincidence. `Editorial` in src/theming/themes.ts is the kind
// of scheme this stands in for; slider/index.test.tsx's `looseSpacing` is the
// same technique against the spacing scale.
const wideControls = stylex.createTheme(sizing, {
  controlLg: '72px',
  controlMd: '64px',
  controlSm: '52px',
  controlXl: '112px',
  controlXs: '44px',
  controlXxl: '152px',
})

const slowMotion = stylex.createTheme(motion, {
  durationLong2: '900ms',
  durationMedium1: '700ms',
})

/** Both edges of an element, which is what a square control has to keep equal. */
function boxOf(element: Element) {
  const { height, width } = element.getBoundingClientRect()
  return { height, width }
}

describe('a control sized from a token a consumer moved', () => {
  it.each([
    ['xs', '44px'],
    ['md', '52px'],
    ['lg', '72px'],
    ['xl', '112px'],
    ['xxl', '152px'],
  ] as const)('keeps the %s icon button square', (size, expected) => {
    const view = render(
      <div {...stylex.props(wideControls)}>
        <IconButton aria-label="Label" size={size}>
          <span />
        </IconButton>
      </div>,
    )
    const box = boxOf(view.getByRole('button', { name: 'Label' }))

    expect(box.height).toBe(Number.parseInt(expected, 10))
    expect(box.width).toBe(box.height)
  })

  // The chrome in src/styles/icon-button.ts rather than the component: the
  // calendar's chevrons and the picker trigger draw through it, and it had
  // the same split between a token on one edge and a literal on the other.
  it('keeps the shared chrome square, which the month chevrons draw through', () => {
    const view = render(
      <div {...stylex.props(wideControls)}>
        <Calendar aria-label="Label" />
      </div>,
    )
    const chevron = view.container.querySelector('button[slot="previous"]')

    if (chevron === null) {
      throw new Error('expected the calendar to draw a chevron')
    }

    const box = boxOf(chevron)

    expect(box.height).toBe(52)
    expect(box.width).toBe(box.height)
  })

  // Themed on the document rather than on a wrapper: React Aria portals the
  // toast region to the end of `<body>`, so a class on an element around
  // `<Snackbar>` never reaches what it renders.
  it("keeps the snackbar's close button square", () => {
    const queue = new Snackbar.Queue()
    queue.add('First item', { showCloseButton: true })
    const themed = (stylex.props(wideControls).className ?? '').split(' ')
    const root = document.documentElement

    root.classList.add(...themed.filter(Boolean))
    try {
      const view = render(<Snackbar queue={queue} />)
      const box = boxOf(view.getByRole('button', { name: 'Close' }))

      expect(box.height).toBe(64)
      expect(box.width).toBe(box.height)
    } finally {
      root.classList.remove(...themed.filter(Boolean))
    }
  })
})

describe('a transition timed from a token a consumer moved', () => {
  it('follows the scale for the determinate ring', () => {
    const view = render(
      <div {...stylex.props(slowMotion)}>
        <ProgressIndicator label="Label" value={40} variant="circular" />
      </div>,
    )
    const arc = view.container.querySelector('circle:last-of-type')

    if (arc === null) {
      throw new Error('expected the ring to draw an arc')
    }

    expect(getComputedStyle(arc).transitionDuration).toBe('0.9s')
  })

  it('follows the scale for the determinate line', () => {
    const view = render(
      <div {...stylex.props(slowMotion)}>
        <ProgressIndicator label="Label" value={40} />
      </div>,
    )
    const bar = view.getByRole('progressbar', { name: 'Label' })
    // The row's first span is the active part — the one whose width is the
    // value, and so the one the transition is on.
    const active = bar.querySelector('div:last-of-type > span')

    if (active === null) {
      throw new Error('expected the line to draw its active part')
    }

    expect(getComputedStyle(active).transitionDuration).toBe('0.7s')
  })
})

describe('a surface inset from a token a consumer moved', () => {
  // The picker's popover held its own margin below the breakpoint as a bare
  // 32px, which is two of the spacing step the same chrome pads its surfaces
  // with — so a scheme moving that step left the two disagreeing.
  it('insets the picker surface by two of the spacing step', () => {
    const view = render(
      <ColorPicker defaultOpen defaultValue="#6750A4" label="Label" />,
    )
    const surface = view.getByRole('dialog').parentElement

    if (surface === null) {
      throw new Error('expected the dialog to sit on a surface')
    }

    // Read as written rather than as resolved: the value only applies below
    // the medium breakpoint, and what this pins is that it is spelled from
    // the token rather than from the number it happens to equal.
    // is the variable StyleX compiled the token to, so comparing against it
    // is the same question a consumer overriding the step would ask.
    expect(maxInlineSizesOf(surface).join(' ')).toContain(spacing.lg)
  })
})

/**
 * Every `max-width` the stylesheet gives `element` — StyleX compiles
 * `maxInlineSize` to the physical property, read as authored.
 * All of them rather than one: the surface sets the property twice, once at
 * rest and once under the breakpoint, and it is the second that carries the
 * token. `getComputedStyle` would resolve the `calc()` to pixels and only
 * inside the query, so the rules are read instead.
 */
function maxInlineSizesOf(element: Element): string[] {
  const found: string[] = []

  for (const sheet of document.styleSheets) {
    walk([...sheet.cssRules])
  }

  return found

  function walk(rules: CSSRule[]) {
    for (const rule of rules) {
      if (rule instanceof CSSGroupingRule) {
        walk([...rule.cssRules])
        continue
      }

      if (!(rule instanceof CSSStyleRule)) {
        continue
      }

      const className = rule.selectorText.split(/[.:]/).find(Boolean)
      const value = rule.style.getPropertyValue('max-width')

      if (
        className !== undefined &&
        value !== '' &&
        element.classList.contains(className)
      ) {
        found.push(value)
      }
    }
  }
}
