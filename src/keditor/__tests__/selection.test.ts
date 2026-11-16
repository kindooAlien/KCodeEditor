import { describe, it, expect } from 'vitest'
import { useSelection } from '../hooks/useSelection'
import { useCharModel } from '../hooks/useCharModel'

function make(text: string) {
  const model = useCharModel(text)
  return { model, sel: useSelection(model) }
}

describe('selection · anchor/focus 语义', () => {
  it('startSelection 记录按下点，anchor 与 focus 相同', () => {
    const { sel } = make('abcdef')
    sel.startSelection({ line: 0, col: 2 })
    expect(sel.anchor.value).toEqual({ line: 0, col: 2 })
    expect(sel.focus.value).toEqual({ line: 0, col: 2 })
    expect(sel.hasSelection.value).toBe(false)
  })

  it('updateSelection 只动 focus，anchor 不变', () => {
    const { sel } = make('abcdef')
    sel.startSelection({ line: 0, col: 2 })
    sel.updateSelection({ line: 0, col: 5 })
    expect(sel.anchor.value).toEqual({ line: 0, col: 2 })
    expect(sel.focus.value).toEqual({ line: 0, col: 5 })
    expect(sel.hasSelection.value).toBe(true)
  })
})

describe('selection · range 规整', () => {
  it('focus 在 anchor 之后：start=anchor', () => {
    const { sel } = make('abcdef')
    sel.startSelection({ line: 0, col: 1 })
    sel.updateSelection({ line: 0, col: 4 })
    expect(sel.range.value).toEqual({ start: { line: 0, col: 1 }, end: { line: 0, col: 4 } })
  })

  it('反向拖拽：start/end 交换，selectedText 一致', () => {
    const { sel } = make('abcdef')
    sel.startSelection({ line: 0, col: 4 })
    sel.updateSelection({ line: 0, col: 1 })
    expect(sel.range.value).toEqual({ start: { line: 0, col: 1 }, end: { line: 0, col: 4 } })
    expect(sel.selectedText.value).toBe('bcd')
  })

  it('跨行选区文本以 \n 连接', () => {
    const { sel } = make('aaa\nbbb\nccc')
    sel.startSelection({ line: 0, col: 2 })
    sel.updateSelection({ line: 2, col: 1 })
    expect(sel.selectedText.value).toBe('a\nbbb\nc')
  })

  it('零宽选区（anchor=focus）range 为 null：避免 Backspace 空转', () => {
    const { sel } = make('abcdef')
    sel.startSelection({ line: 0, col: 3 })
    sel.updateSelection({ line: 0, col: 3 })
    expect(sel.hasSelection.value).toBe(false)
    expect(sel.range.value).toBeNull()
    expect(sel.selectedText.value).toBe('')
  })

  it('未开启选区时 range 为 null', () => {
    const { sel } = make('abcdef')
    expect(sel.range.value).toBeNull()
  })
})

describe('selection · lineSelection', () => {
  it('单行选区返回列区间', () => {
    const { sel } = make('abcdef')
    sel.startSelection({ line: 0, col: 1 })
    sel.updateSelection({ line: 0, col: 4 })
    expect(sel.lineSelection(0)).toEqual([1, 4])
  })

  it('跨行选区：中间行整行，末行到 end.col', () => {
    const { sel } = make('aaa\nbbb\nccc')
    sel.startSelection({ line: 0, col: 2 })
    sel.updateSelection({ line: 2, col: 1 })
    expect(sel.lineSelection(0)).toEqual([2, 3])
    expect(sel.lineSelection(1)).toEqual([0, 3])
    expect(sel.lineSelection(2)).toEqual([0, 1])
  })

  it('选区外的行返回 null', () => {
    const { sel } = make('aaa\nbbb\nccc')
    sel.startSelection({ line: 0, col: 1 })
    sel.updateSelection({ line: 0, col: 2 })
    expect(sel.lineSelection(2)).toBeNull()
  })
})

describe('selection · ensureStarted / clamp', () => {
  it('ensureStarted：无选区时以 p 开启，已有选区不覆盖 anchor', () => {
    const { sel } = make('abcdef')
    sel.ensureStarted({ line: 0, col: 1 })
    expect(sel.anchor.value).toEqual({ line: 0, col: 1 })
    sel.updateSelection({ line: 0, col: 3 })
    sel.ensureStarted({ line: 0, col: 5 })
    expect(sel.anchor.value).toEqual({ line: 0, col: 1 })
    expect(sel.focus.value).toEqual({ line: 0, col: 3 })
  })

  it('clamp：模型缩短后端点收进合法范围', () => {
    const { model, sel } = make('aaa\nbbbb\nccc')
    sel.startSelection({ line: 1, col: 4 })
    sel.updateSelection({ line: 2, col: 2 })
    model.reset('aaa\nbb')
    sel.clamp()
    expect(sel.anchor.value).toEqual({ line: 1, col: 2 })
    expect(sel.focus.value).toEqual({ line: 1, col: 2 })
    expect(sel.hasSelection.value).toBe(false)
  })
})
