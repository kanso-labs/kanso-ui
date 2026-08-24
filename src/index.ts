// Side-effect import, and the only thing that makes the published package
// styled on import alone. `./styles.css` is listed under `deps.neverBundle`
// in tsdown.config.ts, so rolldown passes the specifier through to
// dist/index.js untouched rather than trying to resolve a stylesheet the
// build has not written yet — see the `emit-stylex-css` plugin there.
// oxlint-disable-next-line import/no-unassigned-import -- the side effect is the point
import './styles.css'

export * from './components'
