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

export type { Theme }
export { allModes }
