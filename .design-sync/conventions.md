# Building with kanso-ui

**Setup.** Every component is on `window.KansoLabsKansoUi`: `const { Stack, Card, Text, Button } = window.KansoLabsKansoUi`. No provider or theme wrapper is needed. Components read the `--kui-*` custom properties that `styles.css` declares on `:root`, and light or dark follows the viewer's `prefers-color-scheme`; no class or prop forces either. Paint the page yourself with `background: var(--kui-color-surface); color: var(--kui-color-on-surface); font-family: var(--kui-typography-font-family-plain)`. That is the canvas kanso's surfaces are drawn for, since an outlined `Card` is that same surface with a border. The font matters too: `Link`, like any text outside a `Text`, sets no typeface of its own and otherwise inherits the browser's Times. For a locale other than the browser's, wrap the app in `I18nProvider locale="pt-BR"`. `Currency` formats with its own `locale` and `currency` props.

**Styling.** There are no utility classes, and StyleX is compiled into the bundle, so never call `stylex.create` in a design. Style components through their props: `variant`, `size`, `tone`, `padding`. For layout, use `Stack` (`direction`, `gap`, `align`, `justify`, `wrap`) and `Container` (`maxInlineSize`, `padding`), or inline `style` with tokens:

| Family | Names |
|---|---|
| Colour (Material 3 roles) | `--kui-color-primary`, `-on-primary`, `-primary-container`, `-secondary-container`, `-surface`, `-on-surface`, `-on-surface-variant`, `-surface-container-lowest` to `-surface-container-highest`, `-outline`, `-outline-variant`, `-positive`, `-negative`, `-error` |
| Spacing | `--kui-spacing-xxs` 2px, `-xs` 4, `-sm` 8, `-md` 12, `-lg` 16, `-xl` 24, `-xxl` 32, `-xxxl` 40 (`Stack`'s `gap` takes the same names) |
| Radius | `--kui-radius-xs` 4px, `-sm` 8, `-md` 12, `-lg` 16, `-xl` 28, `-pill` |
| Elevation | `--kui-shadow-elevation1` to `--kui-shadow-elevation5` |
| Motion | `--kui-motion-duration-short1` to `-long3`, `--kui-motion-easing-standard`, `-emphasized` |

**Type.** Set text with `Text`, never raw font sizes. `variant` is one of 15 roles, display, headline, title, body and label at Large, Medium and Small (`titleMedium`). `tone` is `default`, `muted`, `primary`, `positive`, `negative`, `error` or `inherit`. `Text` renders a `<span>`: `block` makes it a `<p>`, and `render={<h2 />}` changes the element without changing the style. Display, headline and `titleLarge` are Roboto Serif, the other roles Roboto Flex, and `Code`, `Keycap` and `Currency` Roboto Mono, all shipped in `fonts/` under the SIL Open Font License 1.1. `Currency` sets no size of its own; put it inside a `Text`.

**Icons.** kanso ships no icon set; its controls draw their own glyphs. `IconButton` takes the icon as its children and needs an `aria-label`. Any prop or slot that takes a node takes an inline `<svg>` in `currentColor`, 24px square.

**Where the truth lives.** `styles.css` imports `fonts/fonts.css` and `_ds_bundle.css`, which holds the component styles and, at its end, every `--kui-*` declaration. Each component's `<Name>.d.ts` is its API, and its `<Name>.prompt.md` documents every prop. The `compose(S, "…")` lines under a doc's Examples are the preview card's plumbing, not an API to call.

```jsx
const { Button, Card, Currency, Stack, Text } = window.KansoLabsKansoUi

function Budget() {
  return (
    <div style={{ background: 'var(--kui-color-surface)', color: 'var(--kui-color-on-surface)', fontFamily: 'var(--kui-typography-font-family-plain)', padding: 'var(--kui-spacing-xl)' }}>
      <Stack gap="lg">
        <Text render={<h1 />} variant="headlineMedium">May budget</Text>
        <Card variant="outlined">
          <Stack gap="sm">
            <Text variant="titleMedium">Groceries</Text>
            <Text variant="headlineSmall"><Currency currency="EUR" locale="en-US" value={-128.4} /></Text>
            <Stack direction="row" gap="sm" justify="end">
              <Button variant="text">Edit</Button>
              <Button variant="filled">Pay</Button>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </div>
  )
}
```
