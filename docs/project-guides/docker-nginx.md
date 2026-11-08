---
title: Docker bài 1 — Nginx phục vụ HTML tự viết
version: Level 1 · nginx stable-alpine · Bind mount chỉ đọc
---

# Docker bài 1 — Nginx phục vụ HTML tự viết

::: warning Chưa kiểm thử
Docker daemon chưa chạy trong môi trường biên soạn. Pull image, truy cập HTTP, bind mount và vòng đời container dưới đây chưa được thực thi; kết quả nêu trong bài là kết quả mong đợi.
:::

**Đã kiểm tra ngày 08/11/2026:** trích `compose.yaml` trực tiếp từ bài và chạy `docker compose config --quiet` thành công với Compose 2.30.3. Việc này chỉ xác nhận mô hình cấu hình; chưa kiểm tra Nginx/container thực tế.

## Mục tiêu dự án

Chạy Nginx trong Docker, phục vụ trang HTML do bạn viết ở `http://127.0.0.1:8080`, thay nội dung mà không rebuild và giải thích được đường đi của request. Đây là bài local development, không phải cấu hình web server public có TLS.

## Công nghệ sử dụng

[Docker và container Linux](/technologies/docker/fundamentals), image [Nginx chính thức](https://hub.docker.com/_/nginx), Compose v2 và bind mount. Chưa cần Node, npm hay Dockerfile vì dùng image có sẵn.

## Yêu cầu trước khi bắt đầu

Cài [Docker](/technologies/docker/), khởi động Engine, kiểm tra `docker version` có Client/Server và `docker compose version` có v2. Cổng 8080 trống; tạo workspace bên ngoài repository handbook. Trên Windows dùng Linux containers. Lệnh Docker/Compose một dòng dùng được trong Bash và PowerShell; lệnh HTTP sẽ ghi riêng theo shell.

## Lệnh khởi tạo

Từ thư mục cha dành cho thực hành:

```sh
mkdir docker-nginx
cd docker-nginx
mkdir html
```

Mọi lệnh Compose tiếp theo chạy tại `docker-nginx`. Tạo các file đúng tên bên dưới bằng editor, không chỉ sao chép lệnh mà bỏ qua file.

## Cấu hình môi trường

Không có secret hay `.env` trong bài. Tag `nginx:stable-alpine` thuận tiện học nhưng có thể đổi nội dung theo thời gian; môi trường cần tái lập nên chọn phiên bản/digest thực tế đã duyệt. Host port chỉ bind loopback.

## Cấu trúc thư mục đề xuất

```text
docker-nginx/
├── compose.yaml
└── html/
    └── index.html
```

## Các bước thực hiện

### 1. Viết HTML

Tạo `html/index.html`:

```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Bài thực hành Docker với Nginx</title>
  </head>
  <body>
    <h1>Xin chào từ Nginx trong Docker</h1>
    <p>Trang này được đọc từ bind mount chỉ đọc.</p>
  </body>
</html>
```

### 2. Khai báo service

Tạo `compose.yaml`:

```yaml
name: docker-nginx
services:
  web:
    image: nginx:stable-alpine
    ports:
      - "127.0.0.1:8080:80"
    volumes:
      - type: bind
        source: ./html
        target: /usr/share/nginx/html
        read_only: true
        bind:
          create_host_path: false
```

`web` là tên service để gọi bằng Compose. `source` tính theo thư mục chứa file Compose; `target` là document root trong container. Bind mount che HTML mặc định của image bằng nội dung host. `read_only` chặn container ghi vào thư mục HTML, không cấm bạn sửa file trên host. `create_host_path: false` giúp báo lỗi khi gõ sai đường dẫn, thay vì tự tạo thư mục trống.

Nginx listen cổng 80 trong container; publish 8080 trên loopback host. Không cần `expose` thêm. Image đã có lệnh khởi chạy Nginx foreground, không cần tự thêm `command`.

### 3. Kiểm tra và khởi chạy

```sh
docker compose config --quiet
docker compose pull
docker compose up -d
docker compose ps
docker compose logs --tail=30 web
```

`pull` tải image trước, nên lỗi mạng/tag xuất hiện riêng khỏi bước tạo container. `up -d` chạy nền. Mong đợi service `web` ở trạng thái running và ánh xạ `127.0.0.1:8080->80/tcp`; bài chưa khai báo healthcheck nên running không đồng nghĩa healthy.

### 4. Xem log và kiểm tra cấu hình bên trong

```sh
docker compose exec web nginx -t
docker compose exec web sh
```

`nginx -t` kiểm tra cú pháp cấu hình Nginx, không kiểm tra toàn bộ nội dung website. Trong shell có thể chạy `ls /usr/share/nginx/html` và `cat /usr/share/nginx/html/index.html`, sau đó `exit`. Không sửa file trong container; nguồn HTML nằm trên host.

### 5. Quan sát bind mount và vòng đời

Sửa tiêu đề HTML trên host thành `Nội dung đã được cập nhật`, lưu rồi refresh browser hoặc gọi HTTP lại. Mong đợi thay đổi ngay, không `build`/`restart`. Nếu browser cache, thử request CLI hoặc hard refresh.

```sh
docker compose stop
docker compose ps -a
docker compose start
```

Giữa stop và start, HTTP phải thất bại. Sau start, HTML vẫn còn vì file nằm trên host. Đối chiếu [lớp ghi và mount](/technologies/docker/fundamentals) để hiểu vì sao xóa container không xóa file HTML.

## Chạy và kiểm tra

Bash:

```bash
curl -i http://127.0.0.1:8080/
curl -i http://127.0.0.1:8080/khong-ton-tai
```

PowerShell:

```powershell
curl.exe -i http://127.0.0.1:8080/
curl.exe -i http://127.0.0.1:8080/khong-ton-tai
```

Mong đợi trang gốc có HTTP 200 và tiêu đề tự viết; đường dẫn không có file trả 404. Xem access log bằng `docker compose logs --tail=20 web` để đối chiếu request vừa gửi. Không sao chép thời gian hoặc địa chỉ client từ log mẫu để coi như đã kiểm chứng máy mình.

## Lỗi khởi tạo thường gặp

| Triệu chứng | Nguyên nhân và cách sửa | Kiểm tra sau sửa |
| --- | --- | --- |
| Cổng 8080 bận | Đổi thành `127.0.0.1:8081:80`, không dừng ứng dụng lạ | `up -d`, gọi URL cổng 8081 |
| Vẫn thấy trang mặc định | Sai source/target mount hoặc đang mở container khác | Xem file bằng `exec`, chạy `compose ps`, gọi đúng cổng |
| 403 hoặc không có index | Mount thư mục trống, file sai tên, thiếu quyền đọc | Kiểm tra `html/index.html`, quyền host và `exec ... ls`; gọi lại `/` |
| Bind source không tồn tại | Chưa tạo `html` hoặc đường dẫn sai | Tạo đúng thư mục cạnh Compose; `up -d` lại |
| `bash` không có | Image Alpine nhỏ không kèm Bash | Dùng `sh`; xác nhận shell mở được rồi `exit` |
| Không kết nối daemon | Desktop/Engine chưa chạy | Khởi động, kiểm tra Server ở `docker version`, chạy lại |

Không bỏ `read_only` hoặc mở mọi quyền chỉ để xử lý 403; xác định file/quyền cụ thể trước.

## Kết quả mong đợi

- [ ] HTML do bạn viết được phục vụ với HTTP 200; file thiếu trả 404.
- [ ] Sửa file host cập nhật nội dung mà không rebuild.
- [ ] Đọc được log và kiểm tra `nginx -t`.
- [ ] Stop/start thay đổi khả năng truy cập, không làm mất file host.

### Dọn dẹp an toàn

Tại `docker-nginx`:

```sh
docker compose down
```

Lệnh xóa container/network của project, giữ `html/index.html` trên host và image đã tải. Không cần `-v`, bài này không có named volume. Nếu image được dự án khác dùng, giữ lại; không dùng prune toàn hệ thống.

Khi production, nên đóng gói HTML vào image đã duyệt thay vì phụ thuộc source bind mount; bổ sung TLS/proxy và cấu hình Nginx phù hợp. Tiếp theo: [bài 2 — đóng gói Express](./docker-nodejs).
