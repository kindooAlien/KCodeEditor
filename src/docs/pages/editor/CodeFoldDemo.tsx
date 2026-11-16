import { defineComponent } from 'vue'
import DemoBlock from '@/docs/components/DemoBlock'
import CodeFoldDemo from './demos/CodeFoldDemo'
import foldCode from './demos/CodeFoldDemo.tsx?raw'
import foldVueCode from './demos/CodeFoldDemo.vue?raw'

export default defineComponent({
  name: 'CodeFoldPage',
  setup() {
    return () => (
      <div>
        <p class="page-desc">
          通过 <code>codeFold</code> 属性开启括号折叠，默认关闭。
          可折叠行的行号前会显示 <code>−</code> 图标，点击收起该括号区间，
          行首尾出现 <code>⋯</code> 徽标（点击徽标或 <code>+</code> 图标展开）。
          折叠区间识别支持跨行括号配对，且字符串内部的括号（含 <code>\&quot;</code> 转义）不会误配。
          若光标位于被收起的隐藏区间内，会自动归位到起始行末尾。
        </p>
        <DemoBlock
          title="代码折叠"
          description="点击行号前的 − / + 图标收起/展开嵌套括号区间，观察隐藏行与省略徽标"
          code={foldCode}
          vueCode={foldVueCode}
        >
          <CodeFoldDemo />
        </DemoBlock>
      </div>
    )
  },
})
