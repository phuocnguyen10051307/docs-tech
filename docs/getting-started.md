---
title: Bắt đầu sử dụng
version: Handbook 1.0 · Tháng 11/2026
---

# Tra cứu kiến thức phát triển hằng ngày

Dùng website khi nhớ cách làm nhưng quên câu lệnh. Bắt đầu từ tài liệu công nghệ để nắm nền tảng, hoặc theo hướng dẫn dự án để kết hợp các phần.

## Chọn lộ trình

| Bạn muốn… | Bắt đầu tại |
| --- | --- |
| Tạo ứng dụng React có kiểu dữ liệu | [React + TypeScript + Vite](/project-guides/react-typescript-vite) |
| Kết nối trình duyệt với cơ sở dữ liệu | [React + Express + PostgreSQL](/project-guides/react-express-postgresql) |
| Tìm hiểu React kết xuất trên server | [Ứng dụng Next.js full stack](/project-guides/nextjs-fullstack) |
| Đóng gói server để chạy nhất quán | [Đóng gói Node.js bằng Docker](/project-guides/docker-nodejs) |
| Chạy quy trình tự động trên máy | [n8n với Compose](/project-guides/n8n-compose) |
| Tra lệnh hoặc chẩn đoán lỗi | [Lệnh thường dùng](/references/quick-commands) · [Lỗi thường gặp](/references/common-errors) |

## Trước khi bắt đầu

- [ ] Cài Node.js LTS còn được hỗ trợ, đáp ứng **22.12+**, kèm npm. Scaffold mới có thể yêu cầu cao hơn; đọc cảnh báo engine.
- [ ] Cài Git và trình soạn thảo code.
- [ ] Với bài dùng container, cài Docker Desktop hoặc Docker Engine cùng plugin Compose v2.
- [ ] Chọn thư mục cha để thực hành; tránh vô tình tạo ứng dụng bên trong ứng dụng khác.

Chạy trong terminal bất kỳ:

```sh
node --version
npm --version
git --version
```

Mỗi lệnh cần hiển thị phiên bản. Bài dùng container còn yêu cầu `docker version` hiển thị cả client và server có thể kết nối.

## Cách đọc câu lệnh

Các khối lệnh không có ký tự `$` ở đầu để có thể sao chép trực tiếp. Comment hoặc câu đứng trước chỉ rõ thư mục chạy. Thực hiện từng dòng theo thứ tự. Chạy server dài hạn trong terminal riêng và dừng bằng **Ctrl+C**.

Phần lớn lệnh dùng được trong PowerShell, terminal macOS và shell Linux. Khối **Bash** dùng cú pháp Bash; trên Windows có thể dùng WSL hoặc Git Bash. Các bước sao chép file môi trường có lệnh PowerShell tương ứng. Trong Windows PowerShell, dùng `curl.exe` khi bài yêu cầu curl, hoặc mở URL trong trình duyệt.

## File môi trường

Đưa `.env.example` với tên biến và giá trị giả vào Git. Sao chép thành `.env` trên máy rồi điền giá trị riêng. Loại `.env` khỏi Git. Biến có tiền tố `VITE_` hoặc `NEXT_PUBLIC_` sẽ xuất hiện ở trình duyệt: tuyệt đối không đặt thông tin đăng nhập tại đó.

::: tip Trước khi dùng production
Các dự án phục vụ thực hành trên máy cá nhân. Production cần rà soát triển khai, phân quyền, xác thực dữ liệu, secret, backup, log và phiên bản dependency. Mỗi bài nêu các bước tiếp theo phù hợp với bộ công nghệ.
:::

## Tìm nội dung cần dùng

Dùng nút tìm kiếm hoặc **Ctrl+K / Cmd+K** để tra chỉ mục được tạo tại máy. Sidebar chia nhóm công nghệ, dự án và tra cứu. Mục lục bên phải dẫn đến các phần trong bài; trên di động dùng menu mục lục.

## Phạm vi nội dung và phiên bản

React, TypeScript, Node.js, Express, Docker và n8n có hướng dẫn nhập môn. JavaScript, Next.js, PostgreSQL, Prisma và Git & GitHub có nội dung khởi đầu, được đánh dấu **Đang biên soạn**. Bảy bài dự án có trình tự riêng; không suy ra ví dụ đã được chạy thử từ trạng thái biên soạn của trang.

Xem [ghi chú phiên bản](/references/versions) để biết phiên bản giả định và phạm vi kiểm tra. Để mở rộng handbook, đọc [biên soạn tài liệu](/references/contributing).
