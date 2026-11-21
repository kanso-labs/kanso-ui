'use client'

import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'
import { createElement } from 'react'

import type { RenderComponentProps } from '../../render/useRender'

import { CheckGlyph } from '../../glyphs'
import { hasContent } from '../../render/content'
import { useRender } from '../../render/useRender'
import { rowStyles } from '../../row/styles'
import { mergeStyles } from '../../styles/merge'
import {
  colors,
  radii,
  sizing,
  spacing,
} from '../../tokens/design.tokens.stylex'
import Button from '../button'
import Text from '../text'

// What a screen, a list or a section draws when it has nothing to show, in
// one of four layouts. No Material Design page draws an empty state, so the
// layouts are the library's own, built from the pages' parts: a mark in a
// filled circle, a title in title large, a line in body medium on on surface
// variant, and one common button.
//
// - **`first`**, a module or a list with nothing in it yet: a 64dp mark at
//   the full corner in the primary container, its glyph at 32dp in on
//   primary container; the title; the line, at most 280dp wide; and one
//   filled button. 16dp from the mark to the title, 8dp to the line and 24dp
//   to the button. It starts 40dp under what is above it and is centred
//   across, never down the screen's height, so it reads as the top of the
//   screen rather than floating in its middle.
// - **`first` at `size="inline"`**, a section with nothing in it yet: a 40dp
//   mark with a 20dp glyph and the line alone, in the lists page's 72dp row,
//   drawn on src/row's styles as ListItem's row is.
// - **`done`**, a list some things were in and none are left: a 24dp check
//   in the primary role and the line, in the lists page's 56dp row, lined up
//   where the rows were. No title and no button: nothing is wrong.
// - **`status`**, a screen that cannot show what it was opened for: the first
//   layout with a neutral mark, on surface container highest with its glyph
//   in on surface variant, and an outlined button, since what it offers is a
//   way round rather than the screen's main action.
//
// Each form's props are its own, so a part a layout does not draw, such as
// a title on `done`, does not compile. A mark is decorative and hidden from
// screen readers, the app's icon in it with it. An icon is drawn `1em`
// square in `currentColor`, as every icon here is, and the mark sets both.
//
// The title is a heading at `headingLevel`, 2 unless the app says otherwise:
// an empty state sits under the page's own title, the app bar's `<h1>`. The
// 64dp mark and the 280dp measure are literals: the first falls between
// steps of the sizing scale, and the second bounds a line of reading rather
// than measuring anything a theme resizes.
//
// `size` takes `default` and `inline` rather than the library's size scale:
// it names a layout, a screen's or a section's row, not a step of a scale,
// and it is the name react-native-kanso-ui's EmptyState gives the same prop.
//
// An empty state is not announced when it replaces what was there, since one
// drawn on a screen's first render should not be. Where removing the last
// item or a failed load swaps one in, announce the change through a live
// region already on the page: one inserted with its words inside it is often
// not read at all.
//
// Under forced colours the marks' fills are painted over, which leaves the
// glyph in the system's text colour on the page, as an icon is anywhere else.

const styles = stylex.create({
  action: {
    boxSizing: 'border-box',
    marginBlockStart: spacing.xl,
  },
  // The screen layouts: centred across, 40dp under what is above.
  block: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    paddingBlockStart: spacing.xxxl,
    paddingInline: spacing.lg,
    textAlign: 'center',
  },
  // The 24dp check a list done draws in the primary role.
  check: {
    blockSize: '24px',
    color: colors.primary,
    flexShrink: 0,
    inlineSize: '24px',
  },
  // A centred column sizes each line to its content, and a word with no break
  // in it — a file name, an address, a long compound — would otherwise run
  // past the container rather than breaking inside itself.
  fitted: {
    maxInlineSize: '100%',
  },
  // The 40dp mark of a section's row, with its 20dp glyph.
  inlineMark: {
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    blockSize: sizing.controlSm,
    borderRadius: radii.pill,
    boxSizing: 'border-box',
    color: colors.onPrimaryContainer,
    display: 'flex',
    flexShrink: 0,
    fontSize: '20px',
    inlineSize: sizing.controlSm,
    justifyContent: 'center',
  },
  // The line's measure, and never wider than the room it is given.
  line: {
    maxInlineSize: 'min(280px, 100%)',
  },
  lineUnderTitle: {
    marginBlockStart: spacing.sm,
  },
  // The 64dp mark over a screen's title, and its 32dp glyph.
  mark: {
    alignItems: 'center',
    blockSize: '64px',
    borderRadius: radii.pill,
    boxSizing: 'border-box',
    display: 'flex',
    flexShrink: 0,
    fontSize: '32px',
    inlineSize: '64px',
    justifyContent: 'center',
    marginBlockEnd: spacing.lg,
  },
  markFirst: {
    backgroundColor: colors.primaryContainer,
    color: colors.onPrimaryContainer,
  },
  markStatus: {
    backgroundColor: colors.surfaceContainerHighest,
    color: colors.onSurfaceVariant,
  },
  // The line beside an inline mark or a check, taking the room left.
  rowLine: {
    flexGrow: 1,
    minInlineSize: 0,
  },
})

// The screen line's two placements, alone or under a title, each one stable
// value rather than an array built at the prop.
const lineStyles = {
  alone: styles.line,
  underTitle: [styles.line, styles.lineUnderTitle],
} as const

const HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const

// The title's element, looked up rather than interpolated into a tag name,
// for the reason AppBar's `heading` gives: a level outside the six falls back
// to the default rather than rendering a custom element.
function heading(level: number) {
  const known = Number.isInteger(level) && level >= 1 && level <= 6
  return createElement(known ? HEADINGS[level - 1] : HEADINGS[1])
}

const PARAGRAPH = <p />

type EmptyStateAction = {
  /** Where the button leads, through the app's router. */
  href?: string
  /** What the button says. */
  label: string
  /** Run when the button is pressed. */
  onPress?: () => void
}

type EmptyStateBaseProps = Omit<
  RenderComponentProps<'div'>,
  'children' | 'title'
>

// Every prop any form takes, which the component reads once the form is
// known.
type EmptyStateFields = EmptyStateBaseProps &
  EmptyStateScreenParts & {
    kind?: EmptyStateKind
    size?: EmptyStateSize
  }

type EmptyStateKind = 'done' | 'first' | 'status'

type EmptyStateProps = (
  | (EmptyStateScreenParts & {
      /**
       * `first`, nothing there yet; `done`, nothing left; `status`, what
       * was opened cannot be shown.
       * @default 'first'
       */
      kind?: 'first' | 'status'
      /**
       * `inline` draws `first` as a 72dp row for a section, with a 40dp
       * mark and the line alone.
       * @default 'default'
       */
      size?: 'default'
    })
  | {
      action?: never
      description: ReactNode
      headingLevel?: never
      icon?: never
      kind: 'done'
      size?: never
      title?: never
    }
  | {
      action?: never
      description: ReactNode
      headingLevel?: never
      icon?: ReactNode
      kind?: 'first'
      size: 'inline'
      title?: never
    }
) &
  EmptyStateBaseProps

// The screen layouts' parts, which `first` and `status` share.
type EmptyStateScreenParts = {
  /**
   * The one button, filled for `first` and outlined for `status`. The row
   * forms draw none.
   */
  action?: EmptyStateAction
  /**
   * The line saying what is empty, what is done, or what can be done about
   * it: inline content, since it is drawn as a paragraph. The row forms need
   * it, since it is all they say.
   */
  description?: ReactNode
  /**
   * Where the title sits in the page's outline, as one of the six heading
   * levels. A value outside the six that reaches it untyped falls back to 2.
   * @default 2
   */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  /**
   * The glyph in the mark, `1em` square in `currentColor`: 32dp in a screen's
   * 64dp mark and 20dp in a section's 40dp one. `done` draws a check of its
   * own.
   */
  icon?: ReactNode
  /** The title, a heading in the page's outline. The row forms draw none. */
  title?: ReactNode
}

type EmptyStateSize = 'default' | 'inline'

// The one button, filled or outlined, as a link where it has somewhere to
// go.
function ActionButton({
  action,
  variant,
}: {
  action: EmptyStateAction
  variant: 'filled' | 'outlined'
}) {
  return action.href === undefined ? (
    <Button onPress={action.onPress} variant={variant}>
      {action.label}
    </Button>
  ) : (
    <Button href={action.href} onPress={action.onPress} variant={variant}>
      {action.label}
    </Button>
  )
}

/**
 * What a screen, a list or a section draws when it has nothing to show.
 *
 * ```tsx
 * <EmptyState
 *   action={{ label: 'Label', onPress: add }}
 *   description="Supporting line"
 *   icon={<Icon />}
 *   title="Headline"
 * />
 * ```
 *
 * `kind="first"` is a screen with nothing in it yet, `size="inline"` the
 * same for a section, `kind="done"` a list emptied, and `kind="status"` a
 * screen that cannot show what it was opened for. Draw it where the content
 * would be, under the screen's bar. The call site's `className` and `style`
 * land on its own element.
 */
function EmptyState(props: EmptyStateProps) {
  const fields: EmptyStateFields = props
  const {
    action,
    description,
    headingLevel = 2,
    icon,
    kind = 'first',
    render,
    size = 'default',
    title,
    ...rest
  } = fields
  const status = kind === 'status'
  const inline = kind === 'first' && size === 'inline'
  const row = kind === 'done' || inline

  let children: ReactNode
  if (kind === 'done') {
    children = (
      <>
        <CheckGlyph {...stylex.props(styles.check)} />
        <Line xstyle={styles.rowLine}>{description}</Line>
      </>
    )
  } else if (inline) {
    children = (
      <>
        {!hasContent(icon) ? null : (
          <div aria-hidden="true" {...stylex.props(styles.inlineMark)}>
            {icon}
          </div>
        )}
        <Line xstyle={styles.rowLine}>{description}</Line>
      </>
    )
  } else {
    children = (
      <>
        {!hasContent(icon) ? null : (
          <div
            aria-hidden="true"
            {...stylex.props(
              styles.mark,
              status ? styles.markStatus : styles.markFirst,
            )}
          >
            {icon}
          </div>
        )}
        {!hasContent(title) ? null : (
          <Text
            render={heading(headingLevel)}
            variant="titleLarge"
            {...stylex.props(styles.fitted)}
          >
            {title}
          </Text>
        )}
        {!hasContent(description) ? null : (
          <Line
            xstyle={
              hasContent(title) ? lineStyles.underTitle : lineStyles.alone
            }
          >
            {description}
          </Line>
        )}
        {action === undefined ? null : (
          <div {...stylex.props(styles.action)}>
            <ActionButton
              action={action}
              variant={status ? 'outlined' : 'filled'}
            />
          </div>
        )}
      </>
    )
  }

  return useRender({
    defaultTagName: 'div',
    props: {
      ...rest,
      ...mergeStyles(
        stylex.props(
          row ? [rowStyles.base, rowStyles.list] : styles.block,
          inline && rowStyles.twoLine,
        ),
        rest,
      ),
      children,
    },
    render,
  })
}

// The line, in body medium on on surface variant, as a paragraph.
function Line({
  children,
  xstyle,
}: {
  children: ReactNode
  xstyle: stylex.StyleXStyles
}) {
  return (
    <Text
      render={PARAGRAPH}
      tone="muted"
      variant="bodyMedium"
      {...stylex.props(xstyle)}
    >
      {children}
    </Text>
  )
}

export type {
  EmptyStateAction,
  EmptyStateKind,
  EmptyStateProps,
  EmptyStateSize,
}

export default EmptyState
