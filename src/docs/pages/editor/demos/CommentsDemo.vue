<script setup lang="ts">
import { ref } from 'vue'
import { KCodeEditor } from '@/keditor'
import type { CodeComment } from '@/keditor'

const SAMPLE = [
  '{',
  '  "name": "keditor",',
  '  "retries": 3,',
  '  "timeout": 5000,',
  '  "retryOn": ["network", "timeout"]',
  '}',
].join('\n')

/** 预置讨论线程：普通线程（含回复）+ 已解决线程 */
const INITIAL_COMMENTS: CodeComment[] = [
  {
    id: 't1',
    line: 1,
    author: '林小满',
    timestamp: '今天 10:24',
    body: 'retries 建议上限改成 5，弱网场景 3 次不够，极端情况下还会触发上层重试风暴。',
    replies: [
      { id: 't1-r1', line: 1, author: 'Aaron', timestamp: '今天 10:31', body: '同意，5 次足够覆盖，超时还是走熔断。' },
    ],
  },
  {
    id: 't2',
    line: 3,
    author: '贾川',
    timestamp: '昨天 18:02',
    body: 'timeout 5000 太长了，压测 P99 在 800ms 以内，建议改 3000。',
    resolved: true,
  },
]

const comments = ref<CodeComment[]>(INITIAL_COMMENTS)
let seq = 3

/** 发表评论 / 回复（parentId 存在时追加到对应线程的 replies） */
function onCommentSubmit(payload: { line: number; body: string; parentId?: string }) {
  const c: CodeComment = {
    id: `c${seq++}`,
    line: payload.line,
    author: '我',
    timestamp: '刚刚',
    body: payload.body,
  }
  if (payload.parentId) {
    comments.value = comments.value.map((t) =>
      t.id === payload.parentId ? { ...t, replies: [...(t.replies ?? []), c] } : t,
    )
  } else {
    comments.value = [...comments.value, c]
  }
}

/** 标记解决 / 恢复讨论 */
function onCommentResolve(payload: { id: string; resolved: boolean }) {
  comments.value = comments.value.map((t) =>
    t.id === payload.id ? { ...t, resolved: payload.resolved } : t,
  )
}
</script>

<template>
  <div>
    <KCodeEditor
      :initial-text="SAMPLE"
      show-line-number
      show-highlight
      highlight-active-line
      language="json"
      commentable
      :comments="comments"
      @comment-submit="onCommentSubmit"
      @comment-resolve="onCommentResolve"
    />
    <div class="demo-stats">
      <span class="demo-stat">行号槽悬停显示「+」→ 点击在当前行发起评论（Ctrl+Enter 发表）</span>
      <span class="demo-stat">卡片头部「回复」→ 行内输入框，回复缩进显示（GitLab note 风格）</span>
      <span class="demo-stat">「标记已解决」→ 折叠为绿色 ✓ 细条，点击可展开或恢复讨论</span>
    </div>
  </div>
</template>
