<script setup lang="ts">
import { ref } from 'vue'
import { KCodeEditor } from '@/keditor'
import type { CodeMark, GutterMark } from '@/keditor'

const SAMPLE = [
  '{',
  '  "name": "keditor",',
  '  "retries": 3',
  '  "timeout": 5000,',
  '  "deprecatedName": "legacy"',
  '}',
].join('\n')

/** 范围标注：行列 0 基，end 不含；message 为悬停提示，支持跨行区间 */
const MARKS: CodeMark[] = [
  { start: { line: 1, col: 10 }, end: { line: 1, col: 19 }, type: 'highlight' },
  { start: { line: 3, col: 13 }, end: { line: 3, col: 17 }, type: 'strike', message: '将被移除，改用 maxTimeout' },
  { start: { line: 4, col: 20 }, end: { line: 4, col: 28 }, type: 'squiggle', message: '废弃字段：v3 起改用 adminKey' },
]

/** 行号槽标注图标：书签 / 警告 / 错误 / 信息 */
const GUTTER_MARKS: GutterMark[] = [
  { line: 1, type: 'bookmark', title: '核心配置项' },
  { line: 4, type: 'warning', title: '即将废弃的字段' },
]

const showMarks = ref(true)
</script>

<template>
  <div>
    <div class="demo-toolbar">
      <button
        class="demo-btn"
        :class="{ 'is-on': showMarks }"
        @click="showMarks = !showMarks"
      >marks: {{ showMarks ? '显示' : '隐藏' }}</button>
    </div>
    <KCodeEditor
      :initial-text="SAMPLE"
      show-line-number
      show-highlight
      highlight-active-line
      show-cursor-info
      syntax-check
      language="json"
      :marks="showMarks ? MARKS : []"
      :gutter-marks="showMarks ? GUTTER_MARKS : []"
    />
    <div class="demo-stats">
      <span class="demo-stat">行 2 缺逗号 → syntaxCheck 自动叠加红色波浪线（悬停看浮层提示）</span>
      <span class="demo-stat">squiggle 波浪线 · highlight 高亮背景 · strike 删除线</span>
      <span class="demo-stat">gutterMarks：行号槽书签 / 警告小圆点（悬停看提示）</span>
    </div>
  </div>
</template>
