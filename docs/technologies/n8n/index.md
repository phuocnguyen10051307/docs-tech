---
title: n8n
version: Trình biên tập workflow tự vận hành · Docker Compose v2
status: guide
---

# n8n

::: warning Chưa kiểm thử
Ví dụ ứng dụng trong bài chưa được cài đặt và chạy đầy đủ trong đợt chỉnh sửa này. Các bước dưới đây là hướng dẫn thực hành và kết quả mong đợi; kiểm tra build của website không xác nhận ứng dụng mẫu hoạt động.
:::

## Tổng quan

n8n kết nối trigger và hành động thành workflow. Dùng cho tích hợp, tác vụ định kỳ và thử nghiệm low-code. Tự vận hành cho phép kiểm soát hệ thống nhưng bạn chịu trách nhiệm nâng cấp và khôi phục. Kiểm tra điều khoản giấy phép khi nhúng hoặc cung cấp cho người khác.

## Yêu cầu trước khi bắt đầu

Cài [Docker và Compose v2](/technologies/docker/). Biết đọc log và bảo toàn volume. Đây là cấu hình **trình biên tập workflow trên máy**, dùng SQLite, chưa có AI sandbox hoặc task runner bên ngoài. Không dùng trực tiếp làm triển khai mở ra Internet.

## Cài đặt

Theo cách Compose trong [tự chạy n8n](/project-guides/n8n-compose), gồm đầy đủ `.env.example`, `compose.yaml`, lệnh chạy, kiểm tra và dừng. Không cần cài Node hoặc package n8n toàn cục.

## Khởi tạo dự án

Tạo thư mục riêng `n8n-local` và theo bài đó. Sau khi chạy:

1. Mở `http://localhost:5678` và thiết lập tài khoản chủ sở hữu.
2. Tạo workflow có **Manual Trigger**.
3. Nối node **Edit Fields (Set)**; thêm chuỗi `message` có giá trị `Hello handbook`.
4. Chạy workflow và xem đầu ra node.
5. Lưu workflow. Xuất JSON để quản lý phiên bản sau khi kiểm tra không chứa secret.

Kết quả mong đợi: node cuối trả một item có thông điệp đã cấu hình. Nhãn giao diện có thể khác theo phiên bản n8n. Ví dụ không cần credential bên ngoài.

## Cấu hình

Đặt các biến sau trong `.env.example`, rồi sao chép vào `.env` trên máy trước khi chạy:

```dotenv
N8N_VERSION=latest
GENERIC_TIMEZONE=Asia/Ho_Chi_Minh
```

Bài dùng image `latest` biến động chỉ cho lần chạy đầu trên máy. Ghi phiên bản bằng `docker compose exec n8n n8n --version`, rồi thay `latest` bằng phiên bản đó trước khi cần nâng cấp có thể tái lập.

Thư mục mount `/home/node/.n8n` lưu SQLite và khóa mã hóa được tự tạo. Giữ toàn bộ volume. Backup database thiếu khóa có thể khiến credential không dùng được. Khi triển khai công khai, dùng HTTPS và cấu hình URL trình biên tập/webhook, reverse proxy theo tài liệu chính thức.

## Cấu trúc dự án

```text
n8n-local/
├── compose.yaml
├── .env.example
├── .env                 # Cấu hình trên máy, không đưa vào Git
├── .gitignore
└── workflows/           # JSON xuất đã rà soát, không có credential
```

Named volume Docker nằm ngoài cây source. File xuất workflow hữu ích cho tài liệu và quản lý phiên bản nhưng không phải backup đầy đủ của instance.

## Lệnh thường dùng

Từ thư mục chứa `compose.yaml`:

```sh
docker compose up -d
docker compose ps
docker compose logs --tail=100 n8n
docker compose exec n8n n8n --version
docker compose stop
docker compose start
```

Kiểm tra trình biên tập mở được sau `start` và workflow còn tồn tại. Khi nâng cấp, backup trước, chọn phiên bản image đã rà soát trong `.env`, chạy `docker compose pull`, rồi `docker compose up -d`. Migration database có thể khiến hạ image không an toàn; cần kế hoạch khôi phục backup.

## Thực hành tốt

- Xây dựng và thử workflow thủ công trước khi nối trigger production.
- Lưu credential trong kho credential của n8n, không viết chuỗi bí mật trong node.
- Đặt tên workflow rõ ràng, ghi đầu vào và tác động phụ.
- Thiết kế retry an toàn: chạy lặp lại không tạo trùng thanh toán hoặc bản ghi.
- Giới hạn thời gian lưu execution và tránh giữ payload nhạy cảm không cần thiết.
- Backup dữ liệu cùng thông tin mã hóa; thử khôi phục vào instance riêng.
- Đánh giá PostgreSQL và cơ chế cô lập runner được hỗ trợ trước khi dùng production.

## Xử lý lỗi

| Triệu chứng | Nguyên nhân có thể | Cách xử lý |
| --- | --- | --- |
| Không mở được trình biên tập | Container chưa sẵn sàng hoặc trùng cổng | Đọc log, `docker compose ps`; kiểm tra cổng 5678 |
| Cảnh báo secure cookie trên máy | HTTP và cấu hình cookie không khớp | Dùng cấu hình loopback của bài; production dùng HTTPS |
| Lịch chạy sai giờ | Múi giờ workflow hoặc instance | Kiểm tra cấu hình workflow và `GENERIC_TIMEZONE` |
| Webhook chỉ chạy khi thử nghiệm | Bên gọi dùng URL test | Dùng URL production, bật/publish workflow theo phiên bản |
| Credential lỗi sau khôi phục | Thiếu khóa mã hóa gốc | Khôi phục thông tin mã hóa từ cùng bản backup |

## Đánh giá

n8n giúp nhìn rõ tích hợp và chỉnh sửa nhanh. Workflow lớn có thể khó rà soát, kiểm thử; dịch vụ riêng cho phép kiểm soát tốt hơn với nghiệp vụ phức tạp. Tự vận hành cần quản lý lưu trữ, bảo mật và tính sẵn sàng.

**Tiếp theo:** [Bài Compose đầy đủ](/project-guides/n8n-compose). **Nguồn chính thức:** [Cài Docker Compose](https://docs.n8n.io/deploy/host-n8n/install-options/install-using-docker-compose) · [Tra cứu biến môi trường](https://docs.n8n.io/hosting/configuration/environment-variables/deployment/) · [Tài liệu workflow](https://docs.n8n.io/workflows/).
