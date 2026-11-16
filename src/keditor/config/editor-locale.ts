/**
 * 编辑器内置文案（zh 默认），业务可通过 locale prop 覆盖单项实现 i18n。
 */
export interface EditorLocale {
  /** 折叠图标 title（已展开状态） */
  fold: string
  /** 折叠图标 title（已折叠状态） */
  unfold: string
  /** 折叠省略徽标 title */
  foldBadge: string
  /** 格式化按钮文字 */
  format: string
  /** 格式化按钮 title */
  formatTitle: string
  /** 语法正确文案 */
  syntaxOk: string
  /** 语法错误文案（n 为错误数） */
  syntaxErrors: (n: number) => string
  /** 搜索输入框 placeholder */
  searchPlaceholder: string
  /** 替换输入框 placeholder */
  replacePlaceholder: string
  /** 替换当前按钮 */
  replace: string
  /** 全部替换按钮 */
  replaceAll: string
  /** 语言下拉 title */
  chooseLanguage: string
  /** 隐藏输入层的无障碍标签 */
  editorAriaLabel: string
  /** 评论输入框 placeholder */
  commentPlaceholder: string
  /** 评论提交按钮 */
  commentSubmit: string
  /** 评论取消按钮 */
  commentCancel: string
  /** 回复链接 */
  commentReply: string
  /** 标记已解决链接 */
  commentResolve: string
  /** 恢复（取消已解决）链接 */
  commentUnresolve: string
  /** 已解决折叠条文案（n 为回复数） */
  commentResolvedBar: (author: string, n: number) => string
  /** gutter 添加评论按钮 title */
  commentAddTitle: string
}

export const ZH_LOCALE: EditorLocale = {
  fold: '折叠',
  unfold: '展开',
  foldBadge: '点击展开',
  format: '格式化',
  formatTitle: '按当前语言与缩进宽度格式化代码',
  syntaxOk: '语法正确',
  syntaxErrors: (n) => `${n} 个语法错误`,
  searchPlaceholder: '输入关键词，回车检索 / 跳转下一条，Esc 清除',
  replacePlaceholder: '替换为…',
  replace: '替换',
  replaceAll: '全部替换',
  chooseLanguage: '选择语言',
  editorAriaLabel: '代码编辑器',
  commentPlaceholder: '写下评论…',
  commentSubmit: '发表',
  commentCancel: '取消',
  commentReply: '回复',
  commentResolve: '标记已解决',
  commentUnresolve: '恢复讨论',
  commentResolvedBar: (author, n) => `✓ 已解决 · ${author}${n > 0 ? `（含 ${n} 条回复）` : ''}`,
  commentAddTitle: '在此行添加评论',
}

/** 合并用户覆盖项：locale?: Partial<EditorLocale> → 完整 EditorLocale */
export function resolveLocale(override?: Partial<EditorLocale>): EditorLocale {
  return { ...ZH_LOCALE, ...override }
}
