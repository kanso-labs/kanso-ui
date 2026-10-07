// Reading where an anchored surface grows from, for a test of a component
// that opens one. Shared by every file that asks, so the select, the combo
// box and the pickers read the origin one way. Kept out of coverage with the
// tests themselves, since it is theirs rather than the library's.

/**
 * A container at the foot of the window, leaving whatever is rendered into it
 * no room underneath for a surface, so React Aria opens the surface above.
 * How far down it sits is read off the window, which is why it is set here
 * rather than written as a style. Testing Library removes it with the rest of
 * a test's render, since it is a child of the body.
 */
function atFootOfWindow() {
  const container = document.createElement('div')
  container.style.paddingBlockStart = `${window.innerHeight - 96}px`
  document.body.append(container)
  return container
}

/**
 * Where `surface` grows from, as fractions of its own width and height from
 * its top-left corner: `{ x: 0.5, y: 0 }` is the middle of its top edge. Read
 * from `transform-origin` as the page resolves it, which for a surface with
 * no origin of its own is its centre, `{ x: 0.5, y: 0.5 }`. Fractions rather
 * than pixels, so a surface of any size reads the same.
 */
function originOf(surface: Element) {
  const style = getComputedStyle(surface)
  const [x, y] = style.transformOrigin
    .split(' ')
    .map((length) => Number.parseFloat(length))
  return {
    x: x / Number.parseFloat(style.width),
    y: y / Number.parseFloat(style.height),
  }
}

export { atFootOfWindow, originOf }
