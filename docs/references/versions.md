---
title: Ghi chú phiên bản
version: Handbook 1.0 · Biên soạn ngày 07/11/2026
---

# Ghi chú phiên bản

## Phiên bản nền của handbook

Handbook ghim **VitePress 1.6.4** thuộc nhánh 1.x. Dependency được cố định và `package-lock.json` ghi toàn bộ cây cài đặt. Đây là lựa chọn của repository, không phải khẳng định phiên bản mới nhất.

| Dependency | Phiên bản ghim | Vai trò |
| --- | --- | --- |
| VitePress | 1.6.4 | Website tài liệu tĩnh và tìm kiếm trên máy |
| Vue | 3.5.45 | Component trang chủ và đường dẫn điều hướng |
| TypeScript | 5.7.3 | Kiểm tra cấu hình và component |
| vue-tsc | 3.3.14 | Kiểm tra TypeScript trong Vue |
| Vite override | 6.4.5 | Dependency phục vụ development và build |
| Node typings | 22.10.5 | Khai báo API Node lúc build |

Node.js **22.12+** là yêu cầu nền của repository. Dùng bản LTS còn được hỗ trợ đáp ứng dải này. Kiểm tra phiên bản thực tế bằng `node --version` và `npm --version`; kết quả build chỉ áp dụng cho môi trường đã chạy kiểm tra.

## Lý do có Vite override

VitePress 1.6.4 khai báo dependency Vite 5; repository override sang **6.4.5**. Cấu hình này nằm ngoài dải Vite mà VitePress 1.x khai báo. Khi đổi override phải kiểm tra kiểu, build production và tìm kiếm. Không suy ra mọi plugin VitePress bên ngoài đều tương thích.

Dữ liệu lỗ hổng thay đổi theo thời gian; chạy `npm audit` trước khi đánh giá bảo mật hoặc cập nhật dependency. Người đọc nhận tài nguyên tĩnh; server development không phải dịch vụ production.

## Chính sách phiên bản trong ví dụ

| Phạm vi | Phiên bản nền / hành vi |
| --- | --- |
| React + Vite | Scaffold `react-ts` chính thức với `@latest`; kiểm tra engine được tạo |
| TypeScript độc lập | Compiler major 5, cấu hình ESM NodeNext |
| Ví dụ Node | Node 22.12+; nạp môi trường và watch tích hợp |
| Ví dụ Express | Chỉ định major 5 |
| Bài database | `pg@8`, `postgres:17`, đường dẫn volume phiên bản 17 |
| Bài Next.js | create-next-app với App Router; ESLint CLI được cài |
| Docker | Compose v2 (`docker compose`), không dùng khóa `version` cũ |
| n8n trên máy | Lần đầu dùng tag `latest` biến động; ghi và ghim phiên bản thực tế |
| Prisma | Trang đang biên soạn dẫn tài liệu theo major; không hướng dẫn cài bản RC |

Lệnh scaffold là điểm bắt đầu, không bảo đảm mọi phiên bản tương lai có cùng hành vi. Công cụ mới có thể đổi câu hỏi, yêu cầu hoặc file. Đọc ghi chú migration chính thức thay vì bỏ qua chẩn đoán.

## Phạm vi nội dung

**Hướng dẫn nhập môn:** React, TypeScript, Node.js, Express.js, Docker, n8n. Các trang theo cấu trúc chung và có bước xác nhận kết quả.

**Đang biên soạn:** JavaScript, Next.js, PostgreSQL, Prisma, Git & GitHub. Các trang có yêu cầu, ranh giới cấu hình, lệnh khởi đầu và bước tiếp theo; chưa có mức chi tiết như hướng dẫn đầy đủ.

Năm bài dự án có ví dụ triển khai, quy ước môi trường, cách kiểm tra, lỗi thường gặp và kết quả mong đợi. Đây là hướng dẫn tạo dự án riêng; repository chứa website tài liệu, không chứa năm ứng dụng được tạo sẵn.

## Giới hạn xác minh

Build website kiểm tra liên kết trang nội bộ; bộ kiểm tra repository còn kiểm tra anchor và mục chuẩn. `npm run typecheck` kiểm tra kiểu component/cấu hình riêng. Chỉ mục tìm kiếm được tạo trong build production.

Các lệnh kiểm tra có sẵn gồm `npm run check`, `npm run typecheck`, `npm run build` và `npm run verify`. `verify` kiểm tra tài nguyên điều hướng, anchor, markup sao chép code, CSS responsive và truy vấn với công cụ tìm kiếm của VitePress, gồm cả lỗi gõ. Đặt `SITE_ORIGIN` khi muốn kiểm tra HTTP trên server preview đang chạy. Chỉ ghi nhận thành công khi lệnh thực tế hoàn tất.

Kiểm tra file tĩnh và công cụ tìm kiếm chưa xác nhận thao tác giao diện. Cần kiểm tra trình duyệt cho bố cục, viewport, nút sao chép và tương tác bàn phím trong hộp tìm kiếm.

**Chưa kiểm thử:** các ví dụ ứng dụng trong bài công nghệ và dự án chưa được cài đặt, chạy đầy đủ trong đợt chỉnh sửa này. Kiểm tra website không xác nhận các stack đó hoạt động. Bài Docker cần Docker trên máy người đọc. Bộ kiểm tra offline không xác nhận liên kết ngoài còn truy cập được.

## Cập nhật an toàn

1. Tạo branch và ghi kết quả build hiện tại.
2. Đọc release note, yêu cầu engine và cấu hình Vite override.
3. Cập nhật manifest và lockfile cùng nhau.
4. Chạy `npm run check`, `npm run typecheck`, `npm run build` và `npm run verify`.
5. Preview trên desktop và di động, mở tìm kiếm, sao chép một khối code.
6. Cập nhật trang này và các ví dụ bị ảnh hưởng.

**Nguồn chính thức:** [VitePress 1.x](https://vuejs.github.io/vitepress/v1/) · [Chính sách phát hành Vite](https://vite.dev/releases) · [Các bản Node](https://nodejs.org/en/about/previous-releases).
