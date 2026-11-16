import { describe, it, expect } from 'vitest'
import { wordBoundaryLeft, wordBoundaryRight, wordRangeAt } from '../utils/word'

describe('word · wordBoundaryLeft', () => {
  const line = 'const foo_bar = 1;'

  it('光标在词中间：回退到词首', () => {
    expect(wordBoundaryLeft(line, 8)).toBe(6) // foo_↑bar → foo
  })
  it('先跳空白再整段跳词', () => {
    expect(wordBoundaryLeft('abc   def', 9)).toBe(6)
    expect(wordBoundaryLeft('abc   def', 6)).toBe(0)
  })
  it('标点段整段跳过', () => {
    expect(wordBoundaryLeft('a === b', 5)).toBe(2) // a ↑=== b
  })
  it('行首返回 0', () => {
    expect(wordBoundaryLeft(line, 0)).toBe(0)
  })
  it('CJK 计入词字符：整段跳过 CJK 词', () => {
    // '你好世界 x' col5 在 x 上：跳空白后整段跳 CJK 词至行首
    expect(wordBoundaryLeft('你好世界 x', 5)).toBe(0)
    expect(wordBoundaryLeft('你好世界', 4)).toBe(0)
  })
})

describe('word · wordBoundaryRight', () => {
  it('光标在词中间：前进到词尾', () => {
    expect(wordBoundaryRight('foo_bar baz', 2)).toBe(7)
  })
  it('先跳空白再整段跳词', () => {
    expect(wordBoundaryRight('abc   def', 0)).toBe(3)
    expect(wordBoundaryRight('abc   def', 3)).toBe(9)
  })
  it('标点段整段跳过', () => {
    expect(wordBoundaryRight('a === b', 2)).toBe(5)
  })
  it('行尾返回行长', () => {
    expect(wordBoundaryRight('abc', 3)).toBe(3)
  })
})

describe('word · wordRangeAt', () => {
  it('双击在词上：扩出整个词区间', () => {
    expect(wordRangeAt('const value = 1', 9)).toEqual([6, 11])
    // 词首边界也能扩词
    expect(wordRangeAt('const value = 1', 6)).toEqual([6, 11])
    // 词尾边界也能扩词
    expect(wordRangeAt('const value = 1', 11)).toEqual([6, 11])
  })
  it('下划线 / $ / 数字属于词', () => {
    expect(wordRangeAt('_private$1 = 2', 4)).toEqual([0, 10])
  })
  it('双击在空白段：选中空白段（VS Code 行为）', () => {
    expect(wordRangeAt('ab    cd', 4)).toEqual([2, 6])
  })
  it('双击在标点上：无可选中段返回 null（实现仅处理词/空白段）', () => {
    expect(wordRangeAt('a === b', 3)).toBeNull()
  })
  it('空行返回 null', () => {
    expect(wordRangeAt('', 0)).toBeNull()
  })
})
