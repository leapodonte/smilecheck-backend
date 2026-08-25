<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import { listScience, getScience, addScience, editScience, deleteScience, type ScienceContent } from '../api/selftest'
import { API_BASE, resolveUrl } from '../api/http'
import { usePagedList } from '../composables/usePagedList'

const { t } = useI18n()
const typeFilter = ref<string | undefined>(undefined)

const fetcher = (params: { search?: string; page: number; page_size: number }) =>
  listScience({ ...params, type: typeFilter.value })
const { items, loading, search, pagination, load, handleTableChange, doSearch } = usePagedList<ScienceContent>(fetcher)

const columns = [
  { title: t('science.title'), dataIndex: 'title', ellipsis: true },
  { title: t('science.type'), dataIndex: 'type', width: 90 },
  { title: t('science.cover'), key: 'cover', width: 90 },
  { title: t('science.duration'), dataIndex: 'duration', width: 90 },
  { title: t('science.source'), dataIndex: 'source', width: 130 },
  { title: t('science.tags'), key: 'tags', width: 200 },
  { title: t('science.active'), dataIndex: 'active', width: 80 },
  { title: t('common.actions'), key: 'actions', width: 140 },
]

const modalOpen = ref(false)
const saving = ref(false)
const editing = ref<ScienceContent | null>(null)
const form = reactive({
  title: '',
  type: 'video',
  cover: '',
  media_url: '',
  body: '',
  duration: 0,
  source: '',
  tags: [] as string[],
  sort: 0,
  active: true,
})

function openAdd() {
  editing.value = null
  Object.assign(form, { title: '', type: 'video', cover: '', media_url: '', body: '', duration: 0, source: '', tags: [], sort: 0, active: true })
  modalOpen.value = true
}

async function openEdit(record: ScienceContent) {
  //详情接口取完整字段（含正文）
  const res = await getScience(record.id!)
  const full = res.item
  editing.value = full
  Object.assign(form, {
    title: full.title,
    type: full.type,
    cover: full.cover ?? '',
    media_url: full.media_url ?? '',
    body: full.body ?? '',
    duration: full.duration,
    source: full.source ?? '',
    tags: [...(full.tags ?? [])],
    sort: full.sort,
    active: full.active ?? true,
  })
  modalOpen.value = true
}

async function submit() {
  saving.value = true
  try {
    if (editing.value?.id) {
      await editScience({ id: editing.value.id, ...form })
    } else {
      await addScience({ ...form })
    }
    message.success(t('common.saved'))
    modalOpen.value = false
    load()
  } finally {
    saving.value = false
  }
}

function onDelete(record: ScienceContent) {
  Modal.confirm({
    title: t('common.deleteConfirm'),
    onOk: async () => {
      await deleteScience([record.id!])
      message.success(t('common.deleted'))
      load()
    },
  })
}

//文件上传（form 表单跳过签名）
const uploading = ref(false)

async function customUpload(options: any, field: 'cover' | 'media_url') {
  const formData = new FormData()
  formData.append('file', options.file)
  formData.append('category', 'science')
  uploading.value = true
  try {
    //form 表单跳过签名，但仍需会话头
    const session = localStorage.getItem('admin_session') || ''
    const res = await fetch(`${API_BASE}/science/upload`, {
      method: 'POST',
      body: formData,
      headers: session ? { 'Admin-Session': session } : undefined,
    })
    const json = await res.json()
    if (json.code === 0) {
      form[field] = json.data.url
      message.success(t('common.uploaded'))
    } else {
      message.error(json.msg || 'upload failed')
    }
    options.onSuccess?.(json)
  } finally {
    uploading.value = false
  }
}

function fmtDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

onMounted(load)
</script>

<template>
  <a-card :bordered="false" class="page-card">
    <div class="page-toolbar">
      <a-space>
        <a-input-search v-model:value="search" :placeholder="t('common.search')" style="width: 220px" @search="doSearch" />
        <a-select v-model:value="typeFilter" allow-clear :placeholder="t('science.type')" style="width: 130px" :options="[{ label: t('science.typeVideo'), value: 'video' }, { label: t('science.typeArticle'), value: 'article' }]" @change="doSearch" />
      </a-space>
      <a-button type="primary" @click="openAdd">{{ t('common.add') }}</a-button>
    </div>

    <a-table :columns="columns" :data-source="items" :loading="loading" row-key="id" :pagination="pagination" @change="handleTableChange">
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'type'">
          <a-tag :color="record.type === 'video' ? 'purple' : 'blue'">{{ record.type === 'video' ? t('science.typeVideo') : t('science.typeArticle') }}</a-tag>
        </template>
        <template v-else-if="column.key === 'cover'">
          <a-image v-if="record.cover" :src="resolveUrl(record.cover)" :width="48" :height="36" style="object-fit: cover; border-radius: 4px" />
          <span v-else>-</span>
        </template>
        <template v-else-if="column.dataIndex === 'duration'">
          {{ fmtDuration(record.duration) }}
        </template>
        <template v-else-if="column.key === 'tags'">
          <a-tag v-for="tag in record.tags || []" :key="tag" style="margin-bottom: 2px">{{ tag }}</a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'active'">
          <a-switch
            :checked="record.active"
            :checked-children="t('common.on')"
            :un-checked-children="t('common.off')"
            @change="async (checked: any) => { await editScience({ id: record.id, active: checked }); message.success(t('common.saved')); load() }"
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

    <a-modal v-model:open="modalOpen" :title="editing ? t('science.editTitle') : t('science.addTitle')" width="680px" :confirm-loading="saving" @ok="submit">
      <a-form layout="vertical" style="margin-top: 12px">
        <a-form-item :label="t('science.title')">
          <a-input v-model:value="form.title" />
        </a-form-item>
        <a-row :gutter="12">
          <a-col :span="8">
            <a-form-item :label="t('science.type')">
              <a-select v-model:value="form.type" :options="[{ label: t('science.typeVideo'), value: 'video' }, { label: t('science.typeArticle'), value: 'article' }]" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('science.durationSeconds')">
              <a-input-number v-model:value="form.duration" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('science.source')">
              <a-input v-model:value="form.source" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item :label="t('science.cover')">
          <div class="upload-row">
            <a-input v-model:value="form.cover" placeholder="/storage/..." />
            <a-upload :show-upload-list="false" :custom-request="(o: any) => customUpload(o, 'cover')" accept="image/*">
              <a-button :loading="uploading">{{ t('science.upload') }}</a-button>
            </a-upload>
          </div>
        </a-form-item>
        <a-form-item v-if="form.type === 'video'" :label="t('science.mediaUrl')">
          <div class="upload-row">
            <a-input v-model:value="form.media_url" placeholder="/storage/... 或 https://..." />
            <a-upload :show-upload-list="false" :custom-request="(o: any) => customUpload(o, 'media_url')" accept="video/*">
              <a-button :loading="uploading">{{ t('science.upload') }}</a-button>
            </a-upload>
          </div>
        </a-form-item>
        <a-form-item v-if="form.type === 'article'" :label="t('science.body')">
          <a-textarea v-model:value="form.body" :rows="6" />
        </a-form-item>
        <a-form-item :label="t('science.tags')">
          <a-select v-model:value="form.tags" mode="tags" :options="['plaque-risk','cleaning-advice','gingival-bleeding','crowding','profile','kids-ortho','checkup'].map((x) => ({ label: x, value: x }))" />
        </a-form-item>
        <a-row :gutter="12">
          <a-col :span="8">
            <a-form-item :label="t('science.sort')">
              <a-input-number v-model:value="form.sort" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('science.active')">
              <a-switch v-model:checked="form.active" />
            </a-form-item>
          </a-col>
        </a-row>
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
.upload-row {
  display: flex;
  gap: 8px;
}
</style>
