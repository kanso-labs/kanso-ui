// A consumer of the built package, type-checked by scripts/check-package.mjs
// under TypeScript 6's defaults and nothing else: no `*.css` declaration of
// its own, `noUncheckedSideEffectImports` on, and `skipLibCheck` off, so the
// package's own declarations are checked too. The package is reached by its
// own name, which a module inside it resolves through the exports map.
import '@kanso-labs/kanso-ui/styles.css'
import '@kanso-labs/kanso-ui/tokens.css'
import { Button, TextField } from '@kanso-labs/kanso-ui'
import { createRef } from 'react'

// A ref of the element's own type, as a call site moving focus would hold one,
// against the published declarations rather than the source.
const button = createRef<HTMLButtonElement>()
const input = createRef<HTMLInputElement>()

export function Consumer() {
  return (
    <>
      <Button ref={button}>Label</Button>
      <TextField inputRef={input} label="Label" />
    </>
  )
}
