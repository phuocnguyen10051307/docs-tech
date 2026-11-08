---
title: PostgreSQL, Google Sheets, Gmail và Telegram
version: Mốc 2.46.6 · Native integrations · Level 2
status: guide
---

# PostgreSQL, Google Sheets, Gmail và Telegram

## Tổng quan

Tích hợp gồm hai phần: n8n có thể gọi operation nào và credential được cấp quyền trên tài nguyên nào. Nối node thành công không đồng nghĩa quyền đúng hay tác động an toàn. Mỗi ví dụ bên dưới bắt đầu bằng dữ liệu giả và thao tác đọc/draft trước khi gửi thật.

## Yêu cầu trước khi bắt đầu

Đã hiểu [credential/HTTP](./http-and-apis). **Chưa kiểm thử tích hợp:** chưa đăng nhập tài khoản ngoài, kết nối DB hay gửi tin trong lần biên soạn. Các payload kết quả là dạng mong đợi; ID/field chính xác phải đối chiếu output instance và API tương ứng.

| Dịch vụ | Tài khoản/hạ tầng | Credential cần chuẩn bị |
| --- | --- | --- |
| PostgreSQL | DB riêng có schema thử | Host,port,DB,user,password; TLS CA nếu truy cập từ xa |
| Sheets | Google account, spreadsheet thử; self-hosted thường cần Google Cloud project | Google Sheets OAuth2 hoặc service account nếu operation hỗ trợ |
| Gmail | Mailbox thử có quyền dùng Gmail API | Gmail OAuth2, scope tối thiểu theo operation |
| Telegram | Account Telegram, bot do bạn tạo, chat thử đã start bot | Bot token và chat ID của chính bạn |
| REST API | Theo nhà cung cấp; ví dụ public không cần account | None hoặc credential đúng hợp đồng API |

## Cài đặt

Dùng node built-in `Postgres`, `Google Sheets`, `Gmail`, `Telegram`, `HTTP Request`; không cần plugin của website để thiết kế workflow n8n. Credential lưu trong n8n, khóa mã hóa nằm trong cấu hình/volume instance; sao lưu cả hai. Tạo credential riêng test/production để giảm nhầm lẫn.

## Khởi tạo dự án

Tạo `LAB / Tích hợp dịch vụ`, Manual Trigger → Edit Fields với input:

```json
{ "request_id": "demo-001", "title": "Kiểm tra kết nối", "status": "new" }
```

Thử từng integration độc lập; không nối một lần cả ghi SQL, append Sheets, Gmail Send và Telegram Send. Như vậy bạn biết credential/node nào thất bại và tránh nhân tác động khi retry.

## Cấu hình

### PostgreSQL cho dữ liệu nghiệp vụ

DB nghiệp vụ trong Postgres node **khác** DB nội bộ n8n lưu workflow/credential/execution. Không cho workflow truy vấn bảng nội bộ n8n để làm storage tùy ý. Cấp role chỉ có quyền schema/tables cần dùng; dùng connection string/host qua credential, không body webhook.

1. Chuẩn bị DB `automation`, role `workflow_app`, bảng thử; cấu hình đầy đủ ở [bài2](/project-guides/n8n-webhook-postgres).
2. Tạo **Postgres credential**: host `workflow-db` nếu cùng Compose network; host từ provider nếu remote,port5432, database/user/password đúng. Trong container, `localhost` là n8n, không phải host/DB khác.
3. Remote dùng SSL theo provider, xác minh CA khi yêu cầu; không tắt certificate verification chỉ để kết nối được.
4. Postgres node → Operation **Execute Query**, query `SELECT 1 AS ok;`. Mong đợi item `{ok:1}`.
5. Sau khi quyền đọc đúng, thử query tham số bên dưới trên bảng lab đã tạo.

```sql
INSERT INTO workflow_events (request_id, title)
VALUES ($1, $2)
ON CONFLICT (request_id) DO NOTHING
RETURNING request_id, title;
```

Trong Options → **Query Parameters**, chuyển sang Expression trả array:

```js
{{ [$json.request_id, $json.title] }}
```

Placeholder dành cho **giá trị**, không phải tên bảng/cột tùy caller. Input ví dụ tạo một row; retry cùng khóa có thể trả0 row nên node sau cần đường xử lý trùng rõ, không im lặng rơi mất response. Bài2 có query luôn trả một item. Không ghép title trực tiếp vào SQL.

| Triệu chứng | Xử lý và xác nhận |
| --- | --- |
| Connection refused/DNS | Kiểm tra mạng/host/port; chạy lại `SELECT 1` |
| Password sai | Đối chiếu credential và role trong DB đã khởi tạo, không reset volume |
| Permission denied | Grant tối thiểu trên table/schema/sequence cần dùng, thử INSERT bằng role ứng dụng |
| Item không ra sau insert trùng | RETURNING rỗng theo SQL; xử lý duplicate thành kết quả nghiệp vụ |

Nguồn: [Postgres node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.postgres/) · [credential](https://docs.n8n.io/integrations/builtin/credentials/postgres/).

### Google Sheets

**Khi dùng:** báo cáo nhẹ cho người dùng kiểm tra, danh sách ít thay đổi. Không dùng Sheets làm khóa giao dịch đồng thời hay database có unique constraint đáng tin cậy.

Self-hosted OAuth: tạo Google Cloud project → bật Google Sheets API và Google Drive API nếu thao tác chọn/tìm file cần → cấu hình consent screen/audience, thêm test user nếu app ở Testing → tạo OAuth client Web application → đăng ký **OAuth Redirect URL** từ UI credential n8n → nhập client ID/secret vào Google Sheets credential → Connect/consent bằng tài khoản test. Không tự đoán callback URL. Cloud có thể cung cấp managed OAuth theo node/plan.

Tạo spreadsheet riêng, sheet `events`, header row:

```text
request_id | title | status
```

Google Sheets node: Resource **Sheet Within Document**, chọn document/sheet thật, Operation **Append Row**, map thủ công `request_id`, `title`, `status` từ input. Chạy một item, mở sheet kiểm tra một dòng. Operation trả dữ liệu/metadata tùy phiên bản; sheet thật mới xác nhận append thành công.

Với lần chạy lặp, append lại sẽ trùng. **Append or Update Row** theo `request_id` có ích cho báo cáo nhưng không biến Sheets thành unique transaction store; hai execution đồng thời vẫn cần thiết kế khác nếu không được trùng. Nếu service account được hỗ trợ, share đúng spreadsheet cho email service account, không chia sẻ công khai.

| Triệu chứng | Xử lý và xác nhận |
| --- | --- |
| Redirect URI mismatch | Sao chép URI đúng scheme/path, lưu provider rồi reconnect |
| Không thấy file/403 | Đúng account, file được share, scope/API đã bật; thử Get Rows trên sheet test |
| invalid_grant | Token bị thu hồi/hết hạn hoặc app Testing; reconnect theo chính sách Google |
| Cột map sai sau đổi header | Refresh columns/mapping, thử một row không nhạy cảm |

Nguồn: [Google OAuth single service](https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/) · [Google Sheets](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlesheets/).

### Gmail

**Khi dùng:** thông báo từ mailbox được ủy quyền, quản lý thư/draft. Không dùng làm hệ thống gửi email hàng loạt vượt quota hoặc tự ý đại diện người dùng. Người nhận phải rõ và được phép.

Tạo Google OAuth app tương tự Sheets nhưng bật **Gmail API**, dùng Gmail credential và scope cho operation cần dùng. Mailbox trên Gmail UI không tự cho n8n quyền API. Với scope nhạy cảm, Google có thể yêu cầu consent/verification theo loại ứng dụng và chính sách tổ chức; không dùng service account như cách bỏ qua quyền mailbox.

Thử an toàn: **Gmail → Resource Draft → Operation Create**. Chọn người nhận là chính mailbox test, Subject `LAB n8n - demo-001`, Email Type Text, Message `Nội dung thử, không có dữ liệu khách hàng`. Execute rồi mở Drafts kiểm tra; tạo draft vẫn là thay đổi ở tài khoản thật, chỉ thực hiện khi người dùng chủ động chạy bài.

Sau khi đã rà, thử node **Message → Send** riêng trên mailbox test. Input thường có `to`, `subject`, `text`; output có ID message/thread tùy operation. “API accepted” chưa chứng minh người nhận đọc hoặc delivery thành công. Không map `to` từ AI/webhook tùy ý; dùng allowlist hoặc giá trị cố định.

| Triệu chứng | Xử lý và xác nhận |
| --- | --- |
|403 insufficient permissions | Cấp scope đúng và consent lại; test draft trước send |
| Token bị thu hồi | Reconnect credential, không log refresh token |
| Thư bị gửi lặp | Replay/retry sau timeout; kiểm tra mailbox/message ID trước resend |
| Attachment lỗi | Binary field name/MIME đúng, giới hạn dung lượng; thử file nhỏ không nhạy cảm |

Nguồn: [Gmail node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/) · [Google credentials](https://docs.n8n.io/integrations/builtin/credentials/google/).

### Telegram

Tạo bot bằng **BotFather** trên Telegram, lưu token vào Telegram credential. Mở chat với bot và bấm Start/gửi lời nhắn. Lấy chat ID qua Telegram Trigger nhận tin thử hoặc cách được Bot API hỗ trợ; không chia sẻ ID/token trong repository. Token cấp quyền bot, không phải mật khẩu account cá nhân.

Telegram node → Resource **Message**, Operation **Send Message**: Chat ID cố định của chat test, Text `LAB n8n: demo-001`, Parse Mode để mặc định/không markup nếu text từ nguồn không tin cậy. Execute một lần; output mong đợi có `message_id`, chat và text; đối chiếu tin trong chat.

Webhook Telegram Trigger cần URL HTTPS công khai truy cập được. Một bot thường chỉ có một webhook đăng ký tại một thời điểm; test và production dùng cùng bot có thể thay webhook của nhau. Dùng bot test riêng. Chat ID không được AI tự chọn trong bài Agent.

| Triệu chứng | Xử lý và xác nhận |
| --- | --- |
| Chat not found | Start bot, đúng ID/chat và quyền bot; thử Get Chat |
| Forbidden | User block bot hoặc bot thiếu quyền group; xử lý theo quyền thực, không tự thêm admin rộng |
|429 | Giảm tốc và dùng retry_after của provider; thử ít message |
| Trigger không nhận | HTTPS/URL webhook, bot khác ghi đè webhook; tách bot test/prod |

Nguồn: [Telegram credential](https://docs.n8n.io/integrations/builtin/credentials/telegram/) · [Telegram node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.telegram/) · [Bot API](https://core.telegram.org/bots/api).

### Generic REST API

Dùng Manual Trigger → HTTP Request, GET `https://jsonplaceholder.typicode.com/todos/1`, Authentication None, Timeout10000ms, Response JSON. Input không cần credential; output là object todo. Validate `id` Number, `title` String, `completed` Boolean trước map sang SQL/Sheets. Thử ID không tồn tại để xem node fail/error output, không tự suy mọi status đều200.

API thật cần tài khoản theo provider, auth/scope, pagination/quota/timeout và môi trường test. Toàn bộ cấu hình và cách chẩn đoán401/403/429 nằm ở [chương API](./http-and-apis), tránh nhân bản các rule khác nhau ở từng bài.

## Cấu trúc dự án

Trong runbook của mỗi workflow ghi credential theo **tên logic**, quyền cần có, người quản lý, dữ liệu ra ngoài, thao tác đọc/ghi, cách thu hồi và môi trường đích. Export không bao gồm plaintext credential thông thường nhưng vẫn có thể có token hardcode, pinned data và credential names/IDs; luôn rà trước chia sẻ.

## Lệnh thường dùng

Chu trình xác minh: **test credential → đọc một bản ghi → ghi/draft trên tài nguyên test → kiểm tra hệ đích → thử lỗi quyền → kiểm tra retry**. Không cần công khai đầu ra credential Test hoặc toàn bộ execution để nhờ debug; chỉ cung cấp mã lỗi đã khử bí mật.

## Thực hành tốt

Đặt người nhận và host allowlist, tách auth DB nội bộ khỏi DB nghiệp vụ, dùng SQL parameter và role tối thiểu. Với Sheets/email/chat, API thành công không đồng nghĩa thao tác có tính exactly-once. Credential thực thuộc người/tổ chức; có kế hoạch reconnect/rotate khi account thay đổi.

## Xử lý lỗi

Nếu nhiều node cùng lỗi mạng, kiểm tra egress/proxy/DNS của n8n trước khi thay mọi key. Nếu chỉ một operation403, kiểm tra scope và resource ACL. Nếu chạy manual được nhưng lịch lỗi, kiểm tra bản publish/credential và dữ liệu production khác fixture. Sửa xong phải thử lại đúng operation trên hệ test và đối chiếu dữ liệu đích.

## Đánh giá

Bạn cần biết vì sao credential cấp quyền đọc có thể không tạo được draft, vì sao DB `localhost` sai khi trong container và vì sao append Sheets bị trùng. Thực hành tiếp [webhook + DB](/project-guides/n8n-webhook-postgres) và [AI Agent có người duyệt](/project-guides/n8n-ai-agent).
