---
title: n8n Level 1 — editor, node, trigger và execution
version: Mốc 2.46.6 · Level 1
status: guide
---

# n8n Level 1 — editor, node, trigger và execution

## Tổng quan

**Workflow** là đồ thị các bước; **node** nhận dữ liệu và sinh dữ liệu hoặc hành động; **trigger** bắt đầu một lần chạy; **execution** là một lần thực thi với trạng thái và dữ liệu riêng. Cùng một workflow có thể chạy nhiều execution đồng thời. Node xanh không có nghĩa toàn bộ nghiệp vụ đúng: có thể bạn đang dùng fixture cũ hoặc gửi nhầm người nhận.

```text
Trigger → đọc dữ liệu → chuẩn hóa → điều kiện → hành động → ghi kết quả
                 một execution mang các item qua các bước
```

Một workflow phù hợp khi luồng có thể quan sát và tác vụ I/O rõ ràng. Với tính toán CPU nặng, giao dịch dài hoặc yêu cầu latency rất thấp, gọi dịch vụ chuyên dụng thay vì nhồi toàn bộ vào Code node. Xem [khái niệm workflow](https://docs.n8n.io/workflows/).

## Yêu cầu trước khi bắt đầu

Có editor từ [bài Compose](/project-guides/n8n-compose) hoặc Cloud. Dùng dữ liệu giả; chưa nối dịch vụ gửi tin thật. **Chưa kiểm thử:** hướng dẫn UI chưa chạy trên instance trong lần biên soạn. Mốc phiên bản và giới hạn xác minh tại [trang n8n](./).

## Cài đặt

Không cần extension editor hay package npm cho từng node built-in. Trong editor, nút thêm node/tìm kiếm dùng để tìm theo tên English như `Edit Fields`, `Schedule Trigger`. Nếu thiếu node, kiểm tra phiên bản và danh sách node bị operator vô hiệu hóa; không cài community node lạ để thay một node built-in.

## Khởi tạo dự án

### Nhận biết giao diện

| Vùng | Dùng để làm gì | Thói quen kiểm tra |
| --- | --- | --- |
| Canvas | Nối node qua cổng input/output | Theo dõi nhánh true/false, không chỉ vị trí hình học |
| Parameters | Thao tác, field mapping, expression | Kiểm tra Fixed/Expression và kiểu String/Number/Boolean |
| Input / Output | Dữ liệu của node được chọn | Đọc số item, JSON, Table và Binary nếu có |
| Node Settings | Retry, On Error và hành vi node | Biết lỗi đang dừng hay chuyển sang error output |
| Executions | Các lần chạy và điểm lỗi | Chọn đúng execution/time, tránh nhầm dữ liệu lần trước |
| Credentials | Kết nối bí mật tới dịch vụ | Dùng credential test, không hardcode token trên canvas |

Tên tab/nút có thể thay theo phiên bản. Chạy cả workflow để kiểm tra wiring; chạy một node có thể dùng dữ liệu upstream đã có. Output cũ không chứng minh lần thử mới đã qua node đó.

### Workflow đầu tiên với điều kiện

Tạo `LAB / Kiểm tra đơn hàng`:

1. **Manual Trigger**: chỉ chạy khi bấm Execute, phù hợp phát triển.
2. **Edit Fields (Set)**, Manual Mapping: Number `amount` = `120000`, String `customer` = `Khách thử`; bỏ các field khác.
3. **IF**: Number, giá trị trái lấy bằng expression bên dưới, phép `is greater than or equal to`, giá trị phải `100000`.
4. Cổng true → **Edit Fields** tên `Đơn lớn`, String `result` = `Cần kiểm tra`.
5. Cổng false → **Edit Fields** tên `Đơn nhỏ`, String `result` = `Xử lý thường`.

```js
{{ $json.amount }}
```

Execute, kiểm tra IF nhận 1 item và chỉ một nhánh có item. Đổi amount thành 50000 rồi chạy lại; nhánh false phải nhận item. Kiểm tra type là Number; chuỗi `"120000"` không phải số JSON dù giao diện nhìn giống nhau. Nếu không có input item thì node downstream có thể không chạy.

## Cấu hình

### Trigger thủ công, lịch và webhook

| Trigger | Cơ chế / khi dùng | Khi không phù hợp |
| --- | --- | --- |
| Manual Trigger | Bắt đầu theo thao tác editor; kiểm tra có kiểm soát | Không tự chạy theo lịch production |
| Schedule Trigger | Scheduler tạo execution theo lịch/timezone | Không nhận sự kiện tức thì; có thể xử lý trùng nếu nguồn không checkpoint |
| Webhook | HTTP request gọi URL đã đăng ký | Cần caller có mạng, auth và chính sách timeout |
| Trigger của dịch vụ | Polling hoặc webhook theo integration | Không mặc định tức thì; kiểm tra cơ chế/node cụ thể |

Với Schedule Trigger, chọn Trigger Interval **Days**, mỗi 1 ngày, hour `9`, minute `0`. Đặt workflow Settings timezone `Asia/Ho_Chi_Minh`; nếu workflow không đặt thì xem timezone instance. Publish rồi theo dõi một lần chạy đúng giờ. Để học nhanh có thể dùng Minutes, mỗi 5 phút, sau thử **Unpublish** để dừng phát sinh execution. Không dùng lịch một giây với API công khai.

Cron chỉ nên dùng khi lịch chọn sẵn không đủ; kiểm tra cú pháp và preview của node cài đặt, đừng giả định mọi cron đều có cùng số trường. Lịch không phải hàng đợi sự kiện đã mất trong thời gian server tắt. Nguồn: [Schedule Trigger](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/).

### Webhook đầu tiên

Tạo workflow mới: **Webhook → Edit Fields → Respond to Webhook**.

- Webhook: Method POST, Path `lab-hello`, Respond **Using Respond to Webhook node**.
- Trong môi trường loopback chỉ chứa dữ liệu giả có thể thử Authentication None; mọi endpoint có tác động thật cần auth. Xem [bài webhook có Header Auth](/project-guides/n8n-webhook-postgres).
- Edit Fields: String `message`, expression dưới đây; không giữ toàn bộ headers/body.
- Respond to Webhook: Respond With JSON, body là object của item hiện tại, response code 200.

```js
{{ 'Xin chào ' + ($json.body.name ?? 'bạn') }}
```

Bấm **Listen for test event**, sao chép **đúng Test URL** từ UI. Bash:

```bash
curl -i -X POST http://127.0.0.1:5678/webhook-test/lab-hello -H 'Content-Type: application/json' -d '{"name":"An"}'
```

PowerShell:

```powershell
Invoke-RestMethod http://127.0.0.1:5678/webhook-test/lab-hello -Method Post -ContentType 'application/json' -Body '{"name":"An"}'
```

Mong đợi object có `message: "Xin chào An"`. Test listener có thời hạn và cần bật lại khi hết phiên. Production URL có đường `/webhook/` thay `/webhook-test/` trong cấu hình mặc định, nhưng dùng URL UI hiển thị nếu operator đổi endpoint/base. Publish workflow rồi mới gọi production; bỏ publish sẽ ngừng nhận trigger production.

Respond to Webhook phản hồi một lần, thông thường từ item đầu; nếu cần trả nhiều bản ghi, gom thành array trong một item trước. Mọi nhánh có thể xảy ra phải tới một response phù hợp. Xem [Webhook](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/) và [Respond to Webhook](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.respondtowebhook/).

### Các node nền tảng và cách chọn

| Node | Vai trò, ví dụ | Điểm dễ sai |
| --- | --- | --- |
| Edit Fields (Set) | Chọn/đặt field, chuẩn hóa `customer_id` | Giữ field cũ có thể mang cả dữ liệu nhạy cảm sang node gửi |
| IF | Tách hai nhánh theo điều kiện | Phân biệt Boolean `false` và String `"false"` |
| Switch | Route nhiều loại, ví dụ `event_type` | Cấu hình fallback cho loại lạ và biết có cho match nhiều output không |
| Filter | Chỉ giữ item hợp lệ | Các item bị loại không thành lỗi; cần log/reason nếu phải audit |
| Merge | Kết hợp nhiều input theo quy tắc | Append khác join; không tự ghép đúng khách hàng theo vị trí |
| Split Out | Biến array bên trong item thành nhiều item | Sau tách, số request downstream có thể tăng mạnh |
| Aggregate | Gom nhiều item thành array/object | Có thể giữ quá nhiều dữ liệu trong RAM |
| Limit | Giới hạn số item trong bước thử | Không thay pagination/checkpoint production |
| Wait | Tạm dừng rồi tiếp tục theo điều kiện | Không thay cơ chế timeout/idempotency |
| Stop And Error | Chủ động thất bại với nguyên nhân rõ | Không dùng thay nhánh trả HTTP 400 mong đợi |

Ví dụ Switch: field `event_type`, ba rule equals `created`, `updated`, `deleted`; bật output fallback để chuyển `unknown` sang kiểm tra. Không nối fallback vào nhánh ghi/xóa mặc định. Merge và loop có ví dụ ở [xử lý dữ liệu](./data-and-expressions).

### Credential và phân biệt auth

Tài khoản đăng nhập **editor** khác credential cho **API đích**, khác auth của **webhook đầu vào**. Tạo credential từ node hoặc Credentials, chọn đúng loại; nhập giá trị bí mật tại đó, dùng Test connection nếu có. Kiểm tra bằng thao tác đọc ít dữ liệu trước khi thử ghi/gửi.

API key/header, Basic Auth và OAuth có vòng đời khác nhau; Basic dùng base64 không phải mã hóa đường truyền, cần HTTPS. Scope OAuth quyết định app được làm gì sau khi user consent. Không gửi credential vào Code node để tự gọi mạng nếu có HTTP Request/native node phù hợp. Chi tiết ở [HTTP](./http-and-apis) và [tích hợp](./integrations).

### Lưu draft và publish theo phiên bản

Trên UI hiện hành, autosave lưu bản đang chỉnh; **Publish** chọn bản dùng cho trigger production. Sửa draft không đảm bảo production chạy code mới cho đến khi publish thành công. Kiểm tra trạng thái publish, execution thật và URL; đừng chỉ thấy node xanh ở editor.

Instance cũ có thể hiển thị **Active/Inactive** và Save riêng. Đọc release notes đúng phiên bản, không tìm một nút theo ảnh cũ rồi suy ra tính năng bị mất. **Unpublish/Deactivate** là cách dừng trigger; execution đang chạy hoặc đã Wait có thể cần quản lý riêng. Nguồn: [Save and publish](https://docs.n8n.io/workflows/publish/).

## Cấu trúc dự án

Đặt tên workflow theo `Môi trường / Nghiệp vụ / Trigger`, ví dụ `LAB / Báo cáo việc cần làm / Lịch`. Dùng Sticky Note ghi input, output, timezone, credential cần có và cách dừng. Node đặt tên theo hành động `Lấy todo`, `Kiểm tra số tiền`, tránh hàng loạt `HTTP Request1`.

## Lệnh thường dùng

Không phải mọi thao tác n8n đều là CLI. Chu trình làm việc là **Execute → chọn node → Input/Output → sửa → Execute lại → kiểm tra execution → Publish nếu cần**. Pin dữ liệu chỉ để phát triển; bỏ pin khi kiểm tra end-to-end với nguồn thật. Pinned data không được dùng như cơ chế cache production.

## Thực hành tốt

Giữ mỗi workflow có mục tiêu rõ; kiểm tra trường thiếu, kiểu và nhánh rỗng. Tách thao tác có tác động phụ để biết khi nào sẽ gửi/ghi. Với item nhiều, thử ít item trước. Trước publish, kiểm tra tên môi trường, lịch, URL và credential không phải tài khoản cá nhân ngoài ý muốn.

## Xử lý lỗi

| Triệu chứng | Nguyên nhân và cách sửa | Xác nhận |
| --- | --- | --- |
| IF đi nhánh sai | Sai type hoặc đang dùng input cũ | Xem JSON/type, bỏ pin rồi chạy cả workflow |
| Node sau không chạy | Nhánh trước có 0 item | Kiểm tra count từng cổng, thêm nhánh rỗng có chủ đích |
| Lịch không chạy | Chưa publish, sai timezone hoặc server tắt | Publish, kiểm tra timezone và execution theo giờ |
| Test webhook 404 | Không listen hoặc sai URL/method | Bật listener, copy URL UI, gửi lại POST |
| Production webhook 404 | Chưa publish hoặc proxy/base sai | Kiểm tra trạng thái, URL và proxy; gọi lại |
| Credential Test thành công nhưng ghi lỗi | Token có scope đọc nhưng thiếu ghi | Cấp đúng scope tối thiểu, reconnect và thử trên dữ liệu test |

## Đánh giá

Hoàn thành khi tự tạo được hai nhánh IF và webhook phản hồi JSON, hiểu một execution mang bao nhiêu item và biết dừng lịch. Tiếp theo: [JSON, mapping và Code](./data-and-expressions), [bài thực hành lịch](/project-guides/n8n-scheduled-api).
