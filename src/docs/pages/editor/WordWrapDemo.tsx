import { defineComponent } from 'vue'
import DemoBlock from '@/docs/components/DemoBlock'
import WordWrapDemo from './demos/WordWrapDemo'
import wrapCode from './demos/WordWrapDemo.tsx?raw'
import wrapVueCode from './demos/WordWrapDemo.vue?raw'

export default defineComponent({
  name: 'WordWrapPage',
  setup() {
    return () => (
      <div>
        <p class="page-desc">
          通过 <code>wordWrap</code> 属性开启 VS Code 风格的自动折行，默认关闭（超长行横向滚动）。
          开启后超长内容在可视区内换行，左侧行号槽按每行实际渲染高度同步，
          行号始终对齐该行的第一个视觉行，光标在折行后的视觉位置可正常点击落点与上下移动。
        </p>
        <DemoBlock
          title="自动折行"
          description="切换 wordWrap 观察超长行从横向滚动变为可视区内换行；行号槽高度随折行同步"
          code={wrapCode}
          vueCode={wrapVueCode}
        >
          <WordWrapDemo />
        </DemoBlock>
      </div>
    )
  },
})
