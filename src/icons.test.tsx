import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import IconButton from './components/icon-button'
import ListItem from './components/list-item'
import SegmentedButton from './components/segmented-button'
import TextField from './components/text-field'

// The README as text, so the sizes its Icons section promises can be checked
// against the sizes the components actually draw — the same `?raw` glob
// `readme.test.ts` reads it with.
const READMES = import.meta.glob('../README.md', {
  eager: true,
  import: 'default',
  query: '?raw',
})

const readme = Object.values(READMES)[0] ?? ''

// The size the README asks for, hoisted so it is one object rather than a new
// one per render. An inline `style` rather than StyleX, since that is what a
// consumer of the package has — the point of these cases is that the contract
// holds for an icon the library never touched.
const EM_SQUARE = { blockSize: '1em', inlineSize: '1em' }

// The drawn width of that icon, which is square, as a whole number of pixels.
function drawnSize(view: ReturnType<typeof render>) {
  const icon = view.container.querySelector('[data-icon]')
  if (!(icon instanceof SVGElement)) {
    throw new Error('expected the slot to draw the icon it was given')
  }
  return Math.round(icon.getBoundingClientRect().width)
}

// What the README tells a consumer to write: `aria-hidden`, `currentColor`,
// and a size of `1em` so the icon follows whatever font size the slot sets.
function Icon() {
  return (
    <svg
      aria-hidden="true"
      data-icon="true"
      fill="currentColor"
      style={EM_SQUARE}
      viewBox="0 0 24 24"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

// The Icons section, down to the next heading.
function iconsSection() {
  const start = readme.indexOf('### Icons')
  if (start === -1) {
    throw new Error('expected the README to carry an ### Icons section')
  }
  const rest = readme.slice(start + '### Icons'.length)
  const end = rest.search(/\n##+ /u)

  return end === -1 ? rest : rest.slice(0, end)
}

const BUTTON_SIZES = ['xs', 'md', 'lg', 'xl', 'xxl'] as const

// Hoisted so it is one stable element rather than a new one per render, which
// is what react-perf's no-jsx-as-prop is after. A slot takes a node, so the
// same node serves every case.
const ICON = <Icon />

describe('the icon sizing contract', () => {
  it('reads the README at all', () => {
    // An empty string would make the `toContain` cases below vacuous.
    expect(iconsSection().length).toBeGreaterThan(0)
  })

  // The three things the README asks of an icon are the three the slots rely
  // on, so the section has to keep asking for them.
  it('asks for the three things a slot relies on', () => {
    const section = iconsSection()

    expect(section).toContain('`aria-hidden`')
    expect(section).toContain('`currentColor`')
    expect(section).toContain('`1em`')
  })

  describe('a slot that owns the icon size', () => {
    it.each(BUTTON_SIZES)('sizes an icon button at %s', (size) => {
      const view = render(
        <IconButton aria-label="Label" size={size}>
          <Icon />
        </IconButton>,
      )

      // Named in the README's table, so a size that moved here fails there
      // too rather than leaving the page quietly wrong.
      expect(iconsSection()).toContain(`${drawnSize(view)}px`)
    })

    it("draws an icon button's five sizes as the README lists them", () => {
      const sizes = BUTTON_SIZES.map((size) => {
        const view = render(
          <IconButton aria-label="Label" size={size}>
            <Icon />
          </IconButton>,
        )
        const drawn = drawnSize(view)
        view.unmount()
        return `${drawn}px`
      })

      expect(iconsSection()).toContain(
        `${sizes.slice(0, -1).join(', ')} and ${sizes.at(-1)}`,
      )
    })

    it("sizes a field's icon, and the README says so", () => {
      const view = render(<TextField label="Label" leadingIcon={ICON} />)

      expect(drawnSize(view)).toBeGreaterThan(0)
      expect(iconsSection()).toContain(`${drawnSize(view)}px`)
    })

    it("sizes a segment's icon, and the README says so", () => {
      const view = render(
        <SegmentedButton aria-label="Label">
          <SegmentedButton.Segment icon={ICON} id="first">
            First item
          </SegmentedButton.Segment>
        </SegmentedButton>,
      )

      expect(drawnSize(view)).toBeGreaterThan(0)
      expect(iconsSection()).toContain(`${drawnSize(view)}px`)
    })
  })

  // A row sets no icon size, so an `em` icon there follows the text beside it
  // rather than an icon size. The README says so, and a consumer who believed
  // otherwise would draw a list icon at the headline's size.
  describe('a slot that does not', () => {
    it("leaves a row's icon at the size of the text beside it", () => {
      const view = render(<ListItem leading={ICON}>Headline</ListItem>)
      const row = view.getByText('Headline')

      expect(drawnSize(view)).toBe(
        Math.round(Number.parseFloat(getComputedStyle(row).fontSize)),
      )
    })

    it('warns that a row is different', () => {
      const section = iconsSection()

      expect(section).toContain('set no icon size')
      expect(section).toContain('a size of its own')
    })
  })
})
