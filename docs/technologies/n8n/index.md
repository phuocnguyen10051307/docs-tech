---
title: n8n — sổ tay tự động hóa từ cơ bản đến trung cấp
version: Mốc thực hành 2.46.6 · Level 1–2 · Community / Cloud
status: guide
---

# n8n — sổ tay tự động hóa từ cơ bản đến trung cấp

## Tổng quan

n8n nối các **node** thành workflow để nhận sự kiện, gọi dịch vụ, xử lý dữ liệu và thực hiện hành động. Nó phù hợp tích hợp API, tác vụ định kỳ, điều phối quy trình có con người và AI. Để vận hành đáng tin cậy, bạn cần hiểu item, credential, lỗi, retry và tác động khi chạy lại; kéo node nối nhau mới là bước đầu.

**Triển khai n8n** là cài và bảo vệ nền tảng. **Xây workflow** là thiết kế luồng nghiệp vụ trên nền tảng đó. Một instance chạy tốt chưa chứng minh workflow không tạo bản ghi trùng hay gửi nhầm thông báo.

| Lộ trình | Nội dung | Kết quả tự thực hiện |
| --- | --- | --- |
| Level 1 | [Nền tảng và editor](./fundamentals), [dữ liệu và expression](./data-and-expressions), [cài local](/project-guides/n8n-compose) | Tạo, thử, đọc input/output, dùng lịch và webhook, publish đúng phiên bản |
| Level 2 — tích hợp | [HTTP/API](./http-and-apis), [thiết kế workflow](./workflow-design), [dịch vụ ngoài](./integrations) | Pagination, batching, SQL an toàn, OAuth, retry và idempotency |
| Level 2 — AI và vận hành | [AI Agent](./ai-agents), [self-hosting](./self-hosting) | Tool giới hạn quyền, duyệt trước hành động nhạy cảm, backup/restore và giám sát |
| Thực hành | [Bài 1: lịch và API](/project-guides/n8n-scheduled-api), [bài 2: webhook và PostgreSQL](/project-guides/n8n-webhook-postgres), [bài 3: AI Agent có phê duyệt](/project-guides/n8n-ai-agent) | Tự dựng ba workflow có kiểm tra lỗi và tiêu chí nghiệm thu |

### Cloud, Community và bản trả phí

| Lựa chọn | Khi phù hợp | Trách nhiệm và giới hạn |
| --- | --- | --- |
| n8n Cloud | Muốn học/build mà không quản lý VPS | Chọn plan theo quota/tính năng; vẫn chịu trách nhiệm credential, dữ liệu và workflow |
| Self-hosted Community | Muốn kiểm soát máy/dữ liệu, có khả năng vận hành | Tự vá lỗi, HTTPS, backup, giám sát; không mặc định có SSO, external secrets hoặc source control environments |
| Self-hosted trả phí | Cần quản trị và tính năng tổ chức | Tính năng tùy plan/license; không thay đội vận hành |

Cloud không có nghĩa mọi API/LLM bên ngoài miễn phí. Community không có nghĩa được nhúng/bán lại n8n dưới mọi hình thức; kiểm tra [giấy phép](https://docs.n8n.io/sustainable-use-license/). Ranh giới plan có thể đổi, đối chiếu [edition](https://docs.n8n.io/hosting/community-edition-features/) và [bảng tính năng](https://n8n.io/pricing/) trước khi chọn. Các bài chính không phụ thuộc custom variables, SSO hoặc external secret stores trả phí.

## Yêu cầu trước khi bắt đầu

Biết JSON, HTTP và terminal ở mức cơ bản; các chương giải thích lại phần cần dùng. Local dùng Docker Linux containers/Compose v2; Cloud không cần Docker. Tích hợp Gmail/Sheets/Telegram/LLM cần tài khoản và credential riêng; hai bài đầu dùng API công khai không cần API key, nhưng bài 2 cần PostgreSQL do bạn quản lý.

### Mốc phiên bản và tính tương thích

Ngày đối chiếu **08/11/2026**, [trang cài Docker](https://docs.n8n.io/hosting/installation/docker/) liệt kê stable **2.46.6**, có [release tương ứng](https://github.com/n8n-io/n8n/releases/tag/n8n%402.46.6). Handbook chọn mốc này để ghim ví dụ. [Release notes](https://docs.n8n.io/release-notes/) cũng đã có 3.0; thông tin rollout/các trang có thể cập nhật khác nhịp. Không hiểu mốc 2.46.6 là khuyến nghị trì hoãn vá lỗi hoặc khẳng định mọi bản 3.x không ổn định.

Ghi `n8n --version` trên instance thật. Node có **typeVersion** riêng, không trùng phiên bản n8n. Với bản khác, tạo node mới từ editor, xem tên trường và migration trước khi áp dụng. Bản cũ có thể dùng **Active/Activate**, bản mới dùng **Publish/Unpublish**; lưu draft không đồng nghĩa thay bản production.

::: warning Chưa kiểm thử runtime n8n
Máy biên soạn có Docker CLI 27.3.1/Compose 2.30.3 nhưng daemon chưa hoạt động và chưa có instance n8n tương thích. Các thao tác editor, import workflow, lịch, webhook, OAuth, PostgreSQL và AI chưa được thực thi end-to-end. Các bài ghi kết quả mong đợi và phân biệt kiểm tra tĩnh/source với kiểm thử trên n8n. Không cung cấp file JSON tự dựng rồi gọi đó là bản export đã chạy được.
:::

**Đã kiểm tra trên môi trường biên soạn ngày 08/11/2026:** ba mô hình Compose (local, local + DB nghiệp vụ, VPS) qua `config --quiet`; cú pháp8 block JSON và34 expression; fixture JavaScript cho chuẩn hóa, validation, tool FAQ, draft AI và gate phê duyệt với context n8n giả lập. GET trực tiếp tới `/todos/1` của API demo trả200 và đúng kiểu field. Các kiểm tra này không xác nhận node UI, runner, auth, SQL, tool calling hay tác động ngoài hoạt động trên n8n.

## Cài đặt

Theo [bài Compose local](/project-guides/n8n-compose) để có editor, volume và external task runner cho Code node. Nếu chỉ muốn thử UI bằng `docker run`, dùng hướng dẫn có phạm vi cô lập tại [self-hosting](./self-hosting). Không cần cài n8n vào dependency của website handbook.

## Khởi tạo dự án

Sau khi cài local hoặc tạo workspace Cloud:

1. Mở editor, tạo tài khoản chủ sở hữu nếu self-hosted mới.
2. Tạo workflow `LAB-01 / Thông điệp đầu tiên`, thêm **Manual Trigger**.
3. Nối **Edit Fields (Set)**, Manual Mapping, trường String `message` = `Xin chào từ n8n`; chỉ giữ các trường đã đặt.
4. Execute workflow. Chọn node cuối, xem Output dạng JSON: một item có `message`.
5. Đặt tên và lưu; workflow chỉ có Manual Trigger không cần publish để chạy thủ công. Xuất từ menu editor để lưu bản thực tế sau khi rà soát secret.

Đừng bắt đầu bằng Gmail Send hoặc quyền quản trị database. [Chương nền tảng](./fundamentals) hướng dẫn UI, schedule, IF/Switch và webhook từng bước.

## Cấu hình

Giữ `N8N_VERSION=2.46.6`, `GENERIC_TIMEZONE=Asia/Ho_Chi_Minh` trong file mẫu; khóa mã hóa/token runner dùng placeholder và thay trong `.env` ngoài Git. Thư mục `/home/node/.n8n` vẫn cần persistent volume, kể cả khi database nội bộ dùng PostgreSQL. Mất khóa mã hóa có thể làm credential cũ không giải mã được.

Không dùng biến môi trường để người dùng gửi URL/SQL tùy ý. Credential bên ngoài cấu hình trong kho credential n8n. Khi xuất workflow, rà cả header hardcode, URL chứa token, pinned data, email và credential reference; JSON workflow không phải backup đầy đủ instance.

## Cấu trúc dự án

```text
n8n-labs/                  # Workspace thực hành ngoài repository handbook
├── n8n-local/             # Compose, .env.example, volume do Docker quản lý
├── workflows/             # Export thực tế đã khử dữ liệu nhạy cảm
├── fixtures/              # Payload thử không có thông tin thật
└── runbook.md             # Trigger, chủ sở hữu, lịch, lỗi và cách dừng
```

Các file JSON/SQL trong code block là dữ liệu hoặc cấu hình, không mặc nhiên là workflow import được. Từng bài có hướng dẫn dựng bằng UI và cách export/import sau khi kiểm thử.

## Lệnh thường dùng

Tại workspace `n8n-local` của [bài cài đặt](/project-guides/n8n-compose):

```sh
docker compose config --quiet
docker compose up -d
docker compose ps
docker compose logs --tail=100 n8n runners
docker compose exec n8n n8n --version
docker compose stop
```

`config --quiet` chỉ kiểm tra Compose; `ps` chỉ kiểm tra tiến trình. Kiểm tra workflow phải gồm input/output và execution thật. `stop` giữ dữ liệu; không dùng `down -v` trong cập nhật/debug.

## Thực hành tốt

- Tách fixture, credential test và credential production; thử node không có tác động phụ trước.
- Đặt hợp đồng input/output rõ ràng, kiểm tra kiểu, timezone và trường thiếu.
- Mọi hành động ghi/gửi phải có kế hoạch chống trùng và kiểm soát retry.
- Chỉ cấp quyền dịch vụ tối thiểu; bảo vệ editor, webhook và runner như các bề mặt khác nhau.
- Hạn chế execution data nhạy cảm, có retention; backup cả DB, khóa, volume và cấu hình.
- AI đưa ra đề xuất; code/SQL/rule quyết định hợp lệ và người có thẩm quyền duyệt hành động nhạy cảm.

## Xử lý lỗi

| Triệu chứng | Điểm kiểm tra | Chương xử lý |
| --- | --- | --- |
| Node xanh nhưng không có dữ liệu | Số item và nhánh IF, dữ liệu pin | [Dữ liệu](./data-and-expressions) |
| Expression lấy nhầm người dùng | Item linking và `.first()` | [Dữ liệu](./data-and-expressions) |
| API 401/403/429 | Credential, scope, quota, Retry-After | [HTTP](./http-and-apis) |
| Test webhook được, production không | URL, publish và proxy | [Thiết kế](./workflow-design) |
| Credential hỏng sau restore | Khóa mã hóa tương ứng | [Vận hành](./self-hosting) |
| Agent gọi sai tool hoặc không dừng | Schema/tool quyền rộng, giới hạn vòng lặp | [AI Agent](./ai-agents) |

## Đánh giá

Level 1 hoàn tất khi bạn tự đọc được JSON từng node, biết vì sao nhánh không có item và phân biệt test/production webhook. Level 2 hoàn tất khi dựng được ba bài, kiểm tra đường lỗi, chống trùng DB và duyệt được hành động AI với nội dung cụ thể.

**Level 3 — roadmap:** queue mode/Redis và worker; multi-main/HA theo edition; custom/community node an toàn; CI/CD và source control; secrets tập trung; RAG/vector search/evaluation quy mô lớn; tracing, disaster recovery và quản trị đa tenant. Các phần này chỉ là định hướng, không được trình bày như cấu hình triển khai đã hoàn thiện.
