import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import AppBar from '../components/app-bar'
import Button from '../components/button'
import Checkbox from '../components/checkbox'
import Chip from '../components/chip'
import ColorSlider from '../components/color-slider'
import ComboBox from '../components/combo-box'
import Disclosure from '../components/disclosure'
import DropZone from '../components/drop-zone'
import IconButton from '../components/icon-button'
import Link from '../components/link'
import ListBox from '../components/list-box'
import Meter from '../components/meter'
import NavigationTree from '../components/navigation-tree'
import NumberField from '../components/number-field'
import ProgressIndicator from '../components/progress-indicator'
import RadioGroup, { Radio } from '../components/radio-group'
import SearchField from '../components/search-field'
import SegmentedButton from '../components/segmented-button'
import Select from '../components/select'
import Slider from '../components/slider'
import Switch from '../components/switch'
import Tabs from '../components/tabs'
import TextField from '../components/text-field'
import Tree from '../components/tree'
import { rippleStyles } from './ripple'

const REDUCE = 'prefers-reduced-motion: reduce'

// The two properties a duration can be spelled in. A component draws through
// one or the other, never both on one element, so each is read on its own.
const DURATIONS = ['animation-duration', 'transition-duration'] as const

/**
 * Whether a duration list holds no time at all.
 *
 * A list rather than a value: `transition-duration` repeats to cover every
 * property named beside it, so IconButton's two-step `0.2s, 0.2s` is one
 * declaration and has to read as one. `Number.parseFloat` is what makes `0s`
 * and `0ms` answer alike, and a `var()` the stylesheet has not resolved comes
 * back `NaN`, which is not zero — so an unresolved token reads as movement
 * rather than as stillness, which is the safe direction for this to fail in.
 */
function isStill(value: string) {
  return value.split(',').every((step) => Number.parseFloat(step) === 0)
}

/**
 * The duration `@media (prefers-reduced-motion: reduce)` gives `element` for
 * `property`, read out of the compiled stylesheet.
 *
 * Reading the rule is the only way to ask this. Chromium exposes the query
 * through `Emulation.setEmulatedMedia` alone, which is a page-level command
 * while Vitest runs every file as an iframe inside one shared page — so two
 * files driving it write one setting, and the send waits on whatever the whole
 * page is doing. src/styles/overlay-reduced-motion.test.tsx carries the same
 * walker for the four overlays, and src/field/forced-colors.test.tsx one for
 * the query beside this one.
 */
function reducedDuration(element: Element, property: string) {
  let found: string | undefined

  for (const sheet of document.styleSheets) {
    walk([...sheet.cssRules], false)
  }

  return found

  function walk(rules: CSSRule[], inReduce: boolean) {
    for (const rule of rules) {
      if (rule instanceof CSSMediaRule) {
        walk(
          [...rule.cssRules],
          inReduce || rule.conditionText.includes(REDUCE),
        )
        continue
      }

      if (rule instanceof CSSGroupingRule) {
        walk([...rule.cssRules], inReduce)
        continue
      }

      if (!inReduce || !(rule instanceof CSSStyleRule)) {
        continue
      }

      const value = rule.style.getPropertyValue(property)

      if (value === '' || !reaches(rule.selectorText)) {
        continue
      }

      found = value
    }
  }

  // StyleX writes one class per declaration and repeats it to raise
  // specificity, and it merges identical declarations from different modules
  // into one rule with several selectors — `.abc.abc, .def.def` — so each is
  // read on its own rather than the first standing for the list.
  function reaches(selectorText: string) {
    return selectorText.split(',').some((selector) => {
      const className = selector.trim().split(/[.:]/).find(Boolean)

      return className !== undefined && element.classList.contains(className)
    })
  }
}

/**
 * Every element under `root` that still moves for a reader who asked the OS
 * for less motion, described by what it animates and how long it takes.
 *
 * The resting duration is read off the element rather than out of the sheet:
 * the page is not in the reduced state, so what `getComputedStyle` resolves is
 * the resting value, already in seconds and with the token substituted.
 */
function stillMoving(root: ParentNode) {
  const found: string[] = []

  for (const element of root.querySelectorAll('*')) {
    const computed = getComputedStyle(element)

    for (const property of DURATIONS) {
      const resting = computed.getPropertyValue(property)

      if (isStill(resting)) {
        continue
      }

      const reduced = reducedDuration(element, property)

      if (reduced !== undefined && isStill(reduced)) {
        continue
      }

      const what =
        property === 'animation-duration'
          ? computed.animationName
          : computed.transitionProperty

      found.push(`<${element.localName}> ${what} over ${resting}`)
    }
  }

  return found
}

const OPTION = <ListBox.Item id="first">First item</ListBox.Item>

// One case per component that animates, rather than one per declaration: the
// walk visits every element the component renders, so a transition nobody
// listed here is still covered by the component that draws it.
const CASES: ReadonlyArray<{ element: ReactElement; name: string }> = [
  { element: <AppBar headline="Headline" />, name: 'AppBar' },
  // The ripple's opacity fade, which every pressable component draws through.
  { element: <Button>Label</Button>, name: 'Button' },
  // The box's own colours, and the 40dp state layer under them that Checkbox,
  // RadioGroup and Switch share.
  { element: <Checkbox>Label</Checkbox>, name: 'Checkbox' },
  { element: <Chip>Label</Chip>, name: 'Chip' },
  // The handle's elevation, shared with ColorArea and ColorWheel.
  {
    element: <ColorSlider channel="hue" defaultValue="hsl(200, 100%, 50%)" />,
    name: 'ColorSlider',
  },
  { element: <ComboBox label="Label" options={OPTION} />, name: 'ComboBox' },
  {
    element: (
      <Disclosure>
        <Disclosure.Header>Headline</Disclosure.Header>
        <Disclosure.Panel>Supporting line</Disclosure.Panel>
      </Disclosure>
    ),
    name: 'Disclosure',
  },
  { element: <DropZone label="Drop a file here" />, name: 'DropZone' },
  {
    element: <IconButton aria-label="Label">{null}</IconButton>,
    name: 'IconButton',
  },
  { element: <Link>Label</Link>, name: 'Link' },
  // The determinate line, shared with ProgressIndicator.
  { element: <Meter label="Label" value={40} />, name: 'Meter' },
  // Nested, because the chevron that turns is drawn for a row that opens
  // something and a leaf has none — a flat item passed this before it held a
  // child, which is the shape this whole file exists to catch.
  {
    element: (
      <NavigationTree aria-label="Label">
        <NavigationTree.Item href="#first" id="first" label="First item">
          <NavigationTree.Item href="#second" id="second" label="Second item" />
        </NavigationTree.Item>
      </NavigationTree>
    ),
    name: 'NavigationTree',
  },
  { element: <NumberField label="Label" />, name: 'NumberField' },
  // The determinate ring, whose arcs move on a transition of their own. Its
  // indeterminate presentations are left out on purpose — see the case below.
  {
    element: <ProgressIndicator label="Label" value={40} variant="circular" />,
    name: 'ProgressIndicator (determinate ring)',
  },
  {
    element: (
      <RadioGroup label="Label">
        <Radio value="first">Label</Radio>
      </RadioGroup>
    ),
    name: 'RadioGroup',
  },
  { element: <SearchField label="Label" />, name: 'SearchField' },
  {
    element: (
      <SegmentedButton aria-label="Label">
        <SegmentedButton.Segment id="first">First item</SegmentedButton.Segment>
      </SegmentedButton>
    ),
    name: 'SegmentedButton',
  },
  { element: <Select label="Label" options={OPTION} />, name: 'Select' },
  { element: <Slider defaultValue={40} label="Label" />, name: 'Slider' },
  { element: <Switch>Label</Switch>, name: 'Switch' },
  {
    element: (
      <Tabs defaultSelectedKey="first">
        <Tabs.List>
          <Tabs.Tab id="first">Label</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel id="first">First item</Tabs.Panel>
      </Tabs>
    ),
    name: 'Tabs',
  },
  // Every part of the field chrome that moves at once: the box, the label that
  // floats, the icons at its ends and the affixes beside the value.
  {
    element: (
      <TextField
        label="Label"
        leadingIcon={<span />}
        prefix="01"
        suffix="02"
        trailingIcon={<span />}
      />
    ),
    name: 'TextField',
  },
  // The outlined variant draws a second box the filled one does not.
  {
    element: <TextField label="Label" variant="outlined" />,
    name: 'TextField (outlined)',
  },
  // Nested for the same reason NavigationTree is.
  {
    element: (
      <Tree aria-label="Label">
        <Tree.Item headline="First item" id="first">
          <Tree.Item headline="Second item" id="second" />
        </Tree.Item>
      </Tree>
    ),
    name: 'Tree',
  },
]

describe('a component that animates', () => {
  it.each(CASES)(
    'stops $name for a reader who asked for less',
    ({ element }) => {
      const view = render(element)

      expect(stillMoving(view.container)).toEqual([])
    },
  )
})

describe('the ripple, whose fade is two styles rather than one', () => {
  // `pressed` sets a `transitionDuration` of its own, so the two states run at
  // different lengths — 105ms in against 375ms out — and only one of them is
  // ever on the element. What makes one branch cover both is that StyleX keys
  // a declaration by property *and* condition: `pressed` replaces the resting
  // class alone, and the branch `press` declares under the query is a separate
  // class it never names, so it survives the override.
  //
  // Pinned rather than reasoned about, because the opposite is just as
  // plausible from the outside — and if StyleX ever merges the two, this is
  // what says so.
  it.each([
    { name: 'at rest', styles: [rippleStyles.press] },
    { name: 'while held', styles: [rippleStyles.press, rippleStyles.pressed] },
  ])('stops fading $name', ({ styles }) => {
    const view = render(<span {...stylex.props(...styles)} />)

    expect(stillMoving(view.container)).toEqual([])
  })
})

describe('the walk itself', () => {
  // `[].every()` is true and `querySelectorAll` can answer nothing, so both
  // halves would report a clean library over a page with no transitions on it.
  // A component known to animate is what proves the walk can still speak.
  it('sees a transition at all', () => {
    const view = render(<Switch>Label</Switch>)
    const durations = [...view.container.querySelectorAll('*')].map(
      (element) => getComputedStyle(element).transitionDuration,
    )

    expect(durations.some((duration) => !isStill(duration))).toBe(true)
  })

  // The other half: an element the library never styled has to come back
  // clean, or `stillMoving` is reporting the page rather than the rule.
  it('passes an element with no transition on it', () => {
    const view = render(<span />)

    expect(stillMoving(view.container)).toEqual([])
  })
})
