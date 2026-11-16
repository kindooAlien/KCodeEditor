<script setup lang="ts">
import { KCodeEditor } from '@/keditor'

const SAMPLE_JSON = [
  '{',
  '  "name": "KEditor",',
  '  "slogan": "每个字符都是一个 <span>",',
  '  "search": "回车检索, 再按回车跳下一条, Esc 清除",',
  '  "version": 1,',
  '  "nested": { "ok": null }',
  '}',
].join('\n')
</script>

<template>
  <div>
    <KCodeEditor :initial-text="SAMPLE_JSON" show-line-number highlight-active-line show-search />
  </div>
</template>
