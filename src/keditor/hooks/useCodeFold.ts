import { computed, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { CharModelApi } from './useCharModel'
import type { CaretApi } from './useCaret'

/**
 * 代码折叠：
 * - 单次全文扫描做括号配对（字符串感知，跳过 "" 内容与转义符），生成「起始行 → 结束行」折叠区间
 * - 同一行内开合的括号（如 { "ok": null }）不可折叠，要求结束行 > 起始行
 * - 折叠 = 隐藏 [start+1, end] 区间的行；起始行尾部显示 ⋯ 徽标，点击可展开
 * - 折叠时若光标落在将被隐藏的区域，自动移到折叠起始行行尾
 */
export interface CodeFoldApi {
  /** 可折叠区间：起始行 → 结束行 */
  foldable: Ref<Map<number, number>>
  /** 已折叠的起始行集合 */
  foldedStarts: Ref<Set<number>>
  /** 当前被隐藏的行集合（多个折叠区间的并集） */
  hiddenLines: Ref<Set<number>>
  isFoldable(line: number): boolean
  isFolded(line: number): boolean
  /** 折叠 / 展开某个起始行 */
  toggleFold(start: number): void
}

export function useCodeFold(model: CharModelApi, caret: CaretApi): CodeFoldApi {
  const foldable = ref(new Map<number, number>())
  const foldedStarts = ref(new Set<number>())

  function recompute(): void {
    const map = new Map<number, number>()
    const stack: number[] = [] // 开括号所在行
    let inString = false
    let escaped = false
    const lines = model.lines.value

    for (let i = 0; i < lines.length; i++) {
      const text = lines[i]
      for (let c = 0; c < text.length; c++) {
        const ch = text[c]
        if (inString) {
          if (escaped) escaped = false
          else if (ch === '\\') escaped = true
          else if (ch === '"') inString = false
          continue
        }
        if (ch === '"') {
          inString = true
          continue
        }
        if (ch === '{' || ch === '[') {
          stack.push(i)
        } else if (ch === '}' || ch === ']') {
          const openLine = stack.pop()
          // 结束行 > 开始行才是跨行块，才有折叠意义
          if (openLine !== undefined && openLine < i) map.set(openLine, i)
        }
      }
    }

    foldable.value = map
    // 内容变化后清理已失效的折叠状态
    const next = new Set<number>()
    for (const start of foldedStarts.value) {
      if (map.has(start)) next.add(start)
    }
    foldedStarts.value = next
  }

  watch(model.lines, recompute, { immediate: true })

  const hiddenLines = computed<Set<number>>(() => {
    const hidden = new Set<number>()
    for (const start of foldedStarts.value) {
      const end = foldable.value.get(start)
      if (end === undefined) continue
      for (let l = start + 1; l <= end; l++) hidden.add(l)
    }
    return hidden
  })

  function isFoldable(line: number): boolean {
    return foldable.value.has(line)
  }

  function isFolded(line: number): boolean {
    return foldedStarts.value.has(line)
  }

  function toggleFold(start: number): void {
    const next = new Set(foldedStarts.value)
    if (next.has(start)) {
      next.delete(start)
    } else {
      next.add(start)
      const end = foldable.value.get(start)
      const p = caret.pos.value
      if (end !== undefined && p.line > start && p.line <= end) {
        caret.setPos({ line: start, col: model.getLine(start).length })
      }
    }
    foldedStarts.value = next
  }

  return {
    foldable,
    foldedStarts,
    hiddenLines,
    isFoldable,
    isFolded,
    toggleFold,
  }
}
