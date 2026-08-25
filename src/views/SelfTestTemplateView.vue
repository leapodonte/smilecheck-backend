<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import { listTemplates, addTemplate, editTemplate, deleteTemplates, type SelfTestTemplate } from '../api/selftest'
import { usePagedList } from '../composables/usePagedList'

const { t } = useI18n()
const { items, loading, search, pagination, load, handleTableChange, doSearch } = usePagedList<SelfTestTemplate>(listTemplates)

const columns = [
  { title: t('selftest.template.code'), dataIndex: 'code', width: 140 },
  { title: t('selftest.template.name'), dataIndex: 'name', width: 180 },
  { title: t('selftest.template.description'), dataIndex: 'description', ellipsis: true },
  { title: t('selftest.template.duration'), dataIndex: 'duration_minutes', width: 90 },
  { title: t('selftest.template.questionCount'), dataIndex: 'question_count', width: 100 },
  { title: t('selftest.template.sort'), dataIndex: 'sort', width: 80 },
  { title: t('selftest.template.active'), dataIndex: 'active', width: 90 },
  { title: t('common.actions'), key: 'actions', width: 140 },
]

const modalOpen = ref(false)
const saving = ref(false)
const editing = ref<SelfTestTemplate | null>(null)
const form = reactive({ code: '', name: '', description: '', duration_minutes: 3, sort: 0, active: true })

function openAdd() {
  editing.value = null
  Object.assign(form, { code: '', name: '', description: '', duration_minutes: 3, sort: 0, active: true })
  modalOpen.value = true
}

function openEdit(record: SelfTestTemplate) {
  editing.value = record
  Object.assign(form, {
    code: record.code ?? '',
    name: record.name ?? '',
    description: record.description ?? '',
    duration_minutes: record.duration_minutes,
    sort: record.sort,
    active: record.active ?? true,
  })
  modalOpen.value = true
}

async function submit() {
  saving.value = true
  try {
    if (editing.value?.id) {
      await editTemplate({ id: editing.value.id, ...form })
    } else {
      await addTemplate({ ...form })
    }
    message.success(t('common.saved'))
    modalOpen.value = false
    load()
  } finally {
    saving.value = false
  }
}

function onDelete(record: SelfTestTemplate) {
  Modal.confirm({
    title: t('common.deleteConfirm'),
    onOk: async () => {
      await deleteTemplates([record.id!])
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

    <a-table :columns="columns" :data-source="items" :loading="loading" row-key="id" :pagination="pagination" @change="handleTableChange">
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'duration_minutes'">
          {{ record.duration_minutes }} {{ t('selftest.template.minutes') }}
        </template>
        <template v-else-if="column.dataIndex === 'active'">
          <a-switch
            :checked="record.active"
            :checked-children="t('common.on')"
            :un-checked-children="t('common.off')"
            @change="async (checked: any) => { await editTemplate({ id: record.id, active: checked }); message.success(t('common.saved')); load() }"
          />
        </template>
        <template v-else-if="column.key === 'actions'">
          <a-space>
            <a @click="openEdit(record)">{{ t('common.edit') }}</a>
            <a class="danger" @click="onDelete(record)">{{ t('common.delete') }}</a>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal v-model:open="modalOpen" :title="editing ? t('selftest.template.editTitle') : t('selftest.template.addTitle')" :confirm-loading="saving" @ok="submit">
      <a-form layout="vertical" style="margin-top: 12px">
        <a-form-item :label="t('selftest.template.code')">
          <a-input v-model:value="form.code" placeholder="comprehensive/profile/crowding/kids" />
        </a-form-item>
        <a-form-item :label="t('selftest.template.name')">
          <a-input v-model:value="form.name" />
        </a-form-item>
        <a-form-item :label="t('selftest.template.description')">
          <a-input v-model:value="form.description" />
        </a-form-item>
        <a-form-item :label="t('selftest.template.duration')">
          <a-input-number v-model:value="form.duration_minutes" :min="1" :max="60" />
        </a-form-item>
        <a-form-item :label="t('selftest.template.sort')">
          <a-input-number v-model:value="form.sort" />
        </a-form-item>
        <a-form-item :label="t('selftest.template.active')">
          <a-switch v-model:checked="form.active" />
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
