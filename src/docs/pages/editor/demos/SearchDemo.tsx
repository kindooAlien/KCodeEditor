import { defineComponent } from 'vue'
import { KCodeEditor } from '@/keditor'

const SAMPLE_JSON = [
  '{',
  '  "name": "KEditor",',
  '  "slogan": "每个字符都是一个 <span>",',
  '  "search": "回车检索, 再按回车跳下一条, Esc 清除",',
  '  "version": 1,',
  '  "nested": { "ok": null }',
  '}',
].join('\n')

export default defineComponent({
  name: 'SearchDemo',
  setup() {
    return () => (
      <div>
        <KCodeEditor initialText={SAMPLE_JSON} showLineNumber highlightActiveLine showSearch />
      </div>
    )
  },
})
