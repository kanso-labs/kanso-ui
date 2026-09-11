import { describe, expect, it } from 'vitest'

import type { AppBarProps } from './app-bar'
import type { AutocompleteProps } from './autocomplete'
import type { AvatarProps } from './avatar'
import type { BreadcrumbsProps } from './breadcrumbs'
import type { ButtonProps } from './button'
import type { CardProps } from './card'
import type { CheckboxProps } from './checkbox'
import type { CheckboxGroupProps } from './checkbox-group'
import type { ChipProps } from './chip'
import type { ChipGroupProps } from './chip-group'
import type { CodeProps } from './code'
import type { ComboBoxProps } from './combo-box'
import type { ContainerProps } from './container'
import type { CopyFieldProps } from './copy-field'
import type { CurrencyProps } from './currency'
import type { DialogProps } from './dialog'
import type { DisclosureProps } from './disclosure'
import type { DisclosureGroupProps } from './disclosure-group'
import type { FeedProps } from './feed'
import type { FormProps } from './form'
import type { IconButtonProps } from './icon-button'
import type { KeycapProps } from './keycap'
import type { LinkProps } from './link'
import type { ListProps } from './list'
import type { ListBoxProps } from './list-box'
import type { ListDetailProps } from './list-detail'
import type { ListItemProps } from './list-item'
import type { MenuProps } from './menu'
import type { MeterProps } from './meter'
import type { NumberFieldProps } from './number-field'
import type { PopoverProps } from './popover'
import type { ProductIconProps } from './product-icon'
import type { ProgressIndicatorProps } from './progress-indicator'
import type { RadioGroupProps, RadioProps } from './radio-group'
import type { SearchFieldProps } from './search-field'
import type { SegmentedButtonProps } from './segmented-button'
import type { SelectProps } from './select'
import type { SeparatorProps } from './separator'
import type { SheetProps } from './sheet'
import type { SliderProps } from './slider'
import type { SnackbarProps } from './snackbar'
import type { StackProps } from './stack'
import type { SupportingPaneProps } from './supporting-pane'
import type { SwitchProps } from './switch'
import type { TabsProps } from './tabs'
import type { TagProps } from './tag'
import type { TextProps } from './text'
import type { TextAreaProps } from './text-area'
import type { TextFieldProps } from './text-field'
import type { TokenFieldProps } from './token-field'
import type { ToolbarProps } from './toolbar'
import type { TooltipProps } from './tooltip'

import * as components from '.'
import AppBarDefault from './app-bar'
import AutocompleteDefault from './autocomplete'
import AvatarDefault from './avatar'
import BreadcrumbsDefault from './breadcrumbs'
import ButtonDefault from './button'
import CardDefault from './card'
import CheckboxDefault from './checkbox'
import CheckboxGroupDefault from './checkbox-group'
import ChipDefault from './chip'
import ChipGroupDefault from './chip-group'
import CodeDefault from './code'
import ComboBoxDefault from './combo-box'
import ContainerDefault from './container'
import CopyFieldDefault from './copy-field'
import CurrencyDefault from './currency'
import DialogDefault from './dialog'
import DisclosureDefault from './disclosure'
import DisclosureGroupDefault from './disclosure-group'
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
import NumberFieldDefault from './number-field'
import PopoverDefault from './popover'
import ProductIconDefault from './product-icon'
import ProgressIndicatorDefault from './progress-indicator'
import RadioGroupDefault, { Radio } from './radio-group'
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
import TabsDefault from './tabs'
import TagDefault from './tag'
import TextDefault from './text'
import TextAreaDefault from './text-area'
import TextFieldDefault from './text-field'
import TokenFieldDefault from './token-field'
import ToolbarDefault from './toolbar'
import TooltipDefault from './tooltip'

describe('components barrel', () => {
  it('exposes exactly the documented public components', () => {
    expect(Object.keys(components)).toEqual([
      'AppBar',
      'Autocomplete',
      'Avatar',
      'Breadcrumbs',
      'Button',
      'Card',
      'Checkbox',
      'CheckboxGroup',
      'Chip',
      'ChipGroup',
      'Code',
      'ComboBox',
      'Container',
      'CopyField',
      'Currency',
      'Dialog',
      'Disclosure',
      'DisclosureGroup',
      'Feed',
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
      'NumberField',
      'Popover',
      'ProductIcon',
      'ProgressIndicator',
      'Radio',
      'RadioGroup',
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
      'TokenField',
      'Toolbar',
      'Tooltip',
      'Tree',
    ])
  })

  it('re-exports AppBar as the same reference as its own module', () => {
    expect(components.AppBar).toBe(AppBarDefault)
  })

  it('re-exports Avatar as the same reference as its own module', () => {
    expect(components.Avatar).toBe(AvatarDefault)
  })

  it('re-exports Tag as the same reference as its own module', () => {
    expect(components.Tag).toBe(TagDefault)
  })

  it('re-exports Breadcrumbs as the same reference as its own module', () => {
    expect(components.Breadcrumbs).toBe(BreadcrumbsDefault)
  })

  it('re-exports Button as the same reference as its own module', () => {
    expect(components.Button).toBe(ButtonDefault)
  })

  it('re-exports Card as the same reference as its own module', () => {
    expect(components.Card).toBe(CardDefault)
  })

  it('re-exports Chip as the same reference as its own module', () => {
    expect(components.Chip).toBe(ChipDefault)
  })

  it('re-exports Code as the same reference as its own module', () => {
    expect(components.Code).toBe(CodeDefault)
  })

  it('re-exports Container as the same reference as its own module', () => {
    expect(components.Container).toBe(ContainerDefault)
  })

  it('re-exports CopyField as the same reference as its own module', () => {
    expect(components.CopyField).toBe(CopyFieldDefault)
  })

  it('re-exports Currency as the same reference as its own module', () => {
    expect(components.Currency).toBe(CurrencyDefault)
  })

  it('re-exports Disclosure as the same reference as its own module', () => {
    expect(components.Disclosure).toBe(DisclosureDefault)
  })

  it('re-exports DisclosureGroup as the same reference as its own module', () => {
    expect(components.DisclosureGroup).toBe(DisclosureGroupDefault)
  })

  it('re-exports Feed as the same reference as its own module', () => {
    expect(components.Feed).toBe(FeedDefault)
  })

  it('re-exports IconButton as the same reference as its own module', () => {
    expect(components.IconButton).toBe(IconButtonDefault)
  })

  it('re-exports Keycap as the same reference as its own module', () => {
    expect(components.Keycap).toBe(KeycapDefault)
  })

  it('re-exports Link as the same reference as its own module', () => {
    expect(components.Link).toBe(LinkDefault)
  })

  it('re-exports ListDetail as the same reference as its own module', () => {
    expect(components.ListDetail).toBe(ListDetailDefault)
  })

  it('re-exports ListItem as the same reference as its own module', () => {
    expect(components.ListItem).toBe(ListItemDefault)
  })

  it('re-exports Popover as the same reference as its own module', () => {
    expect(components.Popover).toBe(PopoverDefault)
  })

  it('re-exports ProductIcon as the same reference as its own module', () => {
    expect(components.ProductIcon).toBe(ProductIconDefault)
  })

  it('re-exports Separator as the same reference as its own module', () => {
    expect(components.Separator).toBe(SeparatorDefault)
  })

  it('re-exports Sheet as the same reference as its own module', () => {
    expect(components.Sheet).toBe(SheetDefault)
  })

  it('re-exports Stack as the same reference as its own module', () => {
    expect(components.Stack).toBe(StackDefault)
  })

  it('re-exports SupportingPane as the same reference as its own module', () => {
    expect(components.SupportingPane).toBe(SupportingPaneDefault)
  })

  it('re-exports Tabs as the same reference as its own module', () => {
    expect(components.Tabs).toBe(TabsDefault)
  })

  it('re-exports Text as the same reference as its own module', () => {
    expect(components.Text).toBe(TextDefault)
  })

  it('re-exports TextField as the same reference as its own module', () => {
    expect(components.TextField).toBe(TextFieldDefault)
  })

  it('re-exports Checkbox as the same reference as its own module', () => {
    expect(components.Checkbox).toBe(CheckboxDefault)
  })

  it('re-exports CheckboxGroup as the same reference as its own module', () => {
    expect(components.CheckboxGroup).toBe(CheckboxGroupDefault)
  })

  it('re-exports RadioGroup as the same reference as its own module', () => {
    expect(components.RadioGroup).toBe(RadioGroupDefault)
  })

  it('re-exports Radio as the same reference as its own module', () => {
    expect(components.Radio).toBe(Radio)
  })

  it('re-exports Switch as the same reference as its own module', () => {
    expect(components.Switch).toBe(SwitchDefault)
  })

  it('re-exports Slider as the same reference as its own module', () => {
    expect(components.Slider).toBe(SliderDefault)
  })

  it('re-exports NumberField as the same reference as its own module', () => {
    expect(components.NumberField).toBe(NumberFieldDefault)
  })

  it('re-exports SearchField as the same reference as its own module', () => {
    expect(components.SearchField).toBe(SearchFieldDefault)
  })

  it('re-exports SegmentedButton as the same reference as its own module', () => {
    expect(components.SegmentedButton).toBe(SegmentedButtonDefault)
  })

  it('re-exports TextArea as the same reference as its own module', () => {
    expect(components.TextArea).toBe(TextAreaDefault)
  })

  it('re-exports Form as the same reference as its own module', () => {
    expect(components.Form).toBe(FormDefault)
  })

  it('re-exports Dialog as the same reference as its own module', () => {
    expect(components.Dialog).toBe(DialogDefault)
  })

  it('re-exports Toolbar as the same reference as its own module', () => {
    expect(components.Toolbar).toBe(ToolbarDefault)
  })

  it('re-exports Tooltip as the same reference as its own module', () => {
    expect(components.Tooltip).toBe(TooltipDefault)
  })

  it('re-exports ProgressIndicator as the same reference as its own module', () => {
    expect(components.ProgressIndicator).toBe(ProgressIndicatorDefault)
  })

  it('re-exports Meter as the same reference as its own module', () => {
    expect(components.Meter).toBe(MeterDefault)
  })

  it('re-exports Snackbar as the same reference as its own module', () => {
    expect(components.Snackbar).toBe(SnackbarDefault)
  })

  it('re-exports ListBox as the same reference as its own module', () => {
    expect(components.ListBox).toBe(ListBoxDefault)
  })

  it('re-exports Menu as the same reference as its own module', () => {
    expect(components.Menu).toBe(MenuDefault)
  })

  it('re-exports Select as the same reference as its own module', () => {
    expect(components.Select).toBe(SelectDefault)
  })

  it('re-exports ComboBox as the same reference as its own module', () => {
    expect(components.ComboBox).toBe(ComboBoxDefault)
  })

  it('re-exports Autocomplete as the same reference as its own module', () => {
    expect(components.Autocomplete).toBe(AutocompleteDefault)
  })

  it('re-exports ChipGroup as the same reference as its own module', () => {
    expect(components.ChipGroup).toBe(ChipGroupDefault)
  })

  it('re-exports TokenField as the same reference as its own module', () => {
    expect(components.TokenField).toBe(TokenFieldDefault)
  })

  it('re-exports List as the same reference as its own module', () => {
    expect(components.List).toBe(ListDefault)
  })

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
    const props: ListBoxProps<object> = { 'aria-label': 'Label' }
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

  it('re-exports the ListProps type', () => {
    const props: ListProps<object> = { 'aria-label': 'Label' }
    expect(props['aria-label']).toBe('Label')
  })
})
