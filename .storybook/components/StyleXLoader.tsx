'use client'

import React, { useEffect } from 'react'

function StyleXLoader() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      void import('virtual:stylex:runtime')
    }
  }, [])

  const href = import.meta.env.DEV
    ? '/virtual:stylex.css'
    : './assets/stylex.css'

  return <link href={href} rel="stylesheet" />
}

export default StyleXLoader
