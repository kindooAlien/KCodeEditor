import { defineComponent } from 'vue'
import DemoBlock from '@/docs/components/DemoBlock'
import ThemeDemo from './demos/ThemeDemo'
import themeCode from './demos/ThemeDemo.tsx?raw'
import themeVueCode from './demos/ThemeDemo.vue?raw'

export default defineComponent({
  name: 'ThemePage',
  setup() {
    return () => (
      <div>
        <p class="page-desc">
          通过 <code>theme</code> 属性传入 <code>Partial&lt;EditorTheme&gt;</code> 覆盖任意配置项，
          其余字段走 <code>DEFAULT_EDITOR_THEME</code> 默认值。也可以直接
          <code>import {'{ DEFAULT_EDITOR_THEME }'}</code> 在业务侧派生自己的主题常量。
          主题字段明细见 <a class="page-link" href="#/editor/api">CodeEditor API</a>。
        </p>
        <DemoBlock
          title="主题配置"
          description="切换字号观察行高 / 光标 / 行号槽自适应；切换 caretDefaultPos 后光标落到文档末尾"
          code={themeCode}
          vueCode={themeVueCode}
        >
          <ThemeDemo />
        </DemoBlock>
      </div>
    )
  },
})
