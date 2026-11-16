import { validateJson } from '@/keditor/utils/jsonLint'

/**
 * 可插拔语法诊断注册表：
 * - 语言 → linter 纯函数（全文 → 诊断列表，行列 0 基）
 * - JSON 是内置实现（utils/jsonLint），业务可为任意语言注册自己的 linter
 * - 未注册语言的编辑器不做校验
 */
export interface LinterDiagnostic {
  line: number
  col: number
  message: string
}

export type Linter = (text: string) => LinterDiagnostic[]

const registry = new Map<string, Linter>()

/** 注册/注销某语言的 linter（传 null 注销） */
export function registerLinter(language: string, linter: Linter | null): void {
  const key = language.trim().toLowerCase()
  if (!key) return
  if (linter) registry.set(key, linter)
  else registry.delete(key)
}

export function getLinter(language: string): Linter | undefined {
  return registry.get(language.trim().toLowerCase())
}

/**
 * 内置括号配对 linter（js/ts 等类 C 语言兜底）：
 * 字符串/行注释感知的 { [ ( 括号栈扫描，报告失配与未闭合，字符串内换行视为未闭合。
 */
export function createBracketLinter(): Linter {
  const OPEN_LABEL: Record<string, string> = { '{': '}', '[': ']', '(': ')' }
  const CLOSER_OF: Record<string, string> = { '{': '}', '[': ']', '(': ')' }
  return (text: string): LinterDiagnostic[] => {
    const diags: LinterDiagnostic[] = []
    const stack: Array<{ ch: string; line: number; col: number }> = []
    let line = 0
    let col = 0
    let i = 0
    const push = (d: LinterDiagnostic) => {
      const last = diags[diags.length - 1]
      if (!last || last.line !== d.line || last.col !== d.col || last.message !== d.message) diags.push(d)
    }
    while (i < text.length) {
      const c = text[i]
      if (c === '"' || c === "'" || c === '`') {
        // 字符串扫描（模板串允许换行；普通串换行视为未闭合）
        const startLine = line
        const startCol = col
        const quote = c
        i++
        col++
        let closed = false
        while (i < text.length) {
          const sc = text[i]
          if (sc === '\\') {
            i += 2
            col += 2
            continue
          }
          if (sc === '\n') {
            if (quote !== '`') break
            line++
            col = 0
            i++
            continue
          }
          if (sc === quote) {
            closed = true
            i++
            col++
            break
          }
          i++
          col++
        }
        if (!closed && quote !== '`') {
          push({ line: startLine, col: startCol, message: '字符串未闭合（引号缺失或字符串内换行未转义）' })
          line++
          col = 0
        }
        continue
      }
      if (c === '/' && text[i + 1] === '/') {
        // 行注释：跳过本行
        while (i < text.length && text[i] !== '\n') {
          i++
          col++
        }
        continue
      }
      if (c === '/' && text[i + 1] === '*') {
        // 块注释：跳到 */
        const startLine = line
        const startCol = col
        i += 2
        col += 2
        let closed = false
        while (i < text.length) {
          if (text[i] === '*' && text[i + 1] === '/') {
            i += 2
            col += 2
            closed = true
            break
          }
          if (text[i] === '\n') {
            line++
            col = 0
            i++
            continue
          }
          i++
          col++
        }
        if (!closed) push({ line: startLine, col: startCol, message: '块注释未闭合' })
        continue
      }
      if (c === '\n') {
        line++
        col = 0
        i++
        continue
      }
      if (c === '{' || c === '[' || c === '(') {
        stack.push({ ch: c, line, col })
        i++
        col++
        continue
      }
      if (c === '}' || c === ']' || c === ')') {
        const expect = stack[stack.length - 1]
        if (!expect) {
          push({ line, col, message: `意外的 ${c}（没有对应的 ${CLOSER_OF[c] ?? c}）` })
        } else if (CLOSER_OF[expect.ch] === c) {
          stack.pop()
        } else {
          push({
            line,
            col,
            message: `括号不匹配：${c} 与最近的 ${expect.ch} 不匹配（${expect.ch} 应由 ${OPEN_LABEL[expect.ch]} 闭合）`,
          })
          while (stack.length) {
            const popped = stack.pop()
            if (popped && CLOSER_OF[popped.ch] === c) break
          }
        }
        i++
        col++
        continue
      }
      i++
      col++
    }
    for (const open of stack) {
      push({ line: open.line, col: open.col, message: `括号不匹配：${open.ch} 缺少对应的 ${OPEN_LABEL[open.ch]}` })
    }
    return diags
  }
}

// 内置注册：JSON 完整校验；js/ts 走括号兜底
registerLinter('json', validateJson)
const bracketLinter = createBracketLinter()
for (const lang of ['js', 'ts', 'javascript', 'typescript']) {
  registerLinter(lang, bracketLinter)
}
