// Starts the Storybook dev server: `npm run storybook`, or `npm run dev`.
//
// The port is read here rather than in the npm script because npm runs scripts
// under `cmd.exe` on Windows, which expands neither `$PORT` nor
// `${PORT:-6006}`. Written in package.json, Storybook was handed the text as it
// stood and refused it as a port, so the command AGENTS.md gives for the dev
// server failed outright on Windows.
//
// `PORT` is what moves it, and `autoPort` in `.claude/launch.json` relies on
// that: the preview hands a second session a free port through `PORT`, which
// is what lets two agents preview the repo at once. Arguments after `--` go to
// Storybook after the port, so `npm run storybook -- --no-open` works, and a
// `-p` of its own given there wins over the one written here.

import { spawn, spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_PORT = '6006'

const scripts = dirname(fileURLToPath(import.meta.url))

const port = process.env.PORT ?? DEFAULT_PORT

// The tokens module the StyleX build reads is generated rather than committed,
// so it is built before the server starts, as every other script does.
const tokens = spawnSync(
  process.execPath,
  [join(scripts, 'build-tokens.mjs')],
  { stdio: 'inherit' },
)
if (tokens.status !== 0) {
  process.exit(tokens.status ?? 1)
}

// Storybook's own entry, the file its `storybook` bin points at, run with this
// Node rather than through the `.cmd` shim npm writes on Windows, which
// `spawn` cannot start without a shell.
const entry = fileURLToPath(
  import.meta.resolve('storybook/internal/bin/dispatcher'),
)

const server = spawn(
  process.execPath,
  [entry, 'dev', '-p', port, ...process.argv.slice(2)],
  { stdio: 'inherit' },
)

// A launcher that stops the process it started stops the server with it,
// rather than leaving it holding the port.
for (const signal of /** @type {const} */ (['SIGINT', 'SIGTERM'])) {
  process.on(signal, () => server.kill(signal))
}

server.on('exit', (code, signal) => {
  process.exit(code ?? (signal === null ? 0 : 1))
})
