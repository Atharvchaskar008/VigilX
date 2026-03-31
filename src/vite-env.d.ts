/// <reference types="vite/client" />

// Vite Plugin PWA provides this virtual module at build time.
// TypeScript needs a local declaration for `tsc --noEmit`.
declare module 'virtual:pwa-register' {
  export function registerSW(options?: { immediate?: boolean }): void;
}

