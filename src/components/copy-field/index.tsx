'use client'

import type { HTMLAttributes, RefAttributes } from 'react'

import * as stylex from '@stylexjs/stylex'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { useMessages } from '../../i18n'
import { mergeStyles } from '../../styles/merge'
import {
  colors,
  radii,
  spacing,
  typography,
} from '../../tokens/design.tokens.stylex'
import Button from '../button'
import Code from '../code'

// How long the confirmation stands before the control returns to offering the
// copy again. Not a motion token: those are transition durations, measured in
// hundreds of milliseconds, and this is a dwell — long enough to be read
// without being long enough to leave the button lying about what it will do.
const COPIED_RESET_MS = 2000

// No Material Design page draws a read-only value with a copy control. It
// follows the outlined text field: the 1dp rule in the outline role, the
// surface behind it, and the control at its trailing end. The value is
// body-small beside a 32dp text button, so the box is shorter than the
// field's 56, which suits a value that is read rather than edited, and its
// corner is the shape scale's small step for the same reason.
const styles = stylex.create({
  // Clipped to a 1px box rather than `display: none`, which would take it out
  // of the accessibility tree along with the announcement.
  announcement: {
    blockSize: '1px',
    clipPath: 'inset(50%)',
    inlineSize: '1px',
    overflow: 'hidden',
    position: 'absolute',
    whiteSpace: 'nowrap',
  },
  // Hidden rather than absent: `visibility` keeps the box, which is what
  // reserves the room, and takes the label out of the accessibility tree so
  // the button's name is the one on show.
  labelHidden: {
    visibility: 'hidden',
  },
  // Both labels in one cell, so the button is as wide as the wider of them
  // from the start and a press swaps which one shows rather than resizing
  // the control. The button sits at the trailing end, so a width that grew
  // on press moved leftwards under the pointer that had just pressed it.
  //
  // Button does this for its own pending state — see `label` and
  // `labelPending` in src/button/styles.ts, and the comment on
  // `buttonContent` in src/button/index.tsx about a form jumping the moment
  // it is submitted. This is the same jump one step over.
  //
  // A consumer passing labels of very different lengths gets a button sized
  // to the longer one, which is the point rather than a cost.
  labels: {
    display: 'grid',
    justifyItems: 'center',
  },
  labelSlot: {
    gridArea: '1 / 1',
  },
  root: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.outline,
    borderRadius: radii.sm,
    borderStyle: 'solid',
    borderWidth: '1px',
    boxSizing: 'border-box',
    display: 'flex',
    gap: spacing.sm,
    paddingBlock: spacing.xs,
    paddingInline: spacing.md,
  },
  // These sit on a wrapper rather than on the Code itself, so the flex child
  // and the type are two elements rather than one — Code sets its own font
  // size relative to the text around it, which a size set on the same element
  // would then be measured against. `minInlineSize: 0` is the load-bearing
  // one: left at `auto`, a long unbroken value sets the flex row's floor and
  // pushes the button out of the box instead of wrapping.
  //
  // The colour is here for the same reason. Code takes the colour of the
  // text around it, and the field paints a surface of its own, so the value
  // takes the on surface role that surface pairs with rather than whatever
  // colour the page around the field happens to set.
  value: {
    color: colors.onSurface,
    flexGrow: 1,
    fontSize: typography.bodySmallSize,
    minInlineSize: 0,
  },
  // The value is a literal to copy, so it keeps its own direction whatever
  // the page's: left to right, isolated from the text around it. Under a
  // right-to-left page the bidi algorithm otherwise ran a path, a flag or a
  // command into the page's direction, moving a leading or trailing `/`,
  // `--` or `$` to the other end — so the field showed one string and copied
  // another. On the `<code>` rather than the box around it, which keeps the
  // page's direction and so keeps the value at the row's inline start.
  valueText: {
    unicodeBidi: 'isolate',
  },
})

type CopyFieldProps = {
  /**
   * What the button says once the value has been copied, and what is
   * announced. It reverts to `copyLabel` on its own after a couple of
   * seconds. Left out, it is the word for it in the I18nProvider's locale —
   * "Copied" in English.
   */
  copiedLabel?: string
  /**
   * What the button says at rest. Left out, it is the word for it in the
   * I18nProvider's locale — "Copy" in English.
   */
  copyLabel?: string
  /**
   * What the value is — "Repository URL", "Access token" — for a page with
   * more than one field. It names the field as a group and joins the button's
   * name, so a screen reader hears "Copy Repository URL" rather than one
   * "Copy" after another; it is not shown. The value itself stays out of the
   * button's name, since a token would be read aloud. Left out, the field is
   * unnamed and its button is "Copy" alone, as it always was.
   */
  label?: string
  /**
   * Called with the value after it reaches the clipboard, never before.
   *
   * Named `onCopied` rather than `onCopy` because the root is a `<div>`, which
   * already has an `onCopy` of its own — React's handler for the native copy
   * event, fired when the reader presses the copy shortcut inside the element.
   * The two are different moments, and a prop that quietly shadowed the
   * built-in would be a trap rather than a convenience.
   */
  onCopied?: (value: string) => void
  /**
   * Called when the write is refused, with whatever was thrown. The button
   * stays at rest, so this is the only signal an app gets — reach for it to
   * fall back, by selecting the value or saying so in a snackbar.
   *
   * Takes the error where `onCopied` takes the value, because the value is
   * the one thing the call site already has and the reason is the one thing
   * it does not. The two refusals throw differently: outside a secure
   * context `navigator.clipboard` is not there at all, and where the
   * permission is denied it is a `DOMException`.
   */
  onCopyFailed?: (error: unknown) => void
  /** The text shown, and the text copied. */
  value: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>

/**
 * A value to be read and taken away — a repository URL, a token, a command.
 * It shows the value in the mono face and copies it on request, confirming
 * on the button itself.
 *
 * A write refused — outside a secure context, or where the permission is
 * denied — leaves the button at rest rather than confirming, and calls
 * `onCopyFailed`.
 */
function CopyField({
  copiedLabel: copiedLabelProp,
  copyLabel: copyLabelProp,
  label,
  onCopied,
  onCopyFailed,
  value,
  ...props
}: CopyFieldProps & RefAttributes<HTMLDivElement>) {
  const messages = useMessages()
  const copiedLabel = copiedLabelProp ?? messages.copied
  const copyLabel = copyLabelProp ?? messages.copy
  // What the last write put on the clipboard, and how many writes there have
  // been. The confirmation is that text still being the value shown, so a
  // value that changes inside the dwell — a token regenerated, a selection
  // swapped — takes the label back to Copy at once rather than confirming a
  // copy of something else. The count is what lets a second press be
  // announced, below.
  const [copy, setCopy] = useState<null | { count: number; text: string }>(null)
  const copied = copy?.text === value
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const generatedId = useId()
  const rootId = props.id ?? generatedId
  const copyId = useId()
  const copiedId = useId()
  // With a label, the field is a group it names, and the button is named by
  // the label slot on show and then by the group: "Copy Repository URL",
  // then "Copied Repository URL". The slot on show rather than both, since
  // the two swap `aria-hidden` and a name taking both would say both.
  const named =
    label === undefined
      ? undefined
      : { 'aria-label': label, id: rootId, role: 'group' }
  const buttonName =
    label === undefined ? undefined : `${copied ? copiedId : copyId} ${rootId}`

  // Without this, a field unmounted inside the dwell leaves a timer holding a
  // setState for a tree that is gone.
  useEffect(
    () => () => {
      clearTimeout(timer.current)
    },
    [],
  )

  const handleCopy = useCallback(() => {
    const write = async () => {
      try {
        await navigator.clipboard.writeText(value)
      } catch (error) {
        // A clipboard write is refused outside a secure context and wherever
        // the permission is denied, and neither is something the call site can
        // fix. Staying at rest is the honest report: the value is not on the
        // clipboard, so the control must not claim it is.
        //
        // It is reported rather than swallowed, since a control that does
        // nothing is indistinguishable from one that is broken. Nothing is
        // logged — the library writes to the console nowhere, and a warning
        // an app cannot turn off is not its to emit.
        setCopy(null)
        onCopyFailed?.(error)
        return
      }
      // The component's own state first, the dwell included, and the call
      // site's handler after it: a handler that threw used to skip the
      // timer, leaving the button on Copied for good. Its error is still the
      // call site's to see, raised on its own rather than swallowed.
      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        setCopy(null)
      }, COPIED_RESET_MS)
      setCopy((current) => ({ count: (current?.count ?? 0) + 1, text: value }))
      reportCopied(onCopied, value)
    }
    void write()
  }, [onCopied, onCopyFailed, value])

  return (
    <div
      {...props}
      {...named}
      {...mergeStyles(stylex.props(styles.root), props)}
    >
      <span {...stylex.props(styles.value)}>
        <Code dir="ltr" {...stylex.props(styles.valueText)}>
          {value}
        </Code>
      </span>
      <Button
        aria-labelledby={buttonName}
        onClick={handleCopy}
        size="xs"
        variant="text"
      >
        <span {...stylex.props(styles.labels)}>
          <span
            aria-hidden={copied || undefined}
            id={copyId}
            {...stylex.props(styles.labelSlot, copied && styles.labelHidden)}
          >
            {copyLabel}
          </span>
          <span
            aria-hidden={!copied || undefined}
            id={copiedId}
            {...stylex.props(styles.labelSlot, !copied && styles.labelHidden)}
          >
            {copiedLabel}
          </span>
        </span>
      </Button>
      {/* The button's own label changes, but a label changing under a screen
          reader is not reliably announced. This is. `<output>` carries an
          implicit role of status, so it needs no role attribute of its own.
          Each write puts a new node in it, keyed by the count, since a second
          press inside the dwell otherwise left the text as it was and the
          region had nothing to announce. */}
      <output {...stylex.props(styles.announcement)}>
        {copied ? <span key={copy.count}>{copiedLabel}</span> : null}
      </output>
    </div>
  )
}

/**
 * Hands the call site the value it copied. What its handler throws is raised
 * on its own, outside the copy: it still reaches the page's error reporting,
 * where a rejection of the copy's own promise reached nothing but an
 * unhandled-rejection warning. Outside the component, since the React
 * Compiler compiles neither optional chaining nor a captured catch binding
 * inside a `try`.
 */
function reportCopied(
  onCopied: ((value: string) => void) | undefined,
  value: string,
) {
  if (onCopied === undefined) {
    return
  }
  try {
    onCopied(value)
  } catch (thrown) {
    queueMicrotask(() => {
      throw thrown
    })
  }
}

export type { CopyFieldProps }

export default CopyField
