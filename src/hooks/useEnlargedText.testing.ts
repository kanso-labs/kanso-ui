import { act } from '@testing-library/react'

import { PROBE_ATTRIBUTE } from './useEnlargedText'

// What a reader's text-only zoom does to a page, which Chromium has no
// setting for: every font twice the size it was set in, and every length
// left alone. The type roles navigation labels and tab labels are set in
// are doubled at the root, each at twice its default, and the probe
// `useEnlargedText` measures keeps its height at the label medium size it was
// declared in while its font grows with the rest.
//
// `fontsOnly` doubles the type roles and leaves the probe matching them, the
// way a theme setting its labels larger does, which is not enlarged text.
function enlargeText({ fontsOnly = false } = {}) {
  const sheet = document.createElement('style')
  sheet.textContent = `
    :root {
      --kui-typography-label-large-line-height: 40px;
      --kui-typography-label-large-size: 28px;
      --kui-typography-label-medium-line-height: 32px;
      --kui-typography-label-medium-size: 24px;
      --kui-typography-title-small-line-height: 40px;
      --kui-typography-title-small-size: 28px;
    }
    ${fontsOnly ? '' : `[${PROBE_ATTRIBUTE}] { block-size: 12px !important; }`}
  `
  act(() => {
    document.head.append(sheet)
  })

  return () => {
    act(() => {
      sheet.remove()
    })
  }
}

/**
 * Resolves once the probe's ResizeObserver has reported the size the page
 * now draws it at, which arrives after the next frame.
 */
async function settle() {
  await act(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve()
        })
      })
    })
  })
}

export { enlargeText, settle }
