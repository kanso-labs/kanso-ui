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

import type { DemoThemeName } from './themes'

import AppBar from '../components/app-bar'
import Avatar from '../components/avatar'
import Badge from '../components/badge'
import Button from '../components/button'
import Card from '../components/card'
import Chip from '../components/chip'
import Code from '../components/code'
import Container from '../components/container'
import CopyField from '../components/copy-field'
import Currency from '../components/currency'
import Feed from '../components/feed'
import IconButton from '../components/icon-button'
import Keycap from '../components/keycap'
import Link from '../components/link'
import ListDetail from '../components/list-detail'
import ListItem from '../components/list-item'
import Popover from '../components/popover'
import ProductIcon from '../components/product-icon'
import Separator from '../components/separator'
import Sheet from '../components/sheet'
import Stack from '../components/stack'
import SupportingPane from '../components/supporting-pane'
import Tabs from '../components/tabs'
import Text from '../components/text'
import TextField from '../components/text-field'
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
// starting at M3's own margin — see app-bar/index.stories.tsx.
const PAGE_GUTTER = spacing.xl
const PAGE_MEASURE = '1040px'

// The library ships no icons, so the page draws the ones it needs. Sized in
// `em` so each follows the font size its control sets.
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
const CLOSE_BUTTON = <IconButton aria-label="Close" />
const FILLED_BUTTON = <Button />
const OUTLINED_BUTTON = <Button variant="outlined" />
const TEXT_BUTTON = <Button variant="text" />

const styles = stylex.create({
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
          The main pane takes two thirds of the width from expanded up, and the
          whole of it below that.
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
                once.
              </Text>
            </div>
            <div {...stylex.props(styles.row)}>
              <Button>Label</Button>
              <Button variant="tonal">Label</Button>
              <Button variant="outlined">Label</Button>
              <Button variant="text">Label</Button>
              <Button isDisabled>Label</Button>
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
              <Sheet>
                <Sheet.Trigger render={OUTLINED_BUTTON}>
                  Open sheet
                </Sheet.Trigger>
                <Sheet.Content>
                  <Sheet.Header>
                    <Sheet.Title>Headline</Sheet.Title>
                    <Sheet.Close render={CLOSE_BUTTON}>
                      <CloseIcon />
                    </Sheet.Close>
                  </Sheet.Header>
                  <Sheet.Body>
                    <Text tone="muted" variant="bodyMedium">
                      The panel is portalled to the end of the body, and the
                      theme is set there as well as on the canvas — which is
                      what keeps it in the same scheme as the page behind it.
                    </Text>
                  </Sheet.Body>
                  <Sheet.Footer>
                    <Sheet.Close render={TEXT_BUTTON}>Cancel</Sheet.Close>
                    <Sheet.Close render={FILLED_BUTTON}>Confirm</Sheet.Close>
                  </Sheet.Footer>
                </Sheet.Content>
              </Sheet>
              <Popover>
                <Popover.Trigger render={OUTLINED_BUTTON}>
                  Open popover
                </Popover.Trigger>
                <Popover.Content>
                  <Popover.Title>Headline</Popover.Title>
                  <Popover.Description>
                    The panel is anchored to the control that opened it, and
                    takes its surface, corner and elevation from the same tokens
                    the page does.
                  </Popover.Description>
                  <Stack direction="row" gap="sm" justify="end">
                    <Popover.Close render={TEXT_BUTTON}>Dismiss</Popover.Close>
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
                Chips and badges lean on the container roles, which is where a
                scheme's secondary and tertiary families show up.
              </Text>
            </div>
            <div {...stylex.props(styles.row)}>
              <Chip>First item</Chip>
              <Chip defaultSelected>Second item</Chip>
              <Chip>Third item</Chip>
            </div>
            <div {...stylex.props(styles.row)}>
              {BADGE_TONES.map((tone) => (
                <Badge key={tone} tone={tone}>
                  Label
                </Badge>
              ))}
              {BADGE_TONES.map((tone) => (
                <Badge key={tone} tone={tone} variant="outlined">
                  Label
                </Badge>
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
                      <Badge>Label</Badge>
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
                them still span the full width.
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
          </section>

          <Separator />

          <section {...stylex.props(styles.section)}>
            <div {...stylex.props(styles.intro)}>
              <Text render={HEADING_2} variant="titleLarge">
                Fields
              </Text>
              <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
                The filled field carries its own surface and an underline that
                takes the primary role while focused, or the error role once
                there is a message.
              </Text>
            </div>
            <Stack gap="md">
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
              <CopyField value="--kui-color-primary" />
            </Stack>
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
                indicator under the strip takes the primary role.
              </Text>
            </div>
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
