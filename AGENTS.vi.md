# AGENTS.md — Developer Handbook (Bản tiếng Việt)

## 1. Mục đích dự án

Repository này chứa **Developer Handbook**, một website tài liệu kỹ thuật cá nhân sử dụng VitePress và Markdown. Đây là nơi tra cứu thực tế để học, cài đặt, cấu hình, chạy, bảo trì và xử lý lỗi của các công cụ cũng như các bộ công nghệ dùng để xây dựng dự án.

**Đây là website tài liệu, không phải công cụ tự động tạo dự án hay CLI.** Không thêm backend, cơ sở dữ liệu, hệ thống đăng nhập hoặc chức năng tự động tạo dự án khi chưa được yêu cầu rõ ràng.

## 2. Ngôn ngữ và thuật ngữ

- Viết toàn bộ tài liệu, hướng dẫn, cách xử lý lỗi, đánh giá, menu, nhãn và nội dung giao diện dành cho người đọc bằng **tiếng Việt**.
- Trả lời chủ repository bằng **tiếng Việt**, bao gồm kế hoạch, tóm tắt thay đổi và kết quả kiểm tra.
- Giữ nguyên code, câu lệnh, tên package, tên file, đường dẫn, biến môi trường, khóa cấu hình, API endpoint và các định danh kỹ thuật.
- Có thể giữ thuật ngữ tiếng Anh phổ biến nếu dễ hiểu hơn, ví dụ component, hook, middleware, container, image, dependency. Giải thích bằng tiếng Việt khi thuật ngữ còn lạ.
- Ưu tiên comment tiếng Việt trong các ví dụ code tự viết nếu giúp người đọc hiểu hơn; không dịch máy móc code bên thứ ba hay cú pháp máy cần xử lý.
- Ưu tiên tiếng Việt tự nhiên, chính xác, tránh dịch từng từ một.

## 3. Quy ước repository

- Nguồn tài liệu: `docs/`.
- Hướng dẫn theo công nghệ: `docs/technologies/<technology>/`.
- Hướng dẫn dự án kết hợp nhiều công nghệ: `docs/project-guides/`.
- Câu lệnh, lỗi và nội dung tra cứu dùng chung: `docs/references/`.
- Cấu hình/giao diện VitePress: `docs/.vitepress/`.
- Ưu tiên Markdown (`.md`) cho tài liệu. Chỉ dùng component Vue/VitePress hoặc TypeScript khi thật sự cần chức năng tái sử dụng.
- Tuân theo quy ước sẵn có trước khi đề xuất cấu trúc mới.
- Dùng chữ thường và dấu gạch nối cho tên file/thư mục tài liệu mới, trừ khi dự án đã có quy ước khác.
- Đồng bộ liên kết nội bộ, navigation và sidebar của VitePress với các trang thực tế.

## 4. Cấu trúc hướng dẫn cho từng công nghệ

Khi phù hợp, nội dung cần gồm:

1. **Tổng quan:** Công nghệ là gì, vai trò và khi nào nên dùng.
2. **Yêu cầu trước khi bắt đầu:** Phần mềm, giả định về hệ điều hành và phiên bản tương thích.
3. **Cài đặt:** Câu lệnh theo đúng thứ tự và thư mục cần chạy lệnh.
4. **Khởi tạo dự án:** Ví dụ tối thiểu chạy được từ thư mục trống.
5. **Cấu hình:** Giải thích các file, tùy chọn và biến môi trường quan trọng.
6. **Cấu trúc dự án:** Cây thư mục và vai trò của các file chính.
7. **Câu lệnh thường dùng:** Có thể sao chép, kèm giải thích ngắn.
8. **Kiểm tra kết quả:** Cần chạy gì và dấu hiệu thành công là gì.
9. **Xử lý lỗi:** Triệu chứng, nguyên nhân có thể xảy ra, cách sửa và cách kiểm tra lại.
10. **Thực hành tốt và đánh giá:** Ưu nhược điểm, giới hạn, tình huống sử dụng và nguồn chính thức.

Không tạo mục rỗng cho những phần không phù hợp. Ưu tiên tài liệu ngắn gọn nhưng hữu ích thay vì dài và sơ sài.

## 5. Tiêu chuẩn hướng dẫn dự án

Mỗi hướng dẫn kết hợp nhiều công nghệ cần nêu kết quả mong muốn, stack sử dụng, điều kiện cần, trình tự setup chính xác, thư mục chạy lệnh, cấu hình môi trường mẫu, lệnh khởi chạy, bước kiểm tra và lỗi thường gặp. Liên kết đến tài liệu của từng công nghệ thay vì sao chép lại nhiều nội dung.

Phân biệt rõ **môi trường phát triển local**, **kiểm thử** và **triển khai production**. Nếu hướng dẫn khác nhau theo hệ điều hành hoặc shell, phải ghi rõ (ví dụ Windows PowerShell và macOS/Linux Bash).

## 6. Độ chính xác kỹ thuật và nguồn tham khảo

- Ưu tiên tài liệu chính thức và nguồn gốc đáng tin cậy; dẫn link đến đúng trang liên quan.
- Kiểm tra câu lệnh, phiên bản package và khả năng tương thích hiện tại khi có thể truy cập nguồn; không mặc định hướng dẫn cũ còn đúng.
- Ghi rõ giả định về phiên bản khi cần; không ghi một phiên bản "mới nhất" nếu chưa xác minh.
- Không tự bịa câu lệnh, tham số, API, thông báo lỗi, số liệu đo đạc hoặc nguồn trích dẫn.
- Đánh dấu ví dụ chưa chạy thử là **"Chưa kiểm thử"**; không mô tả là đã xác minh.
- Giải thích *vì sao* dùng các câu lệnh quan trọng và cách biết mỗi bước chính đã thành công.
- Không tạo các trang chỉ có nội dung placeholder rồi báo hoàn thành tài liệu; đánh dấu phần chưa viết là **"Đang biên soạn"**.
- Dùng liên kết tham chiếu thay vì lặp lại các phần giải thích hoặc gây mâu thuẫn giữa nhiều trang.

## 7. Bảo mật và ví dụ an toàn

- Không commit hoặc hiển thị secret, thông tin đăng nhập, token, private key hay dữ liệu cá nhân thật.
- Dùng `.env.example` với giá trị mẫu không nhạy cảm và không đưa `.env` vào Git.
- Ưu tiên nguyên tắc phân quyền tối thiểu và cấu hình an toàn mặc định. Không hướng dẫn mở công khai dashboard quản trị hay cơ sở dữ liệu lên Internet như một mặc định bình thường.
- Với hướng dẫn n8n, Docker, PostgreSQL và deployment, giải thích lưu trữ bền vững, backup, quản lý secret và nguy cơ mở cổng mạng khi liên quan.
- Cảnh báo rõ trước các lệnh có thể xóa dữ liệu (ví dụ xóa volume, reset database, force delete) và mô tả hậu quả.
- Phân biệt cấu hình chỉ dành cho demo với khuyến nghị production.

## 8. Giao diện và khả năng tiếp cận

- Giữ giao diện tài liệu gọn, responsive, dễ đọc và hỗ trợ light/dark mode.
- Dùng tiêu đề rõ ràng, cấp heading hợp lý, link dễ hiểu và khối code có tô màu cú pháp, dễ sao chép.
- Dùng nhãn giao diện tiếng Việt; giữ sidebar, mục lục, tìm kiếm và liên kết chéo nhất quán.
- Tránh animation, dependency và giao diện tùy biến phức tạp không cần thiết nếu VitePress đã có chức năng phù hợp.

## 9. Quy trình thực hiện

**Trước khi sửa**
1. Kiểm tra phần cần làm, các file `AGENTS.md` liên quan, cấu hình hiện tại và tài liệu lân cận.
2. Xác định thay đổi nhỏ nhất có thể đáp ứng yêu cầu.
3. Tái sử dụng cách làm đang có; không refactor phần không liên quan.

**Trong khi sửa**
1. Giữ thay đổi đúng phạm vi, dễ bảo trì.
2. Cập nhật liên kết, navigation hoặc tài liệu tham chiếu khi thêm hay đổi tên trang.
3. Không ghi đè tài liệu đáng kể đang có mà chưa hiểu mục đích của nó.
4. Không thêm dependency nếu không có lý do kỹ thuật rõ ràng.

**Sau khi sửa**
1. Chạy các kiểm tra phù hợp đang có. Nếu sửa cấu trúc website hoặc navigation, chạy `npm run build` nếu script này tồn tại.
2. Kiểm tra link hỏng, hiển thị Markdown và các câu lệnh ví dụ có thể kiểm thử an toàn.
3. Không báo kiểm tra thành công nếu thực tế chưa chạy hoặc đã thất bại.
4. Tóm tắt kết quả và giới hạn bằng tiếng Việt.

## 10. Báo cáo hoàn thành

Trả lời bằng tiếng Việt với các phần ngắn gọn khi phù hợp:

- **Đã thực hiện:** Những thay đổi đã làm.
- **File liên quan:** File quan trọng đã tạo hoặc sửa.
- **Kiểm tra:** Lệnh đã chạy và kết quả thực tế.
- **Còn tồn tại:** Phần chưa xác minh, giới hạn hoặc bước tiếp theo.

Những quy tắc này áp dụng cho toàn repository trừ khi có file `AGENTS.md` ở thư mục con bổ sung hướng dẫn cụ thể hơn. Các hướng dẫn có độ ưu tiên cao hơn luôn được áp dụng trước.
