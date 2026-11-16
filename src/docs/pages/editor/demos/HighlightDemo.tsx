import { defineComponent, ref, computed } from 'vue'
import { KCodeEditor } from '@/keditor'
import type { HighlightPreset } from '@/keditor'
import DemoSelect from '@/docs/components/DemoSelect'
import { PRESET_LABELS, baseForPreset } from './preset-theme-base'

/** JS/TS 混合样本：字符串 / 注释 / 数字 / 关键字 / 布尔 / 对象 key */
const SAMPLE_CODE = `const greeting = 'Hello, KEditor!'
// 这是行注释，验证注释着色
function add(a: number, b: number) {
  return a + b  /* 行内注释 */
}
const config = { theme: 'monokai', count: 42, active: true }
export default greeting
`.trim()

export default defineComponent({
  name: 'HighlightDemo',
  setup() {
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

    return () => (
      <div>
        <div class="demo-toolbar">
          <button
            class={{ 'demo-btn': true, 'is-on': showHighlight.value }}
            onClick={() => (showHighlight.value = !showHighlight.value)}
          >showHighlight: {showHighlight.value ? '开启' : '关闭'}</button>
          <DemoSelect
            options={PRESET_LABELS}
            modelValue={preset.value}
            onUpdate:modelValue={(v: string) => (preset.value = v as HighlightPreset)}
          />
          <button
            class={{ 'demo-btn': true, 'is-on': custom.value }}
            onClick={() => (custom.value = !custom.value)}
          >自定义 tokenColors: {custom.value ? '开' : '关'}</button>
        </div>
        <KCodeEditor
          class="demo-theme-preview"
          initialText={SAMPLE_CODE}
          language="typescript"
          showLineNumber
          highlightActiveLine
          showHighlight={showHighlight.value}
          theme={themeConf.value}
        />
      </div>
    )
  },
})
