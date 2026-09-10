import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Autocomplete from '.'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import Dialog from '../dialog'
import ListBox from '../list-box'
import Menu from '../menu'
import SearchField from '../search-field'
import Separator from '../separator'
import Text from '../text'

// See avatar/index.stories.tsx for why the overview is built from the
// library's own components, why its sections are divided by a rule, and why
// the headings go through Text's `render`.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

const styles = stylex.create({
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xxs,
  },
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    marginInline: 'auto',
    maxInlineSize: '960px',
    paddingBlockEnd: spacing.xxxl,
    paddingBlockStart: spacing.xl,
    paddingInline: spacing.xl,
  },
  // The command palette's own column: the search bar over its results, with
  // the dialog's padding removed so the rows run to its edges.
  palette: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  // A searchable list: the bar over the list on a surface of its own, which
  // is the shape the search page draws.
  surface: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    inlineSize: '320px',
    padding: spacing.sm,
  },
})

const PEOPLE = (
  <>
    <ListBox.Item id="ada" supporting="Supporting line">
      Ada Lovelace
    </ListBox.Item>
    <ListBox.Item id="grace" supporting="Supporting line">
      Grace Hopper
    </ListBox.Item>
    <ListBox.Item id="alan" supporting="Supporting line">
      Alan Turing
    </ListBox.Item>
  </>
)

const COMMANDS = (
  <>
    <Menu.Item id="open">Open file</Menu.Item>
    <Menu.Item id="save">Save file</Menu.Item>
    <Menu.Item id="close">Close file</Menu.Item>
  </>
)

const meta = {
  component: Autocomplete,
  title: 'Components/Autocomplete',
} satisfies Meta<typeof Autocomplete>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Autocomplete
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A search input that filters the collection under it.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            A searchable list
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The wrapper draws nothing of its own, so the bar and the list sit
            wherever the page puts them. Typing narrows the list; the arrow keys
            move through it while focus stays in the bar.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.surface)}>
            <Autocomplete>
              <SearchField label="Search people" placeholder="Search" />
              <ListBox aria-label="People" selectionMode="single">
                {PEOPLE}
              </ListBox>
            </Autocomplete>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            A filtered menu
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The same wrapper inside a menu, with the bar above its items. A menu
            long enough to need searching is the case this is for.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <Menu>
            <Button variant="outlined">Commands</Button>
            <Menu.Content>
              <Autocomplete>
                <SearchField label="Search commands" placeholder="Search" />
                {COMMANDS}
              </Autocomplete>
            </Menu.Content>
          </Menu>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            A command palette
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The same wrapper again, in a Dialog. Nothing here is a mode of the
            component — the three shapes differ only in what the page puts
            around the bar and the collection.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <Dialog>
            <Button variant="outlined">Open the palette</Button>
            <Dialog.Content aria-label="Commands">
              <Dialog.Body>
                <div {...stylex.props(styles.palette)}>
                  <Autocomplete>
                    <SearchField
                      label="Search commands"
                      placeholder="Type a command"
                    />
                    <ListBox aria-label="Commands" selectionMode="single">
                      <ListBox.Item id="open">Open file</ListBox.Item>
                      <ListBox.Item id="save">Save file</ListBox.Item>
                      <ListBox.Item id="close">Close file</ListBox.Item>
                    </ListBox>
                  </Autocomplete>
                </div>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.surface)}>
      <Autocomplete {...args}>
        <SearchField label="Search people" placeholder="Search" />
        <ListBox aria-label="People" selectionMode="single">
          {PEOPLE}
        </ListBox>
      </Autocomplete>
    </div>
  ),
}

// Filtered down to one, so a snapshot shows what searching does rather than
// what the list looks like before it starts.
const Filtered: Story = {
  args: { defaultInputValue: 'Ada' },
  render: Default.render,
}

const InAMenu: Story = {
  render: (args) => (
    <Menu defaultOpen>
      <Button variant="outlined">Commands</Button>
      <Menu.Content>
        <Autocomplete {...args}>
          <SearchField label="Search commands" placeholder="Search" />
          {COMMANDS}
        </Autocomplete>
      </Menu.Content>
    </Menu>
  ),
}

const CommandPalette: Story = {
  render: (args) => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Commands">
        <Dialog.Body>
          <div {...stylex.props(styles.palette)}>
            <Autocomplete {...args}>
              <SearchField
                label="Search commands"
                placeholder="Type a command"
              />
              <ListBox aria-label="Commands" selectionMode="single">
                <ListBox.Item id="open">Open file</ListBox.Item>
                <ListBox.Item id="save">Save file</ListBox.Item>
                <ListBox.Item id="close">Close file</ListBox.Item>
              </ListBox>
            </Autocomplete>
          </div>
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
}

export { CommandPalette, Default, Filtered, InAMenu, Overview }

export default meta
