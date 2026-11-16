import { defineComponent, ref } from 'vue'
import { KCodeEditor } from '@/keditor'

const SAMPLE_CODE = [
  'const roles = {',
  '  admin: "管理员",',
  '  editor: "编辑",',
  '  viewer: "访客"',
  '}',
  '',
  'function canEdit(user) {',
  '  return user.role === "admin" || user.role === "editor"',
  '}',
].join('\n')

interface EditorExpose {
  undo: () => void
  redo: () => void
  focus: () => void
}

export default defineComponent({
  name: 'EditingEnhanceDemo',
  setup() {
    const editorRef = ref<EditorExpose | null>(null)

    return () => (
      <div>
        <div class="demo-toolbar">
          <button class="demo-btn" onClick={() => editorRef.value?.focus()}>focus() 聚焦</button>
          <button class="demo-btn" onClick={() => editorRef.value?.undo()}>undo() 撤销</button>
          <button class="demo-btn" onClick={() => editorRef.value?.redo()}>redo() 重做</button>
        </div>
        <KCodeEditor
          ref={editorRef}
          initialText={SAMPLE_CODE}
          showLineNumber
          highlightActiveLine
          showCursorInfo
        />
        <div class="demo-stats">
          <span class="demo-stat">Ctrl+Z / Ctrl+Y 撤销重做（连续输入合并为一步）</span>
          <span class="demo-stat">双击选词 · 三击选行 · Ctrl+←/→ 按词移动</span>
          <span class="demo-stat">Ctrl+Backspace/Delete 按词删除</span>
          <span class="demo-stat">Tab / Shift+Tab 选区块缩进</span>
          <span class="demo-stat">输入 {"{ [ ( \" '"} 自动闭合 · 选中后输入包裹</span>
        </div>
      </div>
    )
  },
})
