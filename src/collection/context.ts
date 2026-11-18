import { createContext } from 'react'

// Which row a ListBox's options draw: the lists page's, wherever the list
// sits on its own, or the menus page's inside the popup of a Select or a
// ComboBox. Material Design draws an exposed dropdown menu — which is what
// those two are — as a menu, so their options are 48dp rows at the menu's
// 12dp with its selected container, and the list's section header, its
// empty row and its load-more row follow the same page. The field providing
// it is what decides; a ListBox cannot tell from inside whether it is in a
// popup. Apart from the components so their modules export components alone,
// which is what keeps fast refresh working for them.
const OptionRowContext = createContext<'list' | 'menu'>('list')

export { OptionRowContext }
