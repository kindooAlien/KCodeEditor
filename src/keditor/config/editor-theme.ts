/**
 * 编辑器主题配置（const 驱动）
 *
 * 用法：传入 Partial<EditorTheme> 覆盖任意字段，其余走默认值：
 *   <KCodeEditor theme={{ fontSize: 16, zebraBackground: '#222' }} />
 * 也可直接 import DEFAULT_EDITOR_THEME 在业务侧派生自己的主题常量。
 */

/** 光标默认落点 */
export type CaretDefaultPos = 'start' | 'end'

/** 主题色预设：影响选区背景与当前行高亮 */
export type AccentPreset = 'green' | 'blue' | 'purple'

/** 代码风格预设（token 配色方案），显式 tokenColors 字段优先于预设 */
export type HighlightPreset =
  | 'default'
  | 'monokai'
  | 'one-dark'
  | 'dracula'
  | 'github-dark'
  | 'github-light'
  | 'nord'
  | 'tokyo-night'
  | 'gruvbox-dark'
  | 'solarized-dark'
  | 'solarized-light'
  | 'atom-one-light'
  | 'vs-light'

/** 语法 token 类型（轻量正则分词器产出） */
export type TokenType =
  | 'string'
  | 'number'
  | 'comment'
  | 'keyword'
  | 'boolean'
  | 'punct'
  | 'key'
  | 'tag'
  | 'attr'

export type TokenColors = Partial<Record<TokenType, string>>

/** Git diff 行类型 */
export type DiffLineType = 'added' | 'removed' | 'modified'

export interface EditorTheme {
  /** 编辑区背景色 */
  editorBackground: string
  /** 正文文字颜色 */
  textColor: string
  /** 正文字号（px），行高默认 = fontSize + 8 */
  fontSize: number
  /** 行高（px），不传则按 fontSize + 8 推导 */
  lineHeight?: number
  /** 自绘光标颜色 */
  caretColor: string
  /** 光标默认位置：文档开头 / 文档末尾 */
  caretDefaultPos: CaretDefaultPos
  /** Tab 键插入的缩进空格数 */
  indentSize: number
  /** 主题色预设：green / blue / purple（显式设置的选区/当前行色优先于预设） */
  presetColor?: AccentPreset
  /** 鼠标选区背景色 */
  selectionBackground: string
  /** 斑马纹（偶数行）背景色 */
  zebraBackground: string
  /** 当前行（光标所在行）高亮背景色 */
  activeLineBackground: string
  /** 搜索命中背景色 */
  searchHitBackground: string
  /** 当前聚焦的那一条搜索命中的背景色 */
  searchHitActiveBackground: string
  /** 行号槽背景色 */
  gutterBackground: string
  /** 行号默认颜色 */
  gutterColor: string
  /** 当前行对应行号的颜色 */
  gutterActiveColor: string
  /** 代码风格预设：token 配色方案（显式 tokenColors 优先） */
  highlightPreset?: HighlightPreset
  /** 自定义 token 颜色：逐类型覆盖预设配色（const 文档式配置入口） */
  tokenColors?: TokenColors
  /** diff 新增行背景色 */
  diffAddedBackground?: string
  /** diff 删除行背景色 */
  diffRemovedBackground?: string
  /** diff 修改行背景色 */
  diffModifiedBackground?: string
  /** diff 新增行强调色（行首 + 标记） */
  diffAddedColor?: string
  /** diff 删除行强调色（行首 - 标记） */
  diffRemovedColor?: string
  /** diff 修改行强调色（行首 ± 标记） */
  diffModifiedColor?: string
  /** 词级 diff：modified 行内被变更词的加深底色（亮色建议 #c7ecff 系 GitLab 官方色） */
  diffWordBackground?: string
  /** 范围标注 highlight 高亮背景色 */
  markHighlightBackground?: string
  /** 范围标注 strike 删除线颜色 */
  markStrikeColor?: string
  /** 状态栏背景色 */
  statusBarBackground?: string
  /** 状态栏文字颜色 */
  statusBarColor?: string
  /** 状态栏顶部边框色（亮色主题建议浅灰如 #dcdcdc，不传用默认暗色） */
  statusBarBorder?: string
  /** 语言下拉（自绘 menu）菜单背景色 */
  optionBackground?: string
  /** 语言下拉（自绘 menu）菜单文字色 */
  optionColor?: string
}

/** 主题色预设：只覆盖选区背景与当前行高亮两个强调色，显式字段优先 */
export const ACCENT_PRESETS: Record<AccentPreset, Pick<EditorTheme, 'selectionBackground' | 'activeLineBackground'>> = {
  green: {
    selectionBackground: 'rgba(79, 192, 141, 0.30)',
    activeLineBackground: 'rgba(79, 192, 141, 0.09)',
  },
  blue: {
    selectionBackground: 'rgba(74, 157, 255, 0.30)',
    activeLineBackground: 'rgba(74, 157, 255, 0.10)',
  },
  purple: {
    selectionBackground: 'rgba(163, 127, 224, 0.32)',
    activeLineBackground: 'rgba(163, 127, 224, 0.12)',
  },
}

/**
 * 代码风格预设（token 配色），取各主题官方色值。
 * 暗色：default(VS Code Dark+) / monokai / one-dark / dracula / github-dark / nord / tokyo-night / gruvbox-dark / solarized-dark
 * 亮色：vs-light / github-light / solarized-light / atom-one-light（需配套亮色底，见 LIGHT_HIGHLIGHT_PRESETS）
 * 通过 theme.highlightPreset 选择；theme.tokenColors 可逐类型覆盖。
 */
export const HIGHLIGHT_PRESETS: Record<HighlightPreset, TokenColors> = {
  default: {
    string: '#ce9178',
    number: '#b5cea8',
    comment: '#6a9955',
    keyword: '#569cd6',
    boolean: '#569cd6',
    punct: '#d4d4d4',
    key: '#9cdcfe',
    tag: '#4ec9b0',
    attr: '#9cdcfe',
  },
  monokai: {
    string: '#e6db74',
    number: '#ae81ff',
    comment: '#75715e',
    keyword: '#f92672',
    boolean: '#ae81ff',
    punct: '#f8f8f2',
    key: '#a6e22e',
    tag: '#f92672',
    attr: '#a6e22e',
  },
  'one-dark': {
    string: '#98c379',
    number: '#d19a66',
    comment: '#5c6370',
    keyword: '#c678dd',
    boolean: '#d19a66',
    punct: '#abb2bf',
    key: '#e06c75',
    tag: '#e06c75',
    attr: '#d19a66',
  },
  dracula: {
    string: '#f1fa8c',
    number: '#bd93f9',
    comment: '#6272a4',
    keyword: '#ff79c6',
    boolean: '#bd93f9',
    punct: '#f8f8f2',
    key: '#50fa7b',
    tag: '#ff79c6',
    attr: '#50fa7b',
  },
  'github-dark': {
    string: '#a5d6ff',
    number: '#79c0ff',
    comment: '#8b949e',
    keyword: '#ff7b72',
    boolean: '#79c0ff',
    punct: '#c9d1d9',
    key: '#7ee787',
    tag: '#7ee787',
    attr: '#79c0ff',
  },
  'github-light': {
    string: '#0a3069',
    number: '#0550ae',
    comment: '#59636e',
    keyword: '#cf222e',
    boolean: '#0550ae',
    punct: '#24292f',
    key: '#116329',
    tag: '#116329',
    attr: '#953800',
  },
  nord: {
    string: '#a3be8c',
    number: '#b48ead',
    comment: '#616e88',
    keyword: '#81a1c1',
    boolean: '#b48ead',
    punct: '#eceff4',
    key: '#88c0d0',
    tag: '#81a1c1',
    attr: '#8fbcbb',
  },
  'tokyo-night': {
    string: '#9ece6a',
    number: '#ff9e64',
    comment: '#565f89',
    keyword: '#bb9af7',
    boolean: '#ff9e64',
    punct: '#a9b1d6',
    key: '#7aa2f7',
    tag: '#f7768e',
    attr: '#73daca',
  },
  'gruvbox-dark': {
    string: '#b8bb26',
    number: '#d3869b',
    comment: '#928374',
    keyword: '#fb4934',
    boolean: '#d3869b',
    punct: '#ebdbb2',
    key: '#fabd2f',
    tag: '#8ec07c',
    attr: '#83a598',
  },
  'solarized-dark': {
    string: '#2aa198',
    number: '#d33682',
    comment: '#586e75',
    keyword: '#859900',
    boolean: '#d33682',
    punct: '#839496',
    key: '#268bd2',
    tag: '#268bd2',
    attr: '#b58900',
  },
  'solarized-light': {
    string: '#2aa198',
    number: '#d33682',
    comment: '#93a1a1',
    keyword: '#859900',
    boolean: '#d33682',
    punct: '#657b83',
    key: '#268bd2',
    tag: '#268bd2',
    attr: '#b58900',
  },
  'atom-one-light': {
    string: '#50a14f',
    number: '#986801',
    comment: '#a0a1a7',
    keyword: '#a626a4',
    boolean: '#986801',
    punct: '#383a42',
    key: '#986801',
    tag: '#e45649',
    attr: '#4078f2',
  },
  'vs-light': {
    string: '#a31515',
    number: '#098658',
    comment: '#008000',
    keyword: '#0000ff',
    boolean: '#0000ff',
    punct: '#3b3b3b',
    key: '#0451a5',
    tag: '#267f99',
    attr: '#e50000',
  },
}

/** 亮色系预设：token 为亮色配色，需配套亮色编辑区底色（如 LIGHT_EDITOR_THEME） */
export const LIGHT_HIGHLIGHT_PRESETS: HighlightPreset[] = [
  'vs-light',
  'github-light',
  'solarized-light',
  'atom-one-light',
]

export const DEFAULT_EDITOR_THEME: EditorTheme = {
  editorBackground: '#1e1e1e',
  textColor: '#d4d4d4',
  fontSize: 14,
  lineHeight: undefined,
  caretColor: '#aeafad',
  caretDefaultPos: 'start',
  indentSize: 2,
  selectionBackground: '#264f78',
  zebraBackground: 'rgba(255, 255, 255, 0.025)',
  activeLineBackground: 'rgba(79, 192, 141, 0.09)',
  searchHitBackground: 'rgba(234, 158, 54, 0.32)',
  searchHitActiveBackground: '#eabe54',
  gutterBackground: '#1b1b1b',
  gutterColor: '#6e7681',
  gutterActiveColor: '#e8e8e8',
  highlightPreset: 'default',
}

/**
 * 亮色主题（VS Code Light 风格）：
 * 业务侧直接 theme={LIGHT_EDITOR_THEME} 或在此基础上派生自己的亮色常量。
 * 搭配 highlightPreset 'vs-light' 使用，token 配色同步切换为亮色系。
 */
export const LIGHT_EDITOR_THEME: EditorTheme = {
  editorBackground: '#ffffff',
  textColor: '#3b3b3b',
  fontSize: 14,
  lineHeight: undefined,
  caretColor: '#1f1f1f',
  caretDefaultPos: 'start',
  indentSize: 2,
  selectionBackground: 'rgba(79, 192, 141, 0.25)',
  zebraBackground: 'rgba(0, 0, 0, 0.02)',
  activeLineBackground: 'rgba(79, 192, 141, 0.10)',
  searchHitBackground: 'rgba(234, 158, 54, 0.35)',
  searchHitActiveBackground: '#f6c26b',
  gutterBackground: '#f7f7f7',
  gutterColor: '#a0a0a0',
  gutterActiveColor: '#333333',
  highlightPreset: 'vs-light',
  statusBarBackground: '#f0f0f0',
  statusBarColor: '#3b3b3b',
  statusBarBorder: '#dcdcdc',
  optionBackground: '#ffffff',
  optionColor: '#3b3b3b',
}

/** 行高推导规则：显式指定优先，否则 fontSize + 8 */
export function resolveLineHeight(theme: EditorTheme): number {
  return theme.lineHeight ?? theme.fontSize + 8
}

/** 解析最终 token 配色：默认 < 风格预设 < 用户显式 tokenColors */
export function resolveTokenColors(theme: EditorTheme): TokenColors {
  const preset = theme.highlightPreset
    ? HIGHLIGHT_PRESETS[theme.highlightPreset]
    : HIGHLIGHT_PRESETS.default
  return { ...HIGHLIGHT_PRESETS.default, ...preset, ...theme.tokenColors }
}
