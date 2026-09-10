// The page every story under Theming renders. Those files hold a scheme and
// nothing else — a title, the global that pins the toolbar to it, and the name
// this page reads its own header from — so anything that differs between two
// of them on screen can only be a token one of the schemes moved.
//
// The slots on AppBar, ListItem, ListDetail and SupportingPane all take nodes,
// so passing JSX to them is those components' API rather than a misuse of it —
// the same reason list-item/index.stories.tsx turns this off. react-perf guards
// against a fresh element identity defeating memoization, which the React
// Compiler this repo builds with already handles.
// oxlint-disable react-perf/jsx-no-jsx-as-prop

import * as stylex from '@stylexjs/stylex'
import { TokenFieldValue } from 'react-aria-components'

import type { DemoThemeName } from './themes'

import AppBar from '../components/app-bar'
import Autocomplete from '../components/autocomplete'
import Avatar from '../components/avatar'
import Breadcrumbs from '../components/breadcrumbs'
import Button from '../components/button'
import Card from '../components/card'
import Checkbox from '../components/checkbox'
import CheckboxGroup from '../components/checkbox-group'
import Chip from '../components/chip'
import ChipGroup from '../components/chip-group'
import Code from '../components/code'
import ComboBox from '../components/combo-box'
import Container from '../components/container'
import CopyField from '../components/copy-field'
import Currency from '../components/currency'
import Dialog from '../components/dialog'
import Disclosure from '../components/disclosure'
import DisclosureGroup from '../components/disclosure-group'
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
import NumberField from '../components/number-field'
import Popover from '../components/popover'
import ProductIcon from '../components/product-icon'
import ProgressIndicator from '../components/progress-indicator'
import RadioGroup, { Radio } from '../components/radio-group'
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
import Tabs from '../components/tabs'
import Tag from '../components/tag'
import Text from '../components/text'
import TextArea from '../components/text-area'
import TextField from '../components/text-field'
import TokenField from '../components/token-field'
import Toolbar from '../components/toolbar'
import Tooltip from '../components/tooltip'
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

const CARD_VARIANTS = ['elevated', 'filled', 'outlined'] as const

const ROWS = [
  { amount: 1240.5, name: 'Ada Lovelace', tone: 'primary' },
  { amount: -86.2, name: 'Grace Hopper', tone: 'secondary' },
  { amount: 0, name: 'Alan Turing', tone: 'tertiary' },
] as const

const TABS = ['First item', 'Second item', 'Third item'] as const

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

          <Separator />

          <section {...stylex.props(styles.section)}>
            <div {...stylex.props(styles.intro)}>
              <Text render={HEADING_2} variant="titleLarge">
                Actions
              </Text>
              <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
                Every variant reads its container off a colour role and its
                corner off the radius scale, so a scheme moves all of them at
                once. A chosen icon-button toggle takes a second pair of roles
                and rests at the squarer corner, and a toolbar puts a row of
                them on a surface of its own.
              </Text>
            </div>
            <div {...stylex.props(styles.row)}>
              <Button>Label</Button>
              <Button variant="tonal">Label</Button>
              <Button variant="outlined">Label</Button>
              <Button variant="text">Label</Button>
              <Button isDisabled>Label</Button>
              <Button isPending>Label</Button>
            </div>
            <div {...stylex.props(styles.row)}>
              <IconButton aria-label="Add">
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
              <Tooltip label="Supporting text">
                <Button variant="outlined">Hover for a tooltip</Button>
              </Tooltip>
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
              <Menu>
                <Button variant="outlined">Open a menu</Button>
                <Menu.Content>
                  <Menu.Item id="first">First item</Menu.Item>
                  <Menu.Item id="second">Second item</Menu.Item>
                  <Menu.Separator />
                  <Menu.Item id="third">Third item</Menu.Item>
                </Menu.Content>
              </Menu>
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
          </section>

          <Separator />

          <section {...stylex.props(styles.section)}>
            <div {...stylex.props(styles.intro)}>
              <Text render={HEADING_2} variant="titleLarge">
                Selection and status
              </Text>
              <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
                Chips, tags and a segmented button lean on the container roles,
                which is where a scheme's secondary and tertiary families show
                up; a checkbox and a radio button take primary once selected.
              </Text>
            </div>
            <div {...stylex.props(styles.row)}>
              <Chip>First item</Chip>
              <Chip defaultSelected>Second item</Chip>
              <Chip>Third item</Chip>
            </div>
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
            <CheckboxGroup defaultValue={SHOWCASE_SELECTION} label="Label">
              <Checkbox value="first">First item</Checkbox>
              <Checkbox value="second">Second item</Checkbox>
              <Checkbox isIndeterminate value="third">
                Third item
              </Checkbox>
            </CheckboxGroup>
            <RadioGroup defaultValue="second" label="Label">
              <Radio value="first">First item</Radio>
              <Radio value="second">Second item</Radio>
              <Radio value="third">Third item</Radio>
            </RadioGroup>
            <div {...stylex.props(styles.row)}>
              <Switch>Label</Switch>
              <Switch defaultSelected icon>
                Label
              </Switch>
            </div>
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
            <Meter label="Label" value={60} />
            <Meter label="Label" tone="negative" value={94} />
            <div {...stylex.props(styles.row)}>
              <Button onPress={showSnackbar} variant="tonal">
                Show a snackbar
              </Button>
              <Snackbar queue={SHOWCASE_MESSAGES} />
            </div>
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
          </section>

          <Separator />

          <section {...stylex.props(styles.section)}>
            <div {...stylex.props(styles.intro)}>
              <Text render={HEADING_2} variant="titleLarge">
                Identity
              </Text>
              <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
                A circle for a person and a rounded square for a thing, both
                tinted from a container/on-container pair.
              </Text>
            </div>
            <div {...stylex.props(styles.inline)}>
              {AVATAR_TONES.map((tone) => (
                <Avatar key={tone} name="Ada Lovelace" tone={tone} />
              ))}
              {AVATAR_TONES.map((tone) => (
                <ProductIcon key={tone} name="Label" tone={tone} />
              ))}
              <Avatar name="Grace Hopper" size="lg" />
              <ProductIcon name="Label" size="lg" />
            </div>
          </section>

          <Separator />

          <section {...stylex.props(styles.section)}>
            <div {...stylex.props(styles.intro)}>
              <Text render={HEADING_2} variant="titleLarge">
                Surfaces
              </Text>
              <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
                The three cards separate themselves by shadow, by a darker
                surface, and by a rule — one axis per variant, and a scheme can
                move any of them.
              </Text>
            </div>
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
          </section>

          <Separator />

          <section {...stylex.props(styles.section)}>
            <div {...stylex.props(styles.intro)}>
              <Text render={HEADING_2} variant="titleLarge">
                Rows
              </Text>
              <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
                An outlined card with no padding of its own is the bordered list
                container, so the rows keep their inset and the rules between
                them still span the full width. The selectable list draws the
                same row, with the selected one on primary container, and the
                list that toggles draws a checkbox on every one. A disclosure
                draws the same row as its header, and a group of them puts a
                rule between each pair.
              </Text>
            </div>
            <Card padding="none" variant="outlined">
              {ROWS.map(({ amount, name: person, tone }, index) => (
                <div key={person}>
                  {index === 0 ? null : <Separator />}
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
          </section>

          <Separator />

          <section {...stylex.props(styles.section)}>
            <div {...stylex.props(styles.intro)}>
              <Text render={HEADING_2} variant="titleLarge">
                Fields
              </Text>
              <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
                The filled field carries its own surface, a label that floats to
                the top once the field holds a value, and an underline that
                takes the primary role while focused, or the error role once
                there is a message.
              </Text>
            </div>
            <Form aria-label="Label">
              <Stack gap="md">
                <TextField defaultValue="" label="Label" />
                <TextField defaultValue="Label" label="Label" />
                <Select
                  defaultValue="second"
                  label="Label"
                  options={SHOWCASE_OPTIONS}
                />
                <ComboBox label="Label" options={SHOWCASE_OPTIONS} />
                <TokenField defaultValue={SHOWCASE_TOKENS} label="Label" />
                <Autocomplete>
                  <SearchField label="Label" placeholder="Search" />
                  <ListBox aria-label="Label" selectionMode="single">
                    {SHOWCASE_OPTIONS}
                  </ListBox>
                </Autocomplete>
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
                <TextArea
                  defaultValue={'First line.\nSecond line.\nThird line.'}
                  label="Label"
                />
                <TextField
                  defaultValue="Label"
                  label="Label"
                  variant="outlined"
                />
                <CopyField value="--kui-color-primary" />
                <NumberField defaultValue={1234.5} label="Label" />
                <SearchField label="Label" placeholder="Supporting text" />
                <Slider defaultValue={40} label="Label" />
              </Stack>
            </Form>
          </section>

          <Separator />

          <section {...stylex.props(styles.section)}>
            <div {...stylex.props(styles.intro)}>
              <Text render={HEADING_2} variant="titleLarge">
                Type and inline parts
              </Text>
              <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
                The scale, the tones, and the three parts that take their size
                from the text around them.
              </Text>
            </div>
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
            <div {...stylex.props(styles.row)}>
              <Link href="#">Label</Link>
              <Code>--kui-radius-md</Code>
              <Keycap>Esc</Keycap>
              <Currency currency="EUR" value={-42} />
            </div>
          </section>

          <Separator />

          <section {...stylex.props(styles.section)}>
            <div {...stylex.props(styles.intro)}>
              <Text render={HEADING_2} variant="titleLarge">
                Navigation
              </Text>
              <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
                The selected tab sits on a container of its own, and the
                indicator under the strip takes the primary role. A breadcrumb
                trail leans on the muted role, with the page you are on at full
                strength.
              </Text>
            </div>
            <Breadcrumbs aria-label="Label">
              <Breadcrumbs.Item href="#first">First item</Breadcrumbs.Item>
              <Breadcrumbs.Item href="#second">Second item</Breadcrumbs.Item>
              <Breadcrumbs.Item>Third item</Breadcrumbs.Item>
            </Breadcrumbs>
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
          </section>

          <Separator />

          <section {...stylex.props(styles.section)}>
            <div {...stylex.props(styles.intro)}>
              <Text render={HEADING_2} variant="titleLarge">
                Layouts
              </Text>
              <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
                Both lay down tracks and paint nothing, so what a scheme reaches
                here is the spacing between the panes rather than the panes
                themselves. The dashed outlines are the story's own.
              </Text>
            </div>
            <SupportingPane
              main={<MainContent />}
              supporting={<SupportingContent />}
            />
            <ListDetail detail={<DetailPane />} list={<ListPane />} />
          </section>
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
