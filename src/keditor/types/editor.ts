/**
 * 编辑器通用类型定义
 */

/** 编辑器内的一个位置：第 line 行的第 col 列（col 以字符为单位，含 0） */
export interface EditorPos {
  line: number
  col: number
}

/** 一段选区，start 恒在 end 之前（含相等） */
export interface CharRange {
  start: EditorPos
  end: EditorPos
}

/** 行内选区：[startCol, endCol)，null 表示该行无选区 */
export type LineSelection = [number, number] | null

/** 范围标注预设类型：squiggle 波浪线 / highlight 高亮背景 / strike 删除线 */
export type CodeMarkType = 'squiggle' | 'highlight' | 'strike'

/**
 * 任意范围标注：给 [start, end) 字符区间附加视觉装饰（行列 0 基，end 不含）。
 * 支持跨行区间：起始行从 start.col 到行尾，中间行整行，结束行到 end.col。
 * message 作为悬停提示（hover title），className 可叠加自定义样式。
 */
export interface CodeMark {
  start: EditorPos
  end: EditorPos
  type: CodeMarkType
  /** 悬停提示（hover title） */
  message?: string
  /** 自定义附加 class（叠加在内置样式上） */
  className?: string
}

/** 行号槽标注图标类型：书签 / 警告 / 错误 / 信息 */
export type GutterMarkType = 'bookmark' | 'warning' | 'error' | 'info'

/** 行号槽标注：在行号旁渲染一个小圆点图标（type 选色，className 可自定义） */
export interface GutterMark {
  /** 行号（0 基） */
  line: number
  /** 图标类型（选配色） */
  type?: GutterMarkType
  /** 自定义附加 class */
  className?: string
  /** 悬停提示（hover title） */
  title?: string
}

/**
 * 代码评论（Git 审阅风格）：一条顶层评论即一个讨论线程，replies 为线性回复。
 * 数据驱动：由父组件持有数组并响应 onCommentSubmit / onCommentResolve 事件重建。
 */
export interface CodeComment {
  /** 线程唯一 id（提交回复时作为 parentId） */
  id: string
  /** 关联行号（0 基；回复条目忽略此字段） */
  line: number
  /** 作者名（头像取首字圆形徽标） */
  author?: string
  /** 时间戳文本（直接展示，如 '刚刚' / '2026-11-16'） */
  timestamp?: string
  /** 评论内容（纯文本，支持换行） */
  body: string
  /** 线程回复（线性列表） */
  replies?: CodeComment[]
  /** 已解决：线程折叠为一条细横条，可点击展开 */
  resolved?: boolean
}
