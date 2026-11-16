import { defineComponent, ref } from 'vue'
import { KCodeEditor } from '@/keditor'
import type { DiffLineMark } from '@/keditor'

const SAMPLE = [
  '{',
  '  "name": "KCodeEditor",',
  '  "version": 2,',
  '  "mode": "diff",',
  '  "features": ["fold", "wrap", "search"],',
  '  "active": true',
  '}',
].join('\n')

/** diff 标记：行号 0 基（与组件内部行号一致）；modified 行可用 changedWords 标记行内被变更词 */
const DIFF_LINES: DiffLineMark[] = [
  { line: 1, type: 'removed' },
  { line: 2, type: 'added' },
  // 行 4 的 "wrap"（列 [24, 28)）为本次变更词，行内加深底色
  { line: 4, type: 'modified', changedWords: [[24, 28]] },
]

export default defineComponent({
  name: 'DiffDemo',
  setup() {
    const showDiff = ref(true)

    return () => (
      <div>
        <div class="demo-toolbar">
          <button
            class={{ 'demo-btn': true, 'is-on': showDiff.value }}
            onClick={() => (showDiff.value = !showDiff.value)}
          >diffLines: {showDiff.value ? '显示' : '隐藏'}</button>
        </div>
        <KCodeEditor
          initialText={SAMPLE}
          showLineNumber
          highlightActiveLine
          diffLines={showDiff.value ? DIFF_LINES : undefined}
        />
      </div>
    )
  },
})
