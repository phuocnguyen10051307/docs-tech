import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { resolve, relative, sep } from 'node:path'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const output = resolve('dist')
const base = process.env.DOCS_BASE || '/'
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(dir, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}
const files = walk(output)
const pages = files.filter(file => file.endsWith('.html') && !file.endsWith(`${sep}404.html`))
let fragments = 0
let assets = 0
for (const file of pages) {
  const html = readFileSync(file, 'utf8')
  assert.match(html, /Developer Handbook/, file)
  assert.match(html, /<html lang="vi-VN"/, `${file}: Vietnamese locale`)
  assert.match(html, /aria-label="Tìm kiếm tài liệu"/, `${file}: search button`)
  assert.match(html, /VPSidebar/, `${file}: sidebar`)
  assert.match(html, /VPSwitchAppearance/, `${file}: theme control`)
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    if (href.startsWith('#')) {
      if (href.length > 1) {
        assert.ok(html.includes(`id="${decodeURIComponent(href.slice(1))}"`), `${file}: missing local fragment ${href}`)
        fragments++
      }
      continue
    }
    if (!href.startsWith(base) || /^(https?:)?\/\//.test(href)) continue
    const [path, id] = href.slice(base.length).split('#')
    let destination = resolve(output, decodeURIComponent(path || '.'))
    if (destination.endsWith(sep) || !path || path.endsWith('/')) destination = resolve(destination, 'index.html')
    if (existsSync(`${destination}.html`)) destination += '.html'
    assert.ok(existsSync(destination), `${file}: missing generated href ${href}`)
    if (id && destination.endsWith('.html')) {
      const target = readFileSync(destination, 'utf8')
      assert.ok(target.includes(`id="${decodeURIComponent(id)}"`), `${file}: missing generated fragment ${href}`)
      fragments++
    }
  }
  for (const [, url] of html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css|svg|woff2))"/g)) {
    if (!url.startsWith(base)) continue
    assert.ok(existsSync(resolve(output, url.slice(base.length))), `${file}: missing asset ${url}`)
    assets++
  }
}

const home = readFileSync(resolve(output, 'index.html'), 'utf8')
assert.match(home, /Tra cứu gọn/)
assert.match(home, /Đang biên soạn/)
assert.equal((home.match(/class="technology-card(?: contribute-card)?"/g) || []).length, 12, '11 technology cards plus contribution card')
const react = readFileSync(resolve(output, 'technologies/react/index.html'), 'utf8')
assert.match(react, /class="copy"/, 'built-in code copy buttons')
assert.match(react, /VPDocAsideOutline/, 'right-hand page outline')
assert.match(react, /aria-label="Đường dẫn điều hướng"/, 'document breadcrumbs')
assert.match(react, /Chưa kiểm thử/, 'unexecuted example notice')
assert.match(react, /title="Sao chép mã"/, 'localized code-copy label')

const indexFile = files.find(file => /@localSearchIndexroot\..*\.js$/.test(file))
assert.ok(indexFile, 'local search index emitted')
const search = readFileSync(indexFile, 'utf8')
for (const token of ['postgresql', 'n8n', 'EADDRINUSE', 'typescript', 'docker']) {
  assert.ok(search.toLowerCase().includes(token.toLowerCase()), `search corpus includes ${token}`)
}
// Exercise the same search engine and serialized index used by VitePress.
const frameworkRequire = createRequire(import.meta.resolve('vitepress'))
const MiniSearch = frameworkRequire('minisearch')
const serialized = (await import(pathToFileURL(indexFile).href)).default
const engine = MiniSearch.loadJSON(serialized, {
  fields: ['title', 'titles', 'text'],
  storeFields: ['title', 'titles'],
  searchOptions: { fuzzy: 0.2, prefix: true, boost: { title: 4, text: 2, titles: 1 } }
})
for (const [query, target] of [
  ['postgresql', '/project-guides/react-express-postgresql.html'],
  ['EADDRINUSE', '/references/common-errors.html'],
  ['n8n', '/technologies/n8n/'],
  ['typescrpt', '/technologies/typescript/'],
  ['biến môi trường', '/getting-started.html']
]) {
  assert.ok(engine.search(query).some(result => result.id.startsWith(`${base}${target.slice(1)}`)), `search query ${query} returns ${target}`)
}
const css = files.filter(file => file.endsWith('.css')).map(file => readFileSync(file, 'utf8')).join('')
assert.match(css, /max-width:700px/, 'mobile breakpoint')
assert.match(css, /prefers-reduced-motion/, 'reduced-motion styling')

const origin = process.env.SITE_ORIGIN
if (origin) {
  for (const file of pages) {
    const route = relative(output, file).split(sep).join('/')
    const response = await fetch(`${origin}${base}${route}`)
    assert.equal(response.status, 200, `HTTP ${route}`)
    assert.match(await response.text(), /Developer Handbook/, `served ${route}`)
  }
}
console.log(`Xác minh website thành công: ${pages.length} trang, ${fragments} anchor, ${assets} tham chiếu tài nguyên, 5 truy vấn tìm kiếm (gồm tiếng Việt và lỗi gõ), CSS responsive, nhãn tiếng Việt và điều hướng${origin ? ', cùng toàn bộ route HTTP' : ''}.`)
