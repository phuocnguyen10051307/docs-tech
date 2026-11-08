---
title: PostgreSQL
version: Phiên bản thực hành PostgreSQL 17
status: starter
---

# PostgreSQL

::: warning Chưa kiểm thử
Ví dụ ứng dụng trong bài chưa được cài đặt và chạy đầy đủ trong đợt chỉnh sửa này. Các bước dưới đây là hướng dẫn thực hành và kết quả mong đợi; kiểm tra build của website không xác nhận ứng dụng mẫu hoạt động.
:::

::: info Đang biên soạn
Trang cung cấp nội dung khởi đầu theo cấu trúc chung. Ví dụ chi tiết và phần xử lý lỗi mở rộng còn đang biên soạn. Xem các bài liên quan để thực hành có đầy đủ ngữ cảnh.
:::

## Tổng quan

Cơ sở dữ liệu quan hệ cho dữ liệu có cấu trúc, ràng buộc, join và transaction. Dùng khi cần tính đúng đắn và quan hệ dữ liệu bền vững.

## Yêu cầu trước khi bắt đầu

Cài [Docker](/technologies/docker/) để chạy database độc lập theo handbook hoặc cài PostgreSQL bằng hướng dẫn chính thức cho hệ điều hành.

## Cài đặt

[Bài React full stack](/project-guides/react-express-postgresql) chạy service `postgres:17` trên máy với lưu trữ bền vững và health check.

## Khởi tạo dự án

Theo bài đó để định nghĩa database, áp dụng `schema.sql` và xem bản ghi qua `psql` trước khi nối API.

## Cấu hình

Ghi `DATABASE_URL` trong `.env.example`; cấp credential riêng tư. Bài dùng đường dẫn volume PostgreSQL 17, khác mặc định của 18+.

## Cấu trúc dự án

Lưu SQL theo phiên bản trong `db/` hoặc `migrations/`, tách thay đổi schema thành file nhỏ và giữ backup ngoài repository source.

## Lệnh thường dùng

Chạy trong thư mục dự án đã khởi tạo, sau khi hoàn thành thiết lập được liên kết:

```sh
docker compose ps
docker compose exec db psql -U handbook -d handbook -c "SELECT version();"
```

## Thực hành tốt

Dùng truy vấn tham số hóa, transaction cho các thao tác ghi liên quan và constraint để áp quy tắc dữ liệu. Kiểm tra backup bằng cách khôi phục.

## Xử lý lỗi

Kết nối bị từ chối: kiểm tra dịch vụ sẵn sàng và cổng. Xác thực thất bại: so credential với lúc volume được khởi tạo. Đổi `.env` không đặt lại người dùng database đã có.

## Đánh giá

Hỗ trợ transaction mạnh và SQL phong phú. Cần kế hoạch migration, index, giám sát và quản lý lưu trữ.

**Nguồn chính thức:** [Tài liệu PostgreSQL](https://www.postgresql.org/docs/17/). **Liên quan:** [React + Express + PostgreSQL](/project-guides/react-express-postgresql) · [Docker](/technologies/docker/).

