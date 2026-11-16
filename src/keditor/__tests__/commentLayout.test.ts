import { describe, it, expect } from 'vitest'
import { buildCommentOffsets, findCommentWindow } from '../utils/commentLayout'

/** 基准：行高 21，5 行，行 1 和行 3 各有 60px 评论块 */
const extra = [0, 60, 0, 60, 0]
const rowH = 21
const offsets = buildCommentOffsets(extra, rowH)

describe('buildCommentOffsets 评论偏移前缀表', () => {
  it('首行偏移为 0，后续行累计 rowH + 评论高度', () => {
    expect(offsets).toHaveLength(6)
    expect(offsets[0]).toBe(0)
    expect(offsets[1]).toBe(21) // 行 0 无评论
    expect(offsets[2]).toBe(21 + 21 + 60) // 行 1 下方有评论块
    expect(offsets[3]).toBe(offsets[2] + 21)
    expect(offsets[5]).toBe(offsets[4] + 21)
  })

  it('无评论时退化为均匀分布 offsets[i] = i * rowH', () => {
    const plain = buildCommentOffsets([0, 0, 0], 21)
    expect(plain).toEqual([0, 21, 42, 63])
  })

  it('负值评论高度按 0 钳制（防御）', () => {
    const r = buildCommentOffsets([-5, 0], 21)
    expect(r).toEqual([0, 21, 42])
  })
})

describe('findCommentWindow 虚拟窗口范围（含评论偏移）', () => {
  it('视口在无评论区域：范围与均匀分布一致', () => {
    // 视口 [0, 50) → 行 0/1 可见（行 1 占 21+60）
    const r = findCommentWindow(offsets, extra, rowH, 0, 50, 3)
    expect(r.start).toBe(0)
    // 行 2 顶 = 102 ≥ 50+3 → end 不含行 2
    expect(r.end).toBe(2)
  })

  it('视口落在评论块下方：被评论块推下去的行能被正确选中', () => {
    // 行 1 的评论块把行 2 推到 102；视口 [85, 130) 应含行 2/3
    const r = findCommentWindow(offsets, extra, rowH, 85, 130, 3)
    expect(r.start).toBeLessThanOrEqual(2)
    expect(r.end).toBeGreaterThan(3)
  })

  it('buffer 内的行被纳入窗口', () => {
    // 视口 [0, 21) + buffer 3：行 1 底 = 81 > 3? 行 1 在 21..81，与窗口不相交但顶 21 ≤ 24 → 视 buffer 命中
    const r = findCommentWindow(offsets, extra, rowH, 0, 21, 3)
    expect(r.start).toBe(0)
    expect(r.end).toBeGreaterThan(1)
  })

  it('空内容返回空范围', () => {
    const r = findCommentWindow([0], [], 21, 0, 50, 3)
    expect(r).toEqual({ start: 0, end: 0 })
  })
})
