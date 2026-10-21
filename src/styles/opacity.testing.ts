import * as stylex from '@stylexjs/stylex'

import { stateLayerOpacity } from '../tokens/design.tokens.stylex'

// What a test reading a faded part needs, shared so each such test does not
// carry its own copy. Kept out of coverage with the tests themselves, since it
// is theirs rather than the library's.

const probeStyles = stylex.create({
  disabledContent: { opacity: stateLayerOpacity.disabledContent },
})

/**
 * The opacity the disabled content token resolves to, read off a probe rather
 * than copied as a number, so a retuned token moves the assertion with it.
 */
function disabledContentOpacity() {
  const probe = document.createElement('span')
  probe.className = stylex.props(probeStyles.disabledContent).className ?? ''
  document.body.append(probe)
  const opacity = Number(getComputedStyle(probe).opacity)
  probe.remove()
  return opacity
}

/**
 * The opacity `element` is drawn at inside `ancestor`: its own and that of
 * every element between the two, multiplied, which is what a reader sees. An
 * element outside `ancestor` throws rather than reading the whole page.
 */
function opacityWithin(ancestor: Element, element: Element) {
  if (!ancestor.contains(element)) {
    throw new Error('expected the element to sit inside the ancestor')
  }
  let opacity = 1
  for (
    let node: Element | null = element;
    node !== null && node !== ancestor;
    node = node.parentElement
  ) {
    opacity *= Number(getComputedStyle(node).opacity)
  }
  return opacity
}

export { disabledContentOpacity, opacityWithin }
