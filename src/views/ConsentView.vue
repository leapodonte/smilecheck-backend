<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listConsents, type UserConsent } from '../api/selftest'

const { t } = useI18n()

const items = ref<UserConsent[]>([])
const loading = ref(false)
const typeFilter = ref<string | undefined>(undefined)
const pagination = reactive({ current: 1, pageSize: 20, total: 0, showSizeChanger: true })

const columns = [
  { title: t('consent.user'), key: 'user', width: 180 },
  { title: t('consent.type'), dataIndex: 'type', width: 140 },
  { title: t('consent.version'), dataIndex: 'version', width: 100 },
  { title: t('consent.granted'), dataIndex: 'granted', width: 100 },
  { title: t('consent.time'), dataIndex: 'created_at', width: 180 },
]

async function load() {
  loading.value = true
  try {
    const res = await listConsents({ type: typeFilter.value, page: pagination.current, page_size: pagination.pageSize })
    items.value = res.items ?? []
    pagination.total = Number(res.total ?? 0)
  } finally {
    loading.value = false
  }
}

const typeOptions = ['health', 'privacy', 'minor'].map((v) => ({ label: t(`consent.type_${v}`), value: v }))
const gradeColor: Record<string, string> = { health: 'blue', privacy: 'green', minor: 'orange' }

function fmtTime(ts?: number) {
  return ts ? new Date(ts * 1000).toLocaleString() : '-'
}

onMounted(load)
</script>

<template>
  <a-card :bordered="false" class="page-card">
    <div class="page-toolbar">
      <span class="tip">{{ t('consent.tip') }}</span>
      <a-select v-model:value="typeFilter" allow-clear :placeholder="t('consent.type')" :options="typeOptions" style="width: 180px" @change="() => { pagination.current = 1; load() }" />
    </div>

    <a-table :columns="columns" :data-source="items" :loading="loading" row-key="id" :pagination="pagination" @change="(p: any) => { pagination.current = p.current; pagination.pageSize = p.pageSize; load() }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'user'">
          {{ record.user_nickname || '-' }}<span v-if="record.user_phone" class="sub">（{{ record.user_phone }}）</span>
        </template>
        <template v-else-if="column.dataIndex === 'type'">
          <a-tag :color="gradeColor[record.type]">{{ t(`consent.type_${record.type}`) }}</a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'granted'">
          <a-tag :color="record.granted ? 'green' : 'red'">{{ record.granted ? t('consent.grantedYes') : t('consent.grantedNo') }}</a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'created_at'">
          {{ fmtTime(record.created_at) }}
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
.sub {
  color: #999;
  font-size: 12px;
}
</style>
