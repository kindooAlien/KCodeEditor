import { defineComponent, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ChevronDownIcon } from './icons'

export interface DemoSelectOption {
  id: string
  label: string
}

/**
 * 文档站 demo 层自绘下拉（与组件 StatusBar 的自绘 dropdown 同思路，不用原生 select）：
 * 触发按钮 + 下弹菜单 + 键盘导航（↑↓ 循环 / Enter 选中 / Esc 关闭）+ 外部点击关闭。
 */
export default defineComponent({
  name: 'DemoSelect',
  props: {
    options: { type: Array as () => DemoSelectOption[], required: true },
    modelValue: { type: String, required: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const open = ref(false)
    /** 键盘/悬停高亮项，打开时定位到当前选中项 */
    const activeIndex = ref(-1)
    const rootRef = ref<HTMLElement | null>(null)

    const selected = computed(() => props.options.find((o) => o.id === props.modelValue))

    function onDocMousedown(e: MouseEvent): void {
      if (rootRef.value && !rootRef.value.contains(e.target as Node)) close()
    }

    onMounted(() => document.addEventListener('mousedown', onDocMousedown))
    onBeforeUnmount(() => document.removeEventListener('mousedown', onDocMousedown))

    function openMenu(): void {
      open.value = true
      activeIndex.value = Math.max(
        0,
        props.options.findIndex((o) => o.id === props.modelValue),
      )
    }

    function close(): void {
      open.value = false
      activeIndex.value = -1
    }

    function onTriggerClick(): void {
      open.value ? close() : openMenu()
    }

    function select(id: string): void {
      emit('update:modelValue', id)
      close()
    }

    function onTriggerKeydown(e: KeyboardEvent): void {
      if (!open.value) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault()
          openMenu()
        }
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        activeIndex.value = (activeIndex.value + 1) % props.options.length
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        activeIndex.value = (activeIndex.value - 1 + props.options.length) % props.options.length
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = props.options[activeIndex.value]
        if (item) select(item.id)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    }

    return () => (
      <div class="demo-select" ref={rootRef}>
        <button
          type="button"
          class={{ 'demo-select-trigger': true, 'is-open': open.value }}
          aria-haspopup="listbox"
          aria-expanded={open.value}
          onClick={onTriggerClick}
          onKeydown={onTriggerKeydown}
        >
          <span class="demo-select-label">{selected.value ? selected.value.label : props.modelValue}</span>
          <ChevronDownIcon class="demo-select-arrow" />
        </button>
        {open.value ? (
          <ul class="demo-select-menu" role="listbox">
            {props.options.map((o, i) => (
              <li
                key={o.id}
                role="option"
                aria-selected={o.id === props.modelValue}
                class={{
                  'demo-select-item': true,
                  'is-active': i === activeIndex.value,
                  'is-selected': o.id === props.modelValue,
                }}
                onMousedown={(e) => {
                  e.preventDefault()
                  select(o.id)
                }}
                onMouseenter={() => (activeIndex.value = i)}
              >{o.label}</li>
            ))}
          </ul>
        ) : null}
      </div>
    )
  },
})
