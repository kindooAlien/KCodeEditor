import { defineComponent, ref, computed } from 'vue'
import type { PropType, VNodeChild } from 'vue'
import type { DiffLineType } from '@/keditor/config/editor-theme'
import type { EditorLocale } from '@/keditor/config/editor-locale'
import type { GutterMark } from '@/keditor/types/editor'
import { FoldPlusIcon, FoldMinusIcon } from './icons'

/** 虚拟渲染窗口：要渲染的行切片 + 切片前的占位高度（与内容区 spacer 对齐） */
export interface GutterWindowSlice {
  lines: number[]
  topOffset: number
}

/**
 * 行号槽（gutter）：
 * - 独立于滚动容器，垂直方向通过 transform 与内容区滚动同步
 * - 水平方向不受内容横向滚动影响（gutter 在 scroller 之外）
 * - 行号宽度随总行数的位数自适应（1ch/位）；折叠列/插槽列按内容自然占位，总宽 max-content
 * - 折叠：可折叠行前显示 −/+ 图标（foldIconRender 可完全自定义），点击切换；被隐藏的行不渲染
 * - 折行模式：父组件测量每行实际高度后通过 setRowHeight 同步，行号对齐首视觉行
 * - 插槽：gutterSlot(line) 可在行号后追加自定义内容（如文件标记、todo 图标等）
 * - diff：added / removed / modified 行的行号着色
 * - 评论：commentSpaceHeights 提供每行下方评论块实测高度 → 渲染等高占位行，保证行号与内容对齐；
 *   commentable 开启时行号旁显示「+」按钮发起评论（onAddComment 上抛）
 */
export default defineComponent({
  name: 'KCodeGutter',
  props: {
    /** 总行数 */
    count: { type: Number, required: true },
    /** 当前光标所在行（0 基），-1 表示无高亮 */
    activeLine: { type: Number, default: -1 },
    /** 是否启用斑马纹（与内容行奇偶同步，背景色连续覆盖行号槽） */
    zebra: { type: Boolean, default: false },
    /** 是否启用折叠图标区 */
    showFold: { type: Boolean, default: false },
    /** 可折叠区间：起始行 → 结束行 */
    foldable: { type: Map as PropType<Map<number, number>>, default: () => new Map() },
    /** 已折叠的起始行集合 */
    folded: { type: Set as PropType<Set<number>>, default: () => new Set() },
    /** 被隐藏（不渲染）的行集合 */
    hiddenLines: { type: Set as PropType<Set<number>>, default: () => new Set() },
    /** 自定义折叠图标渲染（不传用默认 + / − 文本） */
    foldIconRender: {
      type: Function as PropType<(state: { folded: boolean; line: number }) => VNodeChild>,
      default: undefined,
    },
    /** 行号槽自定义插槽：在行号后追加自定义内容 */
    gutterSlot: {
      type: Function as PropType<(line: number) => VNodeChild>,
      default: undefined,
    },
    /** 行 → diff 类型映射 */
    diffTypes: { type: Map as PropType<Map<number, DiffLineType>>, default: () => new Map() },
    /** 语法错误行集合（0 基）：行号标红提示 */
    errorLines: { type: Set as PropType<Set<number>>, default: () => new Set() },
    /** 行号槽标注图标列表（书签/警告/错误/信息小圆点，0 基行号） */
    gutterMarks: { type: Array as PropType<GutterMark[]>, default: () => [] },
    /** 每行下方评论块实测高度（行号 → px）：渲染等高占位保持与内容区对齐 */
    commentSpaceHeights: { type: Map as PropType<Map<number, number>>, default: () => new Map() },
    /** 是否开放评论交互（行号旁显示 + 按钮） */
    commentable: { type: Boolean, default: false },
    /** 点击行号旁 + 按钮：在指定行发起评论 */
    onAddComment: { type: Function as PropType<(line: number) => void>, default: undefined },
    /** 虚拟渲染窗口（非 null 时只渲染切片行，切片前加占位高度） */
    windowSlice: { type: Object as PropType<GutterWindowSlice | null>, default: null },
    /** 内置文案（i18n） */
    locale: { type: Object as PropType<EditorLocale>, required: true },
    onToggleFold: {
      type: Function as PropType<(start: number) => void>,
      default: undefined,
    },
  },
  setup(props, { expose }) {
    const innerRef = ref<HTMLElement | null>(null)

    let lastSyncY = -1

    /** 由父组件在内容区滚动时调用，保持行号与内容垂直对齐（值不变时跳过写 style） */
    function setScrollTop(y: number): void {
      if (innerRef.value && y !== lastSyncY) {
        lastSyncY = y
        innerRef.value.style.transform = `translateY(${-y}px)`
      }
    }

    /**
     * 折行模式下由父组件逐行同步高度；height 为 null 表示清除内联高度（回到 CSS 默认）
     */
    function setRowHeight(line: number, height: number | null): void {
      const root = innerRef.value
      if (!root) return
      const row = root.querySelector<HTMLElement>(`.k-editor__gutter-row[data-line="${line}"]`)
      if (row) row.style.height = height === null ? '' : `${height}px`
    }

    expose({ setScrollTop, setRowHeight })

    /** 行号列宽 = 总行数位数 × 1ch（自适应位数，不写死像素）；总宽由内容 max-content 自然撑开 */
    const gutterVars = computed(() => ({
      '--k-gutter-num-w': `${String(Math.max(props.count, 1)).length}ch`,
    }))

    const rowClass = (i: number): Record<string, boolean> => {
      const diff = props.diffTypes.get(i)
      return {
        'k-editor__gutter-row': true,
        'is-active': i === props.activeLine,
        'is-zebra': props.zebra && i % 2 === 1,
        'is-error': props.errorLines.has(i),
        ...(diff ? { [`is-diff-${diff}`]: true } : {}),
      }
    }

    /** 行号 → 标注图标映射（每行可多个，渲染时按序排列） */
    const marksByLine = computed(() => {
      const map = new Map<number, GutterMark[]>()
      for (const m of props.gutterMarks) {
        if (m.line < 0) continue
        const list = map.get(m.line) ?? []
        list.push(m)
        map.set(m.line, list)
      }
      return map
    })

    /** 行下方评论块等高占位（无评论返回 null 不占位） */
    const renderSpacer = (i: number) => {
      const h = props.commentSpaceHeights.get(i)
      if (!h) return null
      return <div key={`s${i}`} class="k-editor__gutter-comment-space" style={{ height: `${h}px` }} />
    }

    /** 单行渲染（虚拟/全量两模式共用） */
    const renderRow = (i: number) => {
      // 折叠隐藏的行不渲染行号
      if (props.hiddenLines.has(i)) return null
      const foldable = props.showFold && props.foldable.has(i)
      const isFolded = props.folded.has(i)
      const renderIcon = (): VNodeChild =>
        props.foldIconRender
          ? props.foldIconRender({ folded: isFolded, line: i })
          : isFolded
            ? <FoldPlusIcon />
            : <FoldMinusIcon />
      return (
        <div key={i} class={rowClass(i)} data-line={i}>
          {props.showFold &&
            (foldable ? (
              <span
                class="k-editor__gutter-fold"
                title={isFolded ? props.locale.unfold : props.locale.fold}
                onMousedown={(e: MouseEvent) => e.stopPropagation()}
                onClick={(e: MouseEvent) => {
                  e.stopPropagation()
                  props.onToggleFold?.(i)
                }}
              >
                {renderIcon()}
              </span>
            ) : (
              // 折叠列占位：不可折叠行也保留同宽空位，保证行号列垂直成线
              <span class="k-editor__gutter-fold is-placeholder" />
            ))}
          <span class="k-editor__gutter-num">{i + 1}</span>
          {/* 发起评论按钮：仅 commentable 时渲染，行号槽悬停时可见（CSS） */}
          {props.commentable && (
            <span
              class="k-editor__gutter-add"
              title={props.locale.commentAddTitle}
              onMousedown={(e: MouseEvent) => e.stopPropagation()}
              onClick={(e: MouseEvent) => {
                e.stopPropagation()
                props.onAddComment?.(i)
              }}
            >
              +
            </span>
          )}
          {/* 标注图标列：书签/警告等小圆点，每行可多个（无标注时不占位，随内容自然展开） */}
          {(marksByLine.value.get(i) ?? []).map((m, mi) => (
            <span
              key={mi}
              class={[
                'k-editor__gutter-mark',
                m.type ? `is-gutter-${m.type}` : '',
                m.className ?? '',
              ]}
              title={m.title || undefined}
            >
              ●
            </span>
          ))}
          {/* 插槽列每行都渲染：无内容时空占位，保证行号列不随插槽内容左右跳动 */}
          {props.gutterSlot && <span class="k-editor__gutter-slot">{props.gutterSlot(i)}</span>}
        </div>
      )
    }

    return () => (
      <div class="k-editor__gutter" style={gutterVars.value}>
        <div class="k-editor__gutter-inner" ref={innerRef}>
          {props.windowSlice ? (
            <>
              <div style={{ height: `${props.windowSlice.topOffset}px` }} />
              {props.windowSlice.lines.flatMap((i) => [renderRow(i), renderSpacer(i)])}
            </>
          ) : (
            Array.from({ length: props.count }, (_, i) => [renderRow(i), renderSpacer(i)])
          )}
        </div>
      </div>
    )
  },
})
