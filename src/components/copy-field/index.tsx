import type { HTMLAttributes } from 'react'

import * as stylex from '@stylexjs/stylex'
import { useCallback, useEffect, useRef, useState } from 'react'

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
  root: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.outline,
    borderRadius: radii.sm,
    borderStyle: 'solid',
    borderWidth: '1px',
    display: 'flex',
    gap: spacing.sm,
    paddingBlock: spacing.xs,
    paddingInline: spacing.md,
  },
  // These sit on a wrapper rather than on the Code itself, because Code
  // spreads its own styles after the props it is given — a className handed
  // to it loses. `minInlineSize: 0` is the load-bearing one: left at `auto`, a
  // long unbroken value sets the flex row's floor and pushes the button out of
  // the box instead of wrapping.
  value: {
    flexGrow: 1,
    fontSize: typography.bodySmallSize,
    minInlineSize: 0,
  },
})

type CopyFieldProps = {
  /**
   * What the button says once the value has been copied. It reverts to
   * `copyLabel` on its own after a couple of seconds.
   * @default 'Copied'
   */
  copiedLabel?: string
  /**
   * What the button says at rest.
   * @default 'Copy'
   */
  copyLabel?: string
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
  /** The text shown, and the text copied. */
  value: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>

/**
 * A value to be read and taken away — a repository URL, a token, a command.
 * It shows the value in the mono face and copies it on request, confirming
 * on the button itself.
 */
function CopyField({
  copiedLabel = 'Copied',
  copyLabel = 'Copy',
  onCopied,
  value,
  ...props
}: CopyFieldProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

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
      } catch {
        // A clipboard write is refused outside a secure context and wherever
        // the permission is denied, and neither is something the call site can
        // fix. Staying at rest is the honest report: the value is not on the
        // clipboard, so the control must not claim it is.
        setCopied(false)
        return
      }
      setCopied(true)
      onCopied?.(value)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        setCopied(false)
      }, COPIED_RESET_MS)
    }
    void write()
  }, [onCopied, value])

  return (
    <div {...props} {...stylex.props(styles.root)}>
      <span {...stylex.props(styles.value)}>
        <Code>{value}</Code>
      </span>
      <Button onClick={handleCopy} size="xs" variant="text">
        {copied ? copiedLabel : copyLabel}
      </Button>
      {/* The button's own label changes, but a label changing under a screen
          reader is not reliably announced. This is. `<output>` carries an
          implicit role of status, so it needs no role attribute of its own. */}
      <output {...stylex.props(styles.announcement)}>
        {copied ? copiedLabel : ''}
      </output>
    </div>
  )
}

export type { CopyFieldProps }

export default CopyField
