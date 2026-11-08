---
title: Docker Level 1 — kiến trúc, container và CLI
version: Linux containers · Docker CLI · Level 1
status: guide
---

# Docker Level 1 — kiến trúc, container và CLI

## Tổng quan

### Kiến trúc Docker Engine

Docker CLI là client; `docker run` gửi yêu cầu qua API đến daemon `dockerd`. Daemon quản lý image, network, volume và container; phía thực thi dùng containerd và OCI runtime như runc để tạo tiến trình được cô lập. BuildKit xử lý build image. Registry lưu và phân phối image, không chạy ứng dụng thay bạn.

```text
Terminal: docker CLI / docker compose
                 │ Docker API (socket hoặc kết nối từ xa được bảo vệ)
                 ▼
          Docker Engine (dockerd) ─── pull/push ─── Registry
                 │
          containerd → OCI runtime
                 │
     Container A    Container B    Network / Volume
                 │
              Linux kernel
```

Namespaces tạo góc nhìn riêng về tiến trình/mạng/mount; cgroups quản lý tài nguyên. Filesystem image làm nền chỉ đọc, mỗi container có lớp ghi riêng. Cô lập không tương đương ranh giới bảo mật tuyệt đối: các Linux container dùng chung kernel. Trên Docker Desktop, kernel này thường thuộc máy ảo Linux, không phải kernel Windows/macOS.

CLI có thể điều khiển daemon từ xa qua context. Bind mount và volume nằm ở **máy chạy daemon**, không nhất thiết là laptop đang gõ lệnh. Xem [kiến trúc chính thức](https://docs.docker.com/engine/docker-overview/) và [cơ chế cô lập](https://docs.docker.com/engine/security/).

### Image, container và registry

| Khái niệm | Bản chất | Ví dụ và thời điểm dùng |
| --- | --- | --- |
| Image | Các layer filesystem chỉ đọc và metadata khởi chạy | `nginx:stable-alpine`, tạo một lần rồi chạy nhiều bản |
| Container | Instance có tiến trình, mạng và lớp ghi riêng | `handbook-web`, dừng/chạy lại mà không build |
| Registry | Dịch vụ phân phối image | Docker Hub hoặc registry nội bộ cho CI/CD |
| Repository image | Nhóm image cùng tên trong registry | `docker.io/library/nginx` |
| Tag | Tên tham chiếu có thể trỏ sang nội dung mới | `stable-alpine`, `local`, phiên bản phát hành |
| Digest | Định danh nội dung theo hash | Dùng digest thực tế đã duyệt để cố định đầu vào |

`nginx:stable-alpine` rút gọn từ Docker Hub và namespace `library`; repository Git lưu source, repository image lưu artifact. `latest` chỉ là tên tag, không đảm bảo mới nhất hay phù hợp production. Pull tag mới không cập nhật container đang chạy. Nhiều container dùng chung các layer image nhưng không chia sẻ lớp ghi; muốn chia sẻ dữ liệu phải mount đúng storage.

## Yêu cầu trước khi bắt đầu

Hoàn tất [cài Docker](./), dùng Linux containers và cổng 8080 trống. Lệnh dưới đây chạy ở terminal bất kỳ, trừ phần Dockerfile có thư mục riêng. **Chưa kiểm thử:** các lệnh cần daemon chưa được chạy trong lần biên soạn này.

## Cài đặt

Không cài Docker lần nữa; xác định client và server hiện tại:

```sh
docker version
docker info
docker context show
docker context ls
```

Nếu `version` chỉ trả Client rồi lỗi kết nối, sửa Engine/context trước khi thử lệnh khác. Linux container không chạy trực tiếp image Windows; chọn đúng chế độ và kiến trúc image.

## Khởi tạo dự án

### Chạy container đầu tiên có vòng đời quan sát được

```sh
docker pull nginx:stable-alpine
docker image ls
docker run -d --name handbook-web -p 127.0.0.1:8080:80 nginx:stable-alpine
docker ps
docker port handbook-web
```

`pull` tải image, `-d` chạy nền, `--name` đặt tên dễ tra cứu, `-p` publish cổng. Daemon tạo container mới mỗi lần `run`; dùng cùng tên sẽ xung đột. Mở `http://127.0.0.1:8080`; Windows có thể dùng `curl.exe`, Bash dùng `curl`.

### Vòng đời và tiến trình chính

```text
image --create--> created --start--> running --stop/tiến trình kết thúc--> exited
                                     ▲                                 │
                                     └────────── start ────────────────┘
created / exited --rm--> bị xóa; image và named volume có thể vẫn còn
```

`run` kết hợp tạo và chạy. Container tồn tại chừng nào tiến trình chính còn sống; `-d` không biến script chạy xong thành server. Container chạy `node --version` sẽ thoát bình thường với mã 0.

Chạy lần lượt với container thực hành:

```sh
docker stop --time 10 handbook-web
docker ps -a
docker start handbook-web
docker restart handbook-web
docker inspect --format '{{.State.Status}}' handbook-web
```

`stop` mặc định gửi SIGTERM rồi cưỡng bức dừng sau thời gian chờ trên Linux nếu ứng dụng chưa thoát. Ứng dụng nên đóng HTTP server/kết nối DB khi nhận signal. `start` giữ lớp ghi và cấu hình cũ; `restart` không nhận Dockerfile, source hay biến môi trường mới. Đổi các thứ đó thường cần tạo lại container. Chi tiết trong [running containers](https://docs.docker.com/engine/containers/run/).

## Cấu hình

### Port publishing và địa chỉ lắng nghe

```text
Trình duyệt host → 127.0.0.1:8080 → Docker chuyển cổng → container:80 → Nginx
```

`-p 127.0.0.1:8080:80` giới hạn cổng host ở loopback; `-p 8080:80` thường bind mọi giao diện và có thể làm dịch vụ truy cập được từ mạng ngoài. `EXPOSE 80` trong Dockerfile chỉ mô tả cổng, không mở cổng host. Ghi `/udp` nếu dịch vụ dùng UDP; mặc định TCP.

Server tùy chỉnh cần listen `0.0.0.0` **bên trong container** để nhận kết nối qua interface container. `localhost` trong container là chính nó, không phải host hay container khác. Khi có nhiều dịch vụ, dùng [mạng riêng và DNS](./compose-networking-storage), không hardcode IP.

Với Engine trước 28.0.0, Docker ghi nhận hạn chế bảo vệ cổng publish loopback đối với máy cùng mạng L2; dùng Engine được cập nhật và firewall phù hợp nếu dữ liệu nhạy cảm. Loopback là mặc định thực hành, không thay thế toàn bộ kiểm soát mạng. Xem [port publishing](https://docs.docker.com/engine/network/port-publishing/).

### Filesystem và mount

| Loại dữ liệu | Nằm ở đâu? | Khi xóa container | Dùng khi nào / giới hạn |
| --- | --- | --- | --- |
| Lớp ghi container | Storage của daemon | Mất | File tạm; không dành cho database cần giữ |
| Bind mount | Đường dẫn cụ thể trên máy daemon | File host còn | Source/HTML local; phụ thuộc đường dẫn và quyền host |
| Named volume | Docker quản lý, tên rõ ràng | Còn nếu không xóa volume | Database; vẫn cần backup, không tự đồng bộ sang máy khác |
| tmpfs | Bộ nhớ | Mất khi dừng | File tạm trên Linux, chịu giới hạn RAM |

Mount lên một thư mục che nội dung có sẵn ở đích; file trong image không bị xóa nhưng không còn nhìn thấy qua mount. Named volume rỗng có thể được Docker khởi tạo từ nội dung có sẵn tại điểm mount; bind mount không có hành vi sao chép đó. Đừng mount cả `/app` khi chỉ muốn cập nhật `/app/src`, vì có thể che `node_modules` đã cài.

Trong [bài Nginx](/project-guides/docker-nginx), `./html` được mount chỉ đọc vào `/usr/share/nginx/html`; [bài database](/project-guides/docker-express-postgresql) dùng named volume. Không dùng `chmod 777` như cách sửa quyền mặc định. Xem [bind mounts](https://docs.docker.com/engine/storage/bind-mounts/).

## Cấu trúc dự án

### Dockerfile đầu tiên

Dockerfile là công thức tạo image, không phải script chạy trên host. Trong thư mục trống `docker-html`, tạo hai file:

```text
docker-html/
├── Dockerfile
└── index.html
```

`index.html`:

```html
<!doctype html>
<html lang="vi"><meta charset="utf-8"><title>Docker đầu tiên</title>
<h1>Trang HTML của tôi trong container</h1></html>
```

`Dockerfile`:

```dockerfile
FROM nginx:stable-alpine
COPY index.html /usr/share/nginx/html/index.html
```

Tại `docker-html`:

```sh
docker build -t handbook-html:local .
docker run --rm -d --name handbook-html -p 127.0.0.1:8081:80 handbook-html:local
```

`FROM` chọn nền, `COPY` lấy file từ build context, `-t` đặt repository/tag, dấu `.` chọn thư mục hiện tại làm context. CMD sẵn có của image Nginx khởi chạy web server. Đổi HTML ở đây cần build và tạo lại container; bind mount ở bài 1 có vòng lặp development khác. Chi tiết layer, `RUN`, `CMD`, `USER`, `.dockerignore` ở [chương image](./images-and-dockerfiles).

## Lệnh thường dùng

### Quan sát, log và truy cập shell

```sh
docker ps -a
docker logs --tail=50 --timestamps handbook-web
docker logs -f handbook-web
docker exec -it handbook-web sh
```

Ctrl+C ở `logs -f` chỉ thoát trình xem. `exec` mở tiến trình mới trong container đang chạy; `-i` giữ stdin, `-t` cấp terminal. Gõ `exit` để thoát shell; không dừng Nginx. Dùng `sh` vì image nhỏ có thể thiếu `bash`. `exec` không chạy được với container đã thoát. Không cần tương tác thì chạy trực tiếp: `docker exec handbook-web nginx -t`.

`logs` chủ yếu lấy stdout/stderr; file log tự tạo trong filesystem không tự xuất hiện ở đây. Ứng dụng nên ghi ra console; tránh ghi secret. Xem [log Docker](https://docs.docker.com/engine/logging/).

### Quản lý image và registry

```sh
docker image inspect nginx:stable-alpine
docker image history nginx:stable-alpine
docker system df
```

`inspect` xem metadata/digest, `history` xem lịch sử layer, `system df` xem dung lượng để quyết định dọn có chọn lọc. Không chia sẻ toàn bộ `inspect` của container có credential.

Khi muốn phát hành image của chính bạn, ví dụ **Chưa kiểm thử** sau minh họa quy trình. Thay `your-account` bằng namespace bạn sở hữu trước khi chạy:

```sh
docker login
docker tag handbook-html:local your-account/handbook-html:1.0
docker push your-account/handbook-html:1.0
docker logout
```

`tag` thêm tên tham chiếu, không build lại; `push` gửi layer còn thiếu. Kiểm tra quyền repository private/public trước khi push. Dùng credential helper hoặc secret CI; không đặt token trong Dockerfile hay dòng lệnh lưu lịch sử. Không publish image chứa dữ liệu cá nhân.

## Thực hành tốt

Dùng container như artifact có thể thay thế: sửa source, build lại, chạy bản mới; không cài nóng bằng `exec` rồi xem đó là bản phát hành. `docker commit` không thay thế Dockerfile hay backup volume. Ghi lại tag/digest và mục đích các mount trước khi dọn.

Kết thúc các ví dụ ở chương này:

```sh
docker stop handbook-html
docker stop handbook-web
docker rm handbook-web
```

`handbook-html` dùng `--rm` nên tự xóa sau stop; `handbook-web` không dùng nên cần `rm`. Chỉ xóa image `handbook-html:local` bằng `docker image rm handbook-html:local` nếu không còn cần; không ảnh hưởng source. Các lệnh nhắm đúng tài nguyên thực hành.

## Xử lý lỗi

| Triệu chứng | Nguyên nhân thường gặp | Sửa và kiểm tra lại |
| --- | --- | --- |
| Container biến mất khỏi `ps` | Tiến trình đã thoát | Xem `ps -a`, `logs`, mã thoát trong `inspect`; chạy đúng server |
| Tên đã tồn tại | Container cũ vẫn còn, kể cả exited | `ps -a`, chọn tên khác hoặc dừng/xóa đúng container cũ; chạy lại và kiểm tra `ps` |
| Không mở được URL | Sai cổng hoặc server bind loopback trong container | `docker port handbook-web`, kiểm tra listen rồi thử lại HTTP |
| `exec` không tìm thấy `bash` | Image không có Bash | Dùng `sh` hoặc công cụ sẵn có; không thêm shell chỉ để chữa triệu chứng |
| Pull bị từ chối | Sai tên/tag, chưa login, repository private hoặc giới hạn registry | Kiểm tra image chính thức/quyền; pull lại đúng reference |
| `exec format error` | Kiến trúc hoặc script/shebang sai | Xem kiến trúc image/host và line ending; build cho nền đích |

Không dùng `docker rm -f` khi chưa đọc log và xác định dữ liệu cần giữ. Quy trình debug đầy đủ ở [vận hành](./operations-security).

## Đánh giá

Tự thử: dừng rồi start Nginx; đổi cổng host; thay HTML; phân biệt build lại và restart. Nếu giải thích được mỗi thao tác thay đổi image, container hay file host, bạn đã có nền tảng để học [Dockerfile và cache](./images-and-dockerfiles).
