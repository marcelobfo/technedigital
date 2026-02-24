import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

// Polyfill browser globals for SSR/prerender in Node.js

// Element class polyfill (needed by @hello-pangea/dnd and other DOM libs)
if (typeof globalThis.Element === 'undefined') {
  globalThis.Element = class Element {
    constructor() {
      this.style = {};
      this.childNodes = [];
      this.children = [];
      this.innerHTML = '';
      this.textContent = '';
      this.parentNode = null;
      this.nodeType = 1;
      this.nodeName = 'DIV';
      this.ownerDocument = null;
    }
    setAttribute() {}
    getAttribute() { return null; }
    removeAttribute() {}
    addEventListener() {}
    removeEventListener() {}
    appendChild() {}
    removeChild() {}
    insertBefore() {}
    dispatchEvent() { return true; }
    getBoundingClientRect() { return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }; }
    matches() { return false; }
    closest() { return null; }
    querySelectorAll() { return []; }
    querySelector() { return null; }
  };
  // Add common methods to prototype so `name in Element.prototype` checks pass
  Element.prototype.matches = Element.prototype.matches || function() { return false; };
  Element.prototype.msMatchesSelector = Element.prototype.msMatchesSelector || function() { return false; };
  Element.prototype.webkitMatchesSelector = Element.prototype.webkitMatchesSelector || function() { return false; };
}

if (typeof globalThis.HTMLElement === 'undefined') {
  globalThis.HTMLElement = globalThis.Element;
}

if (typeof globalThis.Node === 'undefined') {
  globalThis.Node = class Node {
    constructor() {
      this.nodeType = 1;
    }
  };
  globalThis.Node.ELEMENT_NODE = 1;
  globalThis.Node.TEXT_NODE = 3;
  globalThis.Node.COMMENT_NODE = 8;
  globalThis.Node.DOCUMENT_NODE = 9;
}

if (typeof globalThis.Event === 'undefined') {
  globalThis.Event = class Event {
    constructor(type) { this.type = type; }
  };
}

if (typeof globalThis.CustomEvent === 'undefined') {
  globalThis.CustomEvent = class CustomEvent extends globalThis.Event {
    constructor(type, params = {}) {
      super(type);
      this.detail = params.detail || null;
    }
  };
}

if (typeof globalThis.MutationObserver === 'undefined') {
  globalThis.MutationObserver = class MutationObserver {
    constructor() {}
    observe() {}
    disconnect() {}
    takeRecords() { return []; }
  };
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
}

if (typeof globalThis.getComputedStyle === 'undefined') {
  globalThis.getComputedStyle = () => ({
    getPropertyValue: () => '',
  });
}

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
  const createMockElement = () => ({
    style: {},
    setAttribute: () => {},
    getAttribute: () => null,
    removeAttribute: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    appendChild: () => {},
    removeChild: () => {},
    insertBefore: () => {},
    classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
    childNodes: [],
    children: [],
    innerHTML: '',
    textContent: '',
    parentNode: null,
    nodeType: 1,
    nodeName: 'DIV',
    ownerDocument: null,
    dispatchEvent: () => true,
    getBoundingClientRect: () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }),
  });

  globalThis.document = {
    documentElement: {
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      setAttribute: () => {},
      getAttribute: () => null,
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    getElementsByTagName: () => [],
    getElementsByClassName: () => [],
    createElement: () => createMockElement(),
    createElementNS: () => createMockElement(),
    createTextNode: () => ({ nodeType: 3, textContent: '' }),
    createComment: () => ({ nodeType: 8 }),
    createDocumentFragment: () => ({ appendChild: () => {}, childNodes: [] }),
    head: { appendChild: () => {}, removeChild: () => {}, insertBefore: () => {} },
    body: { appendChild: () => {}, removeChild: () => {}, insertBefore: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const toAbsolute = (p) => path.resolve(__dirname, p)

const template = fs.readFileSync(toAbsolute('dist/index.html'), 'utf-8')
const { render } = await import('./dist/server/entry-server.js')

// Only pre-render key static pages (skip dynamic routes that need DB data)
const routesToPrerender = [
  '/',
  '/about',
  '/services',
  '/portfolio',
  '/blog',
  '/contact',
  '/privacy',
  '/terms',
];

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

// Generate dynamic sitemap.xml with blog posts and portfolio projects
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const baseUrl = 'https://technedigital.com.br';
const today = new Date().toISOString().split('T')[0];

async function generateSitemap() {
  const staticUrls = [
    { loc: baseUrl, priority: '1.0', changefreq: 'daily' },
    { loc: `${baseUrl}/about`, priority: '0.8', changefreq: 'monthly' },
    { loc: `${baseUrl}/services`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${baseUrl}/portfolio`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${baseUrl}/blog`, priority: '0.9', changefreq: 'daily' },
    { loc: `${baseUrl}/contact`, priority: '0.8', changefreq: 'monthly' },
    { loc: `${baseUrl}/privacy`, priority: '0.3', changefreq: 'yearly' },
    { loc: `${baseUrl}/terms`, priority: '0.3', changefreq: 'yearly' },
  ];

  let blogUrls = [];
  let portfolioUrls = [];

  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      // Fetch published blog posts
      const postsRes = await fetch(
        `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,updated_at&status=eq.published&order=updated_at.desc`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      if (postsRes.ok) {
        const posts = await postsRes.json();
        blogUrls = posts.map(p => ({
          loc: `${baseUrl}/blog/${p.slug}`,
          lastmod: p.updated_at.split('T')[0],
          priority: '0.7',
          changefreq: 'monthly',
        }));
        console.log(`Sitemap: found ${blogUrls.length} blog posts`);
      }

      // Fetch active portfolio projects
      const projRes = await fetch(
        `${SUPABASE_URL}/rest/v1/portfolio_projects?select=slug,created_at&status=eq.active&order=created_at.desc`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      if (projRes.ok) {
        const projects = await projRes.json();
        portfolioUrls = projects.map(p => ({
          loc: `${baseUrl}/portfolio/${p.slug}`,
          lastmod: p.created_at.split('T')[0],
          priority: '0.7',
          changefreq: 'monthly',
        }));
        console.log(`Sitemap: found ${portfolioUrls.length} portfolio projects`);
      }
    } catch (e) {
      console.warn('Sitemap: could not fetch dynamic data:', e.message);
    }
  } else {
    console.warn('Sitemap: no Supabase credentials, using static URLs only');
  }

  const allUrls = [...staticUrls, ...blogUrls, ...portfolioUrls];
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const u of allUrls) {
    xml += '  <url>\n';
    xml += `    <loc>${u.loc}</loc>\n`;
    xml += `    <lastmod>${u.lastmod || today}</lastmod>\n`;
    xml += `    <changefreq>${u.changefreq}</changefreq>\n`;
    xml += `    <priority>${u.priority}</priority>\n`;
    xml += '  </url>\n';
  }
  xml += '</urlset>';

  fs.writeFileSync(toAbsolute('dist/sitemap.xml'), xml);
  console.log(`Sitemap generated: ${allUrls.length} URLs`);
}

await generateSitemap();
