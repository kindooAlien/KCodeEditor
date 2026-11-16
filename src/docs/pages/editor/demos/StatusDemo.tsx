import { defineComponent, ref } from 'vue'
import { KCodeEditor, SUPPORTED_LANGUAGES } from '@/keditor'

const SAMPLE_JSON = [
  '{',
  '  "name": "KEditor",',
  '  "hint": "底部状态栏：左侧实时显示光标位置，右侧可切换语言、一键格式化",',
  '  "messy": { "indent": "乱缩进", "extra": [ 1,2, 3 ] },',
  '  "version":   1',
  '}',
].join('\n')

export default defineComponent({
  name: 'StatusDemo',
  setup() {
    const language = ref('json')
    const showFormat = ref(true)
    const syntaxCheck = ref(true)

    return () => (
      <div>
        <div class="demo-toolbar">
          <span class="demo-stat">当前语言: {language.value}</span>
          <button
            class={{ 'demo-btn': true, 'is-on': showFormat.value }}
            onClick={() => (showFormat.value = !showFormat.value)}
          >showFormat: {showFormat.value ? '开' : '关'}</button>
          <button
            class={{ 'demo-btn': true, 'is-on': syntaxCheck.value }}
            onClick={() => (syntaxCheck.value = !syntaxCheck.value)}
          >syntaxCheck: {syntaxCheck.value ? '开' : '关'}</button>
          <span class="demo-stat">提示：删掉一个逗号或引号试试语法错误提示</span>
        </div>
        <KCodeEditor
          initialText={SAMPLE_JSON}
          showLineNumber
          highlightActiveLine
          showCursorInfo
          showFormat={showFormat.value}
          syntaxCheck={syntaxCheck.value}
          languages={[...SUPPORTED_LANGUAGES]}
          language={language.value}
          onLanguageChange={(l) => (language.value = l)}
        />
      </div>
    )
  },
})
