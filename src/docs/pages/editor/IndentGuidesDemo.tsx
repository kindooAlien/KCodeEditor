import { defineComponent } from 'vue'
import DemoBlock from '@/docs/components/DemoBlock'
import IndentGuidesDemo from './demos/IndentGuidesDemo'
import guidesCode from './demos/IndentGuidesDemo.tsx?raw'
import guidesVueCode from './demos/IndentGuidesDemo.vue?raw'

export default defineComponent({
  name: 'IndentGuidesPage',
  setup() {
    return () => (
      <div>
        <p class="page-desc">
          开启 <code>indentGuides</code> 后，编辑区按<b>缩进层级</b>绘制点状竖线（VS Code
          风格缩进参考线）：每层级一条，位置 = (层级 − 1) × <code>indentSize</code> 列 —— 与<b>块头行的缩进列对齐</b>（块包裹线），线与内容之间留一个缩进单位；
          非空行按<b>本行缩进</b>绘制（闭合行 <code>{'}'}</code> 等缩进不足的行不画），块中间空行上下贯通。层级判定基于<b>行首缩进</b>
          （tab 按 indentSize 折算），配色走 token <code>--k-guide-color</code>，
          亮暗主题自动适配。参考线为 absolute 定位装饰层，不参与光标定位 / 选区 / 命中测试。
        </p>
        <DemoBlock
          title="缩进参考线"
          description="点状竖线按缩进层级对齐 · indentGuides 开关"
          code={guidesCode}
          vueCode={guidesVueCode}
        >
          <IndentGuidesDemo />
        </DemoBlock>
      </div>
    )
  },
})
