import { defineComponent, computed, ref, watch } from 'vue'
import { useRoute, RouterView, RouterLink } from 'vue-router'
import { SunIcon, MoonIcon, MenuIcon, CloseIcon } from './components/icons'
import { useDocsTheme } from './theme'
import logoDarkUrl from './assets/logo.svg'
import logoLightUrl from './assets/logo-light.svg'
import './app-layout.css'
import './styles/docs.css'

interface NavItem {
  path: string
  title: string
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

/** 侧边栏导航配置（与 router 中的 meta 保持一致） */
const NAV: NavGroup[] = [
  {
    items: [{ path: '/intro', title: '介绍' }],
  },
  {
    label: '示例',
    items: [
      { path: '/editor/basic', title: '基础用法' },
      { path: '/editor/controlled', title: '受控与外部方法' },
      { path: '/editor/line-number', title: '行号' },
      { path: '/editor/active-line', title: '当前行高亮' },
      { path: '/editor/zebra', title: '斑马纹' },
      { path: '/editor/editing-enhance', title: '编辑增强' },
      { path: '/editor/search', title: '搜索与替换' },
      { path: '/editor/ghost', title: 'AI 幽灵补全' },
      { path: '/editor/minimap', title: 'Minimap 缩略图' },
      { path: '/editor/indent-guides', title: '缩进参考线' },
      { path: '/editor/theme', title: '主题配置' },
      { path: '/editor/word-wrap', title: '自动折行' },
      { path: '/editor/code-fold', title: '代码折叠' },
      { path: '/editor/accent-color', title: '主题色预设' },
      { path: '/editor/status-bar', title: '状态栏' },
      { path: '/editor/highlight', title: '代码风格' },
      { path: '/editor/slots', title: '行号与折叠插槽' },
      { path: '/editor/diff', title: '代码 diff' },
      { path: '/editor/marks', title: '代码标注' },
      { path: '/editor/comments', title: '代码评论' },
    ],
  },
  {
    label: 'API',
    items: [{ path: '/editor/api', title: 'CodeEditor API' }],
  },
]

/**
 * 文档站布局：左侧导航 + 右侧内容区（router-view）
 */
export default defineComponent({
  name: 'DocApp',
  setup() {
    const route = useRoute()
    const pageTitle = computed(() => (route.meta.title as string) ?? '')
    const { mode, toggleTheme } = useDocsTheme()
    /** 移动端抽屉菜单开合（汉堡 -> 关闭 icon，参考官网） */
    const mobileMenuOpen = ref(false)
    watch(
      () => route.path,
      () => {
        mobileMenuOpen.value = false
      },
    )

    return () =>
      // 门户首页（/）全屏独立渲染，不带文档站侧栏与顶栏
      route.path === '/' ? (
        <RouterView />
      ) : (
      <div class="docs">
        {mobileMenuOpen.value && (
          <div
            class="docs__drawer-mask"
            onClick={() => (mobileMenuOpen.value = false)}
          />
        )}
        <aside class={['docs__sidebar', mobileMenuOpen.value ? 'is-open' : '']}>
          <button
            type="button"
            class="docs__drawer-close"
            title="关闭菜单"
            onClick={() => (mobileMenuOpen.value = false)}
          >
            <CloseIcon />
          </button>
          <RouterLink to="/" class="docs__brand-row" title="返回门户首页">
            <img
              class="docs__logo"
              src={mode.value === 'dark' ? logoDarkUrl : logoLightUrl}
              alt="KCodeEditor logo"
            />
            <div class="docs__brand">
              K<em>CodeEditor</em>
            </div>
          </RouterLink>
          {NAV.map((group) => (
            <div class="docs__nav-group" key={group.label ?? 'top'}>
              {group.label && <div class="docs__nav-label">{group.label}</div>}
              {group.items.map((item) => (
                <router-link
                  key={item.path}
                  to={item.path}
                  class={{
                    'docs__nav-item': true,
                    'is-active': route.path === item.path,
                  }}
                >
                  {item.title}
                </router-link>
              ))}
            </div>
          ))}
        </aside>

        <div class="docs__content">
          <header class="docs__topbar">
            <button
              type="button"
              class="docs__menu-toggle"
              title={mobileMenuOpen.value ? '关闭菜单' : '打开菜单'}
              onClick={() => (mobileMenuOpen.value = !mobileMenuOpen.value)}
            >
              {mobileMenuOpen.value ? <CloseIcon /> : <MenuIcon />}
            </button>
            <span class="docs__topbar-title">{pageTitle.value}</span>
            <div class="docs__topbar-actions">
              <span class="docs__version">v0.1.0</span>
              <button
                class="docs__theme-toggle"
                title={mode.value === 'dark' ? '切换亮色' : '切换暗色'}
                onClick={toggleTheme}
              >
                {mode.value === 'dark' ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>
          </header>
          <main class="docs__main">
            <RouterView />
          </main>
        </div>
      </div>
      )
  },
})
