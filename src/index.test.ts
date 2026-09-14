import * as reactAria from 'react-aria-components'
import { describe, expect, it } from 'vitest'

import * as publicApi from '.'
import packageJson from '../package.json'
import * as componentsBarrel from './components'
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
  ColorArea as ComponentsColorArea,
  ColorField as ComponentsColorField,
  ColorPicker as ComponentsColorPicker,
  ColorSlider as ComponentsColorSlider,
  ColorSwatch as ComponentsColorSwatch,
  ColorSwatchPicker as ComponentsColorSwatchPicker,
  ColorWheel as ComponentsColorWheel,
  ComboBox as ComponentsComboBox,
  Container as ComponentsContainer,
  CopyField as ComponentsCopyField,
  Currency as ComponentsCurrency,
  DateField as ComponentsDateField,
  DatePicker as ComponentsDatePicker,
  DateRangePicker as ComponentsDateRangePicker,
  Dialog as ComponentsDialog,
  Disclosure as ComponentsDisclosure,
  DisclosureGroup as ComponentsDisclosureGroup,
  DropZone as ComponentsDropZone,
  Feed as ComponentsFeed,
  FileTrigger as ComponentsFileTrigger,
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
  NavigationTree as ComponentsNavigationTree,
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
  Table as ComponentsTable,
  Tabs as ComponentsTabs,
  Tag as ComponentsTag,
  Text as ComponentsText,
  TextArea as ComponentsTextArea,
  TextField as ComponentsTextField,
  TimeField as ComponentsTimeField,
  TokenField as ComponentsTokenField,
  Toolbar as ComponentsToolbar,
  Tooltip as ComponentsTooltip,
  Tree as ComponentsTree,
} from './components'
import * as reactAriaModule from './react-aria'

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
      'ColorArea',
      'ColorField',
      'ColorPicker',
      'ColorSlider',
      'ColorSwatch',
      'ColorSwatchPicker',
      'ColorWheel',
      'ComboBox',
      'Container',
      'CopyField',
      'Currency',
      'DIRECTORY_DRAG_TYPE',
      'DateField',
      'DatePicker',
      'DateRangePicker',
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
      'SharedElement',
      'SharedElementTransition',
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

  // Every component the entry point forwards is the components barrel's own
  // object rather than a re-wrapped one. Written as static property reads, so
  // a name missing from either side fails to compile rather than comparing
  // two undefineds, and kept as one map rather than seventy near-identical
  // cases — which is how five of them came to be missing at once.
  const COMPONENT_FORWARDS = {
    AppBar: [publicApi.AppBar, ComponentsAppBar],
    Autocomplete: [publicApi.Autocomplete, ComponentsAutocomplete],
    Avatar: [publicApi.Avatar, ComponentsAvatar],
    Breadcrumbs: [publicApi.Breadcrumbs, ComponentsBreadcrumbs],
    Button: [publicApi.Button, ComponentsButton],
    Calendar: [publicApi.Calendar, ComponentsCalendar],
    Card: [publicApi.Card, ComponentsCard],
    Checkbox: [publicApi.Checkbox, ComponentsCheckbox],
    CheckboxGroup: [publicApi.CheckboxGroup, ComponentsCheckboxGroup],
    Chip: [publicApi.Chip, ComponentsChip],
    ChipGroup: [publicApi.ChipGroup, ComponentsChipGroup],
    Code: [publicApi.Code, ComponentsCode],
    ColorArea: [publicApi.ColorArea, ComponentsColorArea],
    ColorField: [publicApi.ColorField, ComponentsColorField],
    ColorPicker: [publicApi.ColorPicker, ComponentsColorPicker],
    ColorSlider: [publicApi.ColorSlider, ComponentsColorSlider],
    ColorSwatch: [publicApi.ColorSwatch, ComponentsColorSwatch],
    ColorSwatchPicker: [
      publicApi.ColorSwatchPicker,
      ComponentsColorSwatchPicker,
    ],
    ColorWheel: [publicApi.ColorWheel, ComponentsColorWheel],
    ComboBox: [publicApi.ComboBox, ComponentsComboBox],
    Container: [publicApi.Container, ComponentsContainer],
    CopyField: [publicApi.CopyField, ComponentsCopyField],
    Currency: [publicApi.Currency, ComponentsCurrency],
    DateField: [publicApi.DateField, ComponentsDateField],
    DatePicker: [publicApi.DatePicker, ComponentsDatePicker],
    DateRangePicker: [publicApi.DateRangePicker, ComponentsDateRangePicker],
    Dialog: [publicApi.Dialog, ComponentsDialog],
    Disclosure: [publicApi.Disclosure, ComponentsDisclosure],
    DisclosureGroup: [publicApi.DisclosureGroup, ComponentsDisclosureGroup],
    DropZone: [publicApi.DropZone, ComponentsDropZone],
    Feed: [publicApi.Feed, ComponentsFeed],
    FileTrigger: [publicApi.FileTrigger, ComponentsFileTrigger],
    Form: [publicApi.Form, ComponentsForm],
    IconButton: [publicApi.IconButton, ComponentsIconButton],
    Keycap: [publicApi.Keycap, ComponentsKeycap],
    Link: [publicApi.Link, ComponentsLink],
    List: [publicApi.List, ComponentsList],
    ListBox: [publicApi.ListBox, ComponentsListBox],
    ListDetail: [publicApi.ListDetail, ComponentsListDetail],
    ListItem: [publicApi.ListItem, ComponentsListItem],
    Menu: [publicApi.Menu, ComponentsMenu],
    Meter: [publicApi.Meter, ComponentsMeter],
    NavigationTree: [publicApi.NavigationTree, ComponentsNavigationTree],
    NumberField: [publicApi.NumberField, ComponentsNumberField],
    Popover: [publicApi.Popover, ComponentsPopover],
    ProductIcon: [publicApi.ProductIcon, ComponentsProductIcon],
    ProgressIndicator: [
      publicApi.ProgressIndicator,
      ComponentsProgressIndicator,
    ],
    Radio: [publicApi.Radio, ComponentsRadio],
    RadioGroup: [publicApi.RadioGroup, ComponentsRadioGroup],
    RangeCalendar: [publicApi.RangeCalendar, ComponentsRangeCalendar],
    SearchField: [publicApi.SearchField, ComponentsSearchField],
    SegmentedButton: [publicApi.SegmentedButton, ComponentsSegmentedButton],
    Select: [publicApi.Select, ComponentsSelect],
    Separator: [publicApi.Separator, ComponentsSeparator],
    Sheet: [publicApi.Sheet, ComponentsSheet],
    Slider: [publicApi.Slider, ComponentsSlider],
    Snackbar: [publicApi.Snackbar, ComponentsSnackbar],
    Stack: [publicApi.Stack, ComponentsStack],
    SupportingPane: [publicApi.SupportingPane, ComponentsSupportingPane],
    Switch: [publicApi.Switch, ComponentsSwitch],
    Table: [publicApi.Table, ComponentsTable],
    Tabs: [publicApi.Tabs, ComponentsTabs],
    Tag: [publicApi.Tag, ComponentsTag],
    Text: [publicApi.Text, ComponentsText],
    TextArea: [publicApi.TextArea, ComponentsTextArea],
    TextField: [publicApi.TextField, ComponentsTextField],
    TimeField: [publicApi.TimeField, ComponentsTimeField],
    TokenField: [publicApi.TokenField, ComponentsTokenField],
    Toolbar: [publicApi.Toolbar, ComponentsToolbar],
    Tooltip: [publicApi.Tooltip, ComponentsTooltip],
    Tree: [publicApi.Tree, ComponentsTree],
  }

  // The map has to cover the same surface the exact-name case pins, or it
  // drifts the way it already had. Reading the barrel at runtime is what
  // makes adding a component to it and not to this list fail.
  it('forwards every component the components barrel exports', () => {
    const mapped = new Set(Object.keys(COMPONENT_FORWARDS))
    const exported = Object.keys(componentsBarrel)

    expect(exported.filter((name) => !mapped.has(name))).toEqual([])
    expect(mapped.size).toBe(exported.length)
  })

  it.each(Object.entries(COMPONENT_FORWARDS))(
    'forwards %s as the same reference as the components barrel',
    (_name, [fromEntry, fromBarrel]) => {
      expect(fromEntry).toBe(fromBarrel)
    },
  )

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
    SharedElement: [publicApi.SharedElement, reactAria.SharedElement],
    SharedElementTransition: [
      publicApi.SharedElementTransition,
      reactAria.SharedElementTransition,
    ],
    TableLayout: [publicApi.TableLayout, reactAria.TableLayout],
    TokenFieldValue: [publicApi.TokenFieldValue, reactAria.TokenFieldValue],
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

  // The same completeness check the forwards get, and the same reason: this
  // map lost three names as they were added to src/react-aria.ts, while the
  // exact-name case above kept passing because it pins the surface rather
  // than where each name comes from.
  //
  // useDragAndDrop is the single exemption, and the one the comment above
  // already names: the package wraps React Aria's to default the drop
  // indicator and the drag preview, so it is deliberately not the same
  // reference.
  it('maps every utility it re-exports', () => {
    const mapped = new Set([
      ...Object.keys(REACT_ARIA_UTILITIES),
      'useDragAndDrop',
    ])
    const exported = Object.keys(reactAriaModule)

    // Named rather than compared as two lists, so the failure says which
    // utility went unmapped instead of eliding both to a count. The size
    // after it is what catches a name mapped but no longer re-exported.
    expect(exported.filter((name) => !mapped.has(name))).toEqual([])
    expect(mapped.size).toBe(exported.length)
  })

  it.each(Object.entries(REACT_ARIA_UTILITIES))(
    'forwards %s as the same reference as react-aria-components',
    (_name, [ours, theirs]) => {
      expect(ours).toBe(theirs)
    },
  )
})

// The ./date subpath has its own copy of this in src/date.test.ts. The main
// entry had none, which left the condition every consumer resolves through
// the one part of the exports map nothing pinned.
describe('the main entry', () => {
  it('is published with the shape the exports map promises', () => {
    expect(packageJson.exports['.']).toEqual({
      default: './dist/index.js',
      types: './dist/index.d.ts',
    })
  })

  it('resolves under require() too, which is what `default` buys', () => {
    // Under `import` alone the same call fails with
    // ERR_PACKAGE_PATH_NOT_EXPORTED and every CommonJS consumer is dropped,
    // while the package still builds and publint still reports no problem.
    // The suite runs in a browser and cannot call `require`, so what is
    // pinned here is the condition that decides it; scripts/check-package.mjs
    // resolves it for real against the built package.
    const entry = packageJson.exports['.']

    expect(Object.keys(entry)).not.toContain('import')
    expect(Object.keys(entry)).not.toContain('require')
    expect(entry).toHaveProperty('default')
  })

  it('publishes the compiled stylesheet a consumer has to reach', () => {
    // src/index.ts imports it for its side effect, and this is the entry that
    // makes the specifier resolve in the published package.
    expect(packageJson.exports['./styles.css']).toBe('./dist/styles.css')
  })
})
