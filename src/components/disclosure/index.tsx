import type { ReactNode } from 'react'
import type {
  DisclosurePanelProps as RACDisclosurePanelProps,
  DisclosureProps as RACDisclosureProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { useContext } from 'react'
import {
  DisclosureStateContext,
  Button as RACButton,
  Disclosure as RACDisclosure,
  DisclosurePanel as RACDisclosurePanel,
  Heading as RACHeading,
} from 'react-aria-components'

import { ChevronEndGlyph } from '../../glyphs'
import { RowContent } from '../../row'
import { rowStyles } from '../../row/styles'
import { mergeStatefulStyles } from '../../styles/merge'
import { colors, motion, spacing } from '../../tokens/design.tokens.stylex'

// A section that opens to show what is under it, and closes again. The
// header is the row every list here draws — `src/row`, shared with ListItem,
// ListBox and List — so its 56dp floor, body-large headline, body-medium
// supporting line and state layers are that module's, and a header sitting
// above a list cannot drift from the rows below it.
//
// The lists page gives the expand interaction its own token set, which its
// widget keeps behind a menu that does not open to a script. What the page
// states in words covers the row, which is what the shared module already
// carries; the chevron's size and the panel's inset below are the library's
// own, taken from the row's own trailing slot and inline padding rather than
// invented.
//
// Three things are this component's own.
//
// **The header is a heading with a button in it.** React Aria wants both —
// the heading is what a screen reader jumps between, and the button is what
// opens the section — so `Disclosure.Header` renders the pair rather than
// leaving a call site to remember. `headingLevel` says where in the page's
// outline it sits.
//
// **The panel opens to its own height, without one being measured.** A grid
// whose single row goes from `0fr` to `1fr` interpolates between nothing and
// the content's natural height, so no height is read from the DOM and no
// number is written down. Under `prefers-reduced-motion` the row snaps
// instead.
//
// **Only the opening animates, and that is React Aria's doing rather than a
// choice here.** It marks the collapsed panel `hidden="until-found"`, so on
// the way closed the content stops being laid out at once and the track has
// nothing left to shrink. Worth knowing before reaching for a closing
// animation: it needs the panel kept in the layout, which would cost the
// find-in-page behaviour that attribute buys.

const styles = stylex.create({
  // Points at what the section opens, so it turns a quarter to point down
  // once it is open. It mirrors under a right-to-left writing mode, as every
  // chevron here does.
  chevron: {
    blockSize: '24px',
    color: colors.onSurfaceVariant,
    flexShrink: 0,
    inlineSize: '24px',
    transform: { ':dir(rtl)': 'scaleX(-1)', default: 'none' },
    transitionDuration: motion.durationShort3,
    transitionProperty: 'transform',
    transitionTimingFunction: motion.easingStandard,
  },
  chevronExpanded: {
    transform: { ':dir(rtl)': 'rotate(-90deg)', default: 'rotate(90deg)' },
  },
  // The header row. `textAlign: start` because a button centres its label and
  // a row's headline runs from the leading edge.
  header: {
    inlineSize: '100%',
    textAlign: 'start',
  },
  // The heading React Aria wants around the trigger, with nothing of its own:
  // the row inside sets the type, and a heading's default margin and size
  // would fight it.
  heading: {
    fontSize: 'inherit',
    fontWeight: 'inherit',
    margin: 0,
  },
  // The padding sits here rather than on the panel above, and that placement
  // is what makes the closed track measure nothing. `hidden="until-found"`
  // skips an element's contents but keeps its own box, so padding on the
  // panel would leave the closed section a band of empty space tall.
  inner: {
    boxSizing: 'border-box',
    paddingBlockEnd: spacing.lg,
    paddingInline: spacing.lg,
  },
  // What React Aria hides while the section is closed. `minBlockSize: 0` is
  // what lets the grid track above shrink past the content's own minimum.
  panel: {
    boxSizing: 'border-box',
    minBlockSize: 0,
    overflow: 'hidden',
  },
  root: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  },
  // The grid whose one row goes from nothing to the content's own height.
  // `1fr` resolves to what the panel wants, so the height is never measured
  // and never written down.
  track: {
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    display: 'grid',
    gridTemplateRows: '0fr',
    transitionDuration: motion.durationMedium2,
    transitionProperty: 'grid-template-rows',
    transitionTimingFunction: motion.easingEmphasized,
  },
  trackExpanded: {
    gridTemplateRows: '1fr',
  },
})

type DisclosureHeaderProps = {
  /** The header's headline — what the section is about. */
  children?: ReactNode
  /**
   * Where the header sits in the page's outline. React Aria renders the
   * trigger inside a heading, and a screen reader moves between them.
   * @default 3
   */
  headingLevel?: number
  /** Content before the headline: an avatar, an icon. */
  leading?: ReactNode
  /** A second line under the headline, in the muted role. */
  supporting?: ReactNode
}

type DisclosurePanelProps = Omit<
  RACDisclosurePanelProps,
  'className' | 'style'
> & {
  /** A function may compute the class from the panel's render state. */
  className?: RACDisclosurePanelProps['className']
  /** A function may compute the style from the panel's render state. */
  style?: RACDisclosurePanelProps['style']
}

type DisclosureProps = Omit<RACDisclosureProps, 'children'> & {
  /** A `Disclosure.Header` and a `Disclosure.Panel`. */
  children?: ReactNode
}

// The chevron, turned or not. A call rather than JSX written at the prop,
// which is what react-perf's jsx-no-jsx-as-prop is after; the React Compiler
// memoises the result on `isExpanded`.
function chevronFor(isExpanded: boolean) {
  return (
    <ChevronEndGlyph
      {...stylex.props(styles.chevron, isExpanded && styles.chevronExpanded)}
    />
  )
}

/**
 * A section that opens to show what is under it. Whether it is open is React
 * Aria's: pass `isExpanded` with `onExpandedChange` to control it, or
 * `defaultExpanded` to let it keep its own.
 *
 * ```tsx
 * <Disclosure>
 *   <Disclosure.Header>Headline</Disclosure.Header>
 *   <Disclosure.Panel>Supporting line</Disclosure.Panel>
 * </Disclosure>
 * ```
 *
 * The header is the row every list here draws, so a section above a list of
 * rows lines up with them. The panel opens to whatever height its content
 * turns out to have, and snaps rather than sliding under
 * `prefers-reduced-motion`.
 *
 * The call site's `className` and `style` land on the container, which is the
 * element a layout positions.
 */
function Disclosure({ children, ...props }: DisclosureProps) {
  return (
    <RACDisclosure
      {...props}
      {...mergeStatefulStyles(stylex.props(styles.root), props)}
    >
      {children}
    </RACDisclosure>
  )
}

/**
 * The row that opens the section. It renders the heading React Aria wants
 * around the trigger and the button inside it, and draws the shared row's
 * slots with a chevron in the trailing one.
 */
function DisclosureHeader({
  children,
  headingLevel = 3,
  leading,
  supporting,
}: DisclosureHeaderProps) {
  // The chevron turns with the section, and React Aria's button render state
  // reports the press states rather than what the button controls — so
  // whether the section is open comes from the disclosure's own context.
  const state = useContext(DisclosureStateContext)

  return (
    <RACHeading level={headingLevel} {...stylex.props(styles.heading)}>
      <RACButton className={headerClassName} slot="trigger">
        {headerContent(
          children,
          leading,
          supporting,
          state?.isExpanded === true,
        )}
      </RACButton>
    </RACHeading>
  )
}

/**
 * What the section shows while it is open. Its content lines up with the
 * headline above it, and it takes the group role React Aria gives it —
 * `role="region"` names it in the landmark list instead, for a section a
 * reader should be able to jump to.
 */
function DisclosurePanel({ children, ...props }: DisclosurePanelProps) {
  // The track has to know, and React Aria hands the render state to the panel
  // rather than to what wraps it — so the state comes from its context, the
  // same one its own panel reads.
  const state = useContext(DisclosureStateContext)

  return (
    <div
      {...stylex.props(
        styles.track,
        state?.isExpanded === true && styles.trackExpanded,
      )}
    >
      <RACDisclosurePanel
        {...props}
        {...mergeStatefulStyles(stylex.props(styles.panel), props)}
      >
        <div {...stylex.props(styles.inner)}>{children}</div>
      </RACDisclosurePanel>
    </div>
  )
}

// The trigger's classes, from React Aria's render state. `isSelected` is not
// among them — a disclosure's button reports `aria-expanded` rather than a
// selection — so the row draws unselected throughout and only its disabled
// state changes.
function headerClassName(state: { isDisabled: boolean }) {
  return (
    stylex.props(
      rowStyles.base,
      rowStyles.list,
      rowStyles.interactive,
      styles.header,
      state.isDisabled && rowStyles.disabled,
    ).className ?? ''
  )
}

// What the header row draws. Built by a call rather than written inline at
// the prop, which is what react-perf's no-new-function-as-prop is after; the
// React Compiler memoises the result on its inputs.
function headerContent(
  children: ReactNode,
  leading: ReactNode,
  supporting: ReactNode,
  isExpanded: boolean,
) {
  return (state: { isDisabled: boolean }) => (
    <RowContent
      isDisabled={state.isDisabled}
      leading={leading}
      supporting={supporting}
      trailing={chevronFor(isExpanded)}
    >
      {children}
    </RowContent>
  )
}

Disclosure.Header = DisclosureHeader
Disclosure.Panel = DisclosurePanel

export type { DisclosureHeaderProps, DisclosurePanelProps, DisclosureProps }

export default Disclosure
