import { describe, it, expect } from 'vitest'
import { validateJson } from '../utils/jsonLint'

/** 简化断言：只取 line/col/message 三元组 */
const msgs = (text: string) =>
  validateJson(text).map((d) => `${d.line}:${d.col} ${d.message}`)

describe('jsonLint · 合法输入', () => {
  it('典型对象', () => {
    expect(validateJson('{"name": "kit", "n": 1}')).toEqual([])
  })
  it('嵌套数组 / 字面量 / 科学计数 / 负数', () => {
    expect(validateJson('{"a":[1,-2.5,3e2,true,false,null]}')).toEqual([])
  })
  it('字符串中的转义引号与括号', () => {
    expect(validateJson('{"s": "a\\"b}["}')).toEqual([])
  })
  it('多行缩进排版', () => {
    expect(validateJson('{\n  "a": {\n    "b": [1, 2]\n  }\n}')).toEqual([])
  })
  it('空对象 / 空数组', () => {
    expect(validateJson('{}')).toEqual([])
    expect(validateJson('[]')).toEqual([])
  })
})

describe('jsonLint · 括号不匹配', () => {
  it('缺失闭括号：逐个报在开括号位置', () => {
    expect(msgs('{"a": [1')).toEqual([
      '0:0 括号不匹配：{ 缺少对应的 }',
      '0:6 括号不匹配：[ 缺少对应的 ]',
    ])
  })
  it('交叉嵌套：报在出错字符；无匹配 opener 时保留栈', () => {
    // ']' 与最近的 '(' 不匹配（报 col 8）→ 栈中无 '['，保留栈 → '}' 与悬空的 '(' 失配（报 col 9）
    const d = validateJson('{"a": (1]}')
    expect(d).toHaveLength(2)
    expect(d[0].line).toBe(0)
    expect(d[0].col).toBe(8) // ']' 的位置
    expect(d[0].message).toContain('括号不匹配')
    expect(d[1].line).toBe(0)
    expect(d[1].col).toBe(9) // '}' 与未闭合的 '(' 失配
  })
  it('多余闭括号：无对应开括号', () => {
    expect(msgs('[1]}')).toContainEqual('0:3 意外的 }（没有对应的 {）')
  })
})

describe('jsonLint · 多余逗号', () => {
  it('闭括号前的 trailing comma：报在逗号位置', () => {
    expect(msgs('{"a": 1,}')).toEqual(['0:7 多余的逗号'])
  })
  it('连续逗号', () => {
    expect(msgs('{"a": 1,, "b": 2}')).toEqual(['0:8 多余的逗号'])
  })
  it('{ [ : 后的逗号', () => {
    expect(msgs('{, "a": 1}')).toEqual(['0:1 多余的逗号'])
    expect(msgs('["a":, 1]')).toContainEqual('0:5 多余的逗号')
  })
})

describe('jsonLint · 缺少逗号分隔（prevEnd 定位语义）', () => {
  it('对象内两个值缺逗号：报在上一值的末字符（闭引号）', () => {
    // 位置：{"a": "x" "b": 1} → 前值闭引号在 col 8
    const d = validateJson('{"a": "x" "b": 1}')
    expect(d).toHaveLength(1)
    expect(d[0]).toMatchObject({ line: 0, col: 8, message: '缺少逗号分隔（对象内也可能缺少冒号）' })
  })

  it('数组内两个裸 token 缺逗号：报在 token 末字符', () => {
    // [12 34] → 12 结束于 col 3（下一列），报 col 2 指向 '2'
    const d = validateJson('[12 34]')
    expect(d).toHaveLength(1)
    expect(d[0]).toMatchObject({ line: 0, col: 2 })
  })

  it('数组内闭括号后跟新值缺逗号：报在闭括号位置', () => {
    // [ [1] 2 ] → 前值 ']' 在 col 3，报 col 3
    const d = validateJson('[[1] 2]')
    expect(d).toHaveLength(1)
    expect(d[0].line).toBe(0)
    expect(d[0].col).toBe(3)
  })

  it('多行缺逗号：报在上一行行尾字符', () => {
    const d = validateJson('{\n  "a": 1\n  "b": 2\n}')
    expect(d).toHaveLength(1)
    expect(d[0].line).toBe(1)
    expect(d[0].col).toBe(7) // "a": 1 末字符 '1' 位于 line1 col7
    expect(d[0].message).toContain('缺少逗号')
  })
})

describe('jsonLint · 字符串未闭合', () => {
  it('字符串内换行未转义：报在开引号处，不级联括号错误', () => {
    const d = validateJson('{"a": "unclosed}')
    expect(d).toHaveLength(1)
    expect(d[0]).toMatchObject({ line: 0, col: 6 })
    expect(d[0].message).toContain('字符串未闭合')
  })
  it('文档结束仍在字符串内', () => {
    const d = validateJson('"abc')
    expect(d).toHaveLength(1)
    expect(d[0].message).toContain('字符串未闭合')
  })
  it('未闭合字符串后跳过结尾栈检查（防级联）', () => {
    // 第一行字符串未闭合 → 该行已解释混乱；后续 '{' 未闭合不再级联报出
    const d = validateJson('"abc\n{"x": 1')
    expect(d).toHaveLength(1)
    expect(d[0].message).toContain('字符串未闭合')
  })
})

describe('jsonLint · 同位置同类错误去重', () => {
  it('同一位置不重复推送', () => {
    const d = validateJson('{,}')
    const keys = d.map((x) => `${x.line}:${x.col}:${x.message}`)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
