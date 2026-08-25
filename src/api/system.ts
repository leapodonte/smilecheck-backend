import http from './http'
import type { Paged } from './selftest'

// ===================== 管理员帐号 =====================

export interface Account {
  id?: string | null
  name?: string | null
  nickname?: string | null
  avatar?: string | null
  active?: boolean | null
  created_at?: number
  updated_at?: number
}

export function listAccounts(params: { search?: string; page: number; page_size: number }) {
  return http.post<never, Paged<Account>>('/account/list', params)
}

export function addAccount(data: { name: string; nickname: string; password: string; active: boolean }) {
  return http.post<never, { item: Account }>('/account/add', data)
}

export function editAccount(data: Partial<Account> & { id: string; password?: string }) {
  return http.post('/account/edit', data)
}

export function deleteAccounts(ids: string[]) {
  return http.post('/account/delete', { ids })
}

// ===================== 角色 =====================

export interface Role {
  id: string
  name: string
  visible?: boolean
}

export function listRoles(params: { search?: string; page: number; page_size: number }) {
  return http.post<never, Paged<Role>>('/role/list', params)
}

export function addRole(data: { name: string; visible: boolean }) {
  return http.post('/role/add', data)
}

export function editRole(data: { id: string; name?: string; visible?: boolean }) {
  return http.post('/role/update', data)
}

export function deleteRoles(ids: string[]) {
  return http.post('/role/delete', { ids })
}

/** 角色模块权限（含 actions） */
export function getRoleModules(roleId: string) {
  return http.post<never, { items: ModuleNode[] }>('/role/get-modules', { role_id: roleId })
}

/** 设置角色模块权限（整存） */
export function setRoleModules(roleId: string, items: { mod_id: string; actions: string[] }[]) {
  return http.post('/role/set-modules', { role_id: roleId, items })
}

/** 帐号的角色列表 */
export function accountRoles(accId: string) {
  return http.post<never, { items: Role[] | null }>('/role/account-roles', { acc_id: accId })
}

/** 设置帐号角色 */
export function setAccountRoles(accId: string, roleIds: string[]) {
  return http.post('/role/set-account-roles', { acc_id: accId, role_ids: roleIds })
}

// ===================== 模块 =====================

export interface ModuleNode {
  id: string
  parent_id?: string | null
  name?: string | null
  visible?: boolean
  order?: number | null
  path?: string | null
  actions?: string[] | null
  children?: ModuleNode[] | null
}

export function listModules() {
  return http.post<never, ModuleNode[]>('/module/list', {})
}

export function updateModules(modules: ModuleNode[]) {
  return http.post('/module/update', { modules })
}

/** 帐号自身模块权限 */
export function accountModules(accId: string) {
  return http.post<never, { modules: ModuleNode[] | null }>('/module/account-modules', { acc_id: accId })
}

/** 帐号模块权限（含角色合并结果） */
export function combinedModules(accId: string) {
  return http.post<never, { modules: ModuleNode[] | null }>('/module/combined-modules', { acc_id: accId })
}

/** 设置帐号模块权限（整存） */
export function setAccountModules(accId: string, items: { mod_id: string; actions: string[] }[]) {
  return http.post('/module/set-account-modules', { acc_id: accId, items })
}

// ===================== 系统配置 =====================

export interface SystemOption {
  name: string
  value: string
  desc?: string | null
  visible?: boolean
}

export function listOptions(params: { search?: string }) {
  return http.post<never, { items?: SystemOption[] | null }>('/systemoption/list', params)
}

export function addOption(data: { name: string; value: string; desc?: string }) {
  return http.post<never, { item: SystemOption }>('/systemoption/add', data)
}

export function editOption(data: { name: string; value?: string; desc?: string }) {
  return http.post<never, { item: SystemOption }>('/systemoption/edit', data)
}

export function deleteOptions(names: string[]) {
  return http.post('/systemoption/delete', { names })
}
