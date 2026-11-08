import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Hướng dẫn dự án","description":"","frontmatter":{"title":"Hướng dẫn dự án","version":"Năm lộ trình thực hành · Handbook 1.0"},"headers":[],"relativePath":"project-guides/index.md","filePath":"project-guides/index.md"}');
const _sfc_main = { name: "project-guides/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="thuc-hanh-xay-dung-du-an" tabindex="-1">Thực hành xây dựng dự án <a class="header-anchor" href="#thuc-hanh-xay-dung-du-an" aria-label="Permalink to &quot;Thực hành xây dựng dự án&quot;">​</a></h1><p>Mỗi bài bắt đầu trong thư mục mới, giải thích môi trường và kết thúc bằng các bước tự kiểm tra. Thời gian đọc và thiết lập là ước tính, chưa tính cài công cụ và tải dependency.</p><table tabindex="0"><thead><tr><th>Hướng dẫn</th><th>Kết quả</th><th>Thời gian</th></tr></thead><tbody><tr><td><a href="./react-typescript-vite.html">React + TypeScript + Vite</a></td><td>Bộ đếm có kiểu dữ liệu và bản build production</td><td>10 phút</td></tr><tr><td><a href="./react-express-postgresql.html">React + Express + PostgreSQL</a></td><td>Giao diện đọc ghi chú từ cơ sở dữ liệu</td><td>25 phút</td></tr><tr><td><a href="./nextjs-fullstack.html">Ứng dụng Next.js full stack</a></td><td>Trang kết xuất trên server và route JSON</td><td>15 phút</td></tr><tr><td><a href="./docker-nodejs.html">Đóng gói Node.js bằng Docker</a></td><td>Container không dùng root, có endpoint kiểm tra sức khỏe</td><td>15 phút</td></tr><tr><td><a href="./n8n-compose.html">Tự chạy n8n bằng Docker Compose</a></td><td>Trình biên tập workflow với dữ liệu lưu bền vững</td><td>15 phút</td></tr></tbody></table><h2 id="danh-sach-kiem-tra-chung" tabindex="-1">Danh sách kiểm tra chung <a class="header-anchor" href="#danh-sach-kiem-tra-chung" aria-label="Permalink to &quot;Danh sách kiểm tra chung&quot;">​</a></h2><ul><li>[ ] Chọn tên dự án và thư mục cha mới.</li><li>[ ] Kiểm tra phiên bản Node/npm hoặc Docker trước khi bắt đầu.</li><li>[ ] Sao chép <code>.env.example</code> thành file môi trường trên máy và thay giá trị mẫu.</li><li>[ ] Chạy server trong terminal riêng và ghi lại các cổng.</li><li>[ ] Thử cả tình huống thành công và thất bại, rồi dừng dịch vụ khi hoàn tất.</li></ul><p>Xem <a href="/">hướng dẫn công nghệ</a> để hiểu cấu hình và <a href="/references/common-errors.html">lỗi thường gặp</a> khi thiết lập thất bại. Đọc <a href="/references/versions.html">ghi chú phiên bản</a> trước khi xem bản scaffold mới nhất là tương đương với phiên bản trong bài.</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("project-guides/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
