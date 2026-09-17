/// <reference types="vitest/config" />

import type { Plugin, ServerHook } from 'vite'

import styleDictionary from '@kanso-labs/unplugin-style-dictionary'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import stylex from '@stylexjs/unplugin'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { Server } from 'node:http'
import path from 'node:path'
import { defineConfig } from 'vite'

import {
  registerFormats,
  styleDictionaryConfig,
} from './scripts/build-tokens.mjs'

// `@stylexjs/unplugin` declares every framework entry as returning `any`, so
// the plugin each one does return is named once here rather than asserted at
// the call below.
const stylexVite: (options?: Parameters<typeof stylex.vite>[0]) => Plugin =
  stylex.vite

// The StyleX plugin, with the timer it leaks under Vitest cleared.
//
// Its `configureServer` starts a 150ms `setInterval` that polls the plugin's
// shared store and sends a `stylex:css-update` over the websocket whenever the
// rules it has collected change, and it clears that interval from
// `server.httpServer?.once('close')`. Vitest builds two Vite servers: the
// browser one, which owns an `httpServer`, and the root one, which runs in
// middleware mode and has none — so there the optional chain does nothing,
// nothing ever clears the interval, and a timer nobody unrefs keeps the event
// loop alive once the run is over. `close timed out after 10000ms` and `Tests
// closed successfully but something prevents the main process from exiting` on
// stderr at the end of every run is that timer, and so are the ten seconds
// Vitest waits before giving up and exiting anyway. Raising `teardownTimeout`
// only lengthens the wait: at 60s it still times out.
//
// Standing an unstarted `http.Server` in while the plugin's hook runs is what
// gives it a listener to register on — one that has called neither `listen`
// nor anything else, so it holds no handle of its own — and wrapping
// `server.close` is what fires the event. `httpServer` is put straight back
// afterwards, so Vite and every other plugin see the server they expect, and
// the browser server, which has a real one, is left alone.
//
// Upstream, in @stylexjs/unplugin: the interval wants clearing from somewhere
// that runs whether or not the server owns an HTTP listener. Drop this once a
// release does that.
function stylexPlugin(options?: Parameters<typeof stylex.vite>[0]): Plugin {
  const plugin = stylexVite(options)
  const { configureServer } = plugin

  // The hook may also be given as `{ handler, order }`, which this does not
  // unwrap — the plugin gives a plain function, and a release that changed
  // that should be read before being wrapped.
  if (typeof configureServer !== 'function') {
    return plugin
  }

  const hook: ServerHook = configureServer

  return {
    ...plugin,
    configureServer(server): ReturnType<ServerHook> {
      if (server.httpServer) {
        return hook.call(this, server)
      }

      const stand = new Server()
      server.httpServer = stand
      const result = hook.call(this, server)
      server.httpServer = null

      const close = server.close.bind(server)
      server.close = async () => {
        stand.emit('close')
        await close()
      }

      return result
    },
  }
}

export default defineConfig(({ command }) => ({
  // React Aria's virtualizer reads `process.env.NODE_ENV` and
  // `process.env.VIRT_ON` at runtime rather than behind a build-time
  // replacement, so a browser with no `process` throws `process is not
  // defined` the moment a `Virtualizer` renders — in Storybook and in both
  // test projects alike. Naming the two here is what replaces them with
  // literals before the code reaches the browser.
  //
  // Node's own value is passed through rather than a value chosen here.
  // `NODE_ENV` is `test` under vitest, and the field tests read it: inventing
  // `development` there changed what they were asserting on and failed five
  // of them. It is also what the virtualizer is asking about — under `test`
  // it renders every row rather than the window, which is what makes a
  // virtualized collection assertable at all.
  //
  // The whole of `process.env` is deliberately not shimmed: an empty object
  // would leave a consumer's own bundler doing the same thing in a way this
  // repo never exercises, and these are the two the virtualizer reads.
  define: {
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV ?? 'development',
    ),
    'process.env.VIRT_ON': 'undefined',
  },
  plugins: [
    // @kanso-labs/unplugin-style-dictionary@^0.2.1+ only — 0.2.0's
    // watchChange had no filtering, so it reacted to design.tokens.stylex.ts
    // regenerating (real components import it, putting it in the module
    // graph) and rebuilt forever under storybook dev. Fixed upstream in
    // kanso-labs/unplugin-style-dictionary#30; do not downgrade below 0.2.1.
    styleDictionary.vite({
      config: () => {
        registerFormats()
        return styleDictionaryConfig
      },
    }),
    stylexPlugin({
      dev: process.env.NODE_ENV === 'development',
      // The dev server answers `/virtual:stylex.css` from whatever modules
      // the plugin has transformed so far. The `media` queries the pane
      // layouts and Sheet key their styles on are `defineConsts`, which
      // compile into each consumer as a `var(--hash)` placeholder that is
      // only substituted once the tokens module's own rules are in the
      // plugin's store — and on a cold start that module, the largest the
      // plugin handles, lands last. An answer assembled in between holds
      // `var(--x){.x.x{…}}`, which lightningcss rejects as an empty
      // selector: the request fails with `Internal server error: Invalid
      // empty selector`, Vite puts its error overlay into every open iframe,
      // and the a11y check then fails every story on the page. "Testing" in
      // AGENTS.md says which runs that lands on.
      //
      // errorRecovery has lightningcss drop what it cannot parse instead, so
      // an intermediate answer is incomplete rather than an error, and the
      // plugin's runtime refetches the stylesheet as soon as the tokens land
      // — the path every late rule already reaches the page by. Dev server
      // only, which is `serve` for Vitest and Storybook alike: a build's
      // stylesheet is final and has to parse.
      lightningcssOptions:
        command === 'serve' ? { errorRecovery: true } : undefined,
      runtimeInjection: false,
      useCSSLayers: true,
    }),
    // The same panic threshold the package build runs under, so a function
    // the compiler cannot compile fails here too — at the story or the test
    // that renders it, rather than only at `npm run build`. See the comment
    // beside it in tsdown.config.ts for why it is `all_errors`.
    react({ compiler: { panicThreshold: 'all_errors' } }),
  ],
  test: {
    coverage: {
      exclude: [
        'src/**/*.stories.tsx',
        'src/**/*.test.{ts,tsx}',
        // Storybook material rather than library source, like the generated
        // tokens beside it: the demo schemes are `createTheme` calls with
        // nothing to execute, so counting them would only report 100% for a
        // file no test could ever move.
        'src/theming/**',
        'src/tokens/**',
      ],
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
      reporter: ['text', 'cobertura'],
    },
    // The file `Upload test results to Codecov` hands over. It goes under
    // `.vitest/`, named for the tool that writes it the way `.vite/` beside it
    // in `.gitignore` already is, so one ignored directory covers this report
    // and anything Vitest writes next to it.
    //
    // Set here rather than inside a project, because both of them report into
    // one file: a suite Codecov can read as a whole is the point, and a
    // per-project setting would have the second overwrite the first.
    outputFile: { junit: '.vitest/test-results.junit.xml' },
    projects: [
      {
        extends: true,
        optimizeDeps: {
          include: ['@testing-library/dom', '@testing-library/jest-dom'],
        },
        plugins: [
          storybookTest({
            configDir: path.join(import.meta.dirname, '.storybook'),
          }),
        ],
        test: {
          browser: {
            enabled: true,
            headless: true,
            instances: [
              {
                browser: 'chromium',
              },
            ],
            provider: playwright({}),
          },
          name: 'storybook',
        },
      },
      // Runs in the same browser as the storybook project on purpose. Under
      // `environment: 'node'` these files get a different transform pipeline,
      // so sources shared with that project are instrumented twice with
      // mismatched statement maps and the merged coverage totals go wrong.
      {
        extends: true,
        optimizeDeps: {
          include: ['@testing-library/dom', '@testing-library/react'],
        },
        test: {
          browser: {
            enabled: true,
            headless: true,
            instances: [
              {
                browser: 'chromium',
              },
            ],
            provider: playwright({}),
            // storybookTest sets this for the other project; without it a
            // failure here writes a stray PNG into src/.
            screenshotFailures: false,
          },
          include: ['src/**/*.test.{ts,tsx}'],
          name: 'unit',
          setupFiles: [path.join(import.meta.dirname, 'vitest.setup.ts')],
        },
      },
    ],
    // `default` stays in the list so the run still reads the same in a
    // terminal — a `junit` reporter on its own replaces that output rather
    // than adding to it. `outputFile` above says where the second one writes.
    reporters: ['default', 'junit'],
  },
}))
