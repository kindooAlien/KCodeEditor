import type { Ref } from 'vue'
import type { EditorPos } from '@/keditor/types/editor'
import { wordRangeAt } from '@/keditor/utils/word'
import type { CharModelApi } from './useCharModel'
import type { CaretApi } from './useCaret'
import type { SelectionApi } from './useSelection'

/**
 * 鼠标交互：点击定位光标、拖拽框选、shift 点击扩展选区。
 * 每字符一个 span 的结构让命中测试退化为「target 所在 span 的序号」。
 */
export interface EditorMouseHandlers {
  onContentMousedown(e: MouseEvent): void
}

export function useEditorMouse(
  model: CharModelApi,
  caret: CaretApi,
  selection: SelectionApi,
  focusInput: () => void,
): EditorMouseHandlers {
  let dragging = false

  /** 命中测试：把鼠标事件换算成编辑器位置（line, col） */
  function hitTest(e: MouseEvent): EditorPos | null {
    const target = e.target as HTMLElement | null
    if (!target) return null
    const lineEl = target.closest<HTMLElement>('.k-editor__line')
    if (!lineEl) return null

    const line = Number(lineEl.dataset.line)
    if (Number.isNaN(line)) return null

    const charEl = target.closest<HTMLElement>('.k-editor__char')
    if (!charEl) {
      // 点在行的空白区（行尾之后或空行）：光标落到行尾
      return { line, col: model.getLine(line).length }
    }

    const parent = charEl.parentElement
    const col = parent ? Array.prototype.indexOf.call(parent.children, charEl) : 0
    // 依据鼠标在字符内的左右半区决定插入点在该字符之前还是之后
    const rect = charEl.getBoundingClientRect()
    const after = e.clientX > rect.left + rect.width / 2
    return { line, col: Math.min(col + (after ? 1 : 0), model.getLine(line).length) }
  }

  function onMove(e: MouseEvent): void {
    if (!dragging) return
    const pos = hitTest(e)
    if (pos) selection.updateSelection(pos)
  }

  function onUp(e: MouseEvent): void {
    if (!dragging) return
    dragging = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    // 拖拽过程中光标不跟随，松手时落到选区端点
    const pos = hitTest(e)
    if (pos) caret.setPos(pos)
  }

  function onContentMousedown(e: MouseEvent): void {
    // 阻止原生文本选区，选择完全由我们接管
    e.preventDefault()
    focusInput()

    const pos = hitTest(e)
    if (!pos) return

    // 三击选整行；双击选词（点在空白段时选空白段，与 VS Code 一致）
    if (e.detail >= 3) {
      const len = model.getLine(pos.line).length
      if (len > 0) {
        selection.startSelection({ line: pos.line, col: 0 })
        selection.updateSelection({ line: pos.line, col: len })
        caret.setPos({ line: pos.line, col: len })
        return
      }
    } else if (e.detail === 2) {
      const wr = wordRangeAt(model.getLine(pos.line), pos.col)
      if (wr) {
        selection.startSelection({ line: pos.line, col: wr[0] })
        selection.updateSelection({ line: pos.line, col: wr[1] })
        caret.setPos({ line: pos.line, col: wr[1] })
        return
      }
    }

    if (e.shiftKey) {
      // shift 点击：以上一次光标为锚点扩展选区
      selection.ensureStarted(caret.pos.value)
      selection.updateSelection(pos)
      dragging = true
    } else {
      caret.setPos(pos)
      selection.startSelection(pos)
      dragging = true
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return { onContentMousedown }
}

/** 供外部持有 contentRef 的类型 */
export type ContentRef = Ref<HTMLElement | null>
