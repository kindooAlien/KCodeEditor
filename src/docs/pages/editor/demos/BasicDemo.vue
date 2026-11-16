<script setup lang="ts">
import { ref, computed } from 'vue'
import { KCodeEditor } from '@/keditor'

/** 示例数据：包含转义字符与 HTML 片段，验证原样输出 */
const SAMPLE_JSON = [
  '{',
  '  "name": "KEditor",',
  '  "slogan": "每个字符都是一个 <span>",',
  '  "escape": "行内引号: \\" 与制表符: A\\tB 与换行标记: \\n",',
  '  "version": 1,',
  '  "active": true,',
  '  "nested": { "ok": null }',
  '}',
].join('\n')

const currentText = ref(SAMPLE_JSON)
const stats = computed(() => {
  const lines = currentText.value.split('\n')
  return { chars: currentText.value.length, lines: lines.length }
})
</script>

<template>
  <div>
    <KCodeEditor :initial-text="SAMPLE_JSON" @change="(t) => (currentText = t)" />
    <div class="demo-stats">
      <span class="demo-stat">行数 {{ stats.lines }}</span>
      <span class="demo-stat">字符 {{ stats.chars }}</span>
    </div>
  </div>
</template>
