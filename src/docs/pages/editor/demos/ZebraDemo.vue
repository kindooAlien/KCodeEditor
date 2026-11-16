<script setup lang="ts">
import { ref } from 'vue'
import { KCodeEditor } from '@/keditor'

const SAMPLE_JSON = [
  '{',
  '  "name": "KCodeEditor",',
  '  "version": 1,',
  '  "active": true,',
  '  "tags": ["a", "b"],',
  '  "nested": { "ok": null }',
  '}',
].join('\n')

const zebraStripe = ref(true)
</script>

<template>
  <div>
    <div class="demo-toolbar">
      <button
        class="demo-btn"
        :class="{ 'is-on': zebraStripe }"
        @click="zebraStripe = !zebraStripe"
      >zebraStripe: {{ zebraStripe }}</button>
    </div>
    <KCodeEditor
      :initial-text="SAMPLE_JSON"
      show-line-number
      :zebra-stripe="zebraStripe"
    />
  </div>
</template>
