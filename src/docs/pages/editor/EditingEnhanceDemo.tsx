import { defineComponent } from 'vue'
import DemoBlock from '@/docs/components/DemoBlock'
import EditingEnhanceDemo from './demos/EditingEnhanceDemo'
import editingCode from './demos/EditingEnhanceDemo.tsx?raw'
import editingVueCode from './demos/EditingEnhanceDemo.vue?raw'

export default defineComponent({
  name: 'EditingEnhancePage',
  setup() {
    return () => (
      <div>
        <p class="page-desc">
          成熟编辑器的「底线能力」全集，默认开启、无需配置：
          <b>快照式撤销/重做</b>（Ctrl+Z / Ctrl+Y，连续输入 800ms 内自动合并为一步，
          也可通过 ref 方法 <code>undo()</code> / <code>redo()</code> 编程触发）、
          <b>词级操作</b>（双击选词、三击选行、Ctrl+←/→ 按词移动、Ctrl+Backspace/Delete 按词删除，CJK 计入词字符）、
          <b>Tab 块缩进</b>（多行选区整块缩进，Shift+Tab 反缩进）、
          <b>括号自动闭合</b>（输入 {'{ [ ( " \''} 自动补全配对符，选区被包裹，输入已配对的闭字符时跳过而非重复插入）。
        </p>
        <DemoBlock title="编辑增强" description="undo/redo · 词操作 · 块缩进 · 括号自动闭合"
          code={editingCode} vueCode={editingVueCode}>
          <EditingEnhanceDemo />
        </DemoBlock>
      </div>
    )
  },
})
