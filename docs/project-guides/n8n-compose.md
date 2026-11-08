---
title: Cài n8n local bằng Docker Compose
version: n8n 2.46.6 · SQLite · External task runner · Local
---

# Cài n8n local bằng Docker Compose

::: warning Chưa kiểm thử runtime
Docker daemon chưa chạy trong môi trường biên soạn. Pull image, editor, Code node/runner, HTTP health và persistence chưa được chạy end-to-end. Cấu hình dưới đây dành cho lab local; không mở nguyên cấu hình ra Internet.
:::

**Kiểm tra đã thực hiện:** trích cấu hình từ bài và chạy `docker compose config --quiet` thành công với Compose2.30.3. Chưa pull/run image hoặc kiểm tra editor/runner.

## Mục tiêu dự án

Chạy editor n8n trên máy, tạo workflow đầu tiên và giữ dữ liệu qua stop/start. SQLite phù hợp bắt đầu trên một instance. Thêm external task runner để thực hành JavaScript Code node trong tiến trình/container tách khỏi n8n; đây không phải n8n Assistant hay một dịch vụ LLM.

## Công nghệ sử dụng

[n8n](/technologies/n8n/), [Docker Compose v2](/technologies/docker/), SQLite, named volume và image runner **cùng phiên bản** n8n. Thông tin mốc 2.46.6, Cloud/Community và giới hạn kiểm thử ở [trang tổng quan](/technologies/n8n/).

## Yêu cầu trước khi bắt đầu

Docker Engine/Desktop đang chạy ở chế độ Linux containers; `docker version` cần có Server, `docker compose version` có v2. Cổng5678 trống. Dùng workspace mới ngoài repository handbook, không đưa credential production vào lab. Không cần cài Node hoặc n8n toàn cục trên host.

## Lệnh khởi tạo

Tại thư mục cha thực hành:

```sh
mkdir n8n-local
cd n8n-local
mkdir workflows
mkdir backups
```

Mọi lệnh Compose dưới đây chạy tại `n8n-local`.

## Cấu hình môi trường

Tạo `.env.example`:

```dotenv
N8N_VERSION=2.46.6
GENERIC_TIMEZONE=Asia/Ho_Chi_Minh
N8N_ENCRYPTION_KEY=replace-with-long-random-encryption-key
N8N_RUNNERS_AUTH_TOKEN=replace-with-different-long-random-token
```

Sao chép thành `.env` và thay hai placeholder bằng hai chuỗi ngẫu nhiên khác nhau. Có thể dùng trình quản lý mật khẩu tạo chuỗi dài ngẫu nhiên; lưu khóa mã hóa an toàn cùng kế hoạch backup, không đổi tùy tiện sau khi tạo credential. Không dán giá trị thật vào Git, ảnh chụp hoặc log hỗ trợ.

```bash
# Bash
cp .env.example .env
```

```powershell
# PowerShell
Copy-Item .env.example .env
```

Tạo `.gitignore`:

```text
.env
.env.*
!.env.example
backups/
```

Export workflow có thể chứa pinned data/URL/header nhạy cảm; rà soát cả `workflows/` trước commit. `.env` là cấu hình local không mã hóa, không phải secret manager.

## Cấu trúc thư mục đề xuất

```text
n8n-local/
├── compose.yaml
├── .env.example
├── .env                 # Ngoài Git
├── .gitignore
├── workflows/           # Export thực tế đã rà soát
└── backups/             # Bản backup riêng, không phải chỉ workflow JSON
```

## Các bước thực hiện

### 1. Khai báo editor và runner

Tạo `compose.yaml`:

```yaml
name: n8n-local
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n:${N8N_VERSION:?Cần đặt N8N_VERSION}
    restart: unless-stopped
    ports:
      - "127.0.0.1:5678:5678"
    environment:
      GENERIC_TIMEZONE: ${GENERIC_TIMEZONE:-Asia/Ho_Chi_Minh}
      TZ: ${GENERIC_TIMEZONE:-Asia/Ho_Chi_Minh}
      N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS: "true"
      N8N_SECURE_COOKIE: "false"
      N8N_ENCRYPTION_KEY: ${N8N_ENCRYPTION_KEY:?Cần đặt N8N_ENCRYPTION_KEY}
      N8N_BLOCK_ENV_ACCESS_IN_NODE: "true"
      N8N_RUNNERS_MODE: external
      N8N_RUNNERS_BROKER_LISTEN_ADDRESS: 0.0.0.0
      N8N_RUNNERS_AUTH_TOKEN: ${N8N_RUNNERS_AUTH_TOKEN:?Cần đặt token runner}
      EXECUTIONS_DATA_PRUNE: "true"
      EXECUTIONS_DATA_MAX_AGE: "168"
    volumes:
      - n8n_data:/home/node/.n8n
      - ./workflows:/exports
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:5678/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 30s
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
  runners:
    image: n8nio/runners:${N8N_VERSION:?Cần đặt N8N_VERSION}
    restart: unless-stopped
    environment:
      N8N_RUNNERS_TASK_BROKER_URI: http://n8n:5679
      N8N_RUNNERS_AUTH_TOKEN: ${N8N_RUNNERS_AUTH_TOKEN:?Cần đặt token runner}
    depends_on:
      n8n:
        condition: service_healthy
volumes:
  n8n_data:
```

Cổng5678 chỉ loopback; broker5679 không publish. `N8N_SECURE_COOKIE=false` chỉ dùng HTTP local, không dùng cho remote. `N8N_ENCRYPTION_KEY` phải ổn định; volume vẫn cần dù đặt key tường minh. `EXECUTIONS_DATA_MAX_AGE=168` là retention theo giờ, không đảm bảo mọi Waiting execution bị xóa theo cùng cách; kiểm tra chính sách execution thực tế.

Runner/n8n phải cùng tag. n8n2.x đã bật runner mặc định, không cần thêm biến `N8N_RUNNERS_ENABLED` cũ; external mode tách môi trường Code khỏi main process. Không truyền DB password/key mã hóa cho runners, không mount Docker socket. Production cần thêm hardening runner theo [tài liệu task runners](https://docs.n8n.io/hosting/configuration/task-runners/), kiểm soát quyền editor và network.

### 2. Khởi động

```sh
docker compose config --quiet
docker compose pull
docker compose up -d
docker compose ps
docker compose logs --tail=100 n8n runners
docker compose exec n8n n8n --version
```

Mong đợi version2.46.6, n8n healthy, runner kết nối broker. Mở `http://127.0.0.1:5678`, thiết lập owner với mật khẩu riêng. Không dùng biến Basic Auth cũ để thay quy trình user management.

### 3. Tạo workflow và kiểm tra Code

Tạo `LAB / Workflow đầu tiên`: Manual Trigger → Edit Fields, String `message` = `Xin chào handbook`, chỉ giữ field đặt. Execute, mong đợi một item. Thêm Code, mode **Run Once for All Items**:

```js
return $input.all().map((item, index) => ({
  json: { message: item.json.message, checked: true },
  pairedItem: { item: index }
}));
```

Mong đợi output có `checked:true`. Nếu Code không chạy, đọc log runner và token/version/broker network trước; UI mở được không chứng minh runner hoạt động. Bài dùng JavaScript, không yêu cầu Python/native module.

### 4. Kiểm tra lưu trữ

Lưu workflow, rồi:

```sh
docker compose stop
docker compose start
```

Mở editor, workflow/tài khoản phải còn. `docker compose down` cũng giữ named volume theo mặc định. Đổi project name có thể tạo volume khác; không kết luận mất dữ liệu trước khi kiểm tra `docker volume ls`.

## Chạy và kiểm tra

Bash dùng `curl`, PowerShell dùng `curl.exe`:

```sh
curl -i http://127.0.0.1:5678/healthz
docker compose ps
docker compose exec n8n n8n --version
```

Health200 không xác nhận credential ngoài hay workflow đúng; phải chạy bài Manual/Edit Fields/Code và stop/start. Sau đó làm [bài lịch](/project-guides/n8n-scheduled-api). Manual-only workflow không cần publish để chạy thủ công.

### Export và import thực tế

Editor: menu workflow → Download/Export JSON theo UI → rà nội dung → lưu trong `workflows/`. Muốn CLI export toàn bộ workflow lab:

```sh
docker compose exec n8n n8n export:workflow --all --output=/exports/workflows.json
```

Đây không phải backup credential/instance. Import qua editor **Import from File** trong workflow mới ở môi trường test, map credential lại, kiểm tra trigger và chạy thủ công trước publish. CLI import có thể giữ IDs và ghi đè workflow cũ; không dùng bừa trên production. Xem [CLI](https://docs.n8n.io/hosting/cli-commands/).

## Lỗi khởi tạo thường gặp

| Vấn đề | Kiểm tra/sửa | Xác nhận |
| --- | --- | --- |
| Không kết nối Engine | Khởi động Docker/context đúng | `docker version` có Server |
| Cổng5678 bận | Đổi host port, ví dụ5679:5678 nhưng không publish broker | Gọi URL cổng mới; phân biệt host port với broker container |
| Runner không kết nối | Token cùng giá trị, cùng version, URI `http://n8n:5679` | Log runner và chạy Code |
| Cảnh báo cookie | HTTP local/cookie không khớp hoặc vào bằng IP remote | Dùng loopback như bài; remote dùng HTTPS |
| Credential không giải mã | Key khác với lúc tạo hoặc volume nhầm | Khôi phục key/volume tương ứng, test credential đọc |
| Source export không ghi được | Quyền bind mount `workflows` trên host | Phân quyền cho UID container đúng, không chmod777 toàn cây |

## Kết quả mong đợi

- [ ] Owner đăng nhập được, version đã ghi rõ.
- [ ] Manual/Edit Fields/Code trả dữ liệu đúng, runner đã kiểm tra.
- [ ] Workflow/tài khoản còn sau stop/start.
- [ ] Có export thực tế đã rà nhạy cảm và hiểu đây chưa phải full backup.

Dừng bằng `docker compose stop`, hoặc `docker compose down` để xóa container/network và giữ volume. **Không chạy `down -v`: lệnh này xóa volume chứa workflow, user, credential và execution.** Backup SQLite cần dừng writer và sao chép nhất quán toàn bộ dữ liệu cùng khóa; hướng dẫn quản lý backup/VPS/PostgreSQL ở [self-hosting](/technologies/n8n/self-hosting).
