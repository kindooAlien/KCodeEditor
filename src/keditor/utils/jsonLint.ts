/**
 * JSON 轻量语法校验（无 parser 依赖，扫描字符模型）：
 * - 字符串未闭合（换行未转义 / 文档结束仍在字符串内）
 * - 括号不匹配：{ [ ( 与 } ] ) 交叉或缺失（报告失配位置）
 * - 多余逗号（}, ] 前的逗号 / 连续逗号 / { [ , : 后的逗号）
 * - 缺少逗号分隔（容器内上一值已结束又出现新值，报在上一行行尾）
 *
 * 诊断位置策略：
 * - 缺逗号报在「上一个值的末字符」（prevEnd.col - 1），贴近用户心智
 * - 括号失配报在出错字符位置，并 resync 弹栈到最近的匹配 opener，防错误级联
 * - 未闭合字符串后跳过结尾栈检查，防级联
 * - 单一位置同类错误去重
 */

const OPENERS = '([{'
const CLOSERS: Record<string, { ch: string; label: string }> = {
  '}': { ch: '{', label: '{' },
  ']': { ch: '[', label: '[' },
  ')': { ch: '(', label: '(' },
}
const OPEN_LABEL: Record<string, string> = { '{': '}', '[': ']', '(': ')' }

/** 校验一段 JSON 文本，返回诊断列表（行列 0 基） */
export function validateJson(text: string): SyntaxDiagnostic[] {
  const diags: SyntaxDiagnostic[] = []
  /** 括号栈：记录开括号字符与行列 */
  const stack: Array<{ ch: string; line: number; col: number }> = []
  let line = 0
  let col = 0
  /** 上一个非空白字符（判断多余逗号用） */
  let prevSignificant = ''
  /** 上一个 JSON 值是否刚结束（string/number/字面量/闭括号）：用于缺逗号检测 */
  let valueEnded = false
  /** 最近的逗号位置（闭合括号前判断 trailing comma 用） */
  let lastComma: { line: number; col: number } | null = null
  /** 上一个值（字符串/裸 token/闭括号）结束后的位置：缺逗号报在上一行行尾而非新值开头 */
  let prevEnd: { line: number; col: number } | null = null
  /** 是否出现过未闭合字符串：字符串错误已解释后续混乱，结尾不再级联报括号问题 */
  let unclosedString = false
  let i = 0

  const push = (d: SyntaxDiagnostic) => {
    // 每类问题在同一位置只报一次
    const last = diags[diags.length - 1]
    if (!last || last.line !== d.line || last.col !== d.col || last.message !== d.message) {
      diags.push(d)
    }
  }

  while (i < text.length) {
    const c = text[i]
    if (c === '"') {
      // 容器内上一个值已结束又来了新字符串 → 缺逗号（或 key 后缺冒号）
      if (valueEnded && stack.length > 0) {
        push({
          line: prevEnd ? prevEnd.line : line,
          col: prevEnd ? prevEnd.col - 1 : col,
          message: '缺少逗号分隔（对象内也可能缺少冒号）',
        })
      }
      // 字符串扫描：遇未转义换行视为未闭合
      const startLine = line
      const startCol = col
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
          break
        }
        if (sc === '"') {
          closed = true
          i++
          col++
          break
        }
        i++
        col++
      }
      if (!closed) {
        push({ line: startLine, col: startCol, message: '字符串未闭合（引号缺失或字符串内换行未转义）' })
        unclosedString = true
        // 从出错行继续：跳过本行剩余部分，状态按行重置
        line++
        col = 0
        prevSignificant = ''
        prevEnd = null
        continue
      }
      prevSignificant = '"'
      valueEnded = true
      lastComma = null
      // col 已越过闭引号，prevEnd.col - 1 即上一值的最后一个字符（闭引号）
      prevEnd = { line, col }
      continue
    }
    if (c === '\n') {
      line++
      col = 0
      i++
      continue
    }
    if (c === ' ' || c === '\t' || c === '\r') {
      i++
      col++
      continue
    }
    if (OPENERS.includes(c)) {
      stack.push({ ch: c, line, col })
      valueEnded = false
      lastComma = null
    } else if (c in CLOSERS) {
      if (lastComma) {
        push({ line: lastComma.line, col: lastComma.col, message: '多余的逗号' })
        lastComma = null
      }
      const top = stack[stack.length - 1]
      const expect = CLOSERS[c]
      if (!top) {
        push({ line, col, message: `意外的 ${c}（没有对应的 ${expect.ch}）` })
      } else if (top.ch === expect.ch) {
        stack.pop()
      } else {
        push({
          line,
          col,
          message: `括号不匹配：${c} 与最近的 ${top.ch} 不匹配（${top.ch} 应由 ${OPEN_LABEL[top.ch]} 闭合）`,
        })
        // resync：仅当栈中存在匹配 opener 时弹到它（含），否则保留栈避免后续错误级联
        let matchIdx = -1
        for (let k = stack.length - 1; k >= 0; k--) {
          if (stack[k] && stack[k].ch === expect.ch) {
            matchIdx = k
            break
          }
        }
        if (matchIdx !== -1) stack.length = matchIdx
      }
      valueEnded = true
    } else if (c === ',') {
      if (prevSignificant === ',' || prevSignificant === ':' || prevSignificant === '{' || prevSignificant === '[') {
        push({ line, col, message: '多余的逗号' })
      }
      valueEnded = false
      lastComma = { line, col }
    } else {
      // 数字 / true / false / null / 其他裸 token：累积到结构字符或空白为止
      const startLine = line
      const startCol = col
      let token = ''
      while (i < text.length && !'{}\[\]":,\n \t\r'.includes(text[i])) {
        token += text[i]
        i++
        col++
      }
      if (!token) {
        // 裸 token 起点就是结构字符（如冒号）：单字符前进，值结束状态清零
        i++
        col++
        prevSignificant = c
        valueEnded = false
        lastComma = null
        continue
      }
      // 容器内上一个值已结束又来了新 token → 缺逗号
      if (valueEnded && stack.length > 0) {
        push({
          line: prevEnd ? prevEnd.line : startLine,
          col: prevEnd ? prevEnd.col - 1 : startCol,
          message: '缺少逗号分隔（对象内也可能缺少冒号）',
        })
      }
      const isValue = /^(true|false|null|-?\d+(\.\d+)?([eE][+-]?\d+)?)$/.test(token)
      valueEnded = isValue
      prevSignificant = token[0]
      lastComma = null
      // token 结束后的下一列（报错时 -1 指向 token 末字符）
      if (isValue) prevEnd = { line: startLine, col: startCol + token.length }
      continue
    }
    prevSignificant = c
    // 结构字符（括号/逗号）后的位置：col + 1 即下一字符列，报错时 -1 指向该字符本身
    prevEnd = { line, col: col + 1 }
    i++
    col++
  }

  // 文档结束仍在字符串内（扫描中断未捕获的情况：上面换行即断，此处兜底单行未闭合）
  if (!unclosedString) {
    for (const open of stack) {
      push({ line: open.line, col: open.col, message: `括号不匹配：${open.ch} 缺少对应的 ${OPEN_LABEL[open.ch]}` })
    }
  }
  return diags
}

/** 诊断定位：行列 0 基（模型坐标），message 面向用户展示 */
export interface SyntaxDiagnostic {
  line: number
  col: number
  message: string
}
