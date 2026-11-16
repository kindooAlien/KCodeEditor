import { defineComponent, ref } from 'vue'
import type { CSSProperties, PropType } from 'vue'
import type { EditorInputHandlers } from '@/keditor/hooks/useEditorInput'

/**
 * 隐藏输入捕获层：一个 1px 的透明 input。
 * 不参与任何视觉呈现，只负责：
 * - 承接键盘焦点，让浏览器原生 IME（中文输入法）正常工作
 * - 承接 composition / paste / copy 等原生事件入口
 * 所有事件处理都由外部注入（handlers），输入值用完即弃，永不作为数据源。
 */
export default defineComponent({
  name: 'KHiddenInput',
  props: {
    style: { type: Object as PropType<CSSProperties>, default: undefined },
    handlers: { type: Object as PropType<EditorInputHandlers>, required: true },
    /** 无障碍标签（屏幕阅读器 / aria） */
    ariaLabel: { type: String, default: '代码编辑器' },
  },
  setup(props, { expose }) {
    const el = ref<HTMLInputElement | null>(null)

    function focus(): void {
      el.value?.focus()
    }

    expose({ focus, el })

    return () => (
      <input
        ref={el}
        class="k-editor__input"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck={false}
        style={props.style}
        role="textbox"
        aria-multiline="true"
        aria-label={props.ariaLabel}
        onKeydown={props.handlers.onKeyDown}
        onCompositionstart={props.handlers.onCompositionStart}
        onCompositionend={props.handlers.onCompositionEnd}
        onInput={props.handlers.onInput}
        onPaste={props.handlers.onPaste}
        onCopy={props.handlers.onCopy}
        onCut={props.handlers.onCut}
      />
    )
  },
})
