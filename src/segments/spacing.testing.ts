// WCAG 2.5.8's test for a target smaller than 24 by 24, as a list of what
// fails it. Shared by the DateField and TimeField specs, since the segments
// both draw are one module's.

// The criterion's size, and the circle an undersized target is given.
const TARGET = 24

function centreOf(box: DOMRect) {
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
}

/**
 * The segments, in order, that sit too close to the one after them. A
 * target under 24 by 24 passes only where a 24px circle centred on it
 * reaches neither the next target nor, when that one is undersized too, the
 * next target's own circle. Adjacent pairs are enough, since the segments
 * sit in one line. Each failure is named by the two segments' text, so an
 * assertion that expects none says which pair it found.
 */
function crowdedSegments(segments: readonly HTMLElement[]) {
  const failures: string[] = []
  for (const [index, current] of segments.entries()) {
    const next = segments.at(index + 1)
    if (next === undefined) {
      break
    }
    const a = current.getBoundingClientRect()
    const b = next.getBoundingClientRect()
    const pair = `${current.textContent} and ${next.textContent}`
    if (isUndersized(a) && reach(centreOf(a), b) < TARGET / 2) {
      failures.push(`${pair}: the first one's circle reaches the second`)
    }
    if (isUndersized(b) && reach(centreOf(b), a) < TARGET / 2) {
      failures.push(`${pair}: the second one's circle reaches the first`)
    }
    if (
      isUndersized(a) &&
      isUndersized(b) &&
      Math.hypot(centreOf(a).x - centreOf(b).x, centreOf(a).y - centreOf(b).y) <
        TARGET
    ) {
      failures.push(`${pair}: their circles overlap`)
    }
  }
  return failures
}

function isUndersized(box: DOMRect) {
  return box.width < TARGET || box.height < TARGET
}

// How far a point is from the nearest edge of a box, nought inside it.
function reach(point: { x: number; y: number }, box: DOMRect) {
  const x = Math.max(box.left - point.x, 0, point.x - box.right)
  const y = Math.max(box.top - point.y, 0, point.y - box.bottom)
  return Math.hypot(x, y)
}

export { crowdedSegments }
