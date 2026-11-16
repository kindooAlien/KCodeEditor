<script setup lang="ts">
import { ref } from 'vue'
import { KCodeEditor } from '@/keditor'
import type { AccentPreset } from '@/keditor'

const SAMPLE = [
  '{',
  '  "name": "KEditor",',
  '  "accent": "主题色预设：green / blue / purple",',
  '  "version": 1',
  '}',
].join('\n')

const PRESETS: AccentPreset[] = ['green', 'blue', 'purple']
const preset = ref<AccentPreset>('green')
const editorRef = ref<{
  setText: (t: string) => void
  search: { keyword: { value: string }; runSearch: () => void }
} | null>(null)

/** 造一个选区 + 命中高亮，直观对比三种预设的选区色 */
function preview(): void {
  const editor = editorRef.value
  editor?.setText(SAMPLE)
  if (editor) {
    editor.search.keyword.value = 'KEditor'
    editor.search.runSearch()
  }
}
</script>

<template>
  <div>
    <div class="demo-toolbar">
      <button
        v-for="p in PRESETS"
        :key="p"
        class="demo-btn"
        :class="{ 'is-on': preset === p }"
        @click="preset = p"
      >{{ p }}</button>
      <button class="demo-btn" @click="preview">预览选区与搜索高亮</button>
    </div>
    <KCodeEditor
      ref="editorRef"
      :initial-text="SAMPLE"
      show-line-number
      highlight-active-line
      zebra-stripe
      show-search
      :theme="{ presetColor: preset }"
    />
  </div>
</template>
