import { defineComponent, ref, computed } from 'vue'
import { KCodeEditor, HIGHLIGHT_PRESETS } from '@/keditor'
import type { HighlightPreset } from '@/keditor'
import DemoSelect from '@/docs/components/DemoSelect'
import { PRESET_LABELS, baseForPreset } from './preset-theme-base'

const SAMPLE_JSON = [
  '{',
  '  "name": "KCodeEditor",',
  '  "theme": "字号 / 行高 / 配色 / 光标默认位置 全部可配",',
  '  "version": 1',
  '}',
].join('\n')

export default defineComponent({
  name: 'ThemeDemo',
  setup() {
    const fontSize = ref(16)
    const caretDefaultPos = ref<'start' | 'end'>('end')
    const preset = ref<HighlightPreset>('default')
    /** 演示 tokenColors 逐类型覆写：key 换琥珀橙（json 可见）、keyword 换青绿色（js/ts 可见） */
    const customColors = ref(false)
    const editorRef = ref<{ setText: (t: string) => void } | null>(null)

    function toggleFontSize(): void {
      fontSize.value = fontSize.value === 16 ? 18 : 16
    }

    function toggleCaretPos(): void {
      caretDefaultPos.value = caretDefaultPos.value === 'start' ? 'end' : 'start'
      // 等 theme prop 提交后再重置，让光标默认位置生效
      Promise.resolve().then(() => editorRef.value?.setText(SAMPLE_JSON))
    }

    const themeConf = computed(() => ({
      fontSize: fontSize.value,
      caretDefaultPos: caretDefaultPos.value,
      activeLineBackground: 'rgba(79, 192, 141, 0.15)',
      highlightPreset: preset.value,
      // 主题预览器：选什么主题，整个编辑器就呈现什么主题（暗色配官方暗底、亮色配官方亮底）
      ...baseForPreset(preset.value),
      // tokenColors 优先级最高：逐类型覆盖预设配色
      ...(customColors.value ? { tokenColors: { key: '#f59e0b', keyword: '#4ec9b0' } } : {}),
    }))

    return () => (
      <div>
        <div class="demo-toolbar">
          <button class="demo-btn" onClick={toggleFontSize}>fontSize: {fontSize.value}</button>
          <button
            class={{ 'demo-btn': true, 'is-on': caretDefaultPos.value === 'end' }}
            onClick={toggleCaretPos}
          >caretDefaultPos: {caretDefaultPos.value}</button>
          <DemoSelect
            options={PRESET_LABELS}
            modelValue={preset.value}
            onUpdate:modelValue={(v: string) => (preset.value = v as HighlightPreset)}
          />
          <button
            class={{ 'demo-btn': true, 'is-on': customColors.value }}
            onClick={() => (customColors.value = !customColors.value)}
          >tokenColors 覆写 key/keyword</button>
        </div>
        <KCodeEditor
          ref={editorRef}
          class="demo-theme-preview"
          initialText={SAMPLE_JSON}
          showLineNumber
          highlightActiveLine
          zebraStripe
          theme={themeConf.value}
        />
        <div class="demo-stats">
          <span class="demo-stat">内置 {Object.keys(HIGHLIGHT_PRESETS).length} 种配色</span>
          <span class="demo-stat">暗色 9 种 / 亮色 4 种（各配官方底色）</span>
          <span class="demo-stat">tokenColors 可在任意预设上逐类型覆写</span>
        </div>
      </div>
    )
  },
})
