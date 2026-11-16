import { defineComponent } from 'vue'
import ApiTable from '@/docs/components/ApiTable'
import type { ApiColumn } from '@/docs/components/ApiTable'

const PROP_COLUMNS: ApiColumn[] = [
  { key: 'name', title: '属性', width: 170 },
  { key: 'desc', title: '说明' },
  { key: 'type', title: '类型', width: 220 },
  { key: 'default', title: '默认值', width: 110 },
]

const PROPS = [
  { name: 'initialText', desc: '初始文本（\n 分行）', type: 'string', default: "''" },
  { name: 'showLineNumber', desc: '显示左侧行号槽，宽度随行数位数自适应，纵向滚动实时同步', type: 'boolean', default: 'false' },
  { name: 'highlightActiveLine', desc: '高亮光标所在行，行号槽同步提亮', type: 'boolean', default: 'false' },
  { name: 'zebraStripe', desc: '奇偶行斑马纹背景', type: 'boolean', default: 'false' },
  { name: 'showSearch', desc: '显示内嵌搜索框：回车检索并高亮，回车循环跳转，Esc 清除', type: 'boolean', default: 'false' },
  { name: 'autoIndent', desc: '回车自动缩进（内置行为，无需开启）：继承上一行缩进；行尾 { [ ( 多缩一层 indentSize；在配对括号间回车自动补全并让光标落在中间', type: '内置行为', default: '开启' },
  { name: 'wordWrap', desc: '自动折行（VS Code 风格）：开启后超长行在可视区内换行，行号槽按实际行高同步', type: 'boolean', default: 'false' },
  { name: 'codeFold', desc: '括号折叠：可折叠行显示 +/− 图标，收起后行尾出现 ⋯ 徽标；字符串内括号不误配', type: 'boolean', default: 'false' },
  { name: 'foldTrigger', desc: '折叠触发器位置：gutter（行号前）或 line-start（代码行最左侧，适配 UI 设计稿）', type: "'gutter' | 'line-start'", default: "'gutter'" },
  { name: 'foldIcon', desc: '自定义折叠图标（行号槽与行首两个位置都生效），可传图标字体/emoji/SVG', type: '(state: { folded: boolean; line: number }) => VNodeChild', default: '—' },
  { name: 'gutterSlot', desc: '行号槽插槽：在每行行号后追加自定义内容（文件标记、todo 图标等）', type: '(line: number) => VNodeChild', default: '—' },
  { name: 'showCursorInfo', desc: '底部状态栏显示光标实时位置 Ln x, Col y（1 基）', type: 'boolean', default: 'false' },
  { name: 'languages', desc: '可选语言列表（传入即显示底部语言下拉），如 json / ts / html / go 等，大小写不敏感', type: 'string[]', default: '—' },
  { name: 'language', desc: '当前语言（受控）。默认空串 = 按内容自动检测：初始文本推断语言，粘贴代码片段时自动跟随切换（识别出不同语言且未手动选过语言时）；显式传入语言则固定不跟随，切换通过 onLanguageChange 回调', type: 'string', default: "''（自动检测）" },
  { name: 'onLanguageChange', desc: '语言切换回调（已归一化小写）', type: '(language: string) => void', default: '—' },
  { name: 'showHighlight', desc: '轻量语法高亮（默认开启，对齐 Monaco / CodeMirror 惯例）：单行正则分词，关键字/字符串/注释/数字/布尔/key/标签/属性/标点分色；纯文本展示可显式关闭', type: 'boolean', default: 'true' },
  { name: 'showFormat', desc: '状态栏显示「格式化」按钮：按当前语言与 indentSize 重排缩进（json 走 stringify，其他按括号深度整理）', type: 'boolean', default: 'false' },
  { name: 'syntaxCheck', desc: '语法校验：状态栏显示「N 个语法错误 / 语法正确」（悬浮看首个错误行列与原因），错误行行号标红；实现按语言从 linter 注册表获取（json 内置，js/ts 可传 linters 或经 createBracketLinter 注册）', type: 'boolean', default: 'false' },
  { name: 'indentGuides', desc: '缩进参考线：按缩进层级绘制点状竖线（VS Code 风格块包裹线，层级 d 画在 (d-1)*indentSize 列，与块头缩进列对齐，线与内容间留一个缩进单位）；非空行按本行缩进绘制，块中间空行上下贯通，闭合行不画孤线，颜色可覆写 token --k-guide-color', type: 'boolean', default: 'false' },
  { name: 'linters', desc: '业务自定义 linter：语言 → 诊断函数（(text) => { line, col, message }[]，行列 0 基），挂载时注册进全局注册表', type: 'Record<string, Linter>', default: '—' },
  { name: 'showMinimap', desc: 'Minimap 缩略图（canvas 色带 + 视口框，点击/拖拽跳转）；仅非折行模式可用', type: 'boolean', default: 'false' },
  { name: 'locale', desc: '内置文案覆盖（i18n）：折叠/格式化/语法状态/搜索占位等任意字段可覆盖，如 { format: \'Format\' }', type: 'Partial<EditorLocale>', default: '—' },
  { name: 'ariaLabel', desc: '隐藏输入层的无障碍标签（默认走 locale.editorAriaLabel）', type: 'string', default: '—' },
  { name: 'diffLines', desc: 'Git diff 行标记（GitLab 风格）：整行浅色底（含行号槽）+ 行首 +/−/± 标记列，行号 0 基；modified 行可传 changedWords（[startCol, endCol)[]）做行内词级加深底色', type: "Array<{ line: number; type: 'added' | 'removed' | 'modified'; changedWords?: [number, number][] }>", default: '—' },
  { name: 'marks', desc: '任意范围代码标注：start/end 行列 0 基（end 不含，支持跨行），内置 squiggle 波浪线 / highlight 高亮背景 / strike 删除线；message 悬停提示，className 叠加自定义样式', type: "Array<{ start: EditorPos; end: EditorPos; type: 'squiggle' | 'highlight' | 'strike'; message?: string; className?: string }>", default: '—' },
  { name: 'gutterMarks', desc: '行号槽标注图标（小圆点）：bookmark 金 / warning 橙 / error 红 / info 蓝，每行可多个；title 悬停提示，className 自定义', type: "Array<{ line: number; type?: 'bookmark' | 'warning' | 'error' | 'info'; className?: string; title?: string }>", default: '—' },
  { name: 'hoverRender', desc: '标注悬停浮层接管：传入后 marks/诊断的悬停提示由业务组件渲染（如 KDesignUI Popover、Element Plus Tooltip），不传用内置 VS Code 式浮层（锚定字符上方，滚动/移出自动隐藏）', type: '(ctx: { message: string; type: string }) => VNodeChild', default: '—' },
  { name: 'comments', desc: '代码评论线程（Git/GitLab 协作讨论卡）：按 line 渲染在对应代码行下方，含缩进回复与已解决折叠条（绿色 ✓，点击展开/恢复）', type: 'Array<{ id: string; line: number; author?: string; timestamp?: string; body: string; replies?: CodeComment[]; resolved?: boolean }>', default: '—' },
  { name: 'commentable', desc: '开放评论交互：行号槽悬停显示「+」按钮（title 走 locale.commentAddTitle），点击在当前行下方弹出发起输入框', type: 'boolean', default: 'false' },
  { name: 'onCommentSubmit', desc: '发表评论 / 回复回调：parentId 存在表示是线程内回复，数据由业务持有后回传 comments', type: '(payload: { line: number; body: string; parentId?: string }) => void', default: '—' },
  { name: 'onCommentResolve', desc: '标记解决 / 恢复讨论回调（resolved 为目标状态）', type: '(payload: { id: string; resolved: boolean }) => void', default: '—' },
  { name: 'theme', desc: '主题配置，覆盖 DEFAULT_EDITOR_THEME 的任意字段；亮色场景可直接传 LIGHT_EDITOR_THEME（库已导出，含 vs-light token 配色）', type: 'Partial<EditorTheme>', default: '—' },
  { name: 'onChange', desc: '内容变化回调（每次模型变更后触发）', type: '(text: string) => void', default: '—' },
]

const METHOD_COLUMNS: ApiColumn[] = [
  { key: 'name', title: '方法 / 成员', width: 170 },
  { key: 'desc', title: '说明' },
  { key: 'type', title: '签名', width: 260 },
]

const METHODS = [
  { name: 'getText', desc: '获取编辑区原始文本（转义字符原样）', type: '() => string' },
  { name: 'setText', desc: '重置内容，光标按 theme.caretDefaultPos 落点，同时清空选区与搜索', type: '(text: string) => void' },
  { name: 'focus', desc: '聚焦编辑区（隐藏输入捕获层）', type: '() => void' },
  { name: 'setLanguage', desc: '编程式切换语言（同步受控 language 与 onLanguageChange），调用后关闭语言自动跟随', type: '(language: string) => void' },
  { name: 'format', desc: '格式化全文（等价于状态栏格式化按钮），也可直接 import formatCode 独立使用', type: '() => void' },
  { name: 'validateJson', desc: '独立 JSON 校验函数（useSyntaxCheck 内部同款），返回 { line, col, message }[]，行列 0 基', type: '(text: string) => SyntaxDiagnostic[]' },
  { name: 'search', desc: '搜索状态实例，可编程驱动检索与替换', type: 'EditorSearchApi' },
  { name: 'undo / redo', desc: '撤销 / 重做（快捷键 Ctrl+Z / Ctrl+Y·Ctrl+Shift+Z 同源）', type: '() => void' },
  { name: 'setGhost', desc: '写入 AI 幽灵补全建议（以当前光标为锚点，渲染为灰色虚影；Tab 采纳 / Esc 关闭 / 编辑或移动光标自动作废）', type: '(text: string) => void' },
  { name: 'clearGhost', desc: '手动清除当前幽灵补全建议', type: '() => void' },
  { name: 'getCaret', desc: '获取当前光标位置（0 基行列）', type: '() => EditorPos' },
  { name: 'openComment', desc: '编程式在指定行发起评论（0 基行号，等价于点击行号槽「+」）', type: '(line: number) => void' },
]

const THEME_COLUMNS: ApiColumn[] = [
  { key: 'name', title: '字段', width: 200 },
  { key: 'desc', title: '说明' },
  { key: 'type', title: '类型', width: 150 },
  { key: 'default', title: '默认值', width: 180 },
]

const THEME_FIELDS = [
  { name: 'presetColor', desc: '主题色预设，控制选区与当前行高亮配色；与显式字段同时设置时显式字段优先', type: "'green' | 'blue' | 'purple'", default: "'green'" },
  { name: 'indentSize', desc: 'Tab 键插入的缩进空格数', type: 'number', default: '2' },
  { name: 'editorBackground', desc: '编辑区背景色', type: 'string', default: "'#1e1e1e'" },
  { name: 'textColor', desc: '正文文字颜色', type: 'string', default: "'#d4d4d4'" },
  { name: 'fontSize', desc: '正文字号（px），行高默认 = fontSize + 8', type: 'number', default: '14' },
  { name: 'lineHeight', desc: '行高（px），不传按 fontSize + 8 推导', type: 'number | undefined', default: 'undefined' },
  { name: 'caretColor', desc: '自绘光标颜色', type: 'string', default: "'#aeafad'" },
  { name: 'caretDefaultPos', desc: '光标默认位置（初始与 setText 时生效）', type: "'start' | 'end'", default: "'start'" },
  { name: 'selectionBackground', desc: '鼠标选区背景色', type: 'string', default: "'#264f78'" },
  { name: 'zebraBackground', desc: '斑马纹背景色', type: 'string', default: "'rgba(255,255,255,0.025)'" },
  { name: 'activeLineBackground', desc: '当前行高亮背景色', type: 'string', default: "'rgba(79,192,141,0.09)'" },
  { name: 'searchHitBackground', desc: '搜索命中背景色', type: 'string', default: "'rgba(234,158,54,0.32)'" },
  { name: 'searchHitActiveBackground', desc: '当前聚焦命中的背景色', type: 'string', default: "'#eabe54'" },
  { name: 'gutterBackground', desc: '行号槽背景色', type: 'string', default: "'#1b1b1b'" },
  { name: 'gutterColor', desc: '行号默认颜色', type: 'string', default: "'#6e7681'" },
  { name: 'gutterActiveColor', desc: '当前行对应行号颜色', type: 'string', default: "'#e8e8e8'" },
  { name: 'highlightPreset', desc: '代码风格预设（token 配色）13 种：暗色 default(VS Code Dark+)/monokai/one-dark/dracula/github-dark/nord/tokyo-night/gruvbox-dark/solarized-dark；亮色 vs-light/github-light/solarized-light/atom-one-light（需配套亮色底，LIGHT_HIGHLIGHT_PRESETS 可判亮色系）。显式 tokenColors 优先于预设', type: 'HighlightPreset', default: "'default'" },
  { name: 'tokenColors', desc: '自定义 token 颜色：按 string/number/comment/keyword/boolean/punct/key/tag/attr 逐项覆盖预设（const 文档式配置入口）', type: 'TokenColors', default: '—' },
  { name: 'diffAddedBackground / diffAddedColor', desc: 'diff 新增行整行背景色 / 行首 + 标记强调色（GitLab 风格：整行浅色底含行号槽，无侧条）', type: 'string', default: '亮色 GitLab #e6ffee / #217e4b' },
  { name: 'diffRemovedBackground / diffRemovedColor', desc: 'diff 删除行整行背景色 / 行首 - 标记强调色', type: 'string', default: '亮色 GitLab #fbe9eb / #bb3a34' },
  { name: 'diffModifiedBackground / diffModifiedColor', desc: 'diff 修改行整行背景色 / 行首 ± 标记强调色', type: 'string', default: '亮色 GitLab #e9f3fc / #1b69b6' },
  { name: 'diffWordBackground', desc: '词级 diff：modified 行内被变更词（changedWords）的加深底色', type: 'string', default: '暗色 rgba(65,131,196,0.45)；亮色 GitLab #c7ecff' },
  { name: 'markHighlightBackground / markStrikeColor', desc: '范围标注 highlight 高亮背景色 / strike 删除线颜色', type: 'string', default: "'rgba(255,213,0,0.26)' / '#e5534b'" },
  { name: 'statusBarBackground / statusBarColor', desc: '状态栏背景色 / 文字颜色', type: 'string', default: "'#252526' / '#cccccc'" },
  { name: 'statusBarBorder', desc: '状态栏顶部边框色', type: 'string', default: "'#333'" },
  { name: 'optionBackground / optionColor', desc: '语言下拉 option 背景色 / 文字色', type: 'string', default: "'#252526' / '#cccccc'" },
]

export default defineComponent({
  name: 'ApiPage',
  setup() {
    return () => (
      <div>
        <h2 class="page-subtitle">Props</h2>
        <ApiTable columns={PROP_COLUMNS} data={PROPS} />

        <h2 class="page-subtitle">Expose（ref 实例方法）</h2>
        <ApiTable columns={METHOD_COLUMNS} data={METHODS} />

        <h2 class="page-subtitle">EditorTheme 主题配置项</h2>
        <ApiTable columns={THEME_COLUMNS} data={THEME_FIELDS} />

        <h2 class="page-subtitle">EditorSearchApi（search 成员）</h2>
        <ApiTable columns={METHOD_COLUMNS} data={[
          { name: 'keyword', desc: '当前搜索关键词（Ref，可双向驱动）', type: 'Ref<string>' },
          { name: 'matches', desc: '全部命中（行列区间列表）', type: 'Ref<SearchMatch[]>' },
          { name: 'activeIndex', desc: '当前聚焦命中下标，-1 表示无', type: 'Ref<number>' },
          { name: 'runSearch', desc: '执行检索并聚焦第一条命中', type: '() => void' },
          { name: 'nextMatch', desc: '跳到下一条命中（循环），关键词变更时自动重检', type: '() => void' },
          { name: 'clearSearch', desc: '清空关键词与全部命中高亮', type: '() => void' },
          { name: 'replacement', desc: '替换文本（Ref，可双向驱动，配合替换输入框）', type: 'Ref<string>' },
          { name: 'replaceCurrent', desc: '替换当前聚焦命中并跳到下一条，返回是否替换成功', type: '() => boolean' },
          { name: 'replaceAll', desc: '替换全部命中（从后往前批量替换避免偏移错位），返回替换数量', type: '() => number' },
        ]} />

        <h2 class="page-subtitle">Linter 插件注册表</h2>
        <ApiTable columns={METHOD_COLUMNS} data={[
          { name: 'registerLinter', desc: '注册/覆盖某语言的 linter（传 null 注销）；json 内置，js/ts 默认注册括号配对检查', type: '(language: string, linter: Linter | null) => void' },
          { name: 'getLinter', desc: '按语言取已注册的 linter', type: '(language: string) => Linter | undefined' },
          { name: 'createBracketLinter', desc: '括号配对 linter 工厂（字符串/行注释/块注释感知，不误报注释与字符串内的括号）', type: '() => Linter' },
        ]} />
      </div>
    )
  },
})
