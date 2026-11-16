import { computed } from 'vue'
import type { Ref } from 'vue'
import type { CharModelApi } from './useCharModel'
import type { TokenType } from '@/keditor/config/editor-theme'

/**
 * 轻量语法高亮：单行正则分词（不做跨行状态、不做完整 parser）。
 *
 * 定位与取舍：
 * - 覆盖常见语言的核心 token（字符串 / 注释 / 数字 / 关键字 / 布尔 / 对象 key / 标签 / 属性 / 标点）
 * - 逐行独立分词，跨行字符串与跨行注释的高亮不处理（行内闭合的才着色），
 *   这是轻量组件的明确边界，完整高亮应交给专业方案（如 monaco / shiki）
 * - token 结果按字符区间给出，CodeLine 在逐字符渲染时映射到 span 的 token class
 */
export interface LineToken {
  /** 起始列（含） */
  start: number
  /** 结束列（不含） */
  end: number
  type: TokenType
}

/** 内置支持的语言（language prop 大小写不敏感） */
export const SUPPORTED_LANGUAGES = [
  'json',
  'javascript',
  'typescript',
  'html',
  'css',
  'java',
  'php',
  'go',
  'c',
  'csharp',
] as const

/** 语言别名归一化 */
const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  'c#': 'csharp',
  'c++': 'cpp',
  cs: 'csharp',
  golang: 'go',
  vue: 'html',
  xml: 'html',
  xhtml: 'html',
}

export function normalizeLanguage(language: string): string {
  const key = language.trim().toLowerCase()
  return LANGUAGE_ALIASES[key] ?? key
}

/** 各语言关键字表（不含 true/false/null，它们走 boolean 组） */
const LANGUAGE_KEYWORDS: Record<string, string> = {
  json: '',
  javascript:
    'const let var function return if else for while do class extends new this typeof instanceof await async yield delete void in of try catch finally throw switch case break continue default export import from as debugger static get set',
  typescript:
    'const let var function return if else for while do class extends new this typeof instanceof await async yield delete void in of try catch finally throw switch case break continue default export import from as debugger static get set interface type enum implements declare namespace abstract readonly public private protected keyof infer is asserts satisfies override module',
  html: '',
  css: '',
  java: 'abstract assert boolean break byte case catch char class continue default do double else enum extends final finally float for if implements import instanceof int interface long native new package private protected public return short static super switch synchronized this throw throws try void volatile while var record sealed',
  php:
    'abstract and array as break callable case catch class clone continue declare default do echo else elseif enddeclare endfor endforeach endif endswitch endwhile extends final finally fn for foreach function global goto if implements include include_once instanceof insteadof interface isset list match namespace new or print private protected public readonly require require_once return static switch throw trait try unset use var while xor yield',
  go: 'break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var',
  c: 'auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while',
  csharp:
    'abstract as base bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern false finally fixed float for foreach goto if implicit in int interface internal is lock long namespace new object operator out override params private protected public readonly ref return sbyte sealed short sizeof stackalloc static string struct switch this throw try typeof uint ulong unchecked unsafe ushort using var virtual void volatile while async await get set record',
}

/* ---- 正则片段 ---- */
const R_STRING = '"(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\'|`(?:\\\\.|[^`\\\\])*`'
const R_COMMENT_C = '//[^\\n]*|/\\*[\\s\\S]*?(?:\\*/|$)'
const R_COMMENT_HTML = '<!--[\\s\\S]*?(?:-->|$)'
const R_NUMBER = '\\b0[xX][\\da-fA-F]+\\b|\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b'
const R_QUOTED_KEY = '("(?:\\\\.|[^"\\\\])*")(?=\\s*:)'
const R_KEY = '[A-Za-z_$][\\w$-]*(?=\\s*:)'
const R_TAG = '<\\/?[A-Za-z][\\w-]*|\\/?>'
const R_ATTR = '[A-Za-z-]+(?=\\s*=)'
const R_PUNCT = '[{}()\\[\\];,.:+\\-*/<>=!?&|%~^@#]'
const R_BOOL = '\\b(?:true|false|null|True|False|None|nil|NULL|TRUE|FALSE)\\b'

const langRegexCache = new Map<string, RegExp>()

function buildRegex(lang: string): RegExp {
  if (lang === 'html' || lang === 'xml') {
    return new RegExp(
      `(?<c>${R_COMMENT_HTML})|(?<t>${R_TAG})|(?<s>${R_STRING})|(?<n>${R_NUMBER})|(?<a>${R_ATTR})`,
      'g',
    )
  }
  if (lang === 'css') {
    return new RegExp(
      `(?<c>/\\*[\\s\\S]*?(?:\\*/|$))|(?<s>${R_STRING})|(?<n>${R_NUMBER})|(?<k>${R_KEY})|(?<p>${R_PUNCT})`,
      'g',
    )
  }
  const kw = LANGUAGE_KEYWORDS[lang] ?? ''
  const parts = [
    `(?<qk>${R_QUOTED_KEY})`,
    `(?<c>${R_COMMENT_C})`,
    `(?<s>${R_STRING})`,
    `(?<n>${R_NUMBER})`,
    `(?<b>${R_BOOL})`,
  ]
  if (kw) parts.push(`(?<kw>\\b(?:${kw.split(/\s+/).join('|')})\\b)`)
  parts.push(`(?<k>${R_KEY})`, `(?<p>${R_PUNCT})`)
  return new RegExp(parts.join('|'), 'g')
}

function getRegex(lang: string): RegExp {
  let re = langRegexCache.get(lang)
  if (!re) {
    re = buildRegex(lang)
    langRegexCache.set(lang, re)
  }
  return re
}

/** 对单行文本做 token 切分 */
export function tokenizeLine(text: string, language: string): LineToken[] {
  const tokens: LineToken[] = []
  if (!text) return tokens
  const re = getRegex(normalizeLanguage(language))
  re.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m[0].length === 0) {
      re.lastIndex++
      continue
    }
    const g = m.groups ?? {}
    let type: TokenType
    if (g.qk !== undefined) type = 'key'
    else if (g.c !== undefined) type = 'comment'
    else if (g.s !== undefined) type = 'string'
    else if (g.n !== undefined) type = 'number'
    else if (g.b !== undefined) type = 'boolean'
    else if (g.kw !== undefined) type = 'keyword'
    else if (g.t !== undefined) type = 'tag'
    else if (g.a !== undefined) type = 'attr'
    else if (g.k !== undefined) type = 'key'
    else type = 'punct'
    tokens.push({ start: m.index, end: m.index + m[0].length, type })
  }
  return tokens
}

/**
 * 高亮 hook：模型行 → 每行 token 列表。
 *
 * 性能关键：按行惰性缓存（key = 语言 + 行文本），只有真实被渲染到的行才 tokenize。
 * - 虚拟渲染下每帧只取窗口行，大文档粘贴/滚动不再触发全量 tokenize
 * - tokenizeLine 是纯文本函数，相同文本行共享缓存；行号位移/文本变化靠 key 校验自然失效
 * - tokens 全量 computed 保留兼容（无消费者时 Vue computed 惰性不计算），新代码请用 getTokens
 */
export function useHighlight(
  model: CharModelApi,
  language: Ref<string>,
): { tokens: Ref<LineToken[][]>; getTokens: (line: number) => LineToken[] } {
  const cache = new Map<string, LineToken[]>()

  function getTokens(line: number): LineToken[] {
    const text = model.getLine(line)
    const key = normalizeLanguage(language.value) + '\u0000' + text
    let out = cache.get(key)
    if (out === undefined) {
      out = tokenizeLine(text, language.value)
      // 容量保护：超限整体清空重建（重建成本远低于内存无限膨胀）
      if (cache.size > 30000) cache.clear()
      cache.set(key, out)
    }
    return out
  }

  const tokens = computed(() => model.lines.value.map((_, i) => getTokens(i)))
  return { tokens, getTokens }
}

/**
 * 轻量语言自动检测：按内容特征推断语言（初始化时 language 为空 / 粘贴大段代码时跟随）。
 * 优先级从特征最明确的开始：php 标记 → html 标签结构 → 严格 JSON → C/Go/C#/Java 固定特征
 * → JS/TS 关键字命中 → css 选择器块。识别不出返回 ''（调用方落到纯文本）。
 */
export function detectLanguage(text: string): string {
  const t = text.trim()
  if (!t) return ''
  // php 文件头是最强特征
  if (/^<\?php\b/.test(t)) return 'php'
  // html：doctype 或成对闭合标签
  if (/^<!doctype\s+html/i.test(t)) return 'html'
  if (/<\/(html|body|head|div|p|span|section|ul|ol|li|table|a|button|input)\s*>/i.test(t)) return 'html'
  // 严格 JSON（JS 对象字面量多为单引号键 / 尾逗号，parse 会失败而落到后面分支）
  if (/^[{[]/.test(t)) {
    try {
      JSON.parse(t)
      return 'json'
    } catch {
      /* 不是合法 JSON，继续看其他特征 */
    }
  }
  // 各语言固定特征
  if (/#include\s*[<"]/.test(t)) return 'c'
  if (/\bpackage\s+[\w.]+\s*;?\s*\n/.test(t) && /\bfunc\b/.test(t)) return 'go'
  if (/\busing\s+[\w.]+\s*;/.test(t) && /\b(namespace|class)\b/.test(t)) return 'csharp'
  if (/\bpublic\s+(class|static|void|final)\b/.test(t) || /\bSystem\.out\.print/.test(t)) return 'java'
  // JS/TS：关键字命中计数（单行超短片段也算，避免 "const x = 1" 漏检）
  const jsKw = (t.match(/\b(const|let|var|function|return|import|export|from|class|extends|async|await|try|catch|finally|switch|typeof|yield)\b|=>/g) ?? []).length
  if (jsKw >= 2 || (jsKw >= 1 && /\b(const|let|var|function)\b/.test(t))) {
    // TS 特有：interface/type 声明、类型注解、as 断言
    const tsMark =
      /\b(interface|type)\s+\w+\s*[={<]|:\s*(string|number|boolean|void|any|unknown|never)\b|\bas\s+(const|unknown|any)\b/.test(t)
    return tsMark ? 'typescript' : 'javascript'
  }
  // css：选择器开块 + 属性声明（"prop: value;"），且不像 JS 对象字面量
  if (
    /(^|\n)\s*[.#@:a-zA-Z][\w\-.:>#*\s,]*\{/.test(t) &&
    /[{;]\s*[-\w]+\s*:\s*[^{}]+[;}]/.test(t)
  ) {
    return 'css'
  }
  return ''
}
