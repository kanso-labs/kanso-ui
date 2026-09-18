import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'

import { CheckGlyph } from '../glyphs'
import { chipStyles } from './styles'

/**
 * The check a selected chip draws before its label, and nothing at all while
 * it is not selected. Returns a node rather than letting the type be
 * inferred, since `ReactNode` is a union that includes a promise and an
 * inferred one has to be `async`.
 *
 * Shared rather than written at each of the two call sites: Chip and
 * ChipGroup's chip draw the same pill from `./styles`, and a check written
 * twice is the drift that module exists to stop. Not a component of the
 * library's own and not exported from the package; see `src/row` for the
 * same arrangement around a list's row.
 */
function chipGlyph(isSelected: boolean): ReactNode {
  if (!isSelected) {
    return null
  }
  return (
    <span {...stylex.props(chipStyles.glyph)}>
      <CheckGlyph {...stylex.props(chipStyles.glyphSvg)} />
    </span>
  )
}

export { chipGlyph }
