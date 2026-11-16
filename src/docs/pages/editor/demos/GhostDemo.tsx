import { defineComponent, ref, onBeforeUnmount } from 'vue'
import { KCodeEditor } from '@/keditor'

const SAMPLE_CODE = [
  'async function loadUser(id) {',
  '  const res = await fetch(`/api/users/${id}`)',
  '  // 在此处请求 AI 补全 → Tab 采纳 / Esc 关闭',
  '}',
].join('\n')

const FULL_SUGGESTION = '  return (await res.json()).data'

interface EditorExpose {
  setGhost: (text: string) => void
  clearGhost: () => void
  focus: () => void
}

export default defineComponent({
  name: 'GhostDemo',
  setup() {
    const editorRef = ref<EditorExpose | null>(null)
    const streaming = ref(false)
    let timer: number | null = null

    /** 模拟 SSE 流式回调：每 40ms 追加 2 个字符写入 setGhost */
    function simulateSSE(): void {
      editorRef.value?.focus()
      editorRef.value?.clearGhost()
      streaming.value = true
      let i = 0
      timer = window.setInterval(() => {
        i += 2
        editorRef.value?.setGhost(FULL_SUGGESTION.slice(0, i))
        if (i >= FULL_SUGGESTION.length) {
          if (timer !== null) window.clearInterval(timer)
          timer = null
          streaming.value = false
        }
      }, 40)
    }

    function clearSuggestion(): void {
      if (timer !== null) window.clearInterval(timer)
      timer = null
      streaming.value = false
      editorRef.value?.clearGhost()
    }

    onBeforeUnmount(() => {
      if (timer !== null) window.clearInterval(timer)
    })

    return () => (
      <div>
        <div class="demo-toolbar">
          <button class="demo-btn" disabled={streaming.value} onClick={simulateSSE}>
            {streaming.value ? '补全中…' : '模拟 AI 流式补全'}
          </button>
          <button class="demo-btn" onClick={clearSuggestion}>clearGhost() 清除</button>
        </div>
        <KCodeEditor ref={editorRef} initialText={SAMPLE_CODE} showLineNumber highlightActiveLine showCursorInfo />
        <div class="demo-stats">
          <span class="demo-stat">灰色虚影跟随光标 · Tab 采纳 · Esc 关闭</span>
          <span class="demo-stat">任意编辑或移动光标即作废建议（光标须停在锚点）</span>
        </div>
      </div>
    )
  },
})
