// Chromatic renders every story once per mode, so each one is reviewed in both
// themes. A mode sets Storybook globals, which is why the theme has to live in
// `globals` rather than in an addon's own state — see preview.tsx.
//
// Baselines are keyed on the mode's *name*, not on the globals it carries, so
// renaming a key here restarts that snapshot's history instead of carrying it
// over. Treat these keys as stable.

type Theme = 'dark' | 'light'

const allModes: Record<Theme, { theme: Theme }> = {
  dark: { theme: 'dark' },
  light: { theme: 'light' },
}

// The pane layouts are the one thing here that a single width cannot document:
// a media query answers to the window rather than to a container, so no
// arrangement of samples on one page shows the narrow case beside the wide
// one. These carry a viewport as well as a theme, which is what Chromatic's
// modes are for — its older `viewports` parameter cannot be combined with
// modes at all, and a story setting both fails the whole build rather than
// just that story.
//
// A story's own modes are merged with the project's rather than replacing
// them, so a story using these is captured in light and dark at Chromatic's
// own width as well. That is what decides which entries belong here: a wide
// window is already the default snapshot, so these only have to add the
// arrangements it cannot reach — one pane at compact, an even split at medium.
//
// The theme is pinned so each of these costs one snapshot rather than two.
// Grid track sizing is theme-independent, and the inherited light and dark
// pair already covers the colours at a width where both panes are on screen.
const breakpointModes = {
  compact: { theme: 'light', viewport: 500 },
  medium: { theme: 'light', viewport: 700 },
} as const satisfies Record<string, { theme: Theme; viewport: number }>

export type { Theme }
export { allModes, breakpointModes }
