---
title: Vận hành, chẩn đoán và bảo mật Docker
version: Linux containers · Docker CLI / Compose v2 · Level 2
status: guide
---

# Vận hành, chẩn đoán và bảo mật Docker

## Tổng quan

Debug container cần tách các lớp: Engine → container process → filesystem/quyền → DNS/TCP → ứng dụng/database. Thấy trạng thái `running` chỉ chứng minh tiến trình còn sống; thấy `healthy` chỉ chứng minh probe đang cấu hình thành công. Cách hiệu quả là thu thập bằng chứng ở từng lớp rồi sửa một nguyên nhân, kiểm tra lại request thực tế.

Docker hỗ trợ giới hạn tài nguyên và cô lập, nhưng cấu hình quá rộng có thể trao quyền host cho ứng dụng. Bảo mật cơ bản là giảm quyền, giảm cổng mở, quản lý secret, cập nhật image và bảo vệ dữ liệu; không phải chỉ chọn image nhỏ.

## Yêu cầu trước khi bắt đầu

Dùng [bài 2](/project-guides/docker-nodejs) cho lệnh có tên `handbook-express`; dùng [bài 3](/project-guides/docker-express-postgresql) cho lệnh Compose tại `docker-notes`. **Chưa kiểm thử:** lệnh cần container, giới hạn tài nguyên và hành vi restart/health chưa chạy được trong lần biên soạn vì daemon chưa hoạt động.

## Cài đặt

Không cài debugger vào production image theo mặc định. Trước hết dùng công cụ có sẵn:

```sh
docker version
docker compose version
docker system df
```

Nếu CLI không liên lạc được server, việc đổi Dockerfile hay mật khẩu DB chưa có tác dụng. Linux thường cần kiểm tra service Engine; Desktop cần chờ Engine khởi động và chọn đúng context.

## Khởi tạo dự án

Trước một phiên debug ở `docker-notes`, ghi lại service và triệu chứng, không chép credential vào báo cáo:

```sh
docker compose ps -a
docker compose logs --tail=100 --timestamps api db
docker compose images
```

`ps -a` bắt được container exited mà `ps` mặc định có thể bỏ qua. Log với timestamp giúp đối chiếu lúc DB dừng và API lỗi. `images` cho biết artifact đang dùng; tag không đủ khẳng định nội dung mới đã chạy.

## Cấu hình

### Giới hạn CPU, RAM và số tiến trình

Container mặc định có thể dùng tài nguyên host trong phạm vi scheduler cho phép. CPU limit giới hạn thời gian CPU, không phải đặt trước một lõi riêng. Memory limit đặt trần, không phải bảo đảm app luôn được cấp đủ bộ nhớ; vượt giới hạn có thể bị OOM kill. Xem [resource constraints](https://docs.docker.com/engine/containers/resource_constraints/).

Lệnh minh họa chạy image bài 2, chỉ dùng khi không có container cùng tên:

```sh
docker run -d --name handbook-limited --init --cpus=1 --memory=256m --pids-limit=100 -p 127.0.0.1:3001:3000 handbook-express:local
docker stats --no-stream handbook-limited
docker inspect --format '{{.HostConfig.Memory}} {{.HostConfig.NanoCpus}} {{.HostConfig.PidsLimit}}' handbook-limited
```

`--cpus=1` là quota tương đương một CPU; `--memory=256m` là giới hạn bộ nhớ; `--pids-limit=100` giới hạn tiến trình/thread, có thể làm runtime lỗi nếu đặt quá thấp. Không sao chép con số này cho workload thật mà chưa đo. Docker Desktop còn có giới hạn RAM/CPU của máy ảo bên ngoài từng container.

Compose local có thể đặt trực tiếp dưới service:

```yaml
services:
  api:
    cpus: "1.0"
    mem_limit: 256m
    pids_limit: 100
```

Đây là đoạn bổ sung, không phải file chạy độc lập. Dùng `docker inspect` và `docker stats` để kiểm tra có hiệu lực. `deploy` có các tùy chọn dành cho nền triển khai; không giả định mọi engine/backend hỗ trợ giống nhau. Tham khảo [service attributes](https://docs.docker.com/reference/compose-file/services/).

### Log rotation và monitoring cơ bản

`docker stats` cho CPU, RAM, network/block I/O và PIDs tại thời điểm quan sát; `docker top` cho tiến trình; `docker system df` cho dung lượng image/cache/volume, không phải dashboard lịch sử. Dùng số đo theo thời gian và request thực tế để quyết định giới hạn.

Ví dụ cấu hình logging cho từng service Compose:

```yaml
services:
  api:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

Log stdout/stderr giúp thu thập tập trung, nhưng tăng không giới hạn có thể đầy đĩa. Cấu hình rotation áp dụng khi tạo container mới; chạy `up -d` và kiểm tra `HostConfig.LogConfig`, không chỉ restart. Rotation không thay thế retention/giám sát ở production. Xem [json-file logging](https://docs.docker.com/engine/logging/drivers/json-file/).

### Hardening cho API không cần ghi filesystem

API ở bài 2/3 ghi log ra console và dùng `/tmp` khi cần; có thể thử các thiết lập sau ở service API:

```yaml
services:
  api:
    read_only: true
    tmpfs:
      - /tmp:size=64m,mode=1777
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
```

`read_only` khóa filesystem gốc, không làm các volume bind mount khác tự thành read-only. `tmpfs` cấp thư mục tạm trong RAM, mất khi dừng. `cap_drop` bỏ Linux capabilities; `no-new-privileges` ngăn tiến trình nâng quyền qua cơ chế như setuid. Không áp dụng nguyên xi cho database cần thư mục dữ liệu ghi hoặc entrypoint cần đổi UID. Kiểm tra app sau khi giảm quyền; chỉ cấp lại quyền thật sự cần. Tham khảo [quyền runtime](https://docs.docker.com/engine/containers/run/).

### Secret, daemon và image

| Rủi ro | Thực hành cần chọn | Cách xác nhận / giới hạn |
| --- | --- | --- |
| App chạy root | `USER node` cho API, phân quyền mount rõ | `docker compose exec api id`; non-root không ngăn mọi lỗ hổng |
| Chiếm Docker socket | Không mount `/var/run/docker.sock`, không `--privileged` cho API | Rà mount và cấu hình; socket có thể điều khiển host |
| Credential lộ trong image/log | Secret ngoài build context, không log environment | Rà source, history và pipeline; thu hồi nếu đã lộ |
| Image bị cũ | Chọn nguồn tin cậy, cập nhật có kiểm thử | Ghi digest và lịch nâng cấp, scan theo công cụ của tổ chức |
| DB truy cập công khai | Không publish DB, role ứng dụng tối thiểu | Rà `ports`, membership network và grant SQL |
| Mất dữ liệu khi deploy | Volume đúng đường dẫn + backup ngoài host | Khôi phục thử vào môi trường riêng |

Nhóm `docker` trên Linux thường có quyền tương đương root qua daemon; thêm người dùng vào nhóm không phải biện pháp giảm quyền. Không mở daemon TCP không được bảo vệ. Đánh giá rootless khi phù hợp nhưng hiểu giới hạn mạng/storage. Bài học này chỉ giới thiệu, không cấu hình rootless chuyên sâu. Xem [bảo mật Engine](https://docs.docker.com/engine/security/).

Biến môi trường tiện cho local nhưng người có quyền Docker có thể đọc cấu hình container. Local Compose secrets là file mount theo service, không tự mã hóa secret trên host. Production dùng secret manager/cơ chế của nền tảng, TLS, role DB giới hạn; không chia sẻ `.env` hay backup qua Git.

## Cấu trúc dự án

Không tạo thêm ứng dụng riêng để debug. Giữ file khai báo và tài liệu vận hành cạnh source của bài thực hành:

```text
docker-notes/
├── compose.yaml
├── compose.dev.yaml       # Không tự dùng khi triển khai production
├── .env.example
├── db/init.sql
├── src/server.js
└── backups/               # Không commit; sao lưu thêm ra ngoài host
```

File cấu hình đã duyệt là nguồn tái tạo hệ thống. Sửa file trong container bằng `exec` chỉ là tạm thời, sẽ mất khi tạo lại.

## Lệnh thường dùng

### Kiểm tra trạng thái mà không in toàn bộ secret

Với bài 2:

```sh
docker inspect --format '{{.State.Status}} exit={{.State.ExitCode}} oom={{.State.OOMKilled}}' handbook-express
docker inspect --format '{{.Config.Image}} {{.Image}}' handbook-express
docker top handbook-express
docker port handbook-express
docker logs --since=10m --tail=100 handbook-express
```

Exit code 137 có thể do SIGKILL/OOM hoặc thao tác cưỡng bức; xác nhận `OOMKilled` và log host thay vì kết luận chỉ từ con số. Exit 0 có thể là job kết thúc đúng, không phải lỗi Docker. Khi container đã có healthcheck, xem log sức khỏe bằng lệnh dưới đây; đừng dùng probe in secret:

```sh
docker inspect --format '{{json .State.Health}}' handbook-express
```

Với bài 3:

```sh
docker compose exec api id
docker compose exec api node -e "console.log({port: process.env.PORT, host: process.env.PGHOST})"
docker compose exec api node -e "require('node:dns').lookup('db', console.log)"
docker compose exec api node -e "fetch('http://127.0.0.1:3000/ready').then(async r => { console.log(r.status, await r.text()) }).catch(console.error)"
```

Chỉ log các khóa không nhạy cảm. `exec` cần container đang chạy; khi restart loop, đọc log và cấu hình trước. Image tối giản có thể thiếu shell/curl/ping; dùng Node hoặc công cụ có sẵn để kiểm tra đúng lớp, không cài tùy tiện vào production. Ping thất bại cũng không chứng minh HTTP/TCP không hoạt động.

## Thực hành tốt

### Quy trình thay phiên bản an toàn

1. Ghi artifact đang chạy, volume và cấu hình, backup trước thay đổi có migration.
2. Build/pull image đã rà soát, chạy kiểm tra ở môi trường riêng.
3. Cập nhật service bằng `up -d`, theo dõi health/log và request đọc/ghi thực tế.
4. Giữ artifact cũ để rollback ứng dụng nếu tương thích schema. Rollback image không đảo ngược migration hay khôi phục dữ liệu đã xóa.

Development có thể dùng watch/bind mount; production cần artifact cố định, TLS/proxy, log retention và lịch backup/restore. Compose một máy không tự cung cấp zero downtime hay HA. Xem [cấu hình môi trường](./compose-networking-storage).

### Dọn dẹp có phạm vi

Dừng/xóa container giới hạn tài nguyên riêng ở trên:

```sh
docker stop handbook-limited
docker rm handbook-limited
```

Với bài 3, `docker compose down` giữ named volume. Trước khi dọn image/cache, dùng `docker system df`; chỉ xóa tài nguyên đã xác nhận không cần. Không chạy `docker system prune -a --volumes` như bước sửa lỗi mặc định. Xóa volume là mất dữ liệu, không có thùng rác Docker để phục hồi.

## Xử lý lỗi

### Trình tự chẩn đoán có thể lặp lại

| Bước | Bằng chứng cần lấy | Quyết định tiếp theo |
| --- | --- | --- |
| 1. Engine | `docker version`, context | Không có Server thì sửa daemon/context |
| 2. Tiến trình | `ps -a`, exit code, log | Exited thì sửa command/dependency/quyền trước khi kiểm tra mạng |
| 3. HTTP trong container | Gọi `/health` bằng Node | Không trả lời thì kiểm tra listen/PORT/event loop |
| 4. Port từ host | `docker port`, request host | Trong container tốt nhưng host lỗi thì kiểm tra publish/firewall/cổng bận |
| 5. DNS và TCP | Lookup `db`, health DB, mạng chung | DNS lỗi thì sửa membership/tên; TCP lỗi thì sửa port/readiness |
| 6. SQL | `/ready`, query bằng role ứng dụng | Sửa credential/schema/grant, không xóa volume để thử |
| 7. Tái xác nhận | Request thành công và lỗi có chủ đích | Đảm bảo sửa nguyên nhân, không chỉ che bằng restart |

### Các trường hợp thường gặp

| Triệu chứng | Nguyên nhân có thể | Cách sửa và kiểm tra sau sửa |
| --- | --- | --- |
| Restart liên tục | Sai command, thiếu biến, dependency lỗi | Đọc log trước; sửa cấu hình, tạo lại, kiểm tra restart count ổn định |
| `EACCES` | UID/GID hoặc thư mục read-only | Xác định file cần ghi; sửa ownership/mount tối thiểu rồi thử lại bằng non-root |
| `unhealthy` nhưng vẫn running | Probe sai đường dẫn/tool hoặc ứng dụng lỗi | Đọc Health log; chạy probe trực tiếp; xác nhận healthy và request thật |
| API khỏe nhưng DB query lỗi | Probe chỉ kiểm tra process | Dùng `/ready` truy vấn nhẹ; kiểm tra role, DB name và schema |
| RAM tăng rồi thoát | OOM, leak, workload vượt trần | Đo stats theo tải, kiểm tra OOM; sửa ứng dụng/cấu hình rồi đo lại |
| Đĩa đầy | Log/cache/image/volume tăng | Xem `system df`, rotation và retention; không xóa DB volume |
| SQL init không chạy lại | Data directory không rỗng | Dùng migration, kiểm tra schema; không dùng reset dữ liệu để cập nhật schema |
| Source mới chưa xuất hiện | Bind mount che source hoặc đang chạy image cũ | Rà mount và image ID; rebuild/recreate rồi gọi endpoint |

## Đánh giá

Bạn đạt Level 2 khi có thể trình bày nguyên nhân dựa trên log/trạng thái/request, chỉ sửa phần cần thiết và chứng minh dữ liệu còn sau khi tạo lại. Thử dừng DB ở bài 3: API phải trả 503 cho readiness mà process vẫn sống, rồi hồi phục sau khi DB chạy lại. Không thực hiện mô phỏng lỗi trên dịch vụ đang phục vụ người dùng.

Level 3 chỉ là hướng học tiếp tại [lộ trình Docker](./#đanh-gia): observability tập trung, triển khai nhiều máy và bảo vệ chuỗi cung ứng chưa thuộc chương này.
