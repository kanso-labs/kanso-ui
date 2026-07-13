import * as stylex from '@stylexjs/stylex'

const DARK = '@media (prefers-color-scheme: dark)'

const colors = stylex.defineVars({
  border: { [DARK]: '#3a3a3a', default: '#e2e2e2' },
  borderStrong: { [DARK]: '#555555', default: '#c4c4c4' },
  brand: { [DARK]: '#22cfa9', default: '#1cc29f' },
  brandHover: { [DARK]: '#3fdcb9', default: '#17a488' },
  brandSubtle: { [DARK]: '#103d33', default: '#e4f7f2' },
  danger: { [DARK]: '#ef5350', default: '#d32f2f' },
  dangerHover: { [DARK]: '#f26f6c', default: '#b52828' },
  dangerSubtle: { [DARK]: '#4a1f1d', default: '#fdecea' },
  focusRing: { [DARK]: '#2dd4bf', default: '#0d9488' },
  negative: { [DARK]: '#ff8a5c', default: '#e2572b' },
  negativeSubtle: { [DARK]: '#43241a', default: '#fdeee8' },
  overlay: { [DARK]: 'rgba(0, 0, 0, 0.6)', default: 'rgba(0, 0, 0, 0.5)' },
  positive: { [DARK]: '#57c793', default: '#26a069' },
  positiveSubtle: { [DARK]: '#173b2b', default: '#e7f6ef' },
  surface: { [DARK]: '#171717', default: '#ffffff' },
  surfaceHover: { [DARK]: '#262626', default: '#f5f5f5' },
  surfaceRaised: { [DARK]: '#1f1f1f', default: '#ffffff' },
  surfaceSunken: { [DARK]: '#0f0f0f', default: '#f2f2f2' },
  textMuted: { [DARK]: '#7d7d7d', default: '#8a8a8a' },
  textOnBrand: { [DARK]: '#0b2a23', default: '#ffffff' },
  textOnDanger: { [DARK]: '#2a0b0b', default: '#ffffff' },
  textPrimary: { [DARK]: '#ededed', default: '#1f1f1f' },
  textSecondary: { [DARK]: '#a8a8a8', default: '#5b5b5b' },
})

export { colors }
