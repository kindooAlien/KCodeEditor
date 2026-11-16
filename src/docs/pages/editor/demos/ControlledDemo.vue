<script setup lang="ts">
import { ref } from 'vue'
import { KCodeEditor } from '@/keditor'

const SAMPLE_JSON = [
  '{',
  '  "name": "KCodeEditor",',
  '  "version": 1,',
  '  "active": true',
  '}',
].join('\n')

interface EditorExpose {
  getText: () => string
  focus: () => void
  setText: (t: string) => void
}

const editorRef = ref<EditorExpose | null>(null)
const currentText = ref(SAMPLE_JSON)

function logContent(): void {
  // eslint-disable-next-line no-console
  console.log('[KCodeEditor] getText():\n', editorRef.value?.getText())
}
</script>

<template>
  <div>
    <div class="demo-toolbar">
      <button class="demo-btn" @click="logContent">getText() 打印</button>
      <button class="demo-btn" @click="editorRef?.focus()">focus() 聚焦</button>
      <button class="demo-btn" @click="editorRef?.setText('')">setText('') 清空</button>
      <button class="demo-btn" @click="editorRef?.setText(SAMPLE_JSON)">setText() 重置</button>
    </div>
    <KCodeEditor ref="editorRef" :initial-text="SAMPLE_JSON" @change="(t) => (currentText = t)" />
    <div class="demo-stats">
      <span class="demo-stat">onChange 长度 {{ currentText.length }}</span>
    </div>
  </div>
</template>
