from pathlib import Path

comments = {
    'PowerShell, from repository root': 'PowerShell, tại gốc repository',
    'This repository root (local folder may differ)': 'Gốc repository này (tên thư mục trên máy có thể khác)',
    'Navigation, search, Markdown, base, output': 'Điều hướng, tìm kiếm, Markdown, base và đầu ra',
    'Shared technology and project registry': 'Danh mục công nghệ và dự án dùng chung',
    'Vue homepage, breadcrumbs, and custom CSS': 'Trang chủ Vue, đường dẫn điều hướng và CSS',
    'Each technology has index.md': 'Mỗi công nghệ có index.md',
    'Index plus five tutorials': 'Trang danh mục và năm bài thực hành',
    'Commands, errors, versions, authoring': 'Lệnh, lỗi, phiên bản và quy ước biên soạn',
    'Favicon and static assets': 'Favicon và tài nguyên tĩnh',
    'Copyable authoring templates, not published': 'Mẫu biên soạn để sao chép, không xuất bản',
    'Source and generated-site verification': 'Kiểm tra source và website đã build',
    'Moving tag for a first local run. Replace with a reviewed exact version afterward.': 'Tag biến động cho lần chạy đầu; sau đó thay bằng phiên bản cụ thể đã rà soát.',
    'Ignored local settings': 'Cấu hình trên máy, không đưa vào Git',
    'Reviewed exports, not a complete backup': 'Bản xuất đã rà soát, không phải backup đầy đủ',
    'Reviewed JSON exports; no credentials': 'JSON xuất đã rà soát, không có credential',
    'React source and Vite config': 'Source React và cấu hình Vite',
    'Only if configuration is needed': 'Chỉ thêm khi cần cấu hình',
    'Optional custom application': 'Ứng dụng tùy chỉnh nếu cần',
    'Current project containers': 'Container của dự án hiện tại',
    'Follow logs; Ctrl+C only exits log view': 'Theo dõi log; Ctrl+C chỉ thoát chế độ xem log',
    'Stop but retain containers': 'Dừng và giữ container',
    'Start/reconcile services': 'Khởi chạy hoặc cập nhật dịch vụ',
    'Remove project containers and network': 'Xóa container và mạng của dự án',
    'Locally cached images': 'Image lưu trên máy',
    'Named volumes': 'Volume có tên',
    'HTTP contracts': 'Hợp đồng HTTP',
    'Domain logic': 'Logic nghiệp vụ',
    'Database access, when needed': 'Truy cập database khi cần',
    'Process startup and shutdown': 'Khởi chạy và dừng tiến trình',
    'Add when handlers grow': 'Thêm khi có nhiều handler',
    'External systems and domain logic': 'Hệ thống bên ngoài và logic nghiệp vụ',
    'Restart on source changes': 'Khởi động lại khi source đổi',
    'Syntax check without running': 'Kiểm tra cú pháp, không thực thi',
    'No watcher; uses injected environment': 'Không watch; dùng môi trường được cấp lúc chạy',
    'Installed top-level dependencies': 'Dependency trực tiếp đã cài',
    'Assets copied without processing': 'Tài nguyên được sao chép nguyên trạng',
    'Shared UI': 'UI dùng chung',
    'Feature-specific UI and hooks': 'UI và hook theo tính năng',
    'API clients and utilities': 'API client và tiện ích',
    'Development server with hot updates': 'Server development cập nhật khi sửa code',
    'Generated ESLint checks': 'Kiểm tra ESLint từ scaffold',
    'Generated type check and production bundle': 'Kiểm tra kiểu và đóng gói production',
    'Inspect the production bundle locally': 'Xem bản production trên máy',
    'Types and domain behavior': 'Kiểu và hành vi nghiệp vụ',
    'Generated JavaScript; ignore in Git': 'JavaScript được sinh; loại khỏi Git',
    'Report errors without generating files': 'Báo lỗi, không sinh file',
    'Compile src into dist': 'Biên dịch src vào dist',
    'Run compiled JavaScript': 'Chạy JavaScript đã biên dịch',
    'Recompile when files change; Ctrl+C stops': 'Biên dịch lại khi file đổi; Ctrl+C để dừng',
    'Inspect effective settings': 'Xem cấu hình thực tế',
    'Ignored': 'Không đưa vào Git',
}
strings = {
    '>Handbook counter<': '>Bộ đếm thực hành<',
    '>Developer counter<': '>Bộ đếm thực hành<',
    'Count: {count}': 'Số đếm: {count}',
    '>Add one<': '>Tăng một<', '>Reset<': '>Đặt lại<',
    '>Notes<': '>Ghi chú<', '>Loading…<': '>Đang tải…<',
    '>No notes yet.<': '>Chưa có ghi chú.<',
    'Use a name between 1 and 60 characters.': 'Tên cần có từ 1 đến 60 ký tự.',
    '`Welcome, ${name}. Ready to build?`': '`Xin chào, ${name}. Sẵn sàng thực hành chưa?`',
    '>Your name <': '>Tên của bạn <',
    "'Loading…' : 'Say hello'": "'Đang tải…' : 'Gửi lời chào'",
    'Unable to connect': 'Không thể kết nối',
    'Request failed': 'Yêu cầu thất bại',
    'Unexpected API response': 'Phản hồi API không đúng cấu trúc',
    "'Developer workspace'": "'Không gian phát triển'",
    '>A server-rendered page with a small interactive island.<': '>Trang kết xuất trên server với một phần tương tác nhỏ.<',
    'HANDBOOK_TITLE=My developer workspace': 'HANDBOOK_TITLE=Không gian phát triển của tôi',
    'Read the handbook': 'Đọc handbook',
}
for path in [Path('README.md'), *Path('docs').rglob('*.md')]:
    if '.vitepress' in path.parts:
        continue
    source = path.read_text(encoding='utf-8')
    for before, after in comments.items():
        source = source.replace('# ' + before, '# ' + after)
    for before, after in strings.items():
        source = source.replace(before, after)
    path.write_text(source, encoding='utf-8')

# Thông báo kiểm tra hiển thị trong terminal cũng dùng tiếng Việt.
path = Path('scripts/check-docs.mjs')
source = path.read_text(encoding='utf-8')
source = source.replace('Documentation check passed: ${files.length} pages, ${links} internal links, required sections and catalog targets.', 'Kiểm tra tài liệu thành công: ${files.length} trang, ${links} liên kết nội bộ, các mục chuẩn và đích trong danh mục.')
path.write_text(source, encoding='utf-8')
