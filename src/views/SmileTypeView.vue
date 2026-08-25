<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import { listSmileTypes, addSmileType, editSmileType, deleteSmileTypes, type SmileType } from '../api/selftest'

const { t } = useI18n()

const categoryOptions = ['excellent', 'cleaning', 'gum', 'alignment', 'bite', 'profile'].map((v) => ({ label: t(`smiletype.category_${v}`), value: v }))
const dimensionOptions = ['general', 'cleaning', 'gum', 'alignment', 'bite', 'aesthetic'].map((v) => ({ label: v, value: v }))

const items = ref<SmileType[]>([])
const loading = ref(false)
const search = ref('')
const category = ref<string | undefined>(undefined)
const pagination = reactive({ current: 1, pageSize: 50, total: 0 })

const columns = [
  { title: t('smiletype.name'), dataIndex: 'name', width: 150 },
  { title: t('smiletype.category'), dataIndex: 'category', width: 110 },
  { title: t('smiletype.dimension'), dataIndex: 'dimension', width: 100 },
  { title: t('smiletype.description'), dataIndex: 'description', ellipsis: true },
  { title: t('smiletype.band'), key: 'band', width: 110 },
  { title: t('smiletype.requireTags'), dataIndex: 'require_tags', width: 160 },
  { title: t('smiletype.sort'), dataIndex: 'sort', width: 70 },
  { title: t('common.actions'), key: 'actions', width: 140 },
]

async function load() {
  loading.value = true
  try {
    const res = await listSmileTypes({ search: search.value || undefined, category: category.value, page: pagination.current, page_size: pagination.pageSize })
    items.value = res.items ?? []
    pagination.total = Number(res.total ?? 0)
  } finally {
    loading.value = false
  }
}

function doSearch() {
  pagination.current = 1
  load()
}

const modalOpen = ref(false)
const saving = ref(false)
const editing = ref<SmileType | null>(null)
const form = reactive({
  code: '',
  category: 'cleaning',
  dimension: 'cleaning',
  name: '',
  description: '',
  tags: [] as string[],
  min_score: 0,
  max_score: 100,
  require_tags: [] as string[],
  sort: 0,
  active: true,
})

function openAdd() {
  editing.value = null
  Object.assign(form, { code: '', category: 'cleaning', dimension: 'cleaning', name: '', description: '', tags: [], min_score: 0, max_score: 100, require_tags: [], sort: 0, active: true })
  modalOpen.value = true
}

function openEdit(record: SmileType) {
  editing.value = record
  Object.assign(form, {
    code: record.code ?? '',
    category: record.category,
    dimension: record.dimension,
    name: record.name,
    description: record.description,
    tags: [...(record.tags ?? [])],
    min_score: record.min_score ?? 0,
    max_score: record.max_score ?? 100,
    require_tags: [...(record.require_tags ?? [])],
    sort: record.sort,
    active: record.active ?? true,
  })
  modalOpen.value = true
}

async function submit() {
  saving.value = true
  try {
    if (editing.value?.id) {
      await editSmileType({ id: editing.value.id, ...form })
    } else {
      await addSmileType({ ...form })
    }
    message.success(t('common.saved'))
    modalOpen.value = false
    load()
  } finally {
    saving.value = false
  }
}

function onDelete(record: SmileType) {
  Modal.confirm({
    title: t('common.deleteConfirm'),
    onOk: async () => {
      await deleteSmileTypes([record.id!])
      message.success(t('common.deleted'))
      load()
    },
  })
}

const tagColorMap: Record<string, string> = {
  excellent: 'gold',
  cleaning: 'blue',
  gum: 'green',
  alignment: 'purple',
  bite: 'cyan',
  profile: 'magenta',
}

onMounted(load)
</script>

<template>
  <a-card :bordered="false" class="page-card">
    <div class="page-toolbar">
      <a-space>
        <a-input-search v-model:value="search" :placeholder="t('common.search')" style="width: 220px" @search="doSearch" />
        <a-select v-model:value="category" allow-clear :placeholder="t('smiletype.category')" :options="categoryOptions" style="width: 160px" @change="doSearch" />
      </a-space>
      <a-button type="primary" @click="openAdd">{{ t('common.add') }}</a-button>
    </div>

    <a-table :columns="columns" :data-source="items" :loading="loading" row-key="id" :pagination="pagination" @change="(p: any) => { pagination.current = p.current; pagination.pageSize = p.pageSize; load() }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'category'">
          <a-tag :color="tagColorMap[record.category]">{{ t(`smiletype.category_${record.category}`) }}</a-tag>
        </template>
        <template v-else-if="column.key === 'band'">
          {{ record.min_score ?? 0 }} - {{ record.max_score ?? 100 }}
        </template>
        <template v-else-if="column.dataIndex === 'require_tags'">
          <a-tag v-for="tag in record.require_tags || []" :key="tag" style="margin-bottom: 2px">{{ tag }}</a-tag>
        </template>
        <template v-else-if="column.key === 'actions'">
          <a-space>
            <a @click="openEdit(record)">{{ t('common.edit') }}</a>
            <a class="danger" @click="onDelete(record)">{{ t('common.delete') }}</a>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal v-model:open="modalOpen" :title="editing ? t('smiletype.editTitle') : t('smiletype.addTitle')" width="640px" :confirm-loading="saving" @ok="submit">
      <a-form layout="vertical" style="margin-top: 12px">
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item :label="t('smiletype.code')">
              <a-input v-model:value="form.code" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('smiletype.name')">
              <a-input v-model:value="form.name" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item :label="t('smiletype.description')">
          <a-input v-model:value="form.description" />
        </a-form-item>
        <a-row :gutter="12">
          <a-col :span="8">
            <a-form-item :label="t('smiletype.category')">
              <a-select v-model:value="form.category" :options="categoryOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('smiletype.dimension')">
              <a-select v-model:value="form.dimension" :options="dimensionOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('smiletype.sort')">
              <a-input-number v-model:value="form.sort" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="12">
          <a-col :span="8">
            <a-form-item :label="t('smiletype.minScore')">
              <a-input-number v-model:value="form.min_score" :min="0" :max="100" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('smiletype.maxScore')">
              <a-input-number v-model:value="form.max_score" :min="0" :max="100" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item :label="t('smiletype.tags')">
          <a-select v-model:value="form.tags" mode="tags" :options="['keep-going','plaque-risk','cleaning-advice','gum-care','crowding','profile','checkup'].map((x) => ({ label: x, value: x }))" />
        </a-form-item>
        <a-form-item :label="t('smiletype.requireTags')">
          <a-select v-model:value="form.require_tags" mode="tags" :options="['plaque-risk','cleaning-advice','gingival-bleeding','crowding','profile','checkup'].map((x) => ({ label: x, value: x }))" />
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
