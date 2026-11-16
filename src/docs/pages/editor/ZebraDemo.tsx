import { defineComponent } from 'vue'
import DemoBlock from '@/docs/components/DemoBlock'
import ZebraDemo from './demos/ZebraDemo'
import zebraCode from './demos/ZebraDemo.tsx?raw'
import zebraVueCode from './demos/ZebraDemo.vue?raw'

export default defineComponent({
  name: 'ZebraPage',
  setup() {
    return () => (
      <div>
        <p class="page-desc">
          <code>zebraStripe</code> 为奇偶行显示交替背景。斑马纹按行号奇偶计算（不依赖 DOM 顺序），
          背景铺满可视区宽度，颜色可通过 <code>theme.zebraBackground</code> 配置。
        </p>
        <DemoBlock title="斑马纹" code={zebraCode}
          vueCode={zebraVueCode}>
          <ZebraDemo />
        </DemoBlock>
      </div>
    )
  },
})
