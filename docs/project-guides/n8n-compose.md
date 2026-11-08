---
title: Tự chạy n8n bằng Docker Compose
version: Trình biên tập trên máy · SQLite · Compose v2
---

# Tự chạy n8n bằng Docker Compose

::: warning Chưa kiểm thử
Ví dụ ứng dụng trong bài chưa được cài đặt và chạy đầy đủ trong đợt chỉnh sửa này. Các bước dưới đây là hướng dẫn thực hành và kết quả mong đợi; kiểm tra build của website không xác nhận ứng dụng mẫu hoạt động.
:::

## Mục tiêu dự án

Chạy trình biên tập workflow n8n trên máy, lưu workflow mẫu và kiểm tra dữ liệu còn sau khi khởi động lại. Cấu hình tối thiểu này không có các dịch vụ AI sandbox tùy chọn, chỉ dành cho học tập trên máy cá nhân.

## Công nghệ sử dụng

[n8n](/technologies/n8n/), [Docker Compose v2](/technologies/docker/), named volume và cơ chế lưu trữ SQLite mặc định của n8n.

## Yêu cầu trước khi bắt đầu

Docker Desktop hoặc Docker Engine cùng plugin Compose v2. Kiểm tra daemon và plugin bằng `docker version`, `docker compose version`. Cổng **5678** cần trống. Trên Windows dùng chế độ Linux container của Docker; có thể chạy trong WSL2.

## Lệnh khởi tạo

Trong thư mục cha dành cho thực hành:

```sh
mkdir n8n-local
cd n8n-local
mkdir workflows
```

## Cấu hình môi trường

Tạo `.env.example`:

```dotenv
# Tag biến động cho lần chạy đầu; sau đó thay bằng phiên bản cụ thể đã rà soát.
N8N_VERSION=latest
GENERIC_TIMEZONE=Asia/Ho_Chi_Minh
```

Sao chép thành `.env` (Bash: `cp .env.example .env`; PowerShell: `Copy-Item .env.example .env`). Thêm dòng `.env` vào `.gitignore`. Ví dụ không dùng API key bên ngoài. n8n tạo thông tin mã hóa khi chạy lần đầu và lưu trong volume dữ liệu.

## Cấu trúc thư mục đề xuất

```text
n8n-local/
├── compose.yaml
├── .env.example
├── .env          # Không đưa vào Git
├── .gitignore
└── workflows/   # Bản xuất đã rà soát, không phải backup đầy đủ
```

## Các bước thực hiện

### 1. Định nghĩa dịch vụ

Tạo `compose.yaml`:

```yaml
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n:${N8N_VERSION:?Set N8N_VERSION}
    restart: unless-stopped
    ports:
      - "127.0.0.1:5678:5678"
    environment:
      GENERIC_TIMEZONE: ${GENERIC_TIMEZONE:-Etc/UTC}
      TZ: ${GENERIC_TIMEZONE:-Etc/UTC}
      N8N_SECURE_COOKIE: "false"
    volumes:
      - n8n_data:/home/node/.n8n
volumes:
  n8n_data:
```

`N8N_SECURE_COOKIE=false` phục vụ bài thực hành HTTP chỉ mở trên **loopback**. Khi triển khai từ xa, dùng HTTPS và bật secure cookie. Không mở ví dụ này ra mọi địa chỉ mạng bằng cách thay host binding.

### 2. Khởi chạy và kiểm tra

Tại `n8n-local`:

```sh
docker compose config
docker compose pull
docker compose up -d
docker compose ps
docker compose logs --tail=100 n8n
```

Chờ khởi động xong. Mở `http://localhost:5678` và thiết lập tài khoản chủ sở hữu. Ghi phiên bản thực tế bằng `docker compose exec n8n n8n --version`. Thay `latest` trong `.env` trên máy bằng đúng phiên bản ổn định đó để các lần chạy sau có thể tái lập.

### 3. Tạo workflow

Tạo và lưu **Manual Trigger → Edit Fields (Set)** với trường chuỗi `message` có giá trị `Hello handbook`. Chạy và xem đầu ra node cuối. Xem [khởi tạo n8n](/technologies/n8n/#khoi-tao-du-an) để theo dõi các bước trong giao diện. Tên và nút lưu/publish có thể khác giữa các phiên bản.

### 4. Kiểm tra dữ liệu lưu bền vững

```sh
docker compose stop
docker compose start
```

Mở lại trình biên tập và kiểm tra workflow đã lưu. Named volume độc lập với container. `docker compose down` cũng giữ volume theo mặc định. **Cảnh báo:** `down -v` xóa volume và dữ liệu trong đó; không dùng trong quy trình này.

## Chạy và kiểm tra

```sh
curl http://localhost:5678/healthz
docker compose exec n8n n8n --version
docker compose ps
```

Trên Windows dùng `curl.exe`. Mong đợi HTTP thành công từ `/healthz`, số phiên bản và container đang chạy. Workflow cần trả thông điệp và còn sau stop/start. Dừng dịch vụ bằng `docker compose stop` khi xong.

## Lỗi khởi tạo thường gặp

| Vấn đề | Kiểm tra và sửa |
| --- | --- |
| Container khởi động lại liên tục | Đọc log; kiểm tra image và kiến trúc được hỗ trợ |
| Không có quyền với đường dẫn dữ liệu | Dùng named volume như ví dụ thay vì mount thư mục máy tùy ý |
| Trình biên tập cảnh báo cookie | Kiểm tra URL loopback và cấu hình local; dùng HTTPS khi truy cập từ xa |
| Workflow biến mất | Kiểm tra tên dự án Compose và volume; tránh tạo nhầm dự án khác |
| Phiên bản thay đổi ngoài dự kiến | Thay tag biến động bằng phiên bản cụ thể đã rà soát |

## Kết quả mong đợi

- [ ] Trình biên tập mở được và đã thiết lập chủ sở hữu.
- [ ] Workflow thủ công đã lưu chạy được mà không cần credential bên ngoài.
- [ ] Workflow và tài khoản còn sau khi khởi động lại.
- [ ] Đã ghi lại phiên bản cài đặt.

Trước khi nâng cấp, dừng instance, backup nhất quán toàn bộ volume và thử khôi phục vào instance riêng. Giữ thông tin mã hóa cùng cơ sở dữ liệu. Production cần kế hoạch PostgreSQL, TLS, URL/proxy, bảo vệ credential, thời hạn lưu dữ liệu và cô lập runner. Nếu cần n8n Assistant sandbox tùy chọn, đọc hướng dẫn cài đặt chính thức vì cần dịch vụ bổ sung.

**Nguồn chính thức:** [Cài bằng Compose](https://docs.n8n.io/deploy/host-n8n/install-options/install-using-docker-compose) · [Biến triển khai](https://docs.n8n.io/hosting/configuration/environment-variables/deployment/) · [Ví dụ hosting n8n](https://github.com/n8n-io/n8n-hosting).
