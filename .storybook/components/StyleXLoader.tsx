'use client'

// `import.meta.env` has no type here: no tsconfig project covers .storybook,
// deliberately — Storybook's indexer reads preview.tsx as text and `eval`s the
// storySort expression as plain JavaScript, so an annotation there takes the
// story index down. See the comment above preview.tsx's own copy of this
// disable.
//
// Scoped to the one rule rather than the file, and needed because lint-staged
// invokes oxlint per staged path. A per-file run resolves no project, so the
// member access reads as `error`-typed and the pre-commit hook rejects a file
// the repo-wide `oxlint --type-aware .` accepts.
/* oxlint-disable typescript/no-unsafe-member-access -- untyped by necessity, see above */

import React, { useEffect } from 'react'

// The runtime module re-fetches the dev server's stylesheet whenever a newly
// transformed module contributes rules, so it is wanted under `serve` and
// nowhere else. It sits out here rather than inside the effect because the
// React Compiler has no lowering for an `import()` expression yet, and under
// the panic threshold the build runs at, one inside a component fails the
// build. A plain function is neither a component nor a hook, so the compiler
// leaves it alone and compiles the component around it.
function loadStylexRuntime() {
  void import('virtual:stylex:runtime')
}

function StyleXLoader() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      loadStylexRuntime()
    }
  }, [])

  const href = import.meta.env.DEV
    ? '/virtual:stylex.css'
    : './assets/stylex.css'

  return <link href={href} rel="stylesheet" />
}

export default StyleXLoader
