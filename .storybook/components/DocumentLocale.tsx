'use client'

import { useLayoutEffect } from 'react'
import { useLocale } from 'react-aria-components'

/**
 * Puts the story's locale and its direction on `<html>`, which is where a
 * portalled overlay reads them: a Sheet, a Dialog or a Popover renders at the
 * end of `<body>`, outside the story's own tree, so a `dir` set on a wrapper
 * around the story never reaches it. React Aria's own popovers stamp a `dir`
 * from `I18nProvider` themselves, and this covers everything else.
 *
 * A layout effect, so a story is never painted in the previous locale's
 * direction first. Rendering nothing, it sits inside the provider the
 * decorator wraps every story in.
 */
function DocumentLocale() {
  const { direction, locale } = useLocale()

  useLayoutEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = direction
  }, [direction, locale])

  return null
}

export default DocumentLocale
