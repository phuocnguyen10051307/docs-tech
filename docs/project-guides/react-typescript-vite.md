---
title: React + TypeScript + Vite
version: Scaffold Vite react-ts · Node.js 22.12+
---

# React + TypeScript + Vite

::: warning Chưa kiểm thử
Ví dụ ứng dụng trong bài chưa được cài đặt và chạy đầy đủ trong đợt chỉnh sửa này. Các bước dưới đây là hướng dẫn thực hành và kết quả mong đợi; kiểm tra build của website không xác nhận ứng dụng mẫu hoạt động.
:::

## Mục tiêu dự án

Tạo bộ đếm có kiểu dữ liệu, kiểm tra TypeScript và xuất file tĩnh production. Ứng dụng chỉ chạy trên trình duyệt, không có API server hay cơ sở dữ liệu.

## Công nghệ sử dụng

[React](/technologies/react/) cho component, [TypeScript](/technologies/typescript/) để kiểm tra tĩnh và [Vite](https://vite.dev/guide/) cho development và đóng gói.

## Yêu cầu trước khi bắt đầu

- Node.js 22.12+ và npm; xem engine nếu scaffold mới yêu cầu cao hơn.
- Trình soạn thảo code và trình duyệt.
- Thư mục cha thực hành chưa có `handbook-ui`.

## Lệnh khởi tạo

Tại thư mục cha thực hành, chạy lần lượt:

```sh
npm create vite@latest handbook-ui -- --template react-ts
cd handbook-ui
npm install
```

Template có React, cấu hình TypeScript và script build. `--` chuyển `--template` qua npm. Xem `package.json`; `@latest` chọn scaffold hiện tại, không phải phiên bản cố định.

## Cấu hình môi trường

Không cần biến môi trường. Khi thêm API, ghi URL công khai trong `.env.example`; xem [cấu hình React](/technologies/react/#cau-hinh). Không đặt thông tin đăng nhập database trong file môi trường frontend.

## Cấu trúc thư mục đề xuất

```text
handbook-ui/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── index.html
├── tsconfig.app.json
└── package.json
```

## Các bước thực hiện

1. Giữ `src/main.tsx` từ scaffold; file này gắn `App` vào trang.
2. Thay `src/App.tsx` bằng component sau:

```tsx
import { useState } from 'react'

export default function App() {
  const [count, setCount] = useState<number>(0)
  return (
    <main>
      <h1>Bộ đếm thực hành</h1>
      <p aria-live="polite">Số đếm: {count}</p>
      <button onClick={() => setCount(value => value + 1)}>Tăng một</button>
      <button onClick={() => setCount(0)}>Đặt lại</button>
    </main>
  )
}
```

3. Thay `src/index.css` bằng CSS tối thiểu:

```css
:root { font-family: system-ui, sans-serif; color: #24382d; background: #f5f8f6; }
body { margin: 0; }
main { max-width: 40rem; margin: 5rem auto; padding: 2rem; }
button { font: inherit; padding: .6rem 1rem; margin-right: .5rem; cursor: pointer; }
button:focus-visible { outline: 3px solid #23765c; outline-offset: 3px; }
```

4. Giữ cấu hình TypeScript và Vite được tạo. Chỉ xóa tài nguyên mẫu không dùng sau khi kiểm tra không còn import tham chiếu.

## Chạy và kiểm tra

Tại `handbook-ui`:

```sh
npm run dev
```

Mở URL được hiển thị. Bấm **Tăng một** hai lần, mong đợi `Số đếm: 2`; bấm **Đặt lại**, mong đợi `Số đếm: 0`. Dùng Tab và Enter để thao tác cả hai nút.

Trong terminal khác tại cùng thư mục:

```sh
npm run lint
npm run build
npm run preview
```

Build cần tạo `dist/`. Mở URL preview và thử lại tương tác. Để kiểm tra ràng buộc kiểu, tạm đổi `setCount(0)` thành `setCount('zero')`; build cần thất bại. Hoàn tác thay đổi trước khi commit.

## Lỗi khởi tạo thường gặp

| Vấn đề | Cách sửa |
| --- | --- |
| Node engine không được hỗ trợ | Nâng cấp Node, mở lại terminal, kiểm tra phiên bản đang dùng |
| Cổng 5173 không dùng được | Dùng URL Vite hiển thị hoặc dừng server trước đó |
| CSS scaffold cũ vẫn còn | Bỏ import `App.css` khi thay `App.tsx` |
| Development chạy nhưng build lỗi | Vite chuyển đổi cú pháp; script build còn kiểm tra kiểu. Đọc chẩn đoán TypeScript |

## Kết quả mong đợi

- [ ] Bộ đếm dùng được bằng chuột và bàn phím.
- [ ] Lint và build thành công sau khi khôi phục kiểu đúng.
- [ ] Preview production hoạt động giống development.

Triển khai `dist/` lên hosting tĩnh. Biến frontend công khai cần đặt **trước** khi build. Thêm routing, kiểm thử hành vi và trạng thái lỗi API khi ứng dụng cần.

**Liên quan:** [React](/technologies/react/) · [TypeScript](/technologies/typescript/) · [React full stack](/project-guides/react-express-postgresql). **Nguồn chính thức:** [React từ đầu](https://react.dev/learn/build-a-react-app-from-scratch) · [Hướng dẫn Vite](https://vite.dev/guide/).
