import type { ReactNode } from 'react'
import type {
  DropZoneProps as RACDropZoneProps,
  FileTriggerProps as RACFileTriggerProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  DropZone as RACDropZone,
  FileTrigger as RACFileTrigger,
} from 'react-aria-components'

import { mergeStatefulStyles } from '../../styles/merge'
import { dropZoneStyles, rootStyles } from './styles'

// A place to drop files, and a button that opens the file picker. The design
// system carries no page for either — there is no drop target and no file
// input in it — so the drop target is drawn from the nearest thing it does
// carry, the outlined card: the same surface, the same 1dp outline-variant
// rule and the same medium corner.
//
// Two departures from that card, both this component's own.
//
// **The rule is dashed rather than solid.** A solid rule reads as a card,
// which is a thing that holds content; a dashed one reads as a place to put
// something, which is what this is. It is the one convention strong enough
// that drawing it as a card would be the surprising choice.
//
// **Dropping over it fills it.** The rule goes to the primary role and the
// surface to primary container, which is the same pair a selected list row
// takes — so "this is the target" looks the same here as "this is the one
// chosen" does elsewhere.
//
// **The label names the target rather than being composed into a name.**
// React Aria puts a visually hidden button inside and, given nothing, labels
// it `DropZone` — its own component name, untranslated, which is what a
// screen reader would then read out. Passing the label through as the
// button's `aria-label` and drawing the text as ordinary content is what
// makes the name the words the call site wrote and nothing else; React
// Aria's own label slot would compose the two and say both.
//
// `FileTrigger` is beside it rather than inside it, and that is React Aria's
// shape rather than a choice here: a file picker is useful on its own, with
// no drop target anywhere near it. It renders nothing but a hidden input, so
// it takes no `className` or `style` of its own — whatever it wraps is what
// is seen, and that is normally the library's Button.

type DropZoneProps = Omit<
  RACDropZoneProps,
  'children' | 'className' | 'style'
> & {
  /** What the target holds: its label, and whatever else it offers. */
  children?: ReactNode
  /** A function may compute the class from the target's render state. */
  className?: RACDropZoneProps['className']
  /**
   * What the target says it is for. Drawn inside it and used as its
   * accessible name, so a target with one needs no `aria-label`. A string
   * rather than a node, since it is what names the target; anything richer
   * goes in `children` beside it.
   */
  label?: string
  /** A function may compute the style from the target's render state. */
  style?: RACDropZoneProps['style']
}

type FileTriggerProps = RACFileTriggerProps

// What the target draws, from React Aria's render state. Written as a call
// rather than inline at the prop, which is what react-perf's
// no-new-function-as-prop is after; the React Compiler memoises the result
// on its inputs.
function content(children: ReactNode, label: string | undefined) {
  return (
    <>
      {label === undefined ? null : (
        <p {...stylex.props(dropZoneStyles.label)}>{label}</p>
      )}
      {children}
    </>
  )
}

/**
 * A place to drop files. What is dropped is React Aria's: `onDrop` is handed
 * the items, and `isFileDropItem`, `isDirectoryDropItem`, `isTextDropItem`
 * and `DIRECTORY_DRAG_TYPE` are exported from the package for reading them.
 *
 * ```tsx
 * <DropZone label="Drop here" onDrop={handleDrop}>
 *   <FileTrigger onSelect={handleSelect}>
 *     <Button variant="outlined">Label</Button>
 *   </FileTrigger>
 * </DropZone>
 * ```
 *
 * It is drawn from the outlined card, with a dashed rule rather than a solid
 * one, and fills with the primary container while something is over it.
 * `label` both draws the words and names the target; `aria-label` names it
 * without drawing anything, for a page that already says what it takes.
 *
 * The call site's `className` and `style` land on the target itself, which
 * is the element a layout positions.
 */
function DropZone({ children, label, ...props }: DropZoneProps) {
  return (
    <RACDropZone
      aria-label={props['aria-label'] ?? label}
      {...props}
      {...mergeStatefulStyles(rootStyles, props)}
    >
      {content(children, label)}
    </RACDropZone>
  )
}

/**
 * A button that opens the file picker. Wrap whatever should open it —
 * normally the library's Button — and take the files from `onSelect`.
 *
 * ```tsx
 * <FileTrigger acceptedFileTypes={['image/*']} onSelect={handleSelect}>
 *   <Button>Label</Button>
 * </FileTrigger>
 * ```
 *
 * It renders nothing of its own but the hidden input, so it takes no
 * `className` or `style`: what is seen is whatever it wraps. `allowsMultiple`
 * takes more than one file, `acceptDirectory` takes a folder, and
 * `defaultCamera` opens straight to a camera on a device that has one.
 */
function FileTrigger(props: FileTriggerProps) {
  return <RACFileTrigger {...props} />
}

export type { DropZoneProps, FileTriggerProps }

export { FileTrigger }

export default DropZone
