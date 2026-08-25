<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { SmileOutlined } from '@ant-design/icons-vue'
import { useAuthStore } from '../stores/auth'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const loading = ref(false)
const form = reactive({ username: '', password: '' })

async function submit() {
  if (!form.username || !form.password) {
    message.warning(t('login.required'))
    return
  }
  loading.value = true
  try {
    await auth.login(form.username, form.password)
    message.success(t('login.success'))
    const redirect = (route.query.redirect as string) || '/welcome'
    router.push(redirect)
  } catch {
    //错误提示由 http 层统一处理
  } finally {
    loading.value = false
  }
}

const locales = [
  { value: 'zh-Hans', label: '中文' },
  { value: 'en-US', label: 'English' },
]
function switchLocale(value: string) {
  locale.value = value
  localStorage.setItem('locale', value)
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-brand">
        <smile-outlined class="login-brand-icon" />
        <div class="login-brand-text">SmileCheckAI</div>
        <div class="login-brand-sub">{{ t('common.appName') }}</div>
      </div>

      <a-form layout="vertical" @submit.prevent>
        <a-form-item :label="t('login.username')">
          <a-input v-model:value="form.username" :placeholder="t('login.usernamePlaceholder')" size="large" @press-enter="submit" />
        </a-form-item>
        <a-form-item :label="t('login.password')">
          <a-input-password v-model:value="form.password" :placeholder="t('login.passwordPlaceholder')" size="large" @press-enter="submit" />
        </a-form-item>
        <a-button type="primary" block size="large" :loading="loading" class="login-btn" @click="submit">
          {{ t('login.submit') }}
        </a-button>
      </a-form>

      <div class="login-footer">
        <a-select :value="locale" size="small" style="width: 100px" :options="locales" @change="switchLocale" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ecebfa 0%, #dfe7fb 100%);
}
.login-card {
  width: 380px;
  background: #fff;
  border-radius: 16px;
  padding: 40px 36px 24px;
  box-shadow: 0 8px 32px rgba(123, 108, 246, 0.12);
}
.login-brand {
  text-align: center;
  margin-bottom: 28px;
}
.login-brand-icon {
  font-size: 40px;
  color: #7b6cf6;
}
.login-brand-text {
  font-size: 22px;
  font-weight: 700;
  margin-top: 8px;
}
.login-brand-sub {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}
.login-btn {
  background: linear-gradient(90deg, #7b6cf6, #5b8def);
  border: none;
  margin-top: 8px;
}
.login-footer {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>
