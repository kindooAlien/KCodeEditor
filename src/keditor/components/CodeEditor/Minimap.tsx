import { defineComponent, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import type { PropType } from 'vue'

/**
 * Minimap 缩略图（canvas 渲染，VS Code 风格）：
 * - 每行渲染为一条与内容长度成比例的半透明色带（忽略行尾空白），一眼看出代码密度与结构
 * - 半透明白框标出当前视口；点击/拖拽跳转到对应位置
 * - 仅在非折行模式提供（折行高度不可预估，自动隐藏）
 */
export default defineComponent({
  name: 'KMinimap',
  props: {
    /** 全部行文本 */
    lines: { type: Array as PropType<string[]>, required: true },
    /** 内容区当前滚动位置 */
    scrollTop: { type: Number, default: 0 },
    /** 可视区高度 */
    viewportH: { type: Number, default: 0 },
    /** 内容总高度（含上下内边距） */
    contentH: { type: Number, default: 0 },
    /** 色带颜色（取主题正文色） */
    color: { type: String, default: '#d4d4d4' },
    /** 色带填充色（半透明浅绿为默认；自带 alpha，与视口框 color 分离） */
    bandColor: { type: String, default: 'rgba(79, 192, 141, 0.45)' },
    /** 点击跳转：参数为点击处的行号（0 基，按比例换算） */
    onJumpTo: {
      type: Function as PropType<(line: number) => void>,
      default: undefined,
    },
    /** 滚轮滚动：参数为 wheel deltaY，由父组件驱动内容区滚动（缩略图区滚轮同样生效） */
    onWheelDelta: {
      type: Function as PropType<(deltaY: number) => void>,
      default: undefined,
    },
  },
  setup(props) {
    const baseRef = ref<HTMLCanvasElement | null>(null)
    const overlayRef = ref<HTMLCanvasElement | null>(null)
    const WIDTH = 64
    const GAP = 8 // 色带与视口框距左右边缘的留白
    const CHAR_W = 1 // 每字符在缩略图中的像素宽

    /** 分层渲染：底图（色带）只在行集/颜色/尺寸变化时重绘；视口框随滚动帧只描一个矩形 */
    function rowHOf(h: number): number {
      return Math.min(3, Math.max(1, h / Math.max(props.lines.length, 1)))
    }

    function drawBase(): void {
      const canvas = baseRef.value
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const h = canvas.clientHeight
      const dpr = window.devicePixelRatio || 1
      if (canvas.width !== WIDTH * dpr || canvas.height !== h * dpr) {
        canvas.width = WIDTH * dpr
        canvas.height = h * dpr
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, WIDTH, h)
      if (props.lines.length === 0) return

      // 行高随文档规模压缩（1–3px/行），保证整篇文档都在缩略图内
      const rowH = rowHOf(h)
      // 色带填充色自带 alpha（默认半透明浅绿），globalAlpha 保持 1 不二次衰减
      ctx.fillStyle = props.bandColor
      ctx.globalAlpha = 1
      for (let i = 0; i < props.lines.length; i++) {
        const y = i * rowH
        if (y > h) break
        const len = props.lines[i].trimEnd().length
        if (len === 0) continue
        const w = Math.min(len * CHAR_W, WIDTH - GAP * 2)
        ctx.fillRect(GAP, y + 0.5, w, Math.max(1, rowH - 1))
      }
      ctx.globalAlpha = 1
    }

    function drawOverlay(): void {
      const canvas = overlayRef.value
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const h = canvas.clientHeight
      const dpr = window.devicePixelRatio || 1
      if (canvas.width !== WIDTH * dpr || canvas.height !== h * dpr) {
        canvas.width = WIDTH * dpr
        canvas.height = h * dpr
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, WIDTH, h)
      if (props.contentH <= 0 || props.viewportH <= 0) return
      const rowH = rowHOf(h)
      const scale = (props.lines.length * rowH) / props.contentH
      const vy = props.scrollTop * scale
      const vh = Math.max(props.viewportH * scale, 8)
      ctx.strokeStyle = props.color
      ctx.globalAlpha = 0.5
      ctx.strokeRect(0.5, vy + 0.5, WIDTH - 1, Math.min(vh, h - vy - 1))
      ctx.globalAlpha = 1
    }

    /** 点击/拖拽 → 换算行号并跳转（minimap 覆盖整篇文档：点击 y 已是文档绝对坐标，视口中心对齐点击处） */
    function jumpFromEvent(e: MouseEvent): void {
      const canvas = baseRef.value
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const y = e.clientY - rect.top
      const h = canvas.clientHeight
      const rowH = Math.min(3, Math.max(1, h / props.lines.length))
      const contentRatio = (props.lines.length * rowH) / Math.max(props.contentH, 1)
      // 点击点 → 文档坐标（px）→ 视口中心对齐；除以文档行高（contentH/lines）得行号，
      // 此前误除 minimap 压缩行高（rowH）导致行号放大 ~10 倍、点击全部被钳制到文档尾
      const docY = y / Math.max(contentRatio, 0.0001)
      const docRowH = Math.max(props.contentH / Math.max(props.lines.length, 1), 1)
      const line = Math.round((docY - props.viewportH / 2) / docRowH)
      props.onJumpTo?.(Math.max(0, Math.min(line, props.lines.length - 1)))
    }

    function onMouseDown(e: MouseEvent): void {
      e.stopPropagation()
      jumpFromEvent(e)
      const move = (ev: MouseEvent) => jumpFromEvent(ev)
      const up = () => {
        window.removeEventListener('mousemove', move)
        window.removeEventListener('mouseup', up)
      }
      window.addEventListener('mousemove', move)
      window.addEventListener('mouseup', up)
    }

    /** 缩略图区滚轮：滚动内容区而非自身（无自身滚动条） */
    function onWheel(e: WheelEvent): void {
      e.preventDefault()
      e.stopPropagation()
      props.onWheelDelta?.(e.deltaY)
    }

    watch(
      () => [props.lines, props.color, props.bandColor],
      () => drawBase(),
      { deep: false },
    )
    watch(
      () => [props.scrollTop, props.viewportH, props.contentH],
      () => drawOverlay(),
      { deep: false },
    )

    let resizeObs: ResizeObserver | null = null
    onMounted(() => {
      drawBase()
      drawOverlay()
      resizeObs = new ResizeObserver(() => {
        drawBase()
        drawOverlay()
      })
      if (baseRef.value) resizeObs.observe(baseRef.value)
    })
    onBeforeUnmount(() => resizeObs?.disconnect())

    return () => (
      <div class="k-editor__minimap" onMousedown={onMouseDown} onWheel={onWheel}>
        <canvas ref={baseRef} class="k-editor__minimap-canvas" width={WIDTH} />
        <canvas ref={overlayRef} class="k-editor__minimap-canvas" width={WIDTH} />
      </div>
    )
  },
})
