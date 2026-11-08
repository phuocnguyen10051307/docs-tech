---
title: n8n bài 1 — lấy API theo lịch và kiểm tra kết quả
version: Level 1 · n8n 2.46.6 · Không cần credential ngoài
---

# n8n bài 1 — lấy API theo lịch và kiểm tra kết quả

::: warning Chưa kiểm thử trên n8n
Chưa có instance chạy được trong môi trường biên soạn. Lịch, node wiring và execution phải được kiểm tra theo các bước dưới đây. Dữ liệu mẫu/JavaScript không phải workflow export đã kiểm chứng.
:::

**Kiểm tra đã thực hiện:** GET API trực tiếp từ host trả200 với `id`, `title`, `completed` đúng kiểu; logic Code được chạy với fixture hoàn tất/chưa hoàn tất/sai kiểu bằng context giả lập. Chưa chạy trigger, HTTP Request node hoặc lịch n8n.

## Mục tiêu dự án

Mỗi ngày9:00 theo giờ Việt Nam, lấy một todo từ API công khai, chuẩn hóa dữ liệu, kiểm tra việc chưa hoàn tất và tạo kết quả có thể kiểm tra trong execution. Không gửi email/tin nhắn nên không cần credential ngoài và không tạo thông báo thật khi thử lại.

## Công nghệ sử dụng

n8n Schedule Trigger, Manual Trigger, HTTP Request, Code JavaScript, IF, Edit Fields; [JSONPlaceholder](https://jsonplaceholder.typicode.com/) là API dữ liệu giả. Code chạy bằng runner ở [bài cài local](./n8n-compose).

## Yêu cầu trước khi bắt đầu

Có n8n2.46.6 hoặc version đã đối chiếu, editor/runner hoạt động, internet egress và [kiến thức item](../technologies/n8n/data-and-expressions). Dùng timezone `Asia/Ho_Chi_Minh`. API demo không cần account/token và có thể gián đoạn; không coi là SLA production.

## Lệnh khởi tạo

Không cài package vào website. Tại editor tạo workflow `LAB / Todo theo lịch` và nối:

```text
Manual Trigger ──┐
                 ├→ Lấy todo → Chuẩn hóa todo → Chưa hoàn tất?
Schedule Trigger ┘                               ├ true → Kết quả cần làm
                                                └ false → Kết quả đã xong
```

Hai trigger dùng để phát triển và tự động; một execution bắt đầu từ một trigger, không cần Merge giữa chúng. Required nodes: Manual Trigger, Schedule Trigger, HTTP Request, Code, IF, hai Edit Fields.

## Cấu hình môi trường

Không credential ngoài; n8n cần có timezone đúng. Workflow Settings → Timezone `Asia/Ho_Chi_Minh`; để thử lịch nhanh dùng5 phút rồi đổi về9:00 sau nghiệm thu. Settings lưu successful production executions trong thời gian làm lab để xem kết quả; production điều chỉnh retention theo dữ liệu.

## Cấu trúc thư mục đề xuất

```text
n8n-labs/
├── workflows/todo-scheduled.json  # Export từ instance sau khi dựng và thử
├── fixtures/todo.json            # JSON mẫu bên dưới, không phải workflow
└── runbook.md                    # Lịch, timezone, kết quả và cách dừng
```

## Các bước thực hiện

### 1. Trigger và API

Schedule Trigger: Interval **Days**, Days Between Triggers1, hour9, minute0. Manual Trigger để Execute trong editor mà không chờ giờ.

HTTP Request tên **Lấy todo**:

| Trường | Giá trị |
| --- | --- |
| Method | GET |
| URL | `https://jsonplaceholder.typicode.com/todos/1` |
| Authentication | None |
| Response Format | JSON |
| Timeout |10000ms |
| Settings Retry On Fail | Tắt ở lần học đầu để thấy lỗi rõ |
| Settings On Error | Stop Workflow |

Input từ trigger không cần field; output mong đợi là một object có `userId`, `id`, `title`, `completed`. Không bật full response trong bài này; nếu bật, path dữ liệu sẽ ở body thay vì trực tiếp `$json`.

### 2. Chuẩn hóa và xác thực

Code tên **Chuẩn hóa todo**, mode **Run Once for All Items**:

```js
return $input.all().map((item, index) => {
  const todo = item.json;
  if (!Number.isInteger(todo.id) || typeof todo.title !== 'string' ||
      typeof todo.completed !== 'boolean') {
    throw new Error('API trả todo sai cấu trúc');
  }
  return {
    json: {
      todo_id: todo.id,
      title: todo.title.trim(),
      completed: todo.completed,
      needs_attention: !todo.completed,
      source: 'jsonplaceholder'
    },
    pairedItem: { item: index }
  };
});
```

Không dùng `Boolean(todo.completed)` vì chuỗi `"false"` sẽ thành true. Sai schema chủ động fail để không tạo báo cáo giả. Fixture thử cho Code:

```json
{ "userId": 1, "id": 1, "title": "Việc thử nghiệm", "completed": false }
```

Output mong đợi giữ ID/title, `needs_attention:true`. Có thể pin fixture ở node API để thử nhánh, nhưng phải bỏ pin trước kiểm tra API/lịch thật.

### 3. Điều kiện và kết quả

IF tên **Chưa hoàn tất?**: Boolean, value expression dưới, operation `is true`:

```js
{{ $json.needs_attention }}
```

True → Edit Fields **Kết quả cần làm**; False → Edit Fields **Kết quả đã xong**. Cả hai Manual Mapping và giữ các field input cần thiết; thêm String `result` lần lượt `Cần thực hiện`/`Đã hoàn tất`, String `summary`:

```js
{{ 'Todo ' + $json.todo_id + ': ' + $json.title }}
```

Node cuối là “inspectable result” của bài, không gửi ra bên ngoài. Nếu nối Telegram/Gmail sau này, cấu hình credential, allowlist người nhận và chống trùng theo todo/time window; không bật gửi mỗi5 phút cho cùng một todo mà không có yêu cầu.

### 4. Publish lịch

Execute bằng Manual, xem Input/Output từng node, sửa lỗi nếu có. Khi đúng, bỏ fixture/pin, lưu và **Publish** trên UI mốc đã chọn. Nếu dùng bản cũ Active/Activate, đối chiếu [hướng dẫn publish](../technologies/n8n/fundamentals). Chờ một execution tự động theo lịch5 phút test; sau đó đổi9:00, publish lại.

### 5. Export và import JSON đúng cách

Chưa có runtime để xuất/kiểm chứng workflow, nên bài không cung cấp một JSON tự dựng rồi khẳng định import được. Sau khi dựng theo bảng cấu hình, dùng menu editor **Download/Export** lấy toàn bộ JSON thật. Rà pinned data, URL, tên/ID credential trước chia sẻ.

Import thử vào workflow **mới** ở môi trường test bằng Import from File, giữ unpublished; kiểm tra node/typeVersion, timezone và wiring, chạy Manual, rồi mới publish nếu thật sự muốn thêm lịch. Không publish hai bản trùng lịch ngoài ý muốn. Việc parse JSON thành công không xác nhận workflow hợp lệ với engine. Xem [export/import](https://docs.n8n.io/workflows/export-import/).

## Chạy và kiểm tra

| Ca thử | Cách làm | Kết quả mong đợi |
| --- | --- | --- |
| Manual hợp lệ | API thật, không pin | Một nhánh có item và summary phù hợp completed |
| Nhánh true | Pin fixture `completed:false` | Kết quả cần làm |
| Nhánh false | Đổi fixture `completed:true` | Kết quả đã xong |
| Sai kiểu | Fixture `completed:"false"` | Code fail, không có kết quả thành công |
| API lỗi | Trên bản test đổi host sang domain `.invalid` | Execution fail ở HTTP, không dùng output cũ |
| Lịch tự động | Bỏ pin, publish, đợi khoảng test | Executions có lần tự động với timestamp đúng timezone |
| Dừng | Unpublish | Không phát sinh execution mới do lịch |

Kiểm tra status và thời gian execution, số item từng node, không chỉ màu xanh canvas. Error workflow/cảnh báo vận hành có thể bổ sung theo [thiết kế workflow](../technologies/n8n/workflow-design).

## Lỗi khởi tạo thường gặp

| Triệu chứng | Nguyên nhân / sửa | Xác nhận |
| --- | --- | --- |
| Không có lịch chạy | Chưa publish/sai timezone/server tắt | Kiểm tra settings và execution tự động |
| Code báo schema sai | Bật full response hoặc API trả shape khác | Xem JSON, sửa path có chủ đích, không bỏ validation |
| Vẫn cùng fixture | Quên unpin | Bỏ pin và chạy lại HTTP thật |
| Code không chạy | Runner lỗi | Log runner, thử Code đơn giản ở bài cài đặt |
| IF sai nhánh | Boolean bị String | Xem type của needs_attention và rule IF |

## Kết quả mong đợi

- [ ] Workflow chạy thủ công và tự động, đúng timezone.
- [ ] Chuẩn hóa dữ liệu và cả hai nhánh được kiểm tra bằng fixture.
- [ ] API/schema lỗi không trở thành báo cáo thành công.
- [ ] Export thật import lại được trên instance test sau khi tự kiểm chứng.

**Bài tập thêm:** lấy nhiều todo theo `userId`, Split Out nếu response là array trong một item, Aggregate thành tổng số chưa hoàn tất; thêm giới hạn batch; thêm Error Trigger. Dừng lịch bằng Unpublish và xóa fixture pin khi kết thúc, không xóa volume n8n.

Tiếp theo: [webhook, validation và PostgreSQL](./n8n-webhook-postgres).
