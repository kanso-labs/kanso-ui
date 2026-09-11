import * as reactAria from 'react-aria-components'
import { describe, expect, it } from 'vitest'

import * as publicApi from '.'
import {
  AppBar as ComponentsAppBar,
  Autocomplete as ComponentsAutocomplete,
  Avatar as ComponentsAvatar,
  Breadcrumbs as ComponentsBreadcrumbs,
  Button as ComponentsButton,
  Calendar as ComponentsCalendar,
  Card as ComponentsCard,
  Checkbox as ComponentsCheckbox,
  CheckboxGroup as ComponentsCheckboxGroup,
  Chip as ComponentsChip,
  ChipGroup as ComponentsChipGroup,
  Code as ComponentsCode,
  ComboBox as ComponentsComboBox,
  Container as ComponentsContainer,
  CopyField as ComponentsCopyField,
  Currency as ComponentsCurrency,
  DateField as ComponentsDateField,
  DatePicker as ComponentsDatePicker,
  Dialog as ComponentsDialog,
  Disclosure as ComponentsDisclosure,
  DisclosureGroup as ComponentsDisclosureGroup,
  Feed as ComponentsFeed,
  Form as ComponentsForm,
  IconButton as ComponentsIconButton,
  Keycap as ComponentsKeycap,
  Link as ComponentsLink,
  List as ComponentsList,
  ListBox as ComponentsListBox,
  ListDetail as ComponentsListDetail,
  ListItem as ComponentsListItem,
  Menu as ComponentsMenu,
  Meter as ComponentsMeter,
  NumberField as ComponentsNumberField,
  Popover as ComponentsPopover,
  ProductIcon as ComponentsProductIcon,
  ProgressIndicator as ComponentsProgressIndicator,
  Radio as ComponentsRadio,
  RadioGroup as ComponentsRadioGroup,
  RangeCalendar as ComponentsRangeCalendar,
  SearchField as ComponentsSearchField,
  SegmentedButton as ComponentsSegmentedButton,
  Select as ComponentsSelect,
  Separator as ComponentsSeparator,
  Sheet as ComponentsSheet,
  Slider as ComponentsSlider,
  Snackbar as ComponentsSnackbar,
  Stack as ComponentsStack,
  SupportingPane as ComponentsSupportingPane,
  Switch as ComponentsSwitch,
  Tabs as ComponentsTabs,
  Tag as ComponentsTag,
  Text as ComponentsText,
  TextArea as ComponentsTextArea,
  TextField as ComponentsTextField,
  TimeField as ComponentsTimeField,
  TokenField as ComponentsTokenField,
  Toolbar as ComponentsToolbar,
  Tooltip as ComponentsTooltip,
} from './components'

describe('package entry point', () => {
  // Deliberately exact rather than a `toContain`, so an internal helper
  // leaking into the published surface fails here instead of shipping.
  it('exposes exactly the documented public API', () => {
    expect(Object.keys(publicApi)).toEqual([
      'AppBar',
      'Autocomplete',
      'Avatar',
      'Breadcrumbs',
      'Button',
      'Calendar',
      'Card',
      'Checkbox',
      'CheckboxGroup',
      'Chip',
      'ChipGroup',
      'Code',
      'Collection',
      'ComboBox',
      'Container',
      'CopyField',
      'Currency',
      'DIRECTORY_DRAG_TYPE',
      'DateField',
      'DatePicker',
      'Dialog',
      'Disclosure',
      'DisclosureGroup',
      'DropZone',
      'Feed',
      'FileTrigger',
      'Focusable',
      'Form',
      'GridLayout',
      'I18nProvider',
      'IconButton',
      'Keycap',
      'Link',
      'List',
      'ListBox',
      'ListDetail',
      'ListItem',
      'ListLayout',
      'Menu',
      'Meter',
      'NavigationTree',
      'NumberField',
      'Popover',
      'Pressable',
      'ProductIcon',
      'ProgressIndicator',
      'Radio',
      'RadioGroup',
      'RangeCalendar',
      'RouterProvider',
      'SearchField',
      'SegmentedButton',
      'Select',
      'Separator',
      'Sheet',
      'Slider',
      'Snackbar',
      'Stack',
      'SupportingPane',
      'Switch',
      'Table',
      'TableLayout',
      'Tabs',
      'Tag',
      'Text',
      'TextArea',
      'TextField',
      'TimeField',
      'TokenField',
      'TokenFieldValue',
      'Toolbar',
      'Tooltip',
      'Tree',
      'Virtualizer',
      'VisuallyHidden',
      'WaterfallLayout',
      'collectionSizes',
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

  it('forwards Breadcrumbs as the same reference as the components barrel', () => {
    expect(publicApi.Breadcrumbs).toBe(ComponentsBreadcrumbs)
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

  it('forwards Disclosure as the same reference as the components barrel', () => {
    expect(publicApi.Disclosure).toBe(ComponentsDisclosure)
  })

  it('forwards DisclosureGroup as the same reference as the components barrel', () => {
    expect(publicApi.DisclosureGroup).toBe(ComponentsDisclosureGroup)
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

  it('forwards SegmentedButton as the same reference as the components barrel', () => {
    expect(publicApi.SegmentedButton).toBe(ComponentsSegmentedButton)
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

  it('forwards Toolbar as the same reference as the components barrel', () => {
    expect(publicApi.Toolbar).toBe(ComponentsToolbar)
  })

  it('forwards Tooltip as the same reference as the components barrel', () => {
    expect(publicApi.Tooltip).toBe(ComponentsTooltip)
  })

  it('forwards ProgressIndicator as the same reference as the components barrel', () => {
    expect(publicApi.ProgressIndicator).toBe(ComponentsProgressIndicator)
  })

  it('forwards Meter as the same reference as the components barrel', () => {
    expect(publicApi.Meter).toBe(ComponentsMeter)
  })

  it('forwards Snackbar as the same reference as the components barrel', () => {
    expect(publicApi.Snackbar).toBe(ComponentsSnackbar)
  })

  it('forwards ListBox as the same reference as the components barrel', () => {
    expect(publicApi.ListBox).toBe(ComponentsListBox)
  })

  it('forwards Menu as the same reference as the components barrel', () => {
    expect(publicApi.Menu).toBe(ComponentsMenu)
  })

  it('forwards Select as the same reference as the components barrel', () => {
    expect(publicApi.Select).toBe(ComponentsSelect)
  })

  it('forwards ComboBox as the same reference as the components barrel', () => {
    expect(publicApi.ComboBox).toBe(ComponentsComboBox)
  })

  it('forwards Autocomplete as the same reference as the components barrel', () => {
    expect(publicApi.Autocomplete).toBe(ComponentsAutocomplete)
  })

  it('forwards ChipGroup as the same reference as the components barrel', () => {
    expect(publicApi.ChipGroup).toBe(ComponentsChipGroup)
  })

  it('forwards TokenField as the same reference as the components barrel', () => {
    expect(publicApi.TokenField).toBe(ComponentsTokenField)
  })

  it('forwards List as the same reference as the components barrel', () => {
    expect(publicApi.List).toBe(ComponentsList)
  })

  it('forwards Calendar as the same reference as the components barrel', () => {
    expect(publicApi.Calendar).toBe(ComponentsCalendar)
  })

  it('forwards RangeCalendar as the same reference as the components barrel', () => {
    expect(publicApi.RangeCalendar).toBe(ComponentsRangeCalendar)
  })

  it('forwards DateField as the same reference as the components barrel', () => {
    expect(publicApi.DateField).toBe(ComponentsDateField)
  })

  it('forwards TimeField as the same reference as the components barrel', () => {
    expect(publicApi.TimeField).toBe(ComponentsTimeField)
  })

  it('forwards DatePicker as the same reference as the components barrel', () => {
    expect(publicApi.DatePicker).toBe(ComponentsDatePicker)
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
    useDrop: [publicApi.useDrop, reactAria.useDrop],
    useFilter: [publicApi.useFilter, reactAria.useFilter],
    useListData: [publicApi.useListData, reactAria.useListData],
    useLocale: [publicApi.useLocale, reactAria.useLocale],
    useTreeData: [publicApi.useTreeData, reactAria.useTreeData],
    Virtualizer: [publicApi.Virtualizer, reactAria.Virtualizer],
    VisuallyHidden: [publicApi.VisuallyHidden, reactAria.VisuallyHidden],
    WaterfallLayout: [publicApi.WaterfallLayout, reactAria.WaterfallLayout],
  }

  // `useDragAndDrop` is deliberately not in that list. It is the one name the
  // package does not forward: its own version wraps React Aria's to default
  // the drop indicator and the drag preview to the styled ones, so asserting
  // reference equality would pin the opposite of what it is for.
  it('wraps useDragAndDrop rather than forwarding it', () => {
    expect(publicApi.useDragAndDrop).not.toBe(reactAria.useDragAndDrop)
    expect(typeof publicApi.useDragAndDrop).toBe('function')
  })

  it.each(Object.entries(REACT_ARIA_UTILITIES))(
    'forwards %s as the same reference as react-aria-components',
    (_name, [ours, theirs]) => {
      expect(ours).toBe(theirs)
    },
  )
})
