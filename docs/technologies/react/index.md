---
title: React
version: Function component React · Template Vite react-ts
status: guide
---

# React

::: warning Chưa kiểm thử
Ví dụ ứng dụng trong bài chưa được cài đặt và chạy đầy đủ trong đợt chỉnh sửa này. Các bước dưới đây là hướng dẫn thực hành và kết quả mong đợi; kiểm tra build của website không xác nhận ứng dụng mẫu hoạt động.
:::

## Tổng quan

React tổ chức giao diện thành component. Dùng cho ứng dụng trình duyệt tương tác với UI tái sử dụng và state dùng chung. Bài này dùng Vite kết xuất phía client; chọn framework như [Next.js](/technologies/nextjs/) khi cần tích hợp kết xuất server.

## Yêu cầu trước khi bắt đầu

Hiểu hàm, mảng và module JavaScript. Cài Node.js **22.12+** cùng npm, kiểm tra `node --version`. Đọc [TypeScript](/technologies/typescript/) nếu chưa quen `.tsx`.

## Cài đặt

Tại thư mục cha thực hành, tạo ứng dụng từ scaffold Vite React/TypeScript:

```sh
npm create vite@latest my-react-app -- --template react-ts
cd my-react-app
npm install
```

Lệnh đầu tạo source và công cụ; `npm install` tải dependency, ghi lockfile. `@latest` phụ thuộc thời điểm: xem `package.json` và yêu cầu engine được tạo trước khi chấp nhận nâng cấp.

## Khởi tạo dự án

Tại `my-react-app`, thay `src/App.tsx`:

```tsx
import { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)
  return (
    <main>
      <h1>Bộ đếm thực hành</h1>
      <button onClick={() => setCount(current => current + 1)}>
        Số đếm: {count}
      </button>
    </main>
  )
}
```

Chạy `npm run dev`, mở URL Vite hiển thị. Bấm nút cần tăng số đếm. Giữ `src/main.tsx` từ scaffold; file gắn ứng dụng vào `index.html`.

## Cấu hình

Giữ `vite.config.ts`, `tsconfig.app.json`, `tsconfig.node.json` được tạo. Vite build ứng dụng; TypeScript kiểm tra kiểu. Tạo `.env.example` nếu trình duyệt cần cấu hình công khai:

```dotenv
VITE_API_BASE_URL=http://localhost:3000
```

Sao chép thành `.env` trên máy, đọc qua `import.meta.env.VITE_API_BASE_URL`. Khởi động lại Vite sau khi đổi file môi trường. Giá trị được công khai và nhúng khi build. Xem [biến môi trường Vite](https://vite.dev/guide/env-and-mode).

## Cấu trúc dự án

```text
my-react-app/
├── public/                 # Tài nguyên được sao chép nguyên trạng
├── src/
│   ├── components/         # UI dùng chung
│   ├── features/           # UI và hook theo tính năng
│   ├── lib/                # API client và tiện ích
│   ├── App.tsx
│   └── main.tsx
├── .env.example
└── package.json
```

Bắt đầu đơn giản; chỉ thêm thư mục tính năng khi có chức năng thực tế cần nhóm.

## Lệnh thường dùng

Chạy tại gốc ứng dụng:

```sh
npm run dev       # Server development cập nhật khi sửa code
npm run lint      # Kiểm tra ESLint từ scaffold
npm run build     # Kiểm tra kiểu và đóng gói production
npm run preview   # Xem bản production trên máy
```

`npm run build` cần tạo `dist/`. Preview dùng để kiểm tra. Triển khai `dist/` lên hosting tĩnh, cấu hình history fallback nếu thêm routing phía client.

## Thực hành tốt

- Giữ component tập trung; truyền dữ liệu qua props trước khi thêm global state.
- Dùng ID ổn định làm key danh sách. Gọi hook ở cấp cao nhất của component.
- Tính giá trị suy ra khi render thay vì sao chép vào state.
- Dùng cập nhật state dạng hàm nếu giá trị mới phụ thuộc giá trị cũ.
- Dùng effect để đồng bộ hệ thống bên ngoài, có cleanup cho subscription.
- Cung cấp nhãn hiển thị, nút đúng ngữ nghĩa, trạng thái tải và lỗi.

## Xử lý lỗi

| Triệu chứng | Nguyên nhân có thể | Cách sửa |
| --- | --- | --- |
| Invalid hook call | Hook ngoài component hoặc có nhiều bản React | Xem vị trí hook; chạy `npm ls react react-dom` |
| Trang trắng | Lỗi runtime hoặc sai phần tử gắn ứng dụng | Đọc console trình duyệt; so `main.tsx` với `index.html` |
| State không đổi trên giao diện | Sửa trực tiếp object hiện có | Trả object hoặc mảng mới qua hàm cập nhật state |
| Biến môi trường là undefined | Thiếu `VITE_` hoặc server chưa cập nhật | Kiểm tra vị trí file và khởi động lại Vite |
| Route chỉ chạy khi điều hướng nội bộ | Hosting thiếu history fallback | Chuyển route client chưa biết về `index.html` |

## Đánh giá

React phù hợp giao diện tương tác theo component và có hệ sinh thái lớn. Ứng dụng client thuần vẫn cần chọn routing, tải dữ liệu, kiểm thử và kết xuất server. Với tài liệu tĩnh nhỏ, bộ công cụ này có thể không cần thiết.

**Tiếp theo:** [React + TypeScript + Vite](/project-guides/react-typescript-vite) · [React full stack](/project-guides/react-express-postgresql). **Nguồn chính thức:** [Học React](https://react.dev/learn) · [Bắt đầu từ đầu](https://react.dev/learn/build-a-react-app-from-scratch).
