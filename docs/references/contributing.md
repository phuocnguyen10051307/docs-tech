---
title: Biên soạn tài liệu
version: Quy ước nội dung · Handbook 1.0
---

# Biên soạn tài liệu

Mỗi trang cần hữu ích ngay khi người đọc muốn tra lệnh. Giải thích thư mục, yêu cầu, thao tác và kết quả mong đợi. Viết bằng tiếng Việt theo `AGENTS.md` tại gốc repository, giữ nguyên định danh kỹ thuật. Ví dụ chưa chạy phải ghi **Chưa kiểm thử**.

## Thêm công nghệ

1. Sao chép `templates/technology.md` tại gốc vào `docs/technologies/your-tool/index.md`.
2. Hoàn thiện các mục phù hợp và thay nội dung mẫu. Thêm frontmatter `title`, `version`, `status` (`guide` hoặc `starter`). Không tạo mục rỗng cho phần không áp dụng.
3. Thêm mục vào `docs/.vitepress/catalog.ts`. Sidebar và trang chủ đọc cùng danh mục, không cần thay cấu trúc giao diện.
4. Liên kết hướng dẫn dự án phù hợp và tài liệu chính thức.
5. Chạy các kiểm tra dưới đây, xem trang ở cả hai chế độ sáng/tối.

Dùng tên thư mục ngắn, chữ thường, kebab-case. Đánh dấu nội dung chưa hoàn thiện bằng `status: starter`, `starter: true` trong danh mục và thông báo **Đang biên soạn** để người đọc biết phạm vi trước khi mở.

## Thêm hướng dẫn dự án

Sao chép `templates/project-guide.md` tại gốc vào `docs/project-guides/your-guide.md`. Thêm mục vào `projectGuides` trong danh mục. Dùng các mục chuẩn theo thứ tự và đưa đủ file cần để tái lập kết quả, hoặc liên kết rõ bài tiên quyết tạo các file đó.

Liên kết phần giải thích sâu về công nghệ thay vì sao chép lại, nhưng giữ trình tự thực hiện trong bài đủ rõ để làm theo.

## Quy ước câu lệnh

- Ghi thư mục thực hiện ngay trước khối lệnh.
- Giải thích lệnh khó hiểu sẽ tạo hoặc thay đổi gì.
- Gắn nhãn cú pháp chỉ dùng trong Bash; thêm lệnh PowerShell tương ứng khi sao chép file.
- Dùng giá trị giả trong `.env.example`, nêu rõ phần cần thay.
- Đặt đường dẫn file phía trên khối code; cung cấp ví dụ tối thiểu đầy đủ.
- Phân biệt preview trên máy, dịch vụ development và triển khai production.
- Ghi phiên bản khi câu lệnh hoặc đường dẫn lưu trữ phụ thuộc phiên bản.
- Ưu tiên tài liệu chính thức; ghi ngày rà soát trong ghi chú phiên bản khi thay nền tảng.

## Liên kết và điều hướng

Dùng liên kết từ gốc website như `/technologies/nodejs/` và `/project-guides/docker-nodejs`. VitePress áp dụng base triển khai cho liên kết Markdown. Component tùy chỉnh cần gọi `withBase()` khi tạo URL. Không dùng đường dẫn file hệ thống làm URL trình duyệt.

Đặt nhãn liên kết và tiêu đề có ý nghĩa. Mỗi trang có một H1; các mục H2 tạo mục lục bên phải.

## Xác nhận thay đổi

Từ thư mục gốc repository:

```sh
npm run check
npm run typecheck
npm run build
npm run preview
```

Bộ kiểm tra rà soát mục chuẩn, tiêu đề trùng, liên kết Markdown, anchor và đích trong danh mục. Build production từ chối liên kết trang hỏng và tạo chỉ mục tìm kiếm toàn văn. Các bước này không chạy lệnh của bài hướng dẫn hay kiểm tra dịch vụ ngoài.

## Danh sách rà soát

- [ ] Thư mục bắt đầu và phiên bản công cụ rõ ràng.
- [ ] Bài giải thích đủ source file và ví dụ môi trường cần dùng.
- [ ] Câu lệnh được sắp theo thứ tự thực thi.
- [ ] Người đọc có thể xác nhận thành công và nhận biết lỗi thường gặp.
- [ ] Ví dụ, URL và ảnh chụp không chứa secret.
- [ ] Có liên kết trang liên quan và nguồn chính thức.
- [ ] Nội dung mới tìm được trong preview production.
- [ ] Giao diện di động và điều hướng bàn phím dùng được.
