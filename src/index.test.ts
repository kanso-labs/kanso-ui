import * as reactAria from 'react-aria-components'
import { describe, expect, it } from 'vitest'

import * as publicApi from '.'
import {
  AppBar as ComponentsAppBar,
  Avatar as ComponentsAvatar,
  Button as ComponentsButton,
  Card as ComponentsCard,
  Checkbox as ComponentsCheckbox,
  CheckboxGroup as ComponentsCheckboxGroup,
  Chip as ComponentsChip,
  Code as ComponentsCode,
  Container as ComponentsContainer,
  CopyField as ComponentsCopyField,
  Currency as ComponentsCurrency,
  Dialog as ComponentsDialog,
  Feed as ComponentsFeed,
  Form as ComponentsForm,
  IconButton as ComponentsIconButton,
  Keycap as ComponentsKeycap,
  Link as ComponentsLink,
  ListDetail as ComponentsListDetail,
  ListItem as ComponentsListItem,
  NumberField as ComponentsNumberField,
  Popover as ComponentsPopover,
  ProductIcon as ComponentsProductIcon,
  Radio as ComponentsRadio,
  RadioGroup as ComponentsRadioGroup,
  SearchField as ComponentsSearchField,
  Separator as ComponentsSeparator,
  Sheet as ComponentsSheet,
  Slider as ComponentsSlider,
  Stack as ComponentsStack,
  SupportingPane as ComponentsSupportingPane,
  Switch as ComponentsSwitch,
  Tabs as ComponentsTabs,
  Tag as ComponentsTag,
  Text as ComponentsText,
  TextArea as ComponentsTextArea,
  TextField as ComponentsTextField,
  Tooltip as ComponentsTooltip,
} from './components'

describe('package entry point', () => {
  // Deliberately exact rather than a `toContain`, so an internal helper
  // leaking into the published surface fails here instead of shipping.
  it('exposes exactly the documented public API', () => {
    expect(Object.keys(publicApi)).toEqual([
      'AppBar',
      'Avatar',
      'Button',
      'Card',
      'Checkbox',
      'CheckboxGroup',
      'Chip',
      'Code',
      'Collection',
      'Container',
      'CopyField',
      'Currency',
      'DIRECTORY_DRAG_TYPE',
      'Dialog',
      'Feed',
      'Focusable',
      'Form',
      'GridLayout',
      'I18nProvider',
      'IconButton',
      'Keycap',
      'Link',
      'ListDetail',
      'ListItem',
      'ListLayout',
      'NumberField',
      'Popover',
      'Pressable',
      'ProductIcon',
      'Radio',
      'RadioGroup',
      'RouterProvider',
      'SearchField',
      'Separator',
      'Sheet',
      'Slider',
      'Stack',
      'SupportingPane',
      'Switch',
      'TableLayout',
      'Tabs',
      'Tag',
      'Text',
      'TextArea',
      'TextField',
      'Tooltip',
      'Virtualizer',
      'VisuallyHidden',
      'WaterfallLayout',
      'getColorChannels',
      'isDirectoryDropItem',
      'isFileDropItem',
      'isTextDropItem',
      'parseColor',
      'useAsyncList',
      'useDrag',
      'useDragAndDrop',
      'useDrop',
      'useFilter',
      'useListData',
      'useLocale',
      'useTreeData',
    ])
  })

  it('forwards AppBar as the same reference as the components barrel', () => {
    expect(publicApi.AppBar).toBe(ComponentsAppBar)
  })

  it('forwards Avatar as the same reference as the components barrel', () => {
    expect(publicApi.Avatar).toBe(ComponentsAvatar)
  })

  it('forwards Tag as the same reference as the components barrel', () => {
    expect(publicApi.Tag).toBe(ComponentsTag)
  })

  it('forwards Button as the same reference as the components barrel', () => {
    expect(publicApi.Button).toBe(ComponentsButton)
  })

  it('forwards Card as the same reference as the components barrel', () => {
    expect(publicApi.Card).toBe(ComponentsCard)
  })

  it('forwards Chip as the same reference as the components barrel', () => {
    expect(publicApi.Chip).toBe(ComponentsChip)
  })

  it('forwards Code as the same reference as the components barrel', () => {
    expect(publicApi.Code).toBe(ComponentsCode)
  })

  it('forwards Container as the same reference as the components barrel', () => {
    expect(publicApi.Container).toBe(ComponentsContainer)
  })

  it('forwards CopyField as the same reference as the components barrel', () => {
    expect(publicApi.CopyField).toBe(ComponentsCopyField)
  })

  it('forwards Currency as the same reference as the components barrel', () => {
    expect(publicApi.Currency).toBe(ComponentsCurrency)
  })

  it('forwards Feed as the same reference as the components barrel', () => {
    expect(publicApi.Feed).toBe(ComponentsFeed)
  })

  it('forwards IconButton as the same reference as the components barrel', () => {
    expect(publicApi.IconButton).toBe(ComponentsIconButton)
  })

  it('forwards Keycap as the same reference as the components barrel', () => {
    expect(publicApi.Keycap).toBe(ComponentsKeycap)
  })

  it('forwards Link as the same reference as the components barrel', () => {
    expect(publicApi.Link).toBe(ComponentsLink)
  })

  it('forwards ListDetail as the same reference as the components barrel', () => {
    expect(publicApi.ListDetail).toBe(ComponentsListDetail)
  })

  it('forwards ListItem as the same reference as the components barrel', () => {
    expect(publicApi.ListItem).toBe(ComponentsListItem)
  })

  it('forwards Popover as the same reference as the components barrel', () => {
    expect(publicApi.Popover).toBe(ComponentsPopover)
  })

  it('forwards ProductIcon as the same reference as the components barrel', () => {
    expect(publicApi.ProductIcon).toBe(ComponentsProductIcon)
  })

  it('forwards Separator as the same reference as the components barrel', () => {
    expect(publicApi.Separator).toBe(ComponentsSeparator)
  })

  it('forwards Sheet as the same reference as the components barrel', () => {
    expect(publicApi.Sheet).toBe(ComponentsSheet)
  })

  it('forwards Stack as the same reference as the components barrel', () => {
    expect(publicApi.Stack).toBe(ComponentsStack)
  })

  it('forwards SupportingPane as the same reference as the components barrel', () => {
    expect(publicApi.SupportingPane).toBe(ComponentsSupportingPane)
  })

  it('forwards Tabs as the same reference as the components barrel', () => {
    expect(publicApi.Tabs).toBe(ComponentsTabs)
  })

  it('forwards Text as the same reference as the components barrel', () => {
    expect(publicApi.Text).toBe(ComponentsText)
  })

  it('forwards TextField as the same reference as the components barrel', () => {
    expect(publicApi.TextField).toBe(ComponentsTextField)
  })

  it('forwards Checkbox as the same reference as the components barrel', () => {
    expect(publicApi.Checkbox).toBe(ComponentsCheckbox)
  })

  it('forwards CheckboxGroup as the same reference as the components barrel', () => {
    expect(publicApi.CheckboxGroup).toBe(ComponentsCheckboxGroup)
  })

  it('forwards RadioGroup as the same reference as the components barrel', () => {
    expect(publicApi.RadioGroup).toBe(ComponentsRadioGroup)
  })

  it('forwards Radio as the same reference as the components barrel', () => {
    expect(publicApi.Radio).toBe(ComponentsRadio)
  })

  it('forwards Switch as the same reference as the components barrel', () => {
    expect(publicApi.Switch).toBe(ComponentsSwitch)
  })

  it('forwards Slider as the same reference as the components barrel', () => {
    expect(publicApi.Slider).toBe(ComponentsSlider)
  })

  it('forwards NumberField as the same reference as the components barrel', () => {
    expect(publicApi.NumberField).toBe(ComponentsNumberField)
  })

  it('forwards SearchField as the same reference as the components barrel', () => {
    expect(publicApi.SearchField).toBe(ComponentsSearchField)
  })

  it('forwards TextArea as the same reference as the components barrel', () => {
    expect(publicApi.TextArea).toBe(ComponentsTextArea)
  })

  it('forwards Form as the same reference as the components barrel', () => {
    expect(publicApi.Form).toBe(ComponentsForm)
  })

  it('forwards Dialog as the same reference as the components barrel', () => {
    expect(publicApi.Dialog).toBe(ComponentsDialog)
  })

  it('forwards Tooltip as the same reference as the components barrel', () => {
    expect(publicApi.Tooltip).toBe(ComponentsTooltip)
  })

  // Every utility is React Aria's own object, not a wrapper: a consumer's
  // `I18nProvider` from here has to be the one the components read, or the
  // locale it sets never reaches them. Written as static property reads
  // rather than a name list, so a name missing from either side fails to
  // compile rather than comparing two undefineds.
  const REACT_ARIA_UTILITIES = {
    Collection: [publicApi.Collection, reactAria.Collection],
    DIRECTORY_DRAG_TYPE: [
      publicApi.DIRECTORY_DRAG_TYPE,
      reactAria.DIRECTORY_DRAG_TYPE,
    ],
    Focusable: [publicApi.Focusable, reactAria.Focusable],
    getColorChannels: [publicApi.getColorChannels, reactAria.getColorChannels],
    GridLayout: [publicApi.GridLayout, reactAria.GridLayout],
    I18nProvider: [publicApi.I18nProvider, reactAria.I18nProvider],
    isDirectoryDropItem: [
      publicApi.isDirectoryDropItem,
      reactAria.isDirectoryDropItem,
    ],
    isFileDropItem: [publicApi.isFileDropItem, reactAria.isFileDropItem],
    isTextDropItem: [publicApi.isTextDropItem, reactAria.isTextDropItem],
    ListLayout: [publicApi.ListLayout, reactAria.ListLayout],
    parseColor: [publicApi.parseColor, reactAria.parseColor],
    Pressable: [publicApi.Pressable, reactAria.Pressable],
    RouterProvider: [publicApi.RouterProvider, reactAria.RouterProvider],
    TableLayout: [publicApi.TableLayout, reactAria.TableLayout],
    useAsyncList: [publicApi.useAsyncList, reactAria.useAsyncList],
    useDrag: [publicApi.useDrag, reactAria.useDrag],
    useDragAndDrop: [publicApi.useDragAndDrop, reactAria.useDragAndDrop],
    useDrop: [publicApi.useDrop, reactAria.useDrop],
    useFilter: [publicApi.useFilter, reactAria.useFilter],
    useListData: [publicApi.useListData, reactAria.useListData],
    useLocale: [publicApi.useLocale, reactAria.useLocale],
    useTreeData: [publicApi.useTreeData, reactAria.useTreeData],
    Virtualizer: [publicApi.Virtualizer, reactAria.Virtualizer],
    VisuallyHidden: [publicApi.VisuallyHidden, reactAria.VisuallyHidden],
    WaterfallLayout: [publicApi.WaterfallLayout, reactAria.WaterfallLayout],
  }

  it.each(Object.entries(REACT_ARIA_UTILITIES))(
    'forwards %s as the same reference as react-aria-components',
    (_name, [ours, theirs]) => {
      expect(ours).toBe(theirs)
    },
  )
})
