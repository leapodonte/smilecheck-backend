import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiLogin, apiLogout, apiCurrentUserModules, apiCurrentUser, type ModuleNode, type AccountInfo } from '../api/modules'
import { SESSION_KEY } from '../api/http'
import { signPassword } from '../utils/sign'

/**
 * 登录会话状态
 */
export const useAuthStore = defineStore('auth', () => {
  const session = ref<string | null>(localStorage.getItem(SESSION_KEY))
  const account = ref<AccountInfo | null>(null)
  const modules = ref<ModuleNode[]>([])

  const loggedIn = computed(() => !!session.value)

  function setSession(id: string) {
    session.value = id
    localStorage.setItem(SESSION_KEY, id)
  }

  /** 登录（密码在前端做客户端侧签名后提交） */
  async function login(username: string, password: string) {
    const res = await apiLogin(username, signPassword(password))
    setSession(res.session)
    await fetchCurrentUser()
    await fetchModules()
  }

  async function fetchCurrentUser() {
    const res = await apiCurrentUser()
    account.value = res.account ?? null
  }

  async function fetchModules() {
    const res = await apiCurrentUserModules()
    modules.value = res.modules ?? []
  }

  async function logout() {
    try {
      await apiLogout()
    } catch {
      //忽略登出接口异常，本地照常清理
    }
    session.value = null
    account.value = null
    modules.value = []
    localStorage.removeItem(SESSION_KEY)
  }

  return { session, account, modules, loggedIn, login, logout, fetchCurrentUser, fetchModules }
})
