import { nextTick, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import type { CSSProperties, Ref } from 'vue'
import type { CharModelApi } from './useCharModel'
import type { CaretApi } from './useCaret'

/**
 * 计算光标覆盖层的位置（相对 content 容器的像素坐标）。
 * 定位依据：目标行 DOM 中第 col 个字符 span 的左边缘；
 * col 在行尾时取最后一个字符的右边缘；空行取行的左边缘。
 */
export interface CaretRectApi {
  caretStyle: Ref<CSSProperties>
  /** 重新计算并应用光标位置（在 DOM 更新后执行） */
  refresh(): void
}

export function useCaretRect(
  contentRef: Ref<HTMLElement | null>,
  model: CharModelApi,
  caret: CaretApi,
): CaretRectApi {
  const caretStyle = ref<CSSProperties>({ display: 'none' })

  function refresh(): void {
    const content = contentRef.value
    if (!content) return

    const { line, col } = caret.pos.value
    const lineEl = content.querySelector<HTMLElement>(`.k-editor__line[data-line="${line}"]`)
    if (!lineEl) {
      caretStyle.value = { display: 'none' }
      return
    }

    const spans = lineEl.querySelectorAll<HTMLElement>('.k-editor__char')
    let left: number
    let top: number
    let height: number

    if (spans.length === 0) {
      const r = lineEl.getBoundingClientRect()
      left = r.left
      top = r.top
      height = r.height
    } else if (col < spans.length) {
      const r = spans[col].getBoundingClientRect()
      left = r.left
      top = r.top
      height = r.height
    } else {
      const r = spans[spans.length - 1].getBoundingClientRect()
      left = r.right
      top = r.top
      height = r.height
    }

    const contentRect = content.getBoundingClientRect()
    caretStyle.value = {
      display: 'block',
      left: `${left - contentRect.left}px`,
      top: `${top - contentRect.top}px`,
      height: `${height}px`,
    }
  }

  function scheduleRefresh(): void {
    nextTick(refresh)
  }

  watch([caret.pos, model.lines], scheduleRefresh)

  onMounted(() => {
    scheduleRefresh()
    window.addEventListener('resize', scheduleRefresh)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', scheduleRefresh)
  })

  return { caretStyle, refresh }
}
