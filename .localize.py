from pathlib import Path
import json
import re

rows = json.loads(Path('.translation-source.json').read_text(encoding='utf-8'))
translations = {}
for line in Path('.translation-vi.txt').read_text(encoding='utf-8').splitlines():
    index, text = line.split('\t', 1)
    translations[rows[int(index)]] = text

def slug(text):
    text = re.sub(r'<[^>]*>', '', text).lower()
    text = re.sub(r'[`*_]', '', text)
    text = ''.join(c for c in text if c.isalnum() or c.isspace() or c == '-')
    return re.sub(r'\s', '-', text.strip())

anchors = {}
for before, after in translations.items():
    if before.startswith('#'):
        old = slug(before.lstrip('# '))
        new = slug(after.lstrip('# '))
        anchors[old] = new
        if old[:1].isdigit():
            anchors['_' + old] = '_' + new

paths = [Path('README.md'), *Path('docs').rglob('*.md'), *Path('templates').glob('*.md')]
for path in paths:
    if '.vitepress' in path.parts:
        continue
    lines = path.read_text(encoding='utf-8-sig').splitlines()
    fence = False
    result = []
    for line in lines:
        if line.startswith('```'):
            fence = not fence
        if not fence:
            line = translations.get(line, line)
            line = line.replace('::: info Starter outline', '::: info Đang biên soạn')
            line = line.replace('::: tip Development is a starting point', '::: tip Trước khi dùng production')
            line = re.sub(r'#([^\s)]+)(?=\))', lambda m: '#' + anchors.get(m[1], m[1]), line)
        result.append(line)
        if line.startswith('# ') and (('technologies' in path.parts) or ('project-guides' in path.parts and path.name != 'index.md') or path == Path('templates/project-guide.md')):
            result.extend(['', '::: warning Chưa kiểm thử', 'Ví dụ ứng dụng trong bài chưa được cài đặt và chạy đầy đủ trong đợt chỉnh sửa này. Các bước dưới đây là hướng dẫn thực hành và kết quả mong đợi; kiểm tra build của website không xác nhận ứng dụng mẫu hoạt động.', ':::'])
    path.write_text('\n'.join(result) + '\n', encoding='utf-8')

# Giữ bộ kiểm tra đồng bộ với tiêu đề đã dịch.
path = Path('scripts/check-docs.mjs')
source = path.read_text(encoding='utf-8')
for before, after in translations.items():
    if before.startswith('## '):
        source = source.replace("'" + before[3:] + "'", "'" + after[3:] + "'")
path.write_text(source, encoding='utf-8')

# Chuỗi giao diện; không thay tên file, slug hoặc câu lệnh.
ui = {
    'Less searching. More building. Practical setup guides, commands, and troubleshooting for everyday development.': 'Hướng dẫn cài đặt, lệnh thường dùng và xử lý lỗi trong công việc phát triển hằng ngày.',
    "lang: 'en-US'": "lang: 'vi-VN'",
    "text: 'Handbook'": "text: 'Sổ tay'",
    'Project guides': 'Hướng dẫn dự án',
    "text: 'Reference'": "text: 'Tra cứu'",
    'Quick commands': 'Lệnh thường dùng',
    'Common errors & solutions': 'Lỗi thường gặp và cách xử lý',
    'Common errors': 'Lỗi thường gặp',
    'Version notes': 'Ghi chú phiên bản',
    'START HERE': 'BẮT ĐẦU',
    'Handbook home': 'Trang chủ sổ tay',
    'Getting started': 'Bắt đầu sử dụng',
    'TECHNOLOGIES': 'CÔNG NGHỆ',
    'BUILD SOMETHING': 'THỰC HÀNH DỰ ÁN',
    'All project guides': 'Tất cả hướng dẫn dự án',
    'KEEP HANDY': 'TRA CỨU NHANH',
    'Writing new documentation': 'Biên soạn tài liệu',
    'On this page': 'Trong trang này',
    'Previous guide': 'Bài trước',
    'Next guide': 'Bài tiếp theo',
    'Your knowledge, organized.': 'Kiến thức được sắp xếp để dễ tra cứu.',
    "? 'Technologies'": "? 'Công nghệ'",
    ": 'Reference'": ": 'Tra cứu'",
    'aria-label="Breadcrumb"': 'aria-label="Đường dẫn điều hướng"',
    '>Handbook</a>': '>Sổ tay</a>',
    'STARTER OUTLINE': 'ĐANG BIÊN SOẠN',
    'PRACTICAL GUIDE': 'HƯỚNG DẪN THỰC HÀNH',
    'All technologies': 'Tất cả công nghệ',
    'YOUR PERSONAL DEVELOPER KNOWLEDGE BASE': 'KHO KIẾN THỨC PHÁT TRIỂN CÁ NHÂN',
    'VOLUME 01 / 2026': 'TẬP 01 / 2026',
    'A LITTLE LESS TAB OVERLOAD': 'TRA CỨU NHANH, LÀM VIỆC THUẬN TIỆN',
    'Less searching.': 'Tra cứu gọn.',
    'More building.': 'Thực hành nhanh.',
    'The commands you forget. The setups you repeat.': 'Những lệnh hay quên. Những bước cài đặt thường lặp lại.',
    'Your everyday development knowledge, all in one place.': 'Kiến thức phát triển hằng ngày, tập hợp tại một nơi.',
    'Explore the handbook': 'Khám phá sổ tay',
    '11 technologies': '11 công nghệ',
    '5 practical guides': '5 bài thực hành',
    'Always within reach': 'Thuận tiện tra cứu',
    'Example React project setup': 'Ví dụ khởi tạo dự án React, chưa kiểm thử',
    '# A good idea deserves a quick start.': '# Ví dụ khởi tạo React (chưa kiểm thử).',
    'Ready when you are.': 'Xem cách kiểm tra trong bài hướng dẫn.',
    'Build it step by step': 'Thực hiện từng bước',
    'THE TOOLBOX': 'BỘ CÔNG CỤ',
    'Find your technology': 'Chọn công nghệ cần tra',
    'From first install to “it works.”': 'Từ cài đặt đến kiểm tra kết quả.',
    'Filter technologies': 'Lọc công nghệ',
    '>Starter</span>': '>Đang biên soạn</span>',
    'Explore outline': 'Xem nội dung hiện có',
    'Read guide': 'Đọc hướng dẫn',
    'Make it your own': 'Bổ sung kiến thức của bạn',
    'New tool in your stack? Give it a home in your handbook.': 'Thêm công cụ mới cùng cách cài đặt và kinh nghiệm sử dụng.',
    'Keep learning': 'Tiếp tục học',
    'Add a technology': 'Thêm công nghệ',
    'CONNECT THE DOTS': 'KẾT HỢP CÔNG NGHỆ',
    'Build something real': 'Thực hành xây dựng dự án',
    'Handy references': 'Tài liệu tra cứu nhanh',
    'Skip the search. Copy the command.': 'Tra nhanh và sao chép lệnh.',
    'Your most-used commands, one page away.': 'Các lệnh thường dùng trong một trang.',
    'Stuck? Start here.': 'Gặp lỗi? Bắt đầu tại đây.',
    'Common errors, clear explanations, practical fixes.': 'Chẩn đoán nguyên nhân và làm theo cách sửa.',
    'Built for the things you don’t need to memorize.': 'Tra cứu khi cần, không phải ghi nhớ mọi thứ.',
    'Components, hooks, and a better starting point for your next interface.': 'Component, hook và cách bắt đầu xây dựng giao diện.',
    'Type your code with confidence. Compiler setup, patterns, and checks.': 'Cấu hình compiler, quy ước kiểu dữ liệu và cách kiểm tra.',
    'The essentials: modules, async code, and everyday language patterns.': 'Kiến thức nền: module, bất đồng bộ và cách viết code thường gặp.',
    'From your first server to environment variables and production scripts.': 'Từ server đầu tiên đến biến môi trường và script production.',
    'Small, focused APIs with routing, middleware, and error handling.': 'API gọn với routing, middleware và xử lý lỗi.',
    'App Router foundations for server-rendered React applications.': 'Nền tảng App Router cho ứng dụng React kết xuất trên server.',
    'Repeatable environments. Images, containers, volumes, and Compose.': 'Môi trường nhất quán với image, container, volume và Compose.',
    'Relational data, local databases, SQL, and reliable persistence.': 'Dữ liệu quan hệ, SQL và lưu trữ bền vững trên máy.',
    'A starting map for schemas, migrations, and a typed database client.': 'Bước đầu về schema, migration và database client có kiểu.',
    'Connect your tools with workflows you can run on your own machine.': 'Kết nối công cụ bằng workflow chạy trên máy của bạn.',
    'Branches, commits, remotes, and a calmer everyday Git workflow.': 'Branch, commit, remote và quy trình Git hằng ngày.',
    'A typed frontend, ready to build.': 'Frontend có kiểu dữ liệu, kèm cách build.',
    'Connect a React interface to a real API and database.': 'Nối giao diện React với API và cơ sở dữ liệu.',
    'Next.js Full-Stack Application': 'Ứng dụng Next.js full stack',
    'Server components and your first route handler.': 'Server Component và route handler đầu tiên.',
    'Dockerizing a Node.js Application': 'Đóng gói Node.js bằng Docker',
    'Package a small API into a reproducible image.': 'Đóng gói API nhỏ thành image có thể tái lập.',
    'Self-hosting n8n with Docker Compose': 'Tự chạy n8n bằng Docker Compose',
    'A persistent local workflow environment.': 'Môi trường workflow với dữ liệu lưu bền vững.',
    '10 min': '10 phút', '15 min': '15 phút', '25 min': '25 phút',
    'Beginner': 'Cơ bản', 'Intermediate': 'Trung cấp',
    'Infrastructure': 'Hạ tầng', 'Workflow': 'Quy trình',
}
for path in [*Path('docs/.vitepress').glob('*.ts'), *Path('docs/.vitepress/theme').glob('*.vue'), Path('docs/.vitepress/theme/index.ts')]:
    source = path.read_text(encoding='utf-8')
    for before, after in ui.items():
        source = source.replace(before, after)
    path.write_text(source, encoding='utf-8')

package = Path('package.json')
source = package.read_text(encoding='utf-8').replace('A practical, searchable developer knowledge base built with VitePress.', 'Sổ tay kỹ thuật thực hành bằng tiếng Việt, có tìm kiếm và sử dụng VitePress.')
package.write_text(source, encoding='utf-8')
