---
title: Thiết kế workflow, lỗi, retry và khả năng bảo trì
version: Mốc 2.46.6 · Level 2
status: guide
---

# Thiết kế workflow, lỗi, retry và khả năng bảo trì

## Tổng quan

Workflow đáng tin cậy có hợp đồng input/output, ranh giới tác động phụ và cách tiếp tục sau lỗi. Đồ thị ngắn chưa chắc dễ vận hành nếu mỗi node vừa xác thực, gọi API vừa gửi thông báo mà không có trạng thái rõ ràng.

```text
Trigger → Validate → Normalize → Enrich → Commit → Notify → Audit
             │                     │        │        │
          lỗi400               lỗi upstream lỗi DB  lỗi gửi
```

Phân biệt lỗi dự kiến (đầu vào sai, resource không tồn tại) và lỗi vận hành (timeout, DB ngắt). Không biến tất cả thành thành công để execution xanh. Cũng không dùng một node lỗi để bỏ mọi item hợp lệ mà không có yêu cầu nghiệp vụ.

## Yêu cầu trước khi bắt đầu

Hiểu [item](./data-and-expressions), [HTTP](./http-and-apis), có workflow test. **Chưa kiểm thử runtime:** Error Trigger, sub-workflow, publish và recovery cần kiểm tra trên instance đúng version.

## Cài đặt

Tạo workflow có tên/mục đích rõ, đặt workflow Settings timezone và timeout phù hợp. Chọn retention ở cấp workflow/instance theo edition. Không cần cài thêm “error framework” để dùng Error Trigger/Stop And Error built-in.

## Khởi tạo dự án

Trước nối node, viết bốn dòng trong Sticky Note:

```text
Input: request_id chuỗi, todo_id số nguyên1..200
Output: HTTP200 với kết quả lưu,400 nếu sai,409 nếu reuse key khác dữ liệu,503 nếu phụ thuộc lỗi
Tác động: ghi một row PostgreSQL; không gửi email
Chạy lại: cùng request_id + todo_id không tạo row thứ hai
```

Đó là contract của [bài webhook](/project-guides/n8n-webhook-postgres). Mỗi nhánh cần kết thúc có chủ đích, không chỉ rơi vào node không output.

## Cấu hình

### Event, lịch và lựa chọn đồng bộ

| Kiểu | Khi dùng | Đánh đổi |
| --- | --- | --- |
| Webhook/sự kiện | Cần phản hồi nhanh khi nguồn phát event | Nguồn có thể gửi lặp/sai thứ tự; cần auth/idempotency |
| Schedule/polling | Nguồn không có webhook hoặc chạy báo cáo | Có độ trễ, dùng checkpoint/window để tránh bỏ/trùng |
| Request đồng bộ | Tác vụ ngắn, caller đợi kết quả | Timeout proxy/client có thể ngắn hơn workflow |
| Nhận job rồi xử lý nền | AI, batch hoặc bước chờ người | Trả202 sau khi nhận bền vững, có job ID và endpoint/status riêng |

Không trả202 trước khi có nơi lưu job rồi xem đó là hàng đợi bền vững. Không giữ một HTTP request mở nhiều giờ để chờ phê duyệt. Với async, ghi job trước, xử lý riêng và cung cấp trạng thái; bản nâng cấp kiến trúc này cần kiểm thử thêm.

### Test và production webhooks

Test URL phục vụ editor khi listener bật; production URL cần workflow published/active. Auth của webhook không bảo vệ editor và ngược lại. Với proxy, URL công khai phải theo scheme/host thật; request phải qua body-size/timeouts phù hợp.

Kiểm tra method, path, header auth, JSON body và nhánh response cho cả lỗi. CORS chỉ là chính sách browser, không phải auth và không chặn curl. Signature của nhà cung cấp phải xác minh theo raw body/contract trước tác động phụ; không tự tạo HMAC theo object đã đổi thứ tự nếu provider ký raw bytes. Nguồn: [Webhook](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/).

### Sub-workflow và tái sử dụng

Tạo workflow con bằng **Execute Sub-workflow Trigger** (có thể hiển thị “When Executed by Another Workflow”), khai báo input rõ. Workflow cha dùng **Execute Sub-workflow**, chọn ID workflow con, map input, bật chờ hoàn tất nếu cần output. Node cuối workflow con trả contract ổn định. Hạn chế workflow nào được phép gọi ở Settings khi tính năng có trên version.

Ví dụ: `Chuẩn hóa khách` nhận `{customer_id,email}`, trả `{customer_id,normalized_email,valid}`; workflow cha vẫn chịu trách nhiệm quyết định gửi email. Sub-workflow không tự biến lỗi thành retry/transaction; phải thử cả output rỗng và lỗi bên con. Không tách mọi node thành workflow riêng khiến khó lần trace. Nguồn: [sub-workflows](https://docs.n8n.io/flow-logic/subworkflows/).

### Idempotency và đồng thời

Idempotency nghĩa chạy lặp cùng thao tác nghiệp vụ không làm tăng tác động ngoài dự kiến. Các nguồn webhook/scheduler có thể tạo execution lặp, hoặc hai execution chạy đồng thời. Cách “SELECT xem đã có chưa rồi INSERT” có race condition; dùng unique constraint và thao tác atomic ở hệ lưu trữ.

```text
request_id + payload đã chuẩn hóa
             │
             ▼
unique key / atomic insert-or-return
       ├── cùng key, cùng payload → dùng kết quả đã có
       └── cùng key, khác payload →409, không đổi nghĩa request cũ
```

Thao tác DB commit rồi gửi Gmail không nằm trong một transaction chung với Gmail. Nếu gửi thành công nhưng đánh dấu DB thất bại, retry có thể gửi lại. Với yêu cầu mạnh hơn cần outbox, delivery key hoặc API provider có idempotency; không tuyên bố “exactly once” chỉ vì workflow có IF.

Không dùng workflow static data hoặc memory Agent làm nơi khóa chống trùng có tính đồng thời. [Bài2](/project-guides/n8n-webhook-postgres) minh họa unique key SQL cho phần ghi DB, không cam kết exactly-once với dịch vụ ngoài.

### Lỗi node, Error Trigger và fallback

| Cơ chế | Dùng khi | Giới hạn |
| --- | --- | --- |
| Retry On Fail | Lỗi tạm, thao tác an toàn lặp | Không tự phân loại mọi4xx/5xx, có thể nhân tác động |
| On Error: Stop Workflow | Lỗi không xử lý được cần fail | Các bước đã commit không tự rollback |
| On Error: Continue using error output | Cần nhánh fallback/HTTP503 riêng | Đường lỗi cần map và kết thúc đúng; không coi lỗi là success |
| Error Trigger workflow | Thông báo/audit khi execution tự động fail | Không thay error branch đồng bộ; manual test không tự chứng minh Error Trigger hoạt động |
| Stop And Error | Gắn lỗi nghiệp vụ không phục hồi ở điểm xác định | Không dùng để trả HTTP400 nếu đang cần response có contract |

Tạo workflow `OPS / Lỗi tự động`: **Error Trigger → Edit Fields** giữ workflow name/ID, execution ID/URL nếu có, last node và mã lỗi đã khử nhạy cảm → kênh cảnh báo test hoặc nơi lưu. Chọn workflow này tại Settings → Error Workflow của workflow chính. Cấu trúc payload lỗi trigger có thể khác lỗi node và có field không tồn tại; dùng fallback null, không giả định luôn có execution URL.

Không thử Error Trigger bằng cách chỉ Execute workflow lỗi bằng tay rồi kết luận hỏng. Tạo một execution tự động trên lịch/webhook đã publish trong môi trường test, cho lỗi có chủ đích, xem execution cả hai workflow. Nếu lỗi đã được bắt và workflow kết thúc thành công, Error Trigger không tự chạy; ghi audit/notify ngay nhánh đó. Nguồn: [error handling](https://docs.n8n.io/flow-logic/error-handling/).

### Recovery và kiểm thử sau lỗi

Retry từ execution cũ có thể dùng payload, credential và code khác thời điểm ban đầu theo cách chọn replay. Kiểm tra node nào đã ghi/gửi, trạng thái ở đích và idempotency key trước retry. Không “Execute workflow” lại toàn bộ chỉ để đỡ đọc log.

Thiết kế checkpoint sau commit; với batch, lưu danh sách item thành công/thất bại và correlation ID. Bù trừ (compensation) là thao tác nghiệp vụ mới, không phải rollback tự động. Xóa bù không luôn hợp lệ với thanh toán/email đã gửi.

## Cấu trúc dự án

Quy ước `LAB|DEV|PROD / Nghiệp vụ / Trigger`, node theo động từ, workflow con `LIB / Tên contract`, lỗi `OPS / Tên cảnh báo`. Ghi chủ sở hữu, lịch/timezone, hệ đích, tác động, credential theo tên logic, retention, cách dừng, khôi phục và phiên bản publish trong runbook.

Export JSON thật dùng quản lý thay đổi, nhưng khác quyền chia sẻ/history/source control có thể tùy plan. Không giả định Community có môi trường Git tích hợp như bản trả phí. Xem [edition](https://docs.n8n.io/hosting/community-edition-features/).

## Lệnh thường dùng

Trong editor chọn Executions, lọc Failed/Success/Waiting theo workflow và thời gian; mở node lỗi, Input/Output, thời lượng và version. So sánh với request ID trong DB/nguồn để lần trace. Execution lưu thành công không tự chứng minh tin nhắn đã đến người nhận; kiểm tra delivery theo API khi cần.

## Thực hành tốt

Tách môi trường và người nhận test. Có tối thiểu các ca: hợp lệ, thiếu field, null/sai type, item rỗng, upstream4xx/429/5xx, timeout, DB ngắt, request lặp và đồng thời. Theo dõi số execution, lỗi, thời gian, backlog/Waiting và chi phí dịch vụ. Nếu tiết kiệm bằng không lưu success data, bảo đảm vẫn đủ audit an toàn ở hệ nghiệp vụ.

## Xử lý lỗi

| Triệu chứng | Nguyên nhân | Sửa và kiểm tra |
| --- | --- | --- |
| Execution xanh nhưng không ghi DB | Error bị Continue hoặc0 item | Kiểm tra nhánh count và status, test DB lỗi |
| Hai thông báo cho một event | Retry không có delivery key | Kiểm tra đích, bổ sung dedupe theo nghiệp vụ, thử đồng thời |
| Sub-workflow chạy nhưng cha không có output | Không wait, node cuối rỗng hoặc mapping sai | Kiểm tra contract, thử1 và nhiều item |
| Error workflow không chạy | Chạy manual hoặc lỗi đã bị bắt | Test execution tự động fail trong môi trường riêng |
| Caller timeout nhưng execution vẫn chạy | Timeout HTTP ngắn hơn xử lý | Giảm tác vụ đồng bộ hoặc thiết kế async bền vững |
| Re-run làm đổi dữ liệu cũ | Key/payload không được ràng buộc | Unique key + so payload, ca409 khi reuse key sai |

## Đánh giá

Một workflow có thể bảo trì khi người khác biết input, kết quả, tác động và cách dừng/khôi phục mà không phải đoán từng expression. Tiếp tục [tích hợp dịch vụ](./integrations) và ba [bài thực hành](./).
