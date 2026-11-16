<script setup lang="ts">
import { ref } from 'vue'
import { KCodeEditor } from '@/keditor'

const SAMPLE_JSON = [
  '{',
  '  "name": "KCodeEditor",',
  '  "features": ["lineNumber", "search", "theme"],',
  '  "nested": { "ok": null }',
  '}',
].join('\n')

const showLineNumber = ref(true)
</script>

<template>
  <div>
    <div class="demo-toolbar">
      <button
        class="demo-btn"
        :class="{ 'is-on': showLineNumber }"
        @click="showLineNumber = !showLineNumber"
      >showLineNumber: {{ showLineNumber }}</button>
    </div>
    <KCodeEditor :initial-text="SAMPLE_JSON" :show-line-number="showLineNumber" />
  </div>
</template>
