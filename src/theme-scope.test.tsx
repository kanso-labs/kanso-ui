import type { CSSProperties } from 'react'

import * as stylex from '@stylexjs/stylex'
import { act, render, waitFor } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'

import { colorScheme } from './color-scheme'
import Button from './components/button'
import Popover from './components/popover'
import Sheet from './components/sheet'
import Snackbar from './components/snackbar'
import Tooltip from './components/tooltip'
import { ThemeScope } from './theme-scope'
import { colors } from './tokens/design.tokens.stylex'

// The scheme's primary in design.tokens.json, light and dark — the runner's
// OS asks for light — and a value well clear of both, set as an override.
const LIGHT_PRIMARY = 'rgb(103, 80, 164)'
const DARK_PRIMARY = 'rgb(208, 188, 255)'
const OVERRIDDEN = 'rgb(1, 2, 3)'

const OVERRIDE: CSSProperties & Record<'--kui-color-primary', string> = {
  '--kui-color-primary': OVERRIDDEN,
}

const MARGIN = { marginTop: '3px' }

const SECTION = <section aria-label="Scope" />

const probeStyles = stylex.create({
  primary: { color: colors.primary },
})

function colourOf(element: HTMLElement) {
  return getComputedStyle(element).color
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

  describe('tokens', () => {
    it('resolves an override declared on it for everything inside', () => {
      const view = render(
        <ThemeScope style={OVERRIDE}>
          <Probe />
        </ThemeScope>,
      )

      expect(colourOf(view.getByTestId('probe'))).toBe(OVERRIDDEN)
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
