import type { EditorTheme, HighlightPreset } from '@/keditor'

/** 预设显示名（key 与 HIGHLIGHT_PRESETS 一致，顺序即下拉顺序） */
export const PRESET_LABELS: Array<{ id: HighlightPreset; label: string }> = [
  { id: 'default', label: 'VS Code Dark+（默认）' },
  { id: 'monokai', label: 'Monokai' },
  { id: 'one-dark', label: 'Atom One Dark' },
  { id: 'dracula', label: 'Dracula' },
  { id: 'github-dark', label: 'GitHub Dark' },
  { id: 'nord', label: 'Nord' },
  { id: 'tokyo-night', label: 'Tokyo Night' },
  { id: 'gruvbox-dark', label: 'Gruvbox Dark' },
  { id: 'solarized-dark', label: 'Solarized Dark' },
  { id: 'vs-light', label: 'VS Code Light' },
  { id: 'github-light', label: 'GitHub Light' },
  { id: 'solarized-light', label: 'Solarized Light' },
  { id: 'atom-one-light', label: 'Atom One Light' },
]

/** 暗色系预设的官方编辑区底色（选什么主题，整个编辑器就呈现什么主题） */
export const DARK_BASE: Partial<Record<HighlightPreset, Partial<EditorTheme>>> = {
  default: {
    editorBackground: '#1e1e1e',
    textColor: '#d4d4d4',
    gutterBackground: '#1e1e1e',
    gutterColor: '#858585',
    gutterActiveColor: '#c6c6c6',
  },
  monokai: {
    editorBackground: '#272822',
    textColor: '#f8f8f2',
    gutterBackground: '#272822',
    gutterColor: '#90918b',
    gutterActiveColor: '#f8f8f2',
  },
  'one-dark': {
    editorBackground: '#282c34',
    textColor: '#abb2bf',
    gutterBackground: '#282c34',
    gutterColor: '#636d83',
    gutterActiveColor: '#abb2bf',
  },
  dracula: {
    editorBackground: '#282a36',
    textColor: '#f8f8f2',
    gutterBackground: '#282a36',
    gutterColor: '#6272a4',
    gutterActiveColor: '#f8f8f2',
  },
  'github-dark': {
    editorBackground: '#0d1117',
    textColor: '#e6edf3',
    gutterBackground: '#0d1117',
    gutterColor: '#6e7681',
    gutterActiveColor: '#e6edf3',
  },
  nord: {
    editorBackground: '#2e3440',
    textColor: '#d8dee9',
    gutterBackground: '#2e3440',
    gutterColor: '#616e88',
    gutterActiveColor: '#d8dee9',
  },
  'tokyo-night': {
    editorBackground: '#1a1b26',
    textColor: '#a9b1d6',
    gutterBackground: '#1a1b26',
    gutterColor: '#565f89',
    gutterActiveColor: '#c0caf5',
  },
  'gruvbox-dark': {
    editorBackground: '#282828',
    textColor: '#ebdbb2',
    gutterBackground: '#282828',
    gutterColor: '#928374',
    gutterActiveColor: '#ebdbb2',
  },
  'solarized-dark': {
    editorBackground: '#002b36',
    textColor: '#839496',
    gutterBackground: '#002b36',
    gutterColor: '#586e75',
    gutterActiveColor: '#93a1a1',
  },
}

/** 亮色系预设的官方编辑区底色（token 为亮色配色，暗色底上看不见） */
export const LIGHT_BASE: Partial<Record<HighlightPreset, Partial<EditorTheme>>> = {
  'vs-light': {
    editorBackground: '#ffffff',
    textColor: '#3b3b3b',
    gutterBackground: '#f7f7f7',
    gutterColor: '#a0a0a0',
    gutterActiveColor: '#333333',
  },
  'github-light': {
    editorBackground: '#ffffff',
    textColor: '#24292f',
    gutterBackground: '#f6f8fa',
    gutterColor: '#6e7781',
    gutterActiveColor: '#24292f',
  },
  'solarized-light': {
    editorBackground: '#fdf6e3',
    textColor: '#657b83',
    gutterBackground: '#eee8d5',
    gutterColor: '#93a1a1',
    gutterActiveColor: '#586e75',
  },
  'atom-one-light': {
    editorBackground: '#fafafa',
    textColor: '#383a42',
    gutterBackground: '#f0f0f1',
    gutterColor: '#9d9d9f',
    gutterActiveColor: '#383a42',
  },
}

/** 按预设取配套底色：暗色系走 DARK_BASE、亮色系走 LIGHT_BASE，并补对应明暗的光标色（无配置的预设返回默认底色） */
export function baseForPreset(preset: HighlightPreset): Partial<EditorTheme> {
  const isLight = LIGHT_HIGHLIGHT_PRESET_IDS.includes(preset)
  const base = isLight ? LIGHT_BASE : DARK_BASE
  return { caretColor: isLight ? '#1f1f1f' : '#d4d4d4', ...(base[preset] ?? {}) }
}

/** 与库导出的 LIGHT_HIGHLIGHT_PRESETS 对齐的亮色 id 列表（供 baseForPreset 判断） */
const LIGHT_HIGHLIGHT_PRESET_IDS: HighlightPreset[] = [
  'vs-light',
  'github-light',
  'solarized-light',
  'atom-one-light',
]
