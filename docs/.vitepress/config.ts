import { defineConfig } from 'vitepress'
import { technologies, projectGuides } from './catalog'

export default defineConfig({
  title: 'Developer Handbook',
  description: 'Hướng dẫn cài đặt, lệnh thường dùng và xử lý lỗi trong công việc phát triển hằng ngày.',
  lang: 'vi-VN',
  base: process.env.DOCS_BASE || '/',
  outDir: '../dist',
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: `${process.env.DOCS_BASE || '/'}favicon.svg` }], ['meta', { name: 'theme-color', content: '#f8faf9' }]],
  markdown: { lineNumbers: true, codeCopyButtonTitle: 'Sao chép mã' },
  themeConfig: {
    logo: '/favicon.svg',
    siteTitle: 'Developer Handbook',
    nav: [
      { text: 'Sổ tay', link: '/', activeMatch: '^/(technologies/|getting-started|$)' },
      { text: 'Hướng dẫn dự án', link: '/project-guides/', activeMatch: '^/project-guides/' },
      { text: 'Tra cứu', items: [
        { text: 'Lệnh thường dùng', link: '/references/quick-commands' },
        { text: 'Lỗi thường gặp', link: '/references/common-errors' },
        { text: 'Ghi chú phiên bản', link: '/references/versions' }
      ] },
      { text: 'v1.0', link: '/references/versions' }
    ],
    sidebar: [
      { text: 'BẮT ĐẦU', items: [{ text: 'Trang chủ sổ tay', link: '/' }, { text: 'Bắt đầu sử dụng', link: '/getting-started' }] },
      { text: 'CÔNG NGHỆ', collapsed: false, items: technologies.map(t => ({
        text: t.name,
        link: `/technologies/${t.slug}/`,
        ...(t.slug === 'docker' ? {
          collapsed: true,
          items: [
            { text: 'Level 1: Kiến trúc và CLI', link: '/technologies/docker/fundamentals' },
            { text: 'Dockerfile, layer và cache', link: '/technologies/docker/images-and-dockerfiles' },
            { text: 'Compose, mạng và dữ liệu', link: '/technologies/docker/compose-networking-storage' },
            { text: 'Vận hành và bảo mật', link: '/technologies/docker/operations-security' },
            { text: 'Bài 1: Nginx và HTML', link: '/project-guides/docker-nginx' },
            { text: 'Bài 2: Express REST API', link: '/project-guides/docker-nodejs' },
            { text: 'Bài 3: Express + PostgreSQL', link: '/project-guides/docker-express-postgresql' }
          ]
        } : t.slug === 'n8n' ? {
          collapsed: true,
          items: [
            { text: 'Level 1: Editor và trigger', link: '/technologies/n8n/fundamentals' },
            { text: 'JSON, item và expression', link: '/technologies/n8n/data-and-expressions' },
            { text: 'HTTP Request và REST API', link: '/technologies/n8n/http-and-apis' },
            { text: 'Thiết kế và xử lý lỗi', link: '/technologies/n8n/workflow-design' },
            { text: 'PostgreSQL, Google và Telegram', link: '/technologies/n8n/integrations' },
            { text: 'AI Agent có kiểm soát', link: '/technologies/n8n/ai-agents' },
            { text: 'Self-hosting và vận hành', link: '/technologies/n8n/self-hosting' },
            { text: 'Cài n8n local bằng Compose', link: '/project-guides/n8n-compose' },
            { text: 'Bài 1: Lịch và API công khai', link: '/project-guides/n8n-scheduled-api' },
            { text: 'Bài 2: Webhook và PostgreSQL', link: '/project-guides/n8n-webhook-postgres' },
            { text: 'Bài 3: AI Agent và phê duyệt', link: '/project-guides/n8n-ai-agent' }
          ]
        } : {})
      })) },
      { text: 'THỰC HÀNH DỰ ÁN', collapsed: true, items: [{ text: 'Tất cả hướng dẫn dự án', link: '/project-guides/' }, ...projectGuides.map(g => ({ text: g.title, link: `/project-guides/${g.slug}` }))] },
      { text: 'TRA CỨU NHANH', items: [{ text: 'Lệnh thường dùng', link: '/references/quick-commands' }, { text: 'Lỗi thường gặp và cách xử lý', link: '/references/common-errors' }, { text: 'Ghi chú phiên bản', link: '/references/versions' }, { text: 'Biên soạn tài liệu', link: '/references/contributing' }] }
    ],
    search: {
      provider: 'local',
      options: {
        detailedView: true,
        translations: {
          button: { buttonText: 'Tìm kiếm', buttonAriaLabel: 'Tìm kiếm tài liệu' },
          modal: {
            displayDetails: 'Hiển thị chi tiết',
            resetButtonTitle: 'Xóa tìm kiếm',
            backButtonTitle: 'Đóng tìm kiếm',
            noResultsText: 'Không tìm thấy kết quả cho',
            footer: {
              selectText: 'chọn', selectKeyAriaLabel: 'Enter',
              navigateText: 'di chuyển', navigateUpKeyAriaLabel: 'Mũi tên lên',
              navigateDownKeyAriaLabel: 'Mũi tên xuống', closeText: 'đóng', closeKeyAriaLabel: 'Escape'
            }
          }
        }
      }
    },
    outline: { level: [2, 3], label: 'Trong trang này' },
    docFooter: { prev: 'Bài trước', next: 'Bài tiếp theo' },
    sidebarMenuLabel: 'Danh mục',
    returnToTopLabel: 'Về đầu trang',
    skipToContentLabel: 'Đến nội dung chính',
    langMenuLabel: 'Đổi ngôn ngữ',
    darkModeSwitchLabel: 'Giao diện',
    lightModeSwitchTitle: 'Chuyển sang chế độ sáng',
    darkModeSwitchTitle: 'Chuyển sang chế độ tối',
    notFound: {
      title: 'KHÔNG TÌM THẤY TRANG',
      quote: 'Trang có thể đã được chuyển hoặc đường dẫn chưa chính xác.',
      linkLabel: 'Về trang chủ', linkText: 'Về trang chủ'
    }
  }
})
