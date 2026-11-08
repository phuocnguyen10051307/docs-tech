---
title: TypeScript
version: TypeScript 5.7+ · Ví dụ Node ESM
status: guide
---

# TypeScript

::: warning Chưa kiểm thử
Ví dụ ứng dụng trong bài chưa được cài đặt và chạy đầy đủ trong đợt chỉnh sửa này. Các bước dưới đây là hướng dẫn thực hành và kết quả mong đợi; kiểm tra build của website không xác nhận ứng dụng mẫu hoạt động.
:::

## Tổng quan

TypeScript thêm kiểm tra tĩnh cho JavaScript. Dùng để phát hiện cấu trúc dữ liệu không khớp và hỗ trợ refactor. Kiểu bị xóa khi biên dịch, không xác thực JSON mạng hoặc biến môi trường lúc chạy.

## Yêu cầu trước khi bắt đầu

Cài Node.js **22.12+**, npm; hiểu module và hàm JavaScript. Ví dụ biên dịch cho Node ESM; dự án trình duyệt nên giữ cấu hình TypeScript của framework.

## Cài đặt

Trong thư mục cha dành cho thực hành:

```sh
mkdir typed-app
cd typed-app
npm init -y
npm pkg set type=module
npm install -D typescript@5 @types/node@22
mkdir src
```

Compiler cài trong dự án giúp cả nhóm dùng phiên bản trong lockfile. Khai báo Node mô tả API tích hợp. `@5` giữ trong họ 5.x; đánh giá nâng major riêng.

## Khởi tạo dự án

Tạo `src/index.ts`:

```ts
type Task = { id: number; title: string; complete: boolean }
const task: Task = { id: 1, title: 'Đọc handbook', complete: false }
console.log(`${task.id}: ${task.title}`)
```

Thêm script tại gốc ứng dụng:

```sh
npm pkg set "scripts.check=tsc --noEmit"
npm pkg set "scripts.build=tsc"
npm pkg set "scripts.start=node dist/index.js"
```

## Cấu hình

Tạo `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "rootDir": "src",
    "outDir": "dist",
    "noEmitOnError": true,
    "sourceMap": true,
    "types": ["node"],
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"]
}
```

`strict` bật kiểm tra chặt hơn. `NodeNext` theo quy tắc module Node, gồm khai báo ESM của package. Import file nội bộ với đuôi đầu ra, ví dụ `import { task } from './task.js'` ngay trong TypeScript. Dự án Vite trình duyệt thường dùng `moduleResolution: "Bundler"`; không sao chép cấu hình Node tùy tiện.

## Cấu trúc dự án

```text
typed-app/
├── src/
│   ├── index.ts
│   └── domain/       # Kiểu và hành vi nghiệp vụ
├── dist/             # JavaScript được sinh; loại khỏi Git
├── tsconfig.json
├── package-lock.json
└── package.json
```

## Lệnh thường dùng

Tại `typed-app` sau khi tạo cấu hình:

```sh
npm run check        # Báo lỗi, không sinh file
npm run build        # Biên dịch src vào dist
npm start            # Chạy JavaScript đã biên dịch
npx tsc --watch      # Biên dịch lại khi file đổi; Ctrl+C để dừng
npx tsc --showConfig # Xem cấu hình thực tế
```

Đầu ra mong đợi của `npm start`: `1: Đọc handbook`. Để thử lỗi, gán chuỗi cho `task.id`; `npm run check` cần thất bại. Hoàn tác trước khi build.

## Thực hành tốt

- Bật strict từ đầu; thu hẹp `unknown` trước khi dùng.
- Mô hình hóa trạng thái hợp lệ bằng union thay vì các thuộc tính optional rời rạc.
- Ưu tiên suy luận kiểu cho biến nội bộ, hợp đồng rõ ràng tại ranh giới module.
- Xem assertion `as` là cam kết cần chứng minh, không phải chuyển đổi dữ liệu.
- Kiểm tra đầu vào ngoài ở runtime rồi mới trả kết quả có kiểu.
- Tách file môi trường khỏi cấu hình compiler; ví dụ này không cần `.env`.

## Xử lý lỗi

| Lỗi | Nguyên nhân | Cách xử lý |
| --- | --- | --- |
| TS2322: not assignable | Giá trị không thỏa kiểu | Xem giá trị nguồn; sửa hợp đồng thay vì thêm `any` |
| Cannot find name `process` | Thiếu hoặc loại trừ kiểu Node | Cài `@types/node`, kiểm tra `types` |
| Import tương đối yêu cầu đuôi file | Phân giải Node ESM | Dùng `.js` trong import tương đối |
| Kiểm tra kiểu qua nhưng JSON lỗi | Kiểu bị xóa khi chạy | Thêm kiểm tra runtime tại ranh giới |
| Thay đổi chưa có trong `dist` | Build lỗi hoặc sai cấu hình | Chạy `npm run build`; xem `--showConfig` |

## Đánh giá

TypeScript giúp bảo trì codebase lớn và cải thiện gợi ý editor. Đổi lại cần cấu hình compiler và không bảo đảm dữ liệu runtime hợp lệ. JavaScript có thể đơn giản hơn cho script nhỏ dùng tạm.

**Tiếp theo:** [React có kiểu dữ liệu](/project-guides/react-typescript-vite) · [Node.js](/technologies/nodejs/). **Nguồn chính thức:** [Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) · [Tra cứu tsconfig](https://www.typescriptlang.org/tsconfig/) · [tsconfig.json là gì?](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html).
