/**
 * 词边界工具：Ctrl+←/→ 按词移动、Ctrl+Backspace/Delete 按词删除、双击选词共用的纯函数。
 * 词定义：字母 / 数字 / 下划线 / $ / CJK 为词字符；其余按「空白段」「标点段」分段处理。
 */

const WORD_RE = /[A-Za-z0-9_$\u4e00-\u9fff]/
const SPACE_RE = /\s/

function isWordChar(ch: string): boolean {
  return WORD_RE.test(ch)
}

function isSpaceChar(ch: string): boolean {
  return SPACE_RE.test(ch)
}

/** 向左找词边界（不越过行首）：先跳空白，再整段跳过词或标点 */
export function wordBoundaryLeft(line: string, col: number): number {
  let i = Math.min(Math.max(col, 0), line.length)
  while (i > 0 && isSpaceChar(line[i - 1])) i--
  if (i > 0 && isWordChar(line[i - 1])) {
    while (i > 0 && isWordChar(line[i - 1])) i--
  } else {
    while (i > 0 && !isWordChar(line[i - 1]) && !isSpaceChar(line[i - 1])) i--
  }
  return i
}

/** 向右找词边界（不越过行尾）：先跳空白，再整段跳过词或标点 */
export function wordBoundaryRight(line: string, col: number): number {
  let i = Math.min(Math.max(col, 0), line.length)
  while (i < line.length && isSpaceChar(line[i])) i++
  if (i < line.length && isWordChar(line[i])) {
    while (i < line.length && isWordChar(line[i])) i++
  } else {
    while (i < line.length && !isWordChar(line[i]) && !isSpaceChar(line[i])) i++
  }
  return i
}

/**
 * 光标处的完整词区间 [start, end)（双击选词用）：
 * - 光标落在词字符边界上 → 扩出整个词
 * - 落在空白段 → 选中该空白段（与 VS Code 行为一致）
 * - 空行 / 无可选中内容 → null
 */
export function wordRangeAt(line: string, col: number): [number, number] | null {
  const c = Math.min(Math.max(col, 0), line.length)
  let start = c
  let end = c
  // 左右任一侧是词字符即视为在词上
  const onWordLeft = start > 0 && isWordChar(line[start - 1])
  const onWordRight = end < line.length && isWordChar(line[end])
  if (onWordLeft || onWordRight) {
    while (start > 0 && isWordChar(line[start - 1])) start--
    while (end < line.length && isWordChar(line[end])) end++
    return [start, end]
  }
  // 空白段
  while (start > 0 && isSpaceChar(line[start - 1])) start--
  while (end < line.length && isSpaceChar(line[end])) end++
  return start === end ? null : [start, end]
}
