import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import type { EditorPos } from '@/keditor/types/editor'
import { clampPos, comparePos } from '@/keditor/utils/position'

/**
 * 字符模型：编辑器的唯一数据源（source of truth）。
 * DOM 只是模型的投影，任何输入操作都先改模型、再由模型驱动重渲染。
 */
export interface CharModelApi {
  /** 每个元素是一行文本（不含换行符） */
  lines: Ref<string[]>
  lineCount: Ref<number>
  getLine(line: number): string
  /** 整段原始文本（以 \n 连接），转义字符原样保留 */
  getText(): string
  /** 在指定位置插入文本（可含 \n），返回插入后的新光标位置 */
  insertText(pos: EditorPos, text: string): EditorPos
  /** 删除 [start, end) 区间，返回删除后的光标位置 */
  deleteRange(start: EditorPos, end: EditorPos): EditorPos
  /** 向前删除一个字符（处理行首合并），返回新光标位置 */
  deleteBackward(pos: EditorPos): EditorPos
  /** 向后删除一个字符（处理行尾合并），返回新光标位置 */
  deleteForward(pos: EditorPos): EditorPos
  /** 重置整个模型内容 */
  reset(text: string): void
}

export function useCharModel(initialText = ''): CharModelApi {
  const lines = ref<string[]>(initialText.length > 0 ? initialText.split('\n') : [''])

  const lineCount = computed(() => lines.value.length)

  function getLine(line: number): string {
    return lines.value[line] ?? ''
  }

  function getText(): string {
    return lines.value.join('\n')
  }

  function clamp(p: EditorPos): EditorPos {
    return clampPos(p, (line) => getLine(line).length, lines.value.length)
  }

  function insertText(pos: EditorPos, text: string): EditorPos {
    const p = clamp(pos)
    const parts = text.split('\n')
    const src = lines.value
    const before = src[p.line].slice(0, p.col)
    const after = src[p.line].slice(p.col)

    if (parts.length === 1) {
      // 单行插入：原地拼接，不新增行
      const next = [...src]
      next[p.line] = before + parts[0] + after
      lines.value = next
      return { line: p.line, col: p.col + parts[0].length }
    }

    // 跨行插入：首段接在 before 后，末段接在 after 前，中间段成为新行
    const middle = [before + parts[0], ...parts.slice(1, -1), parts[parts.length - 1] + after]
    const next = [...src]
    next.splice(p.line, 1, ...middle)
    lines.value = next
    return {
      line: p.line + parts.length - 1,
      col: parts[parts.length - 1].length,
    }
  }

  function deleteRange(start: EditorPos, end: EditorPos): EditorPos {
    let s = clamp(start)
    let e = clamp(end)
    if (comparePos(s, e) > 0) [s, e] = [e, s]
    if (s.line === e.line && s.col === e.col) return s

    const merged = lines.value[s.line].slice(0, s.col) + lines.value[e.line].slice(e.col)
    const next = [...lines.value]
    next.splice(s.line, e.line - s.line + 1, merged)
    lines.value = next
    return s
  }

  function deleteBackward(pos: EditorPos): EditorPos {
    const p = clamp(pos)
    if (p.col > 0) return deleteRange({ line: p.line, col: p.col - 1 }, p)
    // 行首：与上一行合并
    if (p.line > 0) {
      return deleteRange({ line: p.line - 1, col: getLine(p.line - 1).length }, p)
    }
    return p
  }

  function deleteForward(pos: EditorPos): EditorPos {
    const p = clamp(pos)
    if (p.col < getLine(p.line).length) return deleteRange(p, { line: p.line, col: p.col + 1 })
    // 行尾：与下一行合并
    if (p.line < lines.value.length - 1) return deleteRange(p, { line: p.line + 1, col: 0 })
    return p
  }

  function reset(text: string): void {
    lines.value = text.length > 0 ? text.split('\n') : ['']
  }

  return {
    lines,
    lineCount,
    getLine,
    getText,
    insertText,
    deleteRange,
    deleteBackward,
    deleteForward,
    reset,
  }
}
