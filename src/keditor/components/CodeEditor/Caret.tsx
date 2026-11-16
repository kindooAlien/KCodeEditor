import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { CSSProperties } from 'vue'

/**
 * 自绘光标：一条闪烁的竖线，绝对定位在 content 容器内。
 * 位置由 useCaretRect 根据字符 span 的几何信息计算。
 */
export default defineComponent({
  name: 'KCaret',
  props: {
    style: { type: Object as PropType<CSSProperties>, required: true },
  },
  setup(props) {
    return () => <div class="k-editor__caret" style={props.style} />
  },
})
