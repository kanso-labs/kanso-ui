// Reading the compiled stylesheet, for a test that has to know what a media
// query the runner cannot turn on does to an element. Shared by every file
// that asks, so there is one walk rather than a copy per file drifting from
// the rest. Kept out of coverage with the tests themselves, since it is
// theirs rather than the library's.
//
// Why a walk rather than the query itself: Chromium exposes forced colours
// and reduced motion through CDP's `Emulation.setEmulatedMedia` alone, a
// page-level command while Vitest runs every test file as an iframe inside
// one shared page. Two files driving it write one setting, and the send waits
// on whatever the whole page is doing — see AGENTS.md, "Media queries a test
// cannot set". What a walk proves is that the rule is written and that the
// element carries the class it is written against; that the browser then
// applies it is the same thing `getComputedStyle` cannot prove either.

/** A rule reaching an element, as `rulesReaching` reports it. */
interface ReachingRule {
  /** Whether the rule sits inside the query the walk took as holding. */
  held: boolean
  /**
   * The trailing pseudo-class of the selector that reached the element,
   * `focus-within` for `.abc.abc:focus-within`, and `''` for none.
   */
  pseudo: string
  /**
   * The pseudo-element the selector names, `after` for `.abc.abc::after`,
   * and `''` for none. Such a rule styles a box drawn for the element rather
   * than the element itself, which `pseudo` alone does not say.
   */
  pseudoElement: string
  /** The rule's own declarations. */
  style: CSSStyleDeclaration
}

/**
 * Every declaration reaching `element` from inside the query `holding` names,
 * keyed by property, with the pseudo-class appended where a rule reaches it
 * through one: `outline-style:focus-within`. Where two set one key the later
 * wins.
 *
 * The element's own box by default; name `pseudoElement`, `after` for
 * `::after`, to read the box drawn for it instead. A rule styling a
 * pseudo-element used to be read as the element's own, since its selector
 * still carries the element's class.
 */
function declarationsHeld(
  element: Element,
  holding: string,
  pseudoElement = '',
) {
  const found = new Map<string, string>()

  for (const rule of rulesReaching(element, { holding })) {
    if (!rule.held || rule.pseudoElement !== pseudoElement) {
      continue
    }
    const { pseudo, style } = rule

    for (const property of style) {
      found.set(
        pseudo === '' ? property : `${property}:${pseudo}`,
        style.getPropertyValue(property),
      )
    }
  }

  return found
}

/**
 * What `property` rests at on `element`, and what
 * `@media (prefers-reduced-motion: reduce)` gives it — the pair a test of a
 * transition or an animation pins together, since a duration of `0s` in both
 * is a transition nobody wrote rather than a query doing its job.
 */
function reducedMotionOf(element: Element, property: string) {
  const rules = rulesReaching(element, {
    holding: 'prefers-reduced-motion: reduce',
  })

  return {
    reduced: valueIn(
      rules.filter((rule) => rule.held),
      property,
    ),
    resting: valueIn(
      rules.filter((rule) => !rule.held),
      property,
    ),
  }
}

/**
 * Every style rule that reaches `element`, in the order the stylesheet
 * applies them, so where two reach the same property the later one wins, as
 * it does in the page.
 *
 * `holding` names the one media query taken as true whatever the page says —
 * `'forced-colors: active'`, `'prefers-reduced-motion: reduce'` — and a rule
 * inside it comes back marked `held`. Any other query a rule sits inside is
 * asked of the page as it stands, so a rule keyed on a breakpoint reaches the
 * element only at the widths it names, and a test sets the viewport to read
 * one side of it. Every other grouping rule, the cascade layers StyleX writes
 * into among them, is walked into as it is.
 *
 * A rule reaches the element through any one of its selectors. StyleX gives
 * each declaration a class of its own, repeated to raise specificity, but two
 * modules writing the same declaration share one rule —
 * `.abc.abc:focus-within, .def.def:focus` — so reading only the first
 * selector would miss the element whichever module lost that race.
 */
function rulesReaching(
  element: Element,
  { holding }: { holding?: string } = {},
): ReachingRule[] {
  const found: ReachingRule[] = []

  for (const sheet of document.styleSheets) {
    walk([...sheet.cssRules], false)
  }

  return found

  function walk(rules: CSSRule[], held: boolean) {
    for (const rule of rules) {
      if (rule instanceof CSSMediaRule) {
        const isHolding =
          holding !== undefined && rule.conditionText.includes(holding)

        if (isHolding || matchMedia(rule.conditionText).matches) {
          walk([...rule.cssRules], held || isHolding)
        }
        continue
      }

      if (rule instanceof CSSGroupingRule) {
        walk([...rule.cssRules], held)
        continue
      }

      if (!(rule instanceof CSSStyleRule)) {
        continue
      }

      for (const selectorText of rule.selectorText.split(',')) {
        const [selector, pseudo = ''] = selectorText.trim().split(':', 2)
        const className = selector.split('.').find(Boolean)

        if (className !== undefined && element.classList.contains(className)) {
          const pseudoElement = /::([\w-]+)/u.exec(selectorText)?.[1] ?? ''
          found.push({ held, pseudo, pseudoElement, style: rule.style })
          break
        }
      }
    }
  }
}

/**
 * The value the last of `rules` to set `property` gives it, which is the one
 * the page applies, or `undefined` where none does.
 */
function valueIn(rules: readonly ReachingRule[], property: string) {
  let value: string | undefined

  for (const rule of rules) {
    const declared = rule.style.getPropertyValue(property)

    if (declared !== '') {
      value = declared
    }
  }

  return value
}

export type { ReachingRule }

export { declarationsHeld, reducedMotionOf, rulesReaching, valueIn }
