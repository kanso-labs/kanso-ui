import * as stylex from '@stylexjs/stylex'

// The order the library's overlays stack in over the page, from the bottom.
// Each is portalled to the end of the body, where an element with no
// `z-index` paints at the same level as the page's own unlayered content —
// so a page's sticky header at `z-index: 1` painted over a modal's scrim and
// over the top of its panel. Every layer here clears what a page gives its
// own chrome.
//
// - Page content, at whatever the page gives it.
// - `modal`: a modal's scrim, which holds the panel and so takes it along —
//   Dialog and Sheet, through `overlay.scrim`.
// - `toast`: the snackbar region, above a modal, so a toast raised from
//   inside one is not hidden behind its scrim.
// - React Aria's popovers, menus and tooltips, which set an inline
//   `z-index` of 100000 themselves: above everything here, so one opened
//   from inside a modal sits over it.
//
// Constants rather than custom properties, since a layer is an order between
// the library's own parts rather than a value a theme overrides — and a
// `.stylex.ts` module, which is the one place the StyleX compiler resolves a
// constant from across files.
const layers = stylex.defineConsts({
  modal: 900,
  toast: 1000,
})

export { layers }
