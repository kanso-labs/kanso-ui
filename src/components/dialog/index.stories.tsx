import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Dialog from '.'
import { CloseGlyph } from '../../glyphs'
import { spacing } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import IconButton from '../icon-button'
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
  // Sized in `em`, so the glyph takes the button's own icon size.
  glyph: {
    blockSize: '1em',
    inlineSize: '1em',
  },
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
    padding: spacing.xl,
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

const meta = {
  component: Dialog,
  title: 'Components/Dialog',
} satisfies Meta<typeof Dialog>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Dialog
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A modal centred over the page, which fills the window below the medium
          breakpoint.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            The parts
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A header holding the headline, a body that scrolls when it runs out
            of room, and a footer for the actions. A Button placed directly
            inside the dialog opens it, and one given slot=&quot;close&quot;
            anywhere inside closes it.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <Dialog>
            <Button variant="outlined">Open dialog</Button>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Headline</Dialog.Title>
                <IconButton aria-label="Close" slot="close">
                  <CloseGlyph {...stylex.props(styles.glyph)} />
                </IconButton>
              </Dialog.Header>
              <Dialog.Body>
                <Text tone="muted" variant="bodyMedium">
                  Supporting text explains what the dialog is asking, in as many
                  lines as it needs.
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
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Interrupting
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            role=&quot;alertdialog&quot; is for a question that has to be
            answered before the page carries on, which a screen reader announces
            rather than waiting to be asked. Pair it with
            isDismissable=&#123;false&#125;, so the answer has to come from one
            of the actions.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <Dialog>
            <Button variant="outlined">Open alert</Button>
            <Dialog.Content isDismissable={false} role="alertdialog">
              <Dialog.Header>
                <Dialog.Title>Headline</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text tone="muted" variant="bodyMedium">
                  Supporting text explains what happens either way.
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
      </section>
    </div>
  ),
}

const Default: Story = {
  render: () => (
    <Dialog defaultOpen>
      <Button variant="outlined">Open dialog</Button>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Headline</Dialog.Title>
          <IconButton aria-label="Close" slot="close">
            <CloseGlyph {...stylex.props(styles.glyph)} />
          </IconButton>
        </Dialog.Header>
        <Dialog.Body>
          <Text tone="muted" variant="bodyMedium">
            Supporting text explains what the dialog is asking, in as many lines
            as it needs.
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
  ),
}

const AlertDialog: Story = {
  render: () => (
    <Dialog defaultOpen>
      <Button variant="outlined">Open alert</Button>
      <Dialog.Content isDismissable={false} role="alertdialog">
        <Dialog.Header>
          <Dialog.Title>Headline</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Text tone="muted" variant="bodyMedium">
            Supporting text explains what happens either way.
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
  ),
}

export { AlertDialog, Default, Overview }

export default meta
