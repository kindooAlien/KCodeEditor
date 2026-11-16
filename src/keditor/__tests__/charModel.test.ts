import { describe, it, expect } from 'vitest'
import { useCharModel } from '../hooks/useCharModel'

/** 构造一个指定内容的模型 */
function make(text: string) {
  return useCharModel(text)
}

describe('useCharModel · 初始化', () => {
  it('空文本初始化为单空行', () => {
    const m = make('')
    expect(m.lines.value).toEqual([''])
    expect(m.lineCount.value).toBe(1)
    expect(m.getText()).toBe('')
  })

  it('多行文本按 \n 拆分', () => {
    const m = make('const a = 1;\nlet b = 2;\n')
    expect(m.lines.value).toEqual(['const a = 1;', 'let b = 2;', ''])
    expect(m.lineCount.value).toBe(3)
    expect(m.getText()).toBe('const a = 1;\nlet b = 2;\n')
  })
})

describe('useCharModel · insertText', () => {
  it('单行插入：原地拼接并返回新光标', () => {
    const m = make('hello world')
    const pos = m.insertText({ line: 0, col: 5 }, ',')
    expect(m.getLine(0)).toBe('hello, world')
    expect(pos).toEqual({ line: 0, col: 6 })
  })

  it('行内含 \n 的跨行插入：拆行为三段', () => {
    const m = make('ab')
    const pos = m.insertText({ line: 0, col: 1 }, 'X\nY\nZ')
    expect(m.lines.value).toEqual(['aX', 'Y', 'Zb'])
    expect(pos).toEqual({ line: 2, col: 1 })
  })

  it('末尾换行插入：产生新的空行', () => {
    const m = make('ab')
    const pos = m.insertText({ line: 0, col: 2 }, '\n')
    expect(m.lines.value).toEqual(['ab', ''])
    expect(pos).toEqual({ line: 1, col: 0 })
  })

  it('越界位置被钳制到合法范围', () => {
    const m = make('abc')
    const pos = m.insertText({ line: 5, col: 99 }, '!')
    expect(m.getLine(0)).toBe('abc!')
    expect(pos).toEqual({ line: 0, col: 4 })
  })
})

describe('useCharModel · deleteRange', () => {
  it('行内区间删除', () => {
    const m = make('abcdef')
    const pos = m.deleteRange({ line: 0, col: 1 }, { line: 0, col: 4 })
    expect(m.getLine(0)).toBe('aef')
    expect(pos).toEqual({ line: 0, col: 1 })
  })

  it('跨行区间删除：合并首尾行、移除中间行及区间内字符', () => {
    const m = make('aaa\nbbb\nccc')
    const pos = m.deleteRange({ line: 0, col: 2 }, { line: 2, col: 1 })
    expect(m.lines.value).toEqual(['aacc'])
    expect(pos).toEqual({ line: 0, col: 2 })
  })

  it('start > end 时自动交换', () => {
    const m = make('abcdef')
    const pos = m.deleteRange({ line: 0, col: 4 }, { line: 0, col: 1 })
    expect(m.getLine(0)).toBe('aef')
    expect(pos).toEqual({ line: 0, col: 1 })
  })

  it('相同点为空删除：模型不变', () => {
    const m = make('abc')
    const pos = m.deleteRange({ line: 0, col: 1 }, { line: 0, col: 1 })
    expect(m.getText()).toBe('abc')
    expect(pos).toEqual({ line: 0, col: 1 })
  })
})

describe('useCharModel · deleteBackward / deleteForward', () => {
  it('行中向后删除一个字符', () => {
    const m = make('abc')
    const pos = m.deleteBackward({ line: 0, col: 2 })
    expect(m.getLine(0)).toBe('ac')
    expect(pos).toEqual({ line: 0, col: 1 })
  })

  it('行首向后删除：与上一行合并', () => {
    const m = make('ab\ncd')
    const pos = m.deleteBackward({ line: 1, col: 0 })
    expect(m.lines.value).toEqual(['abcd'])
    expect(pos).toEqual({ line: 0, col: 2 })
  })

  it('文档起始向后删除：无操作', () => {
    const m = make('abc')
    const pos = m.deleteBackward({ line: 0, col: 0 })
    expect(m.getText()).toBe('abc')
    expect(pos).toEqual({ line: 0, col: 0 })
  })

  it('行中向前删除一个字符', () => {
    const m = make('abc')
    const pos = m.deleteForward({ line: 0, col: 1 })
    expect(m.getLine(0)).toBe('ac')
    expect(pos).toEqual({ line: 0, col: 1 })
  })

  it('行尾向前删除：与下一行合并', () => {
    const m = make('ab\ncd')
    const pos = m.deleteForward({ line: 0, col: 2 })
    expect(m.lines.value).toEqual(['abcd'])
    expect(pos).toEqual({ line: 0, col: 2 })
  })

  it('文档末尾向前删除：无操作', () => {
    const m = make('abc')
    const pos = m.deleteForward({ line: 0, col: 3 })
    expect(m.getText()).toBe('abc')
    expect(pos).toEqual({ line: 0, col: 3 })
  })
})

describe('useCharModel · reset', () => {
  it('重置覆盖全部内容', () => {
    const m = make('aaa\nbbb')
    m.reset('x')
    expect(m.lines.value).toEqual(['x'])
  })

  it('重置为空串回到单空行', () => {
    const m = make('aaa\nbbb')
    m.reset('')
    expect(m.lines.value).toEqual([''])
    expect(m.lineCount.value).toBe(1)
  })
})
