import { defineComponent } from 'vue'
import DemoBlock from '@/docs/components/DemoBlock'
import MarksDemo from './demos/MarksDemo'
import marksCode from './demos/MarksDemo.tsx?raw'
import marksVueCode from './demos/MarksDemo.vue?raw'

export default defineComponent({
  name: 'MarksPage',
  setup() {
    return () => (
      <div>
        <p class="page-desc">
          代码标注：传入 <code>marks</code> 数组（{'{'} start, end, type, message? {'}'}，
          行列 0 基，end 不含，支持跨行区间），内置 <code>squiggle</code>（波浪线）/
          <code>highlight</code>（高亮背景）/ <code>strike</code>（删除线）三种样式，
          <code>message</code> 为悬停提示。
          开启 <code>syntaxCheck</code> 时，语法诊断错误自动在出错字符上叠加红色波浪线；
          <code>gutterMarks</code> 在行号槽渲染书签 / 警告 / 错误 / 信息小圆点。
          颜色可通过 theme.markHighlightBackground / markStrikeColor 自定义。
        </p>
        <DemoBlock
          title="代码标注"
          description="波浪线 / 高亮 / 删除线 + 行号槽图标 + 语法诊断自动波浪线"
          code={marksCode}
          vueCode={marksVueCode}
        >
          <MarksDemo />
        </DemoBlock>
      </div>
    )
  },
})
