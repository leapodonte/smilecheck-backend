<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import { listTasks, retryTask, type AnalysisTask } from '../api/selftest'

const { t } = useI18n()

const items = ref<AnalysisTask[]>([])
const loading = ref(false)
const statusFilter = ref<string | undefined>(undefined)
const pagination = reactive({ current: 1, pageSize: 20, total: 0, showSizeChanger: true })

const columns = [
  { title: t('task.template'), dataIndex: 'template_name', width: 150 },
  { title: t('task.user'), dataIndex: 'user_nickname', width: 140 },
  { title: t('task.status'), dataIndex: 'status', width: 110 },
  { title: t('task.progress'), key: 'progress', width: 160 },
  { title: t('task.stage'), dataIndex: 'stage', ellipsis: true },
  { title: t('task.provider'), dataIndex: 'provider', width: 90 },
  { title: t('task.createdAt'), dataIndex: 'created_at', width: 170 },
  { title: t('common.actions'), key: 'actions', width: 90 },
]

async function load() {
  loading.value = true
  try {
    const res = await listTasks({ status: statusFilter.value, page: pagination.current, page_size: pagination.pageSize })
    items.value = res.items ?? []
    pagination.total = Number(res.total ?? 0)
  } finally {
    loading.value = false
  }
}

const statusOptions = ['pending', 'running', 'completed', 'failed'].map((v) => ({ label: t(`task.status_${v}`), value: v }))
const statusColor: Record<string, string> = {
  pending: 'default',
  running: 'processing',
  completed: 'success',
  failed: 'error',
}

function onRetry(record: AnalysisTask) {
  Modal.confirm({
    title: t('task.retryConfirm'),
    onOk: async () => {
      await retryTask(record.id!)
      message.success(t('task.retried'))
      load()
    },
  })
}

function fmtTime(ts?: number) {
  return ts ? new Date(ts * 1000).toLocaleString() : '-'
}

onMounted(load)

//运行中的任务自动刷新
let timer: number | undefined
onMounted(() => {
  timer = window.setInterval(() => {
    if (items.value.some((x) => x.status === 'running' || x.status === 'pending')) {
      load()
    }
  }, 5000)
})
onUnmounted(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<template>
  <a-card :bordered="false" class="page-card">
    <div class="page-toolbar">
      <span class="tip">{{ t('task.tip') }}</span>
      <a-select v-model:value="statusFilter" allow-clear :placeholder="t('task.status')" :options="statusOptions" style="width: 160px" @change="() => { pagination.current = 1; load() }" />
    </div>

    <a-table :columns="columns" :data-source="items" :loading="loading" row-key="id" :pagination="pagination" @change="(p: any) => { pagination.current = p.current; pagination.pageSize = p.pageSize; load() }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'status'">
          <a-badge :status="statusColor[record.status]" :text="t(`task.status_${record.status}`)" />
        </template>
        <template v-else-if="column.key === 'progress'">
          <a-progress :percent="record.progress" size="small" :status="record.status === 'failed' ? 'exception' : record.status === 'completed' ? 'success' : 'active'" />
        </template>
        <template v-else-if="column.dataIndex === 'created_at'">
          {{ fmtTime(record.created_at) }}
        </template>
        <template v-else-if="column.key === 'actions'">
          <a v-if="record.status === 'failed' || record.status === 'pending'" @click="onRetry(record)">{{ t('task.retry') }}</a>
          <span v-else>-</span>
        </template>
      </template>
    </a-table>
  </a-card>
</template>

<style scoped>
.page-card {
  border-radius: 12px;
}
.page-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.tip {
  color: #999;
  font-size: 13px;
}
</style>
