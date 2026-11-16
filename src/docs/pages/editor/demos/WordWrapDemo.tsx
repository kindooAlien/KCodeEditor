import { defineComponent, ref } from 'vue'
import { KCodeEditor } from '@/keditor'

/** 混合短行与超长行，验证折行与行号槽高度同步 */
const SAMPLE = [
  '{',
  '  "name": "KCodeEditor",',
  '  "description": "这是一段刻意造出来的超长文本，用来验证 wordWrap 折行模式：关闭时超长行横向滚动、行号槽每行一行；开启后超长内容在可视区内换行显示，左侧行号仍对齐该行的第一个视觉行，光标在折行后的视觉位置也能正确落点与移动。",',
  '  "features": ["fold", "wrap", "search"],',
  '  "version": 1',
  '}',
].join('\n')

export default defineComponent({
  name: 'WordWrapDemo',
  setup() {
    const wordWrap = ref(false)
    const editorRef = ref<{ setText: (t: string) => void } | null>(null)

    function toggleWrap(): void {
      wordWrap.value = !wordWrap.value
    }

    return () => (
      <div>
        <div class="demo-toolbar">
          <button
            class={{ 'demo-btn': true, 'is-on': wordWrap.value }}
            onClick={toggleWrap}
          >wordWrap: {wordWrap.value ? '开启' : '关闭'}</button>
          <button class="demo-btn" onClick={() => editorRef.value?.setText(SAMPLE)}>重置内容</button>
        </div>
        <KCodeEditor
          ref={editorRef}
          initialText={SAMPLE}
          showLineNumber
          highlightActiveLine
          wordWrap={wordWrap.value}
        />
      </div>
    )
  },
})
