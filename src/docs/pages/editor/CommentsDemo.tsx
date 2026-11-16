import { defineComponent } from 'vue'
import DemoBlock from '@/docs/components/DemoBlock'
import CommentsDemo from './demos/CommentsDemo'
import commentsCode from './demos/CommentsDemo.tsx?raw'
import commentsVueCode from './demos/CommentsDemo.vue?raw'

export default defineComponent({
  name: 'CommentsPage',
  setup() {
    return () => (
      <div>
        <p class="page-desc">
          代码评论（Git/GitLab 协作讨论风格）：开启 <code>commentable</code> 后行号槽悬停出现
          「+」按钮，点击在当前行下方发起评论；<code>comments</code> 传入讨论线程数组
          （{'{'} id, line, author?, timestamp?, body, replies?, resolved? {'}'}），线程以
          GitLab 讨论卡样式渲染在代码行下方——头像首字徽标 + 灰底头部条（作者 / 时间 / 回复 /
          解决操作）+ 缩进回复列表；已解决线程折叠为绿色 ✓ 细条，点击展开或恢复讨论。
          评论块高度由 ResizeObserver 实测并回填布局偏移表，gutter 插入等高占位保持行号对齐，
          虚拟滚动窗口按评论偏移二分定位，大文件下依然流畅。
          发表 / 回复经 <code>onCommentSubmit</code>{' '}
          (payload 含 line / body / parentId) 上抛，解决状态经 <code>onCommentResolve</code>{' '}
          上抛，数据由业务持有；也可通过 <code>openComment(line)</code> 编程式发起。
        </p>
        <DemoBlock
          title="代码评论"
          description="gutter「+」发起 + 讨论卡渲染 + 行内回复 + 已解决折叠条"
          code={commentsCode}
          vueCode={commentsVueCode}
        >
          <CommentsDemo />
        </DemoBlock>
      </div>
    )
  },
})
