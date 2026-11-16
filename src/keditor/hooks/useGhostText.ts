import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { EditorPos } from '@/keditor/types/editor'
import { isPosEqual } from '@/keditor/utils/position'
import type { CharModelApi } from './useCharModel'
import type { CaretApi } from './useCaret'

/** 一条幽灵补全建议：建议文本 + 产生时光标位置（位置变了则建议作废） */
export interface GhostSuggestion {
  text: string
  pos: EditorPos
}

/**
 * AI 幽灵补全（ghost text）：
 * - 宿主（如 SSE 流式回调）通过 setGhost 写入建议文本，渲染层以灰色虚影跟随光标
 * - Tab 采纳：建议原样插入模型；Esc / 任意编辑 / 光标移动即作废
 * - accepting 标志防止采纳入库触发 watch 时误清空
 */
export interface GhostTextApi {
  /** 当前建议（null 表示无），渲染层据此画虚影 */
  ghost: Ref<GhostSuggestion | null>
  /** 写入建议（空串忽略）；以当前光标位置为锚点 */
  setGhost(text: string): void
  /** 手动关闭 */
  clearGhost(): void
  /** 采纳建议：光标仍在锚点时插入建议文本，返回是否已采纳 */
  accept(): boolean
  /** Esc 处理：有建议时关闭并返回 true */
  clearIfActive(): boolean
}

export function useGhostText(model: CharModelApi, caret: CaretApi): GhostTextApi {
  const ghost = ref<GhostSuggestion | null>(null)
  let accepting = false

  function setGhost(text: string): void {
    if (!text) return
    ghost.value = { text, pos: { ...caret.pos.value } }
  }

  function clearGhost(): void {
    ghost.value = null
  }

  function accept(): boolean {
    const g = ghost.value
    if (!g) return false
    // 光标已离开建议锚点（用户编辑/移动过）→ 建议作废
    if (!isPosEqual(g.pos, caret.pos.value)) {
      ghost.value = null
      return false
    }
    accepting = true
    try {
      caret.setPos(model.insertText(g.pos, g.text))
    } finally {
      accepting = false
    }
    ghost.value = null
    return true
  }

  function clearIfActive(): boolean {
    if (!ghost.value) return false
    ghost.value = null
    return true
  }

  // 任何编辑（非采纳路径）都作废建议；采纳入库时 accepting 已复位但 ghost 已置 null，无副作用
  watch(model.lines, () => {
    if (!accepting) ghost.value = null
  })

  return { ghost, setGhost, clearGhost, accept, clearIfActive }
}
