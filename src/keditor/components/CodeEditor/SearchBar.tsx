import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { EditorSearchApi } from '@/keditor/hooks/useEditorSearch'
import type { EditorLocale } from '@/keditor/config/editor-locale'

/**
 * 编辑器内嵌搜索替换框：
 * - 输入关键词后回车：执行全局检索并高亮全部命中，光标跳到第一条
 * - 再次回车：循环跳到下一条命中（视口跟随滚动）
 * - 替换框：替换当前聚焦命中 / 全部替换
 * - Esc：清空关键词与替换文本并移除全部命中高亮
 * 注意：mousedown 阻止冒泡，避免触发编辑器根节点的「点击聚焦隐藏输入层」
 */
export default defineComponent({
  name: 'KSearchBar',
  props: {
    search: { type: Object as PropType<EditorSearchApi>, required: true },
    locale: { type: Object as PropType<EditorLocale>, required: true },
  },
  setup(props) {
    const search = props.search

    function onInput(e: Event): void {
      search.keyword.value = (e.target as HTMLInputElement).value
    }

    function onReplaceInput(e: Event): void {
      search.replacement.value = (e.target as HTMLInputElement).value
    }

    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Enter') {
        e.preventDefault()
        // 首次回车检索，之后回车逐条跳转
        search.nextMatch()
      } else if (e.key === 'Escape') {
        search.clearSearch()
        search.replacement.value = ''
      }
    }

    return () => (
      <div class="k-editor__search" onMousedown={(e) => e.stopPropagation()}>
        <span class="k-editor__search-icon">⌕</span>
        <input
          class="k-editor__search-input"
          type="text"
          placeholder={props.locale.searchPlaceholder}
          value={search.keyword.value}
          onInput={onInput}
          onKeydown={onKeyDown}
        />
        <input
          class="k-editor__search-input k-editor__search-replace"
          type="text"
          placeholder={props.locale.replacePlaceholder}
          value={search.replacement.value}
          onInput={onReplaceInput}
        />
        <button
          class="k-editor__search-btn"
          title={props.locale.replace}
          disabled={search.matches.value.length === 0}
          onClick={() => search.replaceCurrent()}
        >
          {props.locale.replace}
        </button>
        <button
          class="k-editor__search-btn"
          title={props.locale.replaceAll}
          disabled={search.matches.value.length === 0}
          onClick={() => search.replaceAll()}
        >
          {props.locale.replaceAll}
        </button>
        {search.matches.value.length > 0 && (
          <span class="k-editor__search-count">
            {search.activeIndex.value + 1}/{search.matches.value.length}
          </span>
        )}
      </div>
    )
  },
})
