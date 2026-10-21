import type { Decorator } from '@storybook/react-vite'

import DocsFrame from './components/DocsFrame'

/**
 * Draws a story framed on its Overview page in a frame `width` wide — see
 * `DocsFrame`. Set `docs.story.inline` off beside it, since an inline story
 * has no frame of its own to narrow.
 */
function docsFrameWidth(width: string): Decorator {
  return (Story) => (
    <DocsFrame width={width}>
      <Story />
    </DocsFrame>
  )
}

export { docsFrameWidth }
