---
title: Docker
version: Docker Engine / Desktop · Compose v2
status: guide
---

# Docker

::: warning Chưa kiểm thử
Ví dụ ứng dụng trong bài chưa được cài đặt và chạy đầy đủ trong đợt chỉnh sửa này. Các bước dưới đây là hướng dẫn thực hành và kết quả mong đợi; kiểm tra build của website không xác nhận ứng dụng mẫu hoạt động.
:::

## Tổng quan

Docker đóng gói tiến trình và dependency thành image. Container chạy từ image; volume giữ dữ liệu độc lập. Dùng container cho dịch vụ có môi trường nhất quán và hạ tầng trên máy. Container vẫn chia sẻ kernel của host, không phải máy ảo đầy đủ.

## Yêu cầu trước khi bắt đầu

Bật ảo hóa phần cứng nếu môi trường desktop yêu cầu. Trên Windows, Docker Desktop thường dùng WSL2. Trên Linux có thể dùng Docker Engine cùng plugin Compose. Bạn cần quyền kết nối Docker daemon.

## Cài đặt

Theo [hướng dẫn Docker Desktop](https://docs.docker.com/desktop/) cho hệ điều hành hoặc [cài Docker Engine](https://docs.docker.com/engine/install/) trên Linux. Chạy daemon rồi thực hiện tại terminal bất kỳ:

```sh
docker version
docker compose version
docker run --rm hello-world
```

Mong đợi phiên bản client/server, phiên bản Compose v2 và thông báo hello-world thành công. Lệnh cuối tải image rồi xóa container sau khi thoát.

## Khởi tạo dự án

Tại thư mục cha, chạy `mkdir docker-lab`, rồi `cd docker-lab`. Tạo `compose.yaml`:

```yaml
services:
  web:
    image: nginx:stable-alpine
    ports:
      - "127.0.0.1:8080:80"
```

Tại `docker-lab`:

```sh
docker compose config
docker compose up -d
docker compose ps
```

`config` kiểm tra và kết xuất cấu hình. `up -d` chạy nền. Mở `http://localhost:8080`, mong đợi trang chào nginx. Tag image biến động thuận tiện cho thực hành; ghim digest được duyệt khi cần triển khai tái lập.

## Cấu hình

`compose.yaml` mô tả service, cổng, môi trường và volume. Ánh xạ trên chỉ mở loopback: cổng 8080 của máy chuyển tới cổng 80 của container. Container liên lạc bằng tên service Compose, không dùng cổng đã mở trên máy.

Bài thực hành không cần file môi trường. Khi thêm cấu hình, đưa `.env.example` vào Git, giữ `.env` trên máy và thay biến bằng `${VARIABLE}`. `docker compose config` có thể in secret sau khi thay biến; không đưa toàn bộ kết quả vào log công khai.

Dùng `Dockerfile` khi tự build image; xem [đóng gói Node.js](/project-guides/docker-nodejs). Dùng `.dockerignore` để loại `.env`, `.git`, `node_modules` khỏi build context.

## Cấu trúc dự án

```text
docker-lab/
├── compose.yaml
├── .env.example    # Chỉ thêm khi cần cấu hình
└── app/            # Ứng dụng tùy chỉnh nếu cần
    ├── Dockerfile
    └── .dockerignore
```

## Lệnh thường dùng

Chạy lệnh Compose từ thư mục chứa `compose.yaml`:

```sh
docker compose ps             # Container của dự án hiện tại
docker compose logs --tail=50 web
docker compose logs -f web    # Theo dõi log; Ctrl+C chỉ thoát chế độ xem log
docker compose stop          # Dừng và giữ container
docker compose up -d         # Khởi chạy hoặc cập nhật dịch vụ
docker compose down          # Xóa container và mạng của dự án
docker image ls              # Image lưu trên máy
docker volume ls             # Volume có tên
```

`down` giữ named volume trừ khi yêu cầu xóa. **Cảnh báo:** `down -v` xóa volume và dữ liệu; không dùng với dữ liệu cần giữ. Development có thể dùng bind mount để nhận thay đổi source. Production nên chạy image đã build thay vì mount thư mục làm việc.

## Thực hành tốt

- Lưu database trong named volume và thử khôi phục backup.
- Dùng cú pháp Compose v2 `docker compose`; không cần khóa `version` ở đầu file.
- Không đặt secret trong lớp image hoặc build argument.
- Dùng người dùng không có quyền root khi được hỗ trợ; chỉ mở cổng cần thiết.
- Thêm health check và chính sách tài nguyên phù hợp.
- Build lại image sau khi đổi dependency; khởi động lại container không build lại image.

## Xử lý lỗi

| Triệu chứng | Nguyên nhân | Cách sửa |
| --- | --- | --- |
| Không kết nối được daemon | Engine đã dừng hoặc sai context | Khởi chạy Docker; xem `docker context ls` |
| Cổng đã được dùng | Cổng trên máy bị chiếm | Chọn cổng bên trái khác, ví dụ `127.0.0.1:8081:80` |
| Container thoát ngay | Tiến trình chính lỗi hoặc đã xong | Đọc `docker compose logs web` |
| Service không gọi được service khác | Dùng `localhost` trong container | Dùng tên service đích và cổng nội bộ |
| Bind mount báo không đủ quyền | Người dùng host/container không khớp | Kiểm tra quyền sở hữu; ưu tiên named volume cho dữ liệu dịch vụ |

## Đánh giá

Docker giảm khác biệt môi trường và giúp kết hợp dịch vụ. Image, volume, mạng và cập nhật vẫn cần quản lý vận hành. Công cụ cài trực tiếp có thể nhẹ hơn cho script nhỏ.

**Tiếp theo:** [Đóng gói Node](/project-guides/docker-nodejs) · [n8n Compose](/project-guides/n8n-compose). **Nguồn chính thức:** [Bắt đầu với Compose](https://docs.docker.com/compose/gettingstarted/) · [Volume](https://docs.docker.com/engine/storage/volumes/).
