---
title: Compose, mạng, cấu hình và dữ liệu
version: Compose v2 · Linux bridge · PostgreSQL 17 · Level 2
status: guide
---

# Compose, mạng, cấu hình và dữ liệu

## Tổng quan

Compose mô tả một ứng dụng nhiều container bằng YAML rồi gọi Docker Engine để tạo network, volume và container. Nó không phải daemon chạy bên trong ứng dụng. Sau `up -d`, container vẫn chạy khi CLI thoát; Engine quản lý vòng đời. Một **service** là cấu hình vai trò, ví dụ `api`, không đồng nghĩa một container cố định. Một **project** nhóm các tài nguyên của lần triển khai.

```text
compose.yaml + biến nội suy
          │ docker compose config / up
          ▼
Docker Engine: project docker-notes
  api ───── app_net (DNS: api) ─── publish 127.0.0.1:3000
   │
  data_net (DNS: api, db) ─────── db ─── pg_data
               internal              không publish 5432
```

Tách service cho phép rebuild API mà không thay container database. Một container nên có một trách nhiệm chính; không nhét database và API vào cùng image chỉ để bớt file YAML. Compose phù hợp development, integration test và triển khai một máy có kế hoạch vận hành. Nó không tự tạo HA, failover hoặc rolling update nhiều máy. Xem [mô hình Compose](https://docs.docker.com/compose/intro/compose-application-model/).

## Yêu cầu trước khi bắt đầu

Đã học [CLI](./fundamentals) và [Dockerfile](./images-and-dockerfiles). Cần Compose v2, biết YAML thụt lề bằng space. **Chưa kiểm thử:** hành vi runtime/network/volume của các ví dụ chưa được xác nhận khi daemon chưa chạy. Dùng [bài 3](/project-guides/docker-express-postgresql) để có toàn bộ source thực hành, không ghép các đoạn minh họa rời dưới đây thành ứng dụng thiếu file.

## Cài đặt

```sh
docker compose version
docker version
```

Dùng Compose plugin/Desktop, không cài Compose v1. Không cần khóa `version:` đầu file Compose mới. Các cấu hình ở đây dùng tính năng phổ biến của Compose 2.30.3; kiểm tra phiên bản cài trên máy nếu một thuộc tính/cờ không được nhận diện.

## Khởi tạo dự án

Tại gốc workspace bài 3, trước khi tạo container:

```sh
docker compose config --quiet
docker compose config --services
docker compose up -d --build
docker compose ps -a
```

`config` nội suy và kiểm tra mô hình, chưa chứng minh image tải được hay database khỏe. `--services` phải hiện `api`, `db`. `up` tạo/cập nhật tài nguyên theo cấu hình; `--build` build image ứng dụng. `start` chỉ dùng container đã có; `restart` không áp dụng cấu hình mới.

Compose mặc định suy project name từ thư mục, có thể override bằng `-p`, `COMPOSE_PROJECT_NAME` hoặc `name:` trong file. Thay tên có thể tạo bộ volume mới khiến tưởng mất dữ liệu. Bài 3 đặt `name: docker-notes`; khi chạy nhiều bản song song, đặt project name, cổng và môi trường tách biệt. `container_name` thường không cần, gây xung đột và cản scale; dùng DNS service.

## Cấu hình

### Mạng bridge và DNS

Nếu không chỉ định network, Compose tạo network mặc định cho project. User-defined bridge cho phép container cùng mạng phân giải tên service, khác default bridge `bridge` truyền thống không tự có DNS tên container tương đương. Network riêng giúp giới hạn service nào kết nối trực tiếp được. Xem [bridge driver](https://docs.docker.com/engine/network/drivers/bridge/).

| Tiến trình gọi | Đích cần gọi | Địa chỉ trong bài 3 |
| --- | --- | --- |
| Browser trên host | API | `http://127.0.0.1:3000` qua published port |
| API container | Database container | `db:5432` qua `data_net` |
| Lệnh health trong API | Chính API | `http://127.0.0.1:3000/health` bên trong container |
| Browser trên host | Database | Không có cổng trực tiếp; dùng `docker compose exec db psql ...` |

`ports` publish ra host; `expose` chỉ mô tả cổng nội bộ và không phải firewall. Service chung mạng có thể kết nối cổng ứng dụng đang listen dù không khai báo `expose`. DNS name ổn định nhưng IP container có thể đổi khi tạo lại; ứng dụng phải xử lý kết nối cũ mất và phân giải/kết nối lại. Không lưu IP vào source. Xem [networking trong Compose](https://docs.docker.com/compose/how-tos/networking/).

Network `internal: true` cô lập kết nối ra ngoài qua mạng đó; service có thêm network khác vẫn có thể đi ra ngoài. Bài 3 chỉ cho DB vào `data_net` internal, API vào cả `app_net` và `data_net`. Đây không phải hệ thống phân quyền database: vẫn cần credential/role. Không dùng `network_mode: host` để chữa DNS; nó thay mô hình cô lập và có giới hạn nền tảng.

Khi phải gọi dịch vụ trên máy: Docker Desktop cung cấp `host.docker.internal`. Trên Linux Engine có thể cần `extra_hosts: ["host.docker.internal:host-gateway"]` và host service phải listen địa chỉ truy cập được. Chỉ mở phạm vi cần thiết, kiểm tra firewall; `localhost` không tự trỏ về host.

### `.env`, `env_file`, `environment` và `ARG`

Hai giai đoạn dễ nhầm:

1. **Compose dựng mô hình:** `${API_PORT:-3000}` được lấy từ shell/nguồn nội suy như `.env` hoặc `--env-file`. Shell có thể ghi đè giá trị mong đợi trong file.
2. **Container nhận biến:** qua `environment`, `env_file`, cờ runtime hoặc `ENV` mặc định của image. Chỉ đặt biến trong `.env` không khiến mọi biến xuất hiện trong container.

Ví dụ rời, đặt trong service API của bài 2 nếu muốn dùng Compose:

```yaml
services:
  api:
    image: handbook-express:local
    ports:
      - "127.0.0.1:${API_PORT:-3000}:3000"
    env_file:
      - ./api.env
    environment:
      NODE_ENV: production
      PORT: "3000"
```

`api.env` chỉ cần các biến runtime thực sự cần dùng; đừng truyền toàn bộ credential quản trị cho API. `environment` ghi đè cùng khóa trong `env_file`, kể cả giá trị rỗng. Giá trị `ENV` trong image là mặc định thấp hơn cấu hình runtime. `docker compose run -e` có thể override khi chạy container một lần; không đổi môi trường container đang chạy của `up`. Tra cứu đầy đủ [thứ tự ưu tiên](https://docs.docker.com/compose/how-tos/environment-variables/envvars-precedence/).

`${POSTGRES_PASSWORD:?Cần đặt POSTGRES_PASSWORD}` buộc nội suy thất bại nếu thiếu/rỗng; `${VAR:-default}` dùng mặc định. `$$` trì hoãn mở rộng để shell **trong container** đọc biến, như `pg_isready -U "$$POSTGRES_USER"`. Trong YAML nên quote port và chuỗi có dạng boolean/số. `ARG` thuộc build, không phải runtime configuration và không phù hợp secret.

### Healthcheck, phụ thuộc và restart

```yaml
services:
  api:
    depends_on:
      db:
        condition: service_healthy
  db:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \"$$POSTGRES_USER\" -d \"$$POSTGRES_DB\""]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 20s
```

Đây là đoạn bổ sung minh họa, chưa đủ `image/build` để chạy độc lập. `interval` đặt nhịp kiểm tra, `timeout` giới hạn một lần, `retries` là số lần lỗi liên tiếp để chuyển unhealthy; `start_period` cho thời gian khởi tạo mà lỗi chưa bị tính như bình thường. Lệnh probe phải có sẵn trong image. `CMD` exec form không qua shell; `CMD-SHELL` có mở rộng biến và toán tử shell.

`depends_on` dạng ngắn chỉ sắp thứ tự chạy, không chờ sẵn sàng. `service_healthy` chờ probe thành công khi khởi tạo phụ thuộc. `pg_isready` chỉ kiểm tra server nhận kết nối, không chứng minh schema/role ứng dụng đúng. API nên có readiness probe truy vấn nhẹ bằng chính tài khoản của nó. Đây không phải cam kết DB sẽ luôn sống; API vẫn cần timeout, xử lý lỗi và kết nối lại. Xem [startup order](https://docs.docker.com/compose/how-tos/startup-order/).

**Healthcheck không tự restart container unhealthy.** Restart policy phản ứng khi tiến trình thoát; app treo mà không thoát có thể chỉ giữ trạng thái unhealthy. `depends_on.db.restart: true` là hành vi khi Compose chủ động cập nhật/restart dependency, khác `restart:` ở cấp service do Engine thực hiện.

| Chính sách `restart` | Phù hợp | Giới hạn |
| --- | --- | --- |
| `"no"` | Bài thử hoặc job ngắn | Không tự chạy lại |
| `on-failure:3` | Thử lại tiến trình lỗi có giới hạn | Không retry mã thoát 0, không tự start do daemon restart |
| `always` | Dịch vụ luôn cần chạy | Sau stop thủ công, có thể chạy lại khi daemon restart |
| `unless-stopped` | Dịch vụ lâu dài nhưng tôn trọng stop thủ công | Không sửa lỗi cấu hình; có thể lặp lỗi liên tục |

Không kết hợp `--rm` với restart policy trong `docker run`. Đọc [restart policy](https://docs.docker.com/engine/containers/start-containers-automatically/) và quan sát log trước khi bật tự chạy lại.

### Dữ liệu bền vững, không chỉ là volume

`volumes: { pg_data: {} }` khai báo tài nguyên; service phải mount vào **đúng đường dẫn dữ liệu** của image. PostgreSQL 17 trong bài dùng `/var/lib/postgresql/data`; PostgreSQL 18+ thay bố trí mặc định, không áp dụng máy móc đường dẫn/tag khác. Tham khảo [image PostgreSQL](https://hub.docker.com/_/postgres).

Named volume sống độc lập container và có tên thực tế theo project, ví dụ `docker-notes_pg_data`. `stop`, `restart` giữ container; `down` xóa container/network nhưng giữ named volume; `down -v` xóa volume thuộc phạm vi quản lý của project và phá hủy dữ liệu. Volume external có vòng đời riêng. Không lưu file database vào lớp ghi container và không sao chép thô thư mục database đang chạy để giả làm backup nhất quán.

Volume không phải backup: xóa nhầm, host hỏng, migration lỗi đều ảnh hưởng dữ liệu. Dùng công cụ database như `pg_dump`, cất bản sao ngoài host và **thử restore vào database riêng**. Bài 3 có quy trình không phụ thuộc redirect binary của shell. Backup có thể chứa dữ liệu nhạy cảm; giới hạn quyền và không đưa vào Git.

## Cấu trúc dự án

```text
docker-notes/
├── compose.yaml          # Cấu hình local nền
├── compose.dev.yaml      # Chỉ dùng khi muốn watch source
├── .env.example
├── .env                  # Bỏ ngoài Git/context
├── Dockerfile
├── .dockerignore
├── package.json
├── package-lock.json
├── src/server.js
├── db/init.sql
└── backups/              # Bỏ ngoài Git/context
```

Không đặt backup trong image, không mount Docker socket cho API. Source đầy đủ tại [bài 3](/project-guides/docker-express-postgresql).

## Lệnh thường dùng

Tại `docker-notes`:

```sh
docker compose ps -a
docker compose logs --tail=100 --timestamps api db
docker compose exec api node -e "require('node:dns').lookup('db', console.log)"
docker compose exec db pg_isready -U handbook_admin -d handbook
docker network inspect docker-notes_data_net
docker volume inspect docker-notes_pg_data
docker compose up -d --build api
```

DNS probe phải trả địa chỉ, nhưng chưa chứng minh TCP/auth/query thành công. `network inspect` kiểm tra membership, không tự test kết nối. `up --build api` cập nhật API; `restart api` chỉ restart image/cấu hình cũ. Đừng in toàn bộ environment chứa secret để debug.

## Thực hành tốt

### Tách development và production

Dùng file override có chủ đích. Ví dụ rời `compose.dev.yaml` cho API JavaScript:

```yaml
services:
  api:
    environment:
      NODE_ENV: development
    command: ["node", "--watch", "src/server.js"]
    volumes:
      - ./src:/app/src:ro
```

```sh
docker compose -f compose.yaml -f compose.dev.yaml config --quiet
docker compose -f compose.yaml -f compose.dev.yaml up -d --build
```

Mount chỉ source để không che dependency trong `/app/node_modules`. Thay dependency vẫn cần rebuild; watch không cài thư viện. Với Windows/macOS, filesystem sharing có thể ảnh hưởng tốc độ và sự kiện watch.

Compose merge theo quy tắc từng trường: mapping được ghép, một số danh sách như port có quy tắc gộp/duy nhất, không phải toàn bộ file sau thay file trước. Mọi đường dẫn tương đối được giải theo file nền đầu tiên. Dùng `config` để xem kết quả trên terminal riêng trước khi chạy, tránh lộ secret. Không thêm port debug vào file nền rồi kỳ vọng bỏ khóa ở override production sẽ tự xóa. Xem [merge Compose](https://docs.docker.com/compose/how-tos/multiple-compose-files/merge/).

Production cần file triển khai đã rà soát: image phát hành/digest, không source bind mount/watch, secrets bên ngoài, backup, TLS/proxy, giới hạn tài nguyên và giám sát. Local Compose secrets có thể mount file theo service, nhưng không phải kho secret mã hóa tự động; ứng dụng phải đọc file (quy ước `_FILE` chỉ có nếu image/app hỗ trợ). Xem [Compose secrets](https://docs.docker.com/compose/how-tos/use-secrets/).

## Xử lý lỗi

| Triệu chứng | Chẩn đoán | Sửa và kiểm tra lại |
| --- | --- | --- |
| `db` không phân giải | `network inspect`, kiểm tra tên service và network | Cho hai service vào cùng mạng; chạy lại DNS probe |
| DNS đúng nhưng connection refused | DB chưa listen, dùng sai cổng hoặc chưa ready | Xem DB log/health; dùng `db:5432`, thử `/ready` |
| Password sai sau đổi `.env` | Volume DB đã khởi tạo với credential cũ | Đổi mật khẩu bằng SQL/quy trình quản lý; cập nhật API và test; không xóa volume |
| Thêm SQL nhưng không thấy bảng | Init script chỉ chạy trên data directory rỗng | Chạy migration riêng đã rà soát; kiểm tra bảng bằng psql |
| Không thấy dữ liệu cũ | Đổi project name hoặc mount path | Xác định volume cũ trước khi chỉnh; không tạo/xóa thử liên tục |
| Chỉnh `.env` mà API chưa đổi | Chỉ restart, chưa tạo lại container | `docker compose up -d api`, kiểm tra hành vi API bằng request |

## Đánh giá

Chỉ biết `up -d` chưa đủ: cần giải thích đường đi host → API → DB, volume nào giữ dữ liệu và probe nào kiểm tra được điều gì. Hoàn thành [bài 3](/project-guides/docker-express-postgresql) rồi luyện [vận hành và bảo mật](./operations-security).
