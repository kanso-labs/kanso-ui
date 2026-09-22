import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { expect, waitFor } from 'storybook/test'

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
            isDismissable=&#123;false&#125; and isKeyboardDismissDisabled, so
            the answer has to come from one of the actions: the first stops a
            press on the scrim closing it, and the second the Escape key.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <Dialog>
            <Button variant="outlined">Open alert</Button>
            <Dialog.Content
              isDismissable={false}
              isKeyboardDismissDisabled
              role="alertdialog"
            >
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

// The alert dialog, found from the document: it is portalled to the end of
// the body, outside the story's canvas.
function alertDialog() {
  return document.querySelector('[role="alertdialog"]')
}

const AlertDialog: Story = {
  // The story is the pattern a call site copies, so what it promises is
  // checked on the story itself: a question that has to be answered stays on
  // screen when Escape is pressed. React Aria keeps Escape and a press outside
  // on two separate props, and a story passing only the second documented an
  // alert dialog that closed on the first.
  play: async ({ userEvent }) => {
    await waitFor(async () => {
      await expect(alertDialog()).not.toBeNull()
    })
    // Escape reaches React Aria only from inside the dialog, so a press made
    // anywhere else would leave it open for a reason that proves nothing.
    await expect(alertDialog()?.contains(document.activeElement)).toBe(true)
    // And a dialog that is closing stays on screen until the animations on
    // it end, which the entry one has not yet: without this, the check below
    // passed on a dialog that Escape had already closed.
    for (const animation of document.getAnimations()) {
      animation.finish()
    }

    await userEvent.keyboard('{Escape}')

    await expect(alertDialog()).not.toBeNull()
  },
  render: () => (
    <Dialog defaultOpen>
      <Button variant="outlined">Open alert</Button>
      <Dialog.Content
        isDismissable={false}
        isKeyboardDismissDisabled
        role="alertdialog"
      >
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
