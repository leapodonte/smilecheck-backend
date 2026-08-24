import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import './style.css'
import App from './App.vue'
import i18n from './locales'

createApp(App).use(Antd).use(i18n).mount('#app')
