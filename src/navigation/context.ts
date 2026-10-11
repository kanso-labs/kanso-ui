import { createContext } from 'react'

// Apart from ./index.tsx so that file exports components alone, which is what
// keeps fast refresh working for it — the same arrangement `src/row` uses.

/**
 * What NavigationBar and NavigationRail hand their destinations: the form to
 * draw, and the route of the current one.
 */
type NavigationContextValue = {
  form: NavigationForm
  selectedRoute?: string | undefined
}

/**
 * Which form a destination draws — see ./styles.ts. `barCramped` is the bar's
 * vertical form at every width, for a bar too narrow for its horizontal one.
 */
type NavigationForm = 'bar' | 'barCramped' | 'collapsed' | 'expanded'

const NavigationContext = createContext<NavigationContextValue>({
  form: 'bar',
})

export type { NavigationContextValue, NavigationForm }

export { NavigationContext }
