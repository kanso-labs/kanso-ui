import { describe, expect, it } from 'vitest'

// Taken from the barrel rather than from each component's own module, which is
// what makes these cases pin the re-export: a type imported from its own module
// still resolves when the barrel has dropped the name, so the same case written
// against './button' passes whether or not the barrel still exports it.
import type {
  AppBarProps,
  AutocompleteFilter,
  AutocompleteProps,
  AvatarProps,
  BreadcrumbsItemProps,
  BreadcrumbsProps,
  ButtonProps,
  ButtonSize,
  ButtonVariant,
  CalendarProps,
  CardProps,
  CheckboxGroupProps,
  CheckboxProps,
  ChipGroupChipProps,
  ChipGroupProps,
  ChipProps,
  CodeProps,
  ColorAreaProps,
  ColorFieldProps,
  ColorPickerProps,
  ColorSliderProps,
  ColorSwatchPickerItemProps,
  ColorSwatchPickerProps,
  ColorSwatchProps,
  ColorWheelProps,
  ComboBoxProps,
  ComboBoxSelectionMode,
  ContainerProps,
  CopyFieldProps,
  CurrencyProps,
  DateFieldProps,
  DatePickerProps,
  DateRangePickerProps,
  DialogContentProps,
  DialogProps,
  DialogTitleProps,
  DisclosureGroupProps,
  DisclosureHeaderProps,
  DisclosurePanelProps,
  DisclosureProps,
  FeedProps,
  FieldVariant,
  FormProps,
  IconButtonProps,
  IconButtonSize,
  IconButtonVariant,
  KeycapProps,
  LinkProps,
  LinkTone,
  LinkUnderline,
  ListBoxItemProps,
  ListBoxLoadMoreProps,
  ListBoxProps,
  ListBoxSectionProps,
  ListDetailProps,
  ListItemProps,
  ListLoadMoreProps,
  ListProps,
  ListRowProps,
  ListSectionProps,
  MenuAlign,
  MenuContentProps,
  MenuItemProps,
  MenuLoadMoreProps,
  MenuProps,
  MenuSectionProps,
  MenuSeparatorProps,
  MenuSide,
  MenuSubmenuProps,
  MeterProps,
  MeterTone,
  NavigationTreeProps,
  NumberFieldProps,
  PopoverAlign,
  PopoverContentProps,
  PopoverDescriptionProps,
  PopoverProps,
  PopoverSide,
  PopoverSize,
  PopoverTitleProps,
  PopoverTrigger,
  ProductIconProps,
  ProgressIndicatorProps,
  ProgressIndicatorTone,
  ProgressIndicatorVariant,
  RadioGroupProps,
  RadioProps,
  RangeCalendarProps,
  SearchFieldProps,
  SegmentedButtonProps,
  SelectProps,
  SeparatorInset,
  SeparatorProps,
  SheetContentProps,
  SheetProps,
  SheetTitleProps,
  SliderProps,
  SnackbarAction,
  SnackbarMessage,
  SnackbarOptions,
  SnackbarProps,
  SnackbarQueue,
  SnackbarRegionRenderProps,
  StackProps,
  SupportingPaneProps,
  SwitchProps,
  TableLoadMoreProps,
  TabsListProps,
  TabsPanelProps,
  TabsPanelsProps,
  TabsProps,
  TabsTabProps,
  TagProps,
  TextAreaProps,
  TextFieldProps,
  TextProps,
  TimeFieldProps,
  TokenFieldProps,
  TokenSegment,
  ToolbarProps,
  ToolbarTone,
  TooltipAlign,
  TooltipProps,
  TooltipSide,
  TreeProps,
} from '.'

import * as components from '.'
import { CalendarDate, Time } from '../date'
import AppBarDefault from './app-bar'
import AutocompleteDefault from './autocomplete'
import AvatarDefault from './avatar'
import BreadcrumbsDefault from './breadcrumbs'
import ButtonDefault from './button'
import CalendarDefault from './calendar'
import CardDefault from './card'
import CheckboxDefault from './checkbox'
import CheckboxGroupDefault from './checkbox-group'
import ChipDefault from './chip'
import ChipGroupDefault from './chip-group'
import CodeDefault from './code'
import ColorAreaDefault from './color-area'
import ColorFieldDefault from './color-field'
import ColorPickerDefault from './color-picker'
import ColorSliderDefault from './color-slider'
import ColorSwatchDefault from './color-swatch'
import ColorSwatchPickerDefault from './color-swatch-picker'
import ColorWheelDefault from './color-wheel'
import ComboBoxDefault from './combo-box'
import ContainerDefault from './container'
import CopyFieldDefault from './copy-field'
import CurrencyDefault from './currency'
import DateFieldDefault from './date-field'
import DatePickerDefault from './date-picker'
import DateRangePickerDefault from './date-range-picker'
import DialogDefault from './dialog'
import DisclosureDefault from './disclosure'
import DisclosureGroupDefault from './disclosure-group'
import DropZoneDefault, { FileTrigger as FileTriggerNamed } from './drop-zone'
import FeedDefault from './feed'
import FormDefault from './form'
import IconButtonDefault from './icon-button'
import KeycapDefault from './keycap'
import LinkDefault from './link'
import ListDefault from './list'
import ListBoxDefault from './list-box'
import ListDetailDefault from './list-detail'
import ListItemDefault from './list-item'
import MenuDefault from './menu'
import MeterDefault from './meter'
import NavigationTreeDefault from './navigation-tree'
import NumberFieldDefault from './number-field'
import PopoverDefault from './popover'
import ProductIconDefault from './product-icon'
import ProgressIndicatorDefault from './progress-indicator'
import RadioGroupDefault, { Radio } from './radio-group'
import RangeCalendarDefault from './range-calendar'
import SearchFieldDefault from './search-field'
import SegmentedButtonDefault from './segmented-button'
import SelectDefault from './select'
import SeparatorDefault from './separator'
import SheetDefault from './sheet'
import SliderDefault from './slider'
import SnackbarDefault from './snackbar'
import StackDefault from './stack'
import SupportingPaneDefault from './supporting-pane'
import SwitchDefault from './switch'
import TableDefault from './table'
import TabsDefault from './tabs'
import TagDefault from './tag'
import TextDefault from './text'
import TextAreaDefault from './text-area'
import TextFieldDefault from './text-field'
import TimeFieldDefault from './time-field'
import TokenFieldDefault from './token-field'
import ToolbarDefault from './toolbar'
import TooltipDefault from './tooltip'
import TreeDefault from './tree'

// Hoisted rather than written inside its case: a function declared in a test
// that captures nothing is what `consistent-function-scoping` is after.
const AUTOCOMPLETE_FILTER: AutocompleteFilter = (textValue, inputValue) =>
  textValue.includes(inputValue)

// Read as source rather than as modules, because a type export leaves nothing
// behind at runtime: `Object.keys` over the barrel sees the components and
// none of their types. Both guards above run over names the barrel already
// lists, so they catch a type that stops resolving and never one a module
// exports that the barrel never picked up — which is how every name #827
// added came to be missing in the first place.
const MODULE_SOURCES = import.meta.glob('./*/index.tsx', {
  eager: true,
  import: 'default',
  query: '?raw',
})

const BARREL_SOURCE = Object.values(
  import.meta.glob('./index.ts', {
    eager: true,
    import: 'default',
    query: '?raw',
  }),
)[0]

/** Every name inside an `export type { … }` block of `source`. */
function typeExportsIn(source: string) {
  const names = new Set<string>()

  for (const [, block] of source.matchAll(/export type \{([^}]*)\}/g)) {
    for (const entry of block.split(/[,\n]/)) {
      const name = entry.trim().split(' as ').at(-1)?.trim()

      if (name !== undefined && name !== '') {
        names.add(name)
      }
    }
  }

  return names
}

// What a module keeps to itself on purpose. Each of these is the type of
// nothing public: the two DOM props are an `Omit<…> & Pick<…>` that exists
// only to build ButtonProps and LinkProps, and the two states are the
// parameter a `className` function is handed rather than the value of a prop
// — `Tree`, whose whole set is exported, has no equivalent of either.
//
// The list is load-bearing rather than an escape hatch. A name added here
// without a reason beside it turns the case below into a snapshot of
// whatever the barrel happens to export today.
const KEPT_INTERNAL = new Set([
  'ButtonDOMProps',
  'ButtonState',
  'IconButtonState',
  'LinkDOMProps',
])

describe('components barrel', () => {
  it('exposes exactly the documented public components', () => {
    expect(Object.keys(components)).toEqual([
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
      'DateField',
      'DatePicker',
      'DateRangePicker',
      'Dialog',
      'Disclosure',
      'DisclosureGroup',
      'DropZone',
      'Feed',
      'FileTrigger',
      'Form',
      'IconButton',
      'Keycap',
      'Link',
      'List',
      'ListBox',
      'ListDetail',
      'ListItem',
      'Menu',
      'Meter',
      'NavigationTree',
      'NumberField',
      'Popover',
      'ProductIcon',
      'ProgressIndicator',
      'Radio',
      'RadioGroup',
      'RangeCalendar',
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
      'Tabs',
      'Tag',
      'Text',
      'TextArea',
      'TextField',
      'TimeField',
      'TokenField',
      'Toolbar',
      'Tooltip',
      'Tree',
    ])
  })

  // Every name the barrel exports is its own module's object rather than a
  // re-wrapped one, so a barrel entry pointed at the wrong module fails here.
  // Written as static property reads, so a name missing from either side
  // fails to compile, and kept as one map rather than seventy near-identical
  // cases — which is how five of them came to be missing at once.
  //
  // FileTrigger is the one that is not a module's default: drop-zone exports
  // it alongside one, which is why it is aliased rather than suffixed.
  const OWN_MODULE = {
    AppBar: [components.AppBar, AppBarDefault],
    Autocomplete: [components.Autocomplete, AutocompleteDefault],
    Avatar: [components.Avatar, AvatarDefault],
    Breadcrumbs: [components.Breadcrumbs, BreadcrumbsDefault],
    Button: [components.Button, ButtonDefault],
    Calendar: [components.Calendar, CalendarDefault],
    Card: [components.Card, CardDefault],
    Checkbox: [components.Checkbox, CheckboxDefault],
    CheckboxGroup: [components.CheckboxGroup, CheckboxGroupDefault],
    Chip: [components.Chip, ChipDefault],
    ChipGroup: [components.ChipGroup, ChipGroupDefault],
    Code: [components.Code, CodeDefault],
    ColorArea: [components.ColorArea, ColorAreaDefault],
    ColorField: [components.ColorField, ColorFieldDefault],
    ColorPicker: [components.ColorPicker, ColorPickerDefault],
    ColorSlider: [components.ColorSlider, ColorSliderDefault],
    ColorSwatch: [components.ColorSwatch, ColorSwatchDefault],
    ColorSwatchPicker: [components.ColorSwatchPicker, ColorSwatchPickerDefault],
    ColorWheel: [components.ColorWheel, ColorWheelDefault],
    ComboBox: [components.ComboBox, ComboBoxDefault],
    Container: [components.Container, ContainerDefault],
    CopyField: [components.CopyField, CopyFieldDefault],
    Currency: [components.Currency, CurrencyDefault],
    DateField: [components.DateField, DateFieldDefault],
    DatePicker: [components.DatePicker, DatePickerDefault],
    DateRangePicker: [components.DateRangePicker, DateRangePickerDefault],
    Dialog: [components.Dialog, DialogDefault],
    Disclosure: [components.Disclosure, DisclosureDefault],
    DisclosureGroup: [components.DisclosureGroup, DisclosureGroupDefault],
    DropZone: [components.DropZone, DropZoneDefault],
    Feed: [components.Feed, FeedDefault],
    FileTrigger: [components.FileTrigger, FileTriggerNamed],
    Form: [components.Form, FormDefault],
    IconButton: [components.IconButton, IconButtonDefault],
    Keycap: [components.Keycap, KeycapDefault],
    Link: [components.Link, LinkDefault],
    List: [components.List, ListDefault],
    ListBox: [components.ListBox, ListBoxDefault],
    ListDetail: [components.ListDetail, ListDetailDefault],
    ListItem: [components.ListItem, ListItemDefault],
    Menu: [components.Menu, MenuDefault],
    Meter: [components.Meter, MeterDefault],
    NavigationTree: [components.NavigationTree, NavigationTreeDefault],
    NumberField: [components.NumberField, NumberFieldDefault],
    Popover: [components.Popover, PopoverDefault],
    ProductIcon: [components.ProductIcon, ProductIconDefault],
    ProgressIndicator: [components.ProgressIndicator, ProgressIndicatorDefault],
    Radio: [components.Radio, Radio],
    RadioGroup: [components.RadioGroup, RadioGroupDefault],
    RangeCalendar: [components.RangeCalendar, RangeCalendarDefault],
    SearchField: [components.SearchField, SearchFieldDefault],
    SegmentedButton: [components.SegmentedButton, SegmentedButtonDefault],
    Select: [components.Select, SelectDefault],
    Separator: [components.Separator, SeparatorDefault],
    Sheet: [components.Sheet, SheetDefault],
    Slider: [components.Slider, SliderDefault],
    Snackbar: [components.Snackbar, SnackbarDefault],
    Stack: [components.Stack, StackDefault],
    SupportingPane: [components.SupportingPane, SupportingPaneDefault],
    Switch: [components.Switch, SwitchDefault],
    Table: [components.Table, TableDefault],
    Tabs: [components.Tabs, TabsDefault],
    Tag: [components.Tag, TagDefault],
    Text: [components.Text, TextDefault],
    TextArea: [components.TextArea, TextAreaDefault],
    TextField: [components.TextField, TextFieldDefault],
    TimeField: [components.TimeField, TimeFieldDefault],
    TokenField: [components.TokenField, TokenFieldDefault],
    Toolbar: [components.Toolbar, ToolbarDefault],
    Tooltip: [components.Tooltip, TooltipDefault],
    Tree: [components.Tree, TreeDefault],
  }

  // The map has to cover the same surface the exact-name case pins, or it
  // drifts the way it already had. Reading the barrel at runtime is what
  // makes adding an export and not a case here fail.
  // The other half of the two guards above: they read the barrel, this reads
  // the modules. A type exported by a component and absent from the barrel
  // fails here by name, which is what the suite could not say before.
  it('re-exports every type its modules export', () => {
    const exported = typeExportsIn(BARREL_SOURCE)
    const missing = Object.entries(MODULE_SOURCES)
      .flatMap(([path, source]) =>
        [...typeExportsIn(source)].map((name) => [path, name] as const),
      )
      .filter(([, name]) => !exported.has(name) && !KEPT_INTERNAL.has(name))
      .map(([path, name]) => `${name} (${path})`)

    expect(missing).toEqual([])
  })

  it('reads some module sources to check', () => {
    // A glob that matched nothing would make the case above pass over an
    // empty list.
    expect(Object.keys(MODULE_SOURCES).length).toBeGreaterThan(0)
    expect(typeExportsIn(BARREL_SOURCE).size).toBeGreaterThan(0)
  })

  it('re-exports every name it exports from its own module', () => {
    const mapped = new Set(Object.keys(OWN_MODULE))
    const exported = Object.keys(components)

    expect(exported.filter((name) => !mapped.has(name))).toEqual([])
    expect(mapped.size).toBe(exported.length)
  })

  it.each(Object.entries(OWN_MODULE))(
    're-exports %s as the same reference as its own module',
    (_name, [fromBarrel, fromModule]) => {
      expect(fromBarrel).toBe(fromModule)
    },
  )

  it('re-exports the AppBarProps type', () => {
    const props: AppBarProps = { size: 'large' }
    expect(props.size).toBe('large')
  })

  it('re-exports the AvatarProps type', () => {
    const props: AvatarProps = { name: 'Ada Lovelace' }
    expect(props.name).toBe('Ada Lovelace')
  })

  it('re-exports the TagProps type', () => {
    const props: TagProps = { tone: 'positive' }
    expect(props.tone).toBe('positive')
  })

  it('re-exports the BreadcrumbsProps type', () => {
    const props: BreadcrumbsProps = { 'aria-label': 'Label' }
    expect(props['aria-label']).toBe('Label')
  })

  it('re-exports the ButtonProps type', () => {
    const props: ButtonProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the CardProps type', () => {
    const props: CardProps = { variant: 'outlined' }
    expect(props.variant).toBe('outlined')
  })

  it('re-exports the ChipProps type', () => {
    const props: ChipProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the CodeProps type', () => {
    const props: CodeProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the ContainerProps type', () => {
    const props: ContainerProps = { maxInlineSize: '58ch' }
    expect(props.maxInlineSize).toBe('58ch')
  })

  it('re-exports the CopyFieldProps type', () => {
    const props: CopyFieldProps = { value: 'first.second.third' }
    expect(props.value).toBe('first.second.third')
  })

  it('re-exports the CurrencyProps type', () => {
    const props: CurrencyProps = { value: 12.5 }
    expect(props.value).toBe(12.5)
  })

  it('re-exports the DisclosureProps type', () => {
    const props: DisclosureProps = { defaultExpanded: true }
    expect(props.defaultExpanded).toBe(true)
  })

  it('re-exports the DisclosureGroupProps type', () => {
    const props: DisclosureGroupProps = { allowsMultipleExpanded: true }
    expect(props.allowsMultipleExpanded).toBe(true)
  })

  it('re-exports the FeedProps type', () => {
    const props: FeedProps = { minItemWidth: '272px' }
    expect(props.minItemWidth).toBe('272px')
  })

  it('re-exports the IconButtonProps type', () => {
    const props: IconButtonProps = { 'aria-label': 'Add' }
    expect(props['aria-label']).toBe('Add')
  })

  it('re-exports the KeycapProps type', () => {
    const props: KeycapProps = { children: 'Enter' }
    expect(props.children).toBe('Enter')
  })

  it('re-exports the LinkProps type', () => {
    const props: LinkProps = { tone: 'inherit' }
    expect(props.tone).toBe('inherit')
  })

  it('re-exports the ListDetailProps type', () => {
    const props: ListDetailProps = { showing: 'detail' }
    expect(props.showing).toBe('detail')
  })

  it('re-exports the ListItemProps type', () => {
    const props: ListItemProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  // `List.Item`'s own, which is a different type from the standalone row's
  // above: `textValue` belongs to this one and compiles against neither the
  // other nor the name a call site reaches for first.
  it('re-exports the ListRowProps type', () => {
    const props: ListRowProps = { children: 'test', textValue: 'test' }
    expect(props.textValue).toBe('test')
  })

  it('re-exports the ListSectionProps type', () => {
    const props: ListSectionProps = { header: 'test' }
    expect(props.header).toBe('test')
  })

  it('re-exports the ListLoadMoreProps type', () => {
    const props: ListLoadMoreProps = { label: 'test' }
    expect(props.label).toBe('test')
  })

  it('re-exports the PopoverProps type', () => {
    const props: PopoverProps = { size: 'sm' }
    expect(props.size).toBe('sm')
  })

  it('re-exports the ProductIconProps type', () => {
    const props: ProductIconProps = { name: 'First item' }
    expect(props.name).toBe('First item')
  })

  it('re-exports the SeparatorProps type', () => {
    const props: SeparatorProps = { orientation: 'vertical' }
    expect(props.orientation).toBe('vertical')
  })

  it('re-exports the SheetProps type', () => {
    const props: SheetProps = { defaultOpen: true }
    expect(props.defaultOpen).toBe(true)
  })

  it('re-exports the StackProps type', () => {
    const props: StackProps = { gap: 'lg' }
    expect(props.gap).toBe('lg')
  })

  it('re-exports the SupportingPaneProps type', () => {
    const props: SupportingPaneProps = { main: 'Headline' }
    expect(props.main).toBe('Headline')
  })

  it('re-exports the TabsProps type', () => {
    const props: TabsProps = { defaultSelectedKey: 'first' }
    expect(props.defaultSelectedKey).toBe('first')
  })

  it('re-exports the TextProps type', () => {
    const props: TextProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the TextFieldProps type', () => {
    const props: TextFieldProps = { label: 'Label' }
    expect(props.label).toBe('Label')
  })

  it('re-exports the CheckboxProps type', () => {
    const props: CheckboxProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the CheckboxGroupProps type', () => {
    const props: CheckboxGroupProps = { label: 'Label' }
    expect(props.label).toBe('Label')
  })

  it('re-exports the RadioGroupProps type', () => {
    const props: RadioGroupProps = { label: 'Label' }
    expect(props.label).toBe('Label')
  })

  it('re-exports the RadioProps type', () => {
    const props: RadioProps = { value: 'first' }
    expect(props.value).toBe('first')
  })

  it('re-exports the SwitchProps type', () => {
    const props: SwitchProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the SliderProps type', () => {
    const props: SliderProps = { defaultValue: 40 }
    expect(props.defaultValue).toBe(40)
  })

  it('re-exports the NumberFieldProps type', () => {
    const props: NumberFieldProps = { label: 'Label' }
    expect(props.label).toBe('Label')
  })

  it('re-exports the SearchFieldProps type', () => {
    const props: SearchFieldProps = { label: 'Label' }
    expect(props.label).toBe('Label')
  })

  it('re-exports the SegmentedButtonProps type', () => {
    const props: SegmentedButtonProps = { 'aria-label': 'Label' }
    expect(props['aria-label']).toBe('Label')
  })

  it('re-exports the TextAreaProps type', () => {
    const props: TextAreaProps = { label: 'Label' }
    expect(props.label).toBe('Label')
  })

  it('re-exports the FormProps type', () => {
    const props: FormProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the DialogProps type', () => {
    const props: DialogProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the ToolbarProps type', () => {
    const props: ToolbarProps = { 'aria-label': 'Label' }
    expect(props['aria-label']).toBe('Label')
  })

  it('re-exports the TooltipProps type', () => {
    const props: TooltipProps = { label: 'Supporting text' }
    expect(props.label).toBe('Supporting text')
  })

  it('re-exports the ProgressIndicatorProps type', () => {
    const props: ProgressIndicatorProps = { label: 'Label' }
    expect(props.label).toBe('Label')
  })

  it('re-exports the MeterProps type', () => {
    const props: MeterProps = { label: 'Label' }
    expect(props.label).toBe('Label')
  })

  it('re-exports the SnackbarProps type', () => {
    const queue = new SnackbarDefault.Queue()
    const props: SnackbarProps = { queue }
    expect(props.queue).toBe(queue)
  })

  it('re-exports the ListBoxProps type', () => {
    const props: ListBoxProps = { 'aria-label': 'Label' }
    expect(props['aria-label']).toBe('Label')
  })

  it('re-exports the MenuProps type', () => {
    const props: MenuProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the SelectProps type', () => {
    const props: SelectProps = { label: 'Label' }
    expect(props.label).toBe('Label')
  })

  it('re-exports the ComboBoxProps type', () => {
    const props: ComboBoxProps = { label: 'Label' }
    expect(props.label).toBe('Label')
  })

  it('re-exports the AutocompleteProps type', () => {
    const props: AutocompleteProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the ChipGroupProps type', () => {
    const props: ChipGroupProps = { label: 'Label' }
    expect(props.label).toBe('Label')
  })

  it('re-exports the TokenFieldProps type', () => {
    const props: TokenFieldProps = { label: 'Label' }
    expect(props.label).toBe('Label')
  })

  // The bare name is the assertion in the four below and the second
  // declaration in the six date and time ones. A generic prop type written
  // without an argument is a compile error unless its parameter has a
  // default, and ten of them had none — see the rule in AGENTS.md, under
  // Conventions. Where the argument would be the default the lint rule
  // forbids writing it, which is why only the date ones carry both forms.
  it('re-exports the TreeProps type', () => {
    const props: TreeProps = { 'aria-label': 'Label' }
    expect(props['aria-label']).toBe('Label')
  })

  it('re-exports the NavigationTreeProps type', () => {
    const props: NavigationTreeProps = { 'aria-label': 'Label' }
    expect(props['aria-label']).toBe('Label')
  })

  it('re-exports the ListProps type', () => {
    const props: ListProps = { 'aria-label': 'Label' }
    expect(props['aria-label']).toBe('Label')
  })

  it('re-exports the CalendarProps type', () => {
    const props: CalendarProps<CalendarDate> = { 'aria-label': 'Label' }
    const bare: CalendarProps = { 'aria-label': 'Label' }
    expect(props['aria-label']).toBe('Label')
    expect(bare).toEqual(props)
  })

  it('re-exports the RangeCalendarProps type', () => {
    const props: RangeCalendarProps<CalendarDate> = { 'aria-label': 'Label' }
    const bare: RangeCalendarProps = { 'aria-label': 'Label' }
    expect(props['aria-label']).toBe('Label')
    expect(bare).toEqual(props)
  })

  it('re-exports the DateFieldProps type', () => {
    const props: DateFieldProps<CalendarDate> = { label: 'Label' }
    const bare: DateFieldProps = { label: 'Label' }
    expect(props.label).toBe('Label')
    expect(bare).toEqual(props)
  })

  it('re-exports the TimeFieldProps type', () => {
    const props: TimeFieldProps<Time> = { label: 'Label' }
    const bare: TimeFieldProps = { label: 'Label' }
    expect(props.label).toBe('Label')
    expect(bare).toEqual(props)
  })

  it('re-exports the DatePickerProps type', () => {
    const props: DatePickerProps<CalendarDate> = { label: 'Label' }
    const bare: DatePickerProps = { label: 'Label' }
    expect(props.label).toBe('Label')
    expect(bare).toEqual(props)
  })

  it('re-exports the DateRangePickerProps type', () => {
    const props: DateRangePickerProps<CalendarDate> = { label: 'Label' }
    const bare: DateRangePickerProps = { label: 'Label' }
    expect(props.label).toBe('Label')
    expect(bare).toEqual(props)
  })

  it('re-exports the ColorSwatchProps type', () => {
    const props: ColorSwatchProps = { color: '#6750A4' }
    expect(props.color).toBe('#6750A4')
  })

  it('re-exports the ColorSwatchPickerProps type', () => {
    const props: ColorSwatchPickerProps = { defaultValue: '#6750A4' }
    expect(props.defaultValue).toBe('#6750A4')
  })

  it('re-exports the ColorSliderProps type', () => {
    const props: ColorSliderProps = { channel: 'hue' }
    expect(props.channel).toBe('hue')
  })

  it('re-exports the ColorAreaProps type', () => {
    const props: ColorAreaProps = { xChannel: 'saturation' }
    expect(props.xChannel).toBe('saturation')
  })

  it('re-exports the ColorWheelProps type', () => {
    const props: ColorWheelProps = { outerRadius: 100 }
    expect(props.outerRadius).toBe(100)
  })

  it('re-exports the ColorFieldProps type', () => {
    const props: ColorFieldProps = { label: 'Label' }
    expect(props.label).toBe('Label')
  })

  it('re-exports the ColorPickerProps type', () => {
    const props: ColorPickerProps = { label: 'Label' }
    expect(props.label).toBe('Label')
  })

  it('re-exports the ButtonSize type', () => {
    const value: ButtonSize = 'md'
    expect(value).toBe('md')
  })

  it('re-exports the ButtonVariant type', () => {
    const value: ButtonVariant = 'filled'
    expect(value).toBe('filled')
  })

  it('re-exports the ComboBoxSelectionMode type', () => {
    const value: ComboBoxSelectionMode = 'single'
    expect(value).toBe('single')
  })

  it('re-exports the FieldVariant type', () => {
    const value: FieldVariant = 'filled'
    expect(value).toBe('filled')
  })

  it('re-exports the IconButtonSize type', () => {
    const value: IconButtonSize = 'md'
    expect(value).toBe('md')
  })

  it('re-exports the IconButtonVariant type', () => {
    const value: IconButtonVariant = 'standard'
    expect(value).toBe('standard')
  })

  it('re-exports the LinkTone type', () => {
    const value: LinkTone = 'primary'
    expect(value).toBe('primary')
  })

  it('re-exports the LinkUnderline type', () => {
    const value: LinkUnderline = 'hover'
    expect(value).toBe('hover')
  })

  it('re-exports the MenuAlign type', () => {
    const value: MenuAlign = 'start'
    expect(value).toBe('start')
  })

  it('re-exports the MenuSide type', () => {
    const value: MenuSide = 'bottom'
    expect(value).toBe('bottom')
  })

  it('re-exports the MeterTone type', () => {
    const value: MeterTone = 'primary'
    expect(value).toBe('primary')
  })

  it('re-exports the PopoverAlign type', () => {
    const value: PopoverAlign = 'center'
    expect(value).toBe('center')
  })

  it('re-exports the PopoverSide type', () => {
    const value: PopoverSide = 'top'
    expect(value).toBe('top')
  })

  it('re-exports the PopoverSize type', () => {
    const value: PopoverSize = 'sm'
    expect(value).toBe('sm')
  })

  it('re-exports the PopoverTrigger type', () => {
    const value: PopoverTrigger = 'press'
    expect(value).toBe('press')
  })

  it('re-exports the ProgressIndicatorTone type', () => {
    const value: ProgressIndicatorTone = 'primary'
    expect(value).toBe('primary')
  })

  it('re-exports the ProgressIndicatorVariant type', () => {
    const value: ProgressIndicatorVariant = 'linear'
    expect(value).toBe('linear')
  })

  it('re-exports the SeparatorInset type', () => {
    const value: SeparatorInset = 'none'
    expect(value).toBe('none')
  })

  it('re-exports the ToolbarTone type', () => {
    const value: ToolbarTone = 'neutral'
    expect(value).toBe('neutral')
  })

  it('re-exports the TooltipAlign type', () => {
    const value: TooltipAlign = 'center'
    expect(value).toBe('center')
  })

  it('re-exports the TooltipSide type', () => {
    const value: TooltipSide = 'bottom'
    expect(value).toBe('bottom')
  })

  it('re-exports the BreadcrumbsItemProps type', () => {
    const props: BreadcrumbsItemProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the ChipGroupChipProps type', () => {
    const props: ChipGroupChipProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the ColorSwatchPickerItemProps type', () => {
    const props: ColorSwatchPickerItemProps = { color: '#2563eb' }
    expect(props.color).toBe('#2563eb')
  })

  it('re-exports the DialogContentProps type', () => {
    const props: DialogContentProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the DialogTitleProps type', () => {
    const props: DialogTitleProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the DisclosureHeaderProps type', () => {
    const props: DisclosureHeaderProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the DisclosurePanelProps type', () => {
    const props: DisclosurePanelProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the ListBoxItemProps type', () => {
    const props: ListBoxItemProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the ListBoxLoadMoreProps type', () => {
    const props: ListBoxLoadMoreProps = { label: 'test' }
    expect(props.label).toBe('test')
  })

  it('re-exports the ListBoxSectionProps type', () => {
    const props: ListBoxSectionProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the MenuContentProps type', () => {
    const props: MenuContentProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the MenuItemProps type', () => {
    const props: MenuItemProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the MenuLoadMoreProps type', () => {
    const props: MenuLoadMoreProps = { label: 'test' }
    expect(props.label).toBe('test')
  })

  it('re-exports the MenuSectionProps type', () => {
    const props: MenuSectionProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the MenuSeparatorProps type', () => {
    const props: MenuSeparatorProps = { inset: 'none' }
    expect(props.inset).toBe('none')
  })

  it('re-exports the MenuSubmenuProps type', () => {
    const props: MenuSubmenuProps = { children: [], delay: 200 }
    expect(props.delay).toBe(200)
  })

  it('re-exports the PopoverContentProps type', () => {
    const props: PopoverContentProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the PopoverDescriptionProps type', () => {
    const props: PopoverDescriptionProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the PopoverTitleProps type', () => {
    const props: PopoverTitleProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the SheetContentProps type', () => {
    const props: SheetContentProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the SheetTitleProps type', () => {
    const props: SheetTitleProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the TableLoadMoreProps type', () => {
    const props: TableLoadMoreProps = { label: 'test' }
    expect(props.label).toBe('test')
  })

  it('re-exports the TabsListProps type', () => {
    const props: TabsListProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the TabsPanelProps type', () => {
    const props: TabsPanelProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the TabsPanelsProps type', () => {
    const props: TabsPanelsProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the TabsTabProps type', () => {
    const props: TabsTabProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the AutocompleteFilter type', () => {
    expect(typeof AUTOCOMPLETE_FILTER).toBe('function')
  })

  it('re-exports the TokenSegment type', () => {
    const segment: Pick<TokenSegment, 'text'> = { text: 'test' }
    expect(segment.text).toBe('test')
  })

  it('re-exports the SnackbarAction type', () => {
    const action: SnackbarAction = { label: 'Undo', onPress: () => {} }
    expect(action.label).toBe('Undo')
  })

  it('re-exports the SnackbarMessage type', () => {
    const message: SnackbarMessage = {
      action: undefined,
      message: 'First item',
      showCloseButton: false,
    }
    expect(message.message).toBe('First item')
  })

  it('re-exports the SnackbarOptions type', () => {
    const options: SnackbarOptions = { showCloseButton: true }
    expect(options.showCloseButton).toBe(true)
  })

  it('re-exports the SnackbarQueue type', () => {
    const queue: SnackbarQueue = new SnackbarDefault.Queue()
    expect(typeof queue.add).toBe('function')
  })

  it('re-exports the SnackbarRegionRenderProps type', () => {
    const state: Pick<
      SnackbarRegionRenderProps<SnackbarMessage>,
      'isFocused'
    > = {
      isFocused: false,
    }
    expect(state.isFocused).toBe(false)
  })
})
