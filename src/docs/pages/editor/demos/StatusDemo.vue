<script setup lang="ts">
import { ref } from 'vue'
import { KCodeEditor, SUPPORTED_LANGUAGES } from '@/keditor'

const SAMPLE_JSON = [
  '{',
  '  "name": "KEditor",',
  '  "hint": "底部状态栏：左侧实时显示光标位置，右侧可切换语言、一键格式化",',
  '  "messy": { "indent": "乱缩进", "extra": [ 1,2, 3 ] },',
  '  "version":   1',
  '}',
].join('\n')

const language = ref('json')
const showFormat = ref(true)
const syntaxCheck = ref(true)
</script>

<template>
  <div>
    <div class="demo-toolbar">
      <span class="demo-stat">当前语言: {{ language }}</span>
      <button
        class="demo-btn"
        :class="{ 'is-on': showFormat }"
        @click="showFormat = !showFormat"
      >showFormat: {{ showFormat ? '开' : '关' }}</button>
      <button
        class="demo-btn"
        :class="{ 'is-on': syntaxCheck }"
        @click="syntaxCheck = !syntaxCheck"
      >syntaxCheck: {{ syntaxCheck ? '开' : '关' }}</button>
      <span class="demo-stat">提示：删掉一个逗号或引号试试语法错误提示</span>
    </div>
    <KCodeEditor
      :initial-text="SAMPLE_JSON"
      show-line-number
      highlight-active-line
      show-cursor-info
      :show-format="showFormat"
      :syntax-check="syntaxCheck"
      :languages="[...SUPPORTED_LANGUAGES]"
      :language="language"
      @language-change="(l) => (language = l)"
    />
  </div>
</template>
