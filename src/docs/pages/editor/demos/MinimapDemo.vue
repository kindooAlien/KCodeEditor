<script setup lang="ts">
import { KCodeEditor } from '@/keditor'

/** 程序化生成 200 行 JS 风格文本，触发虚拟渲染 + Minimap 展示 */
function generateLongCode(): string {
  const lines: string[] = ['// 200 行示例：滚动编辑区，Minimap 显示全文色带与视口框', '']
  for (let i = 0; i < 198; i++) {
    const mod = i % 6
    if (mod === 0) lines.push(`function handler_${i}(event) {`)
    else if (mod === 1) lines.push(`  const payload = event.data ?? {}`)
    else if (mod === 2) lines.push(`  if (!payload.id) return null`)
    else if (mod === 3) lines.push(`  return { id: payload.id, index: ${i}, ok: true }`)
    else if (mod === 4) lines.push(`}`)
    else lines.push('')
  }
  return lines.join('\n')
}

const LONG_CODE = generateLongCode()
</script>

<template>
  <div>
    <KCodeEditor :initial-text="LONG_CODE" show-line-number highlight-active-line show-minimap />
    <div class="demo-stats">
      <span class="demo-stat">右侧色带 = 全文缩略 · 边框 = 当前视口</span>
      <span class="demo-stat">点击 / 拖拽 Minimap 跳转（视口中心对齐）</span>
      <span class="demo-stat">超过 120 行自动启用虚拟渲染，仅窗口内行进 DOM</span>
    </div>
  </div>
</template>
