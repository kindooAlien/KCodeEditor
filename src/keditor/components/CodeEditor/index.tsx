import { defineComponent, ref, watch, computed, nextTick, onMounted, onBeforeUnmount, watchEffect, Fragment } from 'vue'
import type { PropType, VNodeChild } from 'vue'
import type { CSSProperties } from 'vue'
import { useCharModel } from '@/keditor/hooks/useCharModel'
import { useCaret } from '@/keditor/hooks/useCaret'
import { useSelection } from '@/keditor/hooks/useSelection'
import { useEditorInput } from '@/keditor/hooks/useEditorInput'
import { useEditorMouse } from '@/keditor/hooks/useEditorMouse'
import { useEditorSearch } from '@/keditor/hooks/useEditorSearch'
import { useCaretRect } from '@/keditor/hooks/useCaretRect'
import { useCodeFold } from '@/keditor/hooks/useCodeFold'
import { useGhostText } from '@/keditor/hooks/useGhostText'
import { useHistory } from '@/keditor/hooks/useHistory'
import type { HistoryEntry } from '@/keditor/hooks/useHistory'
import { useHighlight, normalizeLanguage, detectLanguage } from '@/keditor/hooks/useHighlight'
import { useSyntaxCheck } from '@/keditor/hooks/useSyntaxCheck'
import { formatCode } from '@/keditor/utils/formatter'
import { placeHoverTip as placeHoverTipPlacement } from '@/keditor/utils/hoverPlacement'
import { buildCommentOffsets, findCommentWindow } from '@/keditor/utils/commentLayout'
import CommentCard, { CommentComposer } from './CommentCard'
import { DEFAULT_EDITOR_THEME, ACCENT_PRESETS, resolveLineHeight, resolveTokenColors } from '@/keditor/config/editor-theme'
import type { EditorTheme, DiffLineType, TokenType } from '@/keditor/config/editor-theme'
import { registerLinter } from '@/keditor/config/linters'
import type { Linter } from '@/keditor/config/linters'
import { resolveLocale } from '@/keditor/config/editor-locale'
import type { EditorLocale } from '@/keditor/config/editor-locale'
import type { EditorPos, CodeMark, GutterMark, CodeComment } from '@/keditor/types/editor'
import CodeLine from './CodeLine'
import CodeGutter from './CodeGutter'
import SearchBar from './SearchBar'
import StatusBar from './StatusBar'
import HiddenInput from './HiddenInput'
import Caret from './Caret'
import Minimap from './Minimap'
import './editor.scss'

/** diff 行标记 */
export interface DiffLineMark {
  /** 行号（0 基） */
  line: number
  type: DiffLineType
  /** modified 行内被变更词的列区间集合 [startCol, endCol)：行内加深底色（GitLab 词级 diff） */
  changedWords?: Array<[number, number]>
}

/** 虚拟渲染：超过该行数（且非折行）才启用窗口渲染 */
const VIRTUAL_THRESHOLD = 120

/** 稳定引用的空数组：逐帧渲染时避免每次创建新引用导致整窗口行重渲染 */
const EMPTY_TOKENS: never[] = []
const EMPTY_WORDS: Array<[number, number]> = []
const EMPTY_GUIDES: number[] = []
const EMPTY_MARKS: CodeMark[] = []
/** 虚拟渲染上下缓冲行数 */
const VIRTUAL_BUFFER = 8
/** 内容区上下内边距（与 editor.css 保持一致） */
const CONTENT_PAD_Y = 12

/**
 * KCodeEditor —— 数据驱动的逐字符代码编辑组件
 *
 * 架构约定：
 * - 字符模型（lines: string[]）是唯一数据源，DOM 只是投影
 * - 每个字符渲染为独立 span（CharSpan），搜索高亮 / 选区 / 语法 token 都在该粒度加 class
 * - 显示层不依赖 textarea；HiddenInput 只做输入捕获（焦点 + IME），值用完即弃
 * - 所有文本入库前不做转义/反转义，转义字符原样呈现
 *
 * 编辑能力：
 * - 撤销/重做（Ctrl+Z / Ctrl+Y·Ctrl+Shift+Z），快照式历史栈，连续输入/删除自动合并
 * - 剪贴板闭环（复制/剪切/粘贴，多行粘贴）；双击选词、三击选行
 * - Ctrl+←/→ 按词移动、Ctrl+Backspace/Delete 按词删除；Shift 方向键扩展选区
 * - Tab/Shift+Tab 块缩进（多行选区整块缩进/反缩进）
 * - 括号/引号自动闭合、选区包裹、已有闭括号跳过；回车自动缩进
 *
 * 展示开关（props）：
 * - showLineNumber / highlightActiveLine / zebraStripe / showSearch：基础展示开关
 * - wordWrap: 自动折行（VS Code 风格，默认关闭；开启时不启用虚拟渲染与 minimap）
 * - codeFold: 括号折叠（默认关闭），foldTrigger 决定 +/- 图标位置（行号槽前 / 行首最左侧）
 * - showCursorInfo: 底部状态栏显示光标位置 Ln x, Col y
 * - languages / language / onLanguageChange: 语言下拉选择（传入 languages 即显示）
 * - showHighlight: 轻量语法高亮（theme.highlightPreset 选风格，theme.tokenColors 自定义 token 色）
 * - diffLines: Git diff 行标记（added / removed / modified），modified 支持 changedWords 词级行内加深
 * - marks: 任意范围标注（squiggle 波浪线 / highlight 高亮背景 / strike 删除线，支持跨行 + hover 提示）
 * - gutterMarks: 行号槽标注图标（书签 / 警告 / 错误 / 信息）
 * - showFormat / format(): 代码格式化（json 走 stringify，其他按括号深度重排缩进）
 * - syntaxCheck: 语法校验（linter 注册表按语言取实现，可经 linters prop 注册自定义）
 * - showMinimap: Minimap 缩略图（canvas，非折行模式可用）
 * - locale: 内置文案覆盖（i18n）
 * - gutterSlot / foldIcon: 行号槽插槽与折叠图标自定义（渲染函数插槽）
 * - setGhost / clearGhost（ref 方法）+ Tab 采纳 / Esc 关闭：AI 幽灵补全
 */
export default defineComponent({
  name: 'KCodeEditor',
  props: {
    initialText: { type: String, default: '' },
    showLineNumber: { type: Boolean, default: false },
    highlightActiveLine: { type: Boolean, default: false },
    zebraStripe: { type: Boolean, default: false },
    showSearch: { type: Boolean, default: false },
    /** 自动折行（默认关闭） */
    wordWrap: { type: Boolean, default: false },
    /** 括号折叠（+/− 图标，默认关闭） */
    codeFold: { type: Boolean, default: false },
    /** 折叠触发器位置：gutter（行号前，默认）/ line-start（代码行最左侧） */
    foldTrigger: {
      type: String as PropType<'gutter' | 'line-start'>,
      default: 'gutter',
    },
    /** 自定义折叠图标渲染（gutter 与 line-start 两个位置都生效） */
    foldIcon: {
      type: Function as PropType<(state: { folded: boolean; line: number }) => VNodeChild>,
      default: undefined,
    },
    /** 行号槽自定义插槽：(line: number) => VNodeChild，渲染在行号之后 */
    gutterSlot: {
      type: Function as PropType<(line: number) => VNodeChild>,
      default: undefined,
    },
    /** 底部状态栏显示光标位置（Ln / Col） */
    showCursorInfo: { type: Boolean, default: false },
    /** 可选语言列表（传入即显示语言下拉） */
    languages: { type: Array as PropType<string[]>, default: undefined },
    /** 当前语言（配合 languages 使用；也作为高亮分词与 linter 的语言）。默认空串 = 按内容自动检测，粘贴代码时自动跟随 */
    language: { type: String, default: '' },
    onLanguageChange: {
      type: Function as PropType<(language: string) => void>,
      default: undefined,
    },
    /** 轻量语法高亮（默认开启，对齐 Monaco / CodeMirror 等业界惯例；纯文本展示可显式关闭） */
    showHighlight: { type: Boolean, default: true },
    /** Git diff 行标记 */
    diffLines: { type: Array as PropType<DiffLineMark[]>, default: undefined },
    /** 任意范围标注列表（行列 0 基，支持跨行） */
    marks: { type: Array as PropType<CodeMark[]>, default: () => [] },
    /** 行号槽标注图标列表 */
    gutterMarks: { type: Array as PropType<GutterMark[]>, default: () => [] },
    /** 代码评论线程（Git 审阅风格，数据驱动：父组件持有数组） */
    comments: { type: Array as PropType<CodeComment[]>, default: () => [] },
    /** 是否开放评论交互（gutter + 发起 / 回复 / 解决）；仅展示时可关掉 */
    commentable: { type: Boolean, default: false },
    /** 评论提交（line/body/parentId）：父组件重建 comments 数组回传即可 */
    onCommentSubmit: {
      type: Function as PropType<(payload: { line: number; body: string; parentId?: string }) => void>,
      default: undefined,
    },
    /** 线程解决状态切换（id/resolved） */
    onCommentResolve: {
      type: Function as PropType<(payload: { id: string; resolved: boolean }) => void>,
      default: undefined,
    },
    /** 状态栏显示格式化按钮（默认关闭） */
    showFormat: { type: Boolean, default: false },
    /** 语法校验：状态栏显示错误提示，错误行行号标红（默认关闭） */
    syntaxCheck: { type: Boolean, default: false },
    /** 缩进参考线：按缩进层级绘制点状竖线（VS Code 风格，宽度取主题 indentSize） */
    indentGuides: { type: Boolean, default: false },
    /** 业务自定义 linter：语言 → 诊断函数（挂载时注册进全局注册表） */
    linters: { type: Object as PropType<Record<string, Linter>>, default: undefined },
    /** Minimap 缩略图（canvas 渲染，仅非折行模式可用） */
    showMinimap: { type: Boolean, default: false },
    /** 内置文案覆盖（i18n），如 { format: 'Format' } */
    locale: { type: Object as PropType<Partial<EditorLocale>>, default: undefined },
    /** 浮层渲染接管：传入后标注悬停提示由业务组件渲染（如 KDesignUI Popover / Element Plus Tooltip），不传用内置浮层 */
    hoverRender: {
      type: Function as PropType<(ctx: { message: string; type: string }) => VNodeChild>,
      default: undefined,
    },
    /** 隐藏输入层的无障碍标签 */
    ariaLabel: { type: String, default: undefined },
    theme: { type: Object as PropType<Partial<EditorTheme>>, default: undefined },
    onChange: {
      type: Function as PropType<(text: string) => void>,
      default: undefined,
    },
  },
  setup(props, { expose }) {
    const model = useCharModel(props.initialText)
    const caret = useCaret(model)
    const selection = useSelection(model)
    const fold = useCodeFold(model, caret)

    /** 合并默认主题：默认 < 预设色 < 用户显式字段 */
    const theme = computed<EditorTheme>(() => ({
      ...DEFAULT_EDITOR_THEME,
      ...(props.theme?.presetColor ? ACCENT_PRESETS[props.theme.presetColor] : {}),
      ...props.theme,
    }))

    /** 内置文案：zh 默认 < 用户覆盖 */
    const locale = computed<EditorLocale>(() => resolveLocale(props.locale))

    // ---------- 撤销/重做 ----------
    const history = useHistory({ text: model.getText(), caret: caret.pos.value })

    /** 恢复快照：模型变更被抑制，不会再次入栈 */
    function applyHistoryEntry(entry: HistoryEntry): void {
      history.suppress()
      model.reset(entry.text)
      caret.setPos(entry.caret)
      selection.clearSelection()
      // watcher（pre flush）先于 nextTick 执行，期间 record 被抑制
      nextTick(() => history.resume())
    }

    function undo(): void {
      const entry = history.undo({ text: model.getText(), caret: caret.pos.value })
      if (entry) applyHistoryEntry(entry)
    }

    function redo(): void {
      const entry = history.redo()
      if (entry) applyHistoryEntry(entry)
    }

    // ---------- AI 幽灵补全 ----------
    const ghost = useGhostText(model, caret)

    // Tab 缩进宽度接主题 indentSize；undo/redo 与幽灵补全钩子在此接线
    const input = useEditorInput(model, caret, selection, {
      indentSize: computed(() => theme.value.indentSize),
      undo,
      redo,
      onTabGhost: () => ghost.accept(),
      onEscapeGhost: () => ghost.clearIfActive(),
      onPasteText: onPasteDetect,
    })

    // ---------- 搜索替换 ----------
    const contentRef = ref<HTMLElement | null>(null)
    const scrollerRef = ref<HTMLElement | null>(null)
    const gutterRef = ref<{ setScrollTop: (y: number) => void; setRowHeight: (line: number, h: number | null) => void } | null>(null)

    // ---------- 标注悬停浮层（VS Code 式自绘，锚定字符像素坐标 + 渲染后实测尺寸翻转/钳制定位） ----------
    const hoverTip = ref<{
      message: string
      type: string
      /** 字符中心 / 字符顶 / 字符底，均为相对内容容器的坐标 */
      cx: number
      charTop: number
      charBottom: number
      /** 内容容器尺寸（边界碰撞检测用） */
      contentW: number
      contentH: number
      /** 实测定位后的最终坐标（top-left 角点）与是否翻转到下方 */
      x: number
      y: number
      below: boolean
      /** 首帧渲染时隐藏，实测尺寸定位后显示，避免跳动/溢出闪烁 */
      placed: boolean
    } | null>(null)
    const hoverLayerRef = ref<HTMLElement | null>(null)

    /** mouseover 委托：命中带 data-mark-title 的字符即预定位浮层，否则隐藏 */
    function onContentMouseover(e: MouseEvent): void {
      const el = e.target as HTMLElement
      const char = el?.closest?.('.k-editor__char') as HTMLElement | null
      const message = char?.getAttribute('data-mark-title') ?? ''
      const contentEl = contentRef.value
      if (!message || !contentEl) {
        hoverTip.value = null
        return
      }
      const rect = char!.getBoundingClientRect()
      const base = contentEl.getBoundingClientRect()
      hoverTip.value = {
        message,
        type: (Array.from(char!.classList).find((c) => c.startsWith('is-mark-')) ?? '').replace('is-mark-', ''),
        cx: rect.left - base.left + rect.width / 2,
        charTop: rect.top - base.top,
        charBottom: rect.bottom - base.top,
        contentW: base.width,
        contentH: contentEl.clientHeight,
        x: 0,
        y: 0,
        below: false,
        placed: false,
      }
      // 渲染后实测浮层尺寸 → 翻转 + 钳制定位（下一帧内完成，配合 placed 隐藏首帧）
      nextTick(placeHoverTip)
    }

    /**
     * 边界处理：调用纯函数 placeHoverTip（utils/hoverPlacement），
     * 以滚动视口为裁剪参照计算翻转/钳制，详见该文件注释与单测。
     */
    function placeHoverTip(): void {
      const layerEl = hoverLayerRef.value
      const tip = hoverTip.value
      if (!layerEl || !tip) return
      const sc = scrollerRef.value
      const placement = placeHoverTipPlacement(
        { cx: tip.cx, charTop: tip.charTop, charBottom: tip.charBottom },
        {
          scrollTop: sc?.scrollTop ?? 0,
          scrollLeft: sc?.scrollLeft ?? 0,
          clientWidth: sc?.clientWidth ?? tip.contentW,
          clientHeight: sc?.clientHeight ?? tip.contentH,
        },
        layerEl.offsetWidth,
        layerEl.offsetHeight,
      )
      hoverTip.value = { ...tip, ...placement, placed: true }
    }

    function hideHoverTip(): void {
      hoverTip.value = null
    }

    // ---------- 虚拟渲染窗口（非折行 + 大行数） ----------
    const scrollTopRef = ref(0)
    const viewportH = ref(0)

    /** 固定行高（px）：虚拟渲染与 minimap 的坐标换算基准 */
    const rowHeightPx = computed(() => resolveLineHeight(theme.value))

    const virtualEnabled = computed(() => !props.wordWrap && model.lineCount.value > VIRTUAL_THRESHOLD)

    /** 折叠隐藏后的可见行序列（虚拟窗口从中切片） */
    const visibleLineList = computed<number[]>(() => {
      const hidden = props.codeFold ? fold.hiddenLines.value : null
      const out: number[] = []
      const n = model.lineCount.value
      for (let i = 0; i < n; i++) {
        if (!hidden || !hidden.has(i)) out.push(i)
      }
      return out
    })

    /** 可见行切片 + 上下占位高度（含评论块偏移）；光标行强制在窗口内（光标定位依赖该行 DOM） */
    const virtualRange = computed(() => {
      if (!virtualEnabled.value) return null
      const visLines = visibleLineList.value
      const total = visLines.length
      if (total === 0) return { lines: [] as number[], top: 0, bottom: 0, offsets: [0, 0] as number[] }
      const rowH = rowHeightPx.value
      const extraV = visLines.map((l) => extraByLine.value[l] ?? 0)
      const offsets = buildCommentOffsets(extraV, rowH)
      const viewTop = scrollTopRef.value - CONTENT_PAD_Y
      const viewBottom = scrollTopRef.value + viewportH.value - CONTENT_PAD_Y
      // 视口预加载：buffer 是像素语义（上下各多渲染 N px 的行），快速滚动一帧 ~300px，
      // 8px 基础缓冲会越界出现空白 → 预加载视口高度的 75%（约 15 行），中速滚动新行提前入窗不露白
      const buffer = Math.max(VIRTUAL_BUFFER, Math.ceil(viewportH.value * 0.75))
      const { start, end } = findCommentWindow(offsets, extraV, rowH, viewTop, viewBottom, buffer)
      let s = start
      let e = end
      // 光标行强制入窗（光标定位依赖该行 DOM）：跨度仅 8 行覆盖边界抖动。光标行远在视口外时
      // 不强制（useCaretRect 对行 DOM 缺失已容错隐藏），否则每次滚动帧都要多渲染 80 行导致掉帧
      const CARET_SPAN_LIMIT = 8
      const caretIdx = visLines.indexOf(caret.pos.value.line)
      if (caretIdx >= 0) {
        if (caretIdx < s) s = Math.max(caretIdx, s - CARET_SPAN_LIMIT)
        else if (caretIdx >= e) e = Math.min(caretIdx + 1, e + CARET_SPAN_LIMIT)
      }
      return { lines: visLines.slice(s, e), top: offsets[s], bottom: offsets[total] - offsets[e], offsets }
    })

    /** 内容总高度（minimap 视口换算用；含评论块高度） */
    const contentTotalH = computed(() => {
      const visLines = visibleLineList.value
      const extraV = visLines.map((l) => extraByLine.value[l] ?? 0)
      const offsets = buildCommentOffsets(extraV, rowHeightPx.value)
      return CONTENT_PAD_Y * 2 + offsets[visLines.length]
    })

    /** 程序化滚动：让指定行进入视口（搜索跳转/虚拟渲染共用；含评论块偏移） */
    function ensureLineVisible(line: number): void {
      const el = scrollerRef.value
      if (!el) return
      const idx = visibleLineList.value.indexOf(line)
      if (idx < 0) return
      const rowH = rowHeightPx.value
      const extraV = visibleLineList.value.map((l) => extraByLine.value[l] ?? 0)
      const offsets = buildCommentOffsets(extraV, rowH)
      const y = CONTENT_PAD_Y + offsets[idx]
      const h = rowH + (extraV[idx] ?? 0)
      if (y < el.scrollTop) el.scrollTop = y
      else if (y + h > el.scrollTop + el.clientHeight) el.scrollTop = y + h - el.clientHeight
    }

    function measureViewport(): void {
      const el = scrollerRef.value
      viewportH.value = el?.clientHeight ?? 0
      scrollTopRef.value = el?.scrollTop ?? 0
    }

    /**
     * 滚动同步（rAF 驱动，VS Code 同款思路）：scroll 事件在浏览器完成滚动合成之后才派发，
     * 用它同步 gutter transform / 虚拟窗口必然慢一帧（行号滞后 + 新行空白一帧）。
     * 改为每帧 paint 前读 scroller.scrollTop（属性读取是同步的）并更新响应式状态：
     * Vue 的 patch 在微任务 flush（仍在本次 paint 前）完成，滚动帧内行号/内容/新行同帧到位。
     */
    let scrollRafId = 0
    function syncScrollFrame(): void {
      const el = scrollerRef.value
      if (el && el.scrollTop !== scrollTopRef.value) {
        scrollTopRef.value = el.scrollTop
        gutterRef.value?.setScrollTop(el.scrollTop)
        hideHoverTip()
        // 光标像素位置随视口变化重新实测：虚拟窗口 patch 后光标行可能新入窗/出窗
        nextTick(refreshCaretRect)
      }
      scrollRafId = requestAnimationFrame(syncScrollFrame)
    }

    onMounted(() => {
      measureViewport()
      window.addEventListener('resize', measureViewport)
      scrollRafId = requestAnimationFrame(syncScrollFrame)
    })
    onBeforeUnmount(() => {
      window.removeEventListener('resize', measureViewport)
      cancelAnimationFrame(scrollRafId)
    })
    // 行数变化（滚动条出现/消失）会改变可视高度
    watch(() => model.lineCount.value, () => nextTick(measureViewport))

    const mouse = useEditorMouse(model, caret, selection, () => hiddenInputRef.value?.focus())
    const { caretStyle, refresh: refreshCaretRect } = useCaretRect(contentRef, model, caret)
    const search = useEditorSearch(model, caret, scrollerRef, ensureLineVisible)

    /**
     * 语言状态：外部受控（props.language）优先；language 为空串时按初始内容自动检测，
     * 粘贴代码时自动跟随（用户手动选过语言后不再跟随）。内部变化回抛 onLanguageChange
     */
    const langAuto = ref(props.language.trim() === '')
    const langRef = ref(normalizeLanguage(props.language) || detectLanguage(props.initialText) || 'text')
    watch(
      () => props.language,
      (v) => {
        langRef.value = normalizeLanguage(v)
        // 外部显式受控后关闭自动跟随
        langAuto.value = v.trim() !== ''
      },
    )
    function setLanguage(language: string, fromAuto = false): void {
      const next = normalizeLanguage(language)
      langRef.value = next
      if (!fromAuto) langAuto.value = false
      props.onLanguageChange?.(next)
    }

    /** 粘贴跟随：仅自动模式下检测粘贴文本，识别出不同语言则切换 */
    function onPasteDetect(text: string): void {
      if (!langAuto.value || text.trim().length < 8) return
      const detected = detectLanguage(text)
      if (detected && detected !== langRef.value) setLanguage(detected, true)
    }

    /** 业务自定义 linter：挂载/变更时注册进全局注册表 */
    watchEffect(() => {
      for (const [lang, fn] of Object.entries(props.linters ?? {})) {
        registerLinter(lang, fn)
      }
    })

    /** 语法高亮：每行 token 列表（showHighlight 开启时才用于渲染） */
    const { getTokens } = useHighlight(model, langRef)

    /** 语法校验：诊断列表（syntaxCheck 开启时展示，实现来自 linter 注册表） */
    const { diagnostics } = useSyntaxCheck(model, langRef)

    /** diff 行 → 类型映射 */
    const diffMap = computed<Map<number, DiffLineType>>(() => {
      const map = new Map<number, DiffLineType>()
      for (const mark of props.diffLines ?? []) {
        if (mark.line >= 0) map.set(mark.line, mark.type)
      }
      return map
    })

    /** diff 行 → 词级变更区间映射（modified 行内加深底色用） */
    const diffWordsMap = computed<Map<number, Array<[number, number]>>>(() => {
      const map = new Map<number, Array<[number, number]>>()
      for (const mark of props.diffLines ?? []) {
        if (mark.line >= 0 && mark.type === 'modified' && mark.changedWords?.length) {
          map.set(mark.line, mark.changedWords)
        }
      }
      return map
    })

    /** 范围标注 → 按行分组（end 缺列时钳制到行尾由渲染层兜底，跨行区间按行拆分） */
    const marksByLine = computed<Map<number, CodeMark[]>>(() => {
      const map = new Map<number, CodeMark[]>()
      const n = model.lineCount.value
      for (const m of props.marks) {
        const startLine = Math.max(0, m.start.line)
        const endLine = Math.min(n - 1, m.end.line)
        for (let l = startLine; l <= endLine; l++) {
          const list = map.get(l) ?? []
          list.push(m)
          map.set(l, list)
        }
      }
      return map
    })

    /** 语法诊断 → 波浪线标注（syntaxCheck 开启时叠加，单字符区间 + 悬停提示） */
    const diagMarksByLine = computed<Map<number, CodeMark[]>>(() => {
      const map = new Map<number, CodeMark[]>()
      if (!props.syntaxCheck) return map
      for (const d of diagnostics.value) {
        const lineLen = model.getLine(d.line).length
        if (d.col < 0) continue
        const startCol = Math.min(d.col, Math.max(lineLen - 1, 0))
        const endCol = Math.max(startCol + 1, Math.min(d.col + 1, lineLen))
        const list = map.get(d.line) ?? []
        list.push({
          start: { line: d.line, col: startCol },
          end: { line: d.line, col: endCol },
          type: 'squiggle',
          message: `Ln ${d.line + 1}, Col ${d.col + 1}：${d.message}`,
        })
        map.set(d.line, list)
      }
      return map
    })

    /** 某行的合并标注列表（业务 marks + 诊断波浪线）：per-line 引用稳定缓存，滚动帧不触发行重渲染 */
    const mergedMarksCache = new Map<number, CodeMark[]>()
    watch([marksByLine, diagMarksByLine], () => mergedMarksCache.clear())
    const mergedMarks = (line: number): CodeMark[] => {
      let out = mergedMarksCache.get(line)
      if (out === undefined) {
        const a = marksByLine.value.get(line)
        const b = diagMarksByLine.value.get(line)
        out = a && b ? [...a, ...b] : (a ?? b ?? EMPTY_MARKS)
        mergedMarksCache.set(line, out)
      }
      return out
    }

    // ---------- 代码评论（Git 审阅风格）：变高块入流 + 高度实测 + gutter 等高占位 ----------
    /** 行 → 线程列表 */
    const commentsByLine = computed<Map<number, CodeComment[]>>(() => {
      const map = new Map<number, CodeComment[]>()
      for (const c of props.comments ?? []) {
        if (c.line < 0) continue
        const list = map.get(c.line) ?? []
        list.push(c)
        map.set(c.line, list)
      }
      return map
    })

    /** 正在发起评论的行（gutter + 触发；null 关闭） */
    const addingLine = ref<number | null>(null)

    function openComment(line: number): void {
      addingLine.value = line
    }

    function submitNewComment(line: number, body: string): void {
      props.onCommentSubmit?.({ line, body })
      addingLine.value = null
    }

    /** 评论块实测高度（key → px；初测前按 0 参与布局，ResizeObserver 回填后自动对齐） */
    const commentHeights = ref(new Map<string, number>())
    /** key → 所属行（响应式重建时用不到，直接用普通 Map） */
    const commentElLines = new Map<string, number>()
    const commentEls = new Map<string, HTMLElement>()
    let commentRO: ResizeObserver | null = null

    /** ref 回调：注册评论块元素进 ResizeObserver（卸载时反注册） */
    function setCommentRef(key: string, line: number) {
      return (el: unknown) => {
        if (el) {
          const el2 = el as HTMLElement
          commentEls.set(key, el2)
          commentElLines.set(key, line)
          commentRO?.observe(el2)
        } else {
          const el2 = commentEls.get(key)
          if (el2) commentRO?.unobserve(el2)
          commentEls.delete(key)
          commentElLines.delete(key)
        }
      }
    }

    onMounted(() => {
      if (typeof ResizeObserver === 'undefined') return
      commentRO = new ResizeObserver(() => {
        let changed = false
        for (const [key, el] of commentEls) {
          const h = Math.round(el.offsetHeight)
          if (commentHeights.value.get(key) !== h) {
            commentHeights.value.set(key, h)
            changed = true
          }
        }
        // 换实例触发 computed 重算
        if (changed) commentHeights.value = new Map(commentHeights.value)
      })
      for (const el of commentEls.values()) commentRO.observe(el)
    })
    onBeforeUnmount(() => commentRO?.disconnect())

    /** 每行评论块总高度（未测得的行按 0） */
    const extraByLine = computed<number[]>(() => {
      const n = model.lineCount.value
      const arr = new Array<number>(n).fill(0)
      for (const [key, h] of commentHeights.value) {
        const line = commentElLines.get(key)
        if (line != null && line >= 0 && line < n) arr[line] += Math.max(0, h)
      }
      return arr
    })

    /** gutter 等高占位：行 → 评论块高度 */
    const commentSpaceHeights = computed<Map<number, number>>(() => {
      const map = new Map<number, number>()
      extraByLine.value.forEach((h, line) => {
        if (h > 0) map.set(line, h)
      })
      return map
    })

    /** 光标初始落点（由 theme.caretDefaultPos 决定） */
    function initialCaretPos(): EditorPos {
      if (theme.value.caretDefaultPos === 'end') {
        const last = model.lineCount.value - 1
        return { line: last, col: model.getLine(last).length }
      }
      return { line: 0, col: 0 }
    }

    // 按主题配置设置初始光标位置
    caret.setPos(initialCaretPos())

    /** 主题 → CSS 变量注入根节点（样式层与逻辑层的唯一耦合点） */
    const rootVars = computed<CSSProperties>(() => {
      const t = theme.value
      // token 色兜底正文色（用户未配置该类型时不会着色差异）
      const tokenColors = resolveTokenColors(t) as Record<TokenType, string | undefined>
      const vars: Record<string, string> = {
        '--k-editor-bg': t.editorBackground,
        '--k-editor-color': t.textColor,
        '--k-editor-font-size': `${t.fontSize}px`,
        '--k-editor-line-height': `${resolveLineHeight(t)}px`,
        '--k-caret-color': t.caretColor,
        '--k-selection-bg': t.selectionBackground,
        '--k-zebra-bg': t.zebraBackground,
        '--k-active-line-bg': t.activeLineBackground,
        '--k-hit-bg': t.searchHitBackground,
        '--k-hit-active-bg': t.searchHitActiveBackground,
        '--k-gutter-bg': t.gutterBackground,
        '--k-gutter-color': t.gutterColor,
        '--k-gutter-active-color': t.gutterActiveColor,
        // 代码风格 token 色（未配置项回落正文色）
        '--k-tok-string': tokenColors.string ?? t.textColor,
        '--k-tok-number': tokenColors.number ?? t.textColor,
        '--k-tok-comment': tokenColors.comment ?? t.textColor,
        '--k-tok-keyword': tokenColors.keyword ?? t.textColor,
        '--k-tok-boolean': tokenColors.boolean ?? t.textColor,
        '--k-tok-punct': tokenColors.punct ?? t.textColor,
        '--k-tok-key': tokenColors.key ?? t.textColor,
        '--k-tok-tag': tokenColors.tag ?? t.textColor,
        '--k-tok-attr': tokenColors.attr ?? t.textColor,
        // 状态栏
        '--k-statusbar-bg': t.statusBarBackground ?? '#252526',
        '--k-statusbar-color': t.statusBarColor ?? '#cccccc',
        ...(t.statusBarBorder ? { '--k-statusbar-border': t.statusBarBorder } : {}),
      }
      // 语言下拉 option（未配置时不注入，走 CSS 默认值）
      if (t.optionBackground) vars['--k-option-bg'] = t.optionBackground
      if (t.optionColor) vars['--k-option-color'] = t.optionColor
      // diff 色（未配置时不注入，走 CSS 默认值）
      if (t.diffAddedBackground) vars['--k-diff-added-bg'] = t.diffAddedBackground
      if (t.diffRemovedBackground) vars['--k-diff-removed-bg'] = t.diffRemovedBackground
      if (t.diffModifiedBackground) vars['--k-diff-modified-bg'] = t.diffModifiedBackground
      if (t.diffAddedColor) vars['--k-diff-added-color'] = t.diffAddedColor
      if (t.diffRemovedColor) vars['--k-diff-removed-color'] = t.diffRemovedColor
      if (t.diffModifiedColor) vars['--k-diff-modified-color'] = t.diffModifiedColor
      // 范围标注（未配置时不注入，走 CSS 默认值）
      if (t.diffWordBackground) vars['--k-diff-word-bg'] = t.diffWordBackground
      if (t.markHighlightBackground) vars['--k-mark-highlight-bg'] = t.markHighlightBackground
      if (t.markStrikeColor) vars['--k-mark-strike-color'] = t.markStrikeColor
      return vars as unknown as CSSProperties
    })

    const hiddenInputRef = ref<{ focus: () => void; el: HTMLInputElement | null } | null>(null)
    /** 隐藏输入层跟随光标定位，让 IME 候选框出现在光标附近 */
    const inputStyle = computed<CSSProperties>(() => ({
      display: caretStyle.value.display,
      left: caretStyle.value.left,
      top: caretStyle.value.top,
    }))

    /** 光标所在行（0 基），供当前行高亮使用 */
    const activeLine = computed(() => caret.pos.value.line)

    /** 状态栏光标信息（1 基展示） */
    const cursorInfo = computed(() => `Ln ${caret.pos.value.line + 1}, Col ${caret.pos.value.col + 1}`)

    /** 折行模式下把每行实际高度同步到行号槽，行号对齐首视觉行 */
    function syncGutterHeights(): void {
      const root = contentRef.value
      const gutter = gutterRef.value
      if (!gutter) return
      // 折行关闭：清除所有内联高度，回到固定行高
      if (!props.wordWrap || !root) {
        root?.querySelectorAll<HTMLElement>('.k-editor__gutter-row[data-line]').forEach((row) => {
          gutter.setRowHeight(Number(row.dataset.line), null)
        })
        return
      }
      const lineEls = root.querySelectorAll<HTMLElement>('.k-editor__line[data-line]')
      lineEls.forEach((el) => {
        const line = Number(el.dataset.line)
        if (!Number.isNaN(line)) gutter.setRowHeight(line, el.offsetHeight)
      })
    }

    /** 折行/折叠/字号变化后：同步 gutter 行高 + 刷新光标像素位置 */
    function afterLayoutChange(): void {
      nextTick(() => {
        syncGutterHeights()
        refreshCaretRect()
      })
    }

    /** 内容区滚动 → 虚拟窗口 + 行号槽同步（直接操作 DOM，避免滚动帧级重渲染） */
    function onScrollerScroll(e: Event): void {
      const el = e.currentTarget as HTMLElement
      scrollTopRef.value = el.scrollTop
      gutterRef.value?.setScrollTop(el.scrollTop)
      hideHoverTip()
      // 光标像素位置随视口变化重新实测：虚拟窗口 patch 后光标行可能新入窗/出窗（出窗时容错隐藏）
      nextTick(refreshCaretRect)
    }

    /** minimap 点击/拖拽跳转：目标行滚动到视口中部（含评论块偏移） */
    function jumpToLine(line: number): void {
      const el = scrollerRef.value
      if (!el) return
      const idx = visibleLineList.value.indexOf(line)
      const rowH = rowHeightPx.value
      const extraV = visibleLineList.value.map((l) => extraByLine.value[l] ?? 0)
      const offsets = buildCommentOffsets(extraV, rowH)
      const y = CONTENT_PAD_Y + (idx >= 0 ? offsets[idx] : line * rowH)
      el.scrollTop = Math.max(0, y - el.clientHeight / 2)
    }

    // 模型变化：钳制选区 + 记录历史快照 + 同步 gutter 偏移 + 向外抛出最新文本
    watch(model.lines, () => {
      selection.clamp()
      history.record({ text: model.getText(), caret: caret.pos.value }, input.lastEditKind.value)
      input.lastEditKind.value = null
      props.onChange?.(model.getText())
      nextTick(() => {
        gutterRef.value?.setScrollTop(scrollerRef.value?.scrollTop ?? 0)
        // 光标滚动跟随：仅当光标行在视口外时滚动（大段粘贴后光标落在内容末尾，
        // 视图跟随到光标处——同时也是虚拟窗口聚焦光标附近、避免大跨度渲染的保障）
        ensureLineVisible(caret.pos.value.line)
      })
    })

    // 折行/折叠/字号变化 → gutter 行高与光标位置都依赖几何，统一刷新
    watch(
      [() => props.wordWrap, () => props.codeFold, () => theme.value.fontSize, fold.foldedStarts],
      () => afterLayoutChange(),
    )

    function focus(): void {
      hiddenInputRef.value?.focus()
    }

    function getText(): string {
      return model.getText()
    }

    /** 外部重置内容：清空模型 + 光标按主题默认位置落点 + 清空选区与搜索 + 重建历史 */
    function setText(text: string): void {
      history.suppress()
      model.reset(text)
      caret.setPos(initialCaretPos())
      selection.clearSelection()
      search.clearSearch()
      nextTick(() => {
        history.resume()
        history.reset({ text: model.getText(), caret: caret.pos.value })
      })
    }

    /** 格式化：按当前语言与 indentSize 重排缩进（json 走 stringify，其他走括号深度整理） */
    function format(): void {
      setText(formatCode(model.getText(), langRef.value, theme.value.indentSize))
    }

    expose({
      focus,
      getText,
      setText,
      format,
      search,
      setLanguage,
      undo,
      redo,
      /** 写入 AI 幽灵补全建议（跟随当前光标） */
      setGhost: ghost.setGhost,
      clearGhost: ghost.clearGhost,
      /** 当前光标位置（0 基） */
      getCaret: (): EditorPos => ({ ...caret.pos.value }),
      /** 在指定行下方打开评论输入框（外部唤起评论） */
      openComment,
    })

    /** 折叠图标区：gutter 模式显示在行号前；line-start 模式显示在代码行首 */
    const gutterFoldIcons = computed(() => props.codeFold && props.foldTrigger === 'gutter')
    /** 状态栏：光标信息、语言选择器、格式化按钮或语法校验任一开启即渲染 */
    const showStatusBar = computed(
      () =>
        props.showCursorInfo ||
        (props.languages?.length ?? 0) > 0 ||
        props.showFormat ||
        props.syntaxCheck,
    )

    /** 语法错误行集合（供行号槽标红） */
    const errorLines = computed(() => {
      const set = new Set<number>()
      for (const d of diagnostics.value) set.add(d.line)
      return set
    })

/**
 * 缩进参考线：行 → 需绘制的列列表（语义对齐 VS Code 实测像素：层级 d 的包裹线
 * 画在 (d-1)*indentSize 列 —— 与块头行的缩进列对齐，线与内容之间留一个缩进单位空隙，
 * 即缩进 ind 的行显示 0, is, 2is, ..., (ind/is - 1)*is 共 level 条线，col 0 起画）。
 * - 非空行：level = floor(缩进 / indentSize)，画 [0, is, ..., (level-1)*is]；
 * - 空行：取上下最近非空行 level 的较小值贯通（块中间延续，块尾不画）。
 */
const indentGuidesByLine = computed<Map<number, number[]>>(() => {
  const map = new Map<number, number[]>()
  if (!props.indentGuides) return map
  const is = theme.value.indentSize
  const lines = model.lines.value
  /** 每行的缩进层级 level = floor(缩进列 / indentSize)；空行记 -1 */
  const levelAt = lines.map((l) => {
    let n = 0
    for (const ch of l) {
      if (ch === ' ') n++
      else if (ch === '\t') n += is
      else break
    }
    return l.trim().length === 0 ? -1 : Math.floor(n / is)
  })
  const prevNE: number[] = new Array(lines.length)
  const nextNE: number[] = new Array(lines.length)
  let last = -1
  for (let r = 0; r < lines.length; r++) {
    prevNE[r] = last
    if (levelAt[r] >= 0) last = r
  }
  last = -1
  for (let r = lines.length - 1; r >= 0; r--) {
    nextNE[r] = last
    if (levelAt[r] >= 0) last = r
  }
  for (let r = 0; r < lines.length; r++) {
    const lv =
      levelAt[r] >= 0
        ? levelAt[r]
        : prevNE[r] >= 0 && nextNE[r] >= 0
          ? Math.min(levelAt[prevNE[r]], levelAt[nextNE[r]])
          : -1
    if (lv <= 0) continue
    const cols: number[] = []
    for (let k = 0; k < lv; k++) cols.push(k * is)
    map.set(r, cols)
  }
  return map
})

    /** 单行渲染（全量/虚拟两模式共用） */
    const renderLine = (line: number) => {
      // 折叠隐藏的行不渲染
      if (props.codeFold && fold.hiddenLines.value.has(line)) return null
      const diffType = diffMap.value.get(line) ?? ''
      const g = ghost.ghost.value
      const ghostText = g && g.pos.line === line ? g.text : ''
      const tokens = props.showHighlight ? getTokens(line) : EMPTY_TOKENS
      return (
        <CodeLine
          key={line}
          line={line}
          text={model.getLine(line)}
          selection={selection.lineSelection(line)}
          isActive={props.highlightActiveLine && line === activeLine.value}
          zebra={props.zebraStripe && line % 2 === 1}
          hits={search.lineHits(line)}
          activeHit={search.activeHitOnLine(line)}
          tokens={tokens}
          diffType={diffType}
          marks={mergedMarks(line)}
          changedWords={diffWordsMap.value.get(line) ?? EMPTY_WORDS}
          guides={props.indentGuides ? indentGuidesByLine.value.get(line) ?? EMPTY_GUIDES : EMPTY_GUIDES}
          lineFoldTrigger={props.codeFold && props.foldTrigger === 'line-start' && fold.foldable.value.has(line)}
          folded={fold.foldedStarts.value.has(line)}
          foldIconRender={props.foldIcon}
          foldBadge={props.codeFold && fold.foldedStarts.value.has(line)}
          ghostText={ghostText}
          locale={locale.value}
          onUnfold={fold.toggleFold}
          onToggleFold={fold.toggleFold}
        />
      )
    }

    /** 行下评论块：线程卡片 + 新评论输入框（gutter + 或 openComment 唤起时） */
    const renderCommentBlock = (line: number) => {
      if (props.codeFold && fold.hiddenLines.value.has(line)) return null
      const threads = commentsByLine.value.get(line) ?? []
      const adding = addingLine.value === line
      if (!threads.length && !adding) return null
      return (
        <>
          {threads.map((t) => (
            <div key={`ct${t.id}`} ref={setCommentRef(`t:${t.id}`, line)} class="k-editor__comment-wrap">
              <CommentCard
                thread={t}
                commentable={props.commentable}
                locale={locale.value}
                onSubmit={(body: string, parentId?: string) => props.onCommentSubmit?.({ line, body, parentId })}
                onResolve={(resolved: boolean) => props.onCommentResolve?.({ id: t.id, resolved })}
              />
            </div>
          ))}
          {adding && (
            <div key={`cn${line}`} ref={setCommentRef(`n:${line}`, line)} class="k-editor__comment-wrap">
              <CommentComposer
                locale={locale.value}
                onSubmit={(body: string) => submitNewComment(line, body)}
                onCancel={() => (addingLine.value = null)}
              />
            </div>
          )}
        </>
      )
    }

    return () => (
      <div class="k-editor" style={rootVars.value} onMousedown={focus}>
        {props.showSearch && <SearchBar search={search} locale={locale.value} />}
        <div class="k-editor__body">
          {props.showLineNumber && (
            <CodeGutter
              ref={gutterRef}
              count={model.lineCount.value}
              activeLine={props.highlightActiveLine ? activeLine.value : -1}
              zebra={props.zebraStripe}
              showFold={gutterFoldIcons.value}
              foldable={fold.foldable.value}
              folded={fold.foldedStarts.value}
              hiddenLines={fold.hiddenLines.value}
              foldIconRender={props.foldIcon}
              gutterSlot={props.gutterSlot}
              diffTypes={diffMap.value}
              gutterMarks={props.gutterMarks}
              commentSpaceHeights={commentSpaceHeights.value}
              commentable={props.commentable}
              onAddComment={openComment}
              errorLines={props.syntaxCheck ? errorLines.value : undefined}
              windowSlice={
                virtualRange.value
                  ? { lines: virtualRange.value.lines, topOffset: virtualRange.value.top }
                  : null
              }
              locale={locale.value}
              onToggleFold={fold.toggleFold}
            />
          )}
          <div class="k-editor__scroller" ref={scrollerRef} onScroll={onScrollerScroll}>
            <div
              class={{ 'k-editor__content': true, 'is-wrap': props.wordWrap }}
              ref={contentRef}
              onMousedown={(e) => {
                hideHoverTip()
                mouse.onContentMousedown(e)
              }}
              onMouseover={onContentMouseover}
              onMouseleave={hideHoverTip}
            >
              {virtualRange.value ? (
                <>
                  <div style={{ height: `${virtualRange.value.top}px` }} />
                  {virtualRange.value.lines.map((line) => (
                    <Fragment key={`r${line}`}>
                      {renderLine(line)}
                      {renderCommentBlock(line)}
                    </Fragment>
                  ))}
                  <div style={{ height: `${virtualRange.value.bottom}px` }} />
                </>
              ) : (
                model.lines.value.map((_, line) => (
                  <Fragment key={`r${line}`}>
                    {renderLine(line)}
                    {renderCommentBlock(line)}
                  </Fragment>
                ))
              )}
              <Caret style={caretStyle.value} />
              {/* 标注悬停浮层：实测尺寸后定位（翻转/钳制），首帧 visibility 隐藏防跳动；hoverRender 可接管渲染 */}
              {hoverTip.value && (
                <div
                  ref={hoverLayerRef}
                  class={`k-editor__hover is-type-${hoverTip.value.type}${hoverTip.value.below ? ' is-below' : ''}`}
                  style={{
                    left: `${hoverTip.value.x}px`,
                    top: `${hoverTip.value.y}px`,
                    visibility: hoverTip.value.placed ? 'visible' : 'hidden',
                  }}
                >
                  {props.hoverRender
                    ? props.hoverRender({ message: hoverTip.value.message, type: hoverTip.value.type })
                    : hoverTip.value.message}
                </div>
              )}
              <HiddenInput
                ref={hiddenInputRef}
                style={inputStyle.value}
                handlers={input}
                ariaLabel={props.ariaLabel ?? locale.value.editorAriaLabel}
              />
            </div>
          </div>
          {props.showMinimap && !props.wordWrap && (
            <Minimap
              lines={model.lines.value}
              scrollTop={scrollTopRef.value}
              viewportH={viewportH.value}
              contentH={contentTotalH.value}
              color={theme.value.textColor}
              onJumpTo={jumpToLine}
              onWheelDelta={(deltaY) => {
                const el = scrollerRef.value
                if (el) el.scrollTop += deltaY
              }}
            />
          )}
        </div>
        {showStatusBar.value && (
          <StatusBar
            cursorInfo={props.showCursorInfo ? cursorInfo.value : ''}
            language={langRef.value}
            languages={props.languages}
            onLanguageChange={(l: string) => setLanguage(l)}
            showFormat={props.showFormat}
            onFormat={format}
            syntaxCheck={props.syntaxCheck}
            diagnostics={diagnostics.value}
            locale={locale.value}
          />
        )}
      </div>
    )
  },
})
