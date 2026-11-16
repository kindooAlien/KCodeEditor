import { defineComponent } from 'vue'
import DemoBlock from '@/docs/components/DemoBlock'
import DiffDemo from './demos/DiffDemo'
import diffCode from './demos/DiffDemo.tsx?raw'
import diffVueCode from './demos/DiffDemo.vue?raw'

export default defineComponent({
  name: 'DiffPage',
  setup() {
    return () => (
      <div>
        <p class="page-desc">
          Git diff 行标记：传入 <code>diffLines</code> 数组（{'{'} line, type {'}'}，行号 0 基），
          支持 <code>added</code>（新增，绿）/ <code>removed</code>（删除，红）/
          <code>modified</code>（修改，蓝）三种类型。
          渲染为 GitLab 风格：整行（含行号槽）统一浅色底，
          行首 +/-/± 标记列着色，无侧边色条；
          颜色可通过 <code>theme.diffAddedBackground / diffRemovedBackground / diffModifiedBackground</code>{' '}
          及对应 <code>*Color</code> 字段自定义。
        </p>
        <DemoBlock
          title="代码 diff 标记"
          description="切换 diffLines 显隐，观察新增（绿）/ 删除（红）/ 修改（蓝）三种行标记"
          code={diffCode}
          vueCode={diffVueCode}
        >
          <DiffDemo />
        </DemoBlock>
      </div>
    )
  },
})
