import { defineComponent } from 'vue'
import type { PropType } from 'vue'

/** ApiTable 列定义 */
export interface ApiColumn {
  key: string
  title: string
  /** 列宽（px） */
  width?: number
}

/**
 * ApiTable：通用 API 表格（属性 / 方法 / 类型 均复用）
 */
export default defineComponent({
  name: 'ApiTable',
  props: {
    columns: { type: Array as PropType<ApiColumn[]>, required: true },
    data: { type: Array as PropType<Array<Record<string, unknown>>>, required: true },
  },
  setup(props) {
    return () => (
      <div class="api-table">
        <table>
          <thead>
            <tr>
              {props.columns.map((col) => (
                <th key={col.key} style={col.width ? { width: `${col.width}px` } : undefined}>
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.data.map((row, i) => (
              <tr key={i}>
                {props.columns.map((col) => (
                  <td key={col.key}>
                    {row[col.key] as string | number | undefined}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  },
})
