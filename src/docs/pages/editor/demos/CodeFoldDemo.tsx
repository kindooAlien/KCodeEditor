import { defineComponent, ref } from 'vue'
import { KCodeEditor } from '@/keditor'

/** 多层嵌套 JSON，括号各自独占一行，便于观察折叠区间 */
const SAMPLE = [
  '{',
  '  "project": "KEditor",',
  '  "plugins": {',
  '    "search": {',
  '      "enabled": true,',
  '      "highlight": true',
  '    },',
  '    "fold": {',
  '      "icons": ["+", "-"],',
  '      "levels": 3',
  '    }',
  '  },',
  '  "array": [',
  '    { "id": 1, "name": "alpha" },',
  '    { "id": 2, "name": "beta" }',
  '  ]',
  '}',
].join('\n')

export default defineComponent({
  name: 'CodeFoldDemo',
  setup() {
    const codeFold = ref(true)
    const editorRef = ref<{ setText: (t: string) => void } | null>(null)

    function toggleFold(): void {
      codeFold.value = !codeFold.value
    }

    return () => (
      <div>
        <div class="demo-toolbar">
          <button
            class={{ 'demo-btn': true, 'is-on': codeFold.value }}
            onClick={toggleFold}
          >codeFold: {codeFold.value ? '开启' : '关闭'}</button>
          <button class="demo-btn" onClick={() => editorRef.value?.setText(SAMPLE)}>重置内容</button>
        </div>
        <KCodeEditor
          ref={editorRef}
          initialText={SAMPLE}
          showLineNumber
          highlightActiveLine
          codeFold={codeFold.value}
        />
      </div>
    )
  },
})
