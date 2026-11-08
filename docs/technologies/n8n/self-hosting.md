---
title: Self-host n8n — Docker, PostgreSQL, HTTPS và khôi phục
version: n8n 2.46.6 · PostgreSQL 17 · Compose v2 · Level 2
status: guide
---

# Self-host n8n — Docker, PostgreSQL, HTTPS và khôi phục

## Tổng quan

Self-hosting gồm cập nhật hệ điều hành/container, bảo vệ editor/webhook, lưu dữ liệu, quản lý secret và thử khôi phục. Workflow nghiệp vụ nằm trên nền đó và cần kiểm thử riêng. Không triển khai n8n như các file tĩnh của website handbook: n8n cần tiến trình lâu dài và storage bền vững.

| Môi trường | Chọn khi | Trách nhiệm |
| --- | --- | --- |
| Docker local + SQLite | Học UI, dữ liệu giả, một người dùng | Volume, key và backup nhất quán |
| Compose + PostgreSQL + runner | Instance lâu dài trên một máy | DB migrations, key, proxy, backup và giám sát |
| n8n Cloud | Không muốn vận hành máy | Quota/plan, credential và workflow vẫn cần quản lý |

## Yêu cầu trước khi bắt đầu

Hoàn tất [Compose local](/project-guides/n8n-compose) và [Docker storage](/technologies/docker/compose-networking-storage). VPS cần Linux còn được hỗ trợ, SSH bằng key, domain trỏ đúng IP và quyền mở80/443. Chọn tài nguyên theo đo workload, số execution đồng thời và binary/AI; không có một mức RAM bảo đảm cho mọi workflow.

**Chưa kiểm thử:** các lệnh cài/chạy, ACME/HTTPS, PostgreSQL migrations, runner và backup/restore trong chương chưa chạy với daemon thực. Mốc2.46.6 được chọn có nguồn tại [trang n8n](./); khi triển khai thật phải kiểm tra bản vá và migration hiện hành.

## Cài đặt

### Docker run cho phiên thử cô lập

Tại terminal bất kỳ sau khi Engine chạy:

```sh
docker volume create n8n_trial_data
docker run --rm -it --name n8n-trial -p 127.0.0.1:5678:5678 -e GENERIC_TIMEZONE=Asia/Ho_Chi_Minh -e TZ=Asia/Ho_Chi_Minh -e N8N_SECURE_COOKIE=false -e N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true -v n8n_trial_data:/home/node/.n8n docker.n8n.io/n8nio/n8n:2.46.6
```

Mở loopback5678, tạo owner, thử Manual/Edit Fields. Ctrl+C dừng và xóa container, **giữ volume** chứa SQLite/key tự tạo. Lệnh không cấu hình external runner, chỉ dành UI lab cô lập, không dữ liệu/credential nhạy cảm. Với Code/AI và instance lâu dài dùng Compose external runner; internal mode không phải lớp cô lập production. Không chạy cùng lúc với Compose đang chiếm5678. Nguồn: [Docker installation](https://docs.n8n.io/hosting/installation/docker/).

### Chuẩn bị VPS

Cài Docker Engine/Compose theo bản phân phối từ [Docker official](https://docs.docker.com/engine/install/), kiểm tra Server bằng `docker version`. Tạo thư mục triển khai riêng, bảo vệ quyền `.env`/backup. Firewall nhà cung cấp và host chỉ mở SSH từ nguồn quản trị,80/443 cho proxy; **không mở5432,5678,5679 ra Internet**. Không xem UFW đơn lẻ là bằng chứng Docker port publish không public; cấu hình đúng port/network và kiểm tra từ ngoài.

## Khởi tạo dự án

Tại thư mục cha trên VPS:

```sh
mkdir n8n-vps
cd n8n-vps
mkdir db
mkdir backups
```

Các file bên dưới độc lập với Compose local. Không tái dùng volume SQLite cũ rồi mong n8n tự chuyển sang PostgreSQL. Nếu cần migration, dùng quy trình export/import entities được hỗ trợ trên bản đang dùng và thử ở môi trường riêng trước.

## Cấu hình

### Environment và database nội bộ

Tạo `.env.example` rồi copy thành `.env` ngoài Git, thay domain và **tất cả** secret placeholder bằng giá trị riêng ngẫu nhiên:

```dotenv
N8N_VERSION=2.46.6
DOMAIN=automation.example.com
POSTGRES_PASSWORD=replace-with-admin-password
N8N_DB_PASSWORD=replace-with-n8n-db-password
N8N_ENCRYPTION_KEY=replace-with-stable-long-random-key
N8N_RUNNERS_AUTH_TOKEN=replace-with-different-long-random-token
```

`.gitignore`: thêm `.env`, `backups/`; `.env.example` chỉ có giá trị giả. Khóa mã hóa phải giống giữa main/worker khi mở rộng và giữ nguyên khi restore; thay key tùy tiện không tự mã hóa lại credential cũ. `_FILE` được hỗ trợ cho nhiều biến để mount secret file; kiểm tra biến/version cụ thể trước áp dụng, không mặc định mọi suffix đều hợp lệ.

`db/init.sql` khởi tạo role/schema cho n8n, không cấp superuser cho ứng dụng:

```sql
\getenv app_password N8N_DB_PASSWORD
CREATE ROLE n8n_app LOGIN PASSWORD :'app_password'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
GRANT CONNECT, TEMPORARY ON DATABASE n8n TO n8n_app;
CREATE SCHEMA n8n AUTHORIZATION n8n_app;
```

Role n8n_app sở hữu schema để n8n chạy migrations của **DB nội bộ**. Credential Postgres node cho dữ liệu nghiệp vụ phải dùng DB/schema/role riêng; không cho workflow sửa bảng nội bộ instance.

### Compose một máy với HTTPS

Tạo `compose.yaml`:

```yaml
name: n8n-vps
services:
  postgres:
    image: postgres:17-bookworm
    restart: unless-stopped
    environment:
      POSTGRES_USER: n8n_admin
      POSTGRES_DB: n8n
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Cần mật khẩu admin}
      N8N_DB_PASSWORD: ${N8N_DB_PASSWORD:?Cần mật khẩu n8n DB}
    volumes:
      - pg_data:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/001-init.sql:ro
    networks: [backend]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -h 127.0.0.1 -U n8n_admin -d n8n"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 20s
  n8n:
    image: docker.n8n.io/n8nio/n8n:${N8N_VERSION:?Cần N8N_VERSION}
    restart: unless-stopped
    environment:
      DB_TYPE: postgresdb
      DB_POSTGRESDB_HOST: postgres
      DB_POSTGRESDB_PORT: "5432"
      DB_POSTGRESDB_DATABASE: n8n
      DB_POSTGRESDB_SCHEMA: n8n
      DB_POSTGRESDB_USER: n8n_app
      DB_POSTGRESDB_PASSWORD: ${N8N_DB_PASSWORD:?Cần mật khẩu n8n DB}
      N8N_ENCRYPTION_KEY: ${N8N_ENCRYPTION_KEY:?Cần khóa mã hóa}
      GENERIC_TIMEZONE: Asia/Ho_Chi_Minh
      TZ: Asia/Ho_Chi_Minh
      N8N_HOST: ${DOMAIN:?Cần domain}
      N8N_PROTOCOL: https
      N8N_PORT: "5678"
      N8N_EDITOR_BASE_URL: https://${DOMAIN}/
      N8N_WEBHOOK_URL: https://${DOMAIN}/
      N8N_PROXY_HOPS: "1"
      N8N_SECURE_COOKIE: "true"
      N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS: "true"
      N8N_BLOCK_ENV_ACCESS_IN_NODE: "true"
      N8N_RUNNERS_MODE: external
      N8N_RUNNERS_BROKER_LISTEN_ADDRESS: 0.0.0.0
      N8N_RUNNERS_AUTH_TOKEN: ${N8N_RUNNERS_AUTH_TOKEN:?Cần token runner}
      EXECUTIONS_DATA_PRUNE: "true"
      EXECUTIONS_DATA_MAX_AGE: "168"
      EXECUTIONS_DATA_SAVE_ON_SUCCESS: none
      EXECUTIONS_DATA_SAVE_ON_ERROR: all
      EXECUTIONS_TIMEOUT: "300"
    volumes:
      - n8n_data:/home/node/.n8n
    networks: [edge, backend]
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:5678/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 30s
    logging:
      driver: json-file
      options: { max-size: "10m", max-file: "3" }
  runners:
    image: n8nio/runners:${N8N_VERSION:?Cần N8N_VERSION}
    restart: unless-stopped
    environment:
      N8N_RUNNERS_TASK_BROKER_URI: http://n8n:5679
      N8N_RUNNERS_AUTH_TOKEN: ${N8N_RUNNERS_AUTH_TOKEN:?Cần token runner}
    networks: [backend]
    depends_on:
      n8n:
        condition: service_healthy
  proxy:
    image: caddy:2
    restart: unless-stopped
    environment:
      DOMAIN: ${DOMAIN:?Cần domain}
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    networks: [edge]
    depends_on: [n8n]
networks:
  edge:
  backend:
    internal: true
volumes:
  pg_data:
  n8n_data:
  caddy_data:
  caddy_config:
```

Tạo `Caddyfile`:

```text
{$DOMAIN} {
    request_body {
        max_size 2MB
    }
    reverse_proxy n8n:5678
}
```

Đây là nền một VPS, **chưa phải bảo đảm production hoàn chỉnh**. Domain phải là domain thật do bạn quản lý, DNS/ACME và80/443 thông suốt. Caddy lấy/renew TLS và reverse proxy, tự gửi forwarded headers cơ bản. Không proxy metrics hay broker ra ngoài. Một proxy tin cậy nên `N8N_PROXY_HOPS=1`; nếu thêm CDN/load balancer, đếm đúng chuỗi proxy và kiểm soát nguồn truy cập, không tăng bừa. Chặn truy cập editor bằng VPN/allowlist/proxy policy phù hợp nhưng giữ webhook cần thiết truy cập được.

Với mốc này dùng `N8N_WEBHOOK_URL`; `WEBHOOK_URL` cũ được tài liệu n8n ghi deprecated từ2.35.0. n8n vẫn listen5678 bên trong, proxy nhận443 bên ngoài. Nguồn: [webhook URL sau proxy](https://docs.n8n.io/hosting/configuration/configuration-examples/webhook-url/), [Caddy reverse proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy).

`none` cho success data giảm dữ liệu nhạy cảm nhưng bài lab/debug có thể cần bật lưu thành công tạm thời; chọn theo nhu cầu, không copy nguyên retention cho mọi dữ liệu. Error data cũng có thể chứa payload nhạy cảm. `EXECUTIONS_TIMEOUT` tính bằng giây, timeout node có thể tính ms; chọn riêng workflow có Wait/AI sau khi kiểm tra semantics version.

### Encryption key, volume và backup

PostgreSQL giữ user/workflow/credential/execution nội bộ, volume n8n giữ dữ liệu người dùng/config và binary tùy mode. Key mã hóa không phải bản backup DB và không tự giải mã được nếu DB mất. Giữ cả DB, `.n8n`, key từ env/secret manager, Compose/image versions và storage ngoài nếu dùng. Không chỉ export JSON workflow rồi coi là full restore.

## Cấu trúc dự án

```text
n8n-vps/
├── compose.yaml
├── Caddyfile
├── db/init.sql
├── .env.example
├── .env              # Quyền truy cập hạn chế, ngoài Git
├── .gitignore
└── backups/          # Mã hóa/giới hạn quyền, sao lưu thêm ngoài VPS
```

## Lệnh thường dùng

### Khởi chạy và xác minh

Tại `n8n-vps`:

```sh
docker compose config --quiet
docker compose pull
docker compose up -d
docker compose ps
docker compose logs --tail=100 n8n runners postgres proxy
docker compose exec n8n n8n --version
```

Mở domain HTTPS, tạo owner ngay trong quy trình triển khai có kiểm soát, xác nhận certificate và webhook production URL. Kiểm tra Manual/Edit Fields/Code, credential read-only, schedule và webhook test/prod bằng fixture. Từ ngoài VPS kiểm tra5432/5678/5679 không truy cập được. Health200 không thay các bước này.

### Backup PostgreSQL và user folder

**Chưa kiểm thử.** Chọn maintenance window; dừng writer để DB và file có mốc nhất quán:

```sh
docker compose stop n8n runners
docker compose exec postgres pg_dump -U n8n_admin -d n8n -Fc -f /tmp/n8n.dump
docker compose cp postgres:/tmp/n8n.dump ./backups/n8n.dump
docker compose run --rm --no-deps --entrypoint sh -v ./backups:/backup n8n -c "tar czf /backup/n8n-home.tar.gz -C /home/node/.n8n ."
docker compose start n8n runners
```

File đích cố định có thể ghi đè backup lần trước; thực tế dùng tên theo thời điểm, giữ nhiều bản và lưu ngoài host. `tar` ghi bằng user container, sửa quyền thư mục backup cụ thể nếu cần, không chmod777. Không để proxy/URL công khai cho client nghĩ hệ thống vẫn phục vụ bình thường trong maintenance. Mã hóa và bảo vệ cả key/config/credential/reference trong backup. `pg_dump` không gồm global role; lưu cách tạo role và secrets riêng.

### Thử restore vào môi trường cô lập

1. Tạo workspace/bộ volume **mới**, DB trống và image đúng phiên bản backup. Không dùng database production làm đích thử.
2. Từ Compose VPS tạo bản recovery: bỏ service proxy, bỏ kết nối mạng `edge`, chỉ dùng network internal, không publish cổng, không start n8n lúc đầu. Copy secret key gốc an toàn; giữ file backup chỉ đọc.
3. Khởi động riêng Postgres bằng project riêng `docker compose -p n8n-recovery up -d postgres`, đợi ready. Init tạo role/schema cho DB mới.
4. Copy dump và restore ở **project recovery** như dưới. Lệnh `--clean` phá hủy object có trong dump ở DB đích: chỉ chạy trên DB phục hồi riêng đã xác nhận.

```sh
docker compose -p n8n-recovery cp ./backups/n8n.dump postgres:/tmp/n8n.dump
docker compose -p n8n-recovery exec postgres pg_restore -U n8n_admin --role=n8n_app --no-owner --clean --if-exists --exit-on-error -d n8n /tmp/n8n.dump
docker compose -p n8n-recovery run --rm --no-deps --entrypoint sh -v ./backups:/backup:ro n8n -c "tar xzf /backup/n8n-home.tar.gz -C /home/node/.n8n"
docker compose -p n8n-recovery run --rm --no-deps n8n unpublish:workflow --all
```

5. Vẫn giữ egress bị chặn: unpublish không tự hủy execution đang chạy/chờ Wait. Kiểm tra/dừng execution cũ trong môi trường recovery, dùng credential test trước cho phép mạng. Nếu mở editor để xem, chỉ bind loopback qua file recovery và SSH tunnel, không khôi phục proxy public.
6. Xác nhận owner/workflow, thử giải mã credential trên đích **test**, kiểm tra binary và execution cần giữ; thử workflow không tác động ngoài. Chỉ sau đó mới ghi nhận backup có thể dùng.

Quy trình chưa chạy ở môi trường biên soạn nên phải diễn tập trước khi dựa vào nó. SQLite local cần dừng n8n rồi archive toàn bộ user folder với key tương ứng; không cần pg_dump. Nguồn: [backup/restore n8n](https://docs.n8n.io/deploy/host-n8n/keep-n8n-running/backup-and-restore.md).

### Nâng cấp có kiểm soát

Ghi version/digest hiện tại, đọc release/migration, backup và restore thử trước. Đổi `N8N_VERSION` sang bản đã duyệt cho **cả n8n và runner**, `docker compose pull`, `docker compose up -d`; kiểm tra log migrations, runner, credential và workflow canary. Hạ tag sau migration không bảo đảm rollback; cần khôi phục snapshot/DB tương ứng. Nâng PostgreSQL major là quy trình riêng, không đổi17→18 trên volume cũ.

## Thực hành tốt

Import/export workflow qua UI trên instance test, map lại credential và workflow con IDs; không publish tự động. Server CLI `export:workflow`/`export:credentials` chỉ hỗ trợ một phần backup; tránh `--decrypted` vì xuất plaintext. Kiểm tra `--help` trên binary đúng version trước script hóa. [CLI chính thức](https://docs.n8n.io/hosting/cli-commands/).

Theo dõi health, execution thất bại/Waiting, thời gian, đĩa/log, DB connection và runner. Retention không thay backup. Không cho người không tin cậy quyền edit workflow vì có khả năng truy cập dịch vụ qua credential/tool được cấp. Không cài community node tùy ý, không mount Docker socket và không public database/broker.

## Xử lý lỗi

| Triệu chứng | Nguyên nhân / sửa | Xác minh |
| --- | --- | --- |
| Proxy502 | n8n chưa ready, DNS/network sai | Log và HTTP nội bộ, rồi HTTPS ngoài |
| Webhook URL localhost/http | Public URL/env/proxy chưa đúng | Sửa N8N_WEBHOOK_URL/editor URL, recreate, copy URL UI mới |
| Secure cookie lỗi | HTTPS/forwarded proto sai | Giữ secure cookie, sửa proxy; không tắt ở remote |
| DB permission/schema lỗi | Init không chạy trên volume cũ hoặc grant sai | Kiểm tra role/schema bằng admin, sửa có migration/backup |
| Code không chạy | Runner version/token/mạng/broker sai | Log runner, thử Code đơn giản |
| Credential lỗi sau restore | Key khác hoặc thiếu data tương ứng | Khôi phục cặp DB/key/user folder đúng, thử read-only |
| Đĩa tăng | Execution/binary/log/cache | Retention + rotation, kiểm tra đĩa; không xóa volume DB |

## Đánh giá

Một triển khai có thể vận hành khi có owner, HTTPS đúng, credential giới hạn, backup khôi phục được và runbook cập nhật. Compose một VPS vẫn là một điểm lỗi; queue/worker, HA, secrets tập trung và giám sát nâng cao chỉ thuộc roadmap Level3.
