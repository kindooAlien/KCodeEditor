import type { CharRange, EditorPos } from '@/keditor/types/editor'

/** 比较两个位置：a 在 b 之前返回负数，之后返回正数，相等返回 0 */
export function comparePos(a: EditorPos, b: EditorPos): number {
  return a.line !== b.line ? a.line - b.line : a.col - b.col
}

/** 判断两个位置是否相等 */
export function isPosEqual(a: EditorPos, b: EditorPos): boolean {
  return a.line === b.line && a.col === b.col
}

/** 将任意两个位置规整为 start <= end 的区间 */
export function normalizeRange(a: EditorPos, b: EditorPos): CharRange {
  return comparePos(a, b) <= 0 ? { start: a, end: b } : { start: b, end: a }
}

/** 将位置钳制到 [lineCount, lineLen] 的合法范围内（lineLenMap 提供 0 行长度） */
export function clampPos(pos: EditorPos, lineLenAt: (line: number) => number, lineCount: number): EditorPos {
  const line = Math.min(Math.max(pos.line, 0), Math.max(lineCount - 1, 0))
  const maxCol = lineLenAt(line)
  return { line, col: Math.min(Math.max(pos.col, 0), maxCol) }
}

/** 将全局字符偏移（含换行符计数）转换为行列位置 */
export function offsetToPos(offset: number, lineLenAt: (line: number) => number, lineCount: number): EditorPos {
  let line = 0
  let remaining = Math.max(offset, 0)
  while (line < lineCount) {
    const len = lineLenAt(line)
    if (remaining <= len) return { line, col: remaining }
    remaining -= len + 1 // +1 为换行符本身
    line++
  }
  const last = Math.max(lineCount - 1, 0)
  return { line: last, col: lineLenAt(last) }
}
