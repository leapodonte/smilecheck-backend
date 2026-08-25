<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SmileOutlined } from '@ant-design/icons-vue'

const { t } = useI18n()
</script>

<template>
  <a-card class="welcome-card">
    <div class="welcome-inner">
      <smile-outlined class="welcome-icon" />
      <h2>{{ t('welcome.title') }}</h2>
      <p>{{ t('welcome.desc') }}</p>
    </div>
  </a-card>
</template>

<style scoped>
.welcome-card {
  border-radius: 16px;
}
.welcome-inner {
  text-align: center;
  padding: 48px 0;
}
.welcome-icon {
  font-size: 56px;
  color: #7b6cf6;
}
.welcome-inner h2 {
  margin-top: 16px;
}
.welcome-inner p {
  color: #999;
}
</style>
