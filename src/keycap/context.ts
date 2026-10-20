import { createContext } from 'react'

// Whether a Keycap draws in its own colours or in the colour of the text
// around it. A selected or disabled menu item asks for the second around its
// shortcut, so a keycap there takes the row's colour onto the selected
// container and fades with a disabled label, rather than staying dark and
// boxed on a row that has changed around it. Apart from the component so its
// module exports components alone, which is what keeps fast refresh working
// for it.

/** `neutral` is the keycap's own on surface and outline; `inherit` is the
 * colour around it, for its text and its rule alike. */
type KeycapTone = 'inherit' | 'neutral'

const KeycapToneContext = createContext<KeycapTone>('neutral')

export type { KeycapTone }

export { KeycapToneContext }
