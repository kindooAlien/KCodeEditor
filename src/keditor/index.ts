/**
 * KEditor 库入口（npm 发包的 package entry）
 *
 * 导出策略：
 * - 组件：KCodeEditor
 * - 主题：EditorTheme 类型 + DEFAULT_EDITOR_THEME 常量 + resolveLineHeight
 * - Hooks：字符模型 / 光标 / 选区 / 搜索 等可独立复用的逻辑单元
 * - 类型：EditorPos / CharRange 等编辑器基础类型
 */

// 组件（withInstall 挂 Vue Plugin 安装器：支持 app.use(KCodeEditor) 全局注册）
import KCodeEditorComponent from './components/CodeEditor'
import { withInstall } from './install'
export const KCodeEditor = withInstall(KCodeEditorComponent, 'KCodeEditor')
export type { DiffLineMark } from './components/CodeEditor'
export { withInstall }
export type { WithInstall } from './install'
// 主题配置
export {
  DEFAULT_EDITOR_THEME,
  LIGHT_EDITOR_THEME,
  ACCENT_PRESETS,
  HIGHLIGHT_PRESETS,
  LIGHT_HIGHLIGHT_PRESETS,
  resolveLineHeight,
  resolveTokenColors,
} from './config/editor-theme'
export type {
  EditorTheme,
  CaretDefaultPos,
  AccentPreset,
  HighlightPreset,
  TokenType,
  TokenColors,
  DiffLineType,
} from './config/editor-theme'

// Hooks（逻辑层可独立使用）
export { useCharModel } from './hooks/useCharModel'
export type { CharModelApi } from './hooks/useCharModel'
export { useCaret } from './hooks/useCaret'
export type { CaretApi } from './hooks/useCaret'
export { useSelection } from './hooks/useSelection'
export type { SelectionApi } from './hooks/useSelection'
export { useEditorSearch } from './hooks/useEditorSearch'
export type { EditorSearchApi, SearchMatch } from './hooks/useEditorSearch'
export { useCodeFold } from './hooks/useCodeFold'
export type { CodeFoldApi } from './hooks/useCodeFold'
export { useHighlight, tokenizeLine, normalizeLanguage, SUPPORTED_LANGUAGES } from './hooks/useHighlight'
export type { LineToken } from './hooks/useHighlight'
export { useSyntaxCheck, validateJson } from './hooks/useSyntaxCheck'
export type { SyntaxDiagnostic } from './hooks/useSyntaxCheck'
export { useHistory } from './hooks/useHistory'
export type { HistoryApi, HistoryEntry, EditKind } from './hooks/useHistory'
export { useGhostText } from './hooks/useGhostText'
export type { GhostTextApi, GhostSuggestion } from './hooks/useGhostText'

// Linter 插件注册表 + 内置 Linter 工厂
export {
  registerLinter,
  getLinter,
  createBracketLinter,
} from './config/linters'
export type { Linter, LinterDiagnostic } from './config/linters'

// i18n 文案包
export { ZH_LOCALE, resolveLocale } from './config/editor-locale'
export type { EditorLocale } from './config/editor-locale'

// 纯函数工具（词边界 / 位置；JSON 校验经 useSyntaxCheck 处导出）
export { wordBoundaryLeft, wordBoundaryRight, wordRangeAt } from './utils/word'
export { comparePos, isPosEqual, normalizeRange, clampPos, offsetToPos } from './utils/position'

// 基础类型
export type {
  EditorPos,
  CharRange,
  LineSelection,
  CodeMark,
  CodeMarkType,
  GutterMark,
  GutterMarkType,
  CodeComment,
} from './types/editor'

// 工具函数
export { formatCode } from './utils/formatter'
