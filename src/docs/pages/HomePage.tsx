import { defineComponent, ref, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import { KCodeEditor } from '@/keditor'
import { SunIcon, MoonIcon } from '@/docs/components/icons'
import { useDocsTheme } from '@/docs/theme'
import logoDarkUrl from '@/docs/assets/logo.svg'
import logoLightUrl from '@/docs/assets/logo-light.svg'
import '@/docs/styles/home.css'

const VERSION = 'v0.1.0'

/** Hero 统计卡（与示例页/功能实际情况同源维护） */
const STATS = [
  { value: 20, label: '个示例场景', icon: 'M4 6h16M4 12h10M4 18h16' },
  { value: 13, label: '种高亮配色', icon: 'M8 3 4 8l4 5M16 3l4 5-4 5M13 4l-3 9' },
  { value: 9, label: '类 token 分词', icon: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3' },
  { value: 0, label: '运行时依赖', icon: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3ZM9 12l2 2 4-4' },
]

/** 特性卡（彩色 icon chip + 标题 + 描述，accent 走内联色） */
const FEATURES = [
  {
    icon: 'M12 3l9 5-9 5-9-5 9-5ZM3 13l9 5 9-5',
    title: '数据驱动',
    desc: '字符模型（lines: string[]）是唯一数据源，DOM 只是投影；任何输入先改模型再渲染，架构对标 CodeMirror 的 State + View 分离',
    accent: '#4fc08d',
  },
  {
    icon: 'M8 3 4 8l4 5M16 3l4 5-4 5M13 4l-3 9',
    title: '语法高亮',
    desc: '13 种内置配色预设（VS Code Dark+ / Monokai / Dracula / Nord / Tokyo Night…），tokenColors 逐类型覆写，粘贴自动检测语言',
    accent: '#7c5cfc',
  },
  {
    icon: 'M4 4h7v7H4zM13 13h7v7h-7zM13 4h7v7h-7zM4 13h7v7H4z',
    title: '双框架同构',
    desc: 'Vue3 + TypeScript + TSX 实现，API 同构；文档站全部示例提供 TSX / Vue SFC 双版本源码，切换框架零学习成本',
    accent: '#2b6fff',
  },
  {
    icon: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z',
    title: '编辑增强',
    desc: '回车自动缩进、括号配对补全、代码格式化、撤销重做、Tab 幽灵补全接管，细节对齐 VS Code 的手感',
    accent: '#ffb020',
  },
  {
    icon: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM21 21l-4.3-4.3',
    title: '搜索与替换',
    desc: '回车全局检索、命中逐字符高亮、循环跳转、编辑后自动重算；不信任原生 DOM，textContent 原样输出无 XSS 风险',
    accent: '#f5455c',
  },
  {
    icon: 'M12 3l1.9 5.8H20l-5 3.7 1.9 5.8-4.9-3.6-4.9 3.6L9 12.5 4 8.8h6.1L12 3Z',
    title: 'AI 幽灵补全',
    desc: 'SSE 流式接口对接 AI 补全，灰色幽灵文本 Tab 一键采纳、Esc 丢弃——为 AI 编程场景预置的输入管线',
    accent: '#00c48c',
  },
  {
    icon: 'M20 13A8 8 0 1 1 11 4a6.5 6.5 0 0 0 9 9Z',
    title: '暗色模式',
    desc: '暗色默认、亮色一键切换；字号 / 行高 / 配色 / 光标全部走主题对象与 CSS 变量，40+ 配置项自由组装',
    accent: '#2bb0ff',
  },
  {
    icon: 'M14 3v5h5M14 3h-9v18h14V8l-5-5ZM8 13h8M8 17h5',
    title: '代码协作',
    desc: 'Git diff 行标记（新增/删除/修改）、代码标注悬停浮层、代码评论——开箱可搭 AI 代码评审台',
    accent: '#9561f3',
  },
]

/** 功能速览分组（与文档站侧栏示例一致，slug 走路由） */
const DEMO_GROUPS: Array<{ label: string; items: Array<{ path: string; title: string }> }> = [
  {
    label: '编辑体验',
    items: [
      { path: '/editor/basic', title: '基础用法' },
      { path: '/editor/controlled', title: '受控与外部方法' },
      { path: '/editor/editing-enhance', title: '编辑增强' },
      { path: '/editor/search', title: '搜索与替换' },
      { path: '/editor/ghost', title: 'AI 幽灵补全' },
    ],
  },
  {
    label: '视觉显示',
    items: [
      { path: '/editor/line-number', title: '行号' },
      { path: '/editor/active-line', title: '当前行高亮' },
      { path: '/editor/zebra', title: '斑马纹' },
      { path: '/editor/indent-guides', title: '缩进参考线' },
      { path: '/editor/word-wrap', title: '自动折行' },
      { path: '/editor/code-fold', title: '代码折叠' },
      { path: '/editor/minimap', title: 'Minimap 缩略图' },
    ],
  },
  {
    label: '主题与风格',
    items: [
      { path: '/editor/theme', title: '主题配置' },
      { path: '/editor/accent-color', title: '主题色预设' },
      { path: '/editor/status-bar', title: '状态栏' },
      { path: '/editor/highlight', title: '代码风格' },
    ],
  },
  {
    label: '协作与标注',
    items: [
      { path: '/editor/slots', title: '行号与折叠插槽' },
      { path: '/editor/diff', title: '代码 diff' },
      { path: '/editor/marks', title: '代码标注' },
      { path: '/editor/comments', title: '代码评论' },
    ],
  },
]

/** Hero 现场演示代码（TS 样本：关键字/字符串/注释/对象 key/缩进全覆盖，由打字动画逐字符写入） */
const HERO_CODE = [
  "import { defineComponent, ref } from 'vue'",
  "import { KCodeEditor } from 'k-code-editor'",
  '',
  'export default defineComponent({',
  '  setup() {',
  "    const code = ref('')",
  '    // 字符模型是唯一数据源，DOM 只是投影',
  '    return () => <KCodeEditor',
  '      initialText={code.value}',
  '      showLineNumber',
  '      highlightActiveLine',
  '      indentGuides',
  '      language="typescript"',
  '      theme={{ fontSize: 14 }} />',
  '  },',
  '})',
].join('\n')

/** 打字节奏：普通字符间隔 / 换行停顿 */
const TYPE_CHAR_MS = 26
const TYPE_NEWLINE_MS = 240

/**
 * 门户首页：全屏落地页（独立路由 /，不带文档站侧栏与顶栏），
 * 风格参考 KCharts 官网首页——沉浸式 hero + 打字动画编辑器 + 特性网格 + 功能速览 + footer
 */
export default defineComponent({
  name: 'HomePage',
  setup() {
    const featuresRef = ref<HTMLElement | null>(null)
    const demosRef = ref<HTMLElement | null>(null)
    const heroRef = ref<HTMLElement | null>(null)
    const editorRef = ref<{ setText: (t: string) => void } | null>(null)
    const { mode, toggleTheme } = useDocsTheme()

    /** 打字动画进行中（重播按钮显示用） */
    const typing = ref(true)
    /** 光晕鼠标视差偏移（-1 ~ 1） */
    const parallax = ref({ x: 0, y: 0 })
    /** 页面是否已向下滚动（header 毛玻璃渐进显现开关） */
    const scrolled = ref(false)

    let typeTimer: number | null = null

    function scrollTo(refEl: HTMLElement | null): void {
      refEl?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    /** 光晕跟随鼠标轻微漂移（视差感） */
    function onHeroMousemove(e: MouseEvent): void {
      const rect = heroRef.value?.getBoundingClientRect()
      if (!rect) return
      parallax.value = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
      }
    }

    /** 打字机：逐字符写入，换行停顿，打完即停不循环（仅手动重播可再放，字符模型实时驱动高亮重算） */
    function startTyping(): void {
      stopTyping()
      typing.value = true
      let i = 0
      const step = (): void => {
        if (i > HERO_CODE.length) {
          typing.value = false
          return
        }
        const ch = HERO_CODE.charAt(i)
        i++
        editorRef.value?.setText(HERO_CODE.slice(0, i))
        typeTimer = window.setTimeout(step, ch === '\n' ? TYPE_NEWLINE_MS : TYPE_CHAR_MS)
      }
      typeTimer = window.setTimeout(step, 600)
    }

    function stopTyping(): void {
      if (typeTimer !== null) {
        window.clearTimeout(typeTimer)
        typeTimer = null
      }
    }

    /** 滚动越过阈值后给 header 加 is-scrolled，触发毛玻璃 opacity 渐进过渡 */
    function onWindowScroll(): void {
      scrolled.value = window.scrollY > 24
    }

    /** 滚动进入视口的渐显动画（特性卡 / 速览分组） */
    let revealObserver: IntersectionObserver | null = null

    onMounted(() => {
      startTyping()
      window.addEventListener('scroll', onWindowScroll, { passive: true })
      onWindowScroll()
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-revealed')
              revealObserver?.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.12 },
      )
      document.querySelectorAll('.js-reveal').forEach((el) => revealObserver?.observe(el))
    })

    onBeforeUnmount(() => {
      stopTyping()
      window.removeEventListener('scroll', onWindowScroll)
      revealObserver?.disconnect()
      revealObserver = null
    })

    return () => (
      <div class="landing">
        {/* ============ 顶部导航（落地页专属，透明悬浮毛玻璃） ============ */}
        <header class={['landing__nav', scrolled.value ? 'is-scrolled' : '']}>
          <RouterLink to="/" class="landing__nav-logo">
            <img
              class="landing__nav-logo-img"
              src={mode.value === 'dark' ? logoDarkUrl : logoLightUrl}
              alt="KCodeEditor logo"
            />
            K<em>CodeEditor</em>
          </RouterLink>
          <nav class="landing__nav-links">
            <button type="button" class="landing__nav-link" onClick={() => scrollTo(featuresRef.value)}>特性</button>
            <button type="button" class="landing__nav-link" onClick={() => scrollTo(demosRef.value)}>功能速览</button>
            <RouterLink to="/intro" class="landing__nav-link">介绍</RouterLink>
            <RouterLink to="/editor/api" class="landing__nav-link">API 手册</RouterLink>
            <RouterLink to="/editor/basic" class="landing__nav-cta">快速开始</RouterLink>
            <button
              type="button"
              class="landing__nav-theme"
              title={mode.value === 'dark' ? '切换亮色' : '切换暗色'}
              onClick={toggleTheme}
            >
              {mode.value === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </nav>
        </header>

        {/* ============ Hero：沉浸式渐变 + 打字动画编辑器 ============ */}
        <section ref={heroRef} class="home__hero" onMousemove={onHeroMousemove}>
          <div
            class="home__glow home__glow--a"
            style={{ transform: `translate(${parallax.value.x * 40}px, ${parallax.value.y * 40}px)` }}
            aria-hidden="true"
          />
          <div
            class="home__glow home__glow--b"
            style={{ transform: `translate(${parallax.value.x * -60}px, ${parallax.value.y * -60}px)` }}
            aria-hidden="true"
          />
          <div class="home__grid-bg" aria-hidden="true" />

          <div class="home__hero-inner">
            <span class="home__badge hero-item" style="animation-delay: 0.05s">
              {VERSION} · 数据驱动 · 双框架 · 零依赖
            </span>
            <h1 class="home__title hero-item" style="animation-delay: 0.14s">KCodeEditor</h1>
            <p class="home__slogan hero-item" style="animation-delay: 0.24s">数据驱动的逐字符代码编辑器</p>
            <p class="home__sub hero-item" style="animation-delay: 0.32s">
              字符模型是唯一数据源 · DOM 只是投影 · Vue3 + TypeScript + TSX · 40+ 配置项开箱即用
            </p>
            <div class="home__cta hero-item" style="animation-delay: 0.4s">
              <RouterLink to="/editor/basic" class="home__cta-main">
                快速开始
                <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </RouterLink>
              <button type="button" class="home__cta-ghost" onClick={() => scrollTo(featuresRef.value)}>了解特性</button>
              <RouterLink to="/editor/api" class="home__cta-ghost">API 手册</RouterLink>
            </div>
            <div class="home__stats hero-item" style="animation-delay: 0.48s">
              {STATS.map((s) => (
                <span class="home__stat" key={s.label}>
                  <i class="home__stat-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="100%" height="100%">
                      <path d={s.icon} fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </i>
                  <b>{s.value}</b>{s.label}
                </span>
              ))}
            </div>

            {/* 现场演示：dogfood 真实编辑器——打字机逐字符输入，缩进参考线 / 行号 / 状态栏全部开启 */}
            <div class="home__stage hero-item" style="animation-delay: 0.56s">
              <div class="home__stage-head">
                <span class="home__stage-dot" style="background:#f5455c" />
                <span class="home__stage-dot" style="background:#ffb020" />
                <span class="home__stage-dot" style="background:#00c48c" />
                <span class="home__stage-title">App.tsx — 正在自动演示输入，可直接接管编辑</span>
                <button
                  type="button"
                  class="home__stage-replay"
                  style={{ display: typing.value ? 'none' : 'inline-flex' }}
                  onClick={startTyping}
                >↻ 重播</button>
              </div>
              <KCodeEditor
                ref={editorRef}
                initialText=""
                language="typescript"
                showLineNumber
                highlightActiveLine
                showCursorInfo
                indentGuides
                theme={{ fontSize: 13.5 }}
              />
            </div>
          </div>
        </section>

        {/* ============ 特性 ============ */}
        <section ref={featuresRef} class="home__body" style="scroll-margin-top: 76px">
          <h2 class="home__section-title js-reveal">特性</h2>
          <p class="home__section-desc js-reveal">为「能打」而设计，也为「好看」而用心</p>
          <div class="home__features">
            {FEATURES.map((f, i) => (
              <div
                class="home__feature js-reveal"
                key={f.title}
                style={`transition-delay: ${(i % 4) * 70}ms`}
              >
                <span class="home__feature-icon" style={{ color: f.accent, background: f.accent + '1a' }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                    <path d={f.icon} fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                <div class="home__feature-title">{f.title}</div>
                <div class="home__feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>

          {/* ============ 功能速览 ============ */}
          <section ref={demosRef} style="scroll-margin-top: 76px">
            <h2 class="home__section-title js-reveal">功能速览</h2>
            <p class="home__section-desc js-reveal">点击任一功能查看真实渲染效果与可复制的双框架源码</p>
            {DEMO_GROUPS.map((g, gi) => (
              <div class="home__group js-reveal" key={g.label} style={`transition-delay: ${gi * 80}ms`}>
                <div class="home__group-label">{g.label}</div>
                <div class="home__group-grid">
                  {g.items.map((item) => (
                    <RouterLink key={item.path} to={item.path} class="home__card">
                      <span class="home__card-title">{item.title}</span>
                      <svg viewBox="0 0 24 24" width="13" height="13" class="home__card-arrow" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </RouterLink>
                  ))}
                </div>
              </div>
            ))}
            <div class="home__group js-reveal">
              <div class="home__group-label">API</div>
              <div class="home__group-grid">
                <RouterLink to="/editor/api" class="home__card">
                  <span class="home__card-title">CodeEditor API</span>
                  <svg viewBox="0 0 24 24" width="13" height="13" class="home__card-arrow" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </RouterLink>
              </div>
            </div>
          </section>

          <footer class="home__footer">
            KCodeEditor · 数据驱动的逐字符代码编辑器 · Vue3 + TypeScript + TSX
          </footer>
        </section>
      </div>
    )
  },
})
