<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import { listRules, addRule, editRule, deleteRules, setRuleItems, listScience, type RecommendRule, type ScienceContent } from '../api/selftest'

const { t } = useI18n()

const rules = ref<RecommendRule[]>([])
const loading = ref(false)

const columns = [
  { title: t('recommend.tagCode'), dataIndex: 'tag_code', width: 180 },
  { title: t('recommend.name'), dataIndex: 'name', width: 200 },
  { title: t('recommend.contents'), key: 'contents', ellipsis: true },
  { title: t('recommend.sort'), dataIndex: 'sort', width: 70 },
  { title: t('recommend.active'), dataIndex: 'active', width: 80 },
  { title: t('common.actions'), key: 'actions', width: 180 },
]

async function load() {
  loading.value = true
  try {
    const res = await listRules()
    rules.value = res.items ?? []
  } finally {
    loading.value = false
  }
}

//新增/编辑
const modalOpen = ref(false)
const saving = ref(false)
const editing = ref<RecommendRule | null>(null)
const form = reactive({ tag_code: '', name: '', sort: 0, active: true })

function openAdd() {
  editing.value = null
  Object.assign(form, { tag_code: '', name: '', sort: 0, active: true })
  modalOpen.value = true
}

function openEdit(record: RecommendRule) {
  editing.value = record
  Object.assign(form, { tag_code: record.tag_code, name: record.name, sort: record.sort, active: record.active ?? true })
  modalOpen.value = true
}

async function submit() {
  saving.value = true
  try {
    if (editing.value?.id) {
      await editRule({ id: editing.value.id, ...form })
    } else {
      await addRule({ ...form })
    }
    message.success(t('common.saved'))
    modalOpen.value = false
    load()
  } finally {
    saving.value = false
  }
}

function onDelete(record: RecommendRule) {
  Modal.confirm({
    title: t('common.deleteConfirm'),
    onOk: async () => {
      await deleteRules([record.id!])
      message.success(t('common.deleted'))
      load()
    },
  })
}

//映射内容配置弹窗
const itemsOpen = ref(false)
const itemsTarget = ref<RecommendRule | null>(null)
const itemsSaving = ref(false)
const allContents = ref<ScienceContent[]>([])
const checkedContents = ref<string[]>([])

async function openItems(record: RecommendRule) {
  itemsTarget.value = record
  const res = await listScience({ page: 1, page_size: 200 })
  allContents.value = res.items ?? []
  checkedContents.value = (record.contents ?? []).map((c) => c.id!)
  itemsOpen.value = true
}

async function submitItems() {
  itemsSaving.value = true
  try {
    await setRuleItems(itemsTarget.value!.id!, checkedContents.value)
    message.success(t('common.saved'))
    itemsOpen.value = false
    load()
  } finally {
    itemsSaving.value = false
  }
}

onMounted(load)
</script>

<template>
  <a-card :bordered="false" class="page-card">
    <div class="page-toolbar">
      <span class="tip">{{ t('recommend.tip') }}</span>
      <a-button type="primary" @click="openAdd">{{ t('common.add') }}</a-button>
    </div>

    <a-table :columns="columns" :data-source="rules" :loading="loading" row-key="id" :pagination="false">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'contents'">
          <a-tag v-for="content in record.contents || []" :key="content.id" style="margin-bottom: 2px">{{ content.title }}</a-tag>
          <span v-if="!record.contents?.length">-</span>
        </template>
        <template v-else-if="column.dataIndex === 'active'">
          <a-switch
            :checked="record.active"
            :checked-children="t('common.on')"
            :un-checked-children="t('common.off')"
            @change="async (checked: any) => { await editRule({ id: record.id, active: checked }); message.success(t('common.saved')); load() }"
          />
        </template>
        <template v-else-if="column.key === 'actions'">
          <a-space>
            <a @click="openItems(record)">{{ t('recommend.setItems') }}</a>
            <a @click="openEdit(record)">{{ t('common.edit') }}</a>
            <a class="danger" @click="onDelete(record)">{{ t('common.delete') }}</a>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal v-model:open="modalOpen" :title="editing ? t('recommend.editTitle') : t('recommend.addTitle')" :confirm-loading="saving" @ok="submit">
      <a-form layout="vertical" style="margin-top: 12px">
        <a-form-item :label="t('recommend.tagCode')">
          <a-input v-model:value="form.tag_code" placeholder="gingival-bleeding/crowding/profile/kids-ortho/checkup" />
        </a-form-item>
        <a-form-item :label="t('recommend.name')">
          <a-input v-model:value="form.name" />
        </a-form-item>
        <a-form-item :label="t('recommend.sort')">
          <a-input-number v-model:value="form.sort" />
        </a-form-item>
        <a-form-item :label="t('recommend.active')">
          <a-switch v-model:checked="form.active" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="itemsOpen" :title="`${t('recommend.setItems')} - ${itemsTarget?.name ?? ''}`" width="640px" :confirm-loading="itemsSaving" @ok="submitItems">
      <a-checkbox-group v-model:value="checkedContents" style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px; max-height: 420px; overflow: auto">
        <a-checkbox v-for="content in allContents" :key="content.id" :value="content.id">
          [{{ content.type }}] {{ content.title }}
        </a-checkbox>
      </a-checkbox-group>
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
  align-items: center;
  margin-bottom: 16px;
}
.tip {
  color: #999;
  font-size: 13px;
}
.danger {
  color: #ff4d4f;
}
</style>
