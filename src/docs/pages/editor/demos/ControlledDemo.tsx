import { defineComponent, ref } from 'vue'
import { KCodeEditor } from '@/keditor'

const SAMPLE_JSON = [
  '{',
  '  "name": "KCodeEditor",',
  '  "version": 1,',
  '  "active": true',
  '}',
].join('\n')

export default defineComponent({
  name: 'ControlledDemo',
  setup() {
    const editorRef = ref<{ getText: () => string; focus: () => void; setText: (t: string) => void } | null>(null)
    const currentText = ref(SAMPLE_JSON)

    function logContent(): void {
      // eslint-disable-next-line no-console
      console.log('[KCodeEditor] getText():\n', editorRef.value?.getText())
    }

    return () => (
      <div>
        <div class="demo-toolbar">
          <button class="demo-btn" onClick={logContent}>getText() 打印</button>
          <button class="demo-btn" onClick={() => editorRef.value?.focus()}>focus() 聚焦</button>
          <button class="demo-btn" onClick={() => editorRef.value?.setText('')}>setText('') 清空</button>
          <button class="demo-btn" onClick={() => editorRef.value?.setText(SAMPLE_JSON)}>setText() 重置</button>
        </div>
        <KCodeEditor
          ref={editorRef}
          initialText={SAMPLE_JSON}
          onChange={(text) => (currentText.value = text)}
        />
        <div class="demo-stats">
          <span class="demo-stat">onChange 长度 {currentText.value.length}</span>
        </div>
      </div>
    )
  },
})
