import { defineComponent, ref, computed } from 'vue'
import type { PropType } from 'vue'
import type { CodeComment } from '@/keditor/types/editor'
import type { EditorLocale } from '@/keditor/config/editor-locale'

/** 作者名 → 头像底色（GitLab 彩色首字徽标观感，取自稳定调色板） */
const AVATAR_COLORS = ['#6ca6e8', '#7ecf9c', '#e8b26a', '#d98bc0', '#8eaadb', '#e89a8a']

function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const Avatar = ({ name }: { name: string }) => (
  <span class="k-editor__comment-avatar" style={{ background: avatarColor(name) }}>
    {name.slice(0, 1).toUpperCase() || '?'}
  </span>
)

/** 单条评论卡（头部灰底 + 正文，Git 审阅卡片样式） */
const NoteCard = (p: {
  c: CodeComment
  isReply?: boolean
  locale: EditorLocale
  commentable: boolean
  onReply?: () => void
  onResolve?: () => void
}) => (
  <div class={{ 'k-editor__comment-card': true, 'is-reply': p.isReply }}>
    <div class="k-editor__comment-head">
      <Avatar name={p.c.author ?? '?'} />
      <span class="k-editor__comment-author">{p.c.author ?? '匿名'}</span>
      {p.c.timestamp && <span class="k-editor__comment-time">{p.c.timestamp}</span>}
      {p.commentable && !p.isReply && (
        <span class="k-editor__comment-actions">
          <button class="k-editor__comment-link" onClick={p.onReply}>
            {p.locale.commentReply}
          </button>
          <button class="k-editor__comment-link" onClick={p.onResolve}>
            {p.c.resolved ? p.locale.commentUnresolve : p.locale.commentResolve}
          </button>
        </span>
      )}
    </div>
    <div class="k-editor__comment-body">{p.c.body}</div>
  </div>
)

/**
 * 评论输入框（发起评论 / 回复共用）：Ctrl+Enter 提交；挂载即聚焦（ref 回调内 focus）
 */
export const CommentComposer = defineComponent({
  name: 'KCommentComposer',
  props: {
    locale: { type: Object as PropType<EditorLocale>, required: true },
    onSubmit: { type: Function as PropType<(body: string) => void>, default: undefined },
    onCancel: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props) {
    const draft = ref('')

    function submit(): void {
      const text = draft.value.trim()
      if (!text) return
      props.onSubmit?.(text)
      draft.value = ''
    }

    return () => (
      <div class="k-editor__comment-composer">
        <textarea
          class="k-editor__comment-input"
          value={draft.value}
          placeholder={props.locale.commentPlaceholder}
          rows={2}
          ref={(el) => el && (el as HTMLTextAreaElement).focus()}
          onInput={(e: Event) => (draft.value = (e.target as HTMLTextAreaElement).value)}
          onMousedown={(e: MouseEvent) => e.stopPropagation()}
          onKeydown={(e: KeyboardEvent) => {
            e.stopPropagation()
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit()
          }}
        />
        <div class="k-editor__comment-composer-btns">
          <button class="k-editor__comment-btn is-primary" onClick={submit}>
            {props.locale.commentSubmit}
          </button>
          <button class="k-editor__comment-btn" onClick={() => props.onCancel?.()}>
            {props.locale.commentCancel}
          </button>
        </div>
      </div>
    )
  },
})

/**
 * 评论线程（GitLab 风格）：
 * - 顶层评论 + 缩进回复卡；resolved 线程折叠为绿色 ✓ 细横条，点击展开
 * - 回复输入框内联在卡片底部；onSubmit(body, parentId) / onResolve(resolved) 上抛给宿主
 */
export default defineComponent({
  name: 'KCommentThread',
  props: {
    thread: { type: Object as PropType<CodeComment>, required: true },
    commentable: { type: Boolean, default: false },
    locale: { type: Object as PropType<EditorLocale>, required: true },
    onSubmit: {
      type: Function as PropType<(body: string, parentId?: string) => void>,
      default: undefined,
    },
    onResolve: {
      type: Function as PropType<(resolved: boolean) => void>,
      default: undefined,
    },
  },
  setup(props) {
    /** 已解决线程的展开状态（默认折叠成细横条） */
    const expanded = ref(false)
    const replyOpen = ref(false)

    const replyCount = computed(() => props.thread.replies?.length ?? 0)

    const renderComposer = () => (
      <CommentComposer
        locale={props.locale}
        onSubmit={(body) => {
          props.onSubmit?.(body, props.thread.id)
          replyOpen.value = false
        }}
        onCancel={() => (replyOpen.value = false)}
      />
    )

    return () => {
      const t = props.thread
      // 已解决且未展开：折叠为绿色细横条（GitLab ✓ 样式）
      if (t.resolved && !expanded.value) {
        return (
          <div
            class="k-editor__comment-thread is-resolved"
            onClick={() => (expanded.value = true)}
          >
            <span class="k-editor__comment-resolved-bar">
              {props.locale.commentResolvedBar(t.author ?? '匿名', replyCount.value)}
            </span>
          </div>
        )
      }
      return (
        <div class={{ 'k-editor__comment-thread': true, 'is-resolved-open': !!t.resolved }}>
          <NoteCard
            c={t}
            locale={props.locale}
            commentable={props.commentable}
            onReply={() => (replyOpen.value = !replyOpen.value)}
            onResolve={() => props.onResolve?.(!t.resolved)}
          />
          {(t.replies ?? []).map((r) => (
            <NoteCard key={r.id} c={r} isReply locale={props.locale} commentable={props.commentable} />
          ))}
          {props.commentable &&
            (replyOpen.value ? (
              renderComposer()
            ) : (
              <div
                class="k-editor__comment-reply-trigger"
                onClick={() => (replyOpen.value = true)}
              >
                {props.locale.commentReply}…
              </div>
            ))}
          {t.resolved && (
            <div
              class="k-editor__comment-collapse"
              onClick={() => (expanded.value = false)}
            >
              − {props.locale.fold}
            </div>
          )}
        </div>
      )
    }
  },
})
