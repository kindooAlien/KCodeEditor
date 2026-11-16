import { defineComponent, ref } from 'vue'
import { KCodeEditor } from '@/keditor'

const SAMPLE_JSON = [
  '{',
  '  "name": "KEditor",',
  '  "version": 1,',
  '  "active": true,',
  '  "tags": ["a", "b"],',
  '  "nested": { "ok": null }',
  '}',
].join('\n')

export default defineComponent({
  name: 'ZebraDemo',
  setup() {
    const zebraStripe = ref(true)

    return () => (
      <div>
        <div class="demo-toolbar">
          <button
            class={{ 'demo-btn': true, 'is-on': zebraStripe.value }}
            onClick={() => (zebraStripe.value = !zebraStripe.value)}
          >zebraStripe: {String(zebraStripe.value)}</button>
        </div>
        <KCodeEditor initialText={SAMPLE_JSON} showLineNumber zebraStripe={zebraStripe.value} />
      </div>
    )
  },
})
