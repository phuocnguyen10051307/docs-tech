---
title: Ứng dụng Next.js full stack
version: App Router · create-next-app latest · TypeScript
---

# Ứng dụng Next.js full stack

::: warning Chưa kiểm thử
Ví dụ ứng dụng trong bài chưa được cài đặt và chạy đầy đủ trong đợt chỉnh sửa này. Các bước dưới đây là hướng dẫn thực hành và kết quả mong đợi; kiểm tra build của website không xác nhận ứng dụng mẫu hoạt động.
:::

## Mục tiêu dự án

Tạo dashboard kết xuất trên server và route API JSON trong cùng ứng dụng. Form trình duyệt gọi route và hiển thị lời chào đã được kiểm tra đầu vào. Bài nhập môn này chưa cần cơ sở dữ liệu và không lưu dữ liệu giữa các request.

## Công nghệ sử dụng

[Next.js App Router](/technologies/nextjs/), [React](/technologies/react/) và [TypeScript](/technologies/typescript/). Server Component đọc cấu hình riêng; Client Component nhỏ xử lý tương tác.

## Yêu cầu trước khi bắt đầu

Node.js **22.12+**, npm và kiến thức React cơ bản. Kiểm tra yêu cầu engine của scaffold trước khi tiếp tục. Bắt đầu tại thư mục cha dành cho thực hành.

## Lệnh khởi tạo

```sh
npx create-next-app@latest handbook-next --ts --eslint --app --src-dir --no-tailwind --use-npm --import-alias "@/*"
cd handbook-next
```

Chấp nhận mặc định của các câu hỏi còn lại. Nếu có tùy chọn compiler bổ sung, mặc định đủ cho bài này. `create-next-app` cài dependency; xem `package.json` để ghi lại phiên bản. `--src-dir` đặt route dưới `src/app`.

## Cấu hình môi trường

Tạo `.env.example` tại thư mục gốc:

```dotenv
HANDBOOK_TITLE=Không gian phát triển của tôi
```

Sao chép thành `.env.local` (Bash: `cp .env.example .env.local`; PowerShell: `Copy-Item .env.example .env.local`). Đảm bảo `.env.local` bị loại khỏi Git. Giá trị chỉ được đọc trên server, không có tiền tố `NEXT_PUBLIC_`. Đây là tiêu đề, nhưng ranh giới này cũng áp dụng với cấu hình riêng có tính bí mật.

## Cấu trúc thư mục đề xuất

```text
handbook-next/
├── src/app/
│   ├── api/greeting/route.ts
│   ├── components/GreetingForm.tsx
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── .env.example
└── package.json
```

## Các bước thực hiện

### 1. Thêm route handler

Tạo `src/app/api/greeting/route.ts`:

```ts
export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get('name')?.trim()
  if (!name || name.length > 60) {
    return Response.json({ error: 'Tên cần có từ 1 đến 60 ký tự.' }, { status: 400 })
  }
  return Response.json({ message: `Xin chào, ${name}. Sẵn sàng thực hành chưa?` })
}
```

Route chịu trách nhiệm kiểm tra dữ liệu. Giới hạn đầu vào trên trình duyệt không đủ để bảo vệ endpoint server.

### 2. Thêm tương tác phía client

Tạo `src/app/components/GreetingForm.tsx`:

```tsx
'use client'

import { useState, type FormEvent } from 'react'

export function GreetingForm() {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    setBusy(true)
    setMessage('')
    try {
      const query = new URLSearchParams({ name: String(values.get('name') ?? '') })
      const response = await fetch(`/api/greeting?${query}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Yêu cầu thất bại')
      setMessage(data.message)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể kết nối')
    } finally {
      setBusy(false)
    }
  }

  return <form onSubmit={submit}>
    <label htmlFor="name">Tên của bạn </label>
    <input id="name" name="name" required maxLength={60} />
    <button disabled={busy}>{busy ? 'Đang tải…' : 'Gửi lời chào'}</button>
    <p role="status">{message}</p>
  </form>
}
```

### 3. Kết xuất trang trên server

Thay nội dung `src/app/page.tsx`:

```tsx
import { GreetingForm } from './components/GreetingForm'

export default function Page() {
  return <main>
    <h1>{process.env.HANDBOOK_TITLE ?? 'Không gian phát triển'}</h1>
    <p>Trang kết xuất trên server với một phần tương tác nhỏ.</p>
    <GreetingForm />
  </main>
}
```

Giữ root layout được tạo, nhưng thay import font-loader và class liên quan bằng `<html lang="vi"><body>{children}</body></html>` nếu build không truy cập được Google Fonts. Giữ import `globals.css`. Chỉnh tiêu đề và mô tả metadata theo dự án.

Thay nội dung `src/app/globals.css`:

```css
body { font-family: system-ui, sans-serif; margin: 0; color: #25392d; }
main { max-width: 45rem; margin: 5rem auto; padding: 1.5rem; }
input, button { font: inherit; padding: .5rem; margin: .4rem; }
```

## Chạy và kiểm tra

Tại `handbook-next`:

```sh
npm run dev
```

Mở URL được hiển thị (thường cổng 3000). Gửi tên và kiểm tra lời chào. Mở `http://localhost:3000/api/greeting?name=Ada` để xem JSON. Khi thiếu `name`, mong đợi HTTP 400 kèm đối tượng lỗi.

Dừng development, rồi chạy tại cùng thư mục:

```sh
npx eslint .
npx tsc --noEmit
npm run build
npm start
```

Dùng ESLint CLI mà scaffold đã cài; các bản Next mới không cung cấp `next lint`. Lặp lại kiểm tra trình duyệt/API trên server production. Tiêu đề có thể được kết xuất trước khi build, nên cần build lại sau khi thay cấu hình này cho production.

## Lỗi khởi tạo thường gặp

| Triệu chứng | Nguyên nhân và cách sửa |
| --- | --- |
| Hook không được hỗ trợ trong Server Component | Giữ `'use client'` ở đầu file form |
| API trả về 404 | Kiểm tra đường dẫn `src/app/api/greeting/route.ts` và khởi động lại sau khi chuyển file |
| Cổng 3000 bị chiếm | Dừng bài Express hoặc dùng URL khác do Next hiển thị |
| Tải font thất bại khi build | Bỏ font-loader bên ngoài và dùng font hệ thống |
| Biến server không có trong trình duyệt | Đọc trên server; chỉ đưa dữ liệu chủ động công khai ra client |

## Kết quả mong đợi

- [ ] Server kết xuất tiêu đề đã cấu hình.
- [ ] Form gọi endpoint server thực tế.
- [ ] Đầu vào không hợp lệ nhận HTTP 400.
- [ ] Kiểm tra kiểu, lint và build production thành công.

Dự án cần nền tảng chạy Node hoặc adapter hỗ trợ server route; static export thuần không phục vụ endpoint động này. Để lưu dữ liệu, thêm tầng cơ sở dữ liệu sau route, phân quyền và kiểm tra dữ liệu ghi. Xem [PostgreSQL](/technologies/postgresql/) để tiếp tục.

**Nguồn chính thức:** [Cài đặt](https://nextjs.org/docs/app/getting-started/installation) · [Server và Client Component](https://nextjs.org/docs/app/getting-started/server-and-client-components) · [Route handler](https://nextjs.org/docs/app/api-reference/file-conventions/route).
