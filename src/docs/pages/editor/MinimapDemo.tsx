import { defineComponent } from 'vue'
import DemoBlock from '@/docs/components/DemoBlock'
import MinimapDemo from './demos/MinimapDemo'
import minimapCode from './demos/MinimapDemo.tsx?raw'
import minimapVueCode from './demos/MinimapDemo.vue?raw'

export default defineComponent({
  name: 'MinimapPage',
  setup() {
    return () => (
      <div>
        <p class="page-desc">
          开启 <code>showMinimap</code> 后，编辑区右侧出现 canvas 缩略图：每行按
          <b>非空白长度</b>渲染为半透明色带，全文压缩进可视高度；亮框标注当前视口位置，
          点击 / 拖拽可跳转（目标行对齐视口中心）。Minimap 与<b>虚拟渲染</b>天然协同——
          超过 120 行（且未折行）时编辑区只渲染滚动窗口内的行（上下各留 8 行缓冲），
          光标行强制保留在窗口内保证定位准确；此时 DOM 节点数恒定，万行文件依然流畅。
          折行模式下两者均关闭。
        </p>
        <DemoBlock title="Minimap 缩略图与虚拟渲染" description="canvas 色带 + 视口框 + 点击/拖拽跳转"
          code={minimapCode} vueCode={minimapVueCode}>
          <MinimapDemo />
        </DemoBlock>
      </div>
    )
  },
})
