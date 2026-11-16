import { defineComponent } from 'vue'
import DemoBlock from '@/docs/components/DemoBlock'
import ControlledDemo from './demos/ControlledDemo'
import controlledCode from './demos/ControlledDemo.tsx?raw'
import controlledVueCode from './demos/ControlledDemo.vue?raw'

export default defineComponent({
  name: 'ControlledPage',
  setup() {
    return () => (
      <div>
        <p class="page-desc">
          组件通过 <code>ref</code> 暴露三个方法：<code>getText()</code> 获取原始文本、
          <code>setText(text)</code> 重置内容（光标按主题默认位置落点）、
          <code>focus()</code> 聚焦编辑区；内容变化通过 <code>onChange</code> 回调抛出。
        </p>
        <DemoBlock title="受控与外部方法" description="getText / setText / focus + onChange 回调" code={controlledCode}
          vueCode={controlledVueCode}>
          <ControlledDemo />
        </DemoBlock>
      </div>
    )
  },
})
