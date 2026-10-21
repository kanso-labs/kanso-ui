import type { Preview } from '@storybook/react-vite'

import React, { isValidElement } from 'react'
import { I18nProvider } from 'react-aria-components'

import { demoThemes } from '../src/theming/themes'
import DocumentLocale from './components/DocumentLocale'
import StyleXLoader from './components/StyleXLoader'
import ThemeWrapper from './components/ThemeWrapper'
import { allModes } from './modes'

type Enhancer = NonNullable<Preview['argTypesEnhancers']>[number]

// What a JSON editor cannot write: a function, which is what a handler, a
// render prop and a class or style that reads render state all are; a ref; a
// React node; a DOM element; and a value that has to be an instance of a
// class: a date or a time, which are @internationalized/date's, a drag and
// drop controller, a snackbar's queue and a token field's value.
const UNWRITABLE =
  /=>|EventHandler<|Function<|RenderProp|^Ref<|ReactNode|ReactElement|^Element$|DateValue|TimeValue|RangeValue|DragAndDropHooks|SnackbarQueue|TokenFieldValue/

// A props table lists React Aria's props too (see `propFilter` in main.ts),
// and docgen reports many of them as a type Storybook builds no control for,
// a union or one of React Aria's own, so it falls back to the JSON object
// editor. Where a story passes such a prop a string or a number, which is
// what a label, a `defaultValue` or an `aria-label` usually is, it takes a
// text or a number field instead, as it did while the row was read off the
// arg alone. Otherwise, for the types above the editor writes nothing the
// prop accepts: an icon set there renders as an object, and a story whose
// children are elements shows them as raw `$$typeof` records. Those rows keep
// their description and lose the editor. Where JSON can write the value, a
// style object or a list of keys or `formatOptions`, it stays, and so does a
// control a story chose for itself.
//
// An arg no row describes, such as the children of a component whose own
// props leave them to React's types, is described later from its value, and
// an element was handed the same editor. It gets a row of its own here, with
// no editor, which the description read off its value then fills in.
const withoutUnwritableEditors: Enhancer = ({ argTypes, initialArgs }) => ({
  ...Object.fromEntries(
    Object.entries<unknown>(initialArgs)
      .filter(([name, value]) => !(name in argTypes) && isValidElement(value))
      .map(([name]) => [name, { control: false, name }]),
  ),
  ...Object.fromEntries(
    Object.entries(argTypes).map(([name, argType]) => {
      if (argType.type?.name !== 'other' || argType.control !== undefined) {
        return [name, argType]
      }
      const value: unknown = initialArgs[name]
      if (typeof value === 'string' || typeof value === 'number') {
        return [
          name,
          {
            ...argType,
            control: { type: typeof value === 'string' ? 'text' : 'number' },
          },
        ]
      }
      return [
        name,
        UNWRITABLE.test(argType.table?.type?.summary ?? '')
          ? { ...argType, control: false }
          : argType,
      ]
    }),
  ),
})

// A default read off the code, `variant = 'filled'`, reaches the table as the
// value, "filled", while one written as `@default 'md'` reaches it as the
// tag's text, quotes and all, and read "'md'" — or 'react-aria-RadioField',
// for one of React Aria's. Most props written that way have no default in the
// code to read, since the value is worked out from something else, so this
// takes the single quotes off rather than asking the source for a second
// spelling of every default.
const withJSDocDefaultsUnquoted: Enhancer = ({ argTypes }) =>
  Object.fromEntries(
    Object.entries(argTypes).map(([name, argType]) => {
      const quoted = /^"?'([^']*)'"?$/.exec(
        argType.table?.defaultValue?.summary ?? '',
      )
      return [
        name,
        quoted === null
          ? argType
          : {
              ...argType,
              table: {
                ...argType.table,
                defaultValue: {
                  ...argType.table?.defaultValue,
                  summary: `"${quoted[1]}"`,
                },
              },
            },
      ]
    }),
  )

// The steps of the library's size scale, smallest first: the steps `size`
// takes, and the spacing steps Stack's `gap` does.
const SCALE = ['none', 'xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl']

// A control lists a union's members in the order its type declares them, and
// lint sorts those by name, so Button's `size` offered lg, md, xl, xs and xxl.
// A union made of steps of the scale is offered smallest first instead, and
// the table spells its type in the same order.
const withScaleInOrder: Enhancer = ({ argTypes }) =>
  Object.fromEntries(
    Object.entries(argTypes).map(([name, argType]) => {
      const { table, type } = argType
      if (
        type?.name !== 'enum' ||
        !type.value.every(
          (value) => typeof value === 'string' && SCALE.includes(value),
        )
      ) {
        return [name, argType]
      }
      const steps = SCALE.filter((step) => type.value.includes(step))
      return [
        name,
        {
          ...argType,
          table: {
            ...table,
            type: {
              ...table?.type,
              summary: steps.map((step) => `"${step}"`).join(' | '),
            },
          },
          type: { ...type, value: steps },
        },
      ]
    }),
  )

// A story's uncontrolled defaults, `defaultValue`, `defaultSelected` and the
// rest, as one string to key it on. A component reads a default once, when it
// mounts, so editing one in Controls changed nothing on screen; keyed on them,
// the story mounts again and takes the new value. Every other arg still
// updates the story where it stands.
function defaultsKey(args: Record<string, unknown>) {
  return JSON.stringify(
    Object.entries(args).filter(([name]) => /^default[A-Z]/.test(name)),
  )
}

const preview: Preview = {
  argTypesEnhancers: [
    withoutUnwritableEditors,
    withJSDocDefaultsUnquoted,
    withScaleInOrder,
  ],
  decorators: [
    (Story, context) => {
      // Globals arrive untyped, and the value reaches a `string` prop rather
      // than only an equality check, so it is narrowed here instead of cast.
      const theme =
        typeof context.globals.theme === 'string'
          ? context.globals.theme
          : 'light'
      const locale =
        typeof context.globals.locale === 'string'
          ? context.globals.locale
          : 'en-US'

      return (
        <I18nProvider locale={locale}>
          <DocumentLocale />
          <StyleXLoader />
          <ThemeWrapper fill={context.viewMode !== 'docs'} name={theme}>
            <Story key={defaultsKey(context.args)} />
          </ThemeWrapper>
        </I18nProvider>
      )
    },
  ],
  // The theme is a global rather than addon state so that Chromatic's modes
  // can set it — an addon holding the value privately is invisible to them.
  globalTypes: {
    // The locale every story renders in, through React Aria's I18nProvider:
    // the names React Aria and the library give controls, the digits and
    // grouping of every number, and the direction a page runs in. A global
    // for the theme's reason — a Chromatic mode can set it. English, then a
    // locale with long compound words, one with its own digits that runs
    // right to left, and one with neither spaces nor Latin letters.
    locale: {
      description: 'Locale the story canvas renders in',
      toolbar: {
        dynamicTitle: true,
        icon: 'globe',
        items: [
          { title: 'English', value: 'en-US' },
          { title: 'German', value: 'de-DE' },
          { title: 'Arabic (Egypt)', value: 'ar-EG' },
          { title: 'Japanese', value: 'ja-JP' },
        ],
        title: 'Locale',
      },
    },
    theme: {
      description: 'Colour theme the story canvas renders in',
      toolbar: {
        dynamicTitle: true,
        // The library's own two, then the demo schemes the Theming page is
        // built from. Listing those here rather than only on that page is
        // what lets any component's story be read in one of them, which is
        // the question a scheme actually has to answer.
        items: [
          { icon: 'sun', title: 'Light', value: 'light' },
          { icon: 'moon', title: 'Dark', value: 'dark' },
          ...Object.entries(demoThemes).map(([value, { label }]) => ({
            icon: 'paintbrush' as const,
            title: label,
            value,
          })),
        ],
        title: 'Theme',
      },
    },
  },
  // A fixed default rather than one seeded from prefers-color-scheme. The
  // preference is not reliably applied by the time this module evaluates, so
  // reading it here decides the theme by a race; it also leaks the CI
  // machine's appearance into the a11y checks the Vitest run performs. Both
  // themes are captured either way — this only picks which one opens first.
  initialGlobals: {
    locale: 'en-US',
    theme: 'light',
  },
  parameters: {
    a11y: {
      config: {
        // `aria-allowed-attr` reads `role` as a single token, so React Aria's
        // `role="meter progressbar"` on a Meter resolves to no role at all and
        // falls back to the div's own — under which none of `aria-valuenow`,
        // `aria-valuemin`, `aria-valuemax` or `aria-valuetext` is allowed, and
        // every story holding a Meter fails. ARIA defines `role` as a list of
        // fallback tokens whose first valid one wins, which is `meter`, and
        // `meter` allows all four; the list is there so a reader whose
        // assistive technology predates `meter` still hears a progress bar.
        //
        // The rule's own selector is `*`, so narrowing it to everything but
        // that element leaves it running everywhere else rather than turning
        // it off. Drop this once axe resolves a fallback role list.
        //
        // `label-content-name-mismatch` takes all of a control's visible text
        // for its label, so a menu item showing a shortcut — "Cut" then "⌘X",
        // read as "Cut⌘X" — fails against its name, "Cut". React Aria names
        // the item by its label alone and describes it by the shortcut,
        // through `aria-describedby` on the `<kbd>`, so a screen reader reads
        // the keystroke apart from what the item does and a speech-input user
        // says the label they see. The shortcut is not part of the label, so
        // the rule is narrowed past an element holding one rather than the
        // name made to carry the keystroke. Axe runs it by default from 4.14,
        // where it stopped being experimental.
        rules: [
          {
            id: 'aria-allowed-attr',
            selector: '*:not([role="meter progressbar"])',
          },
          {
            id: 'label-content-name-mismatch',
            selector: '*:not(:has(kbd))',
          },
        ],
      },
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'error',
    },
    // Project-level, so every story is captured in both themes. A component or
    // story can narrow this with its own `chromatic.modes`, including
    // `{ dark: { disable: true } }` to opt one back out.
    chromatic: {
      modes: {
        dark: allModes.dark,
        light: allModes.light,
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        // Case-sensitive, so it reads a camel-cased `...Date` and not the
        // "date" closing React Aria's `validate` and `formNoValidate`, which
        // it handed a date picker.
        date: /Date$/,
      },
    },
    options: {
      // Getting started first overall; within each component its Overview
      // page, then its Default story, and everything else left where it
      // already was. Returning 0 is what does that last part: the default
      // order is the order stories are exported in, and lint sorts those named
      // exports alphabetically, so there is nothing to re-sort here — only the
      // entries that should lead rather than land where their name puts them.
      // The Overview page is Storybook's Docs page, under the name
      // `docs.defaultName` in main.ts gives it, and that name is the one this
      // function sees.
      //
      // Default leads the stories because the Overview page opens on the first
      // of them, drawn with its Controls beside it. Default is the story built
      // on the meta's args, which is what those Controls drive; left to the
      // alphabet, `AlertDialog` would open Dialog's page and `Capped` Badge's.
      //
      // Without the Getting started clause that page lands *last*: the glob walks
      // src/components and src/tokens before the files sitting at the root of
      // src, so file order puts the one page meant to be read first at the
      // bottom of the sidebar. Hoisting it here rather than renaming the file
      // into place is what keeps that independent of how the glob happens to
      // traverse.
      //
      // 'Getting started' is spelled out rather than read from a shared constant
      // for the reason in the next paragraph: this function is eval()d with
      // nothing else in scope, so a reference to anything outside it throws
      // there and takes the story index down with it.
      //
      // Deliberately untyped, and it has to stay that way. Storybook does not
      // import this function — the indexer reads preview.tsx as text, cuts out
      // the storySort expression, and eval()s it as plain JavaScript, so a
      // parameter annotation is a syntax error there and takes the whole story
      // index down with it. Nothing type-checks this file either way: neither
      // tsconfig includes .storybook, and nothing under src imports it.
      /* oxlint-disable typescript/no-unsafe-member-access -- untyped by necessity, see above */
      storySort: (a, b) => {
        if (a.title !== b.title) {
          if (a.title === 'Getting started') {
            return -1
          }
          return b.title === 'Getting started' ? 1 : 0
        }
        for (const name of ['Overview', 'Default']) {
          if (a.name === name) {
            return -1
          }
          if (b.name === name) {
            return 1
          }
        }
        return 0
      },
      /* oxlint-enable typescript/no-unsafe-member-access */
    },
  },
  // Every component gets an Overview page, Storybook's Docs page renamed in
  // main.ts: its JSDoc description and usage example, the props table
  // react-docgen-typescript builds from its types, and each story with its
  // source. The pages written as stories rather than around a component —
  // Getting started, the Foundations pages and the Theming schemes — take
  // `!autodocs`, since an Overview page there would document the page's own
  // wrapper and unfold the single sidebar leaf each relies on.
  // A story kept off the sidebar with `!dev` takes it as well, being a check
  // rather than something to read.
  tags: ['autodocs'],
}

export default preview
