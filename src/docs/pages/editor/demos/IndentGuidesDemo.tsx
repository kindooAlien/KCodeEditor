import { defineComponent, ref } from 'vue'
import { KCodeEditor } from '@/keditor'

/** 多层级嵌套样例：层级越深参考线越多 */
const SAMPLE_CODE = [
  'export function createService(options) {',
  '  const { baseUrl, timeout } = options',
  '',
  '  async function request(path, init = {}) {',
  '    const controller = new AbortController()',
  '    const timer = setTimeout(() => controller.abort(), timeout)',
  '    try {',
  '      const res = await fetch(baseUrl + path, {',
  '        ...init,',
  '        signal: controller.signal,',
  '        headers: { "Content-Type": "application/json" },',
  '      })',
  '      if (!res.ok) {',
  '        throw new Error(`HTTP ${res.status}`)',
  '      }',
  '      return await res.json()',
  '    } finally {',
  '      clearTimeout(timer)',
  '    }',
  '  }',
  '',
  '  return { request }',
  '}',
].join('\n')

export default defineComponent({
  name: 'IndentGuidesDemo',
  setup() {
    const enabled = ref(true)

    return () => (
      <div>
        <div class="demo-toolbar">
          <button
            class={{ 'demo-btn': true, 'is-primary': enabled.value }}
            onClick={() => (enabled.value = !enabled.value)}
          >
            {enabled.value ? 'indentGuides：开启' : 'indentGuides：关闭'}
          </button>
        </div>
        <KCodeEditor
          initialText={SAMPLE_CODE}
          language="javascript"
          showLineNumber
          showHighlight
          highlightActiveLine
          indentGuides={enabled.value}
        />
        <div class="demo-stats">
          <span class="demo-stat">包裹线与块头缩进列对齐（位置 = (层级−1)×indentSize）</span>
          <span class="demo-stat">非空行按本行缩进绘制，块中间空行贯通，闭合行不画孤线</span>
          <span class="demo-stat">颜色可覆写 token --k-guide-color</span>
        </div>
      </div>
    )
  },
})
