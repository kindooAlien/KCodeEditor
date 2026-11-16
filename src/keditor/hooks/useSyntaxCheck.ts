import { computed } from 'vue'
import type { Ref } from 'vue'
import type { CharModelApi } from './useCharModel'
import { getLinter } from '@/keditor/config/linters'
import type { SyntaxDiagnostic } from '@/keditor/utils/jsonLint'

/**
 * 语法校验：
 * - 按当前语言从 linter 注册表（config/linters）取诊断函数；未注册语言返回空数组
 * - JSON 为内置 linter（完整校验），js/ts 内置括号兜底；业务可用 registerLinter 扩展/覆盖
 * - 校验是纯 computed：随模型变化自动重算
 */
export type { SyntaxDiagnostic } from '@/keditor/utils/jsonLint'

export function useSyntaxCheck(
  model: CharModelApi,
  language: Ref<string>,
): { diagnostics: Ref<SyntaxDiagnostic[]> } {
  const diagnostics = computed<SyntaxDiagnostic[]>(() => {
    const linter = getLinter(language.value)
    if (!linter) return []
    return linter(model.getText())
  })
  return { diagnostics }
}

// 兼容导出：JSON 校验器（原 useSyntaxCheck 内联实现，现独立在 utils/jsonLint）
export { validateJson } from '@/keditor/utils/jsonLint'
