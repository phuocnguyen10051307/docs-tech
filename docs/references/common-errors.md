---
title: Lỗi thường gặp và cách xử lý
version: Chẩn đoán trước · bảo toàn dữ liệu
---

# Lỗi thường gặp và cách xử lý

Đọc **lỗi có ý nghĩa đầu tiên**, ghi lại câu lệnh và thư mục hiện tại, kiểm tra log dịch vụ trước khi cài lại mọi thứ. Các cách sửa dưới đây giả định bạn quản lý các tiến trình thực hành trên máy.

## Không tìm thấy lệnh

**Triệu chứng:** không gọi được `node`, `npm`, `git` hoặc `docker`.

**Nguyên nhân có thể:** chưa cài, PATH chưa cập nhật hoặc terminal dùng môi trường khác.

**Kiểm tra:** mở lại terminal và chạy lệnh xem phiên bản. PowerShell dùng `Get-Command node`; Bash dùng `command -v node` để tìm chương trình đang được gọi. WSL và Windows có thể có bản cài riêng.

**Cách sửa:** hoàn tất cài đặt theo nguồn chính thức rồi kiểm tra lại. Tránh cài cùng công cụ bằng nhiều cách cạnh tranh nhau.

## Engine không tương thích / EBADENGINE

**Nguyên nhân có thể:** Node đang dùng cũ hơn yêu cầu engine của package.

**Kiểm tra:** so sánh `node --version` với dải phiên bản package hỗ trợ, thay vì chỉ dựa vào phiên bản đã định cài.

**Cách sửa:** chọn Node còn được hỗ trợ và mở lại shell. Handbook yêu cầu Node 22.12+; dự án mới tạo có thể yêu cầu cao hơn. Không tắt kiểm tra engine làm cách sửa đầu tiên.

## EADDRINUSE / cổng đã được sử dụng

**Nguyên nhân có thể:** server khác đang chiếm cổng yêu cầu.

**Kiểm tra:** xem các terminal trước đó và `docker compose ps`. Trong PowerShell có thể dùng `Get-NetTCPConnection -LocalPort 3000` nếu được hỗ trợ.

**Cách sửa:** dừng server thực hành trước đó bằng Ctrl+C, hoặc đổi cổng ứng dụng cùng proxy/URL tương ứng. Với Docker, chỉ phía **trái** của `3001:3000` là cổng trên máy. Không dừng tiến trình không liên quan chỉ để giải phóng cổng.

## npm ci lỗi do lockfile không khớp

**Nguyên nhân có thể:** `package.json` thay đổi nhưng lockfile chưa đổi, hoặc đang ở sai thư mục.

**Kiểm tra:** xem `git diff -- package.json package-lock.json` và xác định đúng thư mục gốc dự án.

**Cách sửa:** nếu chủ động đổi dependency, chạy `npm install`, xem cả hai file và commit cùng nhau. Nếu đổi nhầm, khôi phục manifest dự kiến trước khi chạy `npm ci`. Xóa lockfile làm mất khả năng tái lập nên không phải cách sửa mặc định.

## Cannot use import / require is not defined

**Nguyên nhân có thể:** trộn quy ước ESM với CommonJS.

**Kiểm tra:** xem trường `type` trong `package.json` gần nhất và phần mở rộng file. `.mjs` là ESM; `.cjs` là CommonJS.

**Cách sửa:** theo [khởi tạo Node.js](/technologies/nodejs/#khoi-tao-du-an). Với TypeScript Node ESM, dùng NodeNext và đuôi `.js` của file đầu ra trong import tương đối. Bundler trình duyệt có quy tắc phân giải khác.

## Biến môi trường có giá trị undefined

**Nguyên nhân có thể:** sai vị trí file, thiếu bước nạp, tiến trình chưa khởi động lại hoặc sai quy tắc tiền tố của frontend.

**Kiểm tra:** xác nhận thư mục và tên biến mà không in secret. Ví dụ Node nạp `.env` rõ ràng; script production chờ biến được cấp lúc chạy. Vite chỉ đưa biến `VITE_` ra code trình duyệt.

**Cách sửa:** tạo file từ `.env.example`, khởi động lại tiến trình và dùng API truy cập phù hợp. Không sửa URL database riêng bằng cách thêm tiền tố frontend công khai.

## Lỗi CORS trên trình duyệt

**Nguyên nhân có thể:** frontend và API khác origin, API chưa cho phép origin đó.

**Kiểm tra:** so sánh giao thức, host và cổng; xem request lỗi trong công cụ phát triển của trình duyệt.

**Cách sửa:** dùng [proxy Vite](/project-guides/react-express-postgresql#_3-ket-noi-client) khi development. Trong production, dùng chung origin hoặc cấu hình rõ origin được phép. CORS không thay thế phân quyền.

## Database từ chối kết nối hoặc xác thực thất bại

**Kiểm tra:** `docker compose ps`, log database và host/cổng trong môi trường API. Tiến trình trên máy dùng `localhost` với cổng đã mở; container cùng mạng dùng `db:5432`.

**Cách sửa:** chờ database sẵn sàng trước khi chạy API. Đảm bảo credential khớp với **database đã khởi tạo**, không chỉ `.env` mới nhất. Volume bền vững giữ người dùng ban đầu. Không xóa volume như cách sửa xác thực chung.

## Bảng dữ liệu không tồn tại

**Nguyên nhân có thể:** SQL khởi tạo không chạy do đã có volume hoặc chưa áp dụng migration.

**Kiểm tra:** xem bảng bằng `docker compose exec db psql -U handbook -d handbook -c "\dt"` tại dự án thực hành.

**Cách sửa:** rà soát và áp dụng schema hoặc migration vào đúng database. Script khởi tạo không phải hệ thống migration. Chỉ tạo lại storage khi chủ động chấp nhận mất toàn bộ dữ liệu thực hành.

## Container không truy cập được dịch vụ localhost

Trong container, `localhost` chỉ chính container đó. Dùng tên service Compose cho dịch vụ khác hoặc host gateway được nền tảng hỗ trợ khi truy cập dịch vụ trên máy. Kiểm tra dịch vụ đích lắng nghe trên giao diện mạng có thể truy cập. Xem [xử lý lỗi Docker](/technologies/docker/#xu-ly-loi).

## React chạy development nhưng build lỗi

Vite có thể phục vụ code đã chuyển đổi trước khi kiểm tra kiểu đầy đủ. Chạy `npm run build` tại gốc ứng dụng và sửa lỗi kiểu được báo. Xem script build thực tế vì mỗi template có thể dùng kiểm tra khác nhau.

## Mất workflow hoặc credential n8n sau khởi động lại

Kiểm tra tên dự án Compose, named volume và thông tin mã hóa gốc. Đổi thư mục/tên dự án có thể tạo volume khác. Khôi phục credential cần khóa tương ứng, chỉ JSON workflow là chưa đủ. Xem [cấu hình n8n](/technologies/n8n/#cau-hinh).

## Liên kết handbook lỗi khi build

Chạy `npm run check` tại gốc handbook để xác định trang nguồn và đích. Dùng `/technologies/react/` cho trang công nghệ và ID tiêu đề chính xác cho anchor. Sau khi sửa, chạy `npm run build`; VitePress cũng từ chối liên kết trang hỏng.

**Liên quan:** [Lệnh thường dùng](/references/quick-commands) · [Bắt đầu](/getting-started) · [Ghi chú phiên bản](/references/versions).
