import { defineComponent } from 'vue'
import DemoBlock from '@/docs/components/DemoBlock'
import ActiveLineDemo from './demos/ActiveLineDemo'
import activeLineCode from './demos/ActiveLineDemo.tsx?raw'
import activeLineVueCode from './demos/ActiveLineDemo.vue?raw'

export default defineComponent({
  name: 'ActiveLinePage',
  setup() {
    return () => (
      <div>
        <p class="page-desc">
          <code>highlightActiveLine</code> 高亮光标所在行，行号槽对应行号同步变化，
          高亮背景色可通过 <code>theme.activeLineBackground</code> 配置。
        </p>
        <DemoBlock title="当前行高亮" code={activeLineCode}
          vueCode={activeLineVueCode}>
          <ActiveLineDemo />
        </DemoBlock>
      </div>
    )
  },
})
