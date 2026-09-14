'use client'

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
