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
      const token = view.getByText('#first')
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
})
