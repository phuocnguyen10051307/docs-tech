---
title: React + Express + PostgreSQL
version: Express 5 · pg 8 · PostgreSQL 17 · Vite react-ts
---

# React + Express + PostgreSQL

::: warning Chưa kiểm thử
Ví dụ ứng dụng trong bài chưa được cài đặt và chạy đầy đủ trong đợt chỉnh sửa này. Các bước dưới đây là hướng dẫn thực hành và kết quả mong đợi; kiểm tra build của website không xác nhận ứng dụng mẫu hoạt động.
:::

## Mục tiêu dự án

Đọc ghi chú từ PostgreSQL qua API Express và hiển thị trong React. Trình duyệt không kết nối trực tiếp với cơ sở dữ liệu. Dự án chỉ đọc dữ liệu và chưa có tài khoản.

## Công nghệ sử dụng

Frontend [React](/technologies/react/) + [TypeScript](/technologies/typescript/), API [Express 5](/technologies/express/), connection pool `pg` và [PostgreSQL 17](/technologies/postgresql/) trong Docker. Proxy development của Vite nối giao diện với API.

## Yêu cầu trước khi bắt đầu

Node.js 22.12+, npm, [Docker cùng Compose v2](/technologies/docker/) và ba terminal. Kiểm tra `node --version`, `docker version`. Các cổng **5173**, **3000** và **5432** cần trống.

## Lệnh khởi tạo

Từ thư mục cha dành cho thực hành:

```sh
mkdir handbook-stack
cd handbook-stack
npm create vite@latest client -- --template react-ts
cd client
npm install
cd ..
mkdir server
cd server
npm init -y
npm pkg set type=module
npm install express@5 pg@8
npm pkg set "scripts.dev=node --env-file=.env --watch src/server.js"
npm pkg set "scripts.start=node src/server.js"
mkdir src
cd ..
mkdir db
```

Bạn đang ở `handbook-stack`. Client và server có manifest, lockfile riêng.

## Cấu hình môi trường

Tại **thư mục gốc repository**, tạo `.env.example`:

```dotenv
POSTGRES_USER=handbook
POSTGRES_PASSWORD=replace-with-local-password
POSTGRES_DB=handbook
```

Trong **server/.env.example**:

```dotenv
PORT=3000
DATABASE_URL=postgresql://handbook:replace-with-local-password@localhost:5432/handbook
```

Sao chép hai file mẫu thành `.env` tại thư mục tương ứng và thay mật khẩu giả bằng **cùng một mật khẩu chỉ dùng trên máy**. Mã hóa URL các ký tự đặc biệt khi đặt mật khẩu trong `DATABASE_URL`. Thêm `.env`, `node_modules/`, `dist/` vào `.gitignore` gốc; mẫu không có dấu `/` cũng áp dụng cho thư mục lồng nhau.

Sao chép bằng Bash tại thư mục gốc:

```bash
cp .env.example .env
cp server/.env.example server/.env
```

PowerShell: `Copy-Item .env.example .env` và `Copy-Item server/.env.example server/.env`.

## Cấu trúc thư mục đề xuất

```text
handbook-stack/
├── client/                 # Source React và cấu hình Vite
├── server/
│   ├── src/server.js
│   ├── .env.example
│   └── package.json
├── db/schema.sql
├── compose.yaml
├── .env.example
└── .gitignore
```

## Các bước thực hiện

### 1. Khởi chạy cơ sở dữ liệu

Tạo `db/schema.sql` tại gốc:

```sql
CREATE TABLE IF NOT EXISTS notes (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL
);
INSERT INTO notes (title) VALUES ('Hello from PostgreSQL');
```

Tạo `compose.yaml` tại gốc:

```yaml
services:
  db:
    image: postgres:17
    environment:
      POSTGRES_USER: ${POSTGRES_USER:?Set POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:?Set POSTGRES_DB}
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data
      - ./db/schema.sql:/docker-entrypoint-initdb.d/001-schema.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 5s
      retries: 10
volumes:
  pg_data:
```

Tại gốc, chạy `docker compose up -d db`, rồi `docker compose ps`. Chờ trạng thái **healthy**. SQL khởi tạo chỉ chạy với volume trống. Đường dẫn volume áp dụng cho PostgreSQL **17**; không đổi tag phiên bản chính trên dữ liệu hiện có như một cách nâng cấp.

### 2. Xây dựng API

Tạo `server/src/server.js`:

```js
import express from 'express'
import pg from 'pg'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const app = express()

app.get('/api/health', async (req, res) => {
  await pool.query('SELECT 1')
  res.json({ status: 'ok' })
})
app.get('/api/notes', async (req, res) => {
  const { rows } = await pool.query('SELECT id, title FROM notes ORDER BY id')
  res.json(rows)
})
app.use((req, res) => res.status(404).json({ error: 'Not found' }))
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err)
  console.error(err.message)
  res.status(500).json({ error: 'Internal server error' })
})

const server = app.listen(Number(process.env.PORT ?? 3000), () => {
  console.log('API ready on http://localhost:3000')
})
const shutdown = () => server.close(() => { void pool.end() })
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
```

Express 5 chuyển lỗi từ route bất đồng bộ đến error handler. Với truy vấn có đầu vào người dùng, dùng placeholder (`WHERE id = $1`) và mảng giá trị, không nối chuỗi. Xem [truy vấn node-postgres](https://node-postgres.com/features/queries).

### 3. Kết nối client

Thay nội dung `client/vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:3000' }
  }
})
```

Thay nội dung `client/src/App.tsx`:

```tsx
import { useEffect, useState } from 'react'
type Note = { id: number; title: string }

export default function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const response = await fetch('/api/notes', { signal: controller.signal })
        if (!response.ok) throw new Error(`Yêu cầu thất bại: ${response.status}`)
        const data: unknown = await response.json()
        if (!Array.isArray(data) || !data.every(note =>
          typeof note === 'object' && note !== null &&
          typeof note.id === 'number' && typeof note.title === 'string'
        )) throw new Error('Phản hồi API không đúng cấu trúc')
        setNotes(data as Note[])
      } catch (cause) {
        if (!controller.signal.aborted) setError(String(cause))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [])

  return <main>
    <h1>Ghi chú</h1>
    {loading && <p role="status">Đang tải…</p>}
    {error && <p role="alert">{error}</p>}
    <ul>{notes.map(note => <li key={note.id}>{note.title}</li>)}</ul>
    {!loading && !error && notes.length === 0 && <p>Chưa có ghi chú.</p>}
  </main>
}
```

## Chạy và kiểm tra

Terminal 1, tại `handbook-stack/server`: `npm run dev`.
Terminal 2, tại `handbook-stack/client`: `npm run dev`.
Terminal 3, tại `handbook-stack`:

```sh
docker compose exec db psql -U handbook -d handbook -c "SELECT * FROM notes;"
curl http://localhost:3000/api/health
curl http://localhost:3000/api/notes
```

Trên Windows dùng `curl.exe`. Mong đợi một dòng dữ liệu, `{"status":"ok"}` và mảng ghi chú JSON. Mở URL Vite hiển thị; ghi chú mẫu cần xuất hiện. Dừng API và tải lại giao diện để kiểm tra thông báo lỗi, rồi khởi động lại API.

Trong `client`, chạy `npm run lint` và `npm run build`. Dừng hai server bằng Ctrl+C. Tại gốc, dùng `docker compose stop` khi xong để giữ dữ liệu.

## Lỗi khởi tạo thường gặp

| Triệu chứng | Chẩn đoán và cách sửa |
| --- | --- |
| Cổng 5432 đang dùng | Đổi ánh xạ cổng máy sang `127.0.0.1:5433:5432` và URL server sang cổng 5433 |
| Relation notes does not exist | Script khởi tạo được thêm sau khi volume đã tạo. Kiểm tra database và áp dụng SQL đã rà soát, bảo toàn dữ liệu cần dùng |
| Password authentication failed | Volume cũ có thể dùng mật khẩu trước đó; đổi biến Compose không đổi người dùng đã có |
| Giao diện nhận HTML thay vì JSON | Kiểm tra đường dẫn proxy và API; khởi động lại Vite sau khi đổi cấu hình |
| API trong container không kết nối được | `localhost` chỉ container đó. Dùng tên service `db` và cổng 5432 trên mạng Compose |

## Kết quả mong đợi

- [ ] Database báo healthy và trả ghi chú mẫu.
- [ ] API trả dữ liệu và trả 404 cho đường dẫn không có.
- [ ] Giao diện hiển thị trạng thái tải, thành công và lỗi request.
- [ ] Lint và build client thành công.

Trong production, triển khai API riêng với secret được cấp lúc chạy, TLS database theo nhà cung cấp và migration. Phục vụ `client/dist` với `/api` chuyển tiếp đến API hoặc cấu hình API origin công khai với chính sách CORS phù hợp. **Proxy development của Vite không nằm trong bản build production.** Thêm phân quyền và kiểm tra dữ liệu trước khi cho phép ghi.

**Nguồn chính thức:** [Express](https://expressjs.com/) · [Pool node-postgres](https://node-postgres.com/features/pooling) · [Image PostgreSQL](https://hub.docker.com/_/postgres).
