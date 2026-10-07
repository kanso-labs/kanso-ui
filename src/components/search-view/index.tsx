'use client'

import type { ReactNode, RefAttributes } from 'react'
import type {
  ClassNameOrFunction,
  DialogTriggerProps,
  PopoverRenderProps,
  SearchFieldRenderProps,
  StyleOrFunction,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  Dialog,
  DialogTrigger,
  Label,
  Popover as RACPopover,
  SearchField as RACSearchField,
  VisuallyHidden,
} from 'react-aria-components'

import type { AutocompleteProps } from '../autocomplete'

import { FieldInput } from '../../field'
import { ArrowBackGlyph, CloseGlyph } from '../../glyphs'
import { useMessages } from '../../i18n'
import { mergeStatefulStyles } from '../../styles/merge'
import { overlay } from '../../styles/overlay'
import {
  colors,
  media,
  radii,
  shadows,
  sizing,
  spacing,
} from '../../tokens/design.tokens.stylex'
import Autocomplete from '../autocomplete'
import IconButton from '../icon-button'

// The search page's search view: what a search opens into. A header holds a
// back button, the input and a clear button, over a 1dp divider in the
// outline role, and the results run under it. Both of the page's forms are
// surface container high, with the input in body-large on surface over a
// supporting text in on surface variant, the back icon in on surface and the
// clear icon in on surface variant.
//
// **Which form is the window's.** Below the medium breakpoint it is the
// page's full-screen view: the whole window, square, with a 72dp header.
// Above it, the docked view: dropped under what opened it, as wide as that
// and held between the page's 360dp and 720dp, with a 28dp corner, a 56dp
// header, results at least 240dp tall and the whole view no taller than two
// thirds of the window, at elevation 3 — Compose's measurements for its
// docked search bar, which the page draws without numbers. The swap is the
// date pickers' — see `src/styles/picker.ts`: React Aria places the surface
// with inline styles, which a class outranks only with `!important`, so the
// full-screen form takes it on the edges, the position and the size, and
// above the breakpoint this says nothing about any of them.
//
// **It is Autocomplete in an overlay.** The header's input and the results
// are Autocomplete's two halves, so typing narrows the results as it does
// anywhere else, and the results are the call site's ListBox or Menu.
// Autocomplete still renders nothing of its own; this is the element around
// it.
//
// **The header lines up with the search bar's.** The back button sits where
// the bar's magnifier does, its icon 28dp in, and the text starts at 68dp,
// as the bar's does; the clear button's icon ends 28dp from the end. So a
// view opened from a bar puts its input where the bar's was.
//
// Composed as Popover is: `SearchView` holds the open state, a Button or
// IconButton placed directly inside it opens the view, and
// `SearchView.Content` is the view. The back button closes it, as Escape and
// a press outside the docked view do.

// The gap between what opened the view and the docked view, Popover's.
const SIDE_OFFSET = 8

const styles = stylex.create({
  // The back button, 4dp in from the header's padding so its icon sits 28dp
  // in, where the search bar draws its magnifier.
  back: {
    marginInlineStart: spacing.xs,
  },
  // The page's on-surface back icon, over the icon button's own on surface
  // variant. Turned over under right-to-left, since back points at the
  // start.
  backGlyph: {
    blockSize: '1em',
    color: colors.onSurface,
    display: 'block',
    inlineSize: '1em',
    transform: { ':dir(rtl)': 'scaleX(-1)', default: 'none' },
  },
  // 4dp in from the padding, so the icon inside the 40dp button ends 28dp
  // from the end, as the search bar's does.
  clear: {
    marginInlineEnd: spacing.xs,
  },
  clearGlyph: {
    blockSize: '1em',
    display: 'block',
    inlineSize: '1em',
  },
  // The dialog inside the surface: the header, the divider and the results
  // in a column, the results taking what is left.
  dialog: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minBlockSize: 0,
    outlineStyle: 'none',
  },
  // The page's divider under the header, in the outline role.
  divider: {
    backgroundColor: colors.outline,
    blockSize: '1px',
    borderWidth: 0,
    boxSizing: 'border-box',
    flexShrink: 0,
    margin: 0,
  },
  // The field: the input and the clear button, taking the room after the
  // back button.
  field: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    flexGrow: 1,
    gap: spacing.sm,
    minInlineSize: 0,
  },
  // The header: 56dp docked and the page's 72dp full screen, its icons and
  // its text where the search bar puts them.
  header: {
    alignItems: 'center',
    blockSize: {
      default: sizing.controlLg,
      [media.belowMedium]: '72px',
    },
    boxSizing: 'border-box',
    display: 'flex',
    flexShrink: 0,
    gap: spacing.sm,
    paddingInline: spacing.lg,
  },
  // A search input is the one type the browser decorates on its own, and
  // the header draws its own clear button.
  input: {
    '::-webkit-search-cancel-button': {
      display: 'none',
    },
    '::-webkit-search-decoration': {
      display: 'none',
    },
    appearance: 'none',
    flexGrow: 1,
    minInlineSize: 0,
  },
  // The results, scrolling inside the view rather than past it.
  results: {
    boxSizing: 'border-box',
    flexGrow: 1,
    maxBlockSize: {
      default: `calc(100dvh * 2 / 3 - ${sizing.controlLg} - 1px)`,
      [media.belowMedium]: 'none',
    },
    minBlockSize: {
      default: '240px',
      [media.belowMedium]: 0,
    },
    overflowY: 'auto',
    overscrollBehavior: 'contain',
  },
  // The surface, over the overlay module's anchored one: its entry, its
  // border under forced colours and its scrolling stay that module's, and
  // what is the page's own is laid over them here.
  view: {
    backgroundColor: colors.surfaceContainerHigh,
    blockSize: { default: null, [media.belowMedium]: '100dvh' },
    borderRadius: { default: radii.xl, [media.belowMedium]: 0 },
    boxShadow: { default: shadows.elevation3, [media.belowMedium]: 'none' },
    display: 'flex',
    flexDirection: 'column',
    inlineSize: {
      default: 'clamp(360px, var(--trigger-width), 720px)',
      [media.belowMedium]: '100vw',
    },
    insetBlockEnd: { default: null, [media.belowMedium]: '0 !important' },
    insetBlockStart: { default: null, [media.belowMedium]: '0 !important' },
    insetInlineEnd: { default: null, [media.belowMedium]: '0 !important' },
    insetInlineStart: { default: null, [media.belowMedium]: '0 !important' },
    maxBlockSize: { default: null, [media.belowMedium]: 'none !important' },
    maxInlineSize: { default: '100vw', [media.belowMedium]: 'none' },
    overflow: 'hidden',
    position: { default: null, [media.belowMedium]: 'fixed !important' },
  },
})

type SearchViewContentProps<T extends object = object> = {
  /**
   * What the back button is called, for a screen reader. Left out, the
   * library names it in the reader's locale — "Back" in English.
   */
  backLabel?: string
  /** The results: a ListBox or a Menu, which typing narrows. */
  children?: ReactNode
  /** A function may compute the class from the view's render state. */
  className?: ClassNameOrFunction<PopoverRenderProps>
  /**
   * What the clear button is called, for a screen reader. Left out, React
   * Aria names it in the reader's locale — "Clear search" in English.
   */
  clearLabel?: string
  /**
   * Where to portal the view. Defaults to the container of the `ThemeScope`
   * around it, which keeps the view on that scope's tokens, or to the end of
   * `<body>` where there is none. A subtree themed through the `themeScope`
   * class has no container of its own, so point this inside it, or the view
   * renders outside and keeps the page's tokens.
   */
  container?: Element
  /**
   * What is searched, for a screen reader. It names both the view and its
   * input, and is read rather than shown; `placeholder` is what is seen.
   */
  label: string
  /** The supporting text in the empty input, which is what a person reads. */
  placeholder?: string
  /** A function may compute the style from the view's render state. */
  style?: StyleOrFunction<PopoverRenderProps>
} & Omit<AutocompleteProps<T>, 'children'>

type SearchViewProps = Omit<DialogTriggerProps, 'children'> & {
  /**
   * The Button or IconButton that opens the view, and `SearchView.Content`.
   */
  children?: ReactNode
}

// What the field draws, from its render state: the clear button only while
// it holds something. Built by a call rather than written inline at the
// prop, which is what react-perf's no-new-function-as-prop is after.
function fieldContent(
  label: string,
  placeholder: string | undefined,
  clearLabel: string | undefined,
) {
  return (state: SearchFieldRenderProps) => (
    <>
      <VisuallyHidden>
        <Label>{label}</Label>
      </VisuallyHidden>
      <FieldInput
        // oxlint-disable-next-line jsx-a11y/no-autofocus -- a search view opens to be typed into, so the input takes focus rather than the back button the dialog would otherwise start on
        autoFocus
        placeholder={placeholder}
        {...stylex.props(styles.input)}
      />
      {state.isEmpty ? null : (
        <IconButton aria-label={clearLabel} {...stylex.props(styles.clear)}>
          <CloseGlyph {...stylex.props(styles.clearGlyph)} />
        </IconButton>
      )}
    </>
  )
}

/**
 * The view a search opens into: full screen on a compact window, docked
 * under what opened it on a wider one. Open state is React Aria's: pass
 * `isOpen` with `onOpenChange` to control it, or `defaultOpen` to let it keep
 * its own.
 *
 * ```tsx
 * <SearchView>
 *   <IconButton aria-label="Search"><SearchIcon /></IconButton>
 *   <SearchView.Content label="Search" placeholder="Search">
 *     <ListBox aria-label="Results">…</ListBox>
 *   </SearchView.Content>
 * </SearchView>
 * ```
 *
 * A Button or IconButton placed directly inside opens the view;
 * `SearchView.Content` is the view itself.
 */
function SearchView({ children, ...props }: SearchViewProps) {
  return <DialogTrigger {...props}>{children}</DialogTrigger>
}

/**
 * The view: the header with its back button, input and clear button, and
 * the results under it, inside React Aria's Autocomplete, so typing narrows
 * them. Its value is Autocomplete's: pass `inputValue` with `onInputChange`
 * to control what has been typed, or `defaultInputValue` to let it keep its
 * own.
 *
 * The call site's `className` and `style` land on the view's surface, and
 * its `ref` too.
 */
function SearchViewContent<T extends object = object>({
  backLabel,
  children,
  className,
  clearLabel,
  container,
  label,
  placeholder,
  ref,
  style,
  ...props
}: RefAttributes<HTMLElement> & SearchViewContentProps<T>) {
  const messages = useMessages()

  return (
    <RACPopover
      offset={SIDE_OFFSET}
      placement="bottom start"
      ref={ref}
      // oxlint-disable-next-line typescript/no-deprecated -- its replacement, UNSAFE_PortalProvider, is not exported by react-aria-components
      UNSTABLE_portalContainer={container}
      {...mergeStatefulStyles(stylex.props(overlay.popup, styles.view), {
        className,
        style,
      })}
    >
      <Dialog aria-label={label} {...stylex.props(styles.dialog)}>
        <Autocomplete<T> {...props}>
          <div {...stylex.props(styles.header)}>
            <IconButton
              aria-label={backLabel ?? messages.back}
              slot="close"
              {...stylex.props(styles.back)}
            >
              <ArrowBackGlyph {...stylex.props(styles.backGlyph)} />
            </IconButton>
            <RACSearchField {...stylex.props(styles.field)}>
              {fieldContent(label, placeholder, clearLabel)}
            </RACSearchField>
          </div>
          <hr {...stylex.props(styles.divider)} />
          <div {...stylex.props(styles.results)}>{children}</div>
        </Autocomplete>
      </Dialog>
    </RACPopover>
  )
}

SearchView.Content = SearchViewContent

export type { SearchViewContentProps, SearchViewProps }

export { SearchViewContent }

export default SearchView
