---
title: Hướng dẫn dự án
version: Năm lộ trình thực hành · Handbook 1.0
---

# Thực hành xây dựng dự án

Mỗi bài bắt đầu trong thư mục mới, giải thích môi trường và kết thúc bằng các bước tự kiểm tra. Thời gian đọc và thiết lập là ước tính, chưa tính cài công cụ và tải dependency.

| Hướng dẫn | Kết quả | Thời gian |
| --- | --- | --- |
| [React + TypeScript + Vite](./react-typescript-vite) | Bộ đếm có kiểu dữ liệu và bản build production | 10 phút |
| [React + Express + PostgreSQL](./react-express-postgresql) | Giao diện đọc ghi chú từ cơ sở dữ liệu | 25 phút |
| [Ứng dụng Next.js full stack](./nextjs-fullstack) | Trang kết xuất trên server và route JSON | 15 phút |
| [Đóng gói Node.js bằng Docker](./docker-nodejs) | Container không dùng root, có endpoint kiểm tra sức khỏe | 15 phút |
| [Tự chạy n8n bằng Docker Compose](./n8n-compose) | Trình biên tập workflow với dữ liệu lưu bền vững | 15 phút |

## Danh sách kiểm tra chung

- [ ] Chọn tên dự án và thư mục cha mới.
- [ ] Kiểm tra phiên bản Node/npm hoặc Docker trước khi bắt đầu.
- [ ] Sao chép `.env.example` thành file môi trường trên máy và thay giá trị mẫu.
- [ ] Chạy server trong terminal riêng và ghi lại các cổng.
- [ ] Thử cả tình huống thành công và thất bại, rồi dừng dịch vụ khi hoàn tất.

Xem [hướng dẫn công nghệ](/) để hiểu cấu hình và [lỗi thường gặp](/references/common-errors) khi thiết lập thất bại. Đọc [ghi chú phiên bản](/references/versions) trước khi xem bản scaffold mới nhất là tương đương với phiên bản trong bài.
