import { computed, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { CharRange, EditorPos, LineSelection } from '@/keditor/types/editor'
import { isPosEqual, normalizeRange } from '@/keditor/utils/position'
import type { CharModelApi } from './useCharModel'

/**
 * 选区状态：anchor（按下点）与 focus（当前点）之间即选区。
 */
export interface SelectionApi {
  anchor: Ref<EditorPos | null>
  focus: Ref<EditorPos | null>
  hasSelection: Ref<boolean>
  /** 规整后的选区（start <= end），无有效选区时为 null */
  range: Ref<CharRange | null>
  /** 选中的原始文本 */
  selectedText: Ref<string>
  startSelection(p: EditorPos): void
  updateSelection(p: EditorPos): void
  /** 若当前无选区则以 p 为起点开启一个空选区（用于 shift 扩展） */
  ensureStarted(p: EditorPos): void
  clearSelection(): void
  /** 查询某行的选区列范围 [startCol, endCol)，无则返回 null */
  lineSelection(line: number): LineSelection
  /** 模型变化后钳制选区端点 */
  clamp(): void
}

export function useSelection(model: CharModelApi): SelectionApi {
  const anchor = ref<EditorPos | null>(null)
  const focus = ref<EditorPos | null>(null)

  const hasSelection = computed(() => {
    return anchor.value !== null && focus.value !== null && !isPosEqual(anchor.value, focus.value)
  })

  const range = computed<CharRange | null>(() => {
    if (anchor.value === null || focus.value === null) return null
    const r = normalizeRange(anchor.value, focus.value)
    // 零宽（点击定位后的 anchor=focus）不算有效选区：
    // 否则 Backspace 会走 deleteRange(相同点) 分支空转一次，表现为"按两下才删除"
    return isPosEqual(r.start, r.end) ? null : r
  })

  const selectedText = computed<string>(() => {
    const r = range.value
    if (!r) return ''
    const lines: string[] = []
    for (let l = r.start.line; l <= r.end.line; l++) {
      const text = model.getLine(l)
      const from = l === r.start.line ? r.start.col : 0
      const to = l === r.end.line ? r.end.col : text.length
      lines.push(text.slice(from, to))
    }
    return lines.join('\n')
  })

  function startSelection(p: EditorPos): void {
    anchor.value = { ...p }
    focus.value = { ...p }
  }

  function updateSelection(p: EditorPos): void {
    focus.value = { ...p }
  }

  function ensureStarted(p: EditorPos): void {
    if (anchor.value === null) startSelection(p)
  }

  function clearSelection(): void {
    anchor.value = null
    focus.value = null
  }

  /** per-line 选区引用稳定缓存：range 变化时整体失效，滚动/无变化帧不触发行重渲染 */
  const selCache = new Map<number, LineSelection>()
  watch(range, () => selCache.clear())

  function lineSelection(line: number): LineSelection {
    const r = range.value
    if (!r || line < r.start.line || line > r.end.line) return null
    let cached = selCache.get(line)
    if (cached === undefined) {
      const from = r.start.line === line ? r.start.col : 0
      const to = r.end.line === line ? r.end.col : model.getLine(line).length
      cached = from === to ? null : [from, to]
      selCache.set(line, cached)
    }
    return cached
  }

  function clamp(): void {
    for (const key of ['anchor', 'focus'] as const) {
      const p = anchorFocusGet(key)
      if (!p) continue
      anchorFocusSet(key, {
        line: Math.min(Math.max(p.line, 0), model.lineCount.value - 1),
        col: Math.min(Math.max(p.col, 0), model.getLine(Math.min(Math.max(p.line, 0), model.lineCount.value - 1)).length),
      })
    }
  }

  function anchorFocusGet(key: 'anchor' | 'focus'): EditorPos | null {
    return key === 'anchor' ? anchor.value : focus.value
  }

  function anchorFocusSet(key: 'anchor' | 'focus', p: EditorPos): void {
    if (key === 'anchor') anchor.value = p
    else focus.value = p
  }

  return {
    anchor,
    focus,
    hasSelection,
    range,
    selectedText,
    startSelection,
    updateSelection,
    ensureStarted,
    clearSelection,
    lineSelection,
    clamp,
  }
}
