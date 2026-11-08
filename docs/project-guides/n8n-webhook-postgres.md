---
title: n8n bài 2 — webhook, REST API và PostgreSQL
version: Level 2 · n8n 2.46.6 · PostgreSQL 17 · Idempotency
---

# n8n bài 2 — webhook, REST API và PostgreSQL

::: warning Chưa kiểm thử tích hợp
Chưa chạy n8n/PostgreSQL trong môi trường biên soạn. SQL, credential, webhook và các ca đồng thời bên dưới chưa được thực thi end-to-end. Kiểm tra Compose/JavaScript tách rời không chứng minh kết nối thực tế.
:::

**Kiểm tra đã thực hiện:** Compose2.30.3 chấp nhận mô hình merge local + DB nghiệp vụ; JavaScript validation/normalization vượt qua fixture hợp lệ, sai kiểu, ngoài phạm vi và response không khớp bằng context giả lập. SQL, credential và HTTP contract vẫn chưa kiểm thử trên n8n/PostgreSQL.

## Mục tiêu dự án

Nhận POST với `request_id` và `todo_id`, validate, gọi JSONPlaceholder, chuẩn hóa, ghi PostgreSQL và trả JSON có cấu trúc. Lặp cùng key/cùng todo không tạo row thứ hai; cùng key khác todo trả409. API/DB lỗi trả503, không lộ chi tiết credential.

## Công nghệ sử dụng

Webhook, Code, IF, HTTP Request, Postgres, Edit Fields và Respond to Webhook. PostgreSQL nghiệp vụ tách khỏi SQLite/DB nội bộ n8n. [JSONPlaceholder](https://jsonplaceholder.typicode.com/) là nguồn dữ liệu giả, không yêu cầu API key.

```text
Webhook POST → Kiểm tra input → Hợp lệ?
                                ├ false → Response400 ───────────────┐
                                └ true → Lấy todo → Chuẩn hóa       │
                                            │lỗi        │           │
                                            └→503      Lưu DB       │
                                                        ├ lỗi→503  │
                                                        └ status?  │
                                                          ├ok→200  │
                                                          └khác→409│
                                                         Respond ←─┘
```

## Yêu cầu trước khi bắt đầu

Đã có [n8n-local](./n8n-compose) và external runner, hiểu [HTTP](../technologies/n8n/http-and-apis)/[idempotency](../technologies/n8n/workflow-design). Không dùng DB thật hay credential admin cho workflow. Chọn một request cho mỗi webhook execution để tham chiếu `.first()` ở bài có ý nghĩa rõ.

## Lệnh khởi tạo

Tại **workspace n8n-local** đang có `compose.yaml`, tạo `db-business/` và file Compose bổ sung. Không sửa backend hay dependency website handbook:

```sh
mkdir db-business
```

## Cấu hình môi trường

Thêm placeholder vào `.env.example`, copy giá trị riêng vào `.env` và thay trước chạy:

```dotenv
WORKFLOW_DB_ADMIN_PASSWORD=replace-with-local-admin-password
WORKFLOW_DB_PASSWORD=replace-with-different-local-app-password
```

Tạo `db-business/init.sql`:

```sql
\getenv app_password WORKFLOW_DB_PASSWORD
CREATE ROLE workflow_app LOGIN PASSWORD :'app_password'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
CREATE TABLE public.automation_results (
  request_id text PRIMARY KEY CHECK (request_id ~ '^[A-Za-z0-9_-]{1,64}$'),
  todo_id integer NOT NULL CHECK (todo_id BETWEEN 1 AND 200),
  title text NOT NULL,
  completed boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT CONNECT ON DATABASE automation TO workflow_app;
GRANT USAGE ON SCHEMA public TO workflow_app;
GRANT SELECT, INSERT, UPDATE ON public.automation_results TO workflow_app;
```

CREATE ROLE/password từ env áp dụng khi DB trống; không tự thay credential trên volume đã khởi tạo. UPDATE được cấp vì query idempotent dùng ON CONFLICT DO UPDATE, không cấp DROP/CREATE. Với nghiệp vụ lớn hơn hãy tách quyền theo thao tác.

Tạo `compose.business.yaml`:

```yaml
services:
  n8n:
    networks: [default, workflow_net]
  workflow-db:
    image: postgres:17-bookworm
    restart: unless-stopped
    environment:
      POSTGRES_USER: workflow_admin
      POSTGRES_DB: automation
      POSTGRES_PASSWORD: ${WORKFLOW_DB_ADMIN_PASSWORD:?Cần mật khẩu admin DB}
      WORKFLOW_DB_PASSWORD: ${WORKFLOW_DB_PASSWORD:?Cần mật khẩu ứng dụng DB}
    volumes:
      - workflow_pg_data:/var/lib/postgresql/data
      - ./db-business/init.sql:/docker-entrypoint-initdb.d/001-init.sql:ro
    networks: [workflow_net]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -h 127.0.0.1 -U workflow_admin -d automation"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 20s
networks:
  default:
  workflow_net:
    internal: true
volumes:
  workflow_pg_data:
```

Từ đây mọi lệnh cho stack bài2 dùng cả hai `-f`; đường dẫn tương đối lấy theo file nền `compose.yaml`. DB không publish5432, n8n có thêm mạng nội bộ để gọi `workflow-db:5432`.

```sh
docker compose -f compose.yaml -f compose.business.yaml config --quiet
docker compose -f compose.yaml -f compose.business.yaml up -d
docker compose -f compose.yaml -f compose.business.yaml ps
```

## Cấu trúc thư mục đề xuất

```text
n8n-local/
├── compose.yaml                 # Editor và runner từ bài cài đặt
├── compose.business.yaml
├── db-business/init.sql
├── .env.example
├── .env                         # Ngoài Git
├── workflows/                   # Export từ instance thật
└── fixtures/                    # Payload thử
```

## Các bước thực hiện

### 1. Credential và webhook đầu vào

Tạo Postgres credential `LAB automation`: Host `workflow-db`, Port5432, Database `automation`, User `workflow_app`, Password ứng dụng trong `.env`. Kết nối local network này không có TLS; remote database dùng SSL theo provider. Thử Postgres Execute Query `SELECT 1 AS ok;` trước dựng luồng.

Tạo Header Auth credential riêng cho webhook: Name `X-Lab-Key`, Value chuỗi ngẫu nhiên local. Không dùng mật khẩu DB làm webhook key. Webhook node Method POST, Path `lab-todos`, Authentication Header Auth, chọn credential, Respond **Using Respond to Webhook node**. Nội dung request:

```json
{ "request_id": "demo-001", "todo_id": 1 }
```

### 2. Kiểm tra input

Code **Kiểm tra input**, Run Once for All Items:

```js
const body = $input.first().json.body;
const object = body && typeof body === 'object' && !Array.isArray(body);
const requestId = object ? body.request_id : null;
const todoId = object ? body.todo_id : null;
const valid = typeof requestId === 'string' &&
  /^[A-Za-z0-9_-]{1,64}$/.test(requestId) &&
  Number.isInteger(todoId) && todoId >= 1 && todoId <= 200;
return [{ json: {
  valid,
  request_id: typeof requestId === 'string' ? requestId.slice(0, 64) : null,
  todo_id: Number.isInteger(todoId) ? todoId : null,
  error: valid ? null : 'request_id hoặc todo_id không hợp lệ'
} }];
```

IF **Hợp lệ?**: Boolean expression dưới, `is true`:

```js
{{ $json.valid }}
```

False → Edit Fields `Response400`: Number `http_status`400, Object `response_body`:

```js
{{ { ok: false, error: 'invalid_input', request_id: $json.request_id } }}
```

Không coercion `"1"` thành Number tự động vì contract yêu cầu số JSON. Header auth thất bại bị Webhook chặn trước luồng, không qua response400.

### 3. Gọi API và chuẩn hóa

Nhánh true → HTTP Request **Lấy todo**, GET, Authentication None, Response JSON, Timeout10000ms, URL:

```js
{{ 'https://jsonplaceholder.typicode.com/todos/' + $json.todo_id }}
```

Host cố định và ID đã validate, không có URL tùy caller. On Error **Continue (using error output)**, output lỗi → Edit Fields `Response API503` đặt http_status503 và response_body `{ok:false,error:'upstream_unavailable'}` bằng Object expression; không trả raw error.

Output thành công → Code **Chuẩn hóa**, Run Once for All Items:

```js
const input = $('Kiểm tra input').first().json;
const todo = $input.first().json;
if (todo.id !== input.todo_id || typeof todo.title !== 'string' ||
    !todo.title.trim() || todo.title.length > 1000 || typeof todo.completed !== 'boolean') {
  throw new Error('Response API không khớp hợp đồng');
}
return [{ json: {
  request_id: input.request_id,
  todo_id: todo.id,
  title: todo.title.trim(),
  completed: todo.completed
} }];
```

Code cũng đặt On Error dùng error output và nối sang API503, nếu sai schema không được tiếp tục SQL. `.first()` ở đây an toàn vì mỗi execution chỉ nhận một request; không dùng mẫu này không thay đổi cho batch nhiều khách.

### 4. Ghi atomic và nhận biết conflict

Postgres **Lưu DB**, credential `LAB automation`, Operation Execute Query:

```sql
WITH saved AS (
  INSERT INTO public.automation_results (request_id, todo_id, title, completed)
  VALUES ($1, $2, $3, $4)
  ON CONFLICT (request_id) DO UPDATE
    SET request_id = EXCLUDED.request_id
    WHERE automation_results.todo_id = EXCLUDED.todo_id
  RETURNING request_id, todo_id, title, completed, created_at
)
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM saved) THEN 'ok' ELSE 'conflict' END AS status,
  (SELECT row_to_json(saved) FROM saved) AS result;
```

Options → Query Parameters là Expression:

```js
{{ [$json.request_id, $json.todo_id, $json.title, $json.completed] }}
```

Unique primary key kiểm soát cả hai execution đồng thời. Cùng request/todo trả lại row cũ; không thay title/completed của kết quả đã ghi. Khác todo với cùng key không UPDATE và trả status conflict. SELECT ngoài luôn trả một row ngay cả conflict, tránh0 item làm mất HTTP response. Đây là idempotency theo **request_id + todo_id**, không phải chống trùng mọi payload của hệ thống thật. API đọc bên ngoài vẫn bị gọi lại khi duplicate; có thể thêm bước tra cứu để tối ưu nhưng constraint vẫn cần để chống race.

Postgres On Error dùng error output → Edit Fields `Response DB503`: http_status503, Object response_body `{ok:false,error:'storage_unavailable'}`. Không bật retry mù; client có thể gọi lại cùng key nếu chưa rõ outcome và contract cho phép.

### 5. Trả response thống nhất

Output SQL thành công → IF **Đã lưu?**, String `$json.status` equals `ok`:

- True → Edit Fields `Response200`: http_status200, response_body Object theo expression dưới.
- False → Edit Fields `Response409`: http_status409, response_body `{ok:false,error:'idempotency_conflict'}`.

```js
{{ { ok: true, data: $json.result } }}
```

Tất cả node Response400/API503/DB503/200/409 → một **Respond to Webhook**: Respond With JSON, Response Body và Response Code lần lượt:

```js
{{ $json.response_body }}
{{ $json.http_status }}
```

Các nhánh loại trừ nhau nên mỗi request chỉ có một response. Mọi Object expression phải trả object, không phải chuỗi JSON. Cấu hình Error Workflow cho lỗi bất ngờ ngoài contract theo [chương thiết kế](../technologies/n8n/workflow-design); nhánh503 đã xử lý không tự kích Error Trigger nếu execution kết thúc success.

### 6. Export/import

Không có JSON export runtime đã xác nhận để đính kèm. Dựng đủ node và wiring ở trên, kiểm tra các ca dưới, export từ menu editor. Import vào workflow **mới**, giữ unpublished, map Postgres/Header Auth credential và kiểm tra node versions/path webhook. Không import CLI với IDs cũ lên production vì có thể ghi đè. JSON ở bài là payload/SQL/config, không phải export giả.

## Chạy và kiểm tra

Bật Listen for test event, lấy URL UI. Thay placeholder key bằng giá trị local, không dán key thật vào terminal chia sẻ. Bash:

```bash
curl -i -X POST http://127.0.0.1:5678/webhook-test/lab-todos -H 'X-Lab-Key: replace-with-local-webhook-key' -H 'Content-Type: application/json' -d '{"request_id":"demo-001","todo_id":1}'
```

PowerShell:

```powershell
$labHeaders = @{ 'X-Lab-Key' = 'replace-with-local-webhook-key' }
Invoke-RestMethod http://127.0.0.1:5678/webhook-test/lab-todos -Method Post -Headers $labHeaders -ContentType 'application/json' -Body '{"request_id":"demo-001","todo_id":1}'
```

Mong đợi200 `{ok:true,data:{request_id,todo_id,title,completed,created_at}}`. Không hardcode title/created_at mẫu làm bằng chứng test đã chạy.

| Ca thử | Kết quả cần xác nhận |
| --- | --- |
| Key thiếu/sai | Webhook từ chối auth, DB không thêm row |
| todo_id là chuỗi/ngoài1..200 hoặc request_id sai regex |400, không gọi API/SQL |
| Request hợp lệ |200 và DB có row tương ứng |
| Gửi lại cùng key+todo |200, vẫn một row, trả dữ liệu đã lưu |
| Cùng key, todo khác |409, row cũ không đổi |
| Hai request đồng thời cùng key/todo | Không tạo hai row; kết quả HTTP đúng contract |
| API host test `.invalid` |503 upstream, không ghi DB |
| DB dừng |503 storage, sau start gọi lại cùng key có thể tiếp tục |
| API sai schema bằng fixture |503, không lưu dữ liệu sai |

Xác minh DB từ workspace:

```sh
docker compose -f compose.yaml -f compose.business.yaml exec workflow-db psql -U workflow_admin -d automation -c "SELECT request_id, todo_id, title FROM public.automation_results ORDER BY created_at;"
```

Mô phỏng DB chỉ trên lab: `docker compose -f compose.yaml -f compose.business.yaml stop workflow-db`, sau thử dùng `start workflow-db`, chờ healthy rồi thử lại. Với production webhook, publish rồi dùng URL production UI hiển thị, không dùng test listener.

## Lỗi khởi tạo thường gặp

| Lỗi | Cách sửa và xác nhận |
| --- | --- |
| Postgres credential localhost không được | Đổi host `workflow-db`, đúng network; thử SELECT1 |
| Query parameters thành chuỗi | Chuyển Expression trả array đúng thứ tự4 giá trị |
| SQL không có quyền UPDATE | Role cần UPDATE cho ON CONFLICT, grant tối thiểu trên table |
| HTTP treo không nhận JSON | Nhánh không tới Respond hoặc node trả0 item; xem từng output count |
|409 không xuất hiện | Sai rule IF/status hoặc dùng query SELECT/INSERT riêng không ràng buộc key |
| Chỉnh `.env` nhưng DB login sai | Role giữ password cũ trong volume; đổi bằng quản trị an toàn, không down-v |

## Kết quả mong đợi

- [ ] Auth/validation xảy ra trước gọi API/ghi DB.
- [ ] HTTP contract200/400/409/503 được kiểm tra.
- [ ] Role workflow không có quyền quản trị, DB không public.
- [ ] Request lặp/đồng thời không tạo row thứ hai.
- [ ] Lỗi có thể phục hồi mà không reset database.

**Bài tập thêm:** đọc row cũ trước API để giảm quota, lưu audit cho nhánh503, timeout toàn workflow và correlation ID, migration schema có version. Không tuyên bố exactly-once cho email/Telegram nếu thêm sau SQL.

Dừng workflow bằng Unpublish. Nếu dừng stack, dùng hai file Compose với `stop`/`down` và **không `-v`**; volume giữ cả dữ liệu instance và DB lab. Backup DB/key theo [self-hosting](../technologies/n8n/self-hosting) trước thao tác xóa. Tiếp theo: [AI Agent có phê duyệt](./n8n-ai-agent).
