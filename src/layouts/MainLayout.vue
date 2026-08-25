<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Modal, message } from 'ant-design-vue'
import {
  HomeOutlined,
  AppstoreOutlined,
  TeamOutlined,
  UserOutlined,
  FileDoneOutlined,
  SmileOutlined,
  ReadOutlined,
  ShareAltOutlined,
  SolutionOutlined,
  SafetyCertificateOutlined,
  RocketOutlined,
  ToolOutlined,
  DownOutlined,
  LogoutOutlined,
  KeyOutlined,
} from '@ant-design/icons-vue'
import { useAuthStore } from '../stores/auth'
import { apiChangePwd } from '../api/modules'
import { signPassword } from '../utils/sign'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const collapsed = ref(false)
const selectedKeys = ref<string[]>([])
const openKeys = ref<string[]>([])

//模块图标映射（按 module.id）
const iconMap: Record<string, ReturnType<typeof h>> = {
  home: h(HomeOutlined),
  permission: h(AppstoreOutlined),
  module: h(AppstoreOutlined),
  role: h(TeamOutlined),
  corp: h(TeamOutlined),
  account: h(UserOutlined),
  selftest: h(FileDoneOutlined),
  template: h(FileDoneOutlined),
  question: h(FileDoneOutlined),
  smiletype: h(SmileOutlined),
  science: h(ReadOutlined),
  recommend: h(ShareAltOutlined),
  appuser: h(SolutionOutlined),
  consent: h(SafetyCertificateOutlined),
  task: h(RocketOutlined),
  options: h(ToolOutlined),
}

/** 菜单数据（接口返回的模块树） */
const menuItems = computed(() => {
  const build = (nodes: typeof auth.modules): any[] =>
    (nodes ?? [])
      .filter((n) => n.visible !== false)
      .map((n) => {
        const children = n.children?.length ? build(n.children) : undefined
        return {
          key: n.path,
          icon: iconMap[n.id],
          label: n.name,
          children: children?.length ? children : undefined,
        }
      })
  return build(auth.modules)
})

//根据当前路径选中菜单
function syncMenu() {
  const path = route.path
  selectedKeys.value = [path]
  const parent = auth.modules.find((m) => m.children?.some((c) => c.path === path))
  openKeys.value = parent ? [parent.path] : []
}

//语言切换
const locales = [
  { value: 'zh-Hans', label: '中文' },
  { value: 'en-US', label: 'English' },
]
function switchLocale(value: string) {
  locale.value = value
  localStorage.setItem('locale', value)
}

//修改密码弹窗
const pwdOpen = ref(false)
const pwdForm = ref({ old_pwd: '', new_pwd: '', confirm: '' })
const pwdLoading = ref(false)

function openPwdModal() {
  pwdForm.value = { old_pwd: '', new_pwd: '', confirm: '' }
  pwdOpen.value = true
}

async function submitPwd() {
  if (!pwdForm.value.old_pwd || !pwdForm.value.new_pwd) {
    message.warning(t('changePwd.required'))
    return
  }
  if (pwdForm.value.new_pwd !== pwdForm.value.confirm) {
    message.warning(t('changePwd.confirmMismatch'))
    return
  }
  pwdLoading.value = true
  try {
    await apiChangePwd(signPassword(pwdForm.value.old_pwd), signPassword(pwdForm.value.new_pwd))
    message.success(t('changePwd.success'))
    pwdOpen.value = false
  } finally {
    pwdLoading.value = false
  }
}

async function onLogout() {
  Modal.confirm({
    title: t('layout.logoutConfirm'),
    onOk: async () => {
      await auth.logout()
      router.push('/login')
    },
  })
}

onMounted(async () => {
  syncMenu()
  if (!auth.account) {
    await auth.fetchCurrentUser().catch(() => undefined)
  }
  if (auth.modules.length === 0) {
    await auth.fetchModules().catch(() => undefined)
  }
})
</script>

<template>
  <a-layout class="app-layout">
    <a-layout-sider v-model:collapsed="collapsed" collapsible breakpoint="lg" theme="light" class="app-sider">
      <div class="app-logo">
        <smile-outlined class="app-logo-icon" />
        <span v-if="!collapsed" class="app-logo-text">SmileCheckAI</span>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        v-model:openKeys="openKeys"
        mode="inline"
        :items="menuItems"
        @click="(e: any) => router.push(String(e.key))"
      />
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="app-header">
        <div class="app-header-title">{{ t('common.appName') }}</div>
        <div class="app-header-actions">
          <a-select
            :value="locale"
            size="small"
            style="width: 110px"
            :options="locales"
            @change="switchLocale"
          />
          <a-dropdown>
            <a-button size="small" type="text">
              <user-outlined />
              {{ auth.account?.nickname || 'admin' }}
              <down-outlined style="font-size: 10px" />
            </a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item key="pwd" @click="openPwdModal">
                  <key-outlined /> {{ t('layout.changePwd') }}
                </a-menu-item>
                <a-menu-item key="logout" @click="onLogout">
                  <logout-outlined /> {{ t('layout.logout') }}
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <a-layout-content class="app-content">
        <router-view />
      </a-layout-content>
    </a-layout>

    <a-modal v-model:open="pwdOpen" :title="t('layout.changePwd')" :confirm-loading="pwdLoading" @ok="submitPwd">
      <a-form layout="vertical" style="margin-top: 12px">
        <a-form-item :label="t('changePwd.oldPwd')">
          <a-input-password v-model:value="pwdForm.old_pwd" />
        </a-form-item>
        <a-form-item :label="t('changePwd.newPwd')">
          <a-input-password v-model:value="pwdForm.new_pwd" />
        </a-form-item>
        <a-form-item :label="t('changePwd.confirm')">
          <a-input-password v-model:value="pwdForm.confirm" />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-layout>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
}
.app-sider {
  border-right: 1px solid #f0f0f0;
}
.app-logo {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #7b6cf6;
  font-weight: 600;
}
.app-logo-icon {
  font-size: 22px;
}
.app-header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 48px;
  line-height: 48px;
  border-bottom: 1px solid #f0f0f0;
}
.app-header-title {
  font-size: 14px;
  color: #666;
}
.app-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.app-content {
  margin: 16px;
}
</style>
