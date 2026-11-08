---
title: Node.js
version: Node.js 22.12+ · ESM · Nạp môi trường tích hợp
status: guide
---

# Node.js

::: warning Chưa kiểm thử
Ví dụ ứng dụng trong bài chưa được cài đặt và chạy đầy đủ trong đợt chỉnh sửa này. Các bước dưới đây là hướng dẫn thực hành và kết quả mong đợi; kiểm tra build của website không xác nhận ứng dụng mẫu hoạt động.
:::

## Tổng quan

Node.js chạy JavaScript ngoài trình duyệt. Dùng cho API, script, công cụ và dịch vụ mạng. Event loop xử lý I/O tốt; công việc nặng CPU nên chuyển sang worker hoặc dịch vụ riêng.

## Yêu cầu trước khi bắt đầu

Dùng Node LTS còn được hỗ trợ, đáp ứng **22.12+**. npm đi kèm Node. Mốc này hỗ trợ watch và `--env-file` bên dưới, không phải phiên bản tối thiểu cho mọi API Node.

## Cài đặt

Cài Node theo [hướng dẫn tải chính thức](https://nodejs.org/en/download) cho hệ điều hành, hoặc trình quản lý phiên bản phù hợp. Trong terminal mới:

```sh
node --version
npm --version
```

Nếu không tìm thấy lệnh, mở lại terminal và kiểm tra PATH. Xác định chương trình đang chạy trước khi kết hợp nhiều cách cài đặt.

## Khởi tạo dự án

Trong thư mục cha thực hành:

```sh
mkdir node-api
cd node-api
npm init -y
npm pkg set type=module
npm pkg set "scripts.dev=node --env-file=.env --watch src/server.js"
npm pkg set "scripts.start=node src/server.js"
mkdir src
```

Tạo `src/server.js`:

```js
import { createServer } from 'node:http'

const port = Number(process.env.PORT ?? 3000)
const server = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok' }))
    return
  }
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

server.listen(port, '0.0.0.0', () => console.log(`Listening on ${port}`))
process.on('SIGTERM', () => server.close())
process.on('SIGINT', () => server.close())
```

## Cấu hình

Tạo `.env.example`:

```dotenv
PORT=3000
```

Sao chép thành `.env` tại `node-api`. Bash: `cp .env.example .env`. PowerShell: `Copy-Item .env.example .env`. Thêm `.env` và `node_modules/` vào `.gitignore`.

Development nạp `.env` rõ ràng. Script `start` production chờ host cấp biến môi trường. Chỉ để thử production trên máy, dùng `node --env-file=.env src/server.js`.

## Cấu trúc dự án

```text
node-api/
├── src/
│   ├── server.js      # Khởi chạy và dừng tiến trình
│   ├── routes/       # Thêm khi có nhiều handler
│   └── services/     # Hệ thống bên ngoài và logic nghiệp vụ
├── .env.example
├── .gitignore
└── package.json
```

Giữ `server.js` tập trung vào khởi chạy. Tách xử lý request sang module riêng khi thêm tính năng hoặc kiểm thử độc lập.

## Lệnh thường dùng

Tại `node-api`:

```sh
npm run dev                   # Khởi động lại khi source đổi
node --check src/server.js     # Kiểm tra cú pháp, không thực thi
npm start                     # Không watch; dùng môi trường được cấp lúc chạy
npm ls --depth=0               # Dependency trực tiếp đã cài
```

Trong terminal khác, `curl http://localhost:3000/health` cần trả `{"status":"ok"}`. Windows PowerShell dùng `curl.exe` hoặc mở URL trong trình duyệt. Đường dẫn không có cần trả HTTP 404. Ví dụ không cần build và không cài dependency ứng dụng.

## Thực hành tốt

- Dùng import `node:` cho module tích hợp và khai báo loại module rõ ràng.
- Xử lý promise bị reject, kiểm tra cấu hình khi khởi chạy nếu có thêm thiết lập.
- Không ghi mật khẩu, token hoặc toàn bộ authorization header vào log.
- Đưa lockfile vào Git khi có dependency; dùng `npm ci` trong CI.
- Đóng listener và kết nối bên ngoài khi dừng.
- Với dịch vụ thực tế, thêm request timeout, giới hạn payload và log có cấu trúc.

## Xử lý lỗi

| Triệu chứng | Kiểm tra | Cách sửa |
| --- | --- | --- |
| Cannot use import outside a module | `package.json` | Thêm `"type": "module"` hoặc dùng `.mjs` |
| Không tìm thấy `.env` | Thư mục hiện tại của terminal | Chạy từ `node-api`; tạo file trước `npm run dev` |
| EADDRINUSE | Tiến trình khác chiếm cổng | Dừng server trước đó hoặc đổi `PORT` |
| Trình duyệt không gọi được container | Địa chỉ lắng nghe và cổng đã mở | Lắng nghe trên `0.0.0.0`; mở cổng container |
| `node --check` thành công nhưng ứng dụng lỗi | Kiểm tra cú pháp không thực thi | Chạy tiến trình và gọi `/health` |

## Đánh giá

Node giúp thống nhất công cụ JavaScript và xây dựng dịch vụ I/O. Cần chú ý lỗi bất đồng bộ và thao tác chặn. Framework như [Express](/technologies/express/) hỗ trợ routing thuận tiện khi dịch vụ phát triển.

**Tiếp theo:** [Đóng gói server bằng container](/project-guides/docker-nodejs). **Nguồn chính thức:** [Giới thiệu](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs) · [File môi trường](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs) · [HTTP API](https://nodejs.org/api/http.html).
