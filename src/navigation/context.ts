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

/** Which of the three forms a destination draws — see ./styles.ts. */
type NavigationForm = 'bar' | 'collapsed' | 'expanded'

const NavigationContext = createContext<NavigationContextValue>({
  form: 'bar',
})

export type { NavigationContextValue, NavigationForm }

export { NavigationContext }
