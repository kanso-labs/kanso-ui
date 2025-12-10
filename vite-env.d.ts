/// <reference types="vite/client" />

declare module 'virtual:stylex.css'
declare module 'virtual:stylex:runtime'

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface ImportMetaEnv {
  readonly DEV: boolean
}
