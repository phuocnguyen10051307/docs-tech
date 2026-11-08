# Developer Handbook

Kho kiến thức phát triển cá nhân sử dụng VitePress, Markdown, TypeScript và CSS tùy chỉnh. Website xuất thành file tĩnh, có tìm kiếm toàn văn tại trình duyệt và không cần backend.

## Chạy trên máy cá nhân

Dùng Node.js LTS còn được hỗ trợ, đáp ứng **22.12+**, cùng npm và Git. Tại thư mục gốc repository:

```sh
npm ci
npm run dev
```

Mở URL VitePress hiển thị (thường là `http://127.0.0.1:5173`). Dừng bằng Ctrl+C. Mở tìm kiếm bằng nút tìm kiếm hoặc Ctrl+K / Cmd+K.

## Kiểm tra và build

```sh
npm run check
npm run typecheck
npm run build
npm run verify
npm run preview
```

`check` kiểm tra liên kết Markdown, anchor, các mục chuẩn, ID tiêu đề trùng và đích trong danh mục. `typecheck` kiểm tra component Vue và cấu hình TypeScript. `build` kiểm tra nội dung, liên kết hỏng, kết xuất trang và tạo chỉ mục tìm kiếm. `verify` kiểm tra trang đã build, tài nguyên, anchor, truy vấn tìm kiếm (có lỗi gõ) và thành phần giao diện. `preview` phục vụ bản build tại URL được hiển thị, thường ở cổng 4173.

Để kiểm tra mọi route qua HTTP, chạy `verify` với `SITE_ORIGIN=http://127.0.0.1:4173` trong terminal thứ hai khi preview đang chạy. Đặt biến môi trường theo cú pháp shell đang dùng. Kiểm tra file đã build cần đi kèm kiểm tra hiển thị và tương tác trong trình duyệt.

Kết quả triển khai nằm tại **`dist/`** ở thư mục gốc. Hosting tĩnh cần phục vụ HTML và tài nguyên trong thư mục này; website đã xuất không cần Node server. Không dùng server development/preview làm dịch vụ production.

Khi triển khai dưới đường dẫn như `/developer-handbook/`, đặt `DOCS_BASE` lúc build:

```bash
# Bash
DOCS_BASE=/developer-handbook/ npm run build
```

```powershell
# PowerShell, tại gốc repository
$env:DOCS_BASE = '/developer-handbook/'
npm run build
Remove-Item Env:DOCS_BASE
```

Dùng dấu `/` ở đầu và cuối. Với Pages theo repository, tải `dist/` lên bằng quy trình triển khai file tĩnh của nhà cung cấp và dùng đường dẫn repository làm base. Preview với cùng base để kiểm tra. Triển khai tại tên miền gốc dùng mặc định `/`.

## Nội dung hiện có

- Sidebar, mục lục bên phải, menu di động, đường dẫn điều hướng và chế độ sáng/tối.
- Trang chủ có bộ lọc cho 11 công nghệ, mười hướng dẫn dự án và tài liệu tra cứu nhanh.
- Tìm kiếm tại trình duyệt từ Markdown, tô màu cú pháp và nút sao chép code.
- Hướng dẫn nhập môn cho React, TypeScript, Node.js, Express, Docker và n8n.
- Các trang đang biên soạn được đánh dấu rõ cho JavaScript, Next.js, PostgreSQL, Prisma và Git & GitHub.
- Mười hướng dẫn dự án có cấu hình môi trường mẫu, danh sách kiểm tra, ghi chú phiên bản và nguồn chính thức; các ví dụ ứng dụng chưa kiểm thử được ghi rõ trên trang.
- Mẫu tài liệu tái sử dụng cho công nghệ và dự án.

## Cấu trúc thư mục

```text
developer-handbook/               # Gốc repository này (tên thư mục trên máy có thể khác)
├── docs/
│   ├── .vitepress/
│   │   ├── config.ts             # Điều hướng, tìm kiếm, Markdown, base và đầu ra
│   │   ├── catalog.ts            # Danh mục công nghệ và dự án dùng chung
│   │   └── theme/                # Trang chủ Vue, đường dẫn điều hướng và CSS
│   ├── index.md
│   ├── getting-started.md
│   ├── technologies/
│   │   ├── react/                # Mỗi công nghệ có index.md
│   │   ├── typescript/
│   │   ├── javascript/
│   │   ├── nodejs/
│   │   ├── express/
│   │   ├── nextjs/
│   │   ├── docker/
│   │   ├── postgresql/
│   │   ├── prisma/
│   │   ├── n8n/
│   │   └── git/
│   ├── project-guides/           # Trang danh mục và mười bài thực hành
│   ├── references/               # Lệnh, lỗi, phiên bản và quy ước biên soạn
│   └── public/                   # Favicon và tài nguyên tĩnh
├── templates/                    # Mẫu biên soạn để sao chép, không xuất bản
├── scripts/                    # Kiểm tra source và website đã build
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

## Bổ sung nội dung

Sao chép `templates/technology.md` vào `docs/technologies/tool-name/index.md`, hoàn thiện các mục phù hợp và thêm công nghệ vào `docs/.vitepress/catalog.ts`. Sidebar và trang chủ dùng chung danh mục này. Với hướng dẫn dự án, sao chép `templates/project-guide.md` vào `docs/project-guides/` và thêm mục tương ứng vào danh mục.

Dùng liên kết Markdown từ gốc website (`/technologies/react/`), ghi thư mục chạy lệnh, cách xác nhận kết quả và xử lý lỗi. Đặt biến mẫu trong khối `.env.example` với giá trị giả. Handbook không cần secret để hoạt động. Xem [quy ước biên soạn](docs/references/contributing.md) và [quy tắc repository](AGENTS.md).

## Bộ công cụ và giới hạn kiểm tra

Repository ghim VitePress **1.6.4**, Vue **3.5.45**, vue-tsc **3.3.14** và override Vite **6.4.5**. Override này nằm ngoài dải Vite 5 mà VitePress 1.x khai báo; kết quả build chỉ phản ánh repository hiện tại. Đọc [ghi chú phiên bản](docs/references/versions.md) trước khi nâng cấp hoặc thêm plugin. Trạng thái lỗ hổng phụ thuộc thời điểm kiểm tra; chạy lại `npm audit` khi cần đánh giá.

Các kiểm tra xác nhận website tài liệu, chưa xác nhận từng ứng dụng trong bài hướng dẫn. Bộ kiểm tra offline không truy cập liên kết ngoài. Các trang đang biên soạn chưa có mức chi tiết như hướng dẫn đầy đủ. Cần rà soát và ghim scaffold `@latest` trước khi dùng cho dự án cần tái lập; phần n8n đã chọn mốc image/runner cụ thể và nêu giới hạn kiểm thử.

Git đã được khởi tạo tại máy. Chạy handbook không cần remote, triển khai, hệ thống tài khoản hoặc cơ sở dữ liệu.
