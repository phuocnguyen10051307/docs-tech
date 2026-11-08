---
title: Express.js
version: Express 5 · Node.js 22.12+ · ESM
status: guide
---

# Express.js

::: warning Chưa kiểm thử
Ví dụ ứng dụng trong bài chưa được cài đặt và chạy đầy đủ trong đợt chỉnh sửa này. Các bước dưới đây là hướng dẫn thực hành và kết quả mong đợi; kiểm tra build của website không xác nhận ứng dụng mẫu hoạt động.
:::

## Tổng quan

Express là HTTP framework nhỏ cho [Node.js](/technologies/nodejs/). Dùng để tạo API với route và middleware theo thứ tự. Bạn tự chọn database, kiểm tra dữ liệu, xác thực và kiến trúc.

## Yêu cầu trước khi bắt đầu

Cài Node.js **22.12+** và npm. Hiểu HTTP method, mã trạng thái, JSON và promise. Bài áp dụng cho **Express 5**, có hành vi route và xử lý lỗi khác phiên bản 4.

## Cài đặt

Trong thư mục cha dành cho thực hành:

```sh
mkdir express-api
cd express-api
npm init -y
npm pkg set type=module
npm install express@5
mkdir src
npm pkg set "scripts.dev=node --env-file=.env --watch src/server.js"
npm pkg set "scripts.start=node src/server.js"
```

`express@5` chọn major 5 thay vì major tương lai có thay đổi phá vỡ tương thích. Đưa `package-lock.json` vào Git để giữ phiên bản đã phân giải.

## Khởi tạo dự án

Tạo `src/app.js`:

```js
import express from 'express'

export const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '100kb' }))

app.get('/health', (req, res) => res.json({ status: 'ok' }))
app.post('/echo', (req, res) => {
  if (typeof req.body?.message !== 'string') {
    return res.status(400).json({ error: 'message must be a string' })
  }
  return res.json({ message: req.body.message })
})

app.use((req, res) => res.status(404).json({ error: 'Not found' }))
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err)
  console.error(err.message)
  const status = err.status >= 400 && err.status < 500 ? err.status : 500
  res.status(status).json({ error: status === 500 ? 'Internal server error' : 'Invalid request' })
})
```

Tạo `src/server.js`:

```js
import { app } from './app.js'
const port = Number(process.env.PORT ?? 3000)
const server = app.listen(port, '0.0.0.0', () => console.log(`Listening on ${port}`))
process.on('SIGTERM', () => server.close())
process.on('SIGINT', () => server.close())
```

Tách ứng dụng khỏi listener giúp kiểm thử tích hợp dễ hơn. Express 5 chuyển promise bị reject từ async route handler đến error middleware. Lỗi trong callback hoặc timer tách rời vẫn cần xử lý rõ ràng.

## Cấu hình

Tạo `.env.example` có `PORT=3000`. Sao chép thành `.env` trên máy và loại khỏi Git; xem [quy ước file môi trường](/getting-started#file-moi-truong). Middleware chạy theo thứ tự đăng ký: phân tích JSON trước route, đặt error handler bốn tham số cuối cùng.

Development dùng script watch. Production dùng `npm start` với biến môi trường được cấp và `NODE_ENV=production`. Chỉ cấu hình trusted proxy cho mô hình triển khai thực tế; không bật tin cậy proxy tùy ý như cách sửa chung.

## Cấu trúc dự án

```text
express-api/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── routes/          # Hợp đồng HTTP
│   ├── services/        # Logic nghiệp vụ
│   └── repositories/    # Truy cập database khi cần
├── .env.example
├── package-lock.json
└── package.json
```

## Lệnh thường dùng

Tại `express-api`:

```sh
npm run dev
```

Trong terminal thứ hai (Bash; PowerShell có thể mở `/health` trong trình duyệt):

```bash
curl -i http://localhost:3000/health
curl -i -X POST http://localhost:3000/echo -H 'Content-Type: application/json' -d '{"message":"hello"}'
curl -i -X POST http://localhost:3000/echo -H 'Content-Type: application/json' -d '{}'
```

Mong đợi HTTP 200 với đối tượng trạng thái, HTTP 200 với thông điệp gửi lại, rồi HTTP 400. Route không tồn tại cần trả 404. Chạy `npm ls express` để xem phiên bản framework đã cài.

## Thực hành tốt

- Kiểm tra body, URL parameter và query tại điểm nhận dữ liệu.
- Dùng truy vấn tham số hóa và connection pool.
- Giữ định dạng lỗi công khai ổn định; chỉ ghi chi tiết nội bộ trong log server.
- Đặt giới hạn và timeout; thêm phân quyền trước route riêng tư.
- Ưu tiên proxy development của Vite cho request trình duyệt trên máy; CORS không phải cơ chế kiểm soát truy cập.
- Production cần security header, giới hạn tốc độ, HTTPS và đóng kết nối database đúng cách khi dừng.

## Xử lý lỗi

| Triệu chứng | Nguyên nhân | Giải pháp |
| --- | --- | --- |
| `req.body` là undefined | Thiếu parser hoặc content type JSON | Đăng ký `express.json()` trước route; gửi đúng header |
| Cannot GET / | Chưa có route `/` | Gọi `/health` hoặc định nghĩa route cần dùng |
| Missing parameter name sau nâng cấp | Cú pháp wildcard của Express 4 | Dùng wildcard có tên của Express 5; xem hướng dẫn migration |
| Headers already sent | Handler trả lời hai lần | Return sau khi gửi phản hồi; kiểm tra trong error handler |
| Trình duyệt lỗi CORS | Request khác origin | Dùng proxy trên máy hoặc cho phép rõ origin dự kiến |

## Đánh giá

Express linh hoạt, dễ đưa vào API nhỏ. Cấu trúc tối giản đòi hỏi tự chọn và duy trì kiểm tra dữ liệu, phân quyền, khả năng quan sát. Framework có quy ước chặt hơn có thể phù hợp với nhóm lớn.

**Tiếp theo:** [React + Express + PostgreSQL](/project-guides/react-express-postgresql). **Nguồn chính thức:** [Cài đặt](https://expressjs.com/en/starter/installing.html) · [Xử lý lỗi](https://expressjs.com/en/guide/error-handling.html) · [Migration Express 5](https://expressjs.com/en/guide/migrating-5.html).
