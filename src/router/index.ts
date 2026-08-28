import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

/**
 * 路由与后台模块表（module.path）一一对应；菜单由接口数据驱动
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: 'login.title', public: true },
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    redirect: '/welcome',
    children: [
      { path: 'welcome', name: 'welcome', component: () => import('../views/WelcomeView.vue'), meta: { title: 'menu.home' } },
      { path: 'permission/module', name: 'module', component: () => import('../views/ModuleView.vue'), meta: { title: 'menu.module' } },
      { path: 'permission/role', name: 'role', component: () => import('../views/RoleView.vue'), meta: { title: 'menu.role' } },
      { path: 'account', name: 'account', component: () => import('../views/AccountView.vue'), meta: { title: 'menu.account' } },
      { path: 'selftest/template', name: 'template', component: () => import('../views/SelfTestTemplateView.vue'), meta: { title: 'menu.template' } },
      { path: 'selftest/question', name: 'question', component: () => import('../views/SelfTestQuestionView.vue'), meta: { title: 'menu.question' } },
      { path: 'smiletype', name: 'smiletype', component: () => import('../views/SmileTypeView.vue'), meta: { title: 'menu.smiletype' } },
      { path: 'science', name: 'science', component: () => import('../views/ScienceView.vue'), meta: { title: 'menu.science' } },
      { path: 'recommend', name: 'recommend', component: () => import('../views/RecommendView.vue'), meta: { title: 'menu.recommend' } },
      { path: 'user', name: 'user', component: () => import('../views/UserView.vue'), meta: { title: 'menu.user' } },
      { path: 'consent', name: 'consent', component: () => import('../views/ConsentView.vue'), meta: { title: 'menu.consent' } },
      { path: 'task', name: 'task', component: () => import('../views/TaskView.vue'), meta: { title: 'menu.task' } },
      { path: 'options', name: 'options', component: () => import('../views/OptionsView.vue'), meta: { title: 'menu.options' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/welcome' },
]

const router = createRouter({
  history: createWebHistory('/backend/'),
  routes,
})

//登录守卫
router.beforeEach((to) => {
  if (to.meta.public) {
    return true
  }
  const session = localStorage.getItem('admin_session')
  if (!session) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
