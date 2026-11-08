---
title: Git & GitHub
version: Git 2.x · Cộng tác trên GitHub
status: starter
---

# Git & GitHub

::: warning Chưa kiểm thử
Ví dụ ứng dụng trong bài chưa được cài đặt và chạy đầy đủ trong đợt chỉnh sửa này. Các bước dưới đây là hướng dẫn thực hành và kết quả mong đợi; kiểm tra build của website không xác nhận ứng dụng mẫu hoạt động.
:::

::: info Đang biên soạn
Trang cung cấp nội dung khởi đầu theo cấu trúc chung. Ví dụ chi tiết và phần xử lý lỗi mở rộng còn đang biên soạn. Xem các bài liên quan để thực hành có đầy đủ ngữ cảnh.
:::

## Tổng quan

Git ghi lịch sử source trên máy; GitHub lưu repository và hỗ trợ cộng tác. Dùng branch và commit đã rà soát để thay đổi dễ hiểu và khôi phục được.

## Yêu cầu trước khi bắt đầu

Cài Git, cấu hình danh tính commit. Chỉ cần tài khoản GitHub khi đẩy lên GitHub; commit trên máy không cần tài khoản.

## Cài đặt

Cài từ [git-scm.com](https://git-scm.com/downloads). Chạy `git --version` trong terminal mới. Đặt tên, email của bạn ở phạm vi repository hoặc toàn cục tùy nhu cầu.

## Khởi tạo dự án

Tại gốc dự án mới, chạy `git init`, tạo `.gitignore`, stage file cụ thể và commit. Cấu hình remote bằng URL repository bạn sở hữu.

## Cấu hình

Dùng `.gitignore` cho dependency, bản build và `.env`. Danh tính Git là metadata commit, không phải thông tin xác thực; dùng quy trình xác thực GitHub hỗ trợ khi push.

## Cấu trúc dự án

Theo dõi source, tài liệu, ví dụ và lockfile. Giữ credential, cache, volume database và file sinh ra lớn ngoài Git.

## Lệnh thường dùng

Chạy trong thư mục dự án đã khởi tạo, sau khi hoàn thành thiết lập được liên kết:

```sh
git status
git switch -c docs/update-guide
git diff
git add README.md
git diff --cached
git commit -m "docs: update setup instructions"
```

## Thực hành tốt

Đọc diff đã stage, viết commit nhỏ có mục đích và xem thay đổi upstream trước khi công bố branch. Không đưa token vào URL remote.

## Xử lý lỗi

Push bị từ chối: fetch và xem thay đổi remote trước khi tích hợp. Lỡ đưa secret vào Git: thu hồi secret trước, rồi làm theo hướng dẫn xóa khỏi lịch sử của nhà cung cấp; chỉ xóa file hiện tại là chưa đủ.

## Đánh giá

Lịch sử và branch trên máy linh hoạt. Viết lại lịch sử đã chia sẻ cần thống nhất với nhóm; ưu tiên commit sửa bổ sung cho nội dung đã công bố.

**Nguồn chính thức:** [Sách Git](https://git-scm.com/book/en/v2). **Liên quan:** [Tài liệu GitHub](https://docs.github.com/en) · [Lệnh thường dùng](/references/quick-commands).

