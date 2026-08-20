import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll } from 'vitest'

// Where the StyleX plugin serves the stylesheet it assembles from the rules it
// collected while transforming modules.
const STYLEX_CSS_PATH = '/virtual:stylex.css'

const STYLEX_STYLE_ID = 'kanso-stylex-test'

// StyleX reaches the page asynchronously under the dev server. The plugin puts
// a <link> to the endpoint above in the document head, plus a runtime module
// that re-fetches it whenever a newly transformed module contributes rules —
// and a spec's modules are transformed only once its page has already loaded,
// so the rules for the component under test arrive over that refresh rather
// than with the document. A computed style read before it lands describes an
// unstyled element, which is why assertions on colours, sizes and widths
// failed under CI's parallel load and passed when a file ran on its own.
//
// Collection has transformed everything the file imports by the time this
// runs, so one fetch here returns the finished stylesheet, and a <style> takes
// effect the moment its text is set. Every rule is then present before the
// first assertion rather than shortly after it. Fetching is what removes the
// race — nothing here waits for the plugin's own refresh to catch up.
beforeAll(async () => {
  const response = await fetch(`${STYLEX_CSS_PATH}?t=${Date.now()}`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(
      `StyleX stylesheet: GET ${STYLEX_CSS_PATH} answered ${response.status}.`,
    )
  }

  const css = await response.text()
  if (css.trim() === '') {
    throw new Error(
      `StyleX stylesheet: GET ${STYLEX_CSS_PATH} answered with no rules.`,
    )
  }

  const style =
    document.getElementById(STYLEX_STYLE_ID) ?? document.createElement('style')
  style.id = STYLEX_STYLE_ID
  style.textContent = css
  document.head.append(style)
})

// Testing Library only auto-cleans when the runner exposes `afterEach` as a
// global, which this project does not, so an un-unmounted tree would leak into
// the next test.
afterEach(() => {
  cleanup()
})
