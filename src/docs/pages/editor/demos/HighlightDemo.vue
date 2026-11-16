<script setup lang="ts">
import { ref, computed } from 'vue'
import { KCodeEditor } from '@/keditor'
import type { HighlightPreset } from '@/keditor'
import DemoSelect from '@/docs/components/DemoSelect'
import { PRESET_LABELS, baseForPreset } from './preset-theme-base'

/** JS/TS 混合样本：字符串 / 注释 / 数字 / 关键字 / 布尔 / 对象 key */
const SAMPLE_CODE = `const greeting = 'Hello, KCodeEditor!'
// 这是行注释，验证注释着色
function add(a: number, b: number) {
  return a + b  /* 行内注释 */
}
const config = { theme: 'monokai', count: 42, active: true }
export default greeting
`.trim()

const showHighlight = ref(true)
const preset = ref<HighlightPreset>('default')
const custom = ref(false)

const themeConf = computed(() => ({
  highlightPreset: preset.value,
  // 主题预览器：选什么主题，整个编辑器就呈现什么主题（暗色配官方暗底、亮色配官方亮底）
  ...baseForPreset(preset.value),
  ...(custom.value
    ? {
        tokenColors: {
          string: '#f78c6c',
          keyword: '#ff2c78',
          comment: '#5c6370',
          key: '#82aaff',
        },
      }
    : {}),
}))
</script>

<template>
  <div>
    <div class="demo-toolbar">
      <button
        class="demo-btn"
        :class="{ 'is-on': showHighlight }"
        @click="showHighlight = !showHighlight"
      >showHighlight: {{ showHighlight ? '开启' : '关闭' }}</button>
      <DemoSelect v-model="preset" :options="PRESET_LABELS" />
      <button
        class="demo-btn"
        :class="{ 'is-on': custom }"
        @click="custom = !custom"
      >自定义 tokenColors: {{ custom ? '开' : '关' }}</button>
    </div>
    <KCodeEditor
      class="demo-theme-preview"
      :initial-text="SAMPLE_CODE"
      language="typescript"
      show-line-number
      highlight-active-line
      :show-highlight="showHighlight"
      :theme="themeConf"
    />
  </div>
</template>
