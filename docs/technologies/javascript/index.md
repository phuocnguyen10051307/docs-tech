---
title: JavaScript
version: JavaScript hiện đại · ESM
status: starter
---

# JavaScript

::: warning Chưa kiểm thử
Ví dụ ứng dụng trong bài chưa được cài đặt và chạy đầy đủ trong đợt chỉnh sửa này. Các bước dưới đây là hướng dẫn thực hành và kết quả mong đợi; kiểm tra build của website không xác nhận ứng dụng mẫu hoạt động.
:::

::: info Đang biên soạn
Trang cung cấp nội dung khởi đầu theo cấu trúc chung. Ví dụ chi tiết và phần xử lý lỗi mở rộng còn đang biên soạn. Xem các bài liên quan để thực hành có đầy đủ ngữ cảnh.
:::

## Tổng quan

JavaScript chạy trên trình duyệt và Node.js. Dùng cho giao diện tương tác, script và code server.

## Yêu cầu trước khi bắt đầu

Cài [Node.js](/technologies/nodejs/) để thực hành trong terminal; thực hành trên trình duyệt chỉ cần công cụ phát triển.

## Cài đặt

Trình duyệt tích hợp JavaScript. Để chạy file trên máy, theo hướng dẫn cài Node thay vì tìm package JavaScript toàn cục.

## Khởi tạo dự án

Trong thư mục mới `js-lab`, tạo `index.mjs` chứa `console.log('Hello handbook')`. Chạy `node index.mjs` tại đó; mong đợi thông điệp được in ra.

## Cấu hình

Dùng `.mjs` để xác định ESM hoặc khai báo `"type": "module"` trong `package.json`. Bài này không cần biến môi trường.

## Cấu trúc dự án

Bắt đầu với `src/` chứa module, `test/` chứa kiểm thử hành vi. Tách code DOM chỉ dùng trên trình duyệt khỏi code file hệ thống chỉ dùng trong Node.

## Lệnh thường dùng

Chạy trong thư mục dự án đã khởi tạo, sau khi hoàn thành thiết lập được liên kết:

```sh
node index.mjs
node --check index.mjs
```

## Thực hành tốt

Mặc định dùng `const`, xử lý promise bị reject và trả dữ liệu mới khi cập nhật state giao diện. Kiểm tra đầu vào bên ngoài.

## Xử lý lỗi

`document is not defined` cho biết code trình duyệt chạy trong Node. `require is not defined` thường do chạy CommonJS dưới ESM; dùng `import` hoặc ranh giới `.cjs` rõ ràng.

## Đánh giá

Dễ bắt đầu và được hỗ trợ rộng. Khi không có kiểu tĩnh, quy ước và kiểm tra runtime càng quan trọng. Kết hợp [TypeScript](/technologies/typescript/) khi hợp đồng dữ liệu phức tạp hơn.

**Tham khảo:** [Hướng dẫn JavaScript của MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide). **Liên quan:** [Node.js](/technologies/nodejs/) · [React](/technologies/react/).

