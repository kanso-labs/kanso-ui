import type { Meta, StoryObj } from '@storybook/react-vite'
import type { MouseEvent } from 'react'

import * as stylex from '@stylexjs/stylex'
import { useCallback, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { expect } from 'storybook/test'

import ListDetail from '.'
import { breakpointModes } from '../../../.storybook/modes'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import Card from '../card'
import ListItem from '../list-item'
import Separator from '../separator'
import Text from '../text'

// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />

const ITEMS = ['First item', 'Second item', 'Third item']

const styles = stylex.create({
  // Narrower than the expanded breakpoint on any window, for the story that
  // shows the layout following its own width.
  narrow: {
    inlineSize: '520px',
    maxInlineSize: '100%',
  },
  // A dashed outline on each pane, so the panes are legible in a snapshot.
  // The component paints nothing itself — these are the story's, not its.
  paneOutline: {
    borderColor: colors.outlineVariant,
    borderRadius: radii.md,
    borderStyle: 'dashed',
    borderWidth: '1px',
    padding: spacing.md,
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
})

function DetailPane() {
  return (
    <div {...stylex.props(styles.paneOutline)}>
      <div {...stylex.props(styles.stack)}>
        <Text render={HEADING_2} variant="titleLarge">
          Headline
        </Text>
        <Text tone="muted" variant="bodyMedium">
          Supporting line
        </Text>
        <Separator />
        <Text tone="muted" variant="bodyMedium">
          The detail pane takes the flexible track, so it absorbs whatever the
          list does not.
        </Text>
      </div>
    </div>
  )
}

function ListPane() {
  return (
    <Card padding="none" variant="outlined">
      {ITEMS.map((label, index) => (
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

// The navigation the call site owns, as the component's example writes it.
// Choosing an item shows its detail and moves focus to the detail's heading,
// and Back shows the list again and moves focus to the item that opened it.
// `flushSync` commits the swap before each move, since a pane still hidden
// cannot take focus.
function Navigation() {
  const [chosen, setChosen] = useState(ITEMS[0])
  const [showing, setShowing] = useState<'detail' | 'list'>('list')
  const heading = useRef<HTMLElement>(null)
  const opener = useRef<HTMLElement>(null)

  const open = useCallback((label: string, event: MouseEvent<HTMLElement>) => {
    opener.current = event.currentTarget
    flushSync(() => {
      setChosen(label)
      setShowing('detail')
    })
    heading.current?.focus()
  }, [])

  const back = useCallback(() => {
    flushSync(() => {
      setShowing('list')
    })
    opener.current?.focus()
  }, [])

  return (
    <div {...stylex.props(styles.narrow)}>
      <ListDetail
        detail={
          // oxlint-disable-next-line react-perf/jsx-no-jsx-as-prop -- a pane takes a node, and this one shows the chosen item, so there is nothing to hoist; the React Compiler memoises it on its inputs
          <div {...stylex.props(styles.paneOutline)}>
            <div {...stylex.props(styles.stack)}>
              <div>
                <Button onPress={back} variant="text">
                  Back
                </Button>
              </div>
              <Text
                ref={heading}
                render={HEADING_2}
                tabIndex={-1}
                variant="titleLarge"
              >
                {chosen}
              </Text>
              <Text tone="muted" variant="bodyMedium">
                Supporting line
              </Text>
            </div>
          </div>
        }
        list={
          // oxlint-disable-next-line react-perf/jsx-no-jsx-as-prop -- as above, with the handler the rows share
          <Card padding="none" variant="outlined">
            {ITEMS.map((label, index) => (
              <NavigationRow
                index={index}
                key={label}
                label={label}
                onOpen={open}
              />
            ))}
          </Card>
        }
        showing={showing}
      />
    </div>
  )
}

// A row of the list in WithNavigation, pulled out so its handler is one
// stable reference per row. Inline in the map it would be a fresh closure per
// render, which is what react-perf's no-new-function-as-prop objects to.
function NavigationRow({
  index,
  label,
  onOpen,
}: {
  index: number
  label: string
  onOpen: (label: string, event: MouseEvent<HTMLElement>) => void
}) {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      onOpen(label, event)
    },
    [label, onOpen],
  )

  return (
    <div>
      {index === 0 ? null : <Separator />}
      <ListItem interactive onClick={handleClick} supporting="Supporting line">
        {label}
      </ListItem>
    </div>
  )
}

const meta = {
  args: {
    detail: <DetailPane />,
    list: <ListPane />,
  },
  component: ListDetail,
  // Chromatic captures the stories at the narrow arrangements too. The layout
  // answers to its own width, and a story gives it the window's, so one width
  // can only ever show one arrangement. These merge with the project's light
  // and dark rather than replacing them, so the wide arrangement is still
  // covered by the default snapshot — see .storybook/modes.ts.
  parameters: {
    chromatic: { modes: breakpointModes },
  },
  title: 'Components/ListDetail',
} satisfies Meta<typeof ListDetail>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// Its own story because below the expanded breakpoint it is a different
// layout rather than a differently-sized one — the list is gone, not narrower.
const ShowingDetail: Story = {
  args: {
    showing: 'detail',
  },
}

// The breakpoints are the layout's own width rather than the window's, so in
// a block narrower than the expanded breakpoint it shows one pane however wide
// the window is — as it would beside a navigation drawer or inside a sheet.
// One pane on every window, so the narrow window modes would only repeat it.
const NarrowContainer: Story = {
  parameters: {
    chromatic: {
      modes: { compact: { disable: true }, medium: { disable: true } },
    },
  },
  render: (args) => (
    <div {...stylex.props(styles.narrow)}>
      <ListDetail {...args} />
    </div>
  ),
}

// The call site's half of the layout: `showing` held in state, a row that
// shows the detail, and a Back button that shows the list again, with focus
// moved into whichever pane is revealed. In a block narrower than the
// expanded breakpoint, as NarrowContainer is, so the swap happens on every
// window, and for the same reason its narrow window modes are off.
//
// Driven from the keyboard, which is the reader the focus moves are for, so
// the ring the snapshot shows on the second row is where Back put focus.
const WithNavigation: Story = {
  parameters: NarrowContainer.parameters,
  play: async ({ canvas, userEvent }) => {
    const row = canvas.getByRole('button', { name: /^Second item/u })
    row.focus()
    await userEvent.keyboard('{Enter}')
    await expect(
      canvas.getByRole('heading', { name: 'Second item' }),
    ).toHaveFocus()

    await userEvent.tab({ shift: true })
    await expect(canvas.getByRole('button', { name: 'Back' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(row).toHaveFocus()
  },
  render: () => <Navigation />,
}

export { Default, NarrowContainer, ShowingDetail, WithNavigation }

export default meta
