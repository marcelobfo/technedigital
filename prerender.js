import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

// Polyfill browser globals for SSR/prerender in Node.js
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  key: () => null,
  length: 0,
};

if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = noopStorage;
}
if (typeof globalThis.sessionStorage === 'undefined') {
  globalThis.sessionStorage = noopStorage;
}
if (typeof globalThis.window === 'undefined') {
  globalThis.window = globalThis;
}
if (typeof globalThis.navigator === 'undefined') {
  globalThis.navigator = { language: 'pt-BR', userAgent: '' };
}
if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    documentElement: {
      classList: { add: () => {}, remove: () => {} },
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ style: {} }),
    head: { appendChild: () => {} },
  };
}

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const toAbsolute = (p) => path.resolve(__dirname, p)

const template = fs.readFileSync(toAbsolute('dist/index.html'), 'utf-8')
const { render } = await import('./dist/server/entry-server.js')

const routesToPrerender = fs
  .readdirSync(toAbsolute('src/pages'))
  .filter((file) => file.endsWith('.tsx') && !file.startsWith('admin'))
  .map((file) => {
    const name = file.replace(/\.tsx$/, '').toLowerCase()
    return name === 'index' ? `/` : `/${name}`
  })

;(async () => {
  for (const url of routesToPrerender) {
    try {
      const appHtml = render(url);
      const html = template.replace(`<!--app-html-->`, appHtml)

      const filePath = `dist${url === '/' ? '/index' : url}.html`
      fs.writeFileSync(toAbsolute(filePath), html)
      console.log('pre-rendered:', filePath)
    } catch (e) {
      console.warn(`Warning: Could not pre-render ${url}:`, e.message)
    }
  }
})()
