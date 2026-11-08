import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import HandbookHome from './HandbookHome.vue'
import Breadcrumbs from './Breadcrumbs.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {
    'doc-before': () => h(Breadcrumbs),
    'sidebar-footer': () => h('div', { class: 'sidebar-note' }, [h('span', { class: 'status-dot' }), 'Kiến thức được sắp xếp để dễ tra cứu.'])
  }),
  enhanceApp({ app }) { app.component('HandbookHome', HandbookHome) }
} satisfies Theme
