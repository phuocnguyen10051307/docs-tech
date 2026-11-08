<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
const { page, frontmatter } = useData()
const section = computed(() => page.value.relativePath.startsWith('technologies/') ? 'Công nghệ' : page.value.relativePath.startsWith('project-guides/') ? 'Hướng dẫn dự án' : 'Tra cứu')
const parent = computed(() => section.value === 'Hướng dẫn dự án' ? '/project-guides/' : '/')
</script>

<template>
  <div v-if="page.relativePath !== 'index.md'" class="page-meta">
    <nav aria-label="Đường dẫn điều hướng" class="breadcrumbs"><a :href="withBase('/')">Sổ tay</a><span aria-hidden="true">/</span><a :href="withBase(parent)">{{ section }}</a><span aria-hidden="true">/</span><span aria-current="page">{{ page.title }}</span></nav>
    <div v-if="frontmatter.version" class="version-note">{{ frontmatter.status === 'starter' ? 'ĐANG BIÊN SOẠN' : 'HƯỚNG DẪN THỰC HÀNH' }}<span>·</span>{{ frontmatter.version }}</div>
  </div>
</template>
