import { describe, expect, it } from 'vitest'
import { detectLanguage } from '../hooks/useHighlight'

describe('detectLanguage 轻量语言自动检测', () => {
  it('空文本返回空串', () => {
    expect(detectLanguage('')).toBe('')
    expect(detectLanguage('   \n  ')).toBe('')
  })

  it('严格 JSON（对象 / 数组）识别为 json', () => {
    expect(detectLanguage('{"name": "keditor", "version": 1}')).toBe('json')
    expect(detectLanguage('[1, 2, 3]')).toBe('json')
    expect(
      detectLanguage('{\n  "a": true,\n  "b": null,\n  "c": [1, "x"]\n}'),
    ).toBe('json')
  })

  it('JS 对象字面量（单引号 / 尾逗号）不误判为 json，识别为 javascript', () => {
    const code = "const config = {\n  theme: 'dark',\n  size: 2,\n}"
    expect(detectLanguage(code)).toBe('javascript')
  })

  it('javascript：const/import/async 等关键字命中', () => {
    expect(
      detectLanguage(
        'export async function request() {\n  const res = await fetch(url)\n  return res.json()\n}',
      ),
    ).toBe('javascript')
    expect(detectLanguage('const x = 1')).toBe('javascript')
    expect(detectLanguage('import { ref } from "vue"')).toBe('javascript')
    expect(
      detectLanguage('try {\n  doSomething()\n} catch (e) {\n  console.error(e)\n}'),
    ).toBe('javascript')
  })

  it('typescript：类型注解 / interface 识别为 typescript', () => {
    expect(
      detectLanguage(
        'interface User {\n  name: string\n  age: number\n}\n\nconst u: User = load()',
      ),
    ).toBe('typescript')
  })

  it('html：doctype / 成对闭合标签', () => {
    expect(detectLanguage('<!DOCTYPE html>\n<html><body></body></html>')).toBe('html')
    expect(detectLanguage('<div class="a">\n  <p>hi</p>\n</div>')).toBe('html')
  })

  it('php：文件头标记', () => {
    expect(detectLanguage('<?php\nfunction a() { return 1; }\n')).toBe('php')
  })

  it('go：package + func', () => {
    expect(
      detectLanguage('package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("hi")\n}'),
    ).toBe('go')
  })

  it('java：public class 特征', () => {
    expect(
      detectLanguage('public class Main {\n  public static void main(String[] args) {}\n}'),
    ).toBe('java')
  })

  it('csharp：using + namespace', () => {
    expect(
      detectLanguage('using System;\n\nnamespace App {\n  class Program {}\n}'),
    ).toBe('csharp')
  })

  it('c：#include 特征', () => {
    expect(detectLanguage('#include <stdio.h>\n\nint main(void) {\n  return 0;\n}')).toBe('c')
  })

  it('css：选择器块 + 属性声明', () => {
    expect(detectLanguage('.btn {\n  color: red;\n  margin: 0 auto;\n}')).toBe('css')
  })

  it('普通文本不误判', () => {
    expect(detectLanguage('hello world')).toBe('')
    expect(detectLanguage('这是一段中文说明')).toBe('')
    expect(detectLanguage('The return policy of our store')).toBe('')
  })
})
