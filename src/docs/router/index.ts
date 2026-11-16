import { createRouter, createWebHashHistory } from 'vue-router'

/**
 * 文档站路由（hash 模式：纯静态部署零配置）
 * / 为门户首页（全屏落地页，不带侧栏与顶栏），其余路由套文档站布局
 */
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('@/docs/pages/HomePage'), meta: { title: 'KCodeEditor' } },
    { path: '/intro', name: 'intro', component: () => import('@/docs/pages/IntroPage'), meta: { title: '介绍', group: '' } },
    {
      path: '/editor/basic',
      name: 'editor-basic',
      component: () => import('@/docs/pages/editor/BasicDemo'),
      meta: { title: '基础用法', group: '示例' },
    },
    {
      path: '/editor/controlled',
      name: 'editor-controlled',
      component: () => import('@/docs/pages/editor/ControlledDemo'),
      meta: { title: '受控与外部方法', group: '示例' },
    },
    {
      path: '/editor/line-number',
      name: 'editor-line-number',
      component: () => import('@/docs/pages/editor/LineNumberDemo'),
      meta: { title: '行号', group: '示例' },
    },
    {
      path: '/editor/active-line',
      name: 'editor-active-line',
      component: () => import('@/docs/pages/editor/ActiveLineDemo'),
      meta: { title: '当前行高亮', group: '示例' },
    },
    {
      path: '/editor/zebra',
      name: 'editor-zebra',
      component: () => import('@/docs/pages/editor/ZebraDemo'),
      meta: { title: '斑马纹', group: '示例' },
    },
    {
      path: '/editor/editing-enhance',
      name: 'editor-editing-enhance',
      component: () => import('@/docs/pages/editor/EditingEnhanceDemo'),
      meta: { title: '编辑增强', group: '示例' },
    },
    {
      path: '/editor/search',
      name: 'editor-search',
      component: () => import('@/docs/pages/editor/SearchDemo'),
      meta: { title: '搜索与替换', group: '示例' },
    },
    {
      path: '/editor/ghost',
      name: 'editor-ghost',
      component: () => import('@/docs/pages/editor/GhostDemo'),
      meta: { title: 'AI 幽灵补全', group: '示例' },
    },
    {
      path: '/editor/minimap',
      name: 'editor-minimap',
      component: () => import('@/docs/pages/editor/MinimapDemo'),
      meta: { title: 'Minimap 缩略图', group: '示例' },
    },
    {
      path: '/editor/indent-guides',
      name: 'editor-indent-guides',
      component: () => import('@/docs/pages/editor/IndentGuidesDemo'),
      meta: { title: '缩进参考线', group: '示例' },
    },
    {
      path: '/editor/theme',
      name: 'editor-theme',
      component: () => import('@/docs/pages/editor/ThemeDemo'),
      meta: { title: '主题配置', group: '示例' },
    },
    {
      path: '/editor/word-wrap',
      name: 'editor-word-wrap',
      component: () => import('@/docs/pages/editor/WordWrapDemo'),
      meta: { title: '自动折行', group: '示例' },
    },
    {
      path: '/editor/code-fold',
      name: 'editor-code-fold',
      component: () => import('@/docs/pages/editor/CodeFoldDemo'),
      meta: { title: '代码折叠', group: '示例' },
    },
    {
      path: '/editor/accent-color',
      name: 'editor-accent-color',
      component: () => import('@/docs/pages/editor/AccentColorDemo'),
      meta: { title: '主题色预设', group: '示例' },
    },
    {
      path: '/editor/status-bar',
      name: 'editor-status-bar',
      component: () => import('@/docs/pages/editor/StatusDemo'),
      meta: { title: '状态栏', group: '示例' },
    },
    {
      path: '/editor/highlight',
      name: 'editor-highlight',
      component: () => import('@/docs/pages/editor/HighlightDemo'),
      meta: { title: '代码风格', group: '示例' },
    },
    {
      path: '/editor/slots',
      name: 'editor-slots',
      component: () => import('@/docs/pages/editor/SlotDemo'),
      meta: { title: '行号与折叠插槽', group: '示例' },
    },
    {
      path: '/editor/diff',
      name: 'editor-diff',
      component: () => import('@/docs/pages/editor/DiffDemo'),
      meta: { title: '代码 diff', group: '示例' },
    },
    {
      path: '/editor/marks',
      name: 'editor-marks',
      component: () => import('@/docs/pages/editor/MarksDemo'),
      meta: { title: '代码标注', group: '示例' },
    },
    {
      path: '/editor/comments',
      name: 'editor-comments',
      component: () => import('@/docs/pages/editor/CommentsDemo'),
      meta: { title: '代码评论', group: '示例' },
    },
    {
      path: '/editor/api',
      name: 'editor-api',
      component: () => import('@/docs/pages/editor/ApiPage'),
      meta: { title: 'CodeEditor API', group: 'API' },
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
