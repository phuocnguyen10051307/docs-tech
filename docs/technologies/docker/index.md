---
title: Docker — lộ trình cơ bản đến trung cấp
version: Linux container · Docker Engine / Desktop · Compose v2
status: guide
---

# Docker — lộ trình cơ bản đến trung cấp

## Tổng quan

Docker đóng gói chương trình và dependency thành **image**, rồi chạy image thành **container**. Bộ tài liệu giúp bạn tự dựng môi trường, đóng gói API, kết nối database và tìm nguyên nhân khi ứng dụng không chạy. Container chia sẻ kernel với môi trường chạy; nó không phải máy ảo đầy đủ và không tự giải quyết backup, bảo mật hay triển khai.

| Trình độ | Học và thực hành | Có thể tự làm sau khi học |
| --- | --- | --- |
| Level 1 — cơ bản | [Kiến trúc và CLI](./fundamentals), phần đầu [Dockerfile](./images-and-dockerfiles), [bài 1: Nginx](/project-guides/docker-nginx) | Phân biệt image/container, chạy và dừng dịch vụ, mở cổng, đọc log, mount HTML |
| Level 2 — trung cấp | [Layer, cache, multi-stage](./images-and-dockerfiles), [Compose, mạng và dữ liệu](./compose-networking-storage), [vận hành và bảo mật](./operations-security) | Tự build API, dùng DNS service, lưu dữ liệu bền vững, kiểm tra health và chẩn đoán lỗi |
| Củng cố Level 2 | [Bài 2: Express REST API](/project-guides/docker-nodejs), [bài 3: Express + PostgreSQL](/project-guides/docker-express-postgresql) | Quản lý ứng dụng nhiều container, kiểm tra dữ liệu sau khi tạo lại, backup và phục hồi thử |

Đọc tuần tự nếu mới học; khi gặp lỗi, bắt đầu từ [quy trình chẩn đoán](./operations-security#xu-ly-loi). Không cần học Kubernetes để hoàn thành Level 2.

## Yêu cầu trước khi bắt đầu

- Biết terminal, đường dẫn tương đối và HTTP cơ bản. Bài Express cần JavaScript, Node.js và npm.
- Windows: bật ảo hóa, cài Docker Desktop theo [yêu cầu Windows/WSL2](https://docs.docker.com/desktop/setup/install/windows-install/), dùng **Linux containers**. macOS: Docker Desktop chạy Linux container trong máy ảo. Linux: có thể dùng Docker Engine và plugin Compose.
- Có quyền truy cập daemon, mạng để tải image/dependency và dung lượng trống cho image, cache, volume. Nếu máy cơ quan dùng proxy, kiểm tra chính sách trước khi sửa cấu hình.

Ví dụ dùng Compose v2 với cú pháp `docker compose`, không dùng Compose v1 `docker-compose`. Phạm vi là Linux container trên một máy. Các bài dùng `node:22-bookworm-slim`, `postgres:17-bookworm`, `nginx:stable-alpine` làm nền thực hành; đây là tag có thể cập nhật, không phải digest bất biến hay khẳng định phiên bản mới nhất.

::: warning Chưa kiểm thử
Trong lần biên soạn này, máy có Docker CLI 27.3.1 và Compose 2.30.3 nhưng Docker daemon chưa chạy. Không xác nhận được pull, build image, chạy container, networking, healthcheck hoặc backup/restore thực tế. Mỗi bài nêu bước tự xác nhận và kết quả mong đợi; build website không kiểm chứng các kết quả đó.
:::

## Cài đặt

Chọn [Docker Desktop](https://docs.docker.com/desktop/) cho desktop hoặc [Docker Engine](https://docs.docker.com/engine/install/) cho bản phân phối Linux đang dùng. Không trộn lệnh cài Ubuntu với Debian/Fedora và không chạy script cài từ nguồn không rõ.

Sau khi khởi động Engine/Desktop, tại terminal bất kỳ:

```sh
docker version
docker info
docker compose version
docker run --rm hello-world
```

`version` phải có **Client và Server**; chỉ có Client chưa chứng minh Docker hoạt động. `info` cho biết server/context và tài nguyên. Lệnh cuối tải image khi thiếu, chạy một tiến trình in thông báo rồi xóa container do `--rm`; image vẫn còn.

Nếu daemon không kết nối, xem `docker context ls` và `docker context show`. Kiểm tra `DOCKER_HOST` nếu từng dùng daemon từ xa; đừng đổi context khi chưa hiểu đích kết nối. Trên Linux, quyền dùng Docker socket là quyền mạnh; đọc [bảo mật daemon](./operations-security) trước khi cấp quyền.

## Khởi tạo dự án

Giữ ví dụ Compose tối thiểu để kiểm tra máy, chạy trong **thư mục mới** `docker-lab`:

```sh
mkdir docker-lab
cd docker-lab
```

Tạo `compose.yaml`:

```yaml
services:
  web:
    image: nginx:stable-alpine
    ports:
      - "127.0.0.1:8080:80"
```

Tại `docker-lab`, chạy:

```sh
docker compose config --quiet
docker compose up -d
docker compose ps
```

`config --quiet` kiểm tra cấu hình mà không in giá trị biến. `up -d` tạo/chạy service nền. Mở `http://127.0.0.1:8080`, mong đợi trang chào Nginx. Cổng host là `8080`, cổng container là `80`. Dọn bằng `docker compose down`; ví dụ chưa có volume dữ liệu. Tiếp tục [bài Nginx với HTML tự viết](/project-guides/docker-nginx).

## Cấu hình

| Thành phần | Trách nhiệm | Không thay thế cho |
| --- | --- | --- |
| `Dockerfile` | Công thức build image | Cấu hình nhiều dịch vụ |
| `.dockerignore` | Loại file khỏi build context | `.gitignore` |
| `compose.yaml` | Mô tả service, network, volume, cấu hình runtime | Backend hoặc cluster scheduler |
| `.env.example` | Danh sách biến với giá trị giả | Kho secret production |
| `.env` | Giá trị local dùng cho nội suy nếu Compose đọc | Tự động truyền mọi biến vào container |

Không đưa `.env` vào Git hay image. `docker compose config` không có `--quiet` có thể in secret đã nội suy; không chia sẻ nguyên đầu ra. Mặc định các bài chỉ publish cổng trên loopback, database chỉ có mạng nội bộ. Xem [môi trường và DNS](./compose-networking-storage).

## Cấu trúc dự án

Các thư mục bên dưới là **workspace thực hành bên ngoài website**, không cần tạo backend trong repository handbook:

```text
docker-workshops/
├── docker-nginx/       # Bài 1: HTML và Compose
├── docker-express/     # Bài 2: source API và Dockerfile
└── docker-notes/       # Bài 3: API, SQL, Compose và backup
```

Mỗi bài bắt đầu từ thư mục trống, có toàn bộ file nguồn cần viết và lệnh tạo lockfile. Không sao chép `node_modules` từ host vào container.

## Lệnh thường dùng

| Câu hỏi | Lệnh | Đọc tiếp |
| --- | --- | --- |
| Container nào đang chạy/đã thoát? | `docker ps -a` | [Vòng đời](./fundamentals) |
| Vì sao service thoát? | `docker compose logs --tail=100 api` | [Debug](./operations-security) |
| Code mới đã được build chưa? | `docker compose up -d --build api` | [Cache](./images-and-dockerfiles) |
| Đang dùng project/mạng nào? | `docker compose ls`, `docker network ls` | [Compose](./compose-networking-storage) |
| Chiếm RAM/CPU/đĩa bao nhiêu? | `docker stats --no-stream`, `docker system df` | [Tài nguyên](./operations-security) |

Chạy lệnh Compose tại thư mục chứa cấu hình của bài tương ứng. Không dùng lệnh xóa hàng loạt để chữa lỗi chưa xác định.

## Thực hành tốt

Giữ các nguyên tắc xuyên suốt: dependency có lockfile; image từ nguồn tin cậy; tiến trình ứng dụng không chạy root; secret ngoài image; database có volume và backup; chỉ publish cổng cần thiết; ghi log ra stdout/stderr; kiểm tra sau mỗi thay đổi. Production chạy image đã duyệt, development có thể bind mount source.

## Xử lý lỗi

| Triệu chứng | Kiểm tra đầu tiên | Hướng xử lý |
| --- | --- | --- |
| Không kết nối daemon | `docker version`, `docker context ls` | Khởi động đúng Engine/context |
| Cổng bận | `docker ps`, cổng ứng dụng host | Đổi cổng host, cập nhật URL thử |
| Không gọi được service | Host là `localhost` hay tên service? | Trong Compose dùng `db:5432`, không dùng cổng host |
| Dữ liệu có vẻ mất | `docker compose ls`, `docker volume ls` | Kiểm tra project name và mount; giữ nguyên volume |
| Code không đổi sau restart | Image ID và lần build cuối | Build rồi tạo lại container |

Chương [vận hành](./operations-security) có quy trình từ triệu chứng → nguyên nhân → sửa → kiểm tra lại; từng bài thực hành có lỗi riêng.

## Đánh giá

Bạn hoàn thành Level 1 khi tự giải thích được vì sao `EXPOSE` không mở cổng, vì sao container thoát và dữ liệu nào mất khi xóa container. Bạn hoàn thành Level 2 khi dựng được bài 3, tự tìm lỗi DNS/credential/healthcheck, tái tạo container mà dữ liệu còn, và phục hồi backup vào database riêng.

**Level 3 — lộ trình sau này:** Buildx đa kiến trúc và cache CI; SBOM, ký image và chuỗi cung ứng; rootless/user namespaces chuyên sâu; orchestration và rolling deployment; storage/HA nhiều máy; metrics tập trung và tracing. Đây là định hướng học tiếp, chưa được triển khai trong handbook này.

**Nguồn:** [Tổng quan Docker](https://docs.docker.com/engine/docker-overview/) · [Mô hình Compose](https://docs.docker.com/compose/intro/compose-application-model/). Các chương tiếp theo liên kết nguồn theo từng chủ đề.
