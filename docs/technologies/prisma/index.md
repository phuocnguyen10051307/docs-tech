---
title: Prisma
version: Nội dung đang biên soạn · Chọn major trước khi thiết lập
status: starter
---

# Prisma

::: warning Chưa kiểm thử
Ví dụ ứng dụng trong bài chưa được cài đặt và chạy đầy đủ trong đợt chỉnh sửa này. Các bước dưới đây là hướng dẫn thực hành và kết quả mong đợi; kiểm tra build của website không xác nhận ứng dụng mẫu hoạt động.
:::

::: info Đang biên soạn
Trang cung cấp nội dung khởi đầu theo cấu trúc chung. Ví dụ chi tiết và phần xử lý lỗi mở rộng còn đang biên soạn. Xem các bài liên quan để thực hành có đầy đủ ngữ cảnh.
:::

## Tổng quan

Prisma cung cấp schema, quy trình migration và database client được sinh tự động. Giúp truy vấn trong ứng dụng dễ kiểm tra kiểu và khám phá hơn.

## Yêu cầu trước khi bắt đầu

Hiểu [TypeScript](/technologies/typescript/) và [PostgreSQL](/technologies/postgresql/). Kiểm tra yêu cầu Node của major Prisma đã chọn.

## Cài đặt

Bắt đầu từ [tài liệu Prisma 7 theo phiên bản](https://www.prisma.io/docs/orm/v7). Trang đang biên soạn chưa đưa ra lệnh cài chưa xác minh giữa các major thay đổi.

## Khởi tạo dự án

Chọn major phù hợp, theo quickstart PostgreSQL của major đó rồi ghi phiên bản CLI/client cụ thể trong lockfile. Xác nhận kết nối bằng một truy vấn trước khi thêm tính năng.

## Cấu hình

Giữ connection string chỉ trên server, ghi tên biến trong `.env.example`. Cấu hình Prisma và driver thay đổi theo major; dùng đúng tài liệu tương ứng.

## Cấu trúc dự án

Nhóm schema và migration dưới `prisma/`; giữ client dùng chung phía server trong `src/lib/`. Không tạo connection pool mới cho từng request.

## Lệnh thường dùng

Chạy trong thư mục dự án đã khởi tạo, sau khi hoàn thành thiết lập được liên kết:

```sh
npm ls prisma @prisma/client
npx prisma --version
```

## Thực hành tốt

Rà soát SQL được sinh, tách việc tạo migration development khỏi áp dụng migration production và đồng bộ phiên bản CLI/client.

## Xử lý lỗi

Client cũ: sinh lại theo hướng dẫn major đã cài. Kết nối lỗi: thử database độc lập trước khi đổi schema.

## Đánh giá

Truy cập có kiểu và truy vấn dễ khám phá là ưu điểm. Client sinh tự động, trạng thái migration và đổi major làm tăng bảo trì. Bài full stack dùng SQL với `pg` để tập trung vào quy trình kết nối.

**Nguồn chính thức:** [Tài liệu Prisma](https://www.prisma.io/docs/orm/v7). **Liên quan:** [PostgreSQL](/technologies/postgresql/) · [TypeScript](/technologies/typescript/).

