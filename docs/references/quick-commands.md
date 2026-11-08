---
title: Lệnh thường dùng
version: Tra cứu để sao chép · kiểm tra thư mục trước khi chạy
---

# Lệnh thường dùng

Sao chép lệnh cần dùng rồi xem bài liên quan để hiểu ngữ cảnh. Các lệnh giả định dự án tương ứng đã tồn tại. Server tiếp tục chạy cho đến khi dừng bằng Ctrl+C.

## Kiểm tra môi trường

Từ terminal bất kỳ:

```sh
node --version
npm --version
git --version
docker version
docker compose version
```

Docker cần hiển thị cả client và server có thể kết nối. Xem [bắt đầu](/getting-started) để biết công cụ dùng chung.

## Tạo ứng dụng React + TypeScript

Từ thư mục cha thực hành, không phải thư mục source của ứng dụng khác:

```sh
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm run dev
```

`@latest` chọn phiên bản scaffold biến động. Xem [hướng dẫn đầy đủ](/project-guides/react-typescript-vite).

## Build và preview Vite

Từ thư mục gốc ứng dụng được tạo:

```sh
npm run lint
npm run build
npm run preview
```

Đầu ra mong đợi là `dist/`. Server preview dùng để kiểm tra bản production trên máy; triển khai các file đó bằng hosting tĩnh.

## Chạy ứng dụng Next.js

Từ thư mục cha:

```sh
npx create-next-app@latest my-next-app --ts --eslint --app --src-dir --no-tailwind --use-npm --import-alias "@/*"
cd my-next-app
npm run dev
```

Để kiểm tra production, dừng development rồi chạy tại gốc ứng dụng:

```sh
npx eslint .
npx tsc --noEmit
npm run build
npm start
```

Các lệnh dùng ESLint và TypeScript đã cài trong scaffold. Xem [bài Next.js](/project-guides/nextjs-fullstack).

## Kiểm tra TypeScript và Node

Từ dự án TypeScript đã khởi tạo và có `tsconfig.json`:

```sh
npx tsc --noEmit
npx tsc --showConfig
```

Tại gốc `node-api` trong bài Node:

```sh
node --check src/server.js
npm run dev
```

Script development cần `.env` trên máy. [TypeScript](/technologies/typescript/) · [Node.js](/technologies/nodejs/).

## Sao chép file môi trường mẫu

Từ thư mục chứa file mẫu. Xem và chỉnh `.env` mới trước khi chạy dịch vụ.

::: code-group

```bash [Bash]
cp .env.example .env
```

```powershell [PowerShell]
Copy-Item .env.example .env
```

:::

Với Next.js, dùng đích `.env.local`. Không commit secret đã điền.

## Cài đặt theo lockfile

Từ repository có `package-lock.json` hợp lệ:

```sh
npm ci
npm ls --depth=0
```

`npm ci` thay `node_modules` theo lockfile; lệnh thất bại nếu manifest và lockfile không khớp. Chủ động dùng `npm install` khi đổi dependency.

## Kiểm tra Docker Compose

Từ thư mục chứa `compose.yaml`:

```sh
docker compose up -d
docker compose ps
docker compose logs --tail=100
docker compose stop
docker compose start
```

Để xóa container dự án và mạng của chúng, giữ named volume:

```sh
docker compose down
```

**Cảnh báo:** thêm `-v` sẽ xóa volume và dữ liệu trong đó. Chỉ dùng khi chủ động chấp nhận mất dữ liệu. Xem [bài Docker](/technologies/docker/).

## Truy vấn database thực hành

Tại `handbook-stack` sau khi database báo healthy:

```sh
docker compose exec db psql -U handbook -d handbook -c "SELECT * FROM notes;"
docker compose exec db psql -U handbook -d handbook -c "SELECT version();"
```

Mong đợi ghi chú mẫu và phiên bản PostgreSQL server. Xem [bài full stack](/project-guides/react-express-postgresql).

## Kiểm tra n8n

Tại `n8n-local` khi container đang chạy:

```sh
docker compose logs --tail=100 n8n
docker compose exec n8n n8n --version
```

Ghi lại phiên bản trước khi nâng cấp. Xem [bài n8n Compose](/project-guides/n8n-compose).

## Git hằng ngày

Từ repository Git đã khởi tạo:

```sh
git status
git switch -c docs/update-handbook
git diff
git add README.md
git diff --cached
git commit -m "docs: clarify handbook setup"
git log --oneline -5
```

Stage từng file cụ thể và đọc diff đã stage trước khi commit. Commit cần cấu hình tên, email Git. Xem [tài liệu Git đang biên soạn](/technologies/git/).

## Chạy handbook

Từ thư mục gốc repository này:

```sh
npm ci
npm run dev
```

Để kiểm tra và preview production, dùng terminal khác tại cùng thư mục gốc:

```sh
npm run check
npm run typecheck
npm run build
npm run preview
```

Handbook xuất file tĩnh vào `dist/` ở gốc. Xem [ghi chú phiên bản](/references/versions) để biết bộ công cụ và phạm vi kiểm tra.
