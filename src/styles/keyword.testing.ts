// What `getComputedStyle` reports for a keyword the source writes, for a test
// asserting that keyword. Kept out of coverage with the tests themselves,
// since it is theirs rather than the library's.
//
// A browser may compute a keyword to another spelling of it: Chromium reports
// `flex-start` and `flex-end` as `flow-start` and `flow-end` from 158, the
// Chromium Playwright 1.65 drives, though it still accepts the old words as
// declared. Reading the browser's own spelling off a probe keeps
// an assertion naming the keyword the style declares, and keeps it apart from
// `start` and `end`, which compute to themselves.

/**
 * The value `property` computes to when declared as `keyword`, in this
 * browser's spelling: `computedKeyword('align-items', 'flex-start')`.
 */
function computedKeyword(property: string, keyword: string) {
  const probe = document.createElement('div')
  probe.style.setProperty(property, keyword)
  if (probe.style.getPropertyValue(property) === '') {
    throw new Error(`expected ${property} to accept ${keyword}`)
  }
  document.body.append(probe)
  try {
    return getComputedStyle(probe).getPropertyValue(property)
  } finally {
    probe.remove()
  }
}

export { computedKeyword }
