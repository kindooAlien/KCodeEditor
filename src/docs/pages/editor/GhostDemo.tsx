import { defineComponent } from 'vue'
import DemoBlock from '@/docs/components/DemoBlock'
import GhostDemo from './demos/GhostDemo'
import ghostCode from './demos/GhostDemo.tsx?raw'
import ghostVueCode from './demos/GhostDemo.vue?raw'

export default defineComponent({
  name: 'GhostPage',
  setup() {
    return () => (
      <div>
        <p class="page-desc">
          AI 幽灵补全（ghost text）：宿主拿到 LLM 流式响应后，通过 ref 方法
          <code>setGhost(text)</code> 把建议文本写入编辑器，灰色斜体虚影直接渲染在光标后方；
          按 <b>Tab</b> 采纳（原样插入模型，光标推进到建议末尾）、<b>Esc</b> 关闭；
          任意编辑或移动光标（离开建议锚点）都会自动作废建议，无需宿主干预。
          内部用 <code>accepting</code> 标志区分「采纳入库」与「普通编辑」，避免采纳瞬间被误清空。
        </p>
        <DemoBlock title="AI 幽灵补全" description="setGhost 流式写入 · Tab 采纳 · Esc 关闭"
          code={ghostCode} vueCode={ghostVueCode}>
          <GhostDemo />
        </DemoBlock>
      </div>
    )
  },
})
