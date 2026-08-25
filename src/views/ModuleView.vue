<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { listModules, updateModules, type ModuleNode } from '../api/system'

const { t } = useI18n()
const loading = ref(false)
const modules = ref<ModuleNode[]>([])
//编辑副本（id -> 可编辑字段）
const edits = ref<Record<string, { name: string; path: string; order: number; visible: boolean }>>({})

const columns = [
  { title: t('module.name'), key: 'name' },
  { title: t('module.path'), key: 'path' },
  { title: t('module.order'), key: 'order', width: 110 },
  { title: t('common.visible'), key: 'visible', width: 100 },
  { title: t('module.actions'), dataIndex: 'actions' },
]

async function load() {
  loading.value = true
  try {
    const data = await listModules()
    modules.value = data ?? []
    syncEdits(modules.value)
  } finally {
    loading.value = false
  }
}

function syncEdits(nodes: ModuleNode[]) {
  for (const n of nodes) {
    edits.value[n.id] = {
      name: n.name ?? '',
      path: n.path ?? '',
      order: n.order ?? 0,
      visible: n.visible ?? true,
    }
    if (n.children?.length) syncEdits(n.children)
  }
}

async function save() {
  //按接口约定回传扁平化模块（含 children 引用即可）
  const payload = collect(modules.value)
  await updateModules(payload)
  message.success(t('common.saved'))
  load()
}

function collect(nodes: ModuleNode[]): ModuleNode[] {
  return nodes.map((n) => ({
    ...n,
    name: edits.value[n.id]?.name ?? n.name,
    path: edits.value[n.id]?.path ?? n.path,
    order: edits.value[n.id]?.order ?? n.order,
    visible: edits.value[n.id]?.visible ?? n.visible,
    children: n.children?.length ? collect(n.children) : n.children,
  }))
}

onMounted(load)
</script>

<template>
  <a-card :bordered="false" class="page-card">
    <div class="page-toolbar">
      <span class="tip">{{ t('module.tip') }}</span>
      <a-button type="primary" @click="save">{{ t('common.save') }}</a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="modules"
      :loading="loading"
      row-key="id"
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'name'">
          <a-input v-model:value="edits[record.id].name" style="width: 160px" />
        </template>
        <template v-else-if="column.key === 'path'">
          <a-input v-model:value="edits[record.id].path" style="width: 200px" />
        </template>
        <template v-else-if="column.key === 'order'">
          <a-input-number v-model:value="edits[record.id].order" style="width: 80px" />
        </template>
        <template v-else-if="column.key === 'visible'">
          <a-switch v-model:checked="edits[record.id].visible" />
        </template>
        <template v-else-if="column.dataIndex === 'actions'">
          <a-tag v-for="action in record.actions || []" :key="action" style="margin-right: 4px">{{ t(`common.action_${action}`) }}</a-tag>
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
