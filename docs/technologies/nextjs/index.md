---
title: Next.js
version: App Router · TypeScript · Scaffold được tạo
status: starter
---

# Next.js

::: warning Chưa kiểm thử
Ví dụ ứng dụng trong bài chưa được cài đặt và chạy đầy đủ trong đợt chỉnh sửa này. Các bước dưới đây là hướng dẫn thực hành và kết quả mong đợi; kiểm tra build của website không xác nhận ứng dụng mẫu hoạt động.
:::

::: info Đang biên soạn
Trang cung cấp nội dung khởi đầu theo cấu trúc chung. Ví dụ chi tiết và phần xử lý lỗi mở rộng còn đang biên soạn. Xem các bài liên quan để thực hành có đầy đủ ngữ cảnh.
:::

## Tổng quan

Framework React có kết xuất trên server, routing và endpoint server. Dùng khi ứng dụng trình duyệt cần chức năng phía server.

## Yêu cầu trước khi bắt đầu

Dùng Node.js còn được hỗ trợ, đáp ứng 22.12+, và hiểu [React](/technologies/react/). Kiểm tra yêu cầu engine chặt hơn trong scaffold được tạo.

## Cài đặt

Dùng scaffold `create-next-app` chính thức. Bài đầy đủ bên dưới có tham số và file; không trộn hướng dẫn Pages Router vào ứng dụng App Router.

## Khởi tạo dự án

Theo [ứng dụng Next.js full stack](/project-guides/nextjs-fullstack) để tạo trang kết xuất cùng route server có bước tự kiểm tra.

## Cấu hình

Giữ cấu hình TypeScript và Next được tạo. Giá trị chỉ dùng trên server đặt trong `.env.local`, ghi tên biến trong `.env.example`; biến `NEXT_PUBLIC_` có thể thấy ở trình duyệt.

## Cấu trúc dự án

Dùng `src/app/` cho route và layout, `src/components/` cho UI dùng chung, `src/lib/` cho tiện ích server/client có ranh giới rõ ràng.

## Lệnh thường dùng

Chạy trong thư mục dự án đã khởi tạo, sau khi hoàn thành thiết lập được liên kết:

```sh
npm run dev
npm run build
npm start
```

## Thực hành tốt

Giữ component trên server trừ khi cần tương tác trình duyệt. Thêm `use client` tại ranh giới nhỏ nhất cần thiết. Kiểm tra request trước khi ghi dữ liệu.

## Xử lý lỗi

Event handler trong Server Component cần ranh giới Client Component. Route bị thiếu thường do file nằm ngoài thư mục `app/` được chọn.

## Đánh giá

Chức năng full stack tích hợp giúp giảm công sức kết nối, nhưng cần hiểu cache và ranh giới server/client.

**Nguồn chính thức:** [Tài liệu Next.js](https://nextjs.org/docs/app). **Liên quan:** [Bài full stack](/project-guides/nextjs-fullstack) · [React](/technologies/react/).

