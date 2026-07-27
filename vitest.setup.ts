import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Testing Library only auto-cleans when the runner exposes `afterEach` as a
// global, which this project does not, so an un-unmounted tree would leak into
// the next test.
afterEach(() => {
  cleanup()
})
