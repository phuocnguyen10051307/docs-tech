---
title: Docker bài 3 — Express và PostgreSQL bằng Compose
version: Level 2 · Express 5 · pg 8 · PostgreSQL 17 · Compose v2
---

# Docker bài 3 — Express và PostgreSQL bằng Compose

::: warning Chưa kiểm thử
Docker daemon chưa chạy trong môi trường biên soạn. Build/pull image, init PostgreSQL, DNS, HTTP qua container, healthcheck, lưu volume và backup/restore chưa được chạy thực tế. Các bước và kết quả bên dưới là hướng dẫn tự xác nhận, không phải báo cáo đã vượt qua kiểm thử tích hợp.
:::

**Đã kiểm tra ngày 08/11/2026:** Compose 2.30.3 chấp nhận cấu hình nền và bản merge development qua `config --quiet`. Source trích từ bài chạy trên host Node 24.0.2 với Express 5.3.0/pg 8.23.1: health trả 200, readiness và GET dữ liệu trả 503 khi DB không có, đầu vào sai/JSON sai trả 400, body quá lớn trả 413, endpoint lạ trả 404. Chưa xác nhận kết nối DB thành công hoặc bất kỳ hành vi container nào.

## Mục tiêu dự án

Từ workspace trống, tạo REST API đọc/ghi ghi chú trong PostgreSQL, chạy bằng Compose. Hoàn thành bài khi API truy cập DB qua DNS `db`, dữ liệu còn sau khi tạo lại container, readiness phản ánh DB gián đoạn và backup được phục hồi thử vào database riêng.

Đây là **môi trường local** chưa có đăng nhập, TLS hoặc rate limit, không mở trực tiếp ra Internet. Tài khoản bootstrap PostgreSQL có quyền quản trị; API dùng role `handbook_app` chỉ có quyền đọc/chèn trên bảng và sử dụng sequence cần thiết.

## Công nghệ sử dụng

Node `22-bookworm-slim`, Express 5, node-postgres `pg` major 8, PostgreSQL `17-bookworm`, Compose v2, hai network riêng và named volume. Giữ PostgreSQL 17 để có bố trí dữ liệu rõ ràng; không đổi sang major khác trên volume hiện có. Xem [Docker Compose và storage](/technologies/docker/compose-networking-storage).

```text
Host browser / CLI
       │ 127.0.0.1:3000
       ▼
  api (user node) ─── app_net (bridge)
       │
       └──── data_net (internal bridge, DNS db:5432)
                         │
                    db (PostgreSQL)
                         │ /var/lib/postgresql/data
                    pg_data (named volume)
```

`db` không publish cổng 5432; browser không gọi database trực tiếp. API chung mạng DB nhưng không nhận mật khẩu admin.

## Yêu cầu trước khi bắt đầu

- Hoàn tất [bài 2](./docker-nodejs) hoặc hiểu Dockerfile, non-root, port và log.
- Docker Engine đang chạy, Compose v2, Linux containers, Node.js 22.12+ và npm trên host.
- Cổng 3000 trống; workspace mới, không dùng database/volume có dữ liệu thật để thử.
- Biết SQL/JavaScript cơ bản. Không cần cài PostgreSQL client trên host vì dùng client trong container DB.

Các lệnh một dòng Docker/npm dùng được trên Bash và PowerShell. HTTP và thao tác sao chép file môi trường có ví dụ theo shell. Lưu source/SQL dạng UTF-8; không lưu BOM vào file JSON nếu công cụ không hỗ trợ.

## Lệnh khởi tạo

Từ thư mục cha thực hành:

```sh
mkdir docker-notes
cd docker-notes
mkdir src
mkdir db
mkdir backups
```

Tạo `package.json` ban đầu:

```json
{
  "name": "handbook-docker-notes",
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

Trong `docker-notes`, chạy:

```sh
npm install --save-exact express@5 pg@8
```

Lệnh bổ sung dependency với phiên bản cụ thể và sinh lockfile; major là giả định của bài, patch được giải lúc cài. Rà soát và đưa `package.json` đã cập nhật cùng `package-lock.json` vào Git workspace. Những lần cài sau dùng `npm ci`; không đưa dependency vào repository handbook.

## Cấu hình môi trường

Tạo `.env.example`:

```dotenv
API_PORT=3000
POSTGRES_PASSWORD=replace-with-local-admin-password
APP_DB_PASSWORD=replace-with-local-app-password
```

Sao chép rồi thay **cả hai** mật khẩu giả bằng giá trị khác nhau chỉ dùng local, không tái dùng mật khẩu tài khoản thật:

```bash
# Bash, tại docker-notes
cp .env.example .env
```

```powershell
# PowerShell, tại docker-notes
Copy-Item .env.example .env
```

Để tránh lỗi nội suy trong lần học đầu, có thể dùng mật khẩu ngẫu nhiên dạng chữ/số dài; khi dùng ký tự `$`, dấu nháy hay `#`, đọc quy tắc dotenv/nội suy và kiểm tra kín trên máy. API nhận các biến `PG*` tách rời, nên không cần tự mã hóa URL mật khẩu. Shell có thể override `.env`; không export nhầm biến cùng tên.

Tạo `.gitignore`:

```text
node_modules/
.env
.env.*
!.env.example
backups/
*.log
```

Mật khẩu trong `.env` không được mã hóa và có thể đọc bởi người có quyền Docker/host. Đây là cách học local; production dùng secret manager/file mount có quản lý và ứng dụng đọc file nếu được hỗ trợ.

## Cấu trúc thư mục đề xuất

```text
docker-notes/
├── src/server.js
├── db/init.sql
├── backups/               # Không đưa vào Git hoặc image
├── package.json
├── package-lock.json
├── Dockerfile
├── .dockerignore
├── compose.yaml
├── compose.dev.yaml        # Tùy chọn ở phần development
├── .env.example
├── .env                   # Chỉ trên máy
└── .gitignore
```

## Các bước thực hiện

### 1. Tạo schema và role ứng dụng

Tạo `db/init.sql`:

```sql
\getenv app_password APP_DB_PASSWORD
CREATE ROLE handbook_app LOGIN PASSWORD :'app_password'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
CREATE TABLE public.notes (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title varchar(200) NOT NULL CHECK (length(trim(title)) > 0)
);
INSERT INTO public.notes (title) VALUES ('Ghi chú đầu tiên từ PostgreSQL');

GRANT CONNECT ON DATABASE handbook TO handbook_app;
GRANT USAGE ON SCHEMA public TO handbook_app;
GRANT SELECT, INSERT ON TABLE public.notes TO handbook_app;
GRANT USAGE, SELECT ON SEQUENCE public.notes_id_seq TO handbook_app;
```

`\getenv` là meta-command của psql 17, lấy biến môi trường mà không chép mật khẩu vào source; `:'app_password'` quote giá trị như SQL literal. Đừng thay bằng nối chuỗi SQL không escape. `handbook` và các role là tên cố định trong bài; nếu đổi phải cập nhật đồng bộ Compose, SQL và lệnh kiểm tra. Nguồn: [psql và nội suy biến](https://www.postgresql.org/docs/17/app-psql.html).

Image PostgreSQL chỉ thực thi init script khi data directory trống. Đổi file SQL sau lần chạy đầu **không tự migration**. Không dùng role admin cho API và không cấp CREATE/DROP chỉ để tiện sửa lỗi. Đổi password trong `.env` cũng không tự đổi password role trong DB đã khởi tạo.

### 2. Viết API có readiness và xử lý DB gián đoạn

Tạo `src/server.js`:

```js
import express from 'express'
import pg from 'pg'

for (const name of ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD']) {
  if (!process.env[name]) throw new Error(`Thiếu cấu hình ${name}`)
}
const port = Number(process.env.PORT ?? 3000)
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT phải là số nguyên từ 1 đến 65535')
}
const pool = new pg.Pool({
  max: 5,
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 10000,
  query_timeout: 3000
})
// pg đọc PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD từ runtime.
pool.on('error', err => console.error('Kết nối DB nhàn rỗi gặp lỗi:', err.code ?? 'DB_ERROR'))

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '16kb' }))
app.use((req, res, next) => {
  res.on('finish', () => console.log(`${req.method} ${req.path} ${res.statusCode}`))
  next()
})
app.get('/health', (_req, res) => res.json({ status: 'ok' }))
app.get('/ready', async (_req, res) => {
  try {
    await pool.query('SELECT id FROM public.notes LIMIT 1')
    res.json({ status: 'ready' })
  } catch {
    res.status(503).json({ status: 'not_ready' })
  }
})
app.get('/notes', async (_req, res) => {
  const { rows } = await pool.query('SELECT id, title FROM public.notes ORDER BY id LIMIT 100')
  res.json(rows)
})
app.post('/notes', async (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : ''
  if (!title || title.length > 200) {
    return res.status(400).json({ error: 'title phải có từ 1 đến 200 ký tự' })
  }
  const { rows } = await pool.query(
    'INSERT INTO public.notes (title) VALUES ($1) RETURNING id, title', [title]
  )
  res.status(201).json(rows[0])
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
  console.error('Yêu cầu DB thất bại:', err.code ?? 'DB_ERROR')
  res.status(503).json({ error: 'Chưa thể xử lý yêu cầu dữ liệu' })
})

const server = app.listen(port, '0.0.0.0', () => console.log(`API đang nghe cổng ${port}`))
let closing = false
function shutdown() {
  if (closing) return
  closing = true
  const deadline = setTimeout(() => process.exit(1), 8000)
  deadline.unref()
  server.close(() => {
    pool.end().then(() => {
      clearTimeout(deadline)
      console.log('Đã đóng HTTP và pool DB')
    }).catch(() => process.exit(1))
  })
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
```

`/health` kiểm tra tiến trình HTTP, `/ready` kiểm tra query thật bằng role ứng dụng và bảng cần dùng. Có timeout để không chờ DB vô hạn. Pool quản lý kết nối và có error listener cho kết nối idle bị ngắt; request kế tiếp có thể tạo kết nối mới khi DB hồi phục. Không tự retry POST vô điều kiện: nếu DB đã commit nhưng phản hồi mất, retry có thể tạo bản ghi trùng. Hệ thống thật cần idempotency/transaction phù hợp.

Express 5 chuyển rejection từ async route tới error handler. Query dùng `$1` và mảng giá trị để tránh SQL injection; không log password/chuỗi kết nối. GET chỉ trả tối đa 100 dòng cho demo, production cần phân trang. Nguồn: [Express async errors](https://expressjs.com/en/guide/error-handling/) · [truy vấn tham số pg](https://node-postgres.com/features/queries).

### 3. Đóng gói API

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
CMD ["node", "src/server.js"]
```

Không COPY SQL/backup vào API image; Compose mount SQL cho DB riêng. Giải thích layer/cache và non-root ở [chương Dockerfile](/technologies/docker/images-and-dockerfiles).

### 4. Khai báo Compose hoàn chỉnh

Tạo `compose.yaml`:

```yaml
name: docker-notes
services:
  api:
    build:
      context: .
    image: handbook-notes:local
    init: true
    restart: unless-stopped
    stop_grace_period: 10s
    ports:
      - "127.0.0.1:${API_PORT:-3000}:3000"
    environment:
      NODE_ENV: production
      PORT: "3000"
      PGHOST: db
      PGPORT: "5432"
      PGDATABASE: handbook
      PGUSER: handbook_app
      PGPASSWORD: ${APP_DB_PASSWORD:?Cần đặt APP_DB_PASSWORD trong .env}
    depends_on:
      db:
        condition: service_healthy
    networks:
      - app_net
      - data_net
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:3000/ready', {signal: AbortSignal.timeout(2000)}).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 15s
    cpus: "1.0"
    mem_limit: 256m
    pids_limit: 100
    read_only: true
    tmpfs:
      - /tmp:size=64m,mode=1777
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
  db:
    image: postgres:17-bookworm
    restart: unless-stopped
    environment:
      POSTGRES_USER: handbook_admin
      POSTGRES_DB: handbook
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Cần đặt POSTGRES_PASSWORD trong .env}
      APP_DB_PASSWORD: ${APP_DB_PASSWORD:?Cần đặt APP_DB_PASSWORD trong .env}
    volumes:
      - pg_data:/var/lib/postgresql/data
      - type: bind
        source: ./db/init.sql
        target: /docker-entrypoint-initdb.d/001-init.sql
        read_only: true
        bind:
          create_host_path: false
    networks:
      - data_net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -h 127.0.0.1 -U \"$$POSTGRES_USER\" -d \"$$POSTGRES_DB\""]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 20s
    cpus: "1.0"
    mem_limit: 512m
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
networks:
  app_net:
    driver: bridge
  data_net:
    driver: bridge
    internal: true
volumes:
  pg_data:
```

`data_net` chỉ có DB và API; DB không có đường publish host. API có thêm mạng `app_net` để phục vụ cổng publish và kết nối ra ngoài nếu cần. `internal` không thay grant/credential và không cô lập API khỏi DB vì API được chủ động cho vào cùng mạng.

`depends_on` đợi DB healthy ở lần khởi tạo, không bảo đảm DB mãi sẵn sàng. Probe DB dùng `-h 127.0.0.1` để kiểm tra TCP server chính, tránh hiểu nhầm temporary Unix-socket server trong giai đoạn init là hoàn tất. Probe API dùng `/ready` để bắt cả lỗi auth/schema. `$$` giữ biến cho shell container. Restart policy chỉ xử lý tiến trình thoát, không tự xử lý trạng thái unhealthy.

Giới hạn tài nguyên là giá trị **thực hành**, cần đo lại trước khi dùng thật. `read_only`, `cap_drop`, `no-new-privileges` chỉ áp dụng API; không ép DB dùng cấu hình không cho ghi dữ liệu. Named volume giữ data; log rotation giới hạn log từng container. Xem [vận hành](/technologies/docker/operations-security) để hiểu giới hạn các biện pháp này.

### 5. Khởi chạy lần đầu

Tại `docker-notes` sau khi đã sửa `.env`:

```sh
npm run check
docker compose config --quiet
docker compose config --services
docker compose pull db
docker compose up -d --build
docker compose ps -a
docker compose logs --tail=100 db api
```

Mong đợi hai service `api`, `db`; sau init/probe có trạng thái healthy. Nếu có lỗi SQL init, dừng và đọc log để sửa đúng bước; đừng lặp `down -v` trên dữ liệu có giá trị. `config --quiet` không in mật khẩu, nhưng `config` đầy đủ có thể in nên không paste vào nơi công khai.

### 6. Tùy chọn development

Tạo `compose.dev.yaml` nếu cần watch:

```yaml
services:
  api:
    environment:
      NODE_ENV: development
    command: ["node", "--watch", "src/server.js"]
    volumes:
      - ./src:/app/src:ro
```

```sh
docker compose -f compose.yaml -f compose.dev.yaml config --quiet
docker compose -f compose.yaml -f compose.dev.yaml up -d --build
```

Chỉ mount source để không che dependency. Thay package vẫn cần build lại. Các bước kiểm tra bên dưới dùng file nền; nếu đang chạy dev, chạy `docker compose up -d --build api` để trở về cấu hình nền trước. Không dùng override dev trong production.

## Chạy và kiểm tra

### HTTP và quyền người dùng

Các URL mặc định dùng `API_PORT=3000`; nếu đổi trong `.env`, cập nhật URL tương ứng.

Bash:

```bash
curl -i http://127.0.0.1:3000/health
curl -i http://127.0.0.1:3000/ready
curl -i http://127.0.0.1:3000/notes
curl -i -X POST http://127.0.0.1:3000/notes -H 'Content-Type: application/json' -d '{"title":"Du lieu duoc luu trong volume"}'
curl -i -X POST http://127.0.0.1:3000/notes -H 'Content-Type: application/json' -d '{"title":""}'
```

PowerShell:

```powershell
curl.exe -i http://127.0.0.1:3000/health
curl.exe -i http://127.0.0.1:3000/ready
Invoke-RestMethod http://127.0.0.1:3000/notes
Invoke-RestMethod http://127.0.0.1:3000/notes -Method Post -ContentType 'application/json' -Body '{"title":"Du lieu duoc luu trong volume"}'
```

PowerShell thử body title rỗng bằng cùng lệnh POST sẽ báo HTTP 400. Mong đợi `/health` 200 `ok`, `/ready` 200 `ready`, GET có dòng seed, POST hợp lệ 201, POST rỗng 400. Không giả định ID chính xác sau nhiều lần thử, hãy đối chiếu title và dữ liệu query.

```sh
docker compose exec api id
docker compose exec api node -e "require('node:dns').lookup('db', console.log)"
docker compose exec db psql -U handbook_admin -d handbook -c "SELECT id, title FROM public.notes ORDER BY id;"
docker compose exec db psql -U handbook_admin -d handbook -c "SELECT rolname, rolsuper, rolcreatedb FROM pg_roles WHERE rolname = 'handbook_app';"
```

API phải non-root, DNS trả địa chỉ container DB, query thấy ghi chú vừa thêm, role ứng dụng có `rolsuper=false`, `rolcreatedb=false`. Thành công của POST qua API cũng kiểm tra role có quyền INSERT/sequence; query admin đơn lẻ không xác nhận quyền API.

### Kiểm chứng volume qua xóa/tạo lại container

Ghi lại title đã POST rồi:

```sh
docker compose down
docker volume inspect docker-notes_pg_data
docker compose up -d
docker compose ps
```

Chờ healthy rồi GET `/notes` lần nữa. Ghi chú phải còn; init script không chạy lại trên volume cũ. `down` ở đây làm gián đoạn dịch vụ và xóa container/network nhưng giữ named volume. Không thêm `-v`.

### Mô phỏng database gián đoạn

Chỉ thực hiện trên workspace bài tập:

```sh
docker compose stop db
```

Gọi `/health` vẫn mong đợi 200 vì process API sống; `/ready` và request dữ liệu trả 503 sau timeout. Sau các probe thất bại, API có thể unhealthy nhưng không tự restart. Sau đó:

```sh
docker compose start db
docker compose ps
```

Chờ DB ready rồi gọi `/ready`, `/notes` lại. Mong đợi hồi phục 200 và dữ liệu vẫn còn. Có thể cần đợi nhịp healthcheck kế tiếp để Docker hiển thị healthy. Đây kiểm tra khả năng kết nối lại, không phải bằng chứng HA hay retry an toàn cho giao dịch.

### Backup và khôi phục thử không ghi đè dữ liệu gốc

**Chưa kiểm thử:** chạy khi DB đang healthy. Dùng client PostgreSQL cùng image 17, xuất custom archive trong container rồi `cp` ra host, tránh redirect binary bị khác giữa các bản PowerShell:

```sh
docker compose exec db pg_dump -U handbook_admin -d handbook -Fc -f /tmp/notes.dump
docker compose cp db:/tmp/notes.dump ./backups/notes.dump
docker compose exec db pg_restore --list /tmp/notes.dump
```

`-Fc` chọn custom archive. File host là bản cần giữ; file `/tmp` sẽ mất nếu xóa container. Tên mẫu cố định có thể ghi đè backup lần trước; thực tế dùng tên có thời điểm/phiên bản, giữ nhiều bản và sao lưu thêm ra ngoài host. `pg_restore --list` đọc danh mục archive, chưa chứng minh restore được.

Khôi phục **vào database thử mới**, không dùng database `handbook` đang phục vụ:

```sh
docker compose cp ./backups/notes.dump db:/tmp/notes-restore.dump
docker compose exec db createdb -U handbook_admin handbook_restore_check
docker compose exec db pg_restore -U handbook_admin --no-owner --no-privileges --exit-on-error -d handbook_restore_check /tmp/notes-restore.dump
docker compose exec db psql -U handbook_admin -d handbook_restore_check -c "SELECT id, title FROM public.notes ORDER BY id;"
```

Nếu tên database thử đã có, chọn tên thử mới và sửa đồng bộ lệnh; không drop database chưa xác định. Đối chiếu title/số dòng tại thời điểm backup. `--no-owner --no-privileges` làm bài thử không phụ thuộc việc tái lập ACL, vì vậy **chưa kiểm tra phục hồi quyền ứng dụng**. `pg_dump` chỉ backup một database, không đủ cho role/global objects, cấu hình, secrets hay toàn cluster; kế hoạch DR thực tế phải bao phủ thêm các phần này. Không coi copy volume đang chạy là backup nhất quán.

Nguồn: [pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html) · [pg_restore](https://www.postgresql.org/docs/17/app-pgrestore.html).

## Lỗi khởi tạo thường gặp

| Triệu chứng | Nguyên nhân / cách sửa | Kiểm tra lại |
| --- | --- | --- |
| Compose báo thiếu biến | Chưa copy `.env`, giá trị rỗng hoặc shell override | Sửa local, `config --quiet`, không in mật khẩu công khai |
| API không phân giải `db` | Sai tên hoặc khác network | `network inspect`, DNS probe; sửa membership và `up -d` |
| DB healthy nhưng API 503 | Sai credential, chưa có bảng/grant | Xem log API và SQL role/schema; gọi `/ready`, POST sau sửa |
| Đổi `.env` mà password lỗi | DB role vẫn giữ password cũ trong volume | Đổi role password qua phiên quản trị an toàn và đồng bộ API; không reset volume |
| Sửa init SQL nhưng không chạy | Script chỉ áp dụng với data directory trống | Viết/chạy migration đã kiểm tra, xác nhận schema bằng psql |
| Init script chạy lỗi giữa chừng | SQL thiếu quyền/sai tên hoặc file encoding | Đọc log DB; sửa schema có kiểm soát trên DB hiện có; không giả định rerun tự sửa |
| Ghi chú có vẻ mất | Đổi project name hoặc đường dẫn volume | Tìm đúng volume trước khi sửa; không xóa volume cũ |
| DB bị OOM/thoát | RAM limit không đủ hoặc host/VM thiếu tài nguyên | Kiểm tra OOM và stats; đo workload rồi chỉnh limit |
| Không có kết nối host tới 5432 | DB cố ý không publish port | Dùng `compose exec db psql`; không mở DB public để debug |

Xem [quy trình debug từng lớp](/technologies/docker/operations-security) nếu chưa xác định được nguyên nhân. Với DB thật, backup trước thay đổi schema/quyền và thử trong môi trường riêng.

## Kết quả mong đợi

- [ ] Hai service healthy, API non-root, DB không publish cổng host.
- [ ] API kết nối `db:5432` bằng role ứng dụng giới hạn, POST/GET hoạt động.
- [ ] Named volume giữ ghi chú qua `down` rồi `up`.
- [ ] DB gián đoạn khiến readiness lỗi nhưng API còn sống và hồi phục sau đó.
- [ ] Backup được copy ra host và restore/query thành công ở database thử.

### Dọn dẹp an toàn

Giữ dữ liệu để học tiếp:

```sh
docker compose down
```

Container/network bị xóa; named volume và file backup host còn. Muốn xóa database khôi phục thử, **chỉ sau khi xác nhận đúng tên và không cần dữ liệu thử nữa**, khởi chạy DB rồi:

```sh
docker compose up -d db
docker compose exec db dropdb -U handbook_admin handbook_restore_check
```

Lệnh `dropdb` phá hủy database thử được chỉ định; không thay bằng `handbook`. Nếu đã đổi tên lúc restore, kiểm tra tên tương ứng trước khi chạy. Dừng/xóa container lại bằng `docker compose down` khi xong.

::: danger Xóa toàn bộ dữ liệu bài thực hành
Chỉ khi đã có backup kiểm tra được và chủ động bỏ toàn bộ dữ liệu project local, chạy `docker compose down -v` tại **đúng workspace docker-notes**. Lệnh xóa named volume `pg_data` và toàn bộ database bên trong, bao gồm database khôi phục thử. Không có undo. Không dùng trong quy trình cập nhật, debug hoặc production.
:::

### Ranh giới với production

Cấu hình nền có một số biện pháp giảm rủi ro nhưng vẫn là demo local. Production cần auth, TLS/proxy, secret manager, backup ngoài host và restore định kỳ, migration riêng bằng role quản lý schema, đo tài nguyên, image/digest đã duyệt và giám sát. DB không có HA; volume local không tự theo ứng dụng sang máy khác. Không nâng major PostgreSQL bằng cách đổi tag trên volume hiện có; dùng quy trình nâng cấp/khôi phục được hỗ trợ.

Tham khảo: [image PostgreSQL](https://hub.docker.com/_/postgres) · [Compose startup order](https://docs.docker.com/compose/how-tos/startup-order/) · [mạng Compose](https://docs.docker.com/compose/how-tos/networking/). Quay lại [lộ trình Docker](/technologies/docker/).
