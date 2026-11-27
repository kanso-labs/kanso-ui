import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { type ReactNode, useEffect, useState } from 'react'

import Button from './components/button'
import Code from './components/code'
import Link from './components/link'
import Separator from './components/separator'
import Text from './components/text'
import { spacing } from './tokens/design.tokens.stylex'

// The privacy note of the published Storybook, which counts visits with
// Google Analytics. The counting is the manager's: `.storybook/manager-head.html`
// loads `https://kansolabs.org/analytics.js`, the one file every Kanso Labs
// site that loads gtag.js loads, and that file draws the banner and links it
// here. This page is the way to opt out that stays within reach, so it reads
// the visitor's setting from the manager, which is the story's parent frame
// and the same origin. Built from the library's own components, as Getting
// started is.

// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

// A story renders inside the preview iframe, so a link without a target would
// load its page into that frame.
const LINK_TARGET = { rel: 'noreferrer', target: '_blank' } as const

const EVENT = 'kanso-analytics'

type Analytics = {
  deny: () => void
  grant: () => void
  status: () => 'denied' | 'granted'
}

function manager(): undefined | (Window & { kansoAnalytics?: Analytics }) {
  // A parent on another origin, as in a composed Storybook, throws on any
  // read, so the read that would throw is made here.
  try {
    const parent: Window & { kansoAnalytics?: Analytics } = window.parent
    return parent.location.href ? parent : undefined
  } catch {
    return undefined
  }
}

// The manager's setting, or nothing where no manager runs the script, as under
// the test runner.
function useAnalytics() {
  const [state, setState] = useState<{
    analytics: Analytics
    status: ReturnType<Analytics['status']>
  }>()

  useEffect(() => {
    const target = manager()
    const update = () => {
      const analytics = target?.kansoAnalytics

      if (analytics) {
        setState({ analytics, status: analytics.status() })
      }
    }

    update()
    target?.addEventListener(EVENT, update)

    return () => target?.removeEventListener(EVENT, update)
  }, [])

  return state
}

const styles = stylex.create({
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    marginInline: 'auto',
    maxInlineSize: '720px',
    padding: spacing.xl,
  },
  section: {
    alignItems: 'flex-start',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  },
})

function Choice() {
  const state = useAnalytics()

  if (!state) {
    return (
      <Paragraph>
        The setting for this browser appears here when the page is opened in the
        published Storybook. If it never does there, something in this browser
        is blocking the analytics, and nothing is sent.
      </Paragraph>
    )
  }

  const { analytics, status } = state
  const on = status === 'granted'

  // One button whose label follows the setting, so focus stays on it when it
  // is pressed, and a status line that is announced when it changes.
  return (
    <>
      <div aria-live="polite">
        <Paragraph>
          {on
            ? 'Analytics is on for Kanso Labs sites in this browser.'
            : 'Analytics is off for Kanso Labs sites in this browser.'}
        </Paragraph>
      </div>
      <Button
        onPress={on ? analytics.deny : analytics.grant}
        variant="outlined"
      >
        {on ? 'Turn it off' : 'Turn it on'}
      </Button>
    </>
  )
}

function Paragraph({ children }: { children: ReactNode }) {
  return (
    <Text render={PARAGRAPH} variant="bodyLarge">
      {children}
    </Text>
  )
}

function PrivacyPage() {
  return (
    <article {...stylex.props(styles.page)}>
      <Text render={HEADING_1} variant="displaySmall">
        Privacy
      </Text>
      <Paragraph>
        This Storybook uses Google Analytics for anonymous usage statistics: it
        counts visits, so Kanso Labs can see which pages are read. There are no
        accounts here and no ads. Nothing that names you is collected; Google
        Analytics tells one browser from another by a random ID, not by who is
        using it.
      </Paragraph>
      <Separator />
      <Section heading="What is recorded">
        <Paragraph>
          The pages you open and the page that led you here; reaching the end of
          a page; clicks on links that leave the site; and files you download.
          With each, Google Analytics records your browser, device, language and
          approximate location, which it derives from your IP address without
          storing the address. No user ID is set. The address of a page records
          the values you give a story&apos;s controls, so those are recorded
          with it; nothing else you type is sent.
        </Paragraph>
        <Paragraph>
          Google signals and every advertising feature are off, and the site
          tells Google that consent for ads is denied, for every visitor.
        </Paragraph>
      </Section>
      <Section heading="Cookies">
        <Paragraph>
          While analytics is on, Google Analytics sets two cookies on this site
          alone, <Code>_ga</Code> and one beginning <Code>_ga_</Code>, to tell a
          returning browser from a new one. Each Kanso Labs site keeps its own.
        </Paragraph>
        <Paragraph>
          Your choice is shared: it applies to every Kanso Labs site under
          kansolabs.org, so you answer once. It is kept for 13 months in a
          cookie on kansolabs.org, <Code>kl_consent</Code>, which only Kanso
          Labs sites read, and goes nowhere else.
        </Paragraph>
      </Section>
      <Section heading="How long it is kept">
        <Paragraph>
          Google Analytics deletes the records of each visit after 14 months.
          The totals in its reports, such as how many times a page was read in a
          month, are kept.
        </Paragraph>
      </Section>
      <Section heading="Your choice">
        <Paragraph>
          In the European Economic Area, the United Kingdom and Switzerland, the
          site asks before it loads Google Analytics, and nothing is sent until
          you allow it. A static site cannot see where you are, so it goes by
          your browser&apos;s time zone, and asks whenever the zone leaves it
          unsure. Elsewhere analytics is on until you turn it off. If your
          browser keeps the time of another place while you are in one of those,
          Google still keeps its cookies off for you, by your IP address, though
          it may receive the visit without them; turning analytics off here
          stops that too.
        </Paragraph>
        <Choice />
        <Paragraph>
          Google also offers a{' '}
          <Link
            href="https://tools.google.com/dlpage/gaoptout"
            {...LINK_TARGET}
          >
            browser add-on that turns Google Analytics off
          </Link>{' '}
          on every site, and explains{' '}
          <Link
            href="https://policies.google.com/technologies/partner-sites"
            {...LINK_TARGET}
          >
            how it uses information from sites that use its services
          </Link>
          .
        </Paragraph>
      </Section>
      <Section heading="Questions">
        <Paragraph>
          Write to{' '}
          <Link href="mailto:contact@kansolabs.org">contact@kansolabs.org</Link>
          .
        </Paragraph>
      </Section>
    </article>
  )
}

function Section({
  children,
  heading,
}: {
  children: ReactNode
  heading: string
}) {
  return (
    <section {...stylex.props(styles.section)}>
      <Text render={HEADING_2} variant="titleLarge">
        {heading}
      </Text>
      {children}
    </section>
  )
}

const meta = {
  component: PrivacyPage,
  parameters: {
    // Prose with nothing of the library's to compare from one commit to the
    // next, so it spends none of Chromatic's snapshots.
    chromatic: { disableSnapshot: true },
  },
  tags: ['!autodocs'],
  title: 'Privacy',
} satisfies Meta<typeof PrivacyPage>

type Story = StoryObj<typeof meta>

// Named after the title, so Storybook folds it into one sidebar leaf, at
// `?path=/story/privacy--privacy`, which is where the banner links.
const Privacy: Story = {}

export { Privacy }

export default meta
