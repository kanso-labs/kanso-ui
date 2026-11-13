import { createContext } from 'react'

// Whether a row is drawn on a field's value line rather than in a list. A
// select's chosen value is React Aria rendering the option's own content
// there, so the row inside it is RowContent, and that line is one line tall:
// the headline is cut short with an ellipsis rather than wrapped. Its text
// sits several elements inside the field's value, where `text-overflow` on
// the value never reaches it. Apart from RowContent so its module exports
// components alone, which is what keeps fast refresh working for it.
const RowOnValueLineContext = createContext(false)

export { RowOnValueLineContext }
