import { defineComponent, h } from 'vue'

/**
 * 文档站内置 SVG 图标（currentColor 继承文字色，替代 emoji）：
 * 主题切换太阳/月亮、代码展开箭头、插槽示例星标。
 */

function createIcon(name: string, innerHtml: string, attrs: Record<string, string>) {
  return defineComponent({
    name,
    inheritAttrs: false,
    setup(_, ctx) {
      // 内置几何 attrs 为基准，外部传入的 class 等透传到 svg（箭头旋转动画需要 class）
      return () => h('svg', { ...attrs, ...ctx.attrs, innerHTML: innerHtml })
    },
  })
}

/** 太阳（亮色模式指示） */
export const SunIcon = createIcon(
  'SunIcon',
  '<circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.3"/><g stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M8 1.2v1.6M8 13.2v1.6M1.2 8h1.6M13.2 8h1.6M3.2 3.2l1.1 1.1M11.7 11.7l1.1 1.1M12.8 3.2l-1.1 1.1M4.3 11.7l-1.1 1.1"/></g>',
  { viewBox: '0 0 16 16', width: '15', height: '15', fill: 'none' },
)

/** 月亮（暗色模式指示） */
export const MoonIcon = createIcon(
  'MoonIcon',
  '<path d="M13.5 9.7A6 6 0 016.3 2.5a6 6 0 107.2 7.2z" fill="currentColor"/>',
  { viewBox: '0 0 16 16', width: '15', height: '15', fill: 'none' },
)

/** 向下箭头（展开/收起代码） */
export const ChevronDownIcon = createIcon(
  'ChevronDownIcon',
  '<path d="M3.5 6l4.5 4.5L12.5 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  { viewBox: '0 0 16 16', width: '12', height: '12', fill: 'none' },
)

/** 向右箭头（折叠态展开指示，与 ChevronDownIcon 成对） */
export const ChevronRightIcon = createIcon(
  'ChevronRightIcon',
  '<path d="M6 3.5L10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  { viewBox: '0 0 16 16', width: '12', height: '12', fill: 'none' },
)

/** 五角星（gutterSlot 插槽示例） */
export const StarIcon = createIcon(
  'StarIcon',
  '<path d="M8 1.5l1.9 4 4.4.5-3.2 3 .9 4.3L8 11.2l-4 2.1.9-4.3-3.2-3 4.4-.5z" fill="currentColor"/>',
  { viewBox: '0 0 16 16', width: '12', height: '12', fill: 'none' },
)
