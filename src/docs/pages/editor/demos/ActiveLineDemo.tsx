import { defineComponent, ref } from 'vue'
import { KCodeEditor } from '@/keditor'

const SAMPLE_JSON = [
  '{',
  '  "name": "KCodeEditor",',
  '  "hint": "点击任意一行，观察行号与内容区的联动高亮",',
  '  "version": 1',
  '}',
].join('\n')

export default defineComponent({
  name: 'ActiveLineDemo',
  setup() {
    const highlightActiveLine = ref(true)

    return () => (
      <div>
        <div class="demo-toolbar">
          <button
            class={{ 'demo-btn': true, 'is-on': highlightActiveLine.value }}
            onClick={() => (highlightActiveLine.value = !highlightActiveLine.value)}
          >highlightActiveLine: {String(highlightActiveLine.value)}</button>
        </div>
        <KCodeEditor
          initialText={SAMPLE_JSON}
          showLineNumber
          highlightActiveLine={highlightActiveLine.value}
        />
      </div>
    )
  },
})
