import { ref } from 'vue'
import type { Ref } from 'vue'
import type { CharRange, EditorPos } from '@/keditor/types/editor'
import { isPosEqual } from '@/keditor/utils/position'
import { wordBoundaryLeft, wordBoundaryRight } from '@/keditor/utils/word'
import type { CharModelApi } from './useCharModel'
import type { CaretApi } from './useCaret'
import type { SelectionApi } from './useSelection'
import type { EditKind } from './useHistory'

/** 输入捕获层的可配置项 */
export interface EditorInputOptions {
  /** Tab 键插入的缩进空格数（响应式，随 theme 更新） */
  indentSize?: Ref<number>
  /** 撤销（Ctrl+Z），由宿主接线历史栈 */
  undo?: () => void
  /** 重做（Ctrl+Y / Ctrl+Shift+Z） */
  redo?: () => void
  /** Tab 键先询问幽灵补全：返回 true 表示已采纳（本次 Tab 不再缩进） */
  onTabGhost?: () => boolean
  /** Esc 键询问关闭幽灵补全：返回 true 表示已处理 */
  onEscapeGhost?: () => boolean
  /** 粘贴完成后的文本回调（语言自动跟随检测用，applyInsert 成功后触发） */
  onPasteText?: (text: string) => void
}

/**
 * 输入捕获层的事件处理：
 * - 可打印字符 / 中文 IME / 粘贴全部进入字符模型，浏览器原生值一律丢弃
 * - 复制时从模型取原始文本（转义字符原样，不做任何二次转义/反转义）
 * - 开括号自动闭合、选区包裹、已有闭括号跳过；undo/redo、词操作、块缩进在此分发
 */
export interface EditorInputHandlers {
  /** 是否正在 IME 组合输入 */
  composing: Ref<boolean>
  /** 最近一次编辑类别（历史栈合并用），宿主消费后清回 null */
  lastEditKind: Ref<EditKind | null>
  onKeyDown(e: KeyboardEvent): void
  onCompositionStart(): void
  onCompositionEnd(e: CompositionEvent): void
  onInput(e: Event): void
  onPaste(e: ClipboardEvent): void
  onCopy(e: ClipboardEvent): void
  onCut(e: ClipboardEvent): void
}

/** 成对符号：开括号自动闭合 / 选区包裹共用 */
const PAIRS: Record<string, string> = {
  '{': '}',
  '[': ']',
  '(': ')',
  '"': '"',
  "'": "'",
  '`': '`',
}

export function useEditorInput(
  model: CharModelApi,
  caret: CaretApi,
  selection: SelectionApi,
  options?: EditorInputOptions,
): EditorInputHandlers {
  const composing = ref(false)
  const lastEditKind = ref<EditKind | null>(null)

  /** 统一的插入入口：有选区先删除选区，再在光标处插入；caretBack 让光标落在插入文本内部 */
  function applyInsert(text: string, caretBack = 0): void {
    lastEditKind.value = text.length === 1 && !text.includes('\n') ? 'type' : 'op'
    const r = selection.range.value
    let p = caret.pos.value
    if (r) {
      p = model.deleteRange(r.start, r.end)
      selection.clearSelection()
    }
    const np = model.insertText(p, text)
    caret.setPos(caretBack ? { line: np.line, col: Math.max(p.col, np.col - caretBack) } : np)
  }

  /** 选区包裹：在选区两侧插入成对符号，光标落在闭合符号之后 */
  function wrapSelection(open: string, close: string): void {
    const r = selection.range.value
    if (!r) return
    const text = selection.selectedText.value
    lastEditKind.value = 'op'
    const start = model.deleteRange(r.start, r.end)
    const endPos = model.insertText(start, open + text + close)
    selection.clearSelection()
    caret.setPos(endPos)
  }

  /** 回车换行（VS Code 自动缩进）：
   * 1. 继承本行行首空白，新行光标落在缩进末尾而非最左侧
   * 2. 光标前是 { [ ( 时多缩一层（indentSize）
   * 3. 光标前后是配对括号时自动补全，光标落在中间空行 */
  function applyEnter(): void {
    lastEditKind.value = 'op'
    const r = selection.range.value
    if (r) {
      caret.setPos(model.deleteRange(r.start, r.end))
      selection.clearSelection()
    }
    const pos = caret.pos.value
    const line = model.getLine(pos.line)
    const before = line.slice(0, pos.col)
    const after = line.slice(pos.col)
    const leading = /^[ \t]*/.exec(before)?.[0] ?? ''
    const size = Math.max(0, options?.indentSize?.value ?? 2)
    const unit = ' '.repeat(size)
    const MATCH: Record<string, string> = { '{': '}', '[': ']', '(': ')' }
    const prevChar = before.slice(-1)
    const nextChar = after.slice(0, 1)

    let text = '\n' + leading
    let caretInMiddle = false
    if (prevChar in MATCH && nextChar === MATCH[prevChar]) {
      text = '\n' + leading + unit + '\n' + leading
      caretInMiddle = true
    } else if (prevChar in MATCH) {
      text = '\n' + leading + unit
    }

    const newPos = model.insertText(pos, text)
    caret.setPos(
      caretInMiddle
        ? { line: pos.line + 1, col: leading.length + unit.length }
        : newPos,
    )
  }

  function applyBackspace(): void {
    const r = selection.range.value
    if (r) {
      lastEditKind.value = 'op'
      caret.setPos(model.deleteRange(r.start, r.end))
      selection.clearSelection()
      return
    }
    lastEditKind.value = 'delete'
    caret.setPos(model.deleteBackward(caret.pos.value))
  }

  function applyDelete(): void {
    const r = selection.range.value
    if (r) {
      lastEditKind.value = 'op'
      caret.setPos(model.deleteRange(r.start, r.end))
      selection.clearSelection()
      return
    }
    lastEditKind.value = 'delete'
    caret.setPos(model.deleteForward(caret.pos.value))
  }

  /** 光标所在位置的词边界换算（跨行时沿相邻行继续） */
  function computeWordLeft(p: EditorPos): EditorPos {
    if (p.col === 0) {
      return p.line > 0 ? { line: p.line - 1, col: model.getLine(p.line - 1).length } : p
    }
    return { line: p.line, col: wordBoundaryLeft(model.getLine(p.line), p.col) }
  }

  function computeWordRight(p: EditorPos): EditorPos {
    if (p.col >= model.getLine(p.line).length) {
      return p.line < model.lineCount.value - 1 ? { line: p.line + 1, col: 0 } : p
    }
    return { line: p.line, col: wordBoundaryRight(model.getLine(p.line), p.col) }
  }

  /** 方向键移动；shift 按住时扩展选区，ctrl/meta 按住时按词移动 */
  function handleArrow(direction: 'left' | 'right' | 'up' | 'down', extend: boolean, byWord = false): void {
    const cur = caret.pos.value
    if (extend) {
      selection.ensureStarted(cur)
    } else if (selection.hasSelection.value) {
      // 无 shift 时先塌缩选区到相应端
      const r = selection.range.value!
      caret.setPos(direction === 'left' || direction === 'up' ? r.start : r.end)
      selection.clearSelection()
      return
    }

    const next =
      direction === 'left'
        ? byWord
          ? computeWordLeft(cur)
          : caret.computeLeft(cur)
        : direction === 'right'
          ? byWord
            ? computeWordRight(cur)
            : caret.computeRight(cur)
          : direction === 'up'
            ? caret.computeUp(cur)
            : caret.computeDown(cur)

    if (extend) selection.updateSelection(next)
    caret.setPos(next)
  }

  /** 多行块缩进：对 [start.line, end.line] 每行行首插入缩进，选区扩为整行块 */
  function applyBlockIndent(r: CharRange, size: number): void {
    const indent = ' '.repeat(Math.max(0, size))
    const src = model.lines.value
    const parts: string[] = []
    for (let l = 0; l < src.length; l++) {
      parts.push(l >= r.start.line && l <= r.end.line ? indent + src[l] : src[l])
    }
    lastEditKind.value = 'op'
    model.reset(parts.join('\n'))
    const endCol = model.getLine(r.end.line).length
    selection.startSelection({ line: r.start.line, col: 0 })
    selection.updateSelection({ line: r.end.line, col: endCol })
    caret.setPos({ line: r.end.line, col: endCol })
  }

  /** 反缩进：每行移除行首至多 size 个空格或 1 个 tab；无选区时只处理当前行 */
  function applyDedent(r: CharRange | null, size: number): void {
    const src = model.lines.value
    const from = r ? r.start.line : caret.pos.value.line
    const to = r ? r.end.line : from
    const re = new RegExp('^\\t|^ {1,' + Math.max(1, size) + '}')
    const parts = [...src]
    let removedAtStart = 0
    let removedAtEnd = 0
    for (let l = from; l <= to; l++) {
      const m = re.exec(parts[l])
      const cut = m ? m[0].length : 0
      parts[l] = parts[l].slice(cut)
      if (l === from) removedAtStart = cut
      if (l === to) removedAtEnd = cut
    }
    lastEditKind.value = 'op'
    model.reset(parts.join('\n'))
    if (r) {
      const startCol = Math.max(0, r.start.col - removedAtStart)
      const endCol = Math.max(startCol, r.end.col - removedAtEnd)
      selection.startSelection({ line: from, col: startCol })
      selection.updateSelection({ line: to, col: endCol })
      caret.setPos({ line: to, col: endCol })
    } else {
      const cur = caret.pos.value
      caret.setPos({ line: cur.line, col: Math.max(0, cur.col - removedAtStart) })
    }
  }

  function onKeyDown(e: KeyboardEvent): void {
    // IME 组合期间交还浏览器，compositionend 时统一入库
    if (e.isComposing || e.keyCode === 229) return

    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        applyEnter()
        break
      case 'Backspace':
        e.preventDefault()
        if ((e.ctrlKey || e.metaKey) && !e.altKey) {
          // 词删除：从词边界删到光标
          const cur = caret.pos.value
          const target = computeWordLeft(cur)
          if (!isPosEqual(target, cur)) {
            lastEditKind.value = 'op'
            caret.setPos(model.deleteRange(target, cur))
          }
          break
        }
        applyBackspace()
        break
      case 'Delete':
        e.preventDefault()
        if ((e.ctrlKey || e.metaKey) && !e.altKey) {
          const cur = caret.pos.value
          const target = computeWordRight(cur)
          if (!isPosEqual(target, cur)) {
            lastEditKind.value = 'op'
            caret.setPos(model.deleteRange(cur, target))
          }
          break
        }
        applyDelete()
        break
      case 'ArrowLeft':
        e.preventDefault()
        handleArrow('left', e.shiftKey, e.ctrlKey || e.metaKey)
        break
      case 'ArrowRight':
        e.preventDefault()
        handleArrow('right', e.shiftKey, e.ctrlKey || e.metaKey)
        break
      case 'ArrowUp':
        e.preventDefault()
        handleArrow('up', e.shiftKey)
        break
      case 'ArrowDown':
        e.preventDefault()
        handleArrow('down', e.shiftKey)
        break
      case 'Home':
        e.preventDefault()
        if (e.shiftKey) {
          selection.ensureStarted(caret.pos.value)
          selection.updateSelection(caret.computeHome(caret.pos.value))
        } else {
          selection.clearSelection()
        }
        caret.moveHome()
        break
      case 'End':
        e.preventDefault()
        if (e.shiftKey) {
          selection.ensureStarted(caret.pos.value)
          selection.updateSelection(caret.computeEnd(caret.pos.value))
        } else {
          selection.clearSelection()
        }
        caret.moveEnd()
        break
      case 'Tab': {
        e.preventDefault()
        // 幽灵补全优先：Tab 采纳 AI 建议
        if (options?.onTabGhost?.()) break
        const size = Math.max(0, options?.indentSize?.value ?? 2)
        const r = selection.range.value
        if (e.shiftKey) {
          applyDedent(r, size)
        } else if (r) {
          // 有选区：整块缩进
          applyBlockIndent(r, size)
        } else {
          applyInsert(' '.repeat(size))
        }
        break
      }
      case 'Escape':
        // Esc 关闭幽灵补全（无幽灵时交给浏览器默认行为）
        if (options?.onEscapeGhost?.()) e.preventDefault()
        break
      case 'a':
      case 'A':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          selection.startSelection({ line: 0, col: 0 })
          selection.updateSelection({
            line: model.lineCount.value - 1,
            col: model.getLine(model.lineCount.value - 1).length,
          })
        }
        break
      case 'z':
      case 'Z':
      case 'y':
      case 'Y':
        if (e.ctrlKey || e.metaKey && !e.altKey) {
          e.preventDefault()
          const isRedo = e.key.toLowerCase() === 'y' || e.shiftKey
          if (isRedo) options?.redo?.()
          else options?.undo?.()
        }
        break
      default: {
        // 单字符按键：拦截后走模型插入（避免隐藏输入层产生不可控值）
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault()
          const closer = PAIRS[e.key]
          if (closer) {
            const r = selection.range.value
            if (r) {
              // 选区包裹：两侧插入成对符号
              wrapSelection(e.key, closer)
              break
            }
            const nextChar = model.getLine(caret.pos.value.line)[caret.pos.value.col] ?? ''
            // 输入的字符与下一个字符相同（闭括号/引号补位）→ 跳过而不重复插入
            if (nextChar === e.key) {
              lastEditKind.value = 'op'
              handleArrow('right', false)
              break
            }
            // 引号在词字符前不自动闭合（如输入 don't 的撇号），其余成对插入
            const isQuote = e.key === '"' || e.key === "'" || e.key === '`'
            if (isQuote && /[A-Za-z0-9_$]/.test(nextChar)) {
              applyInsert(e.key)
              break
            }
            applyInsert(e.key + closer, 1)
            break
          }
          applyInsert(e.key)
        }
        break
      }
    }
  }

  function onCompositionStart(): void {
    composing.value = true
  }

  function onCompositionEnd(e: CompositionEvent): void {
    composing.value = false
    const data = e.data ?? ''
    const el = e.target as HTMLInputElement | null
    if (el) el.value = ''
    if (data) applyInsert(data)
  }

  function onInput(e: Event): void {
    const el = e.target as HTMLInputElement
    // IME 组合中的中间值不处理，交给 compositionend
    if (composing.value) return
    if (el.value) {
      applyInsert(el.value)
      el.value = ''
    }
  }

  function onPaste(e: ClipboardEvent): void {
    e.preventDefault()
    const text = e.clipboardData?.getData('text/plain') ?? ''
    // 关键：只取纯文本原样入库，不做任何转义/反转义处理
    if (text) {
      applyInsert(text)
      options?.onPasteText?.(text)
    }
  }

  function onCopy(e: ClipboardEvent): void {
    const text = selection.selectedText.value
    if (!text) return
    e.preventDefault()
    e.clipboardData?.setData('text/plain', text)
  }

  function onCut(e: ClipboardEvent): void {
    const text = selection.selectedText.value
    if (!text) return
    e.preventDefault()
    e.clipboardData?.setData('text/plain', text)
    lastEditKind.value = 'op'
    const r = selection.range.value!
    caret.setPos(model.deleteRange(r.start, r.end))
    selection.clearSelection()
  }

  return {
    composing,
    lastEditKind,
    onKeyDown,
    onCompositionStart,
    onCompositionEnd,
    onInput,
    onPaste,
    onCopy,
    onCut,
  }
}
