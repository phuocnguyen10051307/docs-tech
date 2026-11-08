---
title: Docker bài 2 — đóng gói Express REST API
version: Level 2 · Node 22 · Express 5 · non-root
---

# Docker bài 2 — đóng gói Express REST API

::: warning Chưa kiểm thử
Docker daemon chưa chạy trong môi trường biên soạn. Build image, HTTP trong container, healthcheck, non-root và shutdown qua Docker chưa được xác nhận. Kiểm tra cú pháp hay chạy Node trên host không thay thế kiểm thử container.
:::

**Đã kiểm tra ngày 08/11/2026 trên host Node 24.0.2:** trích source từ bài, cài dependency (Express 5.3.0), kiểm tra cú pháp và chạy HTTP cho health, GET/POST, title sai, JSON sai, body quá lớn và 404. Các mã 200/201/400/413/404 đúng mong đợi; dữ liệu RAM mất sau khi khởi động lại tiến trình. Chưa xác nhận runtime Node 22 trong image, signal Linux hoặc thao tác Docker.

## Mục tiêu dự án

Tạo Express REST API từ thư mục trống, build image có dependency từ lockfile, chạy bằng user `node`, kiểm tra health/log và cập nhật image sau khi sửa source. API có `GET /items`, `POST /items`, dữ liệu chỉ nằm trong RAM để quan sát sự khác biệt với [bài 3 có PostgreSQL](./docker-express-postgresql).

Source đầy đủ được trình bày ngay trong bài, cùng nền Debian slim, thứ tự COPY tối ưu cache, `.dockerignore`, loopback, `--init` và non-root. Bạn có thể bắt đầu trực tiếp từ workspace trống.

## Công nghệ sử dụng

[Dockerfile](/technologies/docker/images-and-dockerfiles), Node image `22-bookworm-slim`, Express 5, npm lockfile. JavaScript ESM không cần biên dịch; multi-stage không đem lại lợi ích rõ cho API nhỏ này. Xem [ví dụ multi-stage TypeScript](/technologies/docker/images-and-dockerfiles) nếu ứng dụng có bước build thật.

## Yêu cầu trước khi bắt đầu

Docker Engine đang chạy, Linux containers, Node.js 22.12+ và npm trên host để tạo lockfile. Kiểm tra `docker version`, `node --version`, `npm --version`. Cổng host 3000 trống. Biết HTTP/JSON và JavaScript cơ bản; xem [Express](/technologies/express/) khi cần tìm hiểu routing.

## Lệnh khởi tạo

Từ thư mục cha thực hành:

```sh
mkdir docker-express
cd docker-express
mkdir src
```

Tạo `package.json` đầy đủ ban đầu:

```json
{
  "name": "handbook-docker-express",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js",
    "check": "node --check src/server.js"
  },
  "engines": { "node": ">=22.12.0" }
}
```

Tại `docker-express`:

```sh
npm install --save-exact express@5
```

Lệnh thêm dependency runtime `express` với phiên bản cụ thể vào manifest và tạo `package-lock.json`. Major 5 là giả định của bài; patch được npm giải tại lúc cài, không tuyên bố một patch cố định là mới nhất. Rà soát rồi lưu **cả manifest và lockfile** vào Git của workspace; các lần cài sau dùng `npm ci`. Không viết lockfile thủ công.

## Cấu hình môi trường

Tạo `.env.example`:

```dotenv
NODE_ENV=production
PORT=3000
```

Tạo `.gitignore`:

```text
node_modules/
.env
.env.*
!.env.example
*.log
```

API không cần secret. `PORT` là cổng **trong container**; đổi cổng host dùng phía trái của `-p`. Docker không tự nạp `.env` cho app; bài truyền biến bằng `-e`. Đừng thêm `.env` vào Dockerfile.

## Cấu trúc thư mục đề xuất

```text
docker-express/
├── src/server.js
├── package.json
├── package-lock.json      # Sinh bởi npm install, đưa vào Git
├── Dockerfile
├── .dockerignore
├── .gitignore
└── .env.example
```

## Các bước thực hiện

### 1. Viết API

Tạo `src/server.js`:

```js
import express from 'express'

const port = Number(process.env.PORT ?? 3000)
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT phải là số nguyên từ 1 đến 65535')
}
const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '16kb' }))
app.use((req, res, next) => {
  res.on('finish', () => console.log(`${req.method} ${req.path} ${res.statusCode}`))
  next()
})

let nextId = 1
const items = []
app.get('/health', (_req, res) => res.json({ status: 'ok' }))
app.get('/items', (_req, res) => res.json(items))
app.post('/items', (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : ''
  if (!title || title.length > 200) {
    return res.status(400).json({ error: 'title phải có từ 1 đến 200 ký tự' })
  }
  const item = { id: nextId++, title }
  items.push(item)
  res.status(201).json(item)
})
app.use((_req, res) => res.status(404).json({ error: 'Không tìm thấy endpoint' }))
app.use((err, _req, res, next) => {
  if (res.headersSent) return next(err)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON không hợp lệ' })
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Nội dung quá lớn' })
  }
  console.error('Lỗi API:', err.message)
  res.status(500).json({ error: 'Lỗi máy chủ' })
})

const server = app.listen(port, '0.0.0.0', () => console.log(`API đang nghe cổng ${port}`))
let closing = false
function shutdown() {
  if (closing) return
  closing = true
  console.log('Đang dừng API')
  const deadline = setTimeout(() => process.exit(1), 8000)
  deadline.unref()
  server.close(() => {
    clearTimeout(deadline)
    console.log('API đã dừng')
  })
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
```

Listen `0.0.0.0` để nhận request qua interface container; cổng host vẫn chỉ mở loopback. JSON có giới hạn kích thước và kiểm tra title. Log không ghi body/credential. `SIGTERM` đóng HTTP server, có deadline ngắn hơn thời gian stop container. API này chưa có auth/rate limit; không mở ra Internet.

### 2. Giới hạn build context

Tạo `.dockerignore`:

```text
node_modules
.git
.env
.env.*
!.env.example
*.log
coverage
dist
backups
```

Không mang dependency native từ host hoặc secret vào context. `.gitignore` chỉ điều khiển Git; không thay `.dockerignore`.

### 3. Định nghĩa image

Tạo `Dockerfile`:

```dockerfile
FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --chown=node:node src ./src
ENV NODE_ENV=production
ENV PORT=3000
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/health', {signal: AbortSignal.timeout(2000)}).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "src/server.js"]
```

Chép manifest trước source để bước `npm ci` có thể dùng cache khi chỉ code đổi. `--omit=dev` cài dependency runtime. `USER node` áp dụng cho server và healthcheck; cổng 3000 không cần root. `EXPOSE` không publish cổng. Probe dùng Node sẵn có, không cài curl riêng; trả mã 0 khi HTTP thành công. Healthcheck không tự restart container unhealthy.

Tag nền có thể cập nhật, nên khi phát hành thật hãy ghi digest đã rà soát và cập nhật có kiểm thử. Một image chỉ cố định major không đảm bảo tái lập từng byte. Nguồn: [image Node](https://hub.docker.com/_/node), [Dockerfile reference](https://docs.docker.com/reference/dockerfile/).

### 4. Kiểm tra source rồi build

Chạy tại `docker-express`:

```sh
npm run check
docker build --progress=plain -t handbook-express:local .
docker run -d --name handbook-express --init --stop-timeout=10 -p 127.0.0.1:3000:3000 -e PORT=3000 handbook-express:local
```

Dấu `.` là context. Không dùng `--rm` để còn đọc log/exit code sau khi stop. `--init` giúp xử lý signal và zombie con; ứng dụng vẫn tự đóng tài nguyên. `--stop-timeout=10` cho thời gian shutdown trước cưỡng bức dừng.

## Chạy và kiểm tra

### Request thành công và lỗi đầu vào

Bash:

```bash
curl -i http://127.0.0.1:3000/health
curl -i http://127.0.0.1:3000/items
curl -i -X POST http://127.0.0.1:3000/items -H 'Content-Type: application/json' -d '{"title":"Hoc Docker"}'
curl -i -X POST http://127.0.0.1:3000/items -H 'Content-Type: application/json' -d '{"title":""}'
curl -i http://127.0.0.1:3000/khong-ton-tai
```

PowerShell (tránh khác biệt escape JSON giữa các bản PowerShell):

```powershell
curl.exe -i http://127.0.0.1:3000/health
Invoke-RestMethod http://127.0.0.1:3000/items
Invoke-RestMethod http://127.0.0.1:3000/items -Method Post -ContentType 'application/json' -Body '{"title":"Hoc Docker"}'
curl.exe -i http://127.0.0.1:3000/khong-ton-tai
```

Để thử title rỗng trên PowerShell, đổi body thành `{"title":""}`; `Invoke-RestMethod` sẽ báo lỗi HTTP 400 như mong đợi. `/health` trả 200 và `{"status":"ok"}`, GET ban đầu trả `[]`, POST hợp lệ trả 201 với `{id,title}`, GET sau đó chứa item, title rỗng trả 400, endpoint lạ trả 404.

### Health, quyền và vòng đời

```sh
docker logs --tail=50 handbook-express
docker inspect --format '{{.State.Health.Status}}' handbook-express
docker exec handbook-express id
docker stop handbook-express
docker logs --tail=10 handbook-express
docker inspect --format '{{.State.ExitCode}}' handbook-express
docker start handbook-express
```

Chờ vài nhịp probe để thấy `healthy`. `id` phải cho user không phải root. Stop mong đợi log dừng và mã thoát 0 khi không có request kéo dài; sau start, GET `/items` trở lại `[]`. **Dữ liệu RAM mất khi tiến trình restart**, dù container cũ vẫn còn. Đây là giới hạn chủ động của bài, không phải lỗi Docker volume.

### Cập nhật image

Sửa source rồi tại workspace:

```sh
docker build -t handbook-express:local .
docker stop handbook-express
docker rm handbook-express
docker run -d --name handbook-express --init --stop-timeout=10 -p 127.0.0.1:3000:3000 handbook-express:local
```

Build lại tag không thay image của container đang có. Tạo lại container để chạy bản mới; gọi lại endpoint để xác nhận hành vi mới. Mất item RAM là dự kiến. Nếu chỉ cần cổng host khác, thay `3000:3000` thành `3001:3000` và gọi cổng 3001; không nhất thiết đổi `PORT` trong container.

## Lỗi khởi tạo thường gặp

| Triệu chứng | Nguyên nhân / cách sửa | Kiểm tra sau sửa |
| --- | --- | --- |
| `npm ci` lỗi lockfile | Chưa tạo lock hoặc manifest đã đổi | Chạy npm install có chủ đích, lưu lock, build lại |
| HTTP không truy cập được | Server bind loopback trong container hoặc sai publish | Listen `0.0.0.0`, `docker port handbook-express`, gọi lại URL |
| Container exited | Thiếu dependency, source lỗi hoặc biến PORT sai | `ps -a`, `logs`; sửa rồi build/tạo lại |
| Health unhealthy nhưng API mở được | Probe sai PORT/đường dẫn hoặc timeout | Xem `.State.Health`, chạy fetch bằng exec; sửa và chờ healthy |
| Sửa source không đổi hành vi | Chưa rebuild/recreate | Xem image ID; thực hiện quy trình cập nhật |
| Item mất sau restart | Dữ liệu chỉ trong RAM | Chuyển sang bài 3; volume không tự lưu biến JavaScript |
| Không dừng mềm được | Shell wrapper hoặc request treo | Dùng exec CMD, kiểm tra handler/deadline và log stop |

## Kết quả mong đợi

- [ ] Source/manifest/lockfile đủ để build trong context sạch.
- [ ] REST API trả mã HTTP đúng cho thành công, đầu vào lỗi và 404.
- [ ] Runtime non-root, healthcheck hoạt động và log đọc được.
- [ ] Phân biệt được rebuild, restart và recreate; hiểu dữ liệu RAM không bền vững.

### Dọn dẹp an toàn

```sh
docker stop handbook-express
docker rm handbook-express
```

Hai lệnh chỉ dừng/xóa container bài này và item trong RAM. Source và image còn; tùy chọn `docker image rm handbook-express:local` nếu không container nào còn dùng. Không xóa image nếu muốn dùng bài debug tiếp theo.

Production cần [giới hạn tài nguyên, hardening, log rotation](/technologies/docker/operations-security), TLS/proxy, auth và lưu trữ thật. Development có thể bind mount riêng `src` với Node watch; không mount đè dependency trong `/app`. Tiếp theo: [Express + PostgreSQL bằng Compose](./docker-express-postgresql). Tham khảo [Express error handling](https://expressjs.com/en/guide/error-handling/).
