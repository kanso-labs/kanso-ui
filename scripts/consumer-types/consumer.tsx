// A consumer of the built package, type-checked by scripts/check-package.mjs
// under TypeScript 6's defaults and nothing else: no `*.css` declaration of
// its own, `noUncheckedSideEffectImports` on, and `skipLibCheck` off, so the
// package's own declarations are checked too. The package is reached by its
// own name, which a module inside it resolves through the exports map.
import '@kanso-labs/kanso-ui/styles.css'
import '@kanso-labs/kanso-ui/tokens.css'
import { Button } from '@kanso-labs/kanso-ui'

export function Consumer() {
  return <Button>Label</Button>
}
