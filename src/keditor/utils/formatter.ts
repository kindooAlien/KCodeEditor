import { normalizeLanguage } from '@/keditor/hooks/useHighlight'

/**
 * 轻量代码格式化：
 * - json：JSON.parse + JSON.stringify（带缩进重排），解析失败降级为通用缩进整理
 * - 其他语言：字符串/注释感知的括号深度重排缩进——逐行扫描统计 {} [] () 深度，
 *   每行按深度重排行首缩进并去掉行尾空白；字符串/注释内的括号不参与计数
 *
 * 边界（轻量实现的明确取舍）：
 * - 不做语句换行/拆行，只整理既有行的缩进与空白
 * - 跨行的模板字符串/块注释中的内容按深度缩进可能不理想（罕见场景，可接受）
 */

const OPENERS = new Set(['{', '[', '('])
const CLOSERS: Record<string, string> = { '}': '{', ']': '[', ')': '(' }

/** 通用缩进整理：按括号深度重排每行缩进，清理行尾空白 */
function reindent(text: string, indentSize: number): string {
  const unit = ' '.repeat(Math.max(0, indentSize))
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let depth = 0
  /** 跨行状态：字符串 / 块注释在行间延续 */
  let inString: string | null = null
  let inBlockComment = false

  for (const raw of lines) {
    let delta = 0
    let inLineComment = false
    for (let i = 0; i < raw.length; i++) {
      const c = raw[i]
      if (inBlockComment) {
        if (c === '*' && raw[i + 1] === '/') {
          inBlockComment = false
          i++
        }
        continue
      }
      if (inLineComment) break
      if (inString) {
        if (c === '\\') i++
        else if (c === inString) inString = null
        continue
      }
      if (c === '"' || c === "'" || c === '`') {
        inString = c
        continue
      }
      if (c === '/' && raw[i + 1] === '/') {
        inLineComment = true
        break
      }
      if (c === '/' && raw[i + 1] === '*') {
        inBlockComment = true
        i++
        continue
      }
      if (OPENERS.has(c)) delta++
      else if (c in CLOSERS) delta--
    }

    // 行首是闭合括号（或 } else { 这类）时对齐到外层
    const firstChar = raw.trim()[0]
    const dedentFirst = firstChar && firstChar in CLOSERS ? 1 : 0
    const indentDepth = Math.max(0, depth - dedentFirst)
    const trimmed = raw.trim()
    out.push(trimmed ? unit.repeat(indentDepth) + trimmed : '')
    depth = Math.max(0, depth + delta)
  }
  return out.join('\n')
}

/** 格式化入口：按语言选择策略（未识别语言走通用缩进整理） */
export function formatCode(text: string, language: string, indentSize = 2): string {
  const lang = normalizeLanguage(language)
  if (lang === 'json') {
    try {
      return JSON.stringify(JSON.parse(text), null, Math.max(1, indentSize))
    } catch {
      // JSON 解析失败（粘贴的残缺片段）降级为通用缩进整理
    }
  }
  return reindent(text, indentSize)
}
