/**
 * 悬停浮层定位计算（纯函数，可单测）。
 * 坐标体系：内容容器 absolute 坐标；边界检测以滚动视口可视区为裁剪参照（含滚动补偿）。
 */

/** 锚点：目标字符在内容坐标系中的中心 x / 顶 y / 底 y */
export interface HoverAnchor {
  cx: number
  charTop: number
  charBottom: number
}

/** 滚动视口可视区参数 */
export interface HoverViewport {
  scrollTop: number
  scrollLeft: number
  clientWidth: number
  clientHeight: number
}

/** 定位结果：x 为浮层中心（配合 translateX(-50%)），y 为浮层顶部（内容坐标），below 标记翻转方向 */
export interface HoverPlacement {
  x: number
  y: number
  below: boolean
}

/**
 * 边界处理：
 * - 纵向：优先在字符上方；可视区上方空间不足且下方放得下则翻转到下方；都放不下则钉在可视区顶部
 * - 横向：以字符中心为理想位，钳制在可视区左右内边距内；浮层宽于可视区时居中
 */
export function placeHoverTip(
  anchor: HoverAnchor,
  viewport: HoverViewport,
  width: number,
  height: number,
  gap = 6,
  inset = 4,
): HoverPlacement {
  const { scrollTop: st, scrollLeft: sl, clientWidth: viewW, clientHeight: viewH } = viewport
  // 纵向：可视区坐标判断上下空间，最终 y 用内容坐标（absolute 定位基准是内容容器）
  const charTopVis = anchor.charTop - st
  const charBottomVis = anchor.charBottom - st
  let below = false
  let y = anchor.charTop - gap - height
  if (charTopVis - gap - height < inset) {
    if (charBottomVis + gap + height <= viewH - inset) {
      below = true
      y = anchor.charBottom + gap
    } else {
      y = st + inset
    }
  }
  // 横向：可视区坐标钳制
  const cxVis = anchor.cx - sl
  const half = width / 2
  let x = anchor.cx
  if (cxVis - half < inset) x = sl + inset + half
  if (cxVis + half > viewW - inset) x = sl + viewW - inset - half
  // 浮层比可视区还宽时退化为居中（水平溢出不可避免，交给 max-width）
  if (width + inset * 2 > viewW) x = sl + viewW / 2
  return { x, y, below }
}
