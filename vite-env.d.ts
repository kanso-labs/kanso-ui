// Dormant, and kept on purpose. No tsconfig project covers this file, so
// nothing in it takes effect today — `tsc -b --force --listFiles` does not
// list it, and the build is green without it.
//
// It is orphaned rather than unused. What it declares is what
// `.storybook/components/StyleXLoader.tsx` reaches for, and `.storybook` is
// outside every project deliberately: Storybook's indexer reads preview.tsx
// as text and `eval`s its `storySort` expression as plain JavaScript, where a
// type annotation is a syntax error. The declarations and the directory they
// serve are therefore both outside the type system, which is why
// `import.meta.env` reads as an error type there and why that file carries a
// scoped oxlint disable.
//
// Giving `.storybook` a project of its own is what would make this take
// effect. Until something does, this is the record of what those two things
// are — which is the whole reason to keep a file that does nothing rather
// than delete it.
//
// `src` never depended on it. `tsconfig.lib.json` names `vite/client` in
// `types`, and that is where the library's own `import.meta` types come from,
// so the `/// <reference types="vite/client" />` line this file used to open
// with was answering a question nobody asked.
//
// A `declare module 'virtual:stylex.css'` sat here too, and is gone for a
// different reason: nothing imports that specifier. `vite.config.ts`,
// `vitest.setup.ts` and `StyleXLoader.tsx` each name it as a URL path, which
// is a string rather than a module, so the declaration could never have been
// reached even with a project covering it.

// `StyleXLoader.tsx` imports this so the dev server's stylesheet is
// re-fetched as newly transformed modules contribute rules to it.
declare module 'virtual:stylex:runtime'

// `StyleXLoader.tsx` reads `DEV` to choose between the dev server's
// stylesheet and the built one. `vite/client` declares the same pair, so this
// is what a project that did not pull those types in would need.
interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface ImportMetaEnv {
  readonly DEV: boolean
}
