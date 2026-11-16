import { defineComponent, computed, ref, watch, onBeforeUnmount } from 'vue'
import { h } from 'vue'
import type { PropType } from 'vue'
import { normalizeLanguage } from '@/keditor/hooks/useHighlight'
import type { SyntaxDiagnostic } from '@/keditor/utils/jsonLint'
import type { EditorLocale } from '@/keditor/config/editor-locale'

/**
 * 状态栏（编辑器底部）：
 * - 左侧：光标位置信息 Ln x, Col y（showCursorInfo 开启时展示）
 * - 右侧：格式化按钮（showFormat 开启时展示）+ 语言下拉选择器（传入 languages 时展示）
 */
export default defineComponent({
  name: 'KStatusBar',
  props: {
    /** 光标位置文本，如 "Ln 3, Col 5"；空串不渲染 */
    cursorInfo: { type: String, default: '' },
    /** 当前语言 */
    language: { type: String, default: 'json' },
    /** 可选语言列表；为空则不渲染下拉 */
    languages: { type: Array as PropType<string[]>, default: undefined },
    onLanguageChange: {
      type: Function as PropType<(language: string) => void>,
      default: undefined,
    },
    /** 显示格式化按钮 */
    showFormat: { type: Boolean, default: false },
    onFormat: {
      type: Function as PropType<() => void>,
      default: undefined,
    },
    /** 语法诊断列表（syntaxCheck 开启时传入） */
    diagnostics: { type: Array as PropType<SyntaxDiagnostic[]>, default: () => [] },
    /** 是否开启语法校验显示 */
    syntaxCheck: { type: Boolean, default: false },
    /** 内置文案（i18n） */
    locale: { type: Object as PropType<EditorLocale>, required: true },
  },
  setup(props) {
    const options = computed(() =>
      (props.languages ?? []).map((l) => ({ value: normalizeLanguage(l), label: l })),
    )

    function onSelect(value: string): void {
      props.onLanguageChange?.(value)
      closeMenu()
    }

    // ---------- 语言下拉（自绘 menu，替代原生 select/option：样式可控、上下弹出、支持键盘） ----------
    const menuOpen = ref(false)
    const menuRootRef = ref<HTMLElement | null>(null)
    /** 键盘导航的高亮项索引（初始定位到当前语言） */
    const activeIdx = ref(0)
    /** 菜单动态 max-height：打开时按触发器上方可用空间计算，防止被 .k-editor overflow:hidden 裁剪 */
    const menuMaxH = ref<number | null>(null)

    const currentLabel = computed(
      () => options.value.find((o) => o.value === props.language)?.label ?? props.language,
    )

    function openMenu(): void {
      activeIdx.value = Math.max(0, options.value.findIndex((o) => o.value === props.language))
      // 可用空间 = 触发器顶边到编辑器根顶边的距离 − 菜单间距 6px − 安全余量 4px；保底 120px
      const root = menuRootRef.value?.closest('.k-editor')
      if (root && menuRootRef.value) {
        const avail =
          menuRootRef.value.getBoundingClientRect().top -
          root.getBoundingClientRect().top -
          6 -
          4
        menuMaxH.value = Math.max(120, Math.floor(avail))
      }
      menuOpen.value = true
    }

    function closeMenu(): void {
      menuOpen.value = false
    }

    function toggleMenu(): void {
      menuOpen.value ? closeMenu() : openMenu()
    }

    /** 菜单展开期间监听 document 按下：点击外部关闭（capture 先于编辑器 mousedown） */
    function onDocMousedown(e: MouseEvent): void {
      if (!menuRootRef.value?.contains(e.target as Node)) closeMenu()
    }

    watch(menuOpen, (v) => {
      if (v) document.addEventListener('mousedown', onDocMousedown, true)
      else document.removeEventListener('mousedown', onDocMousedown, true)
    })
    onBeforeUnmount(() => document.removeEventListener('mousedown', onDocMousedown, true))

    function onMenuKeydown(e: KeyboardEvent): void {
      if (!menuOpen.value) {
        if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault()
          e.stopPropagation()
          openMenu()
        }
        return
      }
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeMenu()
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const n = options.value.length
        if (n) activeIdx.value = (activeIdx.value + (e.key === 'ArrowDown' ? 1 : n - 1)) % n
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const opt = options.value[activeIdx.value]
        if (opt) onSelect(opt.value)
      }
    }

    /** 绿色对勾（语法正确） */
    const OkIcon = () =>
      h('svg', {
        viewBox: '0 0 14 14',
        width: '13',
        height: '13',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '1.6',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        innerHTML: '<path d="M2.5 7.5l3 3 6-6"/>',
      })

    /** 红色叉号（语法错误） */
    const ErrIcon = () =>
      h('svg', {
        viewBox: '0 0 14 14',
        width: '13',
        height: '13',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '1.6',
        'stroke-linecap': 'round',
        innerHTML: '<path d="M3.5 3.5l7 7M10.5 3.5l-7 7"/>',
      })

    /** 下拉箭头（展开时旋转） */
    const ChevronIcon = ({ open }: { open: boolean }) =>
      h('svg', {
        viewBox: '0 0 14 14',
        width: '12',
        height: '12',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '1.6',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        style: {
          transition: 'transform 0.15s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        },
        innerHTML: '<path d="M3.5 5.5L7 9l3.5-3.5"/>',
      })

    /** 语法状态 */
    const syntaxState = computed(() => {
      if (!props.syntaxCheck) return null
      if (!props.diagnostics.length) return { errors: 0, title: 'JSON 语法校验通过' }
      const first = props.diagnostics[0]
      return {
        errors: props.diagnostics.length,
        title: `Ln ${first.line + 1}, Col ${first.col + 1}：${first.message}`,
      }
    })

    const locale = props.locale

    return () => (
      <div class="k-editor__statusbar" onMousedown={(e: MouseEvent) => e.stopPropagation()}>
        <span class="k-editor__status-info">{props.cursorInfo}</span>
        {syntaxState.value && (
          <span
            class={{ 'k-editor__status-diag': true, 'is-ok': syntaxState.value.errors === 0 }}
            title={syntaxState.value.title}
          >
            <span class="k-editor__status-diag-icon">
              {syntaxState.value.errors === 0 ? <OkIcon /> : <ErrIcon />}
            </span>
            {syntaxState.value.errors === 0 ? locale.syntaxOk : locale.syntaxErrors(syntaxState.value.errors)}
          </span>
        )}
        <span class="k-editor__status-right">
          {props.showFormat && (
            <button class="k-editor__status-btn" onClick={() => props.onFormat?.()} title={locale.formatTitle}>
              {locale.format}
            </button>
          )}
          {options.value.length > 0 && (
            <div
              ref={menuRootRef}
              class={{ 'k-editor__status-dd': true, 'is-open': menuOpen.value }}
              tabindex={0}
              onKeydown={onMenuKeydown}
            >
              <button
                class={{ 'k-editor__status-btn': true, 'is-open': menuOpen.value }}
                onClick={toggleMenu}
                title={locale.chooseLanguage}
              >
                {currentLabel.value}
                <ChevronIcon open={menuOpen.value} />
              </button>
              {menuOpen.value && (
                <div
                  class="k-editor__status-dd-menu"
                  role="listbox"
                  style={menuMaxH.value !== null ? { maxHeight: `${menuMaxH.value}px` } : undefined}
                >
                  {options.value.map((o, i) => (
                    <button
                      key={o.value}
                      role="option"
                      aria-selected={o.value === props.language}
                      class={{
                        'k-editor__status-dd-item': true,
                        'is-active': o.value === props.language,
                        'is-hover': i === activeIdx.value,
                      }}
                      onMouseenter={() => (activeIdx.value = i)}
                      onClick={() => onSelect(o.value)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </span>
      </div>
    )
  },
})
