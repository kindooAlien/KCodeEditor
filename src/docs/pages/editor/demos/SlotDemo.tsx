import { defineComponent, ref } from 'vue'
import { KCodeEditor } from '@/keditor'
import { StarIcon, ChevronRightIcon, ChevronDownIcon } from '@/docs/components/icons'
import type { VNodeChild } from 'vue'

const SAMPLE = [
  '{',
  '  "name": "KEditor",',
  '  "plugins": {',
  '    "search": { "enabled": true },',
  '    "fold": { "trigger": "line-start" }',
  '  }',
  '}',
].join('\n')

export default defineComponent({
  name: 'SlotDemo',
  setup() {
    const trigger = ref<'gutter' | 'line-start'>('gutter')
    const customIcon = ref(false)

    /** 自定义折叠图标：任意 VNode（图标字体 / emoji / SVG 都可以），这里用 SVG 箭头 */
    const foldIcon = (state: { folded: boolean }): VNodeChild =>
      state.folded ? <ChevronRightIcon /> : <ChevronDownIcon />

    /** 行号槽插槽：在行号后追加自定义内容（示例：name 行加星标） */
    const gutterSlot = (line: number): VNodeChild =>
      line === 1 ? <span class="demo-gutter-star"><StarIcon /></span> : null

    return () => (
      <div>
        <div class="demo-toolbar">
          <button
            class={{ 'demo-btn': true, 'is-on': trigger.value === 'gutter' }}
            onClick={() => (trigger.value = 'gutter')}
          >foldTrigger: gutter（行号前）</button>
          <button
            class={{ 'demo-btn': true, 'is-on': trigger.value === 'line-start' }}
            onClick={() => (trigger.value = 'line-start')}
          >foldTrigger: line-start（行首最左）</button>
          <button
            class={{ 'demo-btn': true, 'is-on': customIcon.value }}
            onClick={() => (customIcon.value = !customIcon.value)}
          >foldIcon 自定义: {customIcon.value ? '开' : '关'}</button>
        </div>
        <KCodeEditor
          initialText={SAMPLE}
          showLineNumber
          highlightActiveLine
          codeFold
          foldTrigger={trigger.value}
          foldIcon={customIcon.value ? foldIcon : undefined}
          gutterSlot={gutterSlot}
        />
      </div>
    )
  },
})
