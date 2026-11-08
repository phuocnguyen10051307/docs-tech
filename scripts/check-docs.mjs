import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname, relative, sep } from 'node:path'

const root = resolve('docs')
const failures = []
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.')) return []
    const path = resolve(dir, entry.name)
    return entry.isDirectory() ? walk(path) : path.endsWith('.md') ? [path] : []
  })
}
const files = walk(root)
const stripCode = text => text.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm, '')
// Cùng quy tắc với slugify của VitePress 1.6.4, gồm chuẩn hóa dấu tiếng Việt.
const slug = heading => heading.normalize('NFKD')
  .replace(/[\u0300-\u036f\u0000-\u001f]/g, '')
  .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g, '-')
  .replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '').replace(/^(\d)/, '_$1').toLowerCase()
const sources = new Map(files.map(file => [file, stripCode(readFileSync(file, 'utf8'))]))
const headings = new Map()
for (const [file, source] of sources) {
  const titles = [...source.matchAll(/^#{1,6}\s+(.+)$/gm)].map(match => match[1])
  const ids = titles.map(slug)
  headings.set(file, new Set(ids))
  if (new Set(ids).size !== ids.length) failures.push(`${relative(root, file)}: duplicate heading IDs`)
  // The homepage's H1 is rendered by its registered Vue component.
  if (file !== resolve(root, 'index.md') && [...source.matchAll(/^#\s+.+$/gm)].length !== 1) failures.push(`${relative(root, file)}: expected exactly one H1`)
}

const technologySections = ['Tổng quan', 'Yêu cầu trước khi bắt đầu', 'Cài đặt', 'Khởi tạo dự án', 'Cấu hình', 'Cấu trúc dự án', 'Lệnh thường dùng', 'Thực hành tốt', 'Xử lý lỗi', 'Đánh giá']
const guideSections = ['Mục tiêu dự án', 'Công nghệ sử dụng', 'Yêu cầu trước khi bắt đầu', 'Lệnh khởi tạo', 'Cấu hình môi trường', 'Cấu trúc thư mục đề xuất', 'Các bước thực hiện', 'Chạy và kiểm tra', 'Lỗi khởi tạo thường gặp', 'Kết quả mong đợi']
let links = 0
for (const [file, source] of sources) {
  const path = relative(root, file).split(sep).join('/')
  if (path !== 'index.md') {
    const sections = path.startsWith('technologies/') ? technologySections : path.startsWith('project-guides/') && path !== 'project-guides/index.md' ? guideSections : []
    for (const title of sections) if (!headings.get(file).has(slug(title))) failures.push(`${path}: missing section ${title}`)
  }
  for (const match of source.matchAll(/\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    const href = match[1]
    if (/^(https?:|mailto:|tel:|data:)/.test(href)) continue
    links++
    const [targetPath, fragment] = href.split('#')
    const clean = decodeURIComponent(targetPath.split('?')[0])
    let target = clean ? resolve(clean.startsWith('/') ? root : dirname(file), clean.replace(/^\//, '')) : file
    if (target.endsWith(sep)) target += 'index.md'
    if (!target.endsWith('.md')) {
      if (existsSync(`${target}.md`)) target += '.md'
      else if (existsSync(resolve(target, 'index.md'))) target = resolve(target, 'index.md')
      else target = resolve(root, 'public', clean.replace(/^\//, ''))
    }
    if (!existsSync(target)) failures.push(`${path}: missing target ${href}`)
    if (fragment && headings.has(target)) {
      const id = decodeURIComponent(fragment)
      if (!headings.get(target).has(id)) failures.push(`${path}: missing anchor ${href}`)
    }
  }
}

// Verify the shared homepage/sidebar catalog without executing TypeScript.
const catalog = readFileSync(resolve(root, '.vitepress/catalog.ts'), 'utf8')
const techBlock = catalog.split('export const projectGuides')[0]
const guideBlock = catalog.split('export const projectGuides')[1]
for (const [block, folder, index] of [[techBlock, 'technologies', true], [guideBlock, 'project-guides', false]]) {
  for (const [, entry] of block.matchAll(/slug: '([^']+)'/g)) {
    const target = resolve(root, folder, index ? `${entry}/index.md` : `${entry}.md`)
    if (!existsSync(target)) failures.push(`catalog: missing ${relative(root, target)}`)
  }
}
if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else console.log(`Kiểm tra tài liệu thành công: ${files.length} trang, ${links} liên kết nội bộ, các mục chuẩn và đích trong danh mục.`)
