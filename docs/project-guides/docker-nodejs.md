---
title: Đóng gói ứng dụng Node.js bằng Docker
version: Container Node 22 · npm lockfile · chạy không dùng root
---

# Đóng gói ứng dụng Node.js bằng Docker

::: warning Chưa kiểm thử
Ví dụ ứng dụng trong bài chưa được cài đặt và chạy đầy đủ trong đợt chỉnh sửa này. Các bước dưới đây là hướng dẫn thực hành và kết quả mong đợi; kiểm tra build của website không xác nhận ứng dụng mẫu hoạt động.
:::

## Mục tiêu dự án

Build và chạy image cho endpoint kiểm tra sức khỏe trong [bài Node.js](/technologies/nodejs/). Giữ secret ngoài các lớp image và chạy bằng người dùng không có quyền root. Ứng dụng chỉ dùng module tích hợp của Node nên không cần biên dịch hoặc build nhiều giai đoạn.

## Công nghệ sử dụng

[Node.js](/technologies/nodejs/), [Docker](/technologies/docker/) và image Node dựa trên Debian slim.

## Yêu cầu trước khi bắt đầu

Hoàn thành bài Node.js trong thư mục `node-api` mới, gồm `src/server.js` và `package.json`. Cài Docker, kiểm tra `docker version`. Dừng tiến trình thực hành đang chiếm cổng 3000 trên máy.

## Lệnh khởi tạo

Tại `node-api`:

```sh
npm install --package-lock-only
node --check src/server.js
```

Ngay cả dự án không có dependency cũng cần lockfile để dùng `npm ci`. Nếu bổ sung dependency, tạo và đưa lockfile vào Git bằng phiên bản npm đã chọn.

## Cấu hình môi trường

Giữ `.env.example` có `PORT=3000`. Container nhận `NODE_ENV` và `PORT` lúc chạy, không sao chép `.env`. Secret production phải đến từ nền tảng triển khai hoặc secret được mount, không đặt trong dòng `ENV` của Dockerfile.

## Cấu trúc thư mục đề xuất

```text
node-api/
├── src/server.js
├── Dockerfile
├── .dockerignore
├── .env.example
├── package-lock.json
└── package.json
```

## Các bước thực hiện

### 1. Giới hạn build context

Tạo `.dockerignore`:

```text
node_modules
.git
.env
.env.*
!.env.example
*.log
coverage
```

### 2. Định nghĩa image

Tạo `Dockerfile`:

```dockerfile
FROM node:22-bookworm-slim
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --chown=node:node src ./src

ENV NODE_ENV=production
ENV PORT=3000
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
```

Sao chép manifest trước source giúp Docker tái sử dụng bước cài dependency khi chỉ code ứng dụng thay đổi. `USER node` bỏ quyền root. `EXPOSE` ghi chú cổng; vẫn cần `-p` để mở cổng ra máy. Tag nền có thể được cập nhật; ghim digest đã rà soát nếu cần bản phát hành tái lập.

### 3. Build và khởi chạy

Chạy tại `node-api`:

```sh
docker build -t handbook-node:local .
docker run --rm -d --name handbook-node --init -p 127.0.0.1:3000:3000 -e PORT=3000 handbook-node:local
```

Dấu chấm cuối là build context. `--init` hỗ trợ chuyển tiếp signal và thu hồi tiến trình con. Ứng dụng lắng nghe trên `0.0.0.0` trong container; cổng trên máy chỉ mở tại loopback.

## Chạy và kiểm tra

Từ terminal bất kỳ:

```sh
docker logs handbook-node
curl http://localhost:3000/health
docker exec handbook-node id
docker stop handbook-node
```

Trên Windows dùng `curl.exe` hoặc trình duyệt. Kết quả mong đợi là `{"status":"ok"}` và thông tin `id` của người dùng `node` không có quyền root. `docker stop` dừng server; `--rm` xóa container sau khi dừng. URL không tồn tại cần trả về 404 khi server đang chạy.

Để thử cổng khác trên máy nhưng giữ nguyên cổng container:

```sh
docker run --rm --name handbook-node --init -p 127.0.0.1:3001:3000 handbook-node:local
```

Mở `http://localhost:3001/health`; Ctrl+C dừng phiên chạy này. Khi source thay đổi, build lại image trước khi tạo container mới.

## Lỗi khởi tạo thường gặp

| Triệu chứng | Cách sửa |
| --- | --- |
| `npm ci` yêu cầu lockfile | Tạo `package-lock.json` trước khi build |
| Container chạy nhưng không mở được URL | Kiểm tra địa chỉ `0.0.0.0` và ánh xạ `-p` |
| Tên container đã được dùng | Xem `docker ps -a`; dừng container thực hành trước đó |
| Code mới chưa xuất hiện | Build lại image; khởi động lại không build lại các lớp |
| Source TypeScript không chạy | Thêm giai đoạn biên dịch và sao chép kết quả; bài này dùng JavaScript |

## Kết quả mong đợi

- [ ] Build thành công từ source và lockfile.
- [ ] Tiến trình không có quyền root phục vụ `/health`.
- [ ] Dịch vụ chỉ truy cập được qua ánh xạ cổng dự kiến.
- [ ] Dừng dịch vụ hoạt động và context không chứa `.env`.

Trong production, đẩy image đã rà soát lên registry; cấu hình giám sát sức khỏe, giới hạn tài nguyên, TLS và log tại hệ thống triển khai. Nếu thêm module native, thử trên cùng kiến trúc và hệ điều hành nền với production.

**Nguồn chính thức:** [Docker cho Node](https://docs.docker.com/guides/nodejs/) · [Tra cứu Dockerfile](https://docs.docker.com/reference/dockerfile/) · [Image Node chính thức](https://hub.docker.com/_/node).
