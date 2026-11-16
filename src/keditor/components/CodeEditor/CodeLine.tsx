import { defineComponent, computed } from 'vue'
import type { PropType, VNodeChild } from 'vue'
import { FoldPlusIcon, FoldMinusIcon, FoldEllipsisIcon } from './icons'
import type { LineToken } from '@/keditor/hooks/useHighlight'
import type { LineSelection, CodeMark } from '@/keditor/types/editor'
import type { DiffLineType, TokenType } from '@/keditor/config/editor-theme'
import type { EditorLocale } from '@/keditor/config/editor-locale'

/**
 * 单行渲染器：把一行文本拆成逐字符的 span 序列。
 * white-space: pre 保证空格 / tab 等空白字符原样占位。
 * - 搜索高亮 / 选区 / 语法 token 都在字符粒度加 class
 * - 折叠：起始行尾部渲染 ⋯ 徽标；foldTrigger=line-start 时行首渲染触发器
 * - diff：整行背景 + 左侧色条（added / removed / modified）
 */
export default defineComponent({
  name: 'KCodeLine',
  props: {
    line: { type: Number, required: true },
    text: { type: String, required: true },
    /** 该行的选区列范围 [startCol, endCol)，null 表示无选区 */
    selection: { type: Array as unknown as PropType<LineSelection>, default: null },
    /** 光标所在行高亮 */
    isActive: { type: Boolean, default: false },
    /** 斑马纹（奇偶行交替背景） */
    zebra: { type: Boolean, default: false },
    /** 该行的搜索命中片段集合 [startCol, endCol) */
    hits: { type: Array as unknown as PropType<Array<[number, number]>>, default: () => [] },
    /** 该行上的「当前聚焦命中」片段 */
    activeHit: { type: Array as unknown as PropType<[number, number] | null>, default: null },
    /** 该行的语法 token 列表（showHighlight 开启时传入） */
    tokens: { type: Array as PropType<LineToken[]>, default: () => [] },
    /** 该行的 diff 类型（'' 表示非 diff 行） */
    diffType: { type: String as PropType<DiffLineType | ''>, default: '' },
    /** 该行上的范围标注列表（跨行区间已按行拆分，行列 0 基） */
    marks: { type: Array as PropType<CodeMark[]>, default: () => [] },
    /** modified 行内被变更词的列区间集合 [startCol, endCol)（词级 diff，GitLab 行内加深） */
    changedWords: { type: Array as unknown as PropType<Array<[number, number]>>, default: () => [] },
    /** 折叠触发器在行首（foldTrigger=line-start）且该行可折叠 */
    lineFoldTrigger: { type: Boolean, default: false },
    /** 该行是否已折叠 */
    folded: { type: Boolean, default: false },
    /** 自定义折叠图标渲染（不传用默认 + / −） */
    foldIconRender: {
      type: Function as PropType<(state: { folded: boolean; line: number }) => VNodeChild>,
      default: undefined,
    },
    /** 该行是否处于折叠状态（渲染尾部 ⋯ 徽标） */
    foldBadge: { type: Boolean, default: false },
    /** 幽灵补全建议文本（仅光标所在行传入；渲染为灰色虚影，不参与命中测试） */
    ghostText: { type: String, default: '' },
    /** 缩进参考线：该行需要绘制的列列表（已含 (d-1)*indentSize 换算，引用稳定；空数组关闭）。
     * 语义对齐 VS Code：层级 d 的包裹线画在 (d-1)*indentSize 列 —— 与块头行的缩进列对齐，
     * 线与内容之间保留一个缩进单位空隙 */
    guides: { type: Array as PropType<number[]>, default: () => [] },
    /** 内置文案（i18n） */
    locale: { type: Object as PropType<EditorLocale>, required: true },
    onUnfold: {
      type: Function as PropType<(line: number) => void>,
      default: undefined,
    },
    onToggleFold: {
      type: Function as PropType<(line: number) => void>,
      default: undefined,
    },
  },
  setup(props) {
    /**
     * 每列渲染状态预计算：把选区 / 命中 / token / 标注 / 词级 diff 一次性摊到列数组上
     * （复杂度 O(cols + tokens + hits + marks + changedWords)），渲染时逐列 O(1) 取 class。
     * 同时字符直接渲染为原生 span VNode，不再经过 CharSpan 组件实例 ——
     * 虚拟窗口滑动时全量新建行是滚动跳帧的热点，组件实例化开销是主要瓶颈。
     * DOM 结构与 CharSpan 完全一致（span.k-editor__char + class + data-mark-title）。
     */
    const spans = computed(() => {
      const text = props.text
      const cols = text.length
      const out: Array<{ ch: string; cls: string; title?: string }> = []
      if (cols === 0) return out

      const tokByCol: (TokenType | undefined)[] = new Array(cols)
      for (const t of props.tokens) {
        const from = Math.max(0, t.start)
        const to = Math.min(cols, t.end)
        for (let c = from; c < to; c++) tokByCol[c] = t.type
      }

      const hitByCol = new Uint8Array(cols)
      for (const [a, b] of props.hits) {
        const from = Math.max(0, a)
        const to = Math.min(cols, b)
        for (let c = from; c < to; c++) hitByCol[c] = 1
      }
      const activeByCol = new Uint8Array(cols)
      if (props.activeHit) {
        const from = Math.max(0, props.activeHit[0])
        const to = Math.min(cols, props.activeHit[1])
        for (let c = from; c < to; c++) activeByCol[c] = 1
      }

      const dwByCol = new Uint8Array(cols)
      for (const [a, b] of props.changedWords) {
        const from = Math.max(0, a)
        const to = Math.min(cols, b)
        for (let c = from; c < to; c++) dwByCol[c] = 1
      }

      const markClsByCol: string[] = new Array(cols)
      const markTitleByCol: string[] = new Array(cols)
      for (const m of props.marks) {
        const s = m.start
        const e = m.end
        let from: number
        let to: number
        if (s.line === e.line) {
          if (s.line !== props.line) continue
          from = s.col
          to = e.col
        } else if (props.line === s.line) {
          from = s.col
          to = cols
        } else if (props.line === e.line) {
          from = 0
          to = e.col
        } else if (props.line > s.line && props.line < e.line) {
          from = 0
          to = cols
        } else {
          continue
        }
        const extra = `is-mark-${m.type}` + (m.className ? ` ${m.className}` : '')
        const title = m.message || ''
        const lo = Math.max(0, from)
        const hi = Math.min(cols, to)
        for (let c = lo; c < hi; c++) {
          markClsByCol[c] = markClsByCol[c] ? `${markClsByCol[c]} ${extra}` : extra
          if (!markTitleByCol[c] && title) markTitleByCol[c] = title
        }
      }

      const sel = props.selection
      for (let c = 0; c < cols; c++) {
        let cls = 'k-editor__char'
        if (sel && c >= sel[0] && c < sel[1]) cls += ' is-selected'
        if (hitByCol[c]) cls += ' is-hit'
        if (activeByCol[c]) cls += ' is-hit-active'
        const tok = tokByCol[c]
        if (tok) cls += ` k-editor__tok-${tok}`
        if (markClsByCol[c]) cls += ` ${markClsByCol[c]}`
        if (dwByCol[c]) cls += ' is-diff-word'
        const title = markTitleByCol[c]
        out.push(title ? { ch: text[c], cls, title } : { ch: text[c], cls })
      }
      return out
    })

    /** diff 行首标记字符（GitLab 风格）：新增 + / 删除 - / 修改 ±，非 diff 行返回 null */
    const diffSign = computed<string | null>(() => {
      if (props.diffType === 'added') return '+'
      if (props.diffType === 'removed') return '-'
      if (props.diffType === 'modified') return '±'
      return null
    })

    return () => (
      <div
        class={{
          'k-editor__line': true,
          'is-active': props.isActive,
          'is-zebra': props.zebra,
          ...(props.diffType ? { [`is-diff-${props.diffType}`]: true } : {}),
        }}
        data-line={props.line}
      >
        {props.lineFoldTrigger && (
          <span
            class="k-editor__fold-trigger-line"
            title={props.folded ? props.locale.unfold : props.locale.fold}
            onMousedown={(e: MouseEvent) => e.stopPropagation()}
            onClick={() => props.onToggleFold?.(props.line)}
          >
            {props.foldIconRender
              ? props.foldIconRender({ folded: props.folded, line: props.line })
              : props.folded
                ? <FoldPlusIcon />
                : <FoldMinusIcon />}
          </span>
        )}
        {diffSign.value && (
          <span class={`k-editor__diff-sign is-diff-${props.diffType}`}>{diffSign.value}</span>
        )}
        {spans.value.map((s, col) => (
          <span key={col} class={s.cls} data-mark-title={s.title}>
            {s.ch}
          </span>
        ))}
        {/* 缩进参考线：absolute 定位不占 flow、放在字符序列之后（不破坏 col=index 约定）；
            diff 行首有 1.5ch 标记，left 补偿 */}
        {props.guides.map((col) => (
          <span key={`guide-${col}`} class="k-editor__guide"
            style={{ left: `calc(${props.diffType ? '1.5ch + ' : ''}${col}ch)` }} />
        ))}
        {/* 幽灵补全虚影：独立 class，不进 k-editor__char 序列（不干扰光标定位/命中测试/选区） */}
        {props.ghostText &&
          props.ghostText.split('').map((ch, i) => (
            <span key={`ghost-${i}`} class="k-editor__ghost-char">
              {ch}
            </span>
          ))}
        {props.foldBadge && (
          <span
            class="k-editor__fold-ellipsis"
            title={props.locale.foldBadge}
            onMousedown={(e: MouseEvent) => e.stopPropagation()}
            onClick={() => props.onUnfold?.(props.line)}
          >
            <FoldEllipsisIcon />
          </span>
        )}
      </div>
    )
  },
})
