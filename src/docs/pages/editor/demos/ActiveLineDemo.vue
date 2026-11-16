<script setup lang="ts">
import { ref } from 'vue'
import { KCodeEditor } from '@/keditor'

const SAMPLE_JSON = [
  '{',
  '  "name": "KCodeEditor",',
  '  "hint": "点击任意一行，观察行号与内容区的联动高亮",',
  '  "version": 1',
  '}',
].join('\n')

const highlightActiveLine = ref(true)
</script>

<template>
  <div>
    <div class="demo-toolbar">
      <button
        class="demo-btn"
        :class="{ 'is-on': highlightActiveLine }"
        @click="highlightActiveLine = !highlightActiveLine"
      >highlightActiveLine: {{ highlightActiveLine }}</button>
    </div>
    <KCodeEditor
      :initial-text="SAMPLE_JSON"
      show-line-number
      :highlight-active-line="highlightActiveLine"
    />
  </div>
</template>
