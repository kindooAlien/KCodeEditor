import { defineComponent } from 'vue'
import { RouterLink } from 'vue-router'
import '@/docs/styles/home.css'

const FEATURES: Array<{ title: string; desc: string }> = [
  { title: '数据驱动', desc: '字符模型（lines: string[]）是唯一数据源，DOM 只是投影，任何输入先改模型再渲染' },
  { title: '逐字符 span', desc: '每个字符独立 span，搜索高亮 / 选区 / 语法着色都在字符粒度加 class' },
  { title: '不信任原生 DOM', desc: '展示层不做语义解释，textContent 原样输出，转义字符（\\"、\\n、<tag>）原样呈现且无 XSS 风险' },
  { title: '不依赖 textarea', desc: '视觉完全自绘；隐藏输入捕获层只承接焦点与 IME，值用完即弃' },
  { title: '搜索高亮', desc: '回车全局检索，命中逐字符高亮，回车循环跳转，编辑后自动重算' },
  { title: '主题 const 配置', desc: 'DEFAULT_EDITOR_THEME 覆盖字号 / 行高 / 配色 / 光标默认位置，CSS 变量注入' },
]

export default defineComponent({
  name: 'IntroPage',
  setup() {
    return () => (
      <div>
        <p class="page-desc">
          <b>KEditor</b> 是一个轻量级、数据驱动的逐字符代码编辑组件（Vue3 + TypeScript + TSX），
          架构对标 CodeMirror 的「State + View 分离」：模型拥有语义，浏览器只负责几何。
        </p>

        <h2 class="page-subtitle">特性</h2>
<div class="home__features home__features--thirds">
{FEATURES.map((f) => (
<div class="home__feature" key={f.title}>
<div class="home__feature-title">{f.title}</div>
<div class="home__feature-desc">{f.desc}</div>
</div>
))}
</div>

        <h2 class="page-subtitle">安装</h2>
        <pre class="page-pre">npm install k-code-editor</pre>

        <h2 class="page-subtitle">快速上手</h2>
        <pre class="page-pre">{`import { createApp } from 'vue'
import { KCodeEditor } from 'k-code-editor'

createApp(App).component('KCodeEditor', KCodeEditor).mount('#app')`}</pre>
        <pre class="page-pre">{`<KCodeEditor
  initialText={'{ "hello": "world" }'}
  showLineNumber
  highlightActiveLine
  showSearch
  theme={{ fontSize: 14, caretDefaultPos: 'start' }}
  onChange={(text) => console.log(text)}
/>`}</pre>

        <h2 class="page-subtitle">下一步</h2>
        <p class="page-desc">
          从 <RouterLink to="/editor/basic" class="page-link">基础用法</RouterLink> 开始，
          或直接查看 <RouterLink to="/editor/api" class="page-link">CodeEditor API</RouterLink>。
        </p>
      </div>
    )
  },
})
