---
title: Tích hợp HTTP và REST API trong n8n
version: Mốc 2.46.6 · HTTP Request · Level 2
status: guide
---

# Tích hợp HTTP và REST API trong n8n

## Tổng quan

API là hợp đồng giữa hệ thống; HTTP Request chỉ gửi request theo cấu hình, không hiểu nghiệp vụ thay bạn. Cần kiểm tra method, URL, auth, status và schema response. Node native thường tiện khi đã có operation/credential cần dùng; HTTP Request phù hợp API riêng hoặc operation native chưa hỗ trợ.

| Method | Mục đích thông thường | Lưu ý retry |
| --- | --- | --- |
| GET | Đọc tài nguyên | Thường an toàn lặp, vẫn tốn quota |
| POST | Tạo tài nguyên/thực hiện hành động | Không tự mặc định idempotent; timeout có thể xảy ra sau commit |
| PUT | Thay biểu diễn tài nguyên tại URL | Theo hợp đồng API, thường idempotent nhưng có thể có tác động phụ |
| PATCH | Sửa một phần | Phụ thuộc nội dung patch; “tăng số dư” khác “đặt trạng thái” |
| DELETE | Xóa tài nguyên | Kết quả resource có thể idempotent nhưng không nên thử trên dữ liệu thật |

Không suy method chỉ từ tên endpoint. Xem [HTTP Request](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/).

## Yêu cầu trước khi bắt đầu

Biết [item và expression](./data-and-expressions); editor có mạng ra API. Ví dụ dùng [JSONPlaceholder](https://jsonplaceholder.typicode.com/) với dữ liệu giả, không cần credential. **Chưa kiểm thử workflow n8n:** kiểm tra GET bên ngoài hoặc JavaScript thuần không thay thế HTTP Request node thực tế. Không gửi thông tin cá nhân vào API demo.

## Cài đặt

Thêm HTTP Request built-in từ editor, không cài thêm package. Tạo node mới để có phiên bản node đang hỗ trợ; export cũ có `typeVersion` riêng. Không copy curl chứa token từ production vào editor dùng chung.

## Khởi tạo dự án

Tạo Manual Trigger → HTTP Request tên `Lấy todo`:

| Trường | Giá trị |
| --- | --- |
| Method | GET |
| URL | `https://jsonplaceholder.typicode.com/todos` |
| Authentication | None |
| Send Query Parameters | Bật, `userId` = `1`, `_limit` = `5` |
| Send Headers | Nếu cần, `Accept` = `application/json` |
| Options → Response | Response Format JSON |
| Options → Timeout | `10000` ms |

Execute, xem Input/Output và số item. Một array response có thể được node trả thành nhiều item theo thiết lập/version; xác nhận shape thực tế trước mapping. Query parameter nằm trên URL, header là metadata request, body dùng cho payload. GET thường không cần body.

Thử GET `https://jsonplaceholder.typicode.com/todos/1` để có một object `{userId,id,title,completed}`. Không gửi dữ liệu thật vào POST demo; dịch vụ mô phỏng ghi và không cam kết lưu dữ liệu gửi. Đừng dùng JSONPlaceholder làm storage.

## Cấu hình

### Request body và kiểu dữ liệu

Với API nhận JSON: Method POST, Send Body bật, Body Content Type JSON, cấu hình field hoặc toàn object bằng expression. Đặt giá trị Boolean thật thay String nếu API yêu cầu. Ví dụ body nghiệp vụ minh họa:

```json
{ "title": "Báo cáo thử", "completed": false, "userId": 1 }
```

Query/header/body có ý nghĩa khác nhau theo API; `Content-Type` nói dạng body, `Accept` nói dạng response mong muốn. Dùng mapping của node thay tự nối JSON có dấu nháy. Không đặt API key vào query nếu dịch vụ có hỗ trợ header vì URL dễ vào log/history.

### Authentication

| Cơ chế | Cấu hình và prerequisite | Khi dùng / không dùng |
| --- | --- | --- |
| API key | Credential Header Auth, tên header đúng theo API | Token tĩnh; không hardcode trên node hay URL |
| Bearer | Header Auth với `Authorization: Bearer …` trong credential hoặc loại credential hỗ trợ | Token cần hết hạn/rotate; đừng thêm `Bearer` hai lần |
| Basic Auth | Generic Credential → Basic Auth, username/password | Chỉ qua HTTPS, tránh tài khoản admin |
| OAuth2 | Native/predefined credential hoặc Generic OAuth2; client ID/secret, auth/token URL, redirect URI, scope | Dùng khi service cấp token theo user; không thay bằng lấy token thủ công vô thời hạn |

OAuth self-hosted cần đăng ký redirect URL **đúng UI credential hiển thị** với provider, kể cả scheme/path; Cloud có thể có managed OAuth cho một số node. Khi đổi scope, reconnect để consent lại. Credential nối được không chứng minh mọi operation được cấp quyền. Dùng native credential nếu có để giảm sai sót. Nguồn: [HTTP Request credentials](https://docs.n8n.io/integrations/builtin/credentials/httprequest/).

### Status code, lỗi mạng và fallback

| Kết quả | Ý nghĩa thực tế | Xử lý |
| --- | --- | --- |
| 200/201/204 | Thành công theo HTTP; 204 có thể không body | Vẫn kiểm tra schema/nghiệp vụ; không JSON.parse body rỗng |
| 400/422 | Request sai | Sửa/đưa hàng lỗi, không retry vô hạn |
| 401 | Token thiếu/hết hạn/sai | Kiểm tra credential/refresh |
| 403 | Thiếu scope/quyền/policy | Sửa quyền đúng tài nguyên, không tăng lên admin tùy tiện |
| 404 | Resource/route không tồn tại | Xác định có phải trạng thái nghiệp vụ hợp lệ |
| 409 | Conflict/idempotency | Đối chiếu khóa và dữ liệu cũ |
| 429 | Rate limit | Tôn trọng Retry-After và giảm tốc |
| 5xx, DNS, timeout | Lỗi server/network hoặc không biết outcome | Retry có giới hạn nếu an toàn, ghi nhận unknown outcome |

Mặc định lỗi HTTP thường làm node fail; Settings **On Error → Continue (using error output)** cho phép tách đường lỗi. Không chọn Continue rồi coi item lỗi là dữ liệu thành công. Khi cần phân nhánh theo status, bật **Include Response Headers and Status**, **Never Error** nếu node/version hỗ trợ, rồi tự kiểm tra `statusCode`, `headers`, `body`. Never Error không biến lỗi DNS/timeout thành HTTP response.

Không trộn hai cơ chế mà không hiểu shape: error output khác object full response. Chạy riêng fixture 200,404, timeout và quan sát Output từng đường. Fallback cần chỉ rõ “dữ liệu cũ”, “chưa xử lý” hoặc HTTP lỗi; không thay lỗi thanh toán bằng kết quả thành công giả.

### Pagination

Một request chỉ lấy trang đầu có thể bỏ sót dữ liệu. Đọc tài liệu API để biết page/offset/cursor, tổng số và điều kiện dừng:

1. API có `next` URL: HTTP Request → Pagination → Response Contains Next URL, expression trỏ đúng field response.
2. API dùng page/offset: Update a Parameter in Each Request, tăng page bằng biến pagination, ví dụ dưới đây; đặt giới hạn số trang khi thử.

```js
{{ $pageCount + 1 }}
{{ $response.body.next }}
```

Đây là **hai cách cho hai hợp đồng API**, không cùng một cấu hình. `$pageCount` bắt đầu từ0; API bắt đầu page0 thì không cộng1. Điều kiện dừng phải là `has_more=false`, next rỗng hoặc số item theo hợp đồng; với JSONPlaceholder `_page/_limit`, có thể thử page-size nhỏ và dừng khi body array rỗng. Không dùng chính `$json.next` nếu pagination cần response hiện tại của HTTP node. Cần giới hạn vòng lặp để tránh API lặp cursor.

Pagination không đảm bảo snapshot: dữ liệu thay đổi giữa trang có thể trùng/thiếu. Dùng stable sort/cursor, khóa dedupe và checkpoint chỉ sau khi commit thành công. Xem [HTTP pagination](https://docs.n8n.io/code/cookbook/http-node/pagination/).

### Rate limit, timeout và retry

Thiết lập Timeout theo ngân sách tổng của workflow/caller; timeout request không phải bằng chứng server chưa xử lý. Settings **Retry On Fail**, Max Tries và Wait Between Tries hữu ích cho lỗi tạm; retry cố định không tự thực hiện exponential backoff hay đọc Retry-After.

Ví dụ thiết kế retry chủ động: tối đa3 lần với backoff1/2/4 giây cộng jitter nhỏ, chỉ cho lỗi tạm đã phân loại; giới hạn tổng thời gian và đưa lỗi còn lại vào hàng xử lý. `Retry-After` có thể là số giây hoặc HTTP date, cần parse đúng. Tránh retry đồng thời ở node, toàn workflow và client khiến nhân số lần gọi.

Với nhiều item, dùng [Loop Over Items/Wait](./data-and-expressions) hoặc batching của HTTP Request theo version. Không cố tối đa concurrency khi quota nhỏ. Dùng idempotency key mà API hỗ trợ cho POST và tra trạng thái khi outcome không rõ; key phải gắn cùng thao tác nghiệp vụ qua retry. Nguồn: [handling rate limits](https://docs.n8n.io/integrations/builtin/rate-limits/).

## Cấu trúc dự án

Đối với mỗi API, ghi trong Sticky Note: base URL cố định, auth/scope, timeout, quota, pagination, schema thành công/lỗi và các hành động có tác động phụ. Chỉ đưa ID/field đã validate vào URL; không cho webhook input quyết định host đích tùy ý.

## Lệnh thường dùng

Đối chiếu API độc lập khi node lỗi. Bash dùng `curl`, PowerShell dùng `curl.exe`:

```sh
curl -i "https://jsonplaceholder.typicode.com/todos?userId=1&_limit=2"
```

Lệnh chỉ đọc dữ liệu giả, kiểm tra status/header/body. Kết nối được từ host chưa bảo đảm container n8n có cùng DNS/proxy/firewall. Không paste verbose log chứa auth vào báo cáo công khai.

## Thực hành tốt

Allowlist host, validate ID và giới hạn payload. Tách response từ nhà cung cấp khỏi contract trả cho caller. Dùng credential test và log mã lỗi/correlation ID thay token/body nhạy cảm. GET nên có hạn chế số trang và tổng item; POST phải có kế hoạch chống trùng trước bật retry.

## Xử lý lỗi

| Triệu chứng | Kiểm tra và sửa | Xác nhận |
| --- | --- | --- |
| Body thành chuỗi hoặc thiếu field | Chọn Response Format/body JSON đúng, xem shape thực tế | Test object, array và204 |
| API401 sau đổi key | Credential node còn chọn bản cũ hoặc thiếu prefix | Reconnect/test read bằng credential đúng |
| API429 liên tục | Quota tổng nhiều workflow, retry quá nhanh | Giảm lịch/concurrency, xem headers rồi thử ít item |
| Phân trang không dừng | Cursor lặp/điều kiện sai | Giới hạn số trang, kiểm tra URL/response từng trang |
| Timeout rồi tạo trùng | Server xử lý nhưng client chưa nhận | Tra trạng thái/idempotency, không retry mù |
| Curl host tốt, node lỗi | Mạng/proxy/DNS bên container khác | Kiểm tra từ môi trường n8n, sửa egress/cert hợp lệ |

## Đánh giá

Bạn nên tự phân loại được lỗi có thể retry, đọc được full response và giới hạn pagination. Thực hành [lịch lấy API](/project-guides/n8n-scheduled-api) rồi [webhook ghi DB](/project-guides/n8n-webhook-postgres).
