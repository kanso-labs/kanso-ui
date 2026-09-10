import type { ReactNode } from 'react'
import type {
  BreadcrumbRenderProps,
  BreadcrumbProps as RACBreadcrumbProps,
  BreadcrumbsProps as RACBreadcrumbsProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  Breadcrumb as RACBreadcrumb,
  Breadcrumbs as RACBreadcrumbs,
} from 'react-aria-components'

import { ChevronEndGlyph } from '../../glyphs'
import { mergeStatefulStyles, mergeStyles } from '../../styles/merge'
import { colors, spacing, typography } from '../../tokens/design.tokens.stylex'
import Link from '../link'

// A trail of links back up a hierarchy, ending at the page you are on. The
// design system carries no breadcrumbs page, so the two nearest ones stand
// in: the row takes the top app bar's muted content role, and each link the
// text button's label-large type. Both are written down here rather than
// guessed at each call site.
//
// React Aria decides which item is current — the last one — and marks it
// `aria-current="page"`. The trail is an ordered list, which is what a screen
// reader reads it as, and `Breadcrumbs.Item` is one entry in it.
//
// Three things are this component's own.
//
// **The current item is text, not a link.** React Aria's own answer is a
// disabled link, and a disabled link takes the library's disabled treatment
// — the content role at 38%, which fades the one item the trail exists to
// name. Here it is a span carrying `aria-current="page"` instead, in the
// full-strength content role, so the page you are on is the most legible
// thing in the row rather than the least.
//
// **The chevron belongs to the item before it.** Each item that is not the
// current one draws one after its link, which puts a separator between every
// pair and none at the end. It says "further in" rather than "to the right",
// so it mirrors under a right-to-left writing mode.
//
// **A link is drawn as a link in a place already understood to be links.**
// `tone="inherit"` takes the row's muted colour and `underline="hover"`
// leaves the rule for a pointer, which is what Link's own documentation
// names this case for. The row's position is what announces them.
//
// `onAction` is React Aria's and is not wrapped: give each item an `id` and
// the trail reports which one was pressed, for a page that navigates without
// an `href`.

const styles = stylex.create({
  // Points further in, so it mirrors under a right-to-left writing mode.
  // Sized against the 20dp the menus page gives the same glyph, since there
  // is no breadcrumbs page to take one from.
  chevron: {
    blockSize: '18px',
    flexShrink: 0,
    inlineSize: '18px',
    transform: { ':dir(rtl)': 'scaleX(-1)', default: 'none' },
  },
  // The item you are on: the same type as the links, in the full-strength
  // content role rather than the muted one, so it reads as the end of the
  // trail.
  current: {
    color: colors.onSurface,
  },
  item: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    gap: spacing.xs,
  },
  root: {
    alignItems: 'center',
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    display: 'flex',
    flexWrap: 'wrap',
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    gap: spacing.xs,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
})

type BreadcrumbsItemProps = Omit<
  RACBreadcrumbProps,
  'children' | 'className' | 'style'
> & {
  /** The item's label. */
  children?: ReactNode
  /** A function may compute the class from the item's render state. */
  className?: RACBreadcrumbProps['className']
  /**
   * Where the item leads. Leave it out on an item the page handles through
   * the trail's `onAction`, and on the current one, which is never a link.
   */
  href?: string
  /** The link's `rel`. */
  rel?: string
  /** A function may compute the style from the item's render state. */
  style?: RACBreadcrumbProps['style']
  /** The link's `target`. */
  target?: string
}

type BreadcrumbsProps<T extends object = object> = Omit<
  RACBreadcrumbsProps<T>,
  'children'
> & {
  /** The trail, as `Breadcrumbs.Item` entries. */
  children?: ReactNode
}

/**
 * A trail of links back up a hierarchy, ending at the page you are on.
 * React Aria makes the last item the current one and marks it
 * `aria-current="page"`; everything before it is a link.
 *
 * ```tsx
 * <Breadcrumbs aria-label="Label">
 *   <Breadcrumbs.Item href="#first">First item</Breadcrumbs.Item>
 *   <Breadcrumbs.Item href="#second">Second item</Breadcrumbs.Item>
 *   <Breadcrumbs.Item>Third item</Breadcrumbs.Item>
 * </Breadcrumbs>
 * ```
 *
 * Name it with `aria-label` or `aria-labelledby`. A page that navigates
 * without an `href` gives each item an `id` and the trail an `onAction`,
 * which is React Aria's and reports the key that was pressed.
 *
 * The call site's `className` and `style` land on the list, which is the
 * element a layout positions.
 */
function Breadcrumbs<T extends object = object>(props: BreadcrumbsProps<T>) {
  return (
    <RACBreadcrumbs<T>
      {...props}
      {...mergeStyles(stylex.props(styles.root), props)}
    />
  )
}

/**
 * One entry in the trail. Give it an `href` to navigate, or an `id` and let
 * the trail's `onAction` handle it. The last entry is the current page and
 * is drawn as text rather than a link, whatever it is given.
 */
function BreadcrumbsItem({
  children,
  href,
  rel,
  target,
  ...props
}: BreadcrumbsItemProps) {
  return (
    <RACBreadcrumb
      {...props}
      {...mergeStatefulStyles(stylex.props(styles.item), props)}
    >
      {itemContent(children, href, rel, target)}
    </RACBreadcrumb>
  )
}

// What an entry draws, from React Aria's render state. Built by a call rather
// than written inline at the prop, which is what react-perf's
// no-new-function-as-prop is after; the React Compiler memoises the result on
// its inputs.
function itemContent(
  children: ReactNode,
  href: string | undefined,
  rel: string | undefined,
  target: string | undefined,
) {
  return (state: BreadcrumbRenderProps) => {
    if (state.isCurrent) {
      return (
        <span aria-current="page" {...stylex.props(styles.current)}>
          {children}
        </span>
      )
    }
    return (
      <>
        <Link
          href={href}
          rel={rel}
          target={target}
          tone="inherit"
          underline="hover"
        >
          {children}
        </Link>
        <ChevronEndGlyph {...stylex.props(styles.chevron)} />
      </>
    )
  }
}

Breadcrumbs.Item = BreadcrumbsItem

export type { BreadcrumbsItemProps, BreadcrumbsProps }

export default Breadcrumbs
