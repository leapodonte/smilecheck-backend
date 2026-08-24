import { createI18n } from 'vue-i18n'
import zhHans from './zh-Hans'
import enUs from './en-US'

// 语言选择持久化到 localStorage，默认中文
const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || 'zh-Hans',
  fallbackLocale: 'zh-Hans',
  messages: {
    'zh-Hans': zhHans,
    'en-US': enUs,
  },
})

export default i18n
