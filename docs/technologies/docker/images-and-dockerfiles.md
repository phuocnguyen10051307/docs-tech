---
title: Dockerfile, layer và tối ưu build
version: BuildKit · Node 22 · Level 1–2
status: guide
---

# Dockerfile, layer và tối ưu build

## Tổng quan

Dockerfile biến source và dependency thành artifact triển khai. Build tốt phải trả lời được: đầu vào nào được đưa vào image, tiến trình nào khởi chạy, ai có quyền ghi và thay đổi nào khiến dependency phải cài lại. Level 1 tập trung vào chỉ thị và context; Level 2 thêm layer, cache, multi-stage và bảo vệ đầu vào.

| Chỉ thị | Khi thực thi / tác dụng | Lỗi dễ mắc |
| --- | --- | --- |
| `FROM` | Chọn image nền, bắt đầu stage | Dùng tag biến động mà tưởng bất biến |
| `WORKDIR` | Đặt thư mục cho chỉ thị sau và lệnh runtime | Lạm dụng `RUN cd` vốn không giữ thư mục cho lệnh sau |
| `COPY` | Chép file từ context hoặc stage khác | Chép toàn bộ `.env` hoặc `node_modules` host |
| `RUN` | Thực hiện trong build, có thể tạo thay đổi filesystem | Chạy server ở bước build |
| `ENV` | Giá trị mặc định trong image, có thể override runtime | Nhúng secret |
| `ARG` | Tham số build theo phạm vi stage | Tưởng đây là secret hoặc tự xuất hiện lúc chạy |
| `USER` | Người dùng cho lệnh sau và tiến trình runtime | Quên quyền đọc/ghi sau khi bỏ root |
| `EXPOSE` | Metadata cổng dịch vụ | Tưởng tự publish ra host |
| `CMD` | Lệnh mặc định khi tạo container | Dùng shell form khiến signal khó đến ứng dụng |
| `ENTRYPOINT` | Chương trình chính, CMD thường bổ sung tham số | Không hiểu vì sao truyền lệnh sau tên image không thay chương trình |

Ví dụ `ENTRYPOINT ["node"]` và `CMD ["src/server.js"]` chạy Node với file mặc định; tham số sau image thay CMD, vẫn giữ ENTRYPOINT. Với API thông thường, `CMD ["node", "src/server.js"]` đủ đơn giản. Exec form JSON không tự mở rộng `$PORT`; đọc biến trong ứng dụng. Tra cứu [Dockerfile](https://docs.docker.com/reference/dockerfile/).

## Yêu cầu trước khi bắt đầu

Đã hiểu [image và vòng đời](./fundamentals). Có Docker Engine/BuildKit đang chạy. Dùng source đầy đủ ở [bài Express](/project-guides/docker-nodejs) cho Dockerfile chính dưới đây. **Chưa kiểm thử:** build image, cache và multi-stage chưa chạy được vì daemon không hoạt động; số liệu thời gian/kích thước không được giả định.

## Cài đặt

Không thêm dependency cho website. Trong workspace ứng dụng, kiểm tra:

```sh
docker version
docker buildx version
node --version
npm --version
```

Node/npm trên host dùng để tạo lockfile và kiểm tra nhanh; phiên bản trong container vẫn do `FROM` quyết định. Dùng Linux base cùng họ hệ điều hành và kiến trúc ở các stage khi có module native.

## Khởi tạo dự án

Tại workspace `docker-express` của bài 2, có `package.json`, `package-lock.json`, `src/server.js`. Tạo `Dockerfile`:

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

`npm ci` đòi lockfile khớp manifest và không sửa lockfile trong build. `--omit=dev` bỏ công cụ development khỏi cài đặt runtime. Source thuộc `node`, tiến trình không cần root để listen cổng 3000. Không cần multi-stage chỉ để chạy JavaScript không biên dịch; ưu tiên công thức dễ bảo trì.

```sh
docker build --progress=plain -t handbook-express:local .
docker run --rm --init -p 127.0.0.1:3000:3000 handbook-express:local
```

Lệnh cuối chạy foreground, xem log rồi dùng terminal khác gọi `/health`. Ctrl+C dừng. `--init` chuyển tiếp signal và thu hồi tiến trình con, không thay thế xử lý shutdown trong ứng dụng.

## Cấu hình

### Build context và `.dockerignore`

Context là tập file builder được phép đọc; dấu `.` không nhất thiết là thư mục Dockerfile. `docker build -f docker/Dockerfile .` vẫn lấy context từ thư mục hiện tại. `COPY ../secret` không phải cách đọc ngoài context.

Tạo `.dockerignore` ngay tại gốc context:

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

`.gitignore` không bảo vệ build context. Ngoài giảm thời gian gửi source, ignore tránh secret/dependency host lọt vào image; vẫn phải rà soát các file được cho phép. Nếu `.env` từng được COPY rồi xóa trong RUN sau, layer trước vẫn có thể giữ nội dung. Không sửa bằng cách xóa ở layer sau; build sạch từ context đúng và thu hồi secret đã lộ.

### Layer và cache hoạt động như thế nào?

Builder lưu kết quả các bước theo đầu vào và lệnh. `RUN`/`COPY` có thể tạo layer filesystem; chỉ thị như `ENV`, `CMD` chủ yếu thay metadata, không phải mỗi dòng đều tạo dữ liệu. Container ghi lên lớp riêng qua cơ chế copy-on-write của storage driver; sửa một file trong container không sửa image gốc.

```text
FROM Node → COPY manifest → RUN npm ci → COPY src → metadata runtime
               ít đổi        đắt           hay đổi
```

Vì cache phụ thuộc kết quả trước, đổi source ở COPY cuối thường không làm `npm ci` chạy lại; đổi manifest/lockfile khiến bước cài và các bước phụ thuộc sau đó phải tính lại. Thay nội dung file COPY ảnh hưởng cache; chỉ thay mtime không đủ. Một lệnh `RUN apt-get update` không tự hết hạn vì qua một ngày: builder không truy vấn bên ngoài để biết cache cũ hay mới. Xem [quy tắc cache](https://docs.docker.com/build/cache/invalidation/).

Thử tại bài 2: build lần đầu, build không đổi, sửa chuỗi phản hồi trong `src/server.js`, rồi build lại với `--progress=plain`. Mong đợi bước dependency được báo cache; không đảm bảo nhanh bao nhiêu. Khi đổi dependency, chạy `npm install` có chủ đích để cập nhật lockfile rồi build, không sửa lockfile thủ công.

### Cache package và làm mới có kiểm soát

Với BuildKit, có thể thay RUN bằng:

```dockerfile
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev
```

Cache mount giữ các gói npm đã tải giữa các build trên builder đó; không trở thành thư mục trong runtime image và không thay lockfile. Nó hữu ích khi dependency đổi thường xuyên, nhưng không nên là điều kiện để build đúng. Trong CI, cache local có thể không còn giữa các job; cache từ xa thuộc lộ trình nâng cao. Xem [tối ưu cache](https://docs.docker.com/build/cache/optimize/).

```sh
docker build --pull -t handbook-express:local .
docker build --no-cache -t handbook-express:local .
```

`--pull` kiểm tra nền mới cho tag; `--no-cache` chạy lại bước build nhưng không tự bảo đảm kéo nền mới. Chỉ kết hợp hai cờ khi có lý do làm mới toàn bộ, không dùng thường xuyên để che lỗi sắp xếp layer. Ghim digest giúp tái lập nhưng vẫn cần quy trình cập nhật bản vá. Nền slim có ít công cụ chẩn đoán; Alpine dùng musl thay glibc, có thể khác tương thích module native. Không chọn image chỉ dựa trên kích thước.

## Cấu trúc dự án

### Multi-stage khi thật sự có bước biên dịch

Multi-stage dùng nhiều `FROM`, chỉ chuyển artifact cần thiết sang stage runtime. Compiler/source build không cần nằm trong image phục vụ. Ví dụ nhỏ **Chưa kiểm thử** này độc lập với bài Express và chạy trong thư mục mới `docker-ts-demo`:

```text
docker-ts-demo/
├── package.json
├── package-lock.json     # Tạo bằng npm install
├── tsconfig.json
├── src/server.ts
├── .dockerignore         # Dùng nội dung phía trên
└── Dockerfile
```

`package.json`:

```json
{
  "name": "docker-ts-demo",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": { "build": "tsc", "start": "node dist/server.js" },
  "devDependencies": { "typescript": "5.7.3", "@types/node": "22.10.5" }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "NodeNext", "moduleResolution": "NodeNext",
    "rootDir": "src", "outDir": "dist", "strict": true, "skipLibCheck": true
  },
  "include": ["src/**/*.ts"]
}
```

`src/server.ts`:

```ts
import { createServer } from 'node:http'
const server = createServer((_req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ status: 'ok' }))
})
server.listen(3000, '0.0.0.0')
process.on('SIGTERM', () => server.close())
```

`Dockerfile`:

```dockerfile
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

Tại `docker-ts-demo`, chạy `npm install` để tạo lockfile, `npm run build` để xác nhận compiler, rồi:

```sh
docker build -t handbook-ts:local .
docker run --rm --name handbook-ts --init -p 127.0.0.1:3002:3000 handbook-ts:local
```

**Đã kiểm tra trên host:** source và `tsconfig.json` trích từ bài biên dịch thành công bằng TypeScript 5.7.3 của repository. Chưa cài/build các stage Docker hoặc chạy HTTP của ví dụ TypeScript trong container.

Mở `http://127.0.0.1:3002`, mong đợi JSON `{"status":"ok"}`. Ctrl+C dừng và xóa container. Compiler chỉ ở `build`; runtime này dùng toàn module tích hợp nên không COPY `node_modules`. Nếu app có dependency runtime, thêm stage `npm ci --omit=dev` và COPY `node_modules` từ stage đó; không chép module native build trên OS/kiến trúc khác. Multi-stage không tự làm dependency an toàn hay code chạy đúng. Xem [multi-stage builds](https://docs.docker.com/build/building/multi-stage/).

## Lệnh thường dùng

Tại workspace tương ứng, sau khi build:

```sh
docker image history handbook-express:local
docker image inspect --format '{{.Config.User}}' handbook-express:local
docker run --rm handbook-express:local node --check src/server.js
docker build --target build -t handbook-ts:build .
```

Ba lệnh đầu dùng bài 2; `node --check` chỉ kiểm tra cú pháp, không khởi động API. Lệnh `--target build` dùng workspace TypeScript, dừng ở stage build để chẩn đoán artifact. Image history không phải trình quét secret hoàn chỉnh.

## Thực hành tốt

### Secret trong build và runtime

Không dùng `ARG NPM_TOKEN`/`ENV` để nhúng token. Nếu cần private npm registry, BuildKit hỗ trợ mount secret tạm thời, ví dụ rời **Chưa kiểm thử** sau dành cho dự án có `.npmrc` bảo mật trên máy:

```dockerfile
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci --omit=dev
```

```sh
docker build --secret id=npmrc,src=/secure/path/npmrc -t private-api:local .
```

Thay đường dẫn bằng file thật đã bảo vệ và loại khỏi Git/context; không log nội dung secret. Mount không tự ngăn lệnh build sao chép/ghi secret vào artifact, cần rà soát script dependency. Secret runtime là chuyện khác: cấp qua secret manager/file mount; không rebuild image cho mỗi mật khẩu. Xem [build secrets](https://docs.docker.com/build/building/secrets/).

### Development và production

| Development | Production |
| --- | --- |
| Bind mount source, watch để lặp nhanh | Chạy image bất biến đã kiểm tra |
| Có compiler/dev dependencies khi cần | Chỉ dependency/artifact runtime |
| Cổng loopback, log dễ quan sát | TLS/proxy, kiểm soát truy cập, log có giới hạn |
| Tag local, build thử thường xuyên | Ghi digest, kiểm tra cập nhật và rollback |

Không đưa debugger, Docker socket hay quyền privileged vào image vì tiện development. Không build tại máy production từ source chưa xác định; phát hành artifact có thể truy vết.

## Xử lý lỗi

| Triệu chứng | Nguyên nhân | Sửa và xác nhận |
| --- | --- | --- |
| `COPY` không tìm thấy file | Context sai hoặc ignore nhầm | Kiểm tra lệnh `-f`/context và tên file có phân biệt hoa thường; build lại |
| `npm ci` thất bại | Thiếu/sai lockfile, thiếu mạng hoặc registry auth | Đọc lỗi đầu tiên, đồng bộ lock bằng npm trên môi trường đã chọn; build lại |
| Mỗi lần sửa code đều cài dependency | `COPY . .` trước bước cài | Chép manifest trước source; xem log cache ở lần build kế tiếp |
| `Cannot find module` ở runtime | Omit nhầm dependency hoặc COPY thiếu artifact | Chuyển thư viện dùng lúc chạy vào `dependencies`, kiểm tra đường dẫn bằng container thử |
| Quyền ghi bị từ chối | `USER node` không sở hữu thư mục ghi | Tạo/chown đúng thư mục cần ghi hoặc dùng mount riêng; chạy lại bằng non-root |
| Chạy native module lỗi | Khác ABI/OS/kiến trúc | Build/install trong nền tương thích runtime; không COPY `node_modules` host |

## Đánh giá

Image tốt có thể build từ source + lockfile trong context sạch, chạy không cần host có thư viện ứng dụng và không chứa secret. Tối ưu cache để giảm công việc lặp, nhưng ưu tiên khả năng tái lập và cập nhật. Tiếp theo: [Compose, mạng và storage](./compose-networking-storage), [bài API](/project-guides/docker-nodejs). Tham khảo thêm [khuyến nghị build](https://docs.docker.com/build/building/best-practices/).
