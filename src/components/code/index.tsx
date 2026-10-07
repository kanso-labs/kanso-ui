'use client'

import * as stylex from '@stylexjs/stylex'

import type { RenderComponentProps } from '../../render/useRender'

import { useRender } from '../../render/useRender'
import { mergeStyles } from '../../styles/merge'
import { typography } from '../../tokens/design.tokens.stylex'

// Sized in em rather than px, so a fragment of code takes the scale of
// whatever it interrupts. A mono face at the same nominal size as the prose
// around it reads a little larger — its glyphs are wider and its x-height
// taller — so 0.875em is what makes the two look level rather than what makes
// them measure the same.
//
// No background. The mono face against the serif and sans faces the rest of
// the system uses is already an unmistakable signal, and a tint here would
// introduce a second surface inside Card and Sheet, competing with the
// hierarchy those already establish. A call site wanting one can wrap this.
//
// No Material Design page draws inline code. What it follows is the type it
// interrupts: the role and the colour of the prose around it, at the ratio
// above, in the mono face the type tokens carry.
//
// The colour is inherited rather than set. A fixed on surface matched the
// prose only when the prose was on surface too: inside a muted or an error
// line it went dark mid-sentence, and on an inverse surface, a tooltip's or a
// snackbar's, it was on surface over inverse surface and could not be read.
// Whatever paints a surface around Code sets the colour that pairs with it,
// as CopyField does for its value.
const styles = stylex.create({
  base: {
    boxSizing: 'border-box',
    color: 'inherit',
    fontFamily: typography.fontFamilyMono,
    fontSize: '0.875em',
    // Identifiers that end up in code are often long and unbreakable by the
    // usual rules — a package path, a hash, a URL. `anywhere` lets one break
    // instead of pushing its container wider, and unlike `break-all` it only
    // does so when the line cannot otherwise fit.
    overflowWrap: 'anywhere',
  },
})

type CodeProps = RenderComponentProps<'code'>

/**
 * A fragment of code, a path, or an identifier set in the mono face. It
 * renders a `<code>` and takes its scale from the text around it.
 */
function Code({ render, ...props }: CodeProps) {
  return useRender({
    defaultTagName: 'code',
    props: {
      ...props,
      ...mergeStyles(stylex.props(styles.base), props),
    },
    render,
  })
}

export type { CodeProps }

export default Code
