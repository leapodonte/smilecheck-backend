import http from './http'

/**
 * 模块（菜单）节点
 */
export interface ModuleNode {
  id: string
  parent_id?: string | null
  name: string
  visible?: boolean
  order?: number
  path: string
  actions?: string[]
  children?: ModuleNode[] | null
}

export interface AccountInfo {
  id?: string | null
  name?: string | null
  nickname?: string | null
  avatar?: string | null
  active?: boolean | null
}

/** 登录 */
export function apiLogin(username: string, password: string) {
  return http.post<never, { session: string; fcp?: boolean }>('/auth/login', {
    username,
    password,
  })
}

/** 退出登录 */
export function apiLogout() {
  return http.post('/auth/logout', {})
}

/** 当前登录用户信息 */
export function apiCurrentUser() {
  return http.post<never, { account: AccountInfo; fcp?: boolean }>('/auth/current-user', {})
}

/** 当前用户模块权限（菜单树） */
export function apiCurrentUserModules() {
  return http.post<never, { modules: ModuleNode[] | null }>('/auth/current-user-modules', {})
}

/** 修改密码 */
export function apiChangePwd(oldPwd: string, newPwd: string) {
  return http.post('/auth/change-pwd', { old_pwd: oldPwd, new_pwd: newPwd })
}
