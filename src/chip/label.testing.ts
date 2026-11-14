// Where the browser lays a label's characters, for the specs pinning which
// way a chip's label runs. Shared by the chip module's own spec and the
// TokenField spec, since all three components draw their label through
// `./label`.

/**
 * The left edge of the character at `index` of `element`'s text: the order
 * a reader sees the characters in, rather than the order they are stored in.
 */
function leftOf(element: HTMLElement, index: number) {
  const text = element.firstChild
  if (!(text instanceof Text)) {
    throw new TypeError('expected the element to hold its text directly')
  }
  const range = document.createRange()
  range.setStart(text, index)
  range.setEnd(text, index + 1)
  return range.getBoundingClientRect().left
}

export { leftOf }
