<script setup lang="ts">
import { ref, h } from 'vue'
import type { VNodeChild } from 'vue'
import { KCodeEditor } from '@/keditor'
import { StarIcon, ChevronRightIcon, ChevronDownIcon } from '@/docs/components/icons'

const SAMPLE = [
  '{',
  '  "name": "KEditor",',
  '  "plugins": {',
  '    "search": { "enabled": true },',
  '    "fold": { "trigger": "line-start" }',
  '  }',
  '}',
].join('\n')

const trigger = ref<'gutter' | 'line-start'>('gutter')
const customIcon = ref(false)

/** 自定义折叠图标：任意 VNode（图标字体 / emoji / SVG 都可以），这里用 SVG 箭头 */
function foldIcon(state: { folded: boolean }): VNodeChild {
  return state.folded ? h(ChevronRightIcon) : h(ChevronDownIcon)
}

/** 行号槽插槽：在行号后追加自定义内容（示例：name 行加星标，SVG 图标） */
function gutterSlot(line: number): VNodeChild | null {
  return line === 1 ? h('span', { class: 'demo-gutter-star' }, [h(StarIcon)]) : null
}
</script>

<template>
  <div>
    <div class="demo-toolbar">
      <button
        class="demo-btn"
        :class="{ 'is-on': trigger === 'gutter' }"
        @click="trigger = 'gutter'"
      >foldTrigger: gutter（行号前）</button>
      <button
        class="demo-btn"
        :class="{ 'is-on': trigger === 'line-start' }"
        @click="trigger = 'line-start'"
      >foldTrigger: line-start（行首最左）</button>
      <button
        class="demo-btn"
        :class="{ 'is-on': customIcon }"
        @click="customIcon = !customIcon"
      >foldIcon 自定义: {{ customIcon ? '开' : '关' }}</button>
    </div>
    <KCodeEditor
      :initial-text="SAMPLE"
      show-line-number
      highlight-active-line
      code-fold
      :fold-trigger="trigger"
      :fold-icon="customIcon ? foldIcon : undefined"
      :gutter-slot="gutterSlot"
    />
  </div>
</template>
