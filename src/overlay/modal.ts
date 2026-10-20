import { createContext } from 'react'

// Whether a modal is open around what reads it. Every modal draws its own
// scrim across the whole window, so one opened from inside another laid a
// second over the first: the page darkened twice over, and the first modal's
// own surface was dimmed with it. A modal set inside another reads this as
// true and draws its scrim without a fill, leaving the first modal's as the
// one the page is dimmed by. Its scrim is still there, empty, since it is
// what React Aria reads a press outside the modal from.
//
// Set by a modal around its content rather than by `OverlayScope`, which
// popovers set too: a modal opened from a popover is over a modal only if the
// popover is inside one, and the context reaching it through the popover from
// further out says exactly that. Apart from the components so their modules
// export components alone, which is what keeps fast refresh working for them.
const InsideModalContext = createContext(false)

export { InsideModalContext }
