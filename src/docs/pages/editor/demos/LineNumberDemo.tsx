import { defineComponent, ref } from 'vue'
import { KCodeEditor } from '@/keditor'

const SAMPLE_JSON = [
  '{',
  '  "name": "KCodeEditor",',
  '  "features": ["lineNumber", "search", "theme"],',
  '  "nested": { "ok": null }',
  '}',
].join('\n')

export default defineComponent({
  name: 'LineNumberDemo',
  setup() {
    const showLineNumber = ref(true)

    return () => (
      <div>
        <div class="demo-toolbar">
          <button
            class={{ 'demo-btn': true, 'is-on': showLineNumber.value }}
            onClick={() => (showLineNumber.value = !showLineNumber.value)}
          >showLineNumber: {String(showLineNumber.value)}</button>
        </div>
        <KCodeEditor initialText={SAMPLE_JSON} showLineNumber={showLineNumber.value} />
      </div>
    )
  },
})
