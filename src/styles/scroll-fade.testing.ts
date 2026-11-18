import * as stylex from '@stylexjs/stylex'
import { waitFor } from '@testing-library/react'
import { expect } from 'vitest'

import { scrollFade } from './scroll-fade'

// Which fade a box that scrolls sideways is drawing, read back by name, for
// the tests of every component that takes one — a scrollable tab bar and a
// resizable table so far. Compared with the shared styles' own computed
// masks rather than with gradients spelled out again in each test.

/** The fade a box draws: on its start edge, its end edge, both or neither. */
type ScrollFadeName = 'both' | 'end' | 'none' | 'start'

const NAMES = ['both', 'end', 'none', 'start'] as const

/** Waits for `box` to draw `fade`, which follows a scroll by a frame. */
async function expectScrollFade(
  box: HTMLElement,
  masks: Record<string, ScrollFadeName>,
  fade: ScrollFadeName,
) {
  await waitFor(() => {
    expect(masks[getComputedStyle(box).maskImage]).toBe(fade)
  })
}

/**
 * What each fade computes to in `dir`, keyed by the computed `mask-image`, so
 * `masks[getComputedStyle(box).maskImage]` names the fade a box draws.
 */
function scrollFadeMasks(dir: 'ltr' | 'rtl') {
  const wrapper = document.createElement('div')
  wrapper.dir = dir
  const probes = NAMES.map((name) => {
    const probe = document.createElement('span')
    probe.className =
      name === 'none' ? '' : (stylex.props(scrollFade[name]).className ?? '')
    wrapper.append(probe)
    return [name, probe] as const
  })
  document.body.append(wrapper)
  const masks: Record<string, ScrollFadeName> = {}
  for (const [name, probe] of probes) {
    masks[getComputedStyle(probe).maskImage] = name
  }
  wrapper.remove()
  // Four different masks, or a mapping from one to its name says nothing.
  expect(Object.keys(masks)).toHaveLength(NAMES.length)
  return masks
}

export type { ScrollFadeName }
export { expectScrollFade, scrollFadeMasks }
