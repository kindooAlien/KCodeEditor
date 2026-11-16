import { defineComponent } from 'vue'
import DemoBlock from '@/docs/components/DemoBlock'
import LineNumberDemo from './demos/LineNumberDemo'
import lineNumberCode from './demos/LineNumberDemo.tsx?raw'
import lineNumberVueCode from './demos/LineNumberDemo.vue?raw'

export default defineComponent({
  name: 'LineNumberPage',
  setup() {
    return () => (
      <div>
        <p class="page-desc">
          <code>showLineNumber</code> 显示左侧行号槽。行号宽度随总行数位数自适应，
          行号槽独立于滚动容器：内容横向滚动时行号不动，纵向滚动实时同步。
          与 <code>highlightActiveLine</code> 组合时，当前行的行号同步提亮。
        </p>
        <DemoBlock title="行号槽" code={lineNumberCode}
          vueCode={lineNumberVueCode}>
          <LineNumberDemo />
        </DemoBlock>
      </div>
    )
  },
})
