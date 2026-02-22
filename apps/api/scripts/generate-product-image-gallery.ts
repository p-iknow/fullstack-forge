import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { PRODUCT_CATALOG } from '../src/db/seed-product-catalog'

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const baseUrl = process.env.IMAGE_BASE_URL ?? 'http://127.0.0.1:9002/product-images'
const outDir = resolve(import.meta.dirname, '../tmp')
const outFile = resolve(outDir, 'product-image-gallery.html')

const cards = PRODUCT_CATALOG.map((product, index) => {
  const i = String(index + 1).padStart(3, '0')
  const name = escapeHtml(product.name)
  const brand = escapeHtml(product.brand)
  const category = escapeHtml(product.categorySlug)
  const thumbUrl = `${baseUrl}/${product.thumbKey}`
  const detailUrl = `${baseUrl}/${product.detailKey}`

  return `<article class="card">
    <header>
      <div class="sku">SKU-${i}</div>
      <h2>${name}</h2>
      <p>${brand} · ${category}</p>
    </header>
    <div class="images">
      <a class="thumb" href="${thumbUrl}" target="_blank" rel="noreferrer">
        <img src="${thumbUrl}" alt="${name} thumb" loading="lazy" />
      </a>
      <a class="detail" href="${detailUrl}" target="_blank" rel="noreferrer">
        <img src="${detailUrl}" alt="${name} detail" loading="lazy" />
      </a>
    </div>
    <footer>
      <a href="${thumbUrl}" target="_blank" rel="noreferrer">thumb</a>
      <a href="${detailUrl}" target="_blank" rel="noreferrer">detail</a>
    </footer>
  </article>`
}).join('\n')

const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Product Image Gallery</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f3f4f6;
        --panel: #ffffff;
        --text: #111827;
        --muted: #6b7280;
        --line: #e5e7eb;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: radial-gradient(circle at 30% -10%, #ffffff, var(--bg) 60%);
        color: var(--text);
        font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      .wrap {
        max-width: 1600px;
        margin: 0 auto;
        padding: 24px;
      }
      .top {
        margin-bottom: 18px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: baseline;
      }
      h1 { margin: 0; font-size: 24px; }
      .meta { color: var(--muted); font-size: 14px; }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 14px;
      }
      .card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
      }
      .card header { padding: 10px 12px 8px; border-bottom: 1px solid var(--line); }
      .sku { font-size: 11px; color: var(--muted); letter-spacing: 0.08em; }
      .card h2 {
        margin: 2px 0 0;
        font-size: 15px;
        line-height: 1.25;
      }
      .card p { margin: 4px 0 0; color: var(--muted); font-size: 12px; }
      .images {
        display: grid;
        grid-template-columns: minmax(88px, 0.8fr) minmax(160px, 1.6fr);
        gap: 8px;
        padding: 10px;
      }
      .images a {
        display: block;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #fff;
      }
      img {
        width: 100%;
        display: block;
        border-radius: 8px;
        aspect-ratio: 1 / 1;
        object-fit: cover;
      }
      .images a.thumb img { aspect-ratio: 1 / 1; }
      .images a.detail img { aspect-ratio: 4 / 3; min-height: 150px; }
      .card footer {
        display: flex;
        gap: 10px;
        padding: 8px 12px 12px;
        border-top: 1px solid var(--line);
      }
      .card footer a {
        font-size: 12px;
        color: #2563eb;
        text-decoration: none;
      }
      .card footer a:hover { text-decoration: underline; }
      .toolbar {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
      }
      button {
        border: 1px solid var(--line);
        background: #fff;
        border-radius: 8px;
        padding: 6px 10px;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <main class="wrap">
      <section class="top">
        <h1>Product Image Gallery</h1>
        <span class="meta">48 products · 96 images</span>
        <span class="meta">base: ${escapeHtml(baseUrl)}</span>
      </section>
      <section class="toolbar">
        <button onclick="window.scrollTo({ top: 0, behavior: 'smooth' })">Top</button>
        <button onclick="window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })">Bottom</button>
      </section>
      <section class="grid">
        ${cards}
      </section>
    </main>
  </body>
</html>`

await mkdir(outDir, { recursive: true })
await writeFile(outFile, html, 'utf8')

console.log(`Generated gallery: ${outFile}`)
console.log('Open with local server (recommended):')
console.log('python3 -m http.server 4310 --directory tmp')
