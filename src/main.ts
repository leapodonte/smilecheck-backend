import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import './style.css'
import App from './App.vue'
import i18n from './locales'
import router from './router'

createApp(App).use(createPinia()).use(router).use(i18n).use(Antd).mount('#app')
