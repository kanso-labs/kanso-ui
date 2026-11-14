import * as stylex from '@stylexjs/stylex'
import { useSyncExternalStore } from 'react'

import { textScaleStyles } from '../styles/text-scale'

// Whether the reader has enlarged their text, which NavigationBar,
// NavigationRail and Tabs answer by letting a label take further lines rather
// than cutting it short.
//
// There is no media query for it, and the browser's text-size setting is not
// it: that setting is the root font size, and every type size here is a
// length in pixels, which it leaves alone. What does enlarge this library's
// text is a text-only zoom, and a browser's minimum font size, and both grow
// the font while every length in pixels stays as it is — so a label that fit
// its destination no longer does. Page zoom is not it either: it grows the
// text and the box around it together, which narrows the window rather than
// enlarging the text inside it.
//
// So a probe compares the two: an element as wide as its own font, `1em`, and
// as tall as the same size written as a length — see src/styles/text-scale.ts.
// The two agree until the font is enlarged, and a ResizeObserver on the probe
// catches the change as it is made. One probe for the whole page, appended to
// the body while anything is listening and removed after the last one stops.
//
// A server render and the first render after it say not enlarged, so a page
// is drawn as it always was and only a reader with enlarged text sees the
// labels change, once the probe is measured.

// Past 5% larger, which every text zoom step is: Firefox's smallest is 10%.
const THRESHOLD = 1.05

/** What the probe carries, so a spec can find it and enlarge its font. */
const PROBE_ATTRIBUTE = 'data-text-scale-probe'

const listeners = new Set<() => void>()
let probe: HTMLElement | null = null
let observer: null | ResizeObserver = null
let enlarged = false

function getEnlarged() {
  return enlarged
}

// A server knows nothing of the reader's settings.
function getServerEnlarged() {
  return false
}

function measure() {
  if (probe === null) {
    return
  }
  const { height, width } = probe.getBoundingClientRect()
  const next = height > 0 && width / height > THRESHOLD
  if (next === enlarged) {
    return
  }
  enlarged = next
  for (const listener of listeners) {
    listener()
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (probe === null) {
    probe = document.createElement('span')
    probe.setAttribute('aria-hidden', 'true')
    probe.setAttribute(PROBE_ATTRIBUTE, '')
    probe.className = stylex.props(textScaleStyles.probe).className ?? ''
    document.body.append(probe)
    observer = new ResizeObserver(measure)
    observer.observe(probe)
  }
  measure()

  return () => {
    listeners.delete(listener)
    if (listeners.size > 0) {
      return
    }
    observer?.disconnect()
    probe?.remove()
    observer = null
    probe = null
    enlarged = false
  }
}

/**
 * Whether the reader's text is drawn larger than the type sizes it was set
 * in, by a text-only zoom or a minimum font size: `false` on the server and
 * until the page has been measured.
 */
function useEnlargedText(): boolean {
  return useSyncExternalStore(subscribe, getEnlarged, getServerEnlarged)
}

export { PROBE_ATTRIBUTE, useEnlargedText }
