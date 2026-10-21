import type { CSSProperties } from 'react'

import * as stylex from '@stylexjs/stylex'
import { act, render, waitFor } from '@testing-library/react'
import { createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { colorScheme } from './color-scheme'
import Button from './components/button'
import Popover from './components/popover'
import Sheet from './components/sheet'
import Snackbar from './components/snackbar'
import Tooltip from './components/tooltip'
import { type KuiTheme, ThemeScope, type ThemeScopeProps } from './theme-scope'
import { colors } from './tokens/design.tokens.stylex'

// The scheme's primary in tokens.json, light and dark — the runner's
// OS asks for light — and a value well clear of both, set as an override.
const LIGHT_PRIMARY = 'rgb(103, 80, 164)'
const DARK_PRIMARY = 'rgb(208, 188, 255)'
const OVERRIDDEN = 'rgb(1, 2, 3)'

// Each scheme's surface and on surface, which a pinned scope paints itself in.
const PAINT = {
  dark: { background: 'rgb(20, 18, 24)', text: 'rgb(230, 224, 233)' },
  light: { background: 'rgb(254, 247, 255)', text: 'rgb(29, 27, 32)' },
}

/** WCAG's contrast ratio between two `rgb()` colours. */
function contrastOf(one: string, two: string) {
  const a = luminanceOf(one)
  const b = luminanceOf(two)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/** WCAG's relative luminance of an `rgb()` colour. */
function luminanceOf(colour: string) {
  const [r, g, b] = (colour.match(/\d+/g) ?? []).map((part) => {
    const channel = Number(part) / 255
    return channel <= 0.039_28
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const OVERRIDE: CSSProperties & Record<'--kui-color-primary', string> = {
  '--kui-color-primary': OVERRIDDEN,
}

const THEME: KuiTheme = { '--kui-color-primary': OVERRIDDEN }

// A second value for the same property, set through `style` beside `THEME`.
const RESTYLED = 'rgb(4, 5, 6)'
const RESTYLE: CSSProperties & Record<'--kui-color-primary', string> = {
  '--kui-color-primary': RESTYLED,
}

const MARGIN = { marginTop: '3px' }

const SECTION = <section aria-label="Scope" />

const LIST = <ul />

const PARAGRAPH = <p />

/**
 * What React logs to the console while `work` runs, read before the spy is
 * restored, since restoring it clears what it recorded.
 */
function errorsDuring(work: () => void) {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    work()
    return spy.mock.calls.map((call) => call.map(String).join(' '))
  } finally {
    spy.mockRestore()
  }
}

const probeStyles = stylex.create({
  primary: { color: colors.primary },
})

function colourOf(element: HTMLElement) {
  return getComputedStyle(element).color
}

/** A scope holding a popover that is open from its first render. */
function openScope(props: Pick<ThemeScopeProps, 'ref' | 'render'>) {
  return (
    <ThemeScope data-testid="scope" {...props}>
      <Popover defaultOpen>
        <Button>Open</Button>
        <Popover.Content>
          <Popover.Title>Headline</Popover.Title>
        </Popover.Content>
      </Popover>
    </ThemeScope>
  )
}

function Probe({ id = 'probe' }: { id?: string }) {
  return <span data-testid={id} {...stylex.props(probeStyles.primary)} />
}

describe('theme scope', () => {
  describe('element', () => {
    it('renders a div holding its children', () => {
      const view = render(<ThemeScope data-testid="scope">Label</ThemeScope>)
      const scope = view.getByTestId('scope')

      expect(scope.tagName).toBe('DIV')
      expect(scope.textContent).toBe('Label')
    })

    it('takes a className, a style and a ref on that element', () => {
      const ref = createRef<HTMLDivElement>()
      const view = render(
        <ThemeScope
          className="consumer"
          data-testid="scope"
          ref={ref}
          style={MARGIN}
        />,
      )
      const scope = view.getByTestId('scope')

      expect(scope.classList.contains('consumer')).toBe(true)
      expect(scope.style.marginTop).toBe('3px')
      expect(ref.current).toBe(scope)
    })

    it('renders the element it is handed through render', () => {
      const view = render(<ThemeScope data-testid="scope" render={SECTION} />)

      expect(view.getByTestId('scope').tagName).toBe('SECTION')
    })

    // A scope that is a grid or a flex container would otherwise gain an
    // item, and a gap before it, for a container that holds nothing until
    // an overlay opens.
    it('keeps its portal container out of the layout', () => {
      const view = render(<ThemeScope data-testid="scope">Label</ThemeScope>)
      const container = view.getByTestId('scope').lastElementChild

      if (!(container instanceof HTMLElement)) {
        throw new Error('expected the scope to end in its portal container')
      }

      expect(getComputedStyle(container).display).toBe('contents')
    })
  })

  // The container is added to the scope's element rather than rendered as a
  // child of it, so an element that cannot hold a `<div>` draws no nesting
  // error and no hydration warning, and the server's markup holds none.
  describe('portal container', () => {
    it('is in neither the markup nor the warnings of a list scope', () => {
      const scope = (
        <ThemeScope data-testid="scope" render={LIST}>
          <li>First item</li>
          <li>Second item</li>
        </ThemeScope>
      )

      expect(renderToStaticMarkup(scope)).not.toContain('<div')

      const errors = errorsDuring(() => {
        render(scope)
      })
      expect(errors).toEqual([])
    })

    it('is in neither the markup nor the warnings of a paragraph scope', () => {
      const scope = (
        <ThemeScope data-testid="scope" render={PARAGRAPH}>
          Supporting line
        </ThemeScope>
      )

      expect(renderToStaticMarkup(scope)).not.toContain('<div')

      const errors = errorsDuring(() => {
        render(scope)
      })
      expect(errors).toEqual([])
    })

    it('still takes the overlays opened inside the scope', () => {
      const view = render(
        <ThemeScope data-testid="scope" render={PARAGRAPH} style={OVERRIDE}>
          <Popover defaultOpen>
            <Button>Open</Button>
            <Popover.Content>
              <Popover.Title>Headline</Popover.Title>
              <Probe />
            </Popover.Content>
          </Popover>
        </ThemeScope>,
      )
      const container = view.getByTestId('scope').lastElementChild

      expect(container?.tagName).toBe('DIV')
      expect(container?.contains(view.getByRole('dialog'))).toBe(true)
      expect(colourOf(view.getByTestId('probe'))).toBe(OVERRIDDEN)
    })

    // A ref of a new identity attaches again, as an inline callback does on
    // every render of the call site. A new container each time would move
    // the open popover into it, remounting it.
    it('keeps one container, and the overlays in it, as the ref changes', () => {
      const view = render(openScope({ ref: () => {} }))
      const dialog = view.getByRole('dialog')

      view.rerender(openScope({ ref: () => {} }))

      expect(view.getByRole('dialog')).toBe(dialog)
      expect(
        view.getByTestId('scope').querySelectorAll(':scope > div'),
      ).toHaveLength(1)
    })

    it('moves the overlays into a new element when render changes it', () => {
      const view = render(openScope({}))

      view.rerender(openScope({ render: SECTION }))

      const section = view.getByTestId('scope')
      expect(section.tagName).toBe('SECTION')
      expect(section.contains(view.getByRole('dialog'))).toBe(true)
    })
  })

  describe('tokens', () => {
    it('resolves an override declared on it for everything inside', () => {
      const view = render(
        <ThemeScope style={OVERRIDE}>
          <Probe />
        </ThemeScope>,
      )

      expect(colourOf(view.getByTestId('probe'))).toBe(OVERRIDDEN)
    })

    it('resolves a theme handed to it for everything inside', () => {
      const view = render(
        <ThemeScope theme={THEME}>
          <Probe />
        </ThemeScope>,
      )

      expect(colourOf(view.getByTestId('probe'))).toBe(OVERRIDDEN)
    })

    it('keeps the style it is handed beside a theme', () => {
      const view = render(
        <ThemeScope data-testid="scope" style={MARGIN} theme={THEME}>
          <Probe />
        </ThemeScope>,
      )

      expect(view.getByTestId('scope').style.marginTop).toBe('3px')
      expect(colourOf(view.getByTestId('probe'))).toBe(OVERRIDDEN)
    })

    it('lets style win where it and the theme set the same property', () => {
      const view = render(
        <ThemeScope style={RESTYLE} theme={THEME}>
          <Probe />
        </ThemeScope>,
      )

      expect(colourOf(view.getByTestId('probe'))).toBe(RESTYLED)
    })

    it('resolves an override declared around it', () => {
      const view = render(
        <div style={OVERRIDE}>
          <ThemeScope>
            <Probe />
          </ThemeScope>
        </div>,
      )

      expect(colourOf(view.getByTestId('probe'))).toBe(OVERRIDDEN)
    })

    // The control: the same override on a plain element reaches nothing,
    // since the tokens resolved on `:root` and are inherited from there.
    it('is what makes an override below the root apply', () => {
      const view = render(
        <div style={OVERRIDE}>
          <Probe />
        </div>,
      )

      expect(colourOf(view.getByTestId('probe'))).toBe(LIGHT_PRIMARY)
    })

    it('leaves the page outside it on its own tokens', () => {
      const view = render(
        <>
          <ThemeScope scheme="dark" style={OVERRIDE}>
            <Probe id="inside" />
          </ThemeScope>
          <Probe id="outside" />
        </>,
      )

      expect(colourOf(view.getByTestId('inside'))).toBe(OVERRIDDEN)
      expect(colourOf(view.getByTestId('outside'))).toBe(LIGHT_PRIMARY)
    })
  })

  describe('scheme', () => {
    it('pins the dark scheme against a light OS', () => {
      const view = render(
        <ThemeScope scheme="dark">
          <Probe />
        </ThemeScope>,
      )

      expect(colourOf(view.getByTestId('probe'))).toBe(DARK_PRIMARY)
    })

    it('pins the light scheme inside a dark one', () => {
      const view = render(
        <ThemeScope scheme="dark">
          <ThemeScope scheme="light">
            <Probe />
          </ThemeScope>
        </ThemeScope>,
      )

      expect(colourOf(view.getByTestId('probe'))).toBe(LIGHT_PRIMARY)
    })

    // A theme pins the tokens alone, so a dark scope on a light page left its
    // own background transparent and its text the page's colour, and a Text
    // inside drew the dark on surface over the light page at 1.23:1.
    it.each(['dark', 'light'] as const)(
      'paints its own surface and text in the %s scheme',
      (scheme) => {
        const view = render(
          <ThemeScope data-testid="scope" scheme={scheme}>
            Label
          </ThemeScope>,
        )
        const style = getComputedStyle(view.getByTestId('scope'))

        expect(style.backgroundColor).toBe(PAINT[scheme].background)
        expect(style.color).toBe(PAINT[scheme].text)
      },
    )

    // The runner's page is light, so the dark scope is the one that has to
    // stand on its own.
    it('reads on its own surface on a page of the other scheme', () => {
      const view = render(
        <ThemeScope data-testid="scope" scheme="dark">
          Label
        </ThemeScope>,
      )
      const style = getComputedStyle(view.getByTestId('scope'))

      expect(
        contrastOf(style.color, style.backgroundColor),
      ).toBeGreaterThanOrEqual(4.5)
    })

    // Native controls, scrollbars and autofill follow `color-scheme` rather
    // than any token: a dark scope's input stayed white with black text.
    it.each(['dark', 'light'] as const)(
      'tells the browser and the controls inside it the %s scheme',
      (scheme) => {
        const view = render(
          <ThemeScope data-testid="scope" scheme={scheme}>
            <input aria-label="Label" />
          </ThemeScope>,
        )

        expect(getComputedStyle(view.getByTestId('scope')).colorScheme).toBe(
          scheme,
        )
        expect(
          getComputedStyle(view.getByRole('textbox', { name: 'Label' }))
            .colorScheme,
        ).toBe(scheme)
      },
    )

    // An unpinned scope keeps whatever is around it, paint included.
    it('paints nothing and sets no scheme when given none', () => {
      const view = render(<ThemeScope data-testid="scope">Label</ThemeScope>)
      const style = getComputedStyle(view.getByTestId('scope'))

      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)')
      expect(style.colorScheme).toBe('normal')
    })

    it('keeps the scheme an enclosing scope pins when given none', () => {
      const view = render(
        <ThemeScope scheme="dark">
          <ThemeScope style={OVERRIDE}>
            <Probe id="overridden" />
          </ThemeScope>
          <ThemeScope>
            <Probe id="plain" />
          </ThemeScope>
        </ThemeScope>,
      )

      expect(colourOf(view.getByTestId('overridden'))).toBe(OVERRIDDEN)
      expect(colourOf(view.getByTestId('plain'))).toBe(DARK_PRIMARY)
    })

    // The page-wide pin is a class on `<html>`, which a wrapper stands in
    // for here, since the scope has no context to read it from: it is the
    // CSS that carries the scheme down.
    it('keeps the scheme a colorScheme class pins when given none', () => {
      const view = render(
        <div className={colorScheme.dark}>
          <ThemeScope>
            <Probe />
          </ThemeScope>
        </div>,
      )

      expect(colourOf(view.getByTestId('probe'))).toBe(DARK_PRIMARY)
    })

    it('keeps an override under a pinned scheme', () => {
      const view = render(
        <ThemeScope scheme="dark" style={OVERRIDE}>
          <Probe />
        </ThemeScope>,
      )

      expect(colourOf(view.getByTestId('probe'))).toBe(OVERRIDDEN)
    })
  })

  // Each overlay is open on the scope's first render, before its container
  // exists, which is the case the container being state rather than a ref
  // is for.
  describe('overlays', () => {
    it('portals a popover into itself, which themes it', () => {
      const view = render(
        <ThemeScope data-testid="scope" style={OVERRIDE}>
          <Popover defaultOpen>
            <Button>Open</Button>
            <Popover.Content>
              <Popover.Title>Headline</Popover.Title>
              <Probe />
            </Popover.Content>
          </Popover>
        </ThemeScope>,
      )

      expect(view.getByTestId('scope').contains(view.getByRole('dialog'))).toBe(
        true,
      )
      expect(colourOf(view.getByTestId('probe'))).toBe(OVERRIDDEN)
    })

    it('portals a sheet into itself, which themes it', () => {
      const view = render(
        <ThemeScope data-testid="scope" scheme="dark">
          <Sheet defaultOpen>
            <Button>Open</Button>
            <Sheet.Content>
              <Sheet.Header>
                <Sheet.Title>Headline</Sheet.Title>
              </Sheet.Header>
              <Sheet.Body>
                <Probe />
              </Sheet.Body>
            </Sheet.Content>
          </Sheet>
        </ThemeScope>,
      )

      expect(view.getByTestId('scope').contains(view.getByRole('dialog'))).toBe(
        true,
      )
      expect(colourOf(view.getByTestId('probe'))).toBe(DARK_PRIMARY)
    })

    it('portals a tooltip into itself', () => {
      const view = render(
        <ThemeScope data-testid="scope">
          <Tooltip defaultOpen label="Label">
            <Button>Trigger</Button>
          </Tooltip>
        </ThemeScope>,
      )

      expect(
        view.getByTestId('scope').contains(view.getByRole('tooltip')),
      ).toBe(true)
    })

    it('portals a snackbar into itself', async () => {
      const queue = new Snackbar.Queue()
      const view = render(
        <ThemeScope data-testid="scope">
          <Snackbar queue={queue} />
        </ThemeScope>,
      )
      act(() => {
        queue.add('First item')
      })

      await waitFor(() => {
        expect(
          view.getByTestId('scope').contains(view.getByText('First item')),
        ).toBe(true)
      })
    })

    // The control: an overlay outside every scope still portals to the end
    // of the body, and keeps the page's tokens.
    it('leaves an overlay opened outside it to the body', () => {
      const view = render(
        <>
          <ThemeScope data-testid="scope" style={OVERRIDE} />
          <Popover defaultOpen>
            <Button>Open</Button>
            <Popover.Content>
              <Popover.Title>Headline</Popover.Title>
              <Probe />
            </Popover.Content>
          </Popover>
        </>,
      )

      expect(view.getByTestId('scope').contains(view.getByRole('dialog'))).toBe(
        false,
      )
      expect(colourOf(view.getByTestId('probe'))).toBe(LIGHT_PRIMARY)
    })
  })
})
