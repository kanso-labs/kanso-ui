'use client'

import type { ReactNode, RefAttributes } from 'react'

import * as stylex from '@stylexjs/stylex'

import type { RenderComponentProps } from '../../render/useRender'

import { useMessages } from '../../i18n'
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

// The shape of a page drawn at once, while what fills it is read: rows at the
// lists page's 56dp and 72dp heights, holding bars in place of their lines
// and 40dp circles in place of their marks. No Material Design page draws a
// skeleton, so this is the library's own, drawn on the lists page's row as
// ListItem draws it, from src/row: its 16dp inline padding and 16dp between a
// slot and the lines.
//
// Every shape is surface container highest, the bars at the 4dp corner and
// the circles round. A bar is 12dp tall for an eyebrow or a supporting line,
// 14dp for a title or a figure and 28dp for a headline, each a little under
// the line it stands in for, so a row of bars reads as a row of text rather
// than as blocks. Those three heights fall between steps of the spacing scale
// and are written out. Its width is the call site's, since only it knows how
// long the words it stands in for tend to be.
//
// **No shimmer.** What is inside a skeleton fades from full opacity to 60%
// over 1.5 seconds and back, eased at both ends, so a screen of rows breathes
// as one rather than flickering row by row — the reading react-native-kanso-ui
// takes too. Under reduced motion it holds at full opacity.
//
// **A screen reader hears one "Loading".** The skeleton is one element, a
// busy progress bar named by `aria-label`, or by the library's own word for
// loading in the `I18nProvider`'s locale, as a pending Button is. What it
// holds is hidden from screen readers, so nothing inside is read past it.
//
// Under forced colours a fill is painted over in the page's own colour, which
// would leave every shape invisible, so the shapes are drawn in `GrayText`,
// the mode's colour for what cannot be used yet.

const FORCED_COLORS = '@media (forced-colors: active)'
const REDUCED_MOTION = '@media (prefers-reduced-motion: reduce)'

const fade = stylex.keyframes({
  from: { opacity: 1 },
  to: { opacity: 0.6 },
})

const styles = stylex.create({
  bar: {
    backgroundColor: {
      default: colors.surfaceContainerHighest,
      [FORCED_COLORS]: 'GrayText',
    },
    borderRadius: radii.xs,
    boxSizing: 'border-box',
    flexShrink: 0,
    forcedColorAdjust: { default: null, [FORCED_COLORS]: 'none' },
    maxInlineSize: '100%',
  },
  circle: {
    backgroundColor: {
      default: colors.surfaceContainerHighest,
      [FORCED_COLORS]: 'GrayText',
    },
    blockSize: sizing.controlSm,
    borderRadius: radii.pill,
    boxSizing: 'border-box',
    flexShrink: 0,
    forcedColorAdjust: { default: null, [FORCED_COLORS]: 'none' },
    inlineSize: sizing.controlSm,
  },
  // Everything inside, fading together: 1.5s down to 60% and 1.5s back.
  fading: {
    animationDirection: 'alternate',
    animationDuration: '1.5s',
    animationIterationCount: 'infinite',
    animationName: { default: fade, [REDUCED_MOTION]: 'none' },
    animationTimingFunction: 'ease-in-out',
    boxSizing: 'border-box',
  },
  // The lines, one above the other, taking the room the slots leave.
  lines: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: spacing.sm,
    minInlineSize: 0,
  },
  root: {
    boxSizing: 'border-box',
  },
})

// The bars' heights, by what each stands in for, and their widths, which
// are the call site's — see the header.
const barSizes = stylex.create({
  lg: { blockSize: '28px' },
  md: { blockSize: '14px' },
  sm: { blockSize: '12px' },
})

const barWidth = stylex.create({
  width: (inlineSize: string) => ({ inlineSize }),
})

type SkeletonBarProps = Omit<
  RenderComponentProps<'div'>,
  'children' | 'render'
> & {
  /**
   * What the bar stands in for: `sm`, 12px, an eyebrow or a supporting line;
   * `md`, 14px, a title or a figure; `lg`, 28px, a headline.
   * @default 'sm'
   */
  size?: SkeletonBarSize
  /** How wide the bar is, as a CSS length or a percentage of its row. */
  width: string
}

type SkeletonBarSize = 'lg' | 'md' | 'sm'

type SkeletonCircleProps = Omit<
  RenderComponentProps<'div'>,
  'children' | 'render'
>

type SkeletonProps = RenderComponentProps<'div'> & {
  /**
   * What a screen reader hears. Left out, it is the library's word for
   * loading in the `I18nProvider`'s locale — "Loading" in English.
   */
  'aria-label'?: string
  /** The shapes: `Skeleton.Row`s, or bars and circles of the call site's. */
  children?: ReactNode
}

type SkeletonRowProps = Omit<RenderComponentProps<'div'>, 'render'> & {
  /** The bars standing in for the row's lines, one above the other. */
  children?: ReactNode
  /** What stands before the lines, usually a `Skeleton.Circle`. */
  leading?: ReactNode
  /**
   * How many lines the row stands in for: `1` is the lists page's 56px
   * one-line item, `2` its 72px two-line item.
   * @default 1
   */
  lines?: 1 | 2
  /** What stands after the lines, such as a bar in place of a figure. */
  trailing?: ReactNode
}

/**
 * The shape of what is being read, drawn at once in its place: rows of bars
 * and circles, fading gently, that a screen reader hears as one "Loading".
 *
 * ```tsx
 * <Skeleton>
 *   <Skeleton.Row leading={<Skeleton.Circle />} lines={2}>
 *     <Skeleton.Bar size="md" width="60%" />
 *     <Skeleton.Bar width="40%" />
 *   </Skeleton.Row>
 * </Skeleton>
 * ```
 *
 * Draw it where the content will be, in its place rather than over it, and
 * swap it for the content once that is read. The call site's `className` and
 * `style` land on its own element.
 */
function Skeleton({
  'aria-label': ariaLabel,
  children,
  render,
  ...props
}: SkeletonProps) {
  const messages = useMessages()

  return useRender({
    defaultTagName: 'div',
    props: {
      'aria-busy': true,
      'aria-label': ariaLabel ?? messages.loading,
      role: 'progressbar',
      ...props,
      ...mergeStyles(stylex.props(styles.root), props),
      children: (
        <div aria-hidden="true" {...stylex.props(styles.fading)}>
          {children}
        </div>
      ),
    },
    render,
  })
}

/** A bar standing in for a line of text, at the width the call site gives. */
function SkeletonBar({
  size = 'sm',
  width,
  ...props
}: RefAttributes<HTMLDivElement> & SkeletonBarProps) {
  return (
    <div
      {...props}
      {...mergeStyles(
        stylex.props(styles.bar, barSizes[size], barWidth.width(width)),
        props,
      )}
    />
  )
}

/** A 40px circle standing in for a row's mark, such as an avatar. */
function SkeletonCircle(
  props: RefAttributes<HTMLDivElement> & SkeletonCircleProps,
) {
  return <div {...props} {...mergeStyles(stylex.props(styles.circle), props)} />
}

/**
 * A row standing in for a list item: 56px for one line, 72px for two, with
 * the lists page's padding, a leading and a trailing slot, and its bars one
 * above the other between them.
 */
function SkeletonRow({
  children,
  leading,
  lines = 1,
  trailing,
  ...props
}: RefAttributes<HTMLDivElement> & SkeletonRowProps) {
  return (
    <div
      {...props}
      {...mergeStyles(
        stylex.props(
          rowStyles.base,
          rowStyles.list,
          lines === 2 && rowStyles.twoLine,
        ),
        props,
      )}
    >
      {!hasContent(leading) ? null : (
        <div {...stylex.props(rowStyles.slot)}>{leading}</div>
      )}
      <div {...stylex.props(styles.lines)}>{children}</div>
      {!hasContent(trailing) ? null : (
        <div {...stylex.props(rowStyles.slot)}>{trailing}</div>
      )}
    </div>
  )
}

Skeleton.Bar = SkeletonBar
Skeleton.Circle = SkeletonCircle
Skeleton.Row = SkeletonRow

export type {
  SkeletonBarProps,
  SkeletonBarSize,
  SkeletonCircleProps,
  SkeletonProps,
  SkeletonRowProps,
}

export { SkeletonBar, SkeletonCircle, SkeletonRow }

export default Skeleton
