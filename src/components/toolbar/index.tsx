'use client'

import type { KeyboardEvent, ReactNode, RefAttributes } from 'react'
import type {
  ToolbarProps as RACToolbarProps,
  SeparatorProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { createElement, useMemo } from 'react'
import { Toolbar as RACToolbar, SeparatorContext } from 'react-aria-components'

import { mergeStatefulStyles } from '../../styles/merge'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'

// The toolbars page's container: a row of frequently used controls, on a
// surface of its own, with the arrow keys moving between them rather than
// Tab. The page calls it "a container with configurable slots", so nothing
// here says what goes in one — an icon button, a button, a field or a rule
// are all the call site's to place.
//
// The measurements are the page's, stated there in words: 64dp tall,
// centred, 8dp between items and 16dp of padding outside them. The two
// colour schemes are its own too — standard on surface container, vibrant on
// primary container — and both put the muted content role on what they hold.
// `tone` spells the standard one `neutral` rather than by the page's name,
// since that is the word every `tone` in the library uses for its neutral
// role.
//
// Two things are this component's own.
//
// **A rule inside it runs across the row, not along it.** React Aria's
// `Toolbar` sets its orientation on itself and nowhere else, so a
// `Separator` written among the controls would draw the way it does anywhere
// else — along the row, where it is invisible. This provides React Aria's
// separator context with the perpendicular orientation, and `Separator`
// reads it, so a rule between two controls is correct without the call site
// saying which way it runs. The context reaches the bar's own controls and
// stops at an overlay opened from one: React context crosses the portal a
// popover, sheet or dialog renders through, so their content parts clear it
// — see `src/overlay` — and a rule inside one runs across the overlay as it
// does anywhere else.
//
// **Keyboard navigation is React Aria's, with Home and End added.** The
// arrows move between the controls, and the bar is a single Tab stop, as
// the APG's toolbar pattern has it. React Aria gets there without a roving
// tabindex: every control keeps its own `tabindex`, and a Tab pressed inside
// the bar first moves focus to its last control, a Shift+Tab to its first,
// so the browser's own move then leaves the bar from there. Coming back with
// either, focus returns to the control focused last rather than to the end
// it came in from. The bar's other contribution is the toolbar role, which
// tells a screen reader the controls belong together.
//
// The pattern also gives Home and End to the first and the last control,
// which React Aria's toolbar leaves alone, so `homeAndEnd` below adds them:
// the start and the end of the bar in document order, whichever way it runs
// and whichever direction it is drawn in, passing over a disabled control.
// They are taken as the key bubbles out of the control rather than ahead of
// it, so a control that has a use for them keeps it: a field moves its
// caret, and a control that handles the key first, as React Aria's slider
// does, takes it from the bar.
//
// One departure, and it is about the shape. The page gives the container's
// corner as a token its widget draws rather than writes, so there is no
// value to read: what it states in words is the height, the alignment and
// the padding, and nothing else. The fully rounded corner here, and the
// inline box that goes with it, are the library's own choice for a bar that
// floats over a page rather than docking to its edge — a docked one spans
// its container and squares its corner, both from the call site.

const styles = stylex.create({
  // A grid rather than a flex row, because a flex item shrinks to its
  // min-content width and a Button's is a single letter: it wraps its label
  // rather than overflow a narrow container, so a flex bar on a phone would
  // squeeze it until the label broke after every letter. The bar has no say
  // over its children's `flex-shrink`, and a grid's tracks are its own.
  //
  // A bar narrower than its controls then scrolls inside what holds it, as
  // a scrollable Tabs does and with no scrollbar for the same reason — the
  // control cut off at its edge is what says there is more — rather than
  // overflow the page sideways or squeeze a control out of shape. Every
  // control keeps the size and the one line its own spec gives it, and a
  // control that Tab or an arrow key moves focus to is scrolled into view.
  base: {
    '::-webkit-scrollbar': {
      display: 'none',
    },
    borderRadius: radii.pill,
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    display: 'inline-grid',
    gap: spacing.sm,
    maxInlineSize: '100%',
    // React Aria moves focus to a control inside rather than to the
    // container, and each control draws its own ring.
    outlineStyle: 'none',
    overflow: 'auto',
    scrollbarWidth: 'none',
  },
  // The page's 64dp across the bar, and its 16dp of padding at the two ends.
  // A minimum rather than a fixed size, since a field or a button taller
  // than 64dp should make the bar taller rather than overflow it.
  //
  // The cross axis takes the 8dp the page puts between items rather than
  // nothing, and that is a layout consequence rather than a value the page
  // states: a `Separator` takes its length from the row it sits in, which
  // fills the bar's height, so with no padding there a rule runs the full
  // 64dp and cuts the container in two instead of dividing what is inside
  // it.
  //
  // One column per control, each as wide as the control's own max-content
  // width, centred along the bar when it is wider than they need. `safe`
  // because centring a row wider than the bar pushes as much of it past the
  // start edge as past the end, and a scroll container cannot reach what
  // lies before its start: the first control would be cut off with no way
  // to scroll to it.
  horizontal: {
    alignItems: 'center',
    gridAutoColumns: 'max-content',
    gridAutoFlow: 'column',
    justifyContent: 'safe center',
    minBlockSize: '64px',
    paddingBlock: spacing.sm,
    paddingInline: spacing.lg,
  },
  neutral: {
    backgroundColor: colors.surfaceContainer,
  },
  // The same turned a quarter: one row per control, centred down the bar —
  // safely, for the same reason — and the column they share filling its
  // width, which is what a rule runs across.
  vertical: {
    alignContent: 'safe center',
    gridAutoFlow: 'row',
    justifyItems: 'center',
    minInlineSize: '64px',
    paddingBlock: spacing.lg,
    paddingInline: spacing.sm,
  },
  // The page's vibrant scheme. Its content role reaches a standard icon
  // button through the property IconButton reads for its icon and its state
  // layers, which would otherwise keep their own on surface variant: a
  // different colour from everything else the bar carries, and the one
  // Compose's vibrant toolbar does not draw its icons in. A disabled one
  // keeps its own faded on surface, as it does on every surface.
  vibrant: {
    '--icon-button-standard-color': colors.onPrimaryContainer,
    backgroundColor: colors.primaryContainer,
    color: colors.onPrimaryContainer,
  },
})

type ToolbarProps = Omit<
  RACToolbarProps,
  'children' | 'className' | 'style'
> & {
  /** The controls, and any rule between them. */
  children?: ReactNode
  /** A function may compute the class from the toolbar's render state. */
  className?: RACToolbarProps['className']
  /** A function may compute the style from the toolbar's render state. */
  style?: RACToolbarProps['style']
  /**
   * Which of the page's two colour schemes the bar takes. `neutral` is the
   * page's standard scheme, the surface container it draws by default;
   * `vibrant` moves it to primary container, for a bar meant to carry the
   * page's accent.
   * @default 'neutral'
   */
  tone?: ToolbarTone
}

type ToolbarRender = RACToolbarProps['render']

type ToolbarTone = 'neutral' | 'vibrant'

// What can take focus in the bar, as a Tab could land on it: a native
// control or anything with a `tabindex`, narrowed in `controlsIn`.
const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button',
  'iframe',
  'input:not([type="hidden"])',
  'select',
  'summary',
  'textarea',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',')

// The input types that are a press target rather than a value, and so have
// no use for Home and End of their own.
const PRESSABLE_INPUTS = new Set([
  'button',
  'checkbox',
  'image',
  'radio',
  'reset',
  'submit',
])

/**
 * The bar's controls a Tab could land on, in document order: a disabled
 * one, one taken out of the Tab order, and one inert or not drawn are left
 * out, so Home and End never reach a control that cannot take focus.
 */
function controlsIn(bar: HTMLElement) {
  return [...bar.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (control) =>
      control.tabIndex >= 0 &&
      !control.matches(':disabled') &&
      control.closest('[inert]') === null &&
      control.checkVisibility(),
  )
}

// Home and End, to the first and the last control. Left alone while a
// modifier is held, which the browser may want, once a control has taken
// the key, and on a key from a portal the bar renders — a popover opened
// from one of its controls — which React carries up to the bar as though it
// came from inside it. Taken from the page once used, so End does not
// scroll it as well.
function homeAndEnd(event: KeyboardEvent<HTMLDivElement>) {
  const bar = event.currentTarget
  const { target } = event
  if (
    (event.key !== 'Home' && event.key !== 'End') ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.defaultPrevented ||
    !(target instanceof HTMLElement) ||
    !bar.contains(target) ||
    ownsHomeAndEnd(target)
  ) {
    return
  }
  const controls = controlsIn(bar)
  const control = event.key === 'Home' ? controls.at(0) : controls.at(-1)
  if (control === undefined) {
    return
  }
  event.preventDefault()
  control.focus()
}

/**
 * Whether `target` is a control with its own use for Home and End: a field,
 * whose caret they move, a native select or range, or editable text.
 */
function ownsHomeAndEnd(target: HTMLElement) {
  if (target instanceof HTMLInputElement) {
    return !PRESSABLE_INPUTS.has(target.type)
  }
  return (
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  )
}

/**
 * A container for a set of controls, announced as a toolbar so a screen
 * reader reads them as one group, with the arrow keys moving between them
 * and Home and End moving to the first and the last enabled control. The
 * bar is one Tab stop: Tab and Shift+Tab leave it from whichever control has
 * focus, and coming back returns to that control.
 *
 * ```tsx
 * <Toolbar aria-label="Label">
 *   <IconButton aria-label="First item">
 *     <FirstIcon />
 *   </IconButton>
 *   <Separator />
 *   <IconButton aria-label="Second item">
 *     <SecondIcon />
 *   </IconButton>
 * </Toolbar>
 * ```
 *
 * Name it with `aria-label` or `aria-labelledby` — nothing here labels it for
 * you, and a toolbar with no name is a group a screen reader cannot announce.
 *
 * `orientation` is React Aria's, and it decides both which arrows move and
 * which way the bar runs. A `Separator` among its controls draws across that
 * direction without being told; one inside an overlay opened from the bar
 * draws as it would anywhere else.
 *
 * The call site's `className` and `style` land on the container, which is
 * the element a layout positions.
 *
 * Every control keeps its own width. A bar given less room than its controls
 * need — a phone's width, say — stays inside it and scrolls along its length
 * rather than squeezing a control or overflowing the page.
 */
function Toolbar({
  orientation = 'horizontal',
  tone = 'neutral',
  ...props
}: RefAttributes<HTMLDivElement> & ToolbarProps) {
  // The rule runs across the toolbar rather than along it. Memoised because
  // a fresh object here would be a new context value on every render, which
  // is what react-perf's no-new-object-as-prop is after.
  const separator = useMemo<SeparatorProps>(
    () => ({
      orientation: orientation === 'horizontal' ? 'vertical' : 'horizontal',
    }),
    [orientation],
  )

  return (
    <SeparatorContext value={separator}>
      <RACToolbar
        orientation={orientation}
        {...props}
        render={toolbarRenderer(props.render)}
        {...mergeStatefulStyles(
          stylex.props(styles.base, styles[orientation], styles[tone]),
          props,
        )}
      />
    </SeparatorContext>
  )
}

/**
 * The bar's element, with Home and End added to the keys React Aria handles,
 * then handed to the call site's own `render` if it passed one. React Aria's
 * toolbar passes no keyboard handler of the call site's through, so the
 * element it hands over carries none for this to compose with.
 */
function toolbarRenderer(render: ToolbarRender): NonNullable<ToolbarRender> {
  return (domProps, renderProps) => {
    const merged = { ...domProps, onKeyDown: homeAndEnd }
    return render === undefined
      ? createElement('div', merged)
      : render(merged, renderProps)
  }
}

export type { ToolbarProps, ToolbarTone }

export default Toolbar
