<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import enUS from 'ant-design-vue/es/locale/en_US'

const { t, locale } = useI18n()

// Antd 组件库内置文案跟随当前语言
const antdLocale = computed(() => (locale.value === 'zh-Hans' ? zhCN : enUS))
</script>

<template>
  <a-config-provider :locale="antdLocale">
    <div class="app-entry">{{ t('common.appName') }}</div>
  </a-config-provider>
</template>

<style scoped>
.app-entry {
  padding: 48px 0;
  text-align: center;
  font-size: 20px;
}
</style>
