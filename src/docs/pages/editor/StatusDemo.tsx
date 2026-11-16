import { defineComponent } from 'vue'
import DemoBlock from '@/docs/components/DemoBlock'
import StatusDemo from './demos/StatusDemo'
import statusCode from './demos/StatusDemo.tsx?raw'
import statusVueCode from './demos/StatusDemo.vue?raw'

export default defineComponent({
  name: 'StatusBarPage',
  setup() {
    return () => (
      <div>
        <p class="page-desc">
          底部状态栏由两组配置驱动：<code>showCursorInfo</code> 显示光标实时位置
          （<code>Ln x, Col y</code>，1 基）；传入 <code>languages</code> 数组即显示语言下拉，
          当前语言由 <code>language</code> 受控，切换时回调 <code>onLanguageChange</code>。
          语言标识大小写不敏感（<code>ts</code> / <code>js</code> / <code>c#</code> 等别名自动归一化）。
        </p>
        <DemoBlock
          title="状态栏"
          description="移动光标观察左下角 Ln/Col 实时变化；右下角下拉切换语言"
          code={statusCode}
          vueCode={statusVueCode}
        >
          <StatusDemo />
        </DemoBlock>
      </div>
    )
  },
})
