<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import { listOptions, addOption, editOption, deleteOptions, type SystemOption } from '../api/system'

const { t } = useI18n()
const items = ref<SystemOption[]>([])
const loading = ref(false)
const search = ref('')

const columns = [
  { title: t('options.name'), dataIndex: 'name', width: 260 },
  { title: t('options.desc'), dataIndex: 'desc', width: 220 },
  { title: t('options.value'), dataIndex: 'value', ellipsis: true },
  { title: t('common.actions'), key: 'actions', width: 140 },
]

async function load() {
  loading.value = true
  try {
    const res = await listOptions({ search: search.value || undefined })
    items.value = res.items ?? []
  } finally {
    loading.value = false
  }
}

function doSearch() {
  load()
}

//新增/编辑弹窗
const modalOpen = ref(false)
const saving = ref(false)
const editing = ref<SystemOption | null>(null)
const form = reactive({ name: '', value: '', desc: '' })

function openAdd() {
  editing.value = null
  Object.assign(form, { name: '', value: '', desc: '' })
  modalOpen.value = true
}

function openEdit(record: SystemOption) {
  editing.value = record
  Object.assign(form, { name: record.name, value: record.value, desc: record.desc ?? '' })
  modalOpen.value = true
}

async function submit() {
  saving.value = true
  try {
    if (editing.value) {
      await editOption({ name: form.name, value: form.value, desc: form.desc || undefined })
    } else {
      await addOption({ name: form.name, value: form.value, desc: form.desc || undefined })
    }
    message.success(t('common.saved'))
    modalOpen.value = false
    load()
  } finally {
    saving.value = false
  }
}

function onDelete(record: SystemOption) {
  Modal.confirm({
    title: t('common.deleteConfirm'),
    onOk: async () => {
      await deleteOptions([record.name])
      message.success(t('common.deleted'))
      load()
    },
  })
}

onMounted(load)
</script>

<template>
  <a-card :bordered="false" class="page-card">
    <div class="page-toolbar">
      <a-input-search v-model:value="search" :placeholder="t('common.search')" style="width: 260px" @search="doSearch" />
      <a-button type="primary" @click="openAdd">{{ t('common.add') }}</a-button>
    </div>

    <a-table :columns="columns" :data-source="items" :loading="loading" row-key="name" :pagination="false">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'actions'">
          <a-space>
            <a @click="openEdit(record)">{{ t('common.edit') }}</a>
            <a class="danger" @click="onDelete(record)">{{ t('common.delete') }}</a>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal v-model:open="modalOpen" :title="editing ? t('options.editTitle') : t('options.addTitle')" :confirm-loading="saving" @ok="submit">
      <a-form layout="vertical" style="margin-top: 12px">
        <a-form-item :label="t('options.name')">
          <a-input v-model:value="form.name" :disabled="!!editing" />
        </a-form-item>
        <a-form-item :label="t('options.desc')">
          <a-input v-model:value="form.desc" />
        </a-form-item>
        <a-form-item :label="t('options.value')">
          <a-textarea v-model:value="form.value" :rows="5" />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<style scoped>
.page-card {
  border-radius: 12px;
}
.page-toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}
.danger {
  color: #ff4d4f;
}
</style>
