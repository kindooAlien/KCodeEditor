import { defineComponent } from 'vue'
import DemoBlock from '@/docs/components/DemoBlock'
import BasicDemo from './demos/BasicDemo'
import basicCode from './demos/BasicDemo.tsx?raw'
import basicVueCode from './demos/BasicDemo.vue?raw'

export default defineComponent({
  name: 'BasicPage',
  setup() {
    return () => (
      <div>
        <p class="page-desc">
          KEditor 是数据驱动的逐字符代码编辑组件：字符模型是唯一数据源，DOM 只是投影。
          每个字符渲染为独立 <code>span</code>，转义字符（如 <code>\"</code>、<code>\n</code>）原样呈现，
          不做任何二次转义/反转义。
        </p>
        <DemoBlock title="基础编辑" description="点击定位光标 · 拖拽框选 · 方向键/Home/End · 中文输入法 · 粘贴保留转义字符" code={basicCode}
          vueCode={basicVueCode}>
          <BasicDemo />
        </DemoBlock>
      </div>
    )
  },
})
