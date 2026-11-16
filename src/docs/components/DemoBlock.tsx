import { defineComponent, ref } from 'vue'
import { ChevronDownIcon } from './icons'

/**
 * DemoBlock：文档站演示块
 * - 左右布局：演示区（左）+ 源码面板（右）；pad/手机（≤960px）自动切上下结构
 * - 源码面板支持 TSX / Vue Setup 两种写法切换（传 vueCode 时启用 tab）
 * - code / vueCode 传入 demo 组件的 ?raw 导入结果，保证展示源码与实际运行代码一致
 */
export default defineComponent({
  name: 'DemoBlock',
  props: {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    /** TSX 写法源码（通常来自 `./XxxDemo.tsx?raw`） */
    code: { type: String, default: '' },
    /** Vue3 template setup 写法源码（来自 `./XxxDemo.vue?raw`），传入后显示写法切换 tab */
    vueCode: { type: String, default: '' },
    /** 默认是否展开源码 */
    defaultExpanded: { type: Boolean, default: true },
  },
  setup(props, { slots }) {
    const expanded = ref(props.defaultExpanded)
    const lang = ref<'tsx' | 'vue'>('tsx')

    function toggle(): void {
      expanded.value = !expanded.value
    }

    return () => {
      const hasVue = props.vueCode.length > 0
      const activeCode = lang.value === 'vue' && hasVue ? props.vueCode : props.code

      return (
        <section class="demo-block">
          <div class="demo-block__header">
            <h3 class="demo-block__title">{props.title}</h3>
            {props.description && <p class="demo-block__desc">{props.description}</p>}
          </div>

          <div class={{ 'demo-block__body': true, 'is-expanded': expanded.value }}>
            <div class="demo-block__preview">{slots.default?.()}</div>

            {expanded.value && (
              <div class="demo-block__code-panel">
                {hasVue && (
                  <div class="demo-block__tabs">
                    <button
                      class={{ 'demo-block__tab': true, 'is-active': lang.value === 'tsx' }}
                      onClick={() => (lang.value = 'tsx')}
                    >TSX</button>
                    <button
                      class={{ 'demo-block__tab': true, 'is-active': lang.value === 'vue' }}
                      onClick={() => (lang.value = 'vue')}
                    >Vue Setup</button>
                  </div>
                )}
                <pre class="demo-block__code">{activeCode}</pre>
              </div>
            )}
          </div>

          <div class="demo-block__footer">
            <button class="demo-block__toggle" onClick={toggle}>
              {expanded.value ? '收起代码' : '展开代码'}
              <span class={{ 'demo-block__arrow': true, 'is-open': expanded.value }}>
                <ChevronDownIcon />
              </span>
            </button>
          </div>
        </section>
      )
    }
  },
})
