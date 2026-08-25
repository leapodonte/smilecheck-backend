<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import { listRoles, addRole, editRole, deleteRoles, getRoleModules, setRoleModules, listModules, type Role, type ModuleNode } from '../api/system'
import { usePagedList } from '../composables/usePagedList'

const { t } = useI18n()
const { items, loading, search, pagination, load, handleTableChange, doSearch } = usePagedList<Role>(listRoles)

const columns = [
  { title: t('role.name'), dataIndex: 'name' },
  { title: t('common.visible'), dataIndex: 'visible', width: 100 },
  { title: t('common.actions'), key: 'actions', width: 200 },
]

//新增/编辑
const modalOpen = ref(false)
const saving = ref(false)
const editing = ref<Role | null>(null)
const form = reactive({ name: '', visible: true })

function openAdd() {
  editing.value = null
  Object.assign(form, { name: '', visible: true })
  modalOpen.value = true
}

function openEdit(record: Role) {
  editing.value = record
  Object.assign(form, { name: record.name, visible: record.visible ?? true })
  modalOpen.value = true
}

async function submit() {
  saving.value = true
  try {
    if (editing.value?.id) {
      await editRole({ id: editing.value.id, name: form.name, visible: form.visible })
    } else {
      await addRole({ name: form.name, visible: form.visible })
    }
    message.success(t('common.saved'))
    modalOpen.value = false
    load()
  } finally {
    saving.value = false
  }
}

function onDelete(record: Role) {
  Modal.confirm({
    title: t('common.deleteConfirm'),
    onOk: async () => {
      await deleteRoles([record.id])
      message.success(t('common.deleted'))
      load()
    },
  })
}

//权限配置弹窗
const permOpen = ref(false)
const permTarget = ref<Role | null>(null)
const permSaving = ref(false)
const allModules = ref<ModuleNode[]>([])
const checkedModules = ref<string[]>([])
//module_id -> actions 勾选
const actionState = reactive<Record<string, string[]>>({})

const allActions = ['add', 'edit', 'delete']

const treeData = computed(() =>
  allModules.value.map((m) => ({
    title: m.name,
    key: m.id,
    children: m.children?.map((c) => ({ title: c.name, key: c.id })),
  })),
)

async function openPerm(record: Role) {
  permTarget.value = record
  const [mods, current] = await Promise.all([listModules(), getRoleModules(record.id)])
  allModules.value = mods ?? []
  checkedModules.value = collectIds(current.items ?? [])
  Object.keys(actionState).forEach((k) => delete actionState[k])
  flattenActions(current.items ?? [])
  permOpen.value = true
}

function collectIds(nodes: ModuleNode[]): string[] {
  const ids: string[] = []
  for (const n of nodes) {
    ids.push(n.id)
    if (n.children?.length) ids.push(...collectIds(n.children))
  }
  return ids
}

function flattenActions(nodes: ModuleNode[]) {
  for (const n of nodes) {
    if (n.actions?.length) actionState[n.id] = [...n.actions]
    if (n.children?.length) flattenActions(n.children)
  }
}

async function submitPerm() {
  permSaving.value = true
  try {
    const payload: { mod_id: string; actions: string[] }[] = []
    const pushNode = (n: ModuleNode) => {
      payload.push({ mod_id: n.id, actions: actionState[n.id] ?? [] })
      n.children?.forEach(pushNode)
    }
    allModules.value.forEach(pushNode)
    await setRoleModules(permTarget.value!.id, payload)
    message.success(t('common.saved'))
    permOpen.value = false
  } finally {
    permSaving.value = false
  }
}

onMounted(load)
</script>

<template>
  <a-card :bordered="false" class="page-card">
    <div class="page-toolbar">
      <a-input-search v-model:value="search" :placeholder="t('common.search')" style="width: 260px" @search="doSearch" />
      <a-button type="primary" @click="openAdd">{{ t('common.add') }}</a-button>
    </div>

    <a-table :columns="columns" :data-source="items" :loading="loading" row-key="id" :pagination="pagination" @change="handleTableChange">
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'visible'">
          <a-tag :color="record.visible ? 'green' : 'default'">{{ record.visible ? t('common.yes') : t('common.no') }}</a-tag>
        </template>
        <template v-else-if="column.key === 'actions'">
          <a-space>
            <a @click="openEdit(record)">{{ t('common.edit') }}</a>
            <a @click="openPerm(record)">{{ t('role.permissions') }}</a>
            <a v-if="record.id !== '00000000-0000-0000-0000-000000000000'" class="danger" @click="onDelete(record)">{{ t('common.delete') }}</a>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal v-model:open="modalOpen" :title="editing ? t('role.editTitle') : t('role.addTitle')" :confirm-loading="saving" @ok="submit">
      <a-form layout="vertical" style="margin-top: 12px">
        <a-form-item :label="t('role.name')">
          <a-input v-model:value="form.name" />
        </a-form-item>
        <a-form-item :label="t('common.visible')">
          <a-switch v-model:checked="form.visible" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="permOpen" :title="`${t('role.permissions')} - ${permTarget?.name ?? ''}`" width="560px" :confirm-loading="permSaving" @ok="submitPerm">
      <a-tree v-if="treeData.length" checkable block-line :tree-data="treeData" v-model:checkedKeys="checkedModules" style="margin-top: 12px">
        <template #title="{ key, title }">
          <span>{{ title }}</span>
          <a-checkbox-group
            v-if="allModules.flatMap((m) => [m.id, ...(m.children?.map((c) => c.id) ?? [])]).includes(key)"
            v-model:value="actionState[key]"
            style="margin-left: 12px"
            :options="allActions.map((a) => ({ label: t(`common.action_${a}`), value: a }))"
            @click.stop
          />
        </template>
      </a-tree>
    </a-modal>
  </a-card>
</template>

<style scoped>
.page-card {
  border-radius: 12px;
}
.page-toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}
.danger {
  color: #ff4d4f;
}
</style>
