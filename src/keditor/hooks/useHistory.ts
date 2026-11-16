import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import type { EditorPos } from '@/keditor/types/editor'

/** 一条历史快照：模型全文 + 当时光标位置 */
export interface HistoryEntry {
  text: string
  caret: EditorPos
}

/**
 * 编辑操作类别（用于快照合并）：
 * - 'type'：逐字符插入（连续输入合并为一步）
 * - 'delete'：逐字符删除（连续退格/删除合并为一步）
 * - 'op'：结构性操作（换行 / 粘贴 / 剪切 / 缩进 / 包裹等，独立成步）
 */
export type EditKind = 'type' | 'delete' | 'op'

/** useEditorInput 暴露给历史栈的「最近一次编辑类别」，无编辑时为 null */
export type LastEditKind = Ref<EditKind | null>

/**
 * 撤销/重做历史栈（快照式）：
 * - 每次内容变更记录一份全文快照与光标位置；上限 STACK_LIMIT，超出丢弃最旧
 * - 合并策略：coalesceKey 相同（type/delete）且在时间窗内 → 只更新栈顶，
 *   避免 Ctrl+Z 一次只回退一个字符
 * - undo/redo 恢复快照产生的模型变更通过 suppress 包裹，不会再次入栈
 */
export interface HistoryApi {
  canUndo: Ref<boolean>
  canRedo: Ref<boolean>
  /** 内容变更后调用；与上次记录同类且在时间窗内则合并 */
  record(entry: HistoryEntry, coalesceKey: EditKind | null, windowMs?: number): void
  /** 回退一步；current 为当前状态（进入重做栈），返回应恢复的快照，无可回退返回 null */
  undo(current: HistoryEntry): HistoryEntry | null
  /** 前进一步；返回应恢复的快照，无可重做返回 null */
  redo(): HistoryEntry | null
  /** 抑制历史记录（恢复快照期间模型会变更，需临时关闭 record） */
  suppress(): void
  resume(): void
  /** 清空历史并写入初始快照（外部 setText 重置内容时） */
  reset(initial: HistoryEntry): void
}

const STACK_LIMIT = 200
/** 连续 type/delete 合并的时间窗（毫秒），VS Code 风格的输入分组 */
const MERGE_WINDOW = 800

export function useHistory(initial: HistoryEntry): HistoryApi {
  /** 撤销栈：含初始状态，栈顶恒为最新状态 */
  const undoStack = ref<HistoryEntry[]>([{ ...initial }])
  const redoStack = ref<HistoryEntry[]>([])

  const canUndo = computed(() => undoStack.value.length > 1)
  const canRedo = computed(() => redoStack.value.length > 0)

  let lastKey: EditKind | null = null
  let lastTime = 0
  let suppressed = false

  function record(entry: HistoryEntry, coalesceKey: EditKind | null, windowMs = MERGE_WINDOW): void {
    if (suppressed) return
    const now = Date.now()
    // 同类小编辑且在时间窗内：合并（替换栈顶而非新压一份）
    const merge = coalesceKey !== null && coalesceKey === lastKey && now - lastTime < windowMs
    const base = merge ? undoStack.value.slice(0, -1) : undoStack.value
    let next = [...base, { ...entry }]
    if (next.length > STACK_LIMIT) next = next.slice(-STACK_LIMIT)
    undoStack.value = next
    // 新编辑出现后重做分支失效
    redoStack.value = []
    lastKey = coalesceKey
    lastTime = now
  }

  function undo(current: HistoryEntry): HistoryEntry | null {
    if (undoStack.value.length <= 1) return null
    const target = undoStack.value[undoStack.value.length - 2]
    redoStack.value = [...redoStack.value, { ...current }]
    undoStack.value = undoStack.value.slice(0, -1)
    lastKey = null
    lastTime = 0
    return { ...target }
  }

  function redo(): HistoryEntry | null {
    if (redoStack.value.length === 0) return null
    const target = redoStack.value[redoStack.value.length - 1]
    undoStack.value = [...undoStack.value, { ...target }]
    redoStack.value = redoStack.value.slice(0, -1)
    lastKey = null
    lastTime = 0
    return { ...target }
  }

  function suppress(): void {
    suppressed = true
  }

  function resume(): void {
    suppressed = false
  }

  function reset(initialEntry: HistoryEntry): void {
    undoStack.value = [{ ...initialEntry }]
    redoStack.value = []
    lastKey = null
    lastTime = 0
  }

  return { canUndo, canRedo, record, undo, redo, suppress, resume, reset }
}
