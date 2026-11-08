---
title: Hướng dẫn dự án
version: Mười lộ trình thực hành · Handbook 1.0
---

# Thực hành xây dựng dự án

Mỗi bài bắt đầu trong thư mục mới, giải thích môi trường và kết thúc bằng các bước tự kiểm tra. Thời gian đọc và thiết lập là ước tính, chưa tính cài công cụ và tải dependency.

| Hướng dẫn | Kết quả | Thời gian |
| --- | --- | --- |
| [React + TypeScript + Vite](./react-typescript-vite) | Bộ đếm có kiểu dữ liệu và bản build production | 10 phút |
| [React + Express + PostgreSQL](./react-express-postgresql) | Giao diện đọc ghi chú từ cơ sở dữ liệu | 25 phút |
| [Ứng dụng Next.js full stack](./nextjs-fullstack) | Trang kết xuất trên server và route JSON | 15 phút |
| [Docker bài 1: Nginx và HTML](./docker-nginx) | HTML tự viết qua bind mount, port và log | 25 phút |
| [Docker bài 2: Express REST API](./docker-nodejs) | Image non-root, REST API, healthcheck và vòng đời cập nhật | 45 phút |
| [Docker bài 3: Express + PostgreSQL](./docker-express-postgresql) | DNS, mạng riêng, dữ liệu bền vững, backup và restore thử | 90 phút |
| [Cài n8n local bằng Docker Compose](./n8n-compose) | Editor, SQLite và external task runner | 30 phút |
| [n8n bài 1: Lịch và API công khai](./n8n-scheduled-api) | Lấy API, xử lý dữ liệu và điều kiện theo lịch | 40 phút |
| [n8n bài 2: Webhook + PostgreSQL](./n8n-webhook-postgres) | Validation, SQL atomic và HTTP response | 90 phút |
| [n8n bài 3: AI Agent và phê duyệt](./n8n-ai-agent) | Tool chỉ đọc, xác thực draft và duyệt trước hành động | 90 phút |

## Danh sách kiểm tra chung

- [ ] Chọn tên dự án và thư mục cha mới.
- [ ] Kiểm tra phiên bản Node/npm hoặc Docker trước khi bắt đầu.
- [ ] Sao chép `.env.example` thành file môi trường trên máy và thay giá trị mẫu.
- [ ] Chạy server trong terminal riêng và ghi lại các cổng.
- [ ] Thử cả tình huống thành công và thất bại, rồi dừng dịch vụ khi hoàn tất.

Xem [hướng dẫn công nghệ](/) để hiểu cấu hình và [lỗi thường gặp](/references/common-errors) khi thiết lập thất bại. Đọc [ghi chú phiên bản](/references/versions) trước khi xem bản scaffold mới nhất là tương đương với phiên bản trong bài.
