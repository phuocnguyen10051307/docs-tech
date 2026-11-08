<script setup lang="ts">
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import { technologies, projectGuides } from '../catalog'
const filters = ['Tất cả công nghệ', 'Frontend', 'Backend', 'Hạ tầng', 'Quy trình'] as const
const active = ref<(typeof filters)[number]>('Tất cả công nghệ')
const visible = computed(() => technologies.filter(t => active.value === 'Tất cả công nghệ' || t.category === active.value))
</script>

<template>
  <div class="handbook-dashboard">
    <div class="home-eyebrow"><span class="eyebrow-symbol">⌘</span> KHO KIẾN THỨC PHÁT TRIỂN CÁ NHÂN <span class="edition">TẬP 01 / 2026</span></div>
    <section class="hero-section" aria-labelledby="home-title">
      <div class="hero-copy">
        <div class="small-label"><span class="status-dot"></span> TRA CỨU NHANH, LÀM VIỆC THUẬN TIỆN</div>
        <h1 id="home-title">Tra cứu gọn.<br><span>Thực hành nhanh.</span></h1>
        <p>Những lệnh hay quên. Những bước cài đặt thường lặp lại.<br class="desktop-break"> Kiến thức phát triển hằng ngày, tập hợp tại một nơi.</p>
        <div class="hero-actions"><a class="primary-action" :href="withBase('/getting-started')">Khám phá sổ tay <span aria-hidden="true">→</span></a><a class="secondary-action" :href="withBase('/references/quick-commands')"><span aria-hidden="true">⌁</span> Lệnh thường dùng</a></div>
        <div class="hero-proof"><span>11 công nghệ</span><i></i><span>{{ projectGuides.length }} bài thực hành</span><i></i><span>Thuận tiện tra cứu</span></div>
      </div>
      <div class="terminal-card" aria-label="Ví dụ khởi tạo dự án React, chưa kiểm thử">
        <div class="terminal-bar"><div class="terminal-dots"><i></i><i></i><i></i></div><span>your-next-project / terminal</span><span>⌘</span></div>
        <div class="terminal-body"><p class="terminal-comment"># Ví dụ khởi tạo React (chưa kiểm thử).</p><p><span class="terminal-prompt">❯</span> npm create vite@latest my-app <span class="terminal-muted">\</span><br><span class="terminal-indent">-- --template react-ts</span></p><p><span class="terminal-prompt">❯</span> cd my-app</p><p><span class="terminal-prompt">❯</span> npm install <span class="terminal-muted">&amp;&amp;</span> npm run dev</p><div class="terminal-success"><span>✓</span> Xem cách kiểm tra trong bài hướng dẫn.<span class="cursor">▍</span></div></div>
        <a :href="withBase('/project-guides/react-typescript-vite')" class="terminal-footer">Thực hiện từng bước <span aria-hidden="true">↗</span></a>
      </div>
    </section>
    <section class="technology-section" aria-labelledby="technology-title">
      <div class="section-heading"><div><div class="small-label">BỘ CÔNG CỤ</div><h2 id="technology-title">Chọn công nghệ cần tra<span class="count-badge">11</span></h2></div><span class="section-hint">Từ cài đặt đến kiểm tra kết quả.</span></div>
      <div class="filter-row" aria-label="Lọc công nghệ"><button v-for="filter in filters" :key="filter" :class="{ selected: active === filter }" :aria-pressed="active === filter" @click="active = filter">{{ filter }}</button></div>
      <div class="technology-grid" aria-live="polite">
        <a v-for="tech in visible" :key="tech.slug" :href="withBase(`/technologies/${tech.slug}/`)" class="technology-card">
          <div class="card-top"><span class="tech-symbol" :style="{ color: tech.color, backgroundColor: `${tech.color}12` }">{{ tech.symbol }}</span><span class="card-arrow" aria-hidden="true">↗</span></div>
          <h3>{{ tech.name }}<span v-if="tech.starter" class="starter-tag">Đang biên soạn</span></h3><p>{{ tech.description }}</p><div class="card-footer"><span>{{ tech.category }}</span><span>{{ tech.starter ? 'Xem nội dung hiện có' : 'Đọc hướng dẫn' }} <span aria-hidden="true">→</span></span></div>
        </a>
        <a :href="withBase('/references/contributing')" class="technology-card contribute-card"><span class="add-symbol" aria-hidden="true">＋</span><h3>Bổ sung kiến thức của bạn</h3><p>Thêm công cụ mới cùng cách cài đặt và kinh nghiệm sử dụng.</p><div class="card-footer"><span>Tiếp tục học</span><span>Thêm công nghệ <span aria-hidden="true">→</span></span></div></a>
      </div>
    </section>
    <section class="guides-section" aria-labelledby="guides-title"><div class="section-heading"><div><div class="small-label">KẾT HỢP CÔNG NGHỆ</div><h2 id="guides-title">Thực hành xây dựng dự án</h2></div><a :href="withBase('/project-guides/')" class="text-link">Tất cả hướng dẫn dự án <span aria-hidden="true">→</span></a></div><div class="guide-list"><a v-for="(guide, i) in projectGuides" :key="guide.slug" :href="withBase(`/project-guides/${guide.slug}`)" class="guide-row"><span class="guide-number">0{{ i + 1 }}</span><div class="guide-info"><h3>{{ guide.title }}</h3><p>{{ guide.detail }}</p></div><span class="guide-tags">{{ guide.tags }}</span><span class="guide-time">{{ guide.time }}</span><span aria-hidden="true" class="card-arrow">↗</span></a></div></section>
    <section class="reference-strip" aria-label="Tài liệu tra cứu nhanh"><a :href="withBase('/references/quick-commands')"><span class="reference-icon">⌁</span><div><h3>Tra nhanh và sao chép lệnh.</h3><p>Các lệnh thường dùng trong một trang.</p></div><span aria-hidden="true">→</span></a><a :href="withBase('/references/common-errors')"><span class="reference-icon">⌘</span><div><h3>Gặp lỗi? Bắt đầu tại đây.</h3><p>Chẩn đoán nguyên nhân và làm theo cách sửa.</p></div><span aria-hidden="true">→</span></a></section>
    <footer class="dashboard-footer"><span>Tra cứu khi cần, không phải ghi nhớ mọi thứ.</span><a :href="withBase('/references/versions')">Handbook v1.0 <span aria-hidden="true">↗</span></a></footer>
  </div>
</template>
