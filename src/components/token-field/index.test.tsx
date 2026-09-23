import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { TokenFieldValue } from 'react-aria-components'
import { describe, expect, it } from 'vitest'

import TokenField from '.'
import { colors, typography } from '../../tokens/design.tokens.stylex'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for without
// depending on the browser having applied a rule these tests are the first
// thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  chip: { borderColor: colors.outlineVariant },
  error: { color: colors.error },
  floated: { fontSize: typography.bodySmallSize },
})

function classesOf(props: { className?: string | undefined }) {
  const classes = (props.className ?? '').split(' ').filter(Boolean)
  // An empty list would make every `every` below vacuously true, so it is a
  // broken assertion rather than a passing one.
  if (classes.length === 0) {
    throw new Error('expected the probe style to generate at least one class')
  }
  return classes
}

const CLASSES = {
  chip: classesOf(stylex.props(probeStyles.chip)),
  error: classesOf(stylex.props(probeStyles.error)),
  floated: classesOf(stylex.props(probeStyles.floated)),
}

// What counts as a token is the call site's, which is what subclassing the
// value is for: here, a word beginning with a hash.
class TaggedValue extends TokenFieldValue {
  protected override tokenize(text: string) {
    return text
      .split(/(#[\w-]+)/u)
      .filter((part) => part.length > 0)
      .map((part) =>
        part.startsWith('#')
          ? ({ text: part, type: 'token' } as const)
          : ({ text: part, type: 'text' } as const),
      )
  }
}

const EMPTY = new TokenFieldValue([])
const TAGGED = new TaggedValue([
  { text: '#first', type: 'token' },
  { text: ' and ', type: 'text' },
  { text: '#second', type: 'token' },
])

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

function setup(props: Partial<Parameters<typeof TokenField>[0]> = {}) {
  return render(<TokenField defaultValue={TAGGED} label="Label" {...props} />)
}

// The room the box leaves above its label and below what the control draws.
// Measured to the control's content edge rather than its border edge: a
// padding on the control itself is room under the tokens as surely as the
// box's own is, which is exactly what made the two add up.
function spacingOf(view: ReturnType<typeof render>) {
  const control = view.getByRole('textbox', { name: 'Label' })
  const box = control.parentElement?.parentElement
  if (!(box instanceof HTMLElement)) {
    throw new Error('expected the control to sit in a column in the box')
  }
  const boxBox = box.getBoundingClientRect()
  const controlBox = control.getBoundingClientRect()
  const padBelow = parseFloat(getComputedStyle(control).paddingBlockEnd)

  return {
    above: view.getByText('Label').getBoundingClientRect().top - boxBox.top,
    below: boxBox.bottom - (controlBox.bottom - padBelow),
    height: boxBox.height,
  }
}

describe('token field', () => {
  describe('semantics', () => {
    it('renders a text box named by its label', () => {
      const view = setup()
      expect(view.getByRole('textbox', { name: 'Label' })).not.toBeNull()
    })

    // The editable area cannot be an input: a token is an element, and an
    // input holds only text.
    it('draws an editable element rather than an input', () => {
      const view = setup()
      const box = view.getByRole('textbox', { name: 'Label' })
      expect(box.tagName).not.toBe('INPUT')
      expect(box.getAttribute('contenteditable')).toBe('true')
    })

    it('takes another role when asked', () => {
      const view = setup({ role: 'searchbox' })
      expect(view.getByRole('searchbox', { name: 'Label' })).not.toBeNull()
    })

    it('reports its disabled state', () => {
      const view = setup({ isDisabled: true })
      const box = view.getByRole('textbox', { name: 'Label' })
      expect(box.getAttribute('contenteditable')).not.toBe('true')
    })

    it('reports its read-only state', () => {
      const view = setup({ isReadOnly: true })
      expect(
        view
          .getByRole('textbox', { name: 'Label' })
          .getAttribute('aria-readonly'),
      ).toBe('true')
    })
  })

  describe('the value', () => {
    it('draws a pill for each token and text for the rest', () => {
      const view = setup()
      expect(view.getByText('#first')).not.toBeNull()
      expect(view.getByText('#second')).not.toBeNull()
      expect(
        view.getByRole('textbox', { name: 'Label' }).textContent,
      ).toContain('and')
    })

    // The pill is the chip module's, shared with Chip and ChipGroup, so a
    // token here and a chip elsewhere cannot drift.
    it('draws the tokens as the page pill', () => {
      const view = setup()
      // React Aria's token, the span the caret cannot enter, around the
      // label the pill cuts short.
      const token = view
        .getByText('#first')
        .closest<HTMLElement>('[contenteditable="false"]')
      if (token === null) {
        throw new Error('expected the text to sit in a token')
      }
      expect(hasClasses(token, CLASSES.chip)).toBe(true)
      expect(getComputedStyle(token).blockSize).toBe('32px')
      expect(getComputedStyle(token).borderTopLeftRadius).toBe('8px')
    })

    it('draws what renderToken returns instead of the token text', () => {
      const view = setup({ renderToken: (segment) => segment.text.slice(1) })
      expect(view.getByText('first')).not.toBeNull()
      expect(view.queryByText('#first')).toBeNull()
    })

    it('draws nothing in an empty field', () => {
      const view = setup({ defaultValue: EMPTY })
      expect(view.getByRole('textbox', { name: 'Label' }).textContent).toBe('')
    })
  })

  describe('the label', () => {
    // The chrome reads an input, a text area or a select to tell a populated
    // field from an empty one, and a token field is none of those — so it is
    // told, and without that the label sits over the value.
    it('floats once the field holds something', () => {
      const empty = setup({ defaultValue: EMPTY })
      expect(hasClasses(empty.getByText('Label'), CLASSES.floated)).toBe(false)
      empty.unmount()

      const held = setup()
      expect(hasClasses(held.getByText('Label'), CLASSES.floated)).toBe(true)
    })

    // A field that is typed into is checked in index.stories.tsx's `Typed`
    // instead. Nothing short of real keyboard input moves this component's
    // value — React Aria drives it from `beforeinput`'s target ranges, so a
    // dispatched event does nothing and `execCommand` edits the DOM without
    // the state hearing of it — and real input is a page-level resource that
    // times out under a parallel run, which is the same reason the media
    // queries in this suite are read rather than emulated.

    it('takes the error role when there is an error', () => {
      const view = setup({ error: 'Add at least one tag' })
      expect(hasClasses(view.getByText('Label'), CLASSES.error)).toBe(true)
    })
  })

  describe('supporting text', () => {
    // A token field is not a form control React Aria validates, so the error
    // it was given is what the message writes out — see FieldMessage.
    it('shows the error and hides the description', () => {
      const view = setup({
        description: 'Supporting line',
        error: 'Add at least one tag',
      })
      expect(view.getByText('Add at least one tag')).not.toBeNull()
      expect(view.queryByText('Supporting line')).toBeNull()
    })

    it('shows the description when there is no error', () => {
      const view = setup({ description: 'Supporting line' })
      expect(view.getByText('Supporting line')).not.toBeNull()
    })
  })

  // The box draws as much under the tokens as above the label, which is what
  // the chrome's multiline box gives TextArea and what it gives this once the
  // control stops adding room of its own on top of it.
  describe('the room around the tokens', () => {
    it('leaves as much under the tokens as above the label', () => {
      const { above, below } = spacingOf(setup())

      expect(below).toBe(above)
    })

    // The empty field is the case a margin above the control got wrong: the
    // clearance sat outside the control's own height, so the box grew past
    // what it drew and left the caret line high in it.
    it('leaves the same room with nothing in the field', () => {
      const { above, below } = spacingOf(setup({ defaultValue: EMPTY }))

      expect(below).toBe(above)
    })

    // An empty field is no taller than one holding a line of tokens, which a
    // box sized from something other than its content would not hold to.
    // Measured one at a time: the queries reach the whole document, so two
    // fields on screen at once would find each other's control.
    it('is no taller empty than it is full', () => {
      const emptyView = setup({ defaultValue: EMPTY })
      const empty = spacingOf(emptyView).height
      emptyView.unmount()

      expect(empty).toBeLessThanOrEqual(spacingOf(setup()).height)
    })
  })
})
