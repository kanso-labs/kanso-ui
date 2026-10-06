// An extra entry of the bundle (cfg.extraEntries), evaluated before any
// component renders. kanso's dist is built with the React Compiler, so every
// component calls `c` from react/compiler-runtime. The converter maps that
// import onto window.React, which carries React's runtime under
// __COMPILER_RUNTIME rather than as `c`, so without this every component
// threw "c is not a function" on its first render in a design. This points
// `c` at React's own function; it adds no implementation of its own.
//
// The export keeps the module in the bundle: kanso's package.json declares
// only its CSS as having side effects, so esbuild may drop a file inside the
// package whose exports nothing uses, and with it the assignment.
function patch() {
  const React = typeof window === 'undefined' ? undefined : window.React;
  if (React && typeof React.c !== 'function' && typeof React.__COMPILER_RUNTIME?.c === 'function') {
    React.c = React.__COMPILER_RUNTIME.c;
  }
  return typeof React?.c === 'function';
}

export const __dsReactCompilerRuntime = patch();
