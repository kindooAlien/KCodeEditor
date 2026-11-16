import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { EditorPos } from '@/keditor/types/editor'
import { offsetToPos } from '@/keditor/utils/position'
import type { CharModelApi } from './useCharModel'
import type { CaretApi } from './useCaret'

/** 一条搜索命中：start 恒在 end 之前 */
export interface SearchMatch {
  start: EditorPos
  end: EditorPos
}

/**
 * 全局搜索状态：
 * - 在字符模型原始文本上做子串检索（区分大小写），不触碰展示层
 * - 命中结果换算为行列区间，渲染层按行取片段给字符 span 加高亮 class
 * - 内容编辑后自动重算，避免偏移失效
 */
export interface EditorSearchApi {
  keyword: Ref<string>
  /** 替换文本（配合 replaceCurrent / replaceAll） */
  replacement: Ref<string>
  matches: Ref<SearchMatch[]>
  /** 当前聚焦的命中下标，-1 表示无 */
  activeIndex: Ref<number>
  /** 执行检索并聚焦第一条命中 */
  runSearch(): void
  /** 跳到下一条命中（循环），光标与视口跟随 */
  nextMatch(): void
  /** 清空关键词与所有命中高亮 */
  clearSearch(): void
  /** 替换当前聚焦的命中，返回是否替换成功 */
  replaceCurrent(): boolean
  /** 替换全部命中，返回替换数 */
  replaceAll(): number
  /** 取某行的命中列片段集合，渲染层用 */
  lineHits(line: number): Array<[number, number]>
  /** 取某行上的「当前聚焦命中」片段，渲染层用 */
  activeHitOnLine(line: number): [number, number] | null
}

export function useEditorSearch(
  model: CharModelApi,
  caret: CaretApi,
  scrollerRef: Ref<HTMLElement | null>,
  ensureVisible?: (line: number) => void,
): EditorSearchApi {
  const keyword = ref('')
  const replacement = ref('')
  const matches = ref<SearchMatch[]>([])
  const activeIndex = ref(-1)
  /** 最近一次检索使用的关键词，用于检测关键词变更后强制重检 */
  let searchedKeyword = ''

  function posOf(offset: number): EditorPos {
    return offsetToPos(offset, (l) => model.getLine(l).length, model.lineCount.value)
  }

  function scrollToLine(line: number): void {
    // 虚拟渲染下目标行可能不在 DOM，由宿主提供程序化滚动；否则回退 DOM 查询
    if (ensureVisible) {
      ensureVisible(line)
      return
    }
    const lineEl = scrollerRef.value?.querySelector(`.k-editor__line[data-line="${line}"]`)
    lineEl?.scrollIntoView({ block: 'nearest' })
  }

  function focusMatch(index: number): void {
    const count = matches.value.length
    if (count === 0) return
    const wrapped = ((index % count) + count) % count
    activeIndex.value = wrapped
    const match = matches.value[wrapped]
    caret.setPos(match.start)
    scrollToLine(match.start.line)
  }

  function runSearch(): void {
    const kw = keyword.value
    if (!kw) {
      clearSearch()
      return
    }
    const text = model.getText()
    const found: SearchMatch[] = []
    let idx = text.indexOf(kw)
    while (idx !== -1) {
      found.push({ start: posOf(idx), end: posOf(idx + kw.length) })
      idx = text.indexOf(kw, idx + kw.length)
    }
    matches.value = found
    searchedKeyword = kw
    if (found.length > 0) {
      focusMatch(0)
    } else {
      activeIndex.value = -1
    }
  }

  function nextMatch(): void {
    // 关键词已变更（旧结果失效）或从未检索过 → 强制重新检索
    if (keyword.value !== searchedKeyword || matches.value.length === 0) {
      runSearch()
      return
    }
    focusMatch(activeIndex.value + 1)
  }

  function clearSearch(): void {
    keyword.value = ''
    matches.value = []
    activeIndex.value = -1
  }

  /** 替换当前聚焦的命中：删除区间后插入替换文本，模型 watch 会自动重搜 */
  function replaceCurrent(): boolean {
    const m = matches.value[activeIndex.value]
    if (!m || !keyword.value) return false
    const start = model.deleteRange(m.start, m.end)
    model.insertText(start, replacement.value)
    return true
  }

  /** 替换全部命中：从后往前按全局偏移替换（偏移稳定），一次 reset 入库 */
  function replaceAll(): number {
    const kw = keyword.value
    if (!kw) return 0
    const text = model.getText()
    const offsets: Array<[number, number]> = []
    let idx = text.indexOf(kw)
    while (idx !== -1) {
      offsets.push([idx, idx + kw.length])
      idx = text.indexOf(kw, idx + kw.length)
    }
    if (offsets.length === 0) return 0
    let result = text
    for (let i = offsets.length - 1; i >= 0; i--) {
      result = result.slice(0, offsets[i][0]) + replacement.value + result.slice(offsets[i][1])
    }
    const count = offsets.length
    model.reset(result)
    return count
  }

  // 内容编辑后命中偏移会失效，有关键词时自动重算
  watch(model.lines, () => {
    if (keyword.value) runSearch()
  })

  // per-line 命中缓存：虚拟滚动每帧为窗口每行调用 lineHits，无缓存时为 O(命中数 × 窗口行数)，
  // 大文档多命中时滚动明显变卡；matches 变化（新搜索/内容编辑重算）时整体失效
  const lineHitsCache = new Map<number, Array<[number, number]>>()
  const EMPTY_HITS: Array<[number, number]> = []
  watch(matches, () => lineHitsCache.clear())

  function lineHits(line: number): Array<[number, number]> {
    if (matches.value.length === 0) return EMPTY_HITS
    let out = lineHitsCache.get(line)
    if (out === undefined) {
      out = []
      for (const m of matches.value) {
        const seg = segmentOnLine(m, line)
        if (seg) out.push(seg)
      }
      lineHitsCache.set(line, out)
    }
    return out
  }

  // 活动命中的 per-line 缓存：与 lineHits 同理，保持逐帧渲染引用稳定
  // 注意 activeHitOnLine 语义是单个区间（active 命中在该行上的 [start,end)），null 表示无
  const activeHitCache = new Map<number, [number, number] | null>()
  watch([matches, () => activeIndex.value], () => activeHitCache.clear())
  function activeHitOnLine(line: number): [number, number] | null {
    if (matches.value.length === 0) return null
    let out = activeHitCache.get(line)
    if (out === undefined) {
      const m = matches.value[activeIndex.value]
      out = m ? segmentOnLine(m, line) : null
      activeHitCache.set(line, out)
    }
    return out
  }

  /** 把一条命中在某行上的部分换算为 [startCol, endCol)，无则 null */
  function segmentOnLine(m: SearchMatch, line: number): [number, number] | null {
    if (m.start.line === m.end.line) {
      return m.start.line === line ? [m.start.col, m.end.col] : null
    }
    if (m.start.line === line) return [m.start.col, model.getLine(line).length]
    if (m.end.line === line) return [0, m.end.col]
    if (line > m.start.line && line < m.end.line) return [0, model.getLine(line).length]
    return null
  }

  return {
    keyword,
    replacement,
    matches,
    activeIndex,
    runSearch,
    nextMatch,
    clearSearch,
    replaceCurrent,
    replaceAll,
    lineHits,
    activeHitOnLine,
  }
}
