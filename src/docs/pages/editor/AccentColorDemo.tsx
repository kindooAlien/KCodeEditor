import { defineComponent } from 'vue'
import DemoBlock from '@/docs/components/DemoBlock'
import AccentColorDemo from './demos/AccentColorDemo'
import accentCode from './demos/AccentColorDemo.tsx?raw'
import accentVueCode from './demos/AccentColorDemo.vue?raw'

export default defineComponent({
  name: 'AccentColorPage',
  setup() {
    return () => (
      <div>
        <p class="page-desc">
          通过 <code>theme.presetColor</code> 一键切换主题色预设：<code>green</code>（默认）、
          <code>blue</code>、<code>purple</code>。预设控制选区背景与当前行高亮两组颜色；
          合并优先级为 默认主题 &lt; 预设色 &lt; 用户显式字段，
          即在 <code>theme</code> 中同时写 <code>presetColor</code> 与
          <code>selectionBackground</code> 时，显式字段优先生效。
        </p>
        <DemoBlock
          title="主题色预设"
          description="切换 green / blue / purple，点击「预览」观察选区、当前行高亮与搜索命中的配色变化"
          code={accentCode}
          vueCode={accentVueCode}
        >
          <AccentColorDemo />
        </DemoBlock>
      </div>
    )
  },
})
