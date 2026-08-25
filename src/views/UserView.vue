<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import {
  listAppUsers,
  editAppUser,
  userReports,
  adminReportDetail,
  type AppUser,
  type ReportBrief,
  type AdminReportDetail,
} from '../api/selftest'
import { resolveUrl } from '../api/http'
import { usePagedList } from '../composables/usePagedList'

const { t } = useI18n()
const { items, loading, search, pagination, load, handleTableChange, doSearch } = usePagedList<AppUser>(listAppUsers)

const columns = [
  { title: t('user.nickname'), dataIndex: 'nickname', width: 160 },
  { title: t('user.phone'), dataIndex: 'phone', width: 140 },
  { title: t('user.type'), dataIndex: 'type', width: 120 },
  { title: t('user.state'), dataIndex: 'state', width: 100 },
  { title: t('user.openid'), dataIndex: 'openid', ellipsis: true },
  { title: t('user.createdAt'), dataIndex: 'created_at', width: 180 },
  { title: t('common.actions'), key: 'actions', width: 160 },
]

//报告列表抽屉
const drawerOpen = ref(false)
const drawerUser = ref<AppUser | null>(null)
const reports = ref<ReportBrief[]>([])
const reportsLoading = ref(false)
const reportColumns = [
  { title: t('user.reportTemplate'), dataIndex: 'template_name' },
  { title: t('user.reportScore'), dataIndex: 'total_score', width: 90 },
  { title: t('user.reportGrade'), dataIndex: 'grade', width: 90 },
  { title: t('user.reportSmileType'), dataIndex: 'smile_type_name', width: 140 },
  { title: t('user.reportDate'), dataIndex: 'created_at', width: 170 },
  { title: t('common.actions'), key: 'actions', width: 70 },
]

async function openDetail(record: AppUser) {
  drawerUser.value = record
  drawerOpen.value = true
  reportsLoading.value = true
  try {
    const res = await userReports(record.id!, 1, 50)
    reports.value = res.items ?? []
  } finally {
    reportsLoading.value = false
  }
}

//报告详情抽屉（评测结果 + 问答 + 照片）
const detailOpen = ref(false)
const detailLoading = ref(false)
const detail = ref<AdminReportDetail | null>(null)

async function openReportDetail(record: ReportBrief) {
  detailOpen.value = true
  detailLoading.value = true
  detail.value = null
  try {
    detail.value = await adminReportDetail(record.id!)
  } finally {
    detailLoading.value = false
  }
}

const gradeColor: Record<string, string> = {
  excellent: 'gold',
  good: 'green',
  fair: 'blue',
  attention: 'red',
}

function levelColor(level: string): string {
  return level === 'good' ? '#52c41a' : level === 'fair' ? '#faad14' : '#ff4d4f'
}

function slotLabel(slot?: string | null): string {
  return t(`user.slot_${slot}`)
}

async function toggleState(record: AppUser) {
  const next = record.state === 'active' ? 'disabled' : 'active'
  await editAppUser({ id: record.id!, state: next })
  message.success(t('common.saved'))
  load()
}

function fmtTime(ts?: number) {
  return ts ? new Date(ts * 1000).toLocaleString() : '-'
}

onMounted(load)
</script>

<template>
  <a-card :bordered="false" class="page-card">
    <div class="page-toolbar">
      <a-input-search v-model:value="search" :placeholder="t('user.searchPlaceholder')" style="width: 280px" @search="doSearch" />
    </div>

    <a-table :columns="columns" :data-source="items" :loading="loading" row-key="id" :pagination="pagination" @change="handleTableChange">
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'type'">
          <a-tag :color="record.type === 'client' ? 'blue' : 'green'">{{ record.type === 'client' ? t('user.typeClient') : t('user.typeWechat') }}</a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'state'">
          <a-tag :color="record.state === 'active' ? 'green' : 'red'">{{ record.state === 'active' ? t('common.enabled') : t('common.disabled') }}</a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'created_at'">
          {{ fmtTime(record.created_at) }}
        </template>
        <template v-else-if="column.key === 'actions'">
          <a-space>
            <a @click="openDetail(record)">{{ t('user.reports') }}</a>
            <a :class="{ danger: record.state === 'active' }" @click="toggleState(record)">
              {{ record.state === 'active' ? t('user.disable') : t('user.enable') }}
            </a>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 报告列表抽屉 -->
    <a-drawer v-model:open="drawerOpen" :title="`${drawerUser?.nickname ?? ''} · ${t('user.reports')}`" width="680">
      <a-table
        :columns="reportColumns"
        :data-source="reports"
        :loading="reportsLoading"
        row-key="id"
        :pagination="false"
        :custom-row="(record: ReportBrief) => ({ onClick: () => openReportDetail(record), style: { cursor: 'pointer' } })"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'grade'">
            <a-tag :color="gradeColor[record.grade]">{{ t(`report.grade_${record.grade}`) }}</a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'created_at'">
            {{ fmtTime(record.created_at) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <a @click.stop="openReportDetail(record)">{{ t('user.view') }}</a>
          </template>
        </template>
      </a-table>
    </a-drawer>

    <!-- 报告详情抽屉 -->
    <a-drawer v-model:open="detailOpen" :title="`${detail?.template_name ?? ''} · ${t('user.reportDetailTitle')}`" width="760">
      <a-spin :spinning="detailLoading">
        <template v-if="detail">
          <!-- 评测结果 -->
          <h3 class="rd-section">{{ t('user.rdResult') }}</h3>
          <div class="rd-head">
            <div class="rd-score">
              <span class="rd-score-num">{{ detail.total_score }}</span>
              <span class="rd-score-total">/100</span>
            </div>
            <a-tag :color="gradeColor[detail.grade ?? '']" class="rd-grade">{{ t(`report.grade_${detail.grade}`) }}</a-tag>
            <div class="rd-smile">
              <div class="rd-smile-label">{{ t('user.rdSmileType') }}</div>
              <div class="rd-smile-name">{{ detail.smile_type?.name }}</div>
              <div class="rd-smile-desc">{{ detail.smile_type?.description }}</div>
            </div>
          </div>
          <div class="rd-tags">
            <a-tag v-for="tag in detail.tags ?? []" :key="tag" color="purple">{{ tag }}</a-tag>
          </div>

          <div class="rd-dims">
            <div class="rd-dim" v-for="dim in detail.dimensions ?? []" :key="dim.key">
              <div class="rd-dim-head">
                <span class="rd-dim-name">{{ dim.name }}</span>
                <span :style="{ color: levelColor(dim.level) }">{{ t(`report.level_${dim.level}`) }}</span>
                <span class="rd-dim-score">{{ dim.score }}</span>
              </div>
              <a-progress :percent="dim.score" :show-info="false" :stroke-color="levelColor(dim.level)" size="small" />
              <div class="rd-dim-desc">{{ dim.desc }}<span v-if="dim.ref">（{{ t('user.rdRef') }}）</span></div>
            </div>
          </div>

          <div class="rd-sugs">
            <div class="rd-sug" v-for="(sug, i) in detail.suggestions ?? []" :key="i">
              <span class="rd-sug-title">{{ sug.title }}</span>
              <span class="rd-sug-desc">{{ sug.desc }}</span>
            </div>
          </div>

          <a-collapse v-if="detail.ai_result" class="rd-collapse">
            <a-collapse-panel key="ai" :header="t('user.rdAiResult')">
              <pre class="rd-json">{{ JSON.stringify(detail.ai_result, null, 2) }}</pre>
            </a-collapse-panel>
          </a-collapse>

          <!-- 问答记录 -->
          <h3 class="rd-section">{{ t('user.rdAnswers') }}</h3>
          <div class="rd-answer" v-for="answer in detail.answers ?? []" :key="answer.sort">
            <div class="rd-answer-q">
              <span class="rd-answer-no">{{ answer.sort }}.</span>
              {{ answer.question_title }}
              <a-tag style="margin-left: 8px">{{ answer.dimension }}</a-tag>
            </div>
            <div class="rd-answer-a">
              <span class="rd-answer-label">{{ t('user.rdAnswer') }}：</span>{{ answer.option_label }}
              <span class="rd-answer-score">（{{ t('user.rdOptionScore') }} {{ answer.option_score }}）</span>
              <a-tag v-for="tag in answer.option_tags ?? []" :key="tag" style="margin-left: 4px">{{ tag }}</a-tag>
            </div>
          </div>

          <!-- 照片 -->
          <h3 class="rd-section">{{ t('user.rdPhotos') }}</h3>
          <a-empty v-if="!detail.photos?.length" :description="t('user.rdNoPhotos')" />
          <div class="rd-photos" v-else>
            <div class="rd-photo" v-for="(photo, idx) in detail.photos" :key="idx">
              <a-image :src="resolveUrl(photo.url)" :width="200" :height="150" style="object-fit: cover; border-radius: 8px" />
              <div class="rd-photo-slot">{{ slotLabel(photo.slot) }}</div>
            </div>
          </div>
        </template>
      </a-spin>
    </a-drawer>
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
.rd-section {
  margin: 8px 0 12px;
  font-weight: 700;
  border-left: 3px solid #7b6cf6;
  padding-left: 8px;
}
.rd-head {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f7f6fc;
  border-radius: 8px;
  padding: 12px 16px;
}
.rd-score-num {
  font-size: 40px;
  font-weight: 800;
  color: #7b6cf6;
}
.rd-score-total {
  color: #999;
  margin-left: 4px;
}
.rd-grade {
  font-size: 14px;
  padding: 4px 12px;
}
.rd-smile {
  margin-left: auto;
  text-align: right;
}
.rd-smile-label {
  color: #999;
  font-size: 12px;
}
.rd-smile-name {
  font-size: 20px;
  font-weight: 800;
  color: #5b4ee0;
}
.rd-smile-desc {
  color: #999;
  font-size: 12px;
}
.rd-tags {
  margin: 12px 0;
}
.rd-dim {
  margin-bottom: 10px;
}
.rd-dim-head {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 13px;
}
.rd-dim-name {
  font-weight: 600;
  width: 60px;
}
.rd-dim-score {
  margin-left: auto;
  color: #666;
}
.rd-dim-desc {
  color: #999;
  font-size: 12px;
  margin-top: -4px;
}
.rd-sugs {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.rd-sug {
  background: #fdf2f6;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 13px;
}
.rd-sug-title {
  font-weight: 700;
  margin-right: 12px;
}
.rd-sug-desc {
  color: #666;
}
.rd-collapse {
  margin-top: 12px;
}
.rd-json {
  background: #f6f6f9;
  padding: 8px;
  border-radius: 6px;
  font-size: 12px;
  max-height: 260px;
  overflow: auto;
}
.rd-answer {
  padding: 10px 12px;
  border-radius: 8px;
  background: #fafafc;
  margin-bottom: 8px;
}
.rd-answer-q {
  font-weight: 600;
}
.rd-answer-no {
  color: #7b6cf6;
  margin-right: 4px;
}
.rd-answer-a {
  margin-top: 6px;
  color: #333;
}
.rd-answer-label {
  color: #999;
}
.rd-answer-score {
  color: #999;
  font-size: 12px;
}
.rd-photos {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.rd-photo {
  text-align: center;
}
.rd-photo-slot {
  margin-top: 6px;
  color: #666;
  font-size: 13px;
}
</style>
