import { defineComponent, ref } from 'vue'
import { KCodeEditor } from '@/keditor'
import type { AccentPreset } from '@/keditor'

const SAMPLE = [
  '{',
  '  "name": "KCodeEditor",',
  '  "accent": "主题色预设：green / blue / purple",',
  '  "version": 1',
  '}',
].join('\n')

const PRESETS: AccentPreset[] = ['green', 'blue', 'purple']

export default defineComponent({
  name: 'AccentColorDemo',
  setup() {
    const preset = ref<AccentPreset>('green')
    const editorRef = ref<{ setText: (t: string) => void; search: { keyword: { value: string }; runSearch: () => void } } | null>(null)

    function pick(p: AccentPreset): void {
      preset.value = p
    }

    /** 造一个选区 + 命中高亮，直观对比三种预设的选区色 */
    function preview(): void {
      const editor = editorRef.value
      editor?.setText(SAMPLE)
      if (editor) {
        editor.search.keyword.value = 'KCodeEditor'
        editor.search.runSearch()
      }
    }

    return () => (
      <div>
        <div class="demo-toolbar">
          {PRESETS.map((p) => (
            <button
              key={p}
              class={{ 'demo-btn': true, 'is-on': preset.value === p }}
              onClick={() => pick(p)}
            >{p}</button>
          ))}
          <button class="demo-btn" onClick={preview}>预览选区与搜索高亮</button>
        </div>
        <KCodeEditor
          ref={editorRef}
          initialText={SAMPLE}
          showLineNumber
          highlightActiveLine
          zebraStripe
          showSearch
          theme={{ presetColor: preset.value }}
        />
      </div>
    )
  },
})
