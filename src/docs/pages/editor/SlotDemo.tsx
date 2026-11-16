import { defineComponent } from 'vue'
import DemoBlock from '@/docs/components/DemoBlock'
import SlotDemo from './demos/SlotDemo'
import slotCode from './demos/SlotDemo.tsx?raw'
import slotVueCode from './demos/SlotDemo.vue?raw'

export default defineComponent({
  name: 'SlotsPage',
  setup() {
    return () => (
      <div>
        <p class="page-desc">
          行号与折叠均支持插槽化自定义：
          <code>gutterSlot</code>（<code>(line) =&gt; VNodeChild</code>）在行号后追加任意内容；
          <code>foldTrigger</code> 决定折叠触发器位置 —— <code>gutter</code>（行号前，默认）或
          <code>line-start</code>（代码行最左侧，适合按 UI 设计稿布局）；
          <code>foldIcon</code>（<code>(state) =&gt; VNodeChild</code>）完全自定义 +/− 图标，
          可传图标字体、emoji 或 SVG。两个位置（行号槽 / 行首）共用同一个图标渲染函数。
        </p>
        <DemoBlock
          title="行号槽与折叠插槽"
          description="切换折叠触发器位置（行号前 / 行首最左）；开启自定义图标（▶/▼）；观察 name 行的 ★ 插槽标记"
          code={slotCode}
          vueCode={slotVueCode}
        >
          <SlotDemo />
        </DemoBlock>
      </div>
    )
  },
})
