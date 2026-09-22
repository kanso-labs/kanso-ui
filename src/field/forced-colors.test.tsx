import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Select from '../components/select'
import TextField from '../components/text-field'
import { fieldChromeStyles } from './styles'

const FORCED_COLORS = 'forced-colors: active'

/**
 * The box a field renders, found by the classes the styles named compile to
 * rather than by a role — React Aria gives its `Group` a role that follows
 * whether the group is labelled, which differs between a text field and a
 * select. The variant styles have to be named alongside `box` because they
 * replace classes of its rather than adding to them, which is what StyleX
 * does with two styles setting one property.
 */
function box(
  element: ReactElement,
  ...variant: stylex.StyleXStyles[]
): Element {
  const view = render(element)
  const selector = (
    stylex.props(fieldChromeStyles.box, ...variant).className ?? ''
  )
    .split(' ')
    .filter(Boolean)
    .map((name) => `.${name}`)
    .join('')
  const found = view.container.querySelector(selector)

  if (found === null) {
    throw new Error(`No element matched ${selector}.`)
  }

  return found
}

/**
 * Every declaration that reaches `element` from inside a forced-colours media
 * query, keyed by property and by the selector's trailing pseudo-class.
 *
 * Reading the stylesheet is the only way to check this: Chromium exposes
 * forced-colours emulation through CDP alone, which neither the browser test
 * runner nor Chromatic's modes can reach, so no rendered element can be put
 * into that mode here. What a test can prove is that the rules exist and that
 * the element carries the classes they are written against.
 */
function forcedColorRules(element: Element): Map<string, string> {
  const found = new Map<string, string>()

  for (const sheet of document.styleSheets) {
    walk([...sheet.cssRules], false)
  }

  return found

  function walk(rules: CSSRule[], inForcedColors: boolean) {
    for (const rule of rules) {
      if (rule instanceof CSSMediaRule) {
        walk(
          [...rule.cssRules],
          inForcedColors || rule.conditionText.includes(FORCED_COLORS),
        )
        continue
      }

      if (rule instanceof CSSGroupingRule) {
        walk([...rule.cssRules], inForcedColors)
        continue
      }

      if (!inForcedColors || !(rule instanceof CSSStyleRule)) {
        continue
      }

      // A rule can carry several selectors, not one. StyleX gives each
      // declaration its own class, but two modules that happen to write the
      // same declaration under the same query share a rule — this box's
      // focus outline and the search bar's arrive as
      // `.abc.abc:focus-within, .def.def:focus`. Reading only the first
      // would report the rule as missing for whichever component lost the
      // race, which is a false negative rather than a gap.
      for (const selectorText of rule.selectorText.split(',')) {
        // Each is a run of one class repeated to raise specificity, plus an
        // optional pseudo-class: `.abc.abc:focus-within`.
        const [selector, pseudo = ''] = selectorText.trim().split(':', 2)
        const className = selector.split('.').find(Boolean)

        if (className === undefined || !element.classList.contains(className)) {
          continue
        }

        for (const property of rule.style) {
          found.set(
            pseudo === '' ? property : `${property}:${pseudo}`,
            rule.style.getPropertyValue(property),
          )
        }
      }
    }
  }
}

describe('a field under forced colours', () => {
  it('draws the filled box a boundary, in place of its underline', () => {
    const rules = forcedColorRules(box(<TextField label="Label" />))

    expect(rules.get('border-bottom-style')).toBe('solid')
    expect(rules.get('border-bottom-width')).toBe('1px')
  })

  it('draws the filled box a focus ring, in place of its underline', () => {
    const rules = forcedColorRules(box(<TextField label="Label" />))

    expect(rules.get('outline-style:focus-within')).toBe('solid')
    expect(rules.get('outline-width')).toBe('2px')
    expect(rules.get('outline-offset')).toBe('2px')
  })

  it('separates that ring from the boundary by colour', () => {
    const rules = forcedColorRules(box(<TextField label="Label" />))

    expect(rules.get('outline-color')).toBe('highlight')
  })

  it('reaches a field whose control is a button rather than an input', () => {
    const rules = forcedColorRules(box(<Select label="Label" />))

    expect(rules.get('border-bottom-style')).toBe('solid')
    expect(rules.get('outline-style:focus-within')).toBe('solid')
  })

  it('leaves the outlined box its own border, and adds the ring', () => {
    const rules = forcedColorRules(
      box(
        <TextField label="Label" variant="outlined" />,
        fieldChromeStyles.boxOutlined,
      ),
    )

    expect(rules.get('border-bottom-style')).toBe('none')
    expect(rules.get('outline-style:focus-within')).toBe('solid')
  })

  it('greys a disabled box, which no UA greys for itself', () => {
    const filled = forcedColorRules(
      box(
        <TextField isDisabled label="Label" />,
        fieldChromeStyles.boxDisabled,
      ),
    )
    const outlined = forcedColorRules(
      box(
        <TextField isDisabled label="Label" variant="outlined" />,
        fieldChromeStyles.boxOutlined,
        fieldChromeStyles.boxOutlinedDisabled,
      ),
    )

    expect(filled.get('border-bottom-color')).toBe('graytext')
    expect(outlined.get('color')).toBe('graytext')
  })
})
