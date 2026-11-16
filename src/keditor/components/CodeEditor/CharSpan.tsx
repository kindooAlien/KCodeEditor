import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { TokenType } from '@/keditor/config/editor-theme'

/**
 * 单个字符的最小渲染单元。
 * 每个字符独立成 span 是整个组件的架构基石：
 * - 展示层不做任何语义解释，textContent 原样输出（转义字符不被动过手脚）
 * - 搜索命中（is-hit / is-hit-active）、选区（is-selected）与语法 token
 *   都是在这个粒度上加 class
 */
export default defineComponent({
  name: 'KCharSpan',
  props: {
    char: { type: String, required: true },
    selected: { type: Boolean, default: false },
    /** 命中搜索关键词 */
    hit: { type: Boolean, default: false },
    /** 当前聚焦的那一条搜索命中 */
    hitActive: { type: Boolean, default: false },
    /** 语法 token 类型（showHighlight 开启时传入） */
    token: { type: String as PropType<TokenType | undefined>, default: undefined },
    /** 范围标注附加 class（如 is-mark-squiggle + 自定义 class，多个空格分隔） */
    markClass: { type: String, default: '' },
    /** 范围标注悬停提示（message） */
    markTitle: { type: String, default: '' },
  },
  setup(props) {
    return () => (
      <span
        class={{
          'k-editor__char': true,
          'is-selected': props.selected,
          'is-hit': props.hit,
          'is-hit-active': props.hitActive,
          ...(props.token ? { [`k-editor__tok-${props.token}`]: true } : {}),
          ...(props.markClass ? { [props.markClass]: true } : {}),
        }}
        data-mark-title={props.markTitle || undefined}
      >
        {props.char}
      </span>
    )
  },
})
