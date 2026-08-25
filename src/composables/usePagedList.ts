import { ref, reactive } from 'vue'
import type { Paged } from '../api/selftest'

/**
 * 分页列表通用逻辑（搜索 + 分页 + 加载）
 */
export function usePagedList<T>(fetcher: (params: { search?: string; page: number; page_size: number }) => Promise<Paged<T>>, defaultPageSize = 20) {
  const items = ref<T[]>([]) as { value: T[] }
  const total = ref(0)
  const loading = ref(false)
  const search = ref('')
  const pagination = reactive({ current: 1, pageSize: defaultPageSize, total: 0, showSizeChanger: true, showTotal: (t: number) => `${t}` })

  async function load() {
    loading.value = true
    try {
      const res = await fetcher({ search: search.value || undefined, page: pagination.current, page_size: pagination.pageSize })
      items.value = (res.items ?? []) as T[]
      total.value = Number(res.total ?? 0)
      pagination.total = total.value
    } finally {
      loading.value = false
    }
  }

  function handleTableChange(p: { current?: number; pageSize?: number }) {
    if (p.current) pagination.current = p.current
    if (p.pageSize) pagination.pageSize = p.pageSize
    load()
  }

  function doSearch() {
    pagination.current = 1
    load()
  }

  return { items, total, loading, search, pagination, load, handleTableChange, doSearch }
}
