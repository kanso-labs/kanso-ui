// The page every story under Theming renders. Those files hold a scheme and
// nothing else — a title, the global that pins the toolbar to it, and the name
// this page reads its own header from — so anything that differs between two
// of them on screen can only be a token one of the schemes moved.
//
// One section per component, named after the component and ordered by name, so
// the page is a list to look a component up in rather than a set of groups to
// guess a component's membership of. A section is written as `Section`, which
// draws the rule that divides it from the one above along with its headline,
// and a new component is a new `Section` in its alphabetical place.
//
// The bar at the top is AppBar's own entry rather than page chrome the list
// leaves out: its headline is the page's only <h1>, so a second one below
// would be a second first-level heading. Container, Form and Stack appear the
// same way, each in its place in the list, drawn around the dashed boxes the
// layouts use since none of the three paints anything itself.
//
// The slots on AppBar, ListItem, ListDetail and SupportingPane all take nodes,
// so passing JSX to them is those components' API rather than a misuse of it —
// the same reason list-item/index.stories.tsx turns this off. react-perf guards
// against a fresh element identity defeating memoization, which the React
// Compiler this repo builds with already handles.
// oxlint-disable react-perf/jsx-no-jsx-as-prop

import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'
import { TokenFieldValue } from 'react-aria-components'

import type { DemoThemeName } from './themes'

import AppBar from '../components/app-bar'
import Autocomplete from '../components/autocomplete'
import Avatar from '../components/avatar'
import Breadcrumbs from '../components/breadcrumbs'
import Button from '../components/button'
import Calendar from '../components/calendar'
import Card from '../components/card'
import Checkbox from '../components/checkbox'
import CheckboxGroup from '../components/checkbox-group'
import Chip from '../components/chip'
import ChipGroup from '../components/chip-group'
import Code from '../components/code'
import ColorArea from '../components/color-area'
import ColorField from '../components/color-field'
import ColorPicker from '../components/color-picker'
import ColorSlider from '../components/color-slider'
import ColorSwatch from '../components/color-swatch'
import ColorSwatchPicker from '../components/color-swatch-picker'
import ColorWheel from '../components/color-wheel'
import ComboBox from '../components/combo-box'
import Container from '../components/container'
import CopyField from '../components/copy-field'
import Currency from '../components/currency'
import DateField from '../components/date-field'
import DatePicker from '../components/date-picker'
import DateRangePicker from '../components/date-range-picker'
import Dialog from '../components/dialog'
import Disclosure from '../components/disclosure'
import DisclosureGroup from '../components/disclosure-group'
import DropZone, { FileTrigger } from '../components/drop-zone'
import Feed from '../components/feed'
import Form from '../components/form'
import IconButton from '../components/icon-button'
import Keycap from '../components/keycap'
import Link from '../components/link'
import List from '../components/list'
import ListBox from '../components/list-box'
import ListDetail from '../components/list-detail'
import ListItem from '../components/list-item'
import Menu from '../components/menu'
import Meter from '../components/meter'
import NavigationTree from '../components/navigation-tree'
import NumberField from '../components/number-field'
import Popover from '../components/popover'
import ProductIcon from '../components/product-icon'
import ProgressIndicator from '../components/progress-indicator'
import RadioGroup, { Radio } from '../components/radio-group'
import RangeCalendar from '../components/range-calendar'
import SearchField from '../components/search-field'
import SegmentedButton from '../components/segmented-button'
import Select from '../components/select'
import Separator from '../components/separator'
import Sheet from '../components/sheet'
import Slider from '../components/slider'
import Snackbar from '../components/snackbar'
import Stack from '../components/stack'
import SupportingPane from '../components/supporting-pane'
import Switch from '../components/switch'
import Table from '../components/table'
import Tabs from '../components/tabs'
import Tag from '../components/tag'
import Text from '../components/text'
import TextArea from '../components/text-area'
import TextField from '../components/text-field'
import TimeField from '../components/time-field'
import TokenField from '../components/token-field'
import Toolbar from '../components/toolbar'
import Tooltip from '../components/tooltip'
import Tree from '../components/tree'
import { CalendarDate, Time } from '../date'
import { SearchGlyph } from '../glyphs'
import { colors, radii, spacing } from '../tokens/design.tokens.stylex'
import { demoThemes } from './themes'

// See avatar/index.stories.tsx for why the page is built from the library's own
// components, why its sections are divided by a rule, and why the headings go
// through Text's `render`. The bar supplies the <h1>, so everything below it is
// an <h2>.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

// The measure the page runs at, and the gutter Container pads it with. The bar
// is told both so its row lines up with the content beneath it rather than
// starting at Material Design's own margin — see app-bar/index.stories.tsx.
const PAGE_GUTTER = spacing.xl
const PAGE_MEASURE = '1040px'

// The page draws the icons it needs, sized in `em` so each follows the font
// size its control sets.
function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="1em"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="1em"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="1em"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="1em"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      height="1em"
      viewBox="0 0 24 24"
      width="1em"
    >
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="1em"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="1em"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

// Hoisted for the same reason the heading template is: `render` takes an
// element, and react-perf rejects one built inline on every render.

const styles = stylex.create({
  // Sized in `em`, so a glyph takes the slot's own size.
  glyph: {
    blockSize: '1em',
    inlineSize: '1em',
  },
  // Bottom-aligned so a row of mixed heights still sits on one line, and
  // wrapping so a set too wide for the measure runs onto a second row rather
  // than making the page scroll sideways.
  inline: {
    alignItems: 'flex-end',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xxs,
  },
  page: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    paddingBlockEnd: spacing.xxxl,
  },
  panel: {
    paddingBlockStart: spacing.md,
  },
  // A dashed outline on each pane, so the tracks the layout components lay
  // down are legible in a snapshot. Neither paints anything itself.
  paneOutline: {
    borderColor: colors.outlineVariant,
    borderRadius: radii.md,
    borderStyle: 'dashed',
    borderWidth: '1px',
    boxSizing: 'border-box',
    padding: spacing.md,
  },
  row: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  // The plane takes the width it is given, so the page has to give it one.
  swatchPlane: {
    inlineSize: '200px',
  },
})

const AVATAR_TONES = [
  'primary',
  'secondary',
  'tertiary',
  'positive',
  'negative',
] as const

const BADGE_TONES = ['primary', 'positive', 'negative', 'neutral'] as const
// Hoisted so it is one stable array per render, which is what react-perf's
// no-new-array-as-prop is after.
// One queue for the page. A snackbar has no trigger of its own, so the page
// carries a button that shows one — the same shape Dialog and Sheet take
// here, where what the snapshot pins is the trigger rather than the surface.
const SHOWCASE_MESSAGES = new Snackbar.Queue()

// Built by a call rather than written inline at the prop, which is what
// react-perf's no-new-function-as-prop is after.
// The page shows what a removable chip looks like rather than what removing
// one does, so nothing is removed.
function showcaseRemove() {}

function showSnackbar() {
  SHOWCASE_MESSAGES.add('First item saved', {
    action: { label: 'Undo', onPress: () => {} },
  })
}

const SHOWCASE_OPTIONS = (
  <>
    <ListBox.Item id="first">First item</ListBox.Item>
    <ListBox.Item id="second">Second item</ListBox.Item>
    <ListBox.Item id="third">Third item</ListBox.Item>
  </>
)

const SHOWCASE_TOKENS = new TokenFieldValue([
  { text: 'First item', type: 'token' },
  { text: ' and ', type: 'text' },
  { text: 'Second item', type: 'token' },
])

const SHOWCASE_SELECTION = ['second']
// A palette that is the scheme's own roles rather than five fixed hexes
// would show nothing: a swatch's colour is its content, so these stay
// literal on purpose, and the chequer behind the transparent one is what
// follows the theme.
const SHOWCASE_SWATCHES = ['#6750A4', '#625B71', '#7D5260', '#386A20']
const SHOWCASE_TRANSPARENT = 'hsla(200, 100%, 50%, 0.4)'
// Hoisted, which is what react-perf's no-jsx-as-prop is after.
const SHOWCASE_FIELD_SWATCH = <ColorSwatch color={SHOWCASE_SWATCHES[0]} />

const CARD_VARIANTS = ['elevated', 'filled', 'outlined'] as const

const ROWS = [
  { amount: 1240.5, name: 'Ada Lovelace', tone: 'primary' },
  { amount: -86.2, name: 'Grace Hopper', tone: 'secondary' },
  { amount: 0, name: 'Alan Turing', tone: 'tertiary' },
] as const

// The table keys its rows by name rather than by position, so its selected
// row is named rather than taken from the list the other collections use.
const SHOWCASE_TABLE_SELECTION = [ROWS[1].name]

// A fixed date, so every scheme's snapshot reads the same whenever it is
// taken.
const SHOWCASE_DATE = new CalendarDate(2026, 9, 15)
const SHOWCASE_TIME = new Time(9, 30)
const SHOWCASE_RANGE = {
  end: new CalendarDate(2026, 9, 15),
  start: new CalendarDate(2026, 9, 8),
}

const TABS = ['First item', 'Second item', 'Third item'] as const

type PlaceholderProps = {
  /** The line the box holds, which is the only thing it draws. */
  children: ReactNode
}

type SectionProps = {
  /**
   * What the section shows: the component, in the states worth looking at.
   * AppBar is the one entry without it, since the bar it would draw is the
   * one already at the top of the page.
   */
  children?: ReactNode
  /** The sentence under the headline, saying what a scheme reaches here. */
  description: string
  /** The component's own name, which is all the headline is. */
  title: string
}

type ShowcaseProps = {
  /** Which scheme the page names — the same one its story pins the toolbar to. */
  name: DemoThemeName
}

function DetailPane() {
  return (
    <div {...stylex.props(styles.paneOutline)}>
      <Stack gap="sm">
        <Text variant="titleMedium">Headline</Text>
        <Text tone="muted" variant="bodyMedium">
          The detail pane takes the flexible track, so it absorbs whatever the
          list does not.
        </Text>
      </Stack>
    </div>
  )
}

function ListPane() {
  return (
    <Card padding="none" variant="outlined">
      {TABS.map((label, index) => (
        <div key={label}>
          {index === 0 ? null : <Separator />}
          <ListItem interactive supporting="Supporting line">
            {label}
          </ListItem>
        </div>
      ))}
    </Card>
  )
}

function MainContent() {
  return (
    <div {...stylex.props(styles.paneOutline)}>
      <Stack gap="sm">
        <Text variant="titleMedium">Headline</Text>
        <Text tone="muted" variant="bodyMedium">
          The main pane takes what the supporting pane leaves from expanded up,
          and the whole of the width below that.
        </Text>
      </Stack>
    </div>
  )
}

// The box the components that paint nothing are drawn around, so the tracks
// they lay down are legible in a snapshot. The outline is the page's own.
function Placeholder({ children }: PlaceholderProps) {
  return (
    <div {...stylex.props(styles.paneOutline)}>
      <Text tone="muted" variant="bodyMedium">
        {children}
      </Text>
    </div>
  )
}

// One component's entry. The rule is drawn here rather than written between
// two sections at the call site, so a section is one element and the page is
// the list of them.
function Section({ children, description, title }: SectionProps) {
  return (
    <section {...stylex.props(styles.section)}>
      <Separator />
      <div {...stylex.props(styles.intro)}>
        <Text render={HEADING_2} variant="titleLarge">
          {title}
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
          {description}
        </Text>
      </div>
      {children}
    </section>
  )
}

/**
 * One page, rendered identically by every story under Theming. Only the theme
 * around it changes, so anything that differs between two of them is something
 * a token moved.
 */
function Showcase({ name }: ShowcaseProps) {
  const { description, label } = demoThemes[name]

  return (
    <div {...stylex.props(styles.page)}>
      <AppBar
        contentInset={PAGE_GUTTER}
        contentMaxInlineSize={PAGE_MEASURE}
        headline="Headline"
        leading={
          <IconButton aria-label="Menu">
            <MenuIcon />
          </IconButton>
        }
        size="medium"
        subtitle="Supporting line"
        trailing={
          <IconButton aria-label="More">
            <MoreIcon />
          </IconButton>
        }
      />

      <Container maxInlineSize={PAGE_MEASURE}>
        <Stack gap="xl">
          <div {...stylex.props(styles.intro)}>
            <Text render={HEADING_2} variant="headlineSmall">
              {label}
            </Text>
            <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
              {description}
            </Text>
          </div>

          <Section
            description="The bar above is this component: a leading and a trailing icon button either side of the headline, on the surface role a scheme sets for the top of a page. It is drawn there rather than here because its headline is the page's only first-level heading."
            title="AppBar"
          />

          <Section
            description="A search field wired to a list box, so the filtering is the component and everything visible belongs to the two it holds."
            title="Autocomplete"
          >
            <Autocomplete>
              <SearchField label="Label" placeholder="Search" />
              <ListBox aria-label="Label" selectionMode="single">
                {SHOWCASE_OPTIONS}
              </ListBox>
            </Autocomplete>
          </Section>

          <Section
            description="A circle for a person, tinted from a container/on-container pair, at each tone and at both sizes."
            title="Avatar"
          >
            <div {...stylex.props(styles.inline)}>
              {AVATAR_TONES.map((tone) => (
                <Avatar key={tone} name="Ada Lovelace" tone={tone} />
              ))}
              <Avatar name="Grace Hopper" size="lg" />
            </div>
          </Section>

          <Section
            description="The trail leans on the muted role, with the page you are on at full strength."
            title="Breadcrumbs"
          >
            <Breadcrumbs aria-label="Label">
              <Breadcrumbs.Item href="#first">First item</Breadcrumbs.Item>
              <Breadcrumbs.Item href="#second">Second item</Breadcrumbs.Item>
              <Breadcrumbs.Item>Third item</Breadcrumbs.Item>
            </Breadcrumbs>
          </Section>

          <Section
            description="Every variant reads its container off a colour role and its corner off the radius scale, so a scheme moves all of them at once — the elevated button off its shadow scale as well."
            title="Button"
          >
            <div {...stylex.props(styles.row)}>
              <Button>Label</Button>
              <Button variant="tonal">Label</Button>
              <Button variant="elevated">Label</Button>
              <Button variant="outlined">Label</Button>
              <Button variant="text">Label</Button>
              <Button isDisabled>Label</Button>
              <Button isPending>Label</Button>
            </div>
          </Section>

          <Section
            description="The grid takes its type from the label scale, and the chosen day sits on the primary role."
            title="Calendar"
          >
            <Calendar aria-label="Label" defaultValue={SHOWCASE_DATE} />
          </Section>

          <Section
            description="The three variants separate themselves by shadow, by a darker surface, and by a rule — one axis per variant, and a scheme can move any of them."
            title="Card"
          >
            <Feed minItemWidth="260px">
              {CARD_VARIANTS.map((variant) => (
                <Card key={variant} variant={variant}>
                  <Stack gap="sm">
                    <Text variant="titleMedium">Headline</Text>
                    <Text tone="muted" variant="bodySmall">
                      Supporting line
                    </Text>
                    <div {...stylex.props(styles.row)}>
                      <Currency value={1240.5} />
                      <Tag>Label</Tag>
                    </div>
                  </Stack>
                </Card>
              ))}
            </Feed>
          </Section>

          <Section
            description="The box takes the outline role while empty and the primary pair once marked, and the indeterminate dash takes that same pair."
            title="Checkbox"
          >
            <div {...stylex.props(styles.row)}>
              <Checkbox>Label</Checkbox>
              <Checkbox defaultSelected>Label</Checkbox>
              <Checkbox isIndeterminate>Label</Checkbox>
              <Checkbox isDisabled>Label</Checkbox>
            </div>
          </Section>

          <Section
            description="A field label and its supporting text above a column of checkboxes, which is where a scheme's field chrome shows on a control with no box of its own."
            title="CheckboxGroup"
          >
            <CheckboxGroup defaultValue={SHOWCASE_SELECTION} label="Label">
              <Checkbox value="first">First item</Checkbox>
              <Checkbox value="second">Second item</Checkbox>
              <Checkbox isIndeterminate value="third">
                Third item
              </Checkbox>
            </CheckboxGroup>
          </Section>

          <Section
            description="A chip leans on the container roles, which is where a scheme's secondary family shows up; a selected one takes a pair of its own."
            title="Chip"
          >
            <div {...stylex.props(styles.row)}>
              <Chip>First item</Chip>
              <Chip defaultSelected>Second item</Chip>
              <Chip>Third item</Chip>
            </div>
          </Section>

          <Section
            description="The same chip under a field label, selectable and removable, with the remove control taking the chip's own text role."
            title="ChipGroup"
          >
            <ChipGroup
              defaultSelectedKeys={SHOWCASE_SELECTION}
              label="Label"
              onRemove={showcaseRemove}
              selectionMode="multiple"
            >
              <ChipGroup.Chip id="first">First item</ChipGroup.Chip>
              <ChipGroup.Chip id="second">Second item</ChipGroup.Chip>
              <ChipGroup.Chip id="third">Third item</ChipGroup.Chip>
            </ChipGroup>
          </Section>

          <Section
            description="An inline span on a surface of its own, sized from the text around it rather than from a step of the scale."
            title="Code"
          >
            <div {...stylex.props(styles.row)}>
              <Code>--kui-radius-md</Code>
            </div>
          </Section>

          <Section
            description="The plane's colour is its value rather than a role, so what a scheme reaches is the corner it is cut to and the ring around its thumb."
            title="ColorArea"
          >
            <div {...stylex.props(styles.swatchPlane)}>
              <ColorArea
                aria-label="Label"
                defaultValue={SHOWCASE_TRANSPARENT}
                xChannel="saturation"
                yChannel="lightness"
              />
            </div>
          </Section>

          <Section
            description="The text fields page's box holding a colour, so what a scheme reaches is the field chrome — the swatch beside it is the value rather than a role."
            title="ColorField"
          >
            <ColorField
              defaultValue={SHOWCASE_SWATCHES[0]}
              label="Label"
              leadingIcon={SHOWCASE_FIELD_SWATCH}
            />
          </Section>

          <Section
            description="The trigger is the one part a scheme reaches: its container and its label take the surface roles, while everything on the surface it opens carries a colour rather than a role."
            title="ColorPicker"
          >
            <div {...stylex.props(styles.row)}>
              <ColorPicker defaultValue={SHOWCASE_SWATCHES[0]} label="Label" />
            </div>
          </Section>

          <Section
            description="A hue track and an alpha track. The gradient is the value; the track's corner, and the chequer behind the alpha one, are the scheme's."
            title="ColorSlider"
          >
            <ColorSlider
              channel="hue"
              colorSpace="hsl"
              defaultValue={SHOWCASE_SWATCHES[0]}
              label="Label"
            />
            <ColorSlider
              channel="alpha"
              defaultValue={SHOWCASE_TRANSPARENT}
              label="Label"
            />
          </Section>

          <Section
            description="A swatch's colour is its content, so these stay literal on purpose — the chequer behind the transparent one is what follows the theme."
            title="ColorSwatch"
          >
            <div {...stylex.props(styles.row)}>
              <ColorSwatch color={SHOWCASE_SWATCHES[0]} />
              <ColorSwatch color={SHOWCASE_TRANSPARENT} />
            </div>
          </Section>

          <Section
            description="The chosen swatch takes its ring from the primary role, which is the one part of the picker a scheme moves."
            title="ColorSwatchPicker"
          >
            <ColorSwatchPicker
              aria-label="Label"
              defaultValue={SHOWCASE_SWATCHES[0]}
            >
              {SHOWCASE_SWATCHES.map((color) => (
                <ColorSwatchPicker.Item color={color} key={color} />
              ))}
            </ColorSwatchPicker>
          </Section>

          <Section
            description="The hue ring's colour is its value rather than a role, so what a scheme reaches is the ring's own thickness and the ring around its thumb."
            title="ColorWheel"
          >
            <ColorWheel defaultValue={SHOWCASE_TRANSPARENT} outerRadius={60} />
          </Section>

          <Section
            description="A text field that filters a list box, so it draws the field chrome and the popover surface at once."
            title="ComboBox"
          >
            <ComboBox label="Label" options={SHOWCASE_OPTIONS} />
          </Section>

          <Section
            description="It lays down a measure and a gutter and paints nothing, so what a scheme reaches here is the spacing. The page itself runs inside one."
            title="Container"
          >
            <Container maxInlineSize="360px">
              <Placeholder>
                The container centres its content on the measure it is given,
                and pads it by the margin the window's size asks for.
              </Placeholder>
            </Container>
          </Section>

          <Section
            description="A read-only field with the value it copies, so it draws the field's own surface and the button that sits in its trailing slot."
            title="CopyField"
          >
            <CopyField value="--kui-color-primary" />
          </Section>

          <Section
            description="An amount takes the positive or negative role from its sign, and tabular figures from the type scale, so a column of them lines up."
            title="Currency"
          >
            <div {...stylex.props(styles.row)}>
              <Currency value={1240.5} />
              <Currency currency="EUR" value={-42} />
              <Currency value={0} />
            </div>
          </Section>

          <Section
            description="Segments edited one at a time inside the box the text field draws, so the field's own chrome is what a scheme reaches."
            title="DateField"
          >
            <DateField defaultValue={SHOWCASE_DATE} label="Label" />
          </Section>

          <Section
            description="The same segments with a calendar behind a trigger, so the field chrome and the popover surface are drawn together."
            title="DatePicker"
          >
            <DatePicker defaultValue={SHOWCASE_DATE} label="Label" />
          </Section>

          <Section
            description="Two sets of segments in one box, with a range calendar on the panel the trigger opens."
            title="DateRangePicker"
          >
            <DateRangePicker defaultValue={SHOWCASE_RANGE} label="Label" />
          </Section>

          <Section
            description="A dialog is centred over the page and fills the window below the medium breakpoint. What the page pins is the trigger; the surface, the corner and the scrim behind it are the scheme's."
            title="Dialog"
          >
            <div {...stylex.props(styles.row)}>
              <Dialog>
                <Button variant="outlined">Open dialog</Button>
                <Dialog.Content>
                  <Dialog.Header>
                    <Dialog.Title>Headline</Dialog.Title>
                    <IconButton aria-label="Close" slot="close">
                      <CloseIcon />
                    </IconButton>
                  </Dialog.Header>
                  <Dialog.Body>
                    <Text tone="muted" variant="bodyMedium">
                      A dialog is centred over the page and fills the window
                      below the medium breakpoint, where the page draws its
                      full-screen dialog instead.
                    </Text>
                  </Dialog.Body>
                  <Dialog.Footer>
                    <Button slot="close" variant="text">
                      Cancel
                    </Button>
                    <Button slot="close" variant="text">
                      Confirm
                    </Button>
                  </Dialog.Footer>
                </Dialog.Content>
              </Dialog>
            </div>
          </Section>

          <Section
            description="The header draws the shared row with a caret that turns, and the panel takes the surface under it."
            title="Disclosure"
          >
            <Card padding="none" variant="outlined">
              <Disclosure defaultExpanded>
                <Disclosure.Header supporting="Supporting line">
                  First item
                </Disclosure.Header>
                <Disclosure.Panel>
                  <Text tone="muted" variant="bodyMedium">
                    Supporting line
                  </Text>
                </Disclosure.Panel>
              </Disclosure>
            </Card>
          </Section>

          <Section
            description="Several of those under one container, with a rule between each pair drawn from the same role the borders around them take."
            title="DisclosureGroup"
          >
            <Card padding="none" variant="outlined">
              <DisclosureGroup defaultExpandedKeys={SHOWCASE_SELECTION}>
                <Disclosure id="first">
                  <Disclosure.Header supporting="Supporting line">
                    First item
                  </Disclosure.Header>
                  <Disclosure.Panel>
                    <Text tone="muted" variant="bodyMedium">
                      Supporting line
                    </Text>
                  </Disclosure.Panel>
                </Disclosure>
                <Disclosure id="second">
                  <Disclosure.Header supporting="Supporting line">
                    Second item
                  </Disclosure.Header>
                  <Disclosure.Panel>
                    <Text tone="muted" variant="bodyMedium">
                      Supporting line
                    </Text>
                  </Disclosure.Panel>
                </Disclosure>
              </DisclosureGroup>
            </Card>
          </Section>

          <Section
            description="The outlined card's rule again, dashed, so a scheme that moves the card's rule moves the drop target with it."
            title="DropZone"
          >
            <DropZone label="Drop a file here">
              <FileTrigger>
                <Button variant="outlined">Label</Button>
              </FileTrigger>
            </DropZone>
          </Section>

          <Section
            description="A grid described by its cell rather than by its columns, which is what lets it reflow with the pane it sits in. It paints nothing, so what a scheme reaches is the gap between the cells."
            title="Feed"
          >
            <Feed minItemWidth="220px">
              <Placeholder>First item</Placeholder>
              <Placeholder>Second item</Placeholder>
              <Placeholder>Third item</Placeholder>
            </Feed>
          </Section>

          <Section
            description="A form draws nothing and lays nothing out: it hands the fields inside it their validation behaviour, and a message it reports lands in the field's own supporting text."
            title="Form"
          >
            <Form aria-label="Label">
              <Stack gap="md">
                <TextField defaultValue="Label" label="Label" />
                <TextField
                  defaultValue="Label"
                  error="Supporting line"
                  label="Label"
                />
              </Stack>
            </Form>
          </Section>

          <Section
            description="The button's variants again at the icon's own size. A chosen toggle takes a second pair of roles and rests at the squarer corner."
            title="IconButton"
          >
            <div {...stylex.props(styles.row)}>
              <IconButton aria-label="Add">
                <PlusIcon />
              </IconButton>
              <IconButton aria-label="Add" variant="outlined">
                <PlusIcon />
              </IconButton>
              <IconButton aria-label="Add" variant="tonal">
                <PlusIcon />
              </IconButton>
              <IconButton aria-label="Add" variant="filled">
                <PlusIcon />
              </IconButton>
              <IconButton aria-label="Add" defaultSelected={false}>
                <PlusIcon />
              </IconButton>
              <IconButton aria-label="Add" defaultSelected variant="tonal">
                <PlusIcon />
              </IconButton>
            </div>
          </Section>

          <Section
            description="A key drawn with a border and a rule under it, sized from the text around it rather than from a step of the scale."
            title="Keycap"
          >
            <div {...stylex.props(styles.row)}>
              <Keycap>Esc</Keycap>
            </div>
          </Section>

          <Section
            description="The primary role in running text, so a scheme that moves primary moves every link on the page with it."
            title="Link"
          >
            <div {...stylex.props(styles.row)}>
              <Link href="#">Label</Link>
            </div>
          </Section>

          <Section
            description="The shared row under selection, with a checkbox drawn on every one while the list toggles."
            title="List"
          >
            <Card padding="none" variant="outlined">
              <List
                aria-label="Label"
                defaultSelectedKeys={SHOWCASE_SELECTION}
                selectionMode="multiple"
              >
                <List.Item id="first" supporting="Supporting line">
                  First item
                </List.Item>
                <List.Item id="second" supporting="Supporting line">
                  Second item
                </List.Item>
                <List.Item id="third" supporting="Supporting line">
                  Third item
                </List.Item>
              </List>
            </Card>
          </Section>

          <Section
            description="The same row again with the selected one on primary container, which is the layer every selectable collection here draws from."
            title="ListBox"
          >
            <Card padding="none" variant="outlined">
              <ListBox
                aria-label="Label"
                defaultSelectedKeys={SHOWCASE_SELECTION}
                selectionMode="single"
              >
                <ListBox.Item id="first" supporting="Supporting line">
                  First item
                </ListBox.Item>
                <ListBox.Item id="second" supporting="Supporting line">
                  Second item
                </ListBox.Item>
                <ListBox.Item id="third" supporting="Supporting line">
                  Third item
                </ListBox.Item>
              </ListBox>
            </Card>
          </Section>

          <Section
            description="A list track beside a detail track, laid down and painted by neither, so what a scheme reaches is the spacing between them. The dashed outline is the page's own."
            title="ListDetail"
          >
            <ListDetail detail={<DetailPane />} list={<ListPane />} />
          </Section>

          <Section
            description="The row every list, menu and tree draws, with its leading, supporting and trailing slots filled. An outlined card with no padding of its own is the bordered container, so the rows keep their inset and the rules between them are inset to the leading edge of the text rather than to the card."
            title="ListItem"
          >
            <Card padding="none" variant="outlined">
              {ROWS.map(({ amount, name: person, tone }, index) => (
                <div key={person}>
                  {index === 0 ? null : <Separator inset="start" />}
                  <ListItem
                    interactive
                    leading={<Avatar name={person} size="sm" tone={tone} />}
                    supporting="Supporting line"
                    trailing={<Currency value={amount} />}
                  >
                    {person}
                  </ListItem>
                </div>
              ))}
            </Card>
          </Section>

          <Section
            description="Items on a popover surface, with a rule between the ones that belong apart. The trigger is a button placed directly inside it."
            title="Menu"
          >
            <div {...stylex.props(styles.row)}>
              <Menu>
                <Button variant="outlined">Open a menu</Button>
                <Menu.Content>
                  <Menu.Item id="first">First item</Menu.Item>
                  <Menu.Item id="second">Second item</Menu.Item>
                  <Menu.Separator />
                  <Menu.Item id="third">Third item</Menu.Item>
                </Menu.Content>
              </Menu>
            </div>
          </Section>

          <Section
            description="The tone recolours the active indicator alone, so a column of meters still shares one track."
            title="Meter"
          >
            <Meter label="Label" value={60} />
            <Meter label="Label" tone="negative" value={94} />
          </Section>

          <Section
            description="The route you are on sits on a container of its own, and each depth indents by the caret's own width."
            title="NavigationTree"
          >
            <Card padding="none" variant="outlined">
              <NavigationTree aria-label="Label" selectedRoute="#second">
                <NavigationTree.Item
                  href="#first"
                  id="first"
                  label="First item"
                >
                  <NavigationTree.Item
                    href="#second"
                    id="second"
                    label="Second item"
                  />
                </NavigationTree.Item>
                <NavigationTree.Item
                  href="#third"
                  id="third"
                  label="Third item"
                />
              </NavigationTree>
            </Card>
          </Section>

          <Section
            description="The text field's chrome around a value the field formats itself, in the tabular figures the type scale carries."
            title="NumberField"
          >
            <NumberField defaultValue={1234.5} label="Label" />
          </Section>

          <Section
            description="The panel is anchored to the control that opened it, and takes its surface, corner and elevation from the same tokens the page does. A hovered popover holds what a tooltip cannot: its own buttons and links stay reachable while the pointer is inside it."
            title="Popover"
          >
            <div {...stylex.props(styles.row)}>
              <Popover trigger="hover">
                <Button variant="outlined">Hover for a popover</Button>
                <Popover.Content>
                  <Popover.Title>Headline</Popover.Title>
                  <Popover.Description>
                    A hovered popover holds what a tooltip cannot: its own
                    buttons and links stay reachable while the pointer is inside
                    it.
                  </Popover.Description>
                </Popover.Content>
              </Popover>
              <Popover>
                <Button variant="outlined">Open popover</Button>
                <Popover.Content>
                  <Popover.Title>Headline</Popover.Title>
                  <Popover.Description>
                    The panel is anchored to the control that opened it, and
                    takes its surface, corner and elevation from the same tokens
                    the page does.
                  </Popover.Description>
                  <Stack direction="row" gap="sm" justify="end">
                    <Button slot="close" variant="text">
                      Dismiss
                    </Button>
                  </Stack>
                </Popover.Content>
              </Popover>
            </div>
          </Section>

          <Section
            description="A rounded square for a thing, tinted from the same container/on-container pairs the avatar takes."
            title="ProductIcon"
          >
            <div {...stylex.props(styles.inline)}>
              {AVATAR_TONES.map((tone) => (
                <ProductIcon key={tone} name="Label" tone={tone} />
              ))}
              <ProductIcon name="Label" size="lg" />
            </div>
          </Section>

          <Section
            description="The active indicator takes primary and the track its container, linear and circular alike."
            title="ProgressIndicator"
          >
            <ProgressIndicator label="Label" showValue value={60} />
            <div {...stylex.props(styles.row)}>
              <ProgressIndicator
                aria-label="Label"
                value={60}
                variant="circular"
              />
              <ProgressIndicator
                aria-label="Label"
                isIndeterminate
                variant="circular"
              />
            </div>
          </Section>

          <Section
            description="The ring takes the outline role while empty and primary once chosen, the same pair the checkbox draws."
            title="RadioGroup"
          >
            <RadioGroup defaultValue="second" label="Label">
              <Radio value="first">First item</Radio>
              <Radio value="second">Second item</Radio>
              <Radio value="third">Third item</Radio>
            </RadioGroup>
          </Section>

          <Section
            description="The days between the two ends sit on primary container, with the ends themselves on primary."
            title="RangeCalendar"
          >
            <RangeCalendar aria-label="Label" defaultValue={SHOWCASE_RANGE} />
          </Section>

          <Section
            description="The field with a glyph at its leading edge, which takes the same muted role the supporting text does."
            title="SearchField"
          >
            <SearchField label="Label" placeholder="Supporting text" />
          </Section>

          <Section
            description="One container for the whole strip, with the chosen segment on a pair of its own and a rule between each pair of segments."
            title="SegmentedButton"
          >
            <div {...stylex.props(styles.row)}>
              <SegmentedButton
                aria-label="Label"
                defaultSelectedKeys={SHOWCASE_SELECTION}
              >
                <SegmentedButton.Segment id="first">
                  First item
                </SegmentedButton.Segment>
                <SegmentedButton.Segment id="second">
                  Second item
                </SegmentedButton.Segment>
                <SegmentedButton.Segment id="third">
                  Third item
                </SegmentedButton.Segment>
              </SegmentedButton>
            </div>
          </Section>

          <Section
            description="A control that reads as a field with its options on a popover surface, so it draws both at once."
            title="Select"
          >
            <Select
              defaultValue="second"
              label="Label"
              options={SHOWCASE_OPTIONS}
            />
          </Section>

          <Section
            description="A rule is the same colour as a border, so it draws from the outline-variant role rather than one of its own. Full width, inset at the leading end, and inset at both."
            title="Separator"
          >
            <Card padding="none" variant="outlined">
              <ListItem>First item</ListItem>
              <Separator />
              <ListItem>Second item</ListItem>
              <Separator inset="start" />
              <ListItem>Third item</ListItem>
              <Separator inset="both" />
              <ListItem>Fourth item</ListItem>
            </Card>
          </Section>

          <Section
            description="The panel is portalled to the end of the body, and the theme is set there as well as on the canvas — which is what keeps it in the same scheme as the page behind it."
            title="Sheet"
          >
            <div {...stylex.props(styles.row)}>
              <Sheet>
                <Button variant="outlined">Open sheet</Button>
                <Sheet.Content>
                  <Sheet.Handle />
                  <Sheet.Header>
                    <Sheet.Title>Headline</Sheet.Title>
                    <IconButton aria-label="Close" slot="close">
                      <CloseIcon />
                    </IconButton>
                  </Sheet.Header>
                  <Sheet.Body>
                    <Text tone="muted" variant="bodyMedium">
                      The panel is portalled to the end of the body, and the
                      theme is set there as well as on the canvas — which is
                      what keeps it in the same scheme as the page behind it.
                    </Text>
                  </Sheet.Body>
                  <Sheet.Footer>
                    <Button slot="close">Confirm</Button>
                    <Button slot="close" variant="outlined">
                      Cancel
                    </Button>
                  </Sheet.Footer>
                </Sheet.Content>
              </Sheet>
            </div>
          </Section>

          <Section
            description="The filled half of the track takes primary and the rest its container, with the handle on primary again."
            title="Slider"
          >
            <Slider defaultValue={40} label="Label" />
          </Section>

          <Section
            description="A message on the inverse surface, which is the one place a scheme's inverse pair is drawn. It has no trigger of its own, so the page carries a button that shows one."
            title="Snackbar"
          >
            <div {...stylex.props(styles.row)}>
              <Button onPress={showSnackbar} variant="tonal">
                Show a snackbar
              </Button>
              <Snackbar queue={SHOWCASE_MESSAGES} />
            </div>
          </Section>

          <Section
            description="One direction, one gap off the spacing scale, and nothing painted, so what a scheme reaches is the step between the boxes. The dashed outlines are the page's own."
            title="Stack"
          >
            <Stack direction="row" gap="md">
              <Placeholder>First item</Placeholder>
              <Placeholder>Second item</Placeholder>
              <Placeholder>Third item</Placeholder>
            </Stack>
          </Section>

          <Section
            description="The main pane takes what the supporting pane leaves from expanded up, and the whole of the width below that. It lays down tracks and paints nothing; the dashed outlines are the page's own."
            title="SupportingPane"
          >
            <SupportingPane
              main={<MainContent />}
              supporting={<SupportingContent />}
            />
          </Section>

          <Section
            description="The track takes its container while off and primary once on, with the handle on the matching on-role."
            title="Switch"
          >
            <div {...stylex.props(styles.row)}>
              <Switch>Label</Switch>
              <Switch defaultSelected icon>
                Label
              </Switch>
            </div>
          </Section>

          <Section
            description="The one row here that is not the shared one — a run of cells rather than a headline with slots — but its hover, pressed and selected layers are written from the same tokens, so a selected table row and a selected list row cannot come apart under a scheme. Its value column is a plain sequence rather than a Currency: an amount's own colour role over a selected row's container is one colour family on top of another, and the pair is not guaranteed to be readable — it fails AA outright on Terminal and on Poster. Its first column takes a resize handle, which is the divider's own rule rather than a treatment of its own."
            title="Table"
          >
            <Card padding="none" variant="outlined">
              <Table
                aria-label="Label"
                defaultSelectedKeys={SHOWCASE_TABLE_SELECTION}
                selectionMode="multiple"
              >
                <Table.Header>
                  <Table.Column id="colSelect" selection />
                  <Table.Column id="colName" isRowHeader>
                    Label
                  </Table.Column>
                  <Table.Column id="colValue">Value</Table.Column>
                </Table.Header>
                <Table.Body>
                  {ROWS.map(({ name: person }, index) => (
                    <Table.Row id={person} key={person}>
                      <Table.Cell selection />
                      <Table.Cell>{person}</Table.Cell>
                      <Table.Cell>
                        {String(index + 1).padStart(2, '0')}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </Card>
          </Section>

          <Section
            description="The selected tab sits on a container of its own, and the indicator under the strip takes the primary role."
            title="Tabs"
          >
            <Tabs defaultSelectedKey="First item">
              <Tabs.List>
                {TABS.map((tab) => (
                  <Tabs.Tab id={tab} key={tab}>
                    {tab}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
              {TABS.map((tab) => (
                <Tabs.Panel key={tab} {...stylex.props(styles.panel)} id={tab}>
                  <Text tone="muted" variant="bodyMedium">
                    Supporting line
                  </Text>
                </Tabs.Panel>
              ))}
            </Tabs>
          </Section>

          <Section
            description="Filled and outlined at each tone, the filled one off a container pair and the outlined one off the rule the borders take."
            title="Tag"
          >
            <div {...stylex.props(styles.row)}>
              {BADGE_TONES.map((tone) => (
                <Tag key={tone} tone={tone}>
                  Label
                </Tag>
              ))}
              {BADGE_TONES.map((tone) => (
                <Tag key={tone} tone={tone} variant="outlined">
                  Label
                </Tag>
              ))}
            </div>
          </Section>

          <Section
            description="The scale and the tones, which is where a scheme's typeface and its semantic colour roles are read straight off."
            title="Text"
          >
            <Stack gap="sm">
              <Text variant="displaySmall">Headline</Text>
              <Text variant="headlineSmall">Headline</Text>
              <Text variant="titleLarge">Headline</Text>
              <Text variant="bodyLarge">Supporting line</Text>
              <Text variant="labelSmall">Label</Text>
            </Stack>
            <div {...stylex.props(styles.row)}>
              <Text tone="primary">Primary</Text>
              <Text tone="muted">Muted</Text>
              <Text tone="positive">Positive</Text>
              <Text tone="negative">Negative</Text>
              <Text tone="error">Error</Text>
            </div>
          </Section>

          <Section
            description="The field grown to several lines, which keeps the label floated and the underline the full width of the box."
            title="TextArea"
          >
            <TextArea
              defaultValue={'First line.\nSecond line.\nThird line.'}
              label="Label"
            />
          </Section>

          <Section
            description="The filled field carries its own surface, a label that floats to the top once the field holds a value, and an underline that takes the primary role while focused, or the error role once there is a message. The outlined one moves that rule to the whole box, with a notch where the label sits."
            title="TextField"
          >
            <Stack gap="md">
              <TextField defaultValue="" label="Label" />
              <TextField defaultValue="Label" label="Label" />
              <TextField
                defaultValue="01"
                description="Supporting line"
                label="Label"
                numeric
              />
              <TextField
                defaultValue="Label"
                error="Supporting line"
                label="Label"
              />
              <TextField
                characterCount
                defaultValue="Label"
                description="Supporting line"
                label="Label"
                leadingIcon={<SearchGlyph {...stylex.props(styles.glyph)} />}
                maxLength={20}
                suffix="Suffix"
              />
              <TextField
                defaultValue="Label"
                label="Label"
                variant="outlined"
              />
            </Stack>
          </Section>

          <Section
            description="The date field's segments again on a clock, inside the same box and the same chrome."
            title="TimeField"
          >
            <TimeField defaultValue={SHOWCASE_TIME} label="Label" />
          </Section>

          <Section
            description="Tokens sit on a container pair inside the field's own box, so a scheme moves the two independently."
            title="TokenField"
          >
            <TokenField defaultValue={SHOWCASE_TOKENS} label="Label" />
          </Section>

          <Section
            description="A row of icon buttons on a surface of its own, with a rule between the ones that belong apart."
            title="Toolbar"
          >
            <div {...stylex.props(styles.row)}>
              <Toolbar aria-label="Label">
                <IconButton aria-label="Add">
                  <PlusIcon />
                </IconButton>
                <IconButton aria-label="Add">
                  <PlusIcon />
                </IconButton>
                <Separator />
                <IconButton aria-label="Close">
                  <CloseIcon />
                </IconButton>
              </Toolbar>
            </div>
          </Section>

          <Section
            description="The inverse surface again, at the label size, anchored to the control it describes."
            title="Tooltip"
          >
            <div {...stylex.props(styles.row)}>
              <Tooltip label="Supporting text">
                <Button variant="outlined">Hover for a tooltip</Button>
              </Tooltip>
            </div>
          </Section>

          <Section
            description="The shared row again at two depths, with a caret on the row that opens and the caret's own width of indent under it."
            title="Tree"
          >
            <Card padding="none" variant="outlined">
              <Tree
                aria-label="Label"
                defaultExpandedKeys={SHOWCASE_SELECTION}
                defaultSelectedKeys={SHOWCASE_SELECTION}
                selectionMode="multiple"
              >
                <Tree.Item headline="First item" id="first" />
                <Tree.Item headline="Second item" id="second">
                  <Tree.Item headline="Third item" id="third" />
                </Tree.Item>
              </Tree>
            </Card>
          </Section>
        </Stack>
      </Container>
    </div>
  )
}

function SupportingContent() {
  return (
    <div {...stylex.props(styles.paneOutline)}>
      <Stack gap="sm">
        <Text variant="titleMedium">Headline</Text>
        <Text tone="muted" variant="bodySmall">
          Supporting line
        </Text>
      </Stack>
    </div>
  )
}

export type { ShowcaseProps }

export default Showcase
