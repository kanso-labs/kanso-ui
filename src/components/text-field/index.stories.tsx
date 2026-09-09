import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import TextField from '.'
import { CloseGlyph, SearchGlyph } from '../../glyphs'
import { spacing } from '../../tokens/design.tokens.stylex'
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
  // A field fills its container, so the samples need a width to fill. Two
  // side by side is also what shows that a field with a message below it does
  // not shift the one beside it.
  columns: {
    display: 'grid',
    gap: spacing.lg,
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  // Sized in `em`, so the icon takes the slot's 24.
  icon: {
    blockSize: '1em',
    inlineSize: '1em',
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
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

// The library's own glyphs stand in for an icon set, so the stories stay a
// demonstration of the field alone.
const LEADING_ICON = <SearchGlyph {...stylex.props(styles.icon)} />
const TRAILING_ICON = <CloseGlyph {...stylex.props(styles.icon)} />

const meta = {
  args: {
    defaultValue: 'Value',
    label: 'Label',
  },
  component: TextField,
  title: 'Components/TextField',
} satisfies Meta<typeof TextField>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          TextField
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A filled field: a tinted box, a label that floats to the top once the
          field is focused or holds a value, and an underline that carries the
          focus and error states.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            States
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Focus and error are both drawn on the underline, as an inset shadow
            rather than a border that thickens — a border growing from 1px to
            2px would push everything below the field down by a pixel each time
            focus arrived.
          </Text>
        </div>
        <div {...stylex.props(styles.columns)}>
          <TextField defaultValue="" label="Empty" />
          <TextField defaultValue="Value" label="Label" />
          <TextField
            defaultValue="Value"
            description="Supporting line"
            label="With a description"
          />
          <TextField
            defaultValue=""
            error="Enter a value."
            label="With an error"
          />
          <TextField defaultValue="Value" isDisabled label="Disabled" />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Label
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The label rests in the middle of an empty field and floats to the
            top once the field is focused or holds a value. Pass
            floatingLabel=&#123;false&#125; to keep it small at the top in every
            state, for a form whose fields are read as a column of labels.
          </Text>
        </div>
        <div {...stylex.props(styles.columns)}>
          <TextField defaultValue="" label="Floating" />
          <TextField defaultValue="" floatingLabel={false} label="Fixed" />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Outlined
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The page&apos;s other field: no fill, an outline that thickens and
            takes the primary role while focused, and a label that moves up onto
            the outline and cuts it. Everything else — the message, the icons,
            the affixes, the counter — is the same.
          </Text>
        </div>
        <div {...stylex.props(styles.columns)}>
          <TextField defaultValue="" label="Empty" variant="outlined" />
          <TextField defaultValue="Value" label="Label" variant="outlined" />
          <TextField
            defaultValue="Value"
            description="Supporting line"
            label="With a description"
            variant="outlined"
          />
          <TextField
            defaultValue=""
            error="Enter a value."
            label="With an error"
            variant="outlined"
          />
          <TextField
            defaultValue="Value"
            isDisabled
            label="Disabled"
            variant="outlined"
          />
          <TextField
            defaultValue=""
            floatingLabel={false}
            label="Fixed label"
            variant="outlined"
          />
          <TextField
            defaultValue="Value"
            label="With icons"
            leadingIcon={LEADING_ICON}
            trailingIcon={TRAILING_ICON}
            variant="outlined"
          />
          <TextField
            characterCount
            defaultValue="Value"
            label="With a counter"
            maxLength={20}
            suffix="Suffix"
            variant="outlined"
          />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Icons
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A leading icon says what the field is for and a trailing one what
            can be done with it. Both are 24 in the muted role, 12 from the
            box&apos;s edge; the trailing one takes the error colour with the
            rest of the field.
          </Text>
        </div>
        <div {...stylex.props(styles.columns)}>
          <TextField
            defaultValue=""
            label="Leading"
            leadingIcon={LEADING_ICON}
          />
          <TextField
            defaultValue="Value"
            label="Trailing"
            trailingIcon={TRAILING_ICON}
          />
          <TextField
            defaultValue="Value"
            label="Both"
            leadingIcon={LEADING_ICON}
            trailingIcon={TRAILING_ICON}
          />
          <TextField
            defaultValue=""
            error="Enter a value."
            label="With an error"
            leadingIcon={LEADING_ICON}
            trailingIcon={TRAILING_ICON}
          />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Prefix and suffix
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Text on the value&apos;s line that is not part of the value: a unit,
            a currency, a domain. Under a floating label they show once the
            field is focused or holds a value, since the label rests on their
            line until then.
          </Text>
        </div>
        <div {...stylex.props(styles.columns)}>
          <TextField defaultValue="Value" label="Prefix" prefix="Prefix" />
          <TextField defaultValue="Value" label="Suffix" suffix="Suffix" />
          <TextField defaultValue="" label="Empty" prefix="Prefix" />
          <TextField
            defaultValue=""
            floatingLabel={false}
            label="Fixed label"
            prefix="Prefix"
            suffix="Suffix"
          />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Character counter
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The count of characters against maxLength, at the end of the
            supporting line and opposite the description or the error, in
            tabular figures so it does not jitter.
          </Text>
        </div>
        <div {...stylex.props(styles.columns)}>
          <TextField
            characterCount
            defaultValue="Value"
            label="Counter"
            maxLength={20}
          />
          <TextField
            characterCount
            defaultValue="Value"
            description="Supporting line"
            label="With a description"
            maxLength={20}
          />
          <TextField
            characterCount
            defaultValue="Value"
            error="Enter a value."
            label="With an error"
            maxLength={20}
          />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Numeric
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The mono face with tabular figures, so digits are one width and a
            column of values lines up. The label and the box are unchanged —
            only the value's face differs.
          </Text>
        </div>
        <div {...stylex.props(styles.columns)}>
          <TextField defaultValue="01234.56" label="Default" />
          <TextField defaultValue="01234.56" label="Numeric" numeric />
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

// The resting label, which no populated story can show.
const Empty: Story = {
  args: {
    defaultValue: '',
  },
}

// The label held small at the top whatever the field holds.
const FixedLabel: Story = {
  args: {
    defaultValue: '',
    floatingLabel: false,
  },
}

const WithDescription: Story = {
  args: {
    description: 'Supporting line',
  },
}

// Its own story because the error state is three changes at once — the
// underline, the label, and the message that replaces the description.
const WithError: Story = {
  args: {
    defaultValue: '',
    description: 'Supporting line',
    error: 'Enter a value.',
  },
}

const Numeric: Story = {
  args: {
    defaultValue: '01234.56',
    numeric: true,
  },
}

const Outlined: Story = {
  args: {
    variant: 'outlined',
  },
}

const OutlinedEmpty: Story = {
  args: {
    defaultValue: '',
    variant: 'outlined',
  },
}

const WithIcons: Story = {
  args: {
    leadingIcon: LEADING_ICON,
    trailingIcon: TRAILING_ICON,
  },
}

const WithPrefixAndSuffix: Story = {
  args: {
    prefix: 'Prefix',
    suffix: 'Suffix',
  },
}

const WithCharacterCount: Story = {
  args: {
    characterCount: true,
    description: 'Supporting line',
    maxLength: 20,
  },
}

const Disabled: Story = {
  args: {
    isDisabled: true,
  },
}

export {
  Default,
  Disabled,
  Empty,
  FixedLabel,
  Numeric,
  Outlined,
  OutlinedEmpty,
  Overview,
  WithCharacterCount,
  WithDescription,
  WithError,
  WithIcons,
  WithPrefixAndSuffix,
}

export default meta
