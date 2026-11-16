import { defineComponent, h } from 'vue'

/**
 * 编辑器内置 SVG 图标：折叠 +/−、折叠省略徽标。
 * 用 currentColor 继承文字色；foldIcon 插槽传入自定义渲染时自动替换默认图标。
 */

function createSvgIcon(name: string, innerHtml: string, attrs: Record<string, string>) {
  return defineComponent({
    name,
    setup() {
      return () => h('svg', { ...attrs, innerHTML: innerHtml })
    },
  })
}

const strokeAttrs = {
  viewBox: '0 0 12 12',
  width: '12',
  height: '12',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '1.4',
  'stroke-linecap': 'round',
}

/** 展开（+）图标 */
export const FoldPlusIcon = createSvgIcon('KFoldPlus', '<path d="M6 2.5v7M2.5 6h7"/>', strokeAttrs)

/** 折叠（−）图标 */
export const FoldMinusIcon = createSvgIcon('KFoldMinus', '<path d="M2.5 6h7"/>', strokeAttrs)

/** 折叠省略徽标（三点）图标 */
export const FoldEllipsisIcon = createSvgIcon(
  'KFoldEllipsis',
  '<circle cx="3.5" cy="6" r="1.2"/><circle cx="8" cy="6" r="1.2"/><circle cx="12.5" cy="6" r="1.2"/>',
  { viewBox: '0 0 16 12', width: '16', height: '12', fill: 'currentColor' },
)
