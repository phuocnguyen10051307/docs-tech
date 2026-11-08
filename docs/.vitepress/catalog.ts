export type Category = 'Frontend' | 'Backend' | 'Hạ tầng' | 'Quy trình'
export const technologies: { slug: string; name: string; symbol: string; color: string; category: Category; description: string; starter?: boolean }[] = [
  { slug: 'react', name: 'React', symbol: '⚛', color: '#087ea4', category: 'Frontend', description: 'Component, hook và cách bắt đầu xây dựng giao diện.' },
  { slug: 'typescript', name: 'TypeScript', symbol: 'TS', color: '#3178c6', category: 'Frontend', description: 'Cấu hình compiler, quy ước kiểu dữ liệu và cách kiểm tra.' },
  { slug: 'javascript', name: 'JavaScript', symbol: 'JS', color: '#947009', category: 'Frontend', description: 'Kiến thức nền: module, bất đồng bộ và cách viết code thường gặp.', starter: true },
  { slug: 'nodejs', name: 'Node.js', symbol: 'N', color: '#43853d', category: 'Backend', description: 'Từ server đầu tiên đến biến môi trường và script production.' },
  { slug: 'express', name: 'Express.js', symbol: 'ex', color: '#68717d', category: 'Backend', description: 'API gọn với routing, middleware và xử lý lỗi.' },
  { slug: 'nextjs', name: 'Next.js', symbol: 'N↗', color: '#68717d', category: 'Frontend', description: 'Nền tảng App Router cho ứng dụng React kết xuất trên server.', starter: true },
  { slug: 'docker', name: 'Docker', symbol: '▤', color: '#087fca', category: 'Hạ tầng', description: 'Môi trường nhất quán với image, container, volume và Compose.' },
  { slug: 'postgresql', name: 'PostgreSQL', symbol: 'PG', color: '#416b94', category: 'Hạ tầng', description: 'Dữ liệu quan hệ, SQL và lưu trữ bền vững trên máy.', starter: true },
  { slug: 'prisma', name: 'Prisma', symbol: '◭', color: '#546b9b', category: 'Backend', description: 'Bước đầu về schema, migration và database client có kiểu.', starter: true },
  { slug: 'n8n', name: 'n8n', symbol: 'n8n', color: '#cf5268', category: 'Quy trình', description: 'Kết nối công cụ bằng workflow chạy trên máy của bạn.' },
  { slug: 'git', name: 'Git & GitHub', symbol: '⎇', color: '#d85536', category: 'Quy trình', description: 'Branch, commit, remote và quy trình Git hằng ngày.', starter: true }
]

export const projectGuides = [
  { slug: 'react-typescript-vite', title: 'React + TypeScript + Vite', detail: 'Frontend có kiểu dữ liệu, kèm cách build.', time: '10 phút', tags: 'Frontend · Cơ bản' },
  { slug: 'react-express-postgresql', title: 'React + Express + PostgreSQL', detail: 'Nối giao diện React với API và cơ sở dữ liệu.', time: '25 phút', tags: 'Full stack · Trung cấp' },
  { slug: 'nextjs-fullstack', title: 'Ứng dụng Next.js full stack', detail: 'Server Component và route handler đầu tiên.', time: '15 phút', tags: 'Full stack · Trung cấp' },
  { slug: 'docker-nodejs', title: 'Đóng gói Node.js bằng Docker', detail: 'Đóng gói API nhỏ thành image có thể tái lập.', time: '15 phút', tags: 'Hạ tầng · Cơ bản' },
  { slug: 'n8n-compose', title: 'Tự chạy n8n bằng Docker Compose', detail: 'Môi trường workflow với dữ liệu lưu bền vững.', time: '15 phút', tags: 'Quy trình · Trung cấp' }
]
