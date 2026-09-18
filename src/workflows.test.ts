import { describe, expect, it } from 'vitest'

// Every workflow as text. Read rather than parsed: what matters here is what
// the file says, and the two facts below — a group that cancels off main, and
// a job name the ruleset matches on — are both exact strings.
const WORKFLOWS = import.meta.glob('../.github/workflows/*.yaml', {
  eager: true,
  import: 'default',
  query: '?raw',
})

// The contexts ruleset 18125383 requires, each posted by a job of the same
// name. GitHub matches them by exact string, so renaming a job edits the merge
// gate rather than the label on it — and a pull request then waits on a
// context nothing will ever post.
const REQUIRED_CONTEXTS = [
  'Build',
  'Lint',
  'Run visual regression tests',
  'Test',
]

// Cancelling a superseded run is safe on a branch and is not on main, where a
// push is the repository re-verifying what it just merged. Every group here
// spells that out the same way.
const CANCELS_OFF_MAIN =
  "cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}"

const files = Object.entries(WORKFLOWS).map(([path, text]) => ({
  name: path.split('/').at(-1) ?? path,
  text,
}))

// A workflow a pull request starts, which is the set that can pile up as a
// branch is pushed to.
const onPullRequest = files.filter(({ text }) => text.includes('pull_request:'))

const jobNames = files.flatMap(({ text }) =>
  [...text.matchAll(/^ {4}name: (.+)$/gmu)].map((match) => match[1]?.trim()),
)

describe('the workflows', () => {
  it('are readable, and some run on a pull request', () => {
    // Empty lists would make every case below vacuous.
    expect(files.length).toBeGreaterThan(0)
    expect(onPullRequest.length).toBeGreaterThan(0)
  })

  // Three pushes in a minute otherwise run three of each to completion while
  // only the last is being read.
  it('each group the runs a pull request starts', () => {
    const ungrouped = onPullRequest
      .filter(({ text }) => !text.includes('\nconcurrency:'))
      .map(({ name }) => name)

    expect(ungrouped).toEqual([])
  })

  it('cancel a superseded run everywhere but main', () => {
    const wrong = onPullRequest
      .filter(({ text }) => !text.includes(CANCELS_OFF_MAIN))
      .map(({ name }) => name)

    expect(wrong).toEqual([])
  })

  // Keyed per workflow, so Build never waits on Lint or Test for a slot.
  it('give each workflow a group of its own', () => {
    const groups = onPullRequest.map(
      ({ text }) => /^ {2}group: (.+)$/mu.exec(text)?.[1] ?? '',
    )

    expect(new Set(groups).size).toBe(groups.length)
  })

  // Renaming a job is what silently breaks the merge gate, so this is pinned
  // here rather than left to whoever remembers the ruleset exists.
  it.each(REQUIRED_CONTEXTS)('still post the %s context', (context) => {
    expect(jobNames).toContain(context)
  })
})
