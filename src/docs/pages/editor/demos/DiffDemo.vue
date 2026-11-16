<script setup lang="ts">
import { ref } from 'vue'
import { KCodeEditor } from '@/keditor'
import type { DiffLineMark } from '@/keditor'

const SAMPLE = [
  '{',
  '  "name": "KEditor",',
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

const showDiff = ref(true)
</script>

<template>
  <div>
    <div class="demo-toolbar">
      <button
        class="demo-btn"
        :class="{ 'is-on': showDiff }"
        @click="showDiff = !showDiff"
      >diffLines: {{ showDiff ? '显示' : '隐藏' }}</button>
    </div>
    <KCodeEditor
      :initial-text="SAMPLE"
      show-line-number
      highlight-active-line
      :diff-lines="showDiff ? DIFF_LINES : undefined"
    />
  </div>
</template>
