import { describe, it, expect } from 'vitest'
import {
  comparePos,
  isPosEqual,
  normalizeRange,
  clampPos,
  offsetToPos,
} from '../utils/position'

describe('position · comparePos', () => {
  it('行优先比较', () => {
    expect(comparePos({ line: 0, col: 9 }, { line: 1, col: 0 })).toBeLessThan(0)
    expect(comparePos({ line: 2, col: 0 }, { line: 1, col: 9 })).toBeGreaterThan(0)
  })
  it('同行按列比较', () => {
    expect(comparePos({ line: 1, col: 2 }, { line: 1, col: 5 })).toBeLessThan(0)
    expect(comparePos({ line: 1, col: 5 }, { line: 1, col: 2 })).toBeGreaterThan(0)
  })
  it('相等返回 0', () => {
    expect(comparePos({ line: 3, col: 7 }, { line: 3, col: 7 })).toBe(0)
  })
})

describe('position · isPosEqual', () => {
  it('行列都相同才相等', () => {
    expect(isPosEqual({ line: 1, col: 2 }, { line: 1, col: 2 })).toBe(true)
    expect(isPosEqual({ line: 1, col: 2 }, { line: 1, col: 3 })).toBe(false)
    expect(isPosEqual({ line: 1, col: 2 }, { line: 2, col: 2 })).toBe(false)
  })
})

describe('position · normalizeRange', () => {
  it('a 在前保持原序', () => {
    const a = { line: 0, col: 1 }
    const b = { line: 1, col: 0 }
    expect(normalizeRange(a, b)).toEqual({ start: a, end: b })
  })
  it('a 在后交换为 start <= end', () => {
    const a = { line: 1, col: 0 }
    const b = { line: 0, col: 9 }
    expect(normalizeRange(a, b)).toEqual({ start: b, end: a })
  })
})

describe('position · clampPos', () => {
  const lineLenAt = (line: number) => [5, 0, 3][line] ?? 0

  it('负行列钳制到 0', () => {
    expect(clampPos({ line: -1, col: -2 }, lineLenAt, 3)).toEqual({ line: 0, col: 0 })
  })
  it('超出末行钳制到最后一行行尾', () => {
    expect(clampPos({ line: 9, col: 99 }, lineLenAt, 3)).toEqual({ line: 2, col: 3 })
  })
  it('列超出该行长度钳制到行尾（空行长 0）', () => {
    expect(clampPos({ line: 1, col: 4 }, lineLenAt, 3)).toEqual({ line: 1, col: 0 })
    expect(clampPos({ line: 0, col: 8 }, lineLenAt, 3)).toEqual({ line: 0, col: 5 })
  })
})

describe('position · offsetToPos', () => {
  // 文本 "abc\nde\n" → 行长 [3, 2, 0]
  const lineLenAt = (line: number) => [3, 2, 0][line] ?? 0

  it('偏移落在第一行内', () => {
    expect(offsetToPos(1, lineLenAt, 3)).toEqual({ line: 0, col: 1 })
  })
  it('偏移等于行长时归为该行行尾（而非下一行行首）', () => {
    expect(offsetToPos(3, lineLenAt, 3)).toEqual({ line: 0, col: 3 })
  })
  it('偏移跨过换行符进入下一行', () => {
    expect(offsetToPos(4, lineLenAt, 3)).toEqual({ line: 1, col: 0 })
    expect(offsetToPos(6, lineLenAt, 3)).toEqual({ line: 1, col: 2 })
  })
  it('超出文档钳制到最后行尾', () => {
    expect(offsetToPos(999, lineLenAt, 3)).toEqual({ line: 2, col: 0 })
  })
  it('负偏移钳制到文档开头', () => {
    expect(offsetToPos(-5, lineLenAt, 3)).toEqual({ line: 0, col: 0 })
  })
})
