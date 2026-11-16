import { defineComponent } from 'vue'
import DemoBlock from '@/docs/components/DemoBlock'
import HighlightDemo from './demos/HighlightDemo'
import highlightCode from './demos/HighlightDemo.tsx?raw'
import highlightVueCode from './demos/HighlightDemo.vue?raw'

export default defineComponent({
  name: 'HighlightPage',
  setup() {
    return () => (
      <div>
        <p class="page-desc">
          代码风格三层配置：<code>showHighlight</code> 开启/关闭；
          <code>theme.highlightPreset</code> 下拉选择内置配色方案，共 13 种 ——
          暗色：default(VS Code Dark+) / monokai / one-dark / dracula / github-dark / nord / tokyo-night / gruvbox-dark / solarized-dark，
          亮色：vs-light / github-light / solarized-light / atom-one-light（需配套亮色底，可用 <code>LIGHT_HIGHLIGHT_PRESETS</code> 判断）；
          <code>theme.tokenColors</code> 按 token 类型逐项自定义，可 <code>import {'{ HIGHLIGHT_PRESETS }'}</code>{' '}
          在业务侧派生常量。优先级：默认 &lt; 预设 &lt; 显式 tokenColors。
          demo 编辑器为主题预览器：暗色主题配官方暗底、亮色主题配官方亮底，亮色文档模式下同样生效。
          分词为单行正则实现（不做跨行状态），字符串/注释/数字/关键字/布尔/对象 key/标签/属性/标点共 9 类 token。
        </p>
        <DemoBlock
          title="代码风格（语法高亮）"
          description="关闭/开启高亮、下拉切换 13 种配色预设（亮色自动配亮底）、开启自定义 tokenColors 覆盖部分类型"
          code={highlightCode}
          vueCode={highlightVueCode}
        >
          <HighlightDemo />
        </DemoBlock>
      </div>
    )
  },
})
