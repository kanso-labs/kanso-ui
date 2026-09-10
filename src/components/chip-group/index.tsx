import type { ReactNode } from 'react'
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

import { chipStyles } from '../../chip/styles'
import { FieldLabel, FieldMessage } from '../../field'
import { invalidFrom } from '../../field/root'
import { CloseGlyph } from '../../glyphs'
import { mergeStatefulStyles, mergeStyles } from '../../styles/merge'
import { spacing, typography } from '../../tokens/design.tokens.stylex'

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
// focused chip too, which is React Aria's.
//
// **Selection is the group's, not each chip's.** `selectionMode` and
// `selectedKeys` live on the group, so a set that chooses one of its chips
// and a set that chooses several are the same component with a different
// word. A chip on its own that toggles nothing else is still Chip.
//
// One thing is worth knowing about how this maps onto React Aria. A chip's
// text value is read off its children and found only when they are a plain
// string, and a chip here is always an element — the label sits beside a
// close target. So a plain-string label is passed through as the text value,
// which is what typeahead and a screen reader's announcement are made of;
// see ListBox.Item, where the same thing bit.

const styles = stylex.create({
  label: {
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
  },
  // The chips wrap rather than scroll: a set is read all at once, and a row
  // that ran off the edge would hide the ones at the end.
  list: {
    boxSizing: 'border-box',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.sm,
    // The list is a collection React Aria focuses when it is empty, and the
    // chips inside draw their own rings.
    outlineStyle: 'none',
  },
  root: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
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
  /** A function may compute the style from the chip's render state. */
  style?: RACTagProps['style']
}

type ChipGroupProps<T extends object = object> = {
  /** The chips, each with an `id` of its own. */
  children?: ReactNode
  /**
   * A hint under the group. Replaced by `error` when there is one, so the
   * two never stack.
   */
  description?: string
  /**
   * The problem with the current selection, in words. Its presence is what
   * puts the group in its error state — the message and `aria-invalid` both
   * follow from it.
   */
  error?: string
  /**
   * What the group is for. Required rather than optional: a set of chips
   * with no name is a row a screen reader cannot introduce.
   */
  label: string
  /**
   * What the close target on each chip is called, for a screen reader. React
   * Aria adds the chip's own label after it, so this is the verb rather than
   * the whole phrase — "Remove" becomes "Remove First item".
   * @default 'Remove'
   */
  removeLabel?: string
} & Omit<RACTagGroupProps, 'children'> &
  Pick<RACTagListProps<T>, 'items' | 'renderEmptyState'>

// What the chip draws, from React Aria's render state. Built by a call rather
// than written inline at the prop, which is what react-perf's
// no-new-function-as-prop is after; the React Compiler memoises the result on
// its inputs.
//
// The close target is drawn only where the group allows removing, which React
// Aria reports rather than the call site saying so on every chip.
function chipContent(children: ReactNode, removeLabel: string) {
  return (state: TagRenderProps) => (
    <>
      {children}
      {state.allowsRemoving ? (
        <RACButton
          aria-label={removeLabel}
          slot="remove"
          {...stylex.props(chipStyles.remove)}
        >
          <CloseGlyph {...stylex.props(chipStyles.removeGlyph)} />
        </RACButton>
      ) : null}
    </>
  )
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
 * A chip that toggles nothing else is Chip; this is for a set that shares a
 * value.
 *
 * The call site's `className` and `style` land on the group as a whole,
 * which is the element a layout positions.
 */
// What each chip calls its close target. A context rather than a prop on the
// chip, since it is the group's decision and repeating it on every chip is
// how the two drift.
const RemoveLabelContext = createContext('Remove')

// Hoisted so neither is a new object on every render.
const LABEL_STATE_VALID = { isInvalid: false }
const LABEL_STATE_INVALID = { isInvalid: true }

function ChipGroup<T extends object = object>({
  children,
  description,
  error,
  items,
  label,
  removeLabel = 'Remove',
  renderEmptyState,
  ...props
}: ChipGroupProps<T>) {
  const invalid = invalidFrom(error)

  return (
    <RACTagGroup {...props} {...mergeStyles(stylex.props(styles.root), props)}>
      {/* React Aria's tag group has no disabled state of its own — a chip is
          disabled through the group's `disabledKeys` — so the label follows
          validity alone. */}
      <FieldLabel
        state={invalid ? LABEL_STATE_INVALID : LABEL_STATE_VALID}
        {...stylex.props(styles.label)}
      >
        {label}
      </FieldLabel>
      <RemoveLabelContext value={removeLabel}>
        <RACTagList<T>
          items={items}
          renderEmptyState={renderEmptyState}
          {...stylex.props(styles.list)}
        >
          {children}
        </RACTagList>
      </RemoveLabelContext>
      <FieldMessage description={description} error={error} inset={false} />
    </RACTagGroup>
  )
}

/**
 * One chip. Give every chip an `id` — that is the key selection and removal
 * are reported by.
 */
function ChipGroupChip({ children, ...props }: ChipGroupChipProps) {
  const removeLabel = useContext(RemoveLabelContext)

  return (
    <RACTag
      textValue={props.textValue ?? textOf(children)}
      {...props}
      {...mergeStatefulStyles(chipPropsFor, props)}
    >
      {chipContent(children, removeLabel)}
    </RACTag>
  )
}

// StyleX cannot target `[data-selected]` on the element it is styling, so a
// chip's state comes from the render state React Aria hands its className.
// Disabled is applied last so it wins over both containers, and StyleX
// replaces a property whole, so it takes their hover branches with it.
function chipPropsFor(state: TagRenderProps) {
  return stylex.props(
    chipStyles.base,
    state.isSelected ? chipStyles.selected : chipStyles.unselected,
    state.isDisabled && chipStyles.disabled,
    state.isDisabled &&
      (state.isSelected
        ? chipStyles.disabledSelected
        : chipStyles.disabledUnselected),
  )
}

// What the chip is worth as text, for the typeahead React Aria drives from a
// chip's words and for what a screen reader announces. It reads it off the
// children when they are a string and finds nothing when they are not — and a
// chip here is always an element once it can be removed. So a plain-string
// label becomes the text value, and anything else has to say what it is worth
// through `textValue`.
function textOf(children: ReactNode) {
  return typeof children === 'string' ? children : undefined
}

ChipGroup.Chip = ChipGroupChip

export type { ChipGroupChipProps, ChipGroupProps }

export default ChipGroup
