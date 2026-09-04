import type { Ref } from 'react'

import { fireEvent, render } from '@testing-library/react'
import { createElement, createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { RenderComponentProps, RenderFunctionProps } from './useRender'

import { useRender } from './useRender'

// The smallest component the hook can serve: no styles of its own, so every
// class, style and handler on the rendered element is one the test put there.
function Probe({
  render: renderProp,
  tag = 'span',
  ...props
}: RenderComponentProps<'button'> & { tag?: 'button' | 'span' }) {
  return useRender({ defaultTagName: tag, props, render: renderProp })
}

// Hoisted, since react-perf rejects an element built inline on every render.
const EMPHASIS = <em />
const EMPHASIS_WITH_CLASS = <em className="theirs" />
const EMPHASIS_WITH_STYLE = <em style={{ zIndex: 3 }} />
const EMPHASIS_WITH_ID = <em id="theirs" />
const EMPHASIS_WITH_LANG = <em lang="en" />
const STYLE = { marginTop: 2, zIndex: 1 }

// Built through createElement rather than JSX: a ref or a handler is created
// per test, and react-perf would otherwise read the element as rebuilt on
// every render.
function emphasisWithRef(ref: Ref<HTMLElement>) {
  return createElement('em', { ref })
}

// Empty on purpose — the hook injects the children, so jsx-a11y's
// anchor-has-content is reading a template whose content it cannot see.
function renderLink(props: RenderFunctionProps) {
  // oxlint-disable-next-line jsx-a11y/anchor-has-content -- filled by useRender
  return <a {...props} href="#label" />
}

describe('default element', () => {
  it('renders the default tag with its props', () => {
    const view = render(<Probe id="probe">Label</Probe>)
    const element = view.getByText('Label')

    expect(element.tagName).toBe('SPAN')
    expect(element.id).toBe('probe')
  })

  // A bare <button> is a submit button inside a form.
  it('gives a default button type="button"', () => {
    const view = render(<Probe tag="button">Label</Probe>)

    expect(view.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('keeps an explicit type on that button', () => {
    const view = render(
      <Probe tag="button" type="submit">
        Label
      </Probe>,
    )

    expect(view.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('gives no other tag a type', () => {
    const view = render(<Probe>Label</Probe>)

    expect(view.getByText('Label')).not.toHaveAttribute('type')
  })

  it('forwards a ref to the element', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Probe ref={ref}>Label</Probe>)

    expect(ref.current).toBeInstanceOf(HTMLSpanElement)
  })
})

describe('render as an element', () => {
  it('renders that element with the props instead', () => {
    const view = render(
      <Probe id="probe" render={EMPHASIS}>
        Label
      </Probe>,
    )
    const element = view.getByText('Label')

    expect(element.tagName).toBe('EM')
    expect(element.id).toBe('probe')
  })

  it('joins the class names of both sides', () => {
    const view = render(
      <Probe className="ours" render={EMPHASIS_WITH_CLASS}>
        Label
      </Probe>,
    )
    const element = view.getByText('Label')

    expect(element.classList.contains('ours')).toBe(true)
    expect(element.classList.contains('theirs')).toBe(true)
  })

  it('merges the styles of both sides, the element winning a conflict', () => {
    const view = render(
      <Probe render={EMPHASIS_WITH_STYLE} style={STYLE}>
        Label
      </Probe>,
    )
    const element = view.getByText('Label')

    expect(element.style.marginTop).toBe('2px')
    expect(element.style.zIndex).toBe('3')
  })

  it('calls the handlers of both sides', () => {
    const ours = vi.fn<() => void>()
    const theirs = vi.fn<() => void>()
    const element = createElement('button', { onClick: theirs, type: 'button' })
    const view = render(
      <Probe onClick={ours} render={element}>
        Label
      </Probe>,
    )

    fireEvent.click(view.getByRole('button'))

    expect(ours).toHaveBeenCalledTimes(1)
    expect(theirs).toHaveBeenCalledTimes(1)
  })

  // The element names itself outright, so it is the more specific of the two.
  it('lets the element win any other conflict', () => {
    const view = render(
      <Probe id="ours" render={EMPHASIS_WITH_ID}>
        Label
      </Probe>,
    )

    expect(view.getByText('Label').id).toBe('theirs')
  })

  it('keeps a prop only one side sets', () => {
    const view = render(
      <Probe data-testid="ours" render={EMPHASIS_WITH_LANG}>
        Label
      </Probe>,
    )

    expect(view.getByTestId('ours').lang).toBe('en')
  })

  it('forwards a ref to that element', () => {
    const ref = createRef<HTMLButtonElement>()
    render(
      <Probe ref={ref} render={EMPHASIS}>
        Label
      </Probe>,
    )

    expect(ref.current).toBeInstanceOf(HTMLElement)
    expect(ref.current?.tagName).toBe('EM')
  })

  it('keeps a ref the element carries itself', () => {
    const theirs = createRef<HTMLElement>()
    render(<Probe render={emphasisWithRef(theirs)}>Label</Probe>)

    expect(theirs.current?.tagName).toBe('EM')
  })

  it('points both refs at the same node', () => {
    const ours = createRef<HTMLButtonElement>()
    const theirs = createRef<HTMLElement>()
    render(
      <Probe ref={ours} render={emphasisWithRef(theirs)}>
        Label
      </Probe>,
    )

    expect(ours.current).not.toBeNull()
    expect(ours.current).toBe(theirs.current)
  })
})

describe('render as a function', () => {
  it('hands it the merged props and renders what it returns', () => {
    const view = render(
      <Probe className="ours" render={renderLink}>
        Label
      </Probe>,
    )
    const link = view.getByRole('link', { name: 'Label' })

    expect(link.classList.contains('ours')).toBe(true)
    expect(link).toHaveAttribute('href', '#label')
  })

  it('includes the ref among those props', () => {
    const ref = createRef<HTMLButtonElement>()
    render(
      <Probe ref={ref} render={renderLink}>
        Label
      </Probe>,
    )

    expect(ref.current?.tagName).toBe('A')
  })
})
