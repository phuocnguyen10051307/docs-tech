---
title: JSON, item, expression và xử lý dữ liệu n8n
version: Mốc 2.46.6 · JavaScript Code node · Level 1–2
status: guide
---

# JSON, item, expression và xử lý dữ liệu n8n

## Tổng quan

n8n truyền **mảng item** giữa node. Mỗi item thường có object `json`, có thể kèm `binary` và metadata liên kết. Array nằm trong `json` không tự đồng nghĩa nhiều item. Hiểu điểm này quyết định số lần API bị gọi và cách map từng người dùng.

```json
[
  { "json": { "customer_id": 1, "tags": ["demo", "new"] } },
  { "json": { "customer_id": 2, "tags": [] } }
]
```

Đây là hai item; mỗi item có một customer. Ngược lại, `{ "json": { "customers": [{"id":1},{"id":2}] } }` là một item chứa array. Node đa số xử lý từng item, nhưng có ngoại lệ; đọc node cụ thể thay vì giả định tất cả chạy một lần hoặc mỗi item đều tạo execution mới. Nguồn: [data structure](https://docs.n8n.io/data/data-structure/).

## Yêu cầu trước khi bắt đầu

Hoàn thành [editor và node](./fundamentals). Code JavaScript dùng external runner theo [Compose local](/project-guides/n8n-compose). **Chưa kiểm thử n8n:** các ví dụ có thể kiểm tra logic JavaScript riêng nhưng chưa xác nhận context và item linking trên runtime.

## Cài đặt

JSON không có comment, trailing comma hay `undefined`; dùng dấu nháy kép cho key/string. Object, array, string, number, boolean và null là các kiểu khác nhau. `"false"` là chuỗi không rỗng, nên `Boolean("false")` cho true. Không dùng ép kiểu này để xác thực dữ liệu webhook.

## Khởi tạo dự án

Tạo workflow `LAB / Xử lý khách hàng`, Manual Trigger → Code (`Run Once for All Items`). Đặt fixture:

```js
return [
  { json: { id: 1, name: '  An  ', amount: 120000, email: null } },
  { json: { id: 2, name: 'Bình', amount: 50000 } }
];
```

Chọn node, Output JSON phải có hai item; trường email thứ nhất là null, item thứ hai không có key email. Thêm Edit Fields để thực hành các expression phía dưới; giữ `id` làm khóa liên kết.

## Cấu hình

### Mapping và expression

Fixed là giá trị tĩnh; Expression tính theo dữ liệu execution. Dùng trình chuyển chế độ của field và xem preview với item đang chọn. Các expression sau nhập vào field hỗ trợ expression; giữ đúng kiểu field:

```js
{{ $json.name.trim() }}
{{ $json.email ?? 'chua-co-email' }}
{{ $json.amount >= 100000 }}
{{ Number($json.amount) }}
{{ $('Nhận yêu cầu').item.json.request_id }}
{{ $('Cấu hình').first().json.currency }}
{{ $input.all().length }}
```

`$json` là dữ liệu item hiện tại. `??` chỉ fallback cho null/undefined, không thay 0/false/chuỗi rỗng như `||` có thể làm. `Number()` có thể sinh NaN; xác thực bằng `Number.isFinite`/`Number.isInteger` trước dùng. Node name trong tham chiếu phải tồn tại và đã chạy trong đường hiện tại.

`.item` theo quan hệ item linking; `.first()` chọn item đầu một cách chủ động, chỉ phù hợp dữ liệu cấu hình dùng chung. Dùng `.first()` cho email khách hàng sẽ có nguy cơ gửi toàn bộ kết quả cho người đầu. `.all()` trả danh sách output, cần xác định đang đọc lần chạy/nhánh nào trong loop. Nguồn: [expressions và data nodes](https://docs.n8n.io/code/expressions/).

### Item linking và Code node

Liên kết item cho phép n8n lần ngược từ output về input tương ứng. Sau thao tác one-to-one, giữ liên kết theo index; khi tự tạo item mới, ghép/tách/đổi thứ tự, cần quản lý rõ.

Code **Run Once for All Items**, nối sau fixture:

```js
return $input.all().map((item, index) => {
  const amount = item.json.amount;
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new Error(`amount không hợp lệ ở item ${index}`);
  }
  return {
    json: {
      id: item.json.id,
      name: String(item.json.name ?? '').trim(),
      amount,
      needs_review: amount >= 100000,
      email: item.json.email ?? null
    },
    pairedItem: { item: index }
  };
});
```

`pairedItem.item` trỏ index input node hiện tại, không phải ID nghiệp vụ. Khi aggregate nhiều input thành một output, quan hệ nhiều nguồn có thể làm `.item` mơ hồ; ưu tiên mang `customer_id/request_id` rõ ràng và join theo khóa. Nếu lọc trước khi map, giữ index gốc thay vì đánh lại index rồi gán sai `pairedItem`. Xem [item linking](https://docs.n8n.io/data/data-mapping/data-item-linking/).

Code **Run Once for Each Item** trả một item object cho item hiện tại, ví dụ:

```js
return { json: { ...$json, normalized_name: String($json.name ?? '').trim() } };
```

Không trả array theo mẫu All Items trong mode Each Item. Không dùng Code cho mapping đơn giản đã có Edit Fields; dùng khi validation/chuyển đổi khó biểu diễn bằng UI. Không giả định có `fetch`, filesystem hay npm module bất kỳ trong runner; gọi API bằng HTTP Request và quản lý credential tại đó. Nguồn: [Code node](https://docs.n8n.io/code/code-node/).

### Lọc, tách, gom và Merge

| Bài toán | Node / chế độ | Cách kiểm tra và giới hạn |
| --- | --- | --- |
| Chỉ giữ amount lớn | Filter hoặc IF với Number >= 100000 | Count giảm đúng; IF giữ được cả nhánh không đạt nếu cần audit |
| Một item chứa `customers[]` → từng customer | Split Out, field `customers` | 2 phần tử thành 2 item; xem field được giữ lại |
| Nhiều item → một báo cáo | Aggregate | Output một item chứa array; lưu ý RAM và kích thước response |
| Nối danh sách A và B | Merge, Append | Tổng count là A+B; không phải join |
| Ghép khách với đơn | Merge, Combine by Matching Fields, `customer_id` ↔ `customer_id` | Kiểm tra khóa trùng/không khớp, output type theo nhu cầu |
| Ghép theo vị trí | Merge, Combine by Position | Chỉ dùng khi thứ tự và độ dài được bảo đảm |

Ví dụ A có `{customer_id:1,name:"An"}`, B có `{customer_id:1,total:120000}`; join theo khóa cho một record đủ field. Nếu A/B có nhiều dòng cùng khóa, kết quả có thể nhân số dòng. Không dùng position để ghép response API có sắp xếp khác. Merge chờ các input cần thiết, không phải cách tùy ý nối lại IF khi một nhánh không có dữ liệu. Chọn chế độ từ node thực tế và thử cả unmatched. Nguồn: [Merge](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.merge/).

### Loop và batching

Nhiều node đã xử lý danh sách item, nên không cần loop chỉ để “chạy cho từng dòng”. Dùng **Loop Over Items (Split in Batches)** khi cần chia batch, giới hạn API hoặc một node không tự lặp theo yêu cầu:

```text
Danh sách item → Loop Over Items (Batch Size 10)
                     loop → HTTP Request → Wait 1 giây ─┐
                       ▲                               │
                       └───────────────────────────────┘
                     done → báo cáo tổng kết
```

Nối cuối thân vòng lại Loop, dùng output **done** cho bước sau tất cả batch. Đặt `Reset` chỉ khi thật sự muốn khởi tạo lại tập input; bật sai có thể lặp vô hạn. Batch size10 không có nghĩa chắc chắn10 request/giây: còn phụ thuộc số item, hành vi HTTP node và thời gian từng request. Với quota nghiêm, batch1/Wait và bộ đếm có kiểm soát dễ hiểu hơn. Nguồn: [Loop Over Items](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.splitinbatches/).

### Ngày giờ và timezone

Lưu timestamp dạng ISO 8601 có offset hoặc UTC; chuyển timezone khi hiển thị/lập lịch. Expression dùng đối tượng Luxon của n8n:

```js
{{ $now.setZone('Asia/Ho_Chi_Minh').toISO() }}
{{ DateTime.fromISO($json.created_at, { zone: 'utc' }).setZone('Asia/Ho_Chi_Minh').toFormat('dd/LL/yyyy HH:mm') }}
```

`01/02/2026` mơ hồ nếu không biết định dạng; parse bằng format rõ hoặc từ chối đầu vào. Kiểm tra `isValid` trước dùng, không âm thầm biến ngày sai thành ngày hiện tại. Schedule timezone khác việc format một field ngày. Nguồn: [dates and times](https://docs.n8n.io/code/cookbook/luxon/).

### Binary và file

File không nên được biến thành chuỗi JSON lớn chỉ để nối node. HTTP Request chọn **Response Format: File**, đặt output binary field `data`; node sau phải chọn cùng property `data`. Metadata có tên file, MIME type và kích thước; giá trị lưu trữ có thể là tham chiếu, không luôn base64 trực tiếp để đọc thủ công.

Ví dụ thử: HTTP GET một file nhỏ từ nguồn tin cậy → Binary tab kiểm tra MIME/name → node gửi/upload chọn Input Binary Field `data`. Không coi extension do caller cung cấp là bằng chứng loại file. Giới hạn dung lượng, loại file, URL nguồn; không fetch URL tùy ý từ webhook vì SSRF. Cloud và self-hosted khác quyền file local; không dùng đường dẫn host tùy tiện. Với payload lớn, xem [binary data](https://docs.n8n.io/data/binary-data/) và cấu hình lưu trữ theo phiên bản/edition.

## Cấu trúc dự án

Lưu fixture JSON cho: hợp lệ, thiếu field, null, sai type, nhiều item và khóa trùng. Trong Sticky Note mô tả mỗi field, kiểu và null có nghĩa gì. Dữ liệu trong editor/Table chỉ là cách hiển thị; JSON mới cho thấy cấu trúc object/array rõ ràng.

## Lệnh thường dùng

Chọn node → Input JSON và Output JSON → đổi item đang xem → xem count từng cổng. Nếu dùng pin để tái hiện lỗi, gắn nhãn fixture; bỏ pin và chạy lại với nguồn thật trước publish. Không dùng `$input.all()[0]` để che mất các item còn lại nếu mục tiêu là xử lý tất cả.

## Thực hành tốt

Chuẩn hóa một lần gần đầu luồng, giữ khóa nghiệp vụ và chỉ mang field cần thiết. Validation có hai lớp: schema/type và quy tắc nghiệp vụ. Không stringify một object rồi tưởng nó vẫn là object ở node sau; parse có kiểm soát và giới hạn đầu vào. Tách code thuần để test được với fixture, nhưng vẫn cần test Code node/runner/item linking thật.

## Xử lý lỗi

| Lỗi | Nguyên nhân | Sửa và kiểm tra lại |
| --- | --- | --- |
| Field undefined | Sai path hoặc field không tồn tại | Mở Input JSON, dùng optional chaining/fallback có ý nghĩa |
| Chỉ xử lý người đầu | `.first()`/Execute Once hoặc sub-node đọc item đầu | Thử hai item khác nhau, đổi thiết kế hoặc loop một item |
| Không xác định được `.item` | Mất/liên kết nhiều nguồn sau Code/Merge | Giữ `pairedItem` đúng hoặc join theo khóa nghiệp vụ |
| Merge nhân dữ liệu | Khóa join trùng | Kiểm tra cardinality, deduplicate có quy tắc rồi join |
| Loop không kết thúc | Nối sai cổng hoặc Reset sai | Dùng fixture2 item, kiểm tra output loop/done và điều kiện dừng |
| File mất ở node sau | Chỉ trả `json`, bỏ `binary` | Giữ binary property khi transform, kiểm tra Binary tab |

## Đánh giá

Tự biến fixture khách hàng thành hai item chuẩn hóa, lọc/join theo khóa và viết được lý do một nhánh có0 item. Tiếp theo: [HTTP Request và API](./http-and-apis), [bài lịch](/project-guides/n8n-scheduled-api).
