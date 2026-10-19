'use client'

import type { ReactElement, ReactNode, RefAttributes } from 'react'
import type {
  TagGroupProps as RACTagGroupProps,
  TagListProps as RACTagListProps,
  TagProps as RACTagProps,
  TagRenderProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { createContext, useContext } from 'react'
import {
  Button as RACButton,
  Tag as RACTag,
  TagGroup as RACTagGroup,
  TagList as RACTagList,
} from 'react-aria-components'

import {
  chipGlyph,
  chipLabel,
  chipPropsFor,
  chipRemoveClassName,
} from '../../chip'
import { chipStyles } from '../../chip/styles'
import { textOf } from '../../collection/text'
import { FieldLabel, FieldMessage } from '../../field'
import { invalidFrom } from '../../field/root'
import { groupStyles } from '../../field/styles'
import { CloseGlyph } from '../../glyphs'
import { useRipple } from '../../hooks/useRipple'
import { focus } from '../../styles/focus'
import { mergeStatefulStyles, mergeStyles } from '../../styles/merge'
import { sizing, spacing } from '../../tokens/design.tokens.stylex'

// The chips page's filter and input chips as a set: one or more chosen from a
// row, each one removable. The pill is the chip module's in `src/chip`,
// shared with the standalone Chip, so the two cannot drift; what is here is
// the group around them.
//
// Three things it adds over a row of Chips.
//
// **It is a group, not a row of buttons.** React Aria's `TagGroup` names the
// set, describes it, reports it invalid as a whole, and moves between its
// chips with the arrow keys rather than making each one a tab stop — which
// is what a set of a dozen filters needs. The label, the supporting line and
// the error are the field chrome's, so a group reads like the fields beside
// it, exactly as CheckboxGroup and RadioGroup do.
//
// **A chip can be removed.** Give the group `onRemove` and each chip draws
// the page's trailing close target, an 18dp glyph in a target of its own so a
// press there removes rather than toggles. Backspace and Delete remove the
// focused chip too, which is React Aria's. A chosen chip's check sits at the
// other end, so a chip that is both selected and removable carries one glyph
// on each side of its label.
//
// **Selection is the group's, not each chip's.** `selectionMode` and
// `selectedKeys` live on the group, so a set that chooses one of its chips
// and a set that chooses several are the same component with a different
// word. A chip on its own that toggles nothing else is still Chip.
//
// **Escape leaves the selection alone.** React Aria's collections clear the
// selection on Escape and stop the key there, which suits a list whose
// selection is what an action is about to act on. A set of chips holds a
// value, as a checkbox group does, and usually sits in a Sheet, Dialog or
// Popover, where Escape is what dismisses it: clearing it there wiped the
// reader's filters and took a second press to close. So the group passes
// React Aria's `escapeKeyBehavior` as `none` unless told `clearSelection`.
//
// **A chip a press does nothing to does not look pressable.** In a group
// that selects nothing, a chip with no action of its own or the group's is
// a control only for its close target. It draws the arrow cursor, no layer
// and no ripple, and its close target keeps the pointer. A disabled chip's
// close target takes the chip's `not-allowed` with it.
//
// One thing is worth knowing about how this maps onto React Aria. A chip's
// text value is read off its children and found only when they are a plain
// string, and a chip here is always an element — the label sits beside a
// close target. So a plain-string label is passed through as the text value,
// which is what typeahead and a screen reader's announcement are made of;
// see ListBox.Item, where the same thing bit.

const styles = stylex.create({
  // The chips wrap rather than scroll: a set is read all at once, and a row
  // that ran off the edge would hide the ones at the end.
  //
  // The chips draw their own rings, and the list draws one only when it
  // holds focus itself — which it does once the last chip is removed, when
  // React Aria moves focus onto the empty list, or onto the empty state it
  // holds. That ring is `focus.ring`, the one a chip draws. And the list
  // keeps a chip's height when it empties, so removing the last chip leaves
  // what sits under the group where it was rather than drawing it up.
  list: {
    boxSizing: 'border-box',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.sm,
    minBlockSize: sizing.controlXs,
  },
})

type ChipGroupChipProps = Omit<
  RACTagProps,
  'children' | 'className' | 'style'
> & {
  /** The chip's label. */
  children?: ReactNode
  /** A function may compute the class from the chip's render state. */
  className?: RACTagProps['className']
  /**
   * An icon before the label, in the page's 18dp slot and the primary role.
   * The check takes its place while the chip is chosen, so the chip keeps
   * its width. An icon drawn in `em` takes its size from the slot.
   */
  icon?: ReactNode
  /** A function may compute the style from the chip's render state. */
  style?: RACTagProps['style']
}

type ChipGroupProps<T extends object = object> = {
  /**
   * The chips, each with an `id` of its own. With `items`, a function from an
   * item to its chip, which React Aria calls for each item in turn.
   */
  children?: ((item: T) => ReactElement) | ReactNode
  /**
   * A hint under the group. Replaced by `error` when there is one, so the
   * two never stack.
   */
  description?: string
  /**
   * The problem with the current selection, in words. Its presence is what
   * puts the group in its error state — the message and `aria-invalid` both
   * follow from it.
   *
   * Outside a `Form` the message line arrives with the message, so the
   * field grows when this does and moves what is under it. A `Form` holds
   * that space from the start; so does a permanent `description`.
   */
  error?: string
  /**
   * What Escape does on a chip. `none`, the default, keeps the selection and
   * lets the key through to whatever is around the group, so a group in a
   * Sheet, Dialog or Popover closes it on the first press. `clearSelection`
   * empties the selection first, as React Aria's own default does, and lets
   * a second press through.
   *
   * @default 'none'
   */
  escapeKeyBehavior?: 'clearSelection' | 'none'
  /**
   * What the group is for. Required rather than optional: a set of chips
   * with no name is a row a screen reader cannot introduce.
   */
  label: string
  /**
   * What the close target on each chip is called, for a screen reader. React
   * Aria adds the chip's own label after it, so this is the verb rather than
   * the whole phrase — "Remove" becomes "Remove First item". Left out, React
   * Aria names it in the reader's locale — "Remove" in English.
   */
  removeLabel?: string
} & Omit<RACTagGroupProps, 'children' | 'escapeKeyBehavior'> &
  Pick<RACTagListProps<T>, 'items' | 'renderEmptyState'>

// What the chip draws, from React Aria's render state. Built by a call rather
// than written inline at the prop, which is what react-perf's
// no-new-function-as-prop is after; the React Compiler memoises the result on
// its inputs.
//
// The check and the icon it replaces are the chip module's, so a chip in a
// group and a chip on its own draw the same ones. The close target is drawn
// only where the group allows removing, which React Aria reports rather than
// the call site saying so on every chip.
//
// The ripple is drawn only on a chip a press does something to, and not
// disabled: one the group lets be selected, or one with an action, its own
// or the group's. Any other chip in a group that selects nothing is a
// control only for its close target, and React Aria reports neither hover
// nor press on it, so a ripple there would answer a press that changes
// nothing. `acts` is the action half, which the render state does not carry.
//
// It sits in a box of its own carrying the chip's corner, since React Aria's
// cell between the chip and this content would otherwise hand the ripple a
// square one to inherit; see the header of src/chip/styles.ts.
function chipContent(
  children: ReactNode,
  icon: ReactNode,
  removeLabel: string | undefined,
  surface: ReactNode,
  acts: boolean,
) {
  return (state: TagRenderProps) => (
    <>
      {chipGlyph(state, icon, state.selectionMode !== 'none')}
      {chipLabel(children)}
      {(acts || state.selectionMode !== 'none') && !state.isDisabled ? (
        <span {...stylex.props(chipStyles.surfaceCorners)}>{surface}</span>
      ) : null}
      {state.allowsRemoving ? (
        <RACButton
          aria-label={removeLabel}
          className={chipRemoveClassName}
          slot="remove"
        >
          <CloseGlyph {...stylex.props(chipStyles.removeGlyph)} />
        </RACButton>
      ) : null}
    </>
  )
}

// What each chip calls its close target. A context rather than a prop on the
// chip, since it is the group's decision and repeating it on every chip is
// how the two drift. Undefined unless the group is given one, which leaves
// the name React Aria gives in the reader's locale.
const RemoveLabelContext = createContext<string | undefined>(undefined)

// Whether the group was given `onAction`, which makes every chip in it
// pressable whether or not it selects. A context for the reason the close
// target's name is one.
const GroupActionContext = createContext(false)

// Hoisted so neither is a new object on every render.
const LABEL_STATE_VALID = { isInvalid: false }
const LABEL_STATE_INVALID = { isInvalid: true }

// The pill of a chip with an action, which a press always reaches.
function actingChipPropsFor(state: TagRenderProps) {
  return chipPropsFor(state)
}

/**
 * A labelled set of chips, one or more of which can be chosen, each of which
 * can be removed. Selection is React Aria's: set `selectionMode` to `single`
 * or `multiple` and pass `selectedKeys` with `onSelectionChange` to control
 * it, or `defaultSelectedKeys` to let it keep its own.
 *
 * ```tsx
 * <ChipGroup label="Label" selectionMode="multiple" onRemove={remove}>
 *   <ChipGroup.Chip id="first">First item</ChipGroup.Chip>
 * </ChipGroup>
 * ```
 *
 * Give the group `onRemove` and each chip draws a close target. The arrow
 * keys move between chips, so a set of many is one tab stop rather than many.
 *
 * Escape on a chip keeps the selection and reaches whatever is around the
 * group, so a group in a Sheet, Dialog or Popover closes it. Pass
 * `escapeKeyBehavior="clearSelection"` for React Aria's own default, which
 * empties the selection on the first press and lets the second through.
 *
 * A chip that toggles nothing else is Chip; this is for a set that shares a
 * value.
 *
 * The call site's `className` and `style` land on the group as a whole,
 * which is the element a layout positions.
 */
function ChipGroup<T extends object = object>({
  children,
  description,
  error,
  escapeKeyBehavior = 'none',
  items,
  label,
  removeLabel,
  renderEmptyState,
  ...props
}: ChipGroupProps<T> & RefAttributes<HTMLDivElement>) {
  const invalid = invalidFrom(error)

  return (
    <RACTagGroup
      escapeKeyBehavior={escapeKeyBehavior}
      {...props}
      {...mergeStyles(stylex.props(groupStyles.root), props)}
    >
      {/* React Aria's tag group has no disabled state of its own — a chip is
          disabled through the group's `disabledKeys` — so the label follows
          validity alone. */}
      <FieldLabel
        state={invalid ? LABEL_STATE_INVALID : LABEL_STATE_VALID}
        variant="group"
      >
        {label}
      </FieldLabel>
      <RemoveLabelContext value={removeLabel}>
        <GroupActionContext value={props.onAction !== undefined}>
          <RACTagList<T>
            items={items}
            renderEmptyState={renderEmptyState}
            {...stylex.props(styles.list, focus.ring)}
          >
            {children}
          </RACTagList>
        </GroupActionContext>
      </RemoveLabelContext>
      <FieldMessage description={description} error={error} inset={false} />
    </RACTagGroup>
  )
}

/**
 * One chip. Give every chip an `id` — that is the key selection and removal
 * are reported by.
 */
function ChipGroupChip({
  children,
  icon,
  onContextMenu,
  onPointerCancel,
  onPointerDown,
  onPointerLeave,
  onPointerUp,
  ...props
}: ChipGroupChipProps & RefAttributes<HTMLDivElement>) {
  const removeLabel = useContext(RemoveLabelContext)
  // An action of its own, a link or the group's makes a chip pressable even
  // in a group that selects nothing, as React Aria treats it.
  const acts =
    useContext(GroupActionContext) ||
    props.onAction !== undefined ||
    props.href !== undefined
  // The press ripple a list's rows draw — see ListItem there. A chip in a
  // group is a collection row, whose clicks React Aria keeps for itself, so
  // the press ends when the pointer is released rather than on a click.
  const ripple = useRipple<HTMLDivElement>(
    true,
    {
      onContextMenu,
      onPointerCancel,
      onPointerDown,
      onPointerLeave,
      onPointerUp,
    },
    true,
  )

  return (
    <RACTag
      textValue={props.textValue ?? textOf(children)}
      {...ripple.handlers}
      {...props}
      {...mergeStatefulStyles(
        acts ? actingChipPropsFor : groupChipPropsFor,
        props,
      )}
    >
      {chipContent(children, icon, removeLabel, ripple.surface, acts)}
    </RACTag>
  )
}

// The pill a standalone Chip draws, from `src/chip`, touch target included:
// every chip's reaches halfway across the gap its rows wrap at.
// A chip's pill, inert where the group selects nothing — see the header.
function groupChipPropsFor(state: TagRenderProps) {
  return chipPropsFor(state, { inert: state.selectionMode === 'none' })
}

ChipGroup.Chip = ChipGroupChip

export type { ChipGroupChipProps, ChipGroupProps }

export { ChipGroupChip }

export default ChipGroup
