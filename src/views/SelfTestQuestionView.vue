<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import {
  listTemplates,
  listQuestions,
  addQuestion,
  editQuestion,
  deleteQuestions,
  type SelfTestTemplate,
  type SelfTestQuestion,
  type SelfTestOption,
} from '../api/selftest'

const { t } = useI18n()

//维度选项（与后端 SelfTestDimension 一致）
const dimensionOptions = [
  { label: 'General', value: 'general' },
  { label: 'Cleaning', value: 'cleaning' },
  { label: 'Gum', value: 'gum' },
  { label: 'Alignment', value: 'alignment' },
  { label: 'Bite', value: 'bite' },
  { label: 'Aesthetic', value: 'aesthetic' },
]

const templates = ref<SelfTestTemplate[]>([])
const templateId = ref<string>('')
const questions = ref<SelfTestQuestion[]>([])
const loading = ref(false)

const currentTemplate = computed(() => templates.value.find((x) => x.id === templateId.value))

const columns = [
  { title: t('selftest.question.sort'), dataIndex: 'sort', width: 70 },
  { title: t('selftest.question.title'), dataIndex: 'title', ellipsis: true },
  { title: t('selftest.question.dimension'), dataIndex: 'dimension', width: 110 },
  { title: t('selftest.question.optionCount'), key: 'optionCount', width: 90 },
  { title: t('selftest.question.active'), dataIndex: 'active', width: 80 },
  { title: t('common.actions'), key: 'actions', width: 140 },
]

async function loadTemplates() {
  const res = await listTemplates({ page: 1, page_size: 100 })
  templates.value = res.items ?? []
  if (templates.value.length > 0) {
    templateId.value = templates.value[0].id!
    await loadQuestions()
  }
}

async function loadQuestions() {
  if (!templateId.value) return
  loading.value = true
  try {
    const res = await listQuestions(templateId.value)
    questions.value = res.items ?? []
  } finally {
    loading.value = false
  }
}

//新增/编辑弹窗（含选项编辑）
const modalOpen = ref(false)
const saving = ref(false)
const editing = ref<SelfTestQuestion | null>(null)
const form = reactive({
  title: '',
  dimension: 'general',
  sort: 0,
  active: true,
  options: [] as SelfTestOption[],
})

function openAdd() {
  editing.value = null
  Object.assign(form, {
    title: '',
    dimension: 'general',
    sort: questions.value.length,
    active: true,
    options: [
      { label: '', score: 100, tags: [], sort: 0 },
      { label: '', score: 60, tags: [], sort: 1 },
    ],
  })
  modalOpen.value = true
}

function openEdit(record: SelfTestQuestion) {
  editing.value = record
  Object.assign(form, {
    title: record.title,
    dimension: record.dimension,
    sort: record.sort,
    active: record.active ?? true,
    options: (record.options ?? []).map((o) => ({
      id: o.id,
      label: o.label,
      score: o.score,
      tags: [...(o.tags ?? [])],
      sort: o.sort,
    })),
  })
  modalOpen.value = true
}

function addOptionRow() {
  form.options.push({ label: '', score: 100, tags: [], sort: form.options.length })
}

function removeOptionRow(index: number) {
  form.options.splice(index, 1)
}

async function submit() {
  if (form.options.some((o) => !o.label)) {
    message.warning(t('selftest.question.optionLabelRequired'))
    return
  }
  saving.value = true
  try {
    const payload = {
      title: form.title,
      dimension: form.dimension,
      sort: form.sort,
      active: form.active,
      options: form.options.map((o, i) => ({ label: o.label, score: o.score, tags: o.tags ?? [], sort: i })),
    }
    if (editing.value?.id) {
      await editQuestion({ id: editing.value.id, ...payload })
    } else {
      await addQuestion({ template_id: templateId.value, ...payload })
    }
    message.success(t('common.saved'))
    modalOpen.value = false
    loadQuestions()
  } finally {
    saving.value = false
  }
}

function onDelete(record: SelfTestQuestion) {
  Modal.confirm({
    title: t('common.deleteConfirm'),
    onOk: async () => {
      await deleteQuestions([record.id!])
      message.success(t('common.deleted'))
      loadQuestions()
    },
  })
}

onMounted(loadTemplates)
</script>

<template>
  <a-card :bordered="false" class="page-card">
    <div class="page-toolbar">
      <a-select v-model:value="templateId" style="width: 260px" :options="templates.map((x) => ({ label: x.name, value: x.id }))" @change="loadQuestions" />
      <a-button type="primary" :disabled="!templateId" @click="openAdd">{{ t('common.add') }}</a-button>
    </div>

    <a-alert v-if="currentTemplate" :message="`${currentTemplate.name} · ${t('selftest.question.count', questions.length)}`" type="info" show-icon style="margin-bottom: 12px" />

    <a-table :columns="columns" :data-source="questions" :loading="loading" row-key="id" :pagination="false">
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'dimension'">
          <a-tag>{{ record.dimension }}</a-tag>
        </template>
        <template v-else-if="column.key === 'optionCount'">
          {{ record.options?.length ?? 0 }}
        </template>
        <template v-else-if="column.dataIndex === 'active'">
          <a-tag :color="record.active ? 'green' : 'red'">{{ record.active ? t('common.yes') : t('common.no') }}</a-tag>
        </template>
        <template v-else-if="column.key === 'actions'">
          <a-space>
            <a @click="openEdit(record)">{{ t('common.edit') }}</a>
            <a class="danger" @click="onDelete(record)">{{ t('common.delete') }}</a>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="modalOpen"
      :title="editing ? t('selftest.question.editTitle') : t('selftest.question.addTitle')"
      width="680px"
      :confirm-loading="saving"
      @ok="submit"
    >
      <a-form layout="vertical" style="margin-top: 12px">
        <a-form-item :label="t('selftest.question.title')">
          <a-input v-model:value="form.title" />
        </a-form-item>
        <a-row :gutter="12">
          <a-col :span="8">
            <a-form-item :label="t('selftest.question.dimension')">
              <a-select v-model:value="form.dimension" :options="dimensionOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('selftest.question.sort')">
              <a-input-number v-model:value="form.sort" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('selftest.question.active')">
              <a-switch v-model:checked="form.active" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item :label="t('selftest.question.options')">
          <div v-for="(option, index) in form.options" :key="index" class="option-row">
            <a-input v-model:value="option.label" :placeholder="t('selftest.question.optionLabel')" style="width: 220px" />
            <a-input-number v-model:value="option.score" :min="0" :max="100" style="width: 100px" />
            <a-select
              v-model:value="option.tags"
              mode="tags"
              style="flex: 1"
              :placeholder="t('selftest.question.optionTags')"
              :options="['plaque-risk','cleaning-advice','gingival-bleeding','crowding','profile','kids-ortho','checkup'].map((x) => ({ label: x, value: x }))"
            />
            <a class="danger" @click="removeOptionRow(index)">{{ t('common.delete') }}</a>
          </div>
          <a-button type="dashed" block @click="addOptionRow">+ {{ t('selftest.question.addOption') }}</a-button>
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
.option-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}
</style>
