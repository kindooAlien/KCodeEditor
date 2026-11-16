/**
 * 代码评论布局计算（纯函数，可单测）。
 *
 * 评论块是行流中的变高元素：插入在第 line 行渲染块之后。
 * offsets[i] = 第 i 行在内容区中的 y 偏移（不含调用方自行叠加的内容区顶部内边距），
 * 即 offsets[i] = Σ_{k<i} (rowH + extra[k])。
 */

/**
 * 构建行偏移前缀表：extra[i] 为第 i 行上的评论块总高度（未测得时为 0）。
 * 返回长度 n+1 的数组，offsets[n] 为内容总高（不含内边距）。
 */
export function buildCommentOffsets(extra: number[], rowH: number): number[] {
  const n = extra.length
  const offsets = new Array<number>(n + 1)
  offsets[0] = 0
  for (let i = 0; i < n; i++) {
    offsets[i + 1] = offsets[i] + rowH + Math.max(0, extra[i] ?? 0)
  }
  return offsets
}

/** 行可见判定：行区间 [offsets[idx], offsets[idx] + rowH + extra[idx]) 与窗口相交即可见 */
function lineBottom(offsets: number[], extra: number[], rowH: number, idx: number): number {
  return offsets[idx] + rowH + Math.max(0, extra[idx] ?? 0)
}

/**
 * 虚拟窗口行范围：返回 [start, end)，使窗口 [viewTop, viewBottom] ± buffer 内的行全部包含。
 * 语义与无评论时一致（top spacer = offsets[start]，bottom spacer = offsets[n] - offsets[end]）。
 */
export function findCommentWindow(
  offsets: number[],
  extra: number[],
  rowH: number,
  viewTop: number,
  viewBottom: number,
  buffer: number,
): { start: number; end: number } {
  const n = extra.length
  if (n === 0) return { start: 0, end: 0 }
  // start：最后一个「行底 ≤ viewTop - buffer」的行之后（二分）
  let lo = 0
  let hi = n
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (lineBottom(offsets, extra, rowH, mid) <= viewTop - buffer) lo = mid + 1
    else hi = mid
  }
  const start = lo
  // end：第一个「行顶 ≥ viewBottom + buffer」的行（从 start 起线性推进）
  let end = start
  while (end < n && offsets[end] < viewBottom + buffer) end++
  return { start, end: Math.max(end, start + 1) }
}
