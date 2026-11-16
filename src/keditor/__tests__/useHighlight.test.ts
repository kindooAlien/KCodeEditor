import { describe, expect, it } from 'vitest'
import { tokenizeLine } from '../hooks/useHighlight'

function types(text: string, lang: string): string[] {
  return tokenizeLine(text, lang).map((t) => t.type)
}

describe('tokenizeLine 关键字分词', () => {
  it('javascript：const/let/await/return 等命中 keyword 组', () => {
    expect(types('const x = 1;', 'javascript')).toContain('keyword')
    expect(types('await fetch(url)', 'javascript')).toContain('keyword')
    expect(types('return res.json()', 'javascript')).toContain('keyword')
  })

  it('javascript：整行混合 token，keyword 数量正确', () => {
    const toks = types('const res = await fetch(url)', 'javascript')
    // const + await = 2 个 keyword
    expect(toks.filter((t) => t === 'keyword').length).toBe(2)
  })

  it('javascript：export/import/try/catch/async 均命中', () => {
    const toks = types('export async function load() {', 'javascript').filter(
      (t) => t === 'keyword',
    )
    // export + async + function
    expect(toks.length).toBe(3)
    expect(types('try {', 'javascript')).toContain('keyword')
    expect(types('} catch (e) {', 'javascript')).toContain('keyword')
    expect(types('import { ref } from "vue"', 'javascript')).toContain('keyword')
  })

  it('typescript：interface/type 等 ts 专属关键字命中', () => {
    expect(types('interface User {', 'typescript')).toContain('keyword')
    expect(types('type X = string', 'typescript')).toContain('keyword')
  })

  it('json：无 keyword 组，quoted key 命中 key', () => {
    const toks = tokenizeLine('  "name": "KCodeEditor",', 'json')
    expect(toks[0].type).toBe('key')
    expect(toks.some((t) => t.type === 'string')).toBe(true)
    expect(types('const x = 1', 'json')).not.toContain('keyword')
  })

  it('go / java / csharp：各自关键字命中', () => {
    expect(types('func main() {', 'go')).toContain('keyword')
    expect(types('public class Main {', 'java')).toContain('keyword')
    expect(types('namespace App {', 'csharp')).toContain('keyword')
  })

  it('标识符不误判为关键字（前缀不命中）', () => {
    // constant / les 是不同单词，\b 边界保证不误命中
    expect(types('constantValue', 'javascript')).not.toContain('keyword')
  })
})
