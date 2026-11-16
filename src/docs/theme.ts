import { ref, watchEffect } from 'vue'

/**
 * 文档站全局明暗主题（模块级单例）：
 * 门户首页（无布局）与文档站布局页共用同一状态与 localStorage 持久化，
 * html[data-theme] 驱动 CSS 变量切换。
 */
const THEME_KEY = 'keditor-docs-theme'

const mode = ref<'dark' | 'light'>(localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark')

let initialized = false

export function useDocsTheme() {
  if (!initialized) {
    initialized = true
    // 全局单例副作用：SPA 生命周期内存活，无需手动 stop
    watchEffect(() => {
      document.documentElement.dataset.theme = mode.value
      localStorage.setItem(THEME_KEY, mode.value)
    })
  }

  function toggleTheme(): void {
    mode.value = mode.value === 'dark' ? 'light' : 'dark'
  }

  return { mode, toggleTheme }
}
