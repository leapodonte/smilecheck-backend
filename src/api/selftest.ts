import http from './http'

// ===================== 自测模板/题目 =====================

export interface SelfTestTemplate {
  id?: string | null
  code?: string | null
  name?: string | null
  description?: string | null
  duration_minutes: number
  cover?: string | null
  sort: number
  active?: boolean | null
  question_count?: number
  created_at?: number
  updated_at?: number
}

export interface SelfTestOption {
  id?: string | null
  label: string
  score: number
  tags?: string[]
  sort: number
}

export interface SelfTestQuestion {
  id?: string | null
  template_id?: string | null
  title: string
  dimension: string
  sort: number
  active?: boolean | null
  options?: SelfTestOption[]
}

export interface Paged<T> {
  total?: number | null
  items?: T[] | null
}

export function listTemplates(params: { search?: string; page: number; page_size: number }) {
  return http.post<never, Paged<SelfTestTemplate>>('/selftest/template-list', params)
}

export function addTemplate(data: Partial<SelfTestTemplate>) {
  return http.post<never, { item: SelfTestTemplate }>('/selftest/template-add', data)
}

export function editTemplate(data: Partial<SelfTestTemplate>) {
  return http.post('/selftest/template-edit', data)
}

export function deleteTemplates(ids: string[]) {
  return http.post('/selftest/template-delete', { ids })
}

export function listQuestions(templateId: string) {
  return http.post<never, { items: SelfTestQuestion[] | null }>('/selftest/question-list', {
    template_id: templateId,
  })
}

export function addQuestion(data: Partial<SelfTestQuestion> & { template_id: string }) {
  return http.post<never, { item: SelfTestQuestion }>('/selftest/question-add', data)
}

export function editQuestion(data: Partial<SelfTestQuestion> & { id: string }) {
  return http.post('/selftest/question-edit', data)
}

export function deleteQuestions(ids: string[]) {
  return http.post('/selftest/question-delete', { ids })
}

// ===================== 微笑类型 =====================

export interface SmileType {
  id?: string | null
  code?: string | null
  category: string
  dimension: string
  name: string
  description: string
  tags?: string[]
  min_score?: number | null
  max_score?: number | null
  require_tags?: string[]
  sort: number
  active?: boolean | null
}

export function listSmileTypes(params: { search?: string; category?: string; page: number; page_size: number }) {
  return http.post<never, Paged<SmileType>>('/smiletype/list', params)
}

export function addSmileType(data: Partial<SmileType>) {
  return http.post<never, { item: SmileType }>('/smiletype/add', data)
}

export function editSmileType(data: Partial<SmileType> & { id: string }) {
  return http.post('/smiletype/edit', data)
}

export function deleteSmileTypes(ids: string[]) {
  return http.post('/smiletype/delete', { ids })
}

// ===================== 科普内容 =====================

export interface ScienceContent {
  id?: string | null
  title: string
  type: string
  cover?: string | null
  media_url?: string | null
  body?: string | null
  duration: number
  source?: string | null
  tags?: string[]
  sort: number
  active?: boolean | null
}

export function listScience(params: { search?: string; type?: string; tag?: string; page: number; page_size: number }) {
  return http.post<never, Paged<ScienceContent>>('/science/list', params)
}

export function getScience(id: string) {
  return http.post<never, { item: ScienceContent }>('/science/get', { id })
}

export function addScience(data: Partial<ScienceContent>) {
  return http.post<never, { item: ScienceContent }>('/science/add', data)
}

export function editScience(data: Partial<ScienceContent> & { id: string }) {
  return http.post('/science/edit', data)
}

export function deleteScience(ids: string[]) {
  return http.post('/science/delete', { ids })
}

// ===================== 推荐规则 =====================

export interface RecommendRule {
  id?: string | null
  tag_code: string
  name: string
  sort: number
  active?: boolean | null
  contents?: ScienceContent[] | null
}

export function listRules() {
  return http.post<never, Paged<RecommendRule>>('/recommend/rule-list', { page: 1, page_size: 100 })
}

export function addRule(data: Partial<RecommendRule>) {
  return http.post<never, { item: RecommendRule }>('/recommend/rule-add', data)
}

export function editRule(data: Partial<RecommendRule> & { id: string }) {
  return http.post('/recommend/rule-edit', data)
}

export function deleteRules(ids: string[]) {
  return http.post('/recommend/rule-delete', { ids })
}

export function setRuleItems(ruleId: string, contentIds: string[]) {
  return http.post('/recommend/set-items', { rule_id: ruleId, content_ids: contentIds })
}

// ===================== 用户/授权/任务 =====================

export interface AppUser {
  id?: string | null
  nickname?: string | null
  avatar?: string | null
  type: string
  state: string
  phone?: string | null
  openid?: string | null
  created_at?: number
}

export interface ReportBrief {
  id?: string | null
  record_id?: string | null
  template_name?: string | null
  total_score: number
  grade: string
  smile_type_name?: string | null
  tags?: string[]
  created_at: number
}

export function listAppUsers(params: { search?: string; type?: string; state?: string; page: number; page_size: number }) {
  return http.post<never, Paged<AppUser>>('/appuser/list', params)
}

export function getAppUser(id: string) {
  return http.post<never, { item: AppUser }>('/appuser/get', { id })
}

export function editAppUser(data: { id: string; nickname?: string; state?: string }) {
  return http.post('/appuser/edit', data)
}

export function userReports(userId: string, page: number, page_size: number) {
  return http.post<never, Paged<ReportBrief>>('/appuser/reports', { user_id: userId, page, page_size })
}

// ===================== 报告详情（问答/照片/评测结果） =====================

export interface ReportDimension {
  key: string
  name: string
  score: number
  level: string
  desc: string
  ref?: boolean
}

export interface AdminAnswerItem {
  sort: number
  question_title?: string | null
  dimension?: string | null
  option_label?: string | null
  option_tags?: string[] | null
  option_score: number
}

export interface AdminPhoto {
  slot?: string | null
  url?: string | null
  created_at: number
}

export interface AdminReportDetail {
  report_id?: string | null
  record_id?: string | null
  user_id?: string | null
  template_name?: string | null
  record_created_at: number
  total_score: number
  grade?: string | null
  smile_type?: { code?: string | null; name?: string | null; description?: string | null; tags?: string[] | null } | null
  dimensions?: ReportDimension[] | null
  tags?: string[] | null
  suggestions?: { icon: string; title: string; desc: string }[] | null
  ai_result?: Record<string, unknown> | null
  disclaimer_version?: string | null
  answers?: AdminAnswerItem[] | null
  photos?: AdminPhoto[] | null
}

export function adminReportDetail(reportId: string) {
  return http.post<never, AdminReportDetail>('/appuser/report-detail', { report_id: reportId })
}

export interface UserConsent {
  id?: string | null
  user_id?: string | null
  user_nickname?: string | null
  user_phone?: string | null
  type: string
  version: string
  granted: boolean
  created_at: number
}

export function listConsents(params: { user_id?: string; type?: string; page: number; page_size: number }) {
  return http.post<never, Paged<UserConsent>>('/consent/list', params)
}

export interface AnalysisTask {
  id?: string | null
  record_id?: string | null
  template_name?: string | null
  user_nickname?: string | null
  status: string
  progress: number
  stage?: string | null
  error?: string | null
  provider?: string | null
  report_id?: string | null
  created_at: number
  updated_at: number
}

export function listTasks(params: { status?: string; page: number; page_size: number }) {
  return http.post<never, Paged<AnalysisTask>>('/task/list', params)
}

export function retryTask(id: string) {
  return http.post('/task/retry', { id })
}
