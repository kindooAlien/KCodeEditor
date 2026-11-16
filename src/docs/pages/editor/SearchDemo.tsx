import { defineComponent } from 'vue'
import DemoBlock from '@/docs/components/DemoBlock'
import SearchDemo from './demos/SearchDemo'
import searchCode from './demos/SearchDemo.tsx?raw'
import searchVueCode from './demos/SearchDemo.vue?raw'

export default defineComponent({
  name: 'SearchPage',
  setup() {
    return () => (
      <div>
        <p class="page-desc">
          <code>showSearch</code> 在编辑器顶部显示内嵌搜索框：
          输入关键词后<b>回车</b>全局检索并高亮全部命中，光标跳到第一条；
          再按回车<b>循环跳下一条</b>（右上角显示进度，当前命中橙色高亮）；
          <b>Esc</b> 清除全部高亮。编辑内容后命中自动重算，不会错位。
          右侧替换输入框支持<b>单条替换</b>与<b>全部替换</b>（从后往前批量替换，避免偏移错位），
          编程驱动可用 <code>search.replacement</code> / <code>replaceCurrent()</code> / <code>replaceAll()</code>。
        </p>
        <DemoBlock title="搜索与替换" description="试试输入 span 或 e，再试试替换为 span" code={searchCode}
          vueCode={searchVueCode}>
          <SearchDemo />
        </DemoBlock>
      </div>
    )
  },
})
