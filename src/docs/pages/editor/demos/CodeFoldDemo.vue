<script setup lang="ts">
import { ref } from 'vue'
import { KCodeEditor } from '@/keditor'

/** 多层嵌套 JSON，括号各自独占一行，便于观察折叠区间 */
const SAMPLE = [
  '{',
  '  "project": "KEditor",',
  '  "plugins": {',
  '    "search": {',
  '      "enabled": true,',
  '      "highlight": true',
  '    },',
  '    "fold": {',
  '      "icons": ["+", "-"],',
  '      "levels": 3',
  '    }',
  '  },',
  '  "array": [',
  '    { "id": 1, "name": "alpha" },',
  '    { "id": 2, "name": "beta" }',
  '  ]',
  '}',
].join('\n')

const codeFold = ref(true)
const editorRef = ref<{ setText: (t: string) => void } | null>(null)

function toggleFold(): void {
  codeFold.value = !codeFold.value
}
</script>

<template>
  <div>
    <div class="demo-toolbar">
      <button
        class="demo-btn"
        :class="{ 'is-on': codeFold }"
        @click="toggleFold"
      >codeFold: {{ codeFold ? '开启' : '关闭' }}</button>
      <button class="demo-btn" @click="editorRef?.setText(SAMPLE)">重置内容</button>
    </div>
    <KCodeEditor
      ref="editorRef"
      :initial-text="SAMPLE"
      show-line-number
      highlight-active-line
      :code-fold="codeFold"
    />
  </div>
</template>
