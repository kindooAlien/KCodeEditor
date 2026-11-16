import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { EditorPos } from '@/keditor/types/editor'
import type { CharModelApi } from './useCharModel'
import { clampPos } from '@/keditor/utils/position'

/**
 * 光标状态管理：位置 + 垂直移动时的期望列（desiredCol）。
 */
export interface CaretApi {
  pos: Ref<EditorPos>
  /** 直接设置光标位置（自动钳制），并清除垂直移动的期望列 */
  setPos(p: EditorPos): void
  /** 模型变化后钳制光标到合法范围 */
  clamp(): void
  /** 纯计算：返回移动后的位置，不落地 */
  computeLeft(p: EditorPos): EditorPos
  computeRight(p: EditorPos): EditorPos
  computeUp(p: EditorPos): EditorPos
  computeDown(p: EditorPos): EditorPos
  computeHome(p: EditorPos): EditorPos
  computeEnd(p: EditorPos): EditorPos
  /** 落地式移动（清除期望列） */
  moveLeft(): void
  moveRight(): void
  moveHome(): void
  moveEnd(): void
}

export function useCaret(model: CharModelApi): CaretApi {
  const pos = ref<EditorPos>({ line: 0, col: 0 })
  /** 垂直移动时记住「想去的列」，遇到更短的行暂时停在行尾，再回到长行时恢复 */
  let desiredCol: number | null = null

  function setPos(p: EditorPos): void {
    pos.value = clampToModel(p)
    desiredCol = null
  }

  function clampToModel(p: EditorPos): EditorPos {
    return clampPos(p, (line) => model.getLine(line).length, model.lineCount.value)
  }

  function clamp(): void {
    pos.value = clampToModel(pos.value)
  }

  function computeLeft(p: EditorPos): EditorPos {
    if (p.col > 0) return { line: p.line, col: p.col - 1 }
    if (p.line > 0) return { line: p.line - 1, col: model.getLine(p.line - 1).length }
    return p
  }

  function computeRight(p: EditorPos): EditorPos {
    if (p.col < model.getLine(p.line).length) return { line: p.line, col: p.col + 1 }
    if (p.line < model.lineCount.value - 1) return { line: p.line + 1, col: 0 }
    return p
  }

  function computeUp(p: EditorPos): EditorPos {
    const targetCol = desiredCol ?? p.col
    if (p.line === 0) return { line: 0, col: Math.min(targetCol, model.getLine(0).length) }
    const line = p.line - 1
    desiredCol = targetCol
    return { line, col: Math.min(targetCol, model.getLine(line).length) }
  }

  function computeDown(p: EditorPos): EditorPos {
    const targetCol = desiredCol ?? p.col
    const last = model.lineCount.value - 1
    if (p.line === last) return { line: last, col: Math.min(targetCol, model.getLine(last).length) }
    const line = p.line + 1
    desiredCol = targetCol
    return { line, col: Math.min(targetCol, model.getLine(line).length) }
  }

  function computeHome(p: EditorPos): EditorPos {
    return { line: p.line, col: 0 }
  }

  function computeEnd(p: EditorPos): EditorPos {
    return { line: p.line, col: model.getLine(p.line).length }
  }

  function moveLeft(): void {
    setPos(computeLeft(pos.value))
  }
  function moveRight(): void {
    setPos(computeRight(pos.value))
  }
  function moveHome(): void {
    setPos(computeHome(pos.value))
  }
  function moveEnd(): void {
    setPos(computeEnd(pos.value))
  }

  // 模型行数变化时兜底钳制
  watch(
    () => model.lineCount.value,
    () => clamp(),
  )

  return {
    pos,
    setPos,
    clamp,
    computeLeft,
    computeRight,
    computeUp,
    computeDown,
    computeHome,
    computeEnd,
    moveLeft,
    moveRight,
    moveHome,
    moveEnd,
  }
}
