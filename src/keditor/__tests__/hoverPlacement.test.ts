import { describe, it, expect } from 'vitest'
import { placeHoverTip } from '../utils/hoverPlacement'

/** 基准场景：可视区 300×300，无滚动，锚点在 (150, 100/121)，浮层 200×32 */
const base = {
  viewport: { scrollTop: 0, scrollLeft: 0, clientWidth: 300, clientHeight: 300 },
  anchor: { cx: 150, charTop: 100, charBottom: 121 },
}

describe('placeHoverTip 悬停浮层边界定位', () => {
  it('上方空间充足：默认放字符上方（y = charTop - gap - h）', () => {
    const r = placeHoverTip(base.anchor, base.viewport, 200, 32)
    expect(r.below).toBe(false)
    expect(r.y).toBe(100 - 6 - 32) // 62
    expect(r.x).toBe(150) // 居中不动
  })

  it('可视区顶部空间不足、下方放得下：翻转到字符下方', () => {
    // 锚点贴近可视区顶：charTopVis - gap - h < inset
    const r = placeHoverTip({ cx: 150, charTop: 30, charBottom: 51 }, base.viewport, 200, 32)
    expect(r.below).toBe(true)
    expect(r.y).toBe(51 + 6) // 57
  })

  it('上下都放不下：钉在可视区顶部（内容坐标 = scrollTop + inset）', () => {
    // 浮层比可视区还高：上下都容不下
    const vp = { scrollTop: 40, scrollLeft: 0, clientWidth: 300, clientHeight: 50 }
    const r = placeHoverTip({ cx: 150, charTop: 80, charBottom: 101 }, vp, 200, 48)
    expect(r.below).toBe(false)
    expect(r.y).toBe(40 + 4) // 44
  })

  it('左边界碰撞：左缘钳制到 scrollLeft + inset', () => {
    // 锚点靠左，半宽 100 会越出左缘
    const r = placeHoverTip({ cx: 60, charTop: 100, charBottom: 121 }, base.viewport, 200, 32)
    expect(r.x).toBe(0 + 4 + 100) // scrollLeft + inset + half
    expect(r.below).toBe(false)
  })

  it('右边界碰撞：右缘钳制到 scrollLeft + clientWidth - inset', () => {
    const r = placeHoverTip({ cx: 260, charTop: 100, charBottom: 121 }, base.viewport, 200, 32)
    expect(r.x).toBe(0 + 300 - 4 - 100)
  })

  it('水平滚动补偿：scrollLeft/scrollTop 参与钳制', () => {
    const vp = { scrollTop: 100, scrollLeft: 50, clientWidth: 300, clientHeight: 300 }
    // 内容坐标 charTop 130 → 可视区 30 → 顶部空间不足，下方放得下 → 翻转
    const r = placeHoverTip({ cx: 150, charTop: 130, charBottom: 151 }, vp, 200, 32)
    expect(r.below).toBe(true)
    expect(r.y).toBe(151 + 6)
  })

  it('浮层宽于可视区：水平退化为可视区居中', () => {
    const vp = { scrollTop: 0, scrollLeft: 20, clientWidth: 150, clientHeight: 300 }
    const r = placeHoverTip({ cx: 100, charTop: 100, charBottom: 121 }, vp, 200, 32)
    expect(r.x).toBe(20 + 150 / 2)
  })

  it('滚动到中部后字符位于可视区顶：向上翻转钉顶', () => {
    // charTop 110、scrollTop 100 → charTopVis 10，上方放不下；可视区 300 下方放得下 → 翻转
    const vp = { scrollTop: 100, scrollLeft: 0, clientWidth: 300, clientHeight: 300 }
    const r = placeHoverTip({ cx: 150, charTop: 110, charBottom: 131 }, vp, 200, 32)
    expect(r.below).toBe(true)
    expect(r.y).toBe(131 + 6)
  })
})
