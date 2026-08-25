<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import { listAccounts, addAccount, editAccount, deleteAccounts, accountRoles, setAccountRoles, listRoles, type Account, type Role } from '../api/system'
import { usePagedList } from '../composables/usePagedList'
import { signPassword } from '../utils/sign'

const { t } = useI18n()
const { items, loading, search, pagination, load, handleTableChange, doSearch } = usePagedList<Account>(listAccounts)

const columns = [
  { title: t('account.name'), dataIndex: 'name' },
  { title: t('account.nickname'), dataIndex: 'nickname' },
  { title: t('common.active'), dataIndex: 'active', width: 90 },
  { title: t('common.createdAt'), dataIndex: 'created_at', width: 180 },
  { title: t('common.actions'), key: 'actions', width: 240 },
]

//新增/编辑弹窗
const modalOpen = ref(false)
const saving = ref(false)
const editing = ref<Account | null>(null)
const form = reactive({ name: '', nickname: '', password: '', active: true })

function openAdd() {
  editing.value = null
  Object.assign(form, { name: '', nickname: '', password: '', active: true })
  modalOpen.value = true
}

function openEdit(record: Account) {
  editing.value = record
  Object.assign(form, { name: record.name ?? '', nickname: record.nickname ?? '', password: '', active: record.active ?? true })
  modalOpen.value = true
}

async function submit() {
  saving.value = true
  try {
    if (editing.value?.id) {
      await editAccount({ id: editing.value.id, name: form.name, nickname: form.nickname, password: form.password ? signPassword(form.password) : undefined, active: form.active })
      message.success(t('common.saved'))
    } else {
      if (!form.password) {
        message.warning(t('account.pwdRequired'))
        return
      }
      await addAccount({ name: form.name, nickname: form.nickname, password: signPassword(form.password), active: form.active })
      message.success(t('common.saved'))
    }
    modalOpen.value = false
    load()
  } finally {
    saving.value = false
  }
}

function onDelete(record: Account) {
  Modal.confirm({
    title: t('common.deleteConfirm'),
    onOk: async () => {
      await deleteAccounts([record.id!])
      message.success(t('common.deleted'))
      load()
    },
  })
}

//角色分配弹窗
const roleOpen = ref(false)
const roleTarget = ref<Account | null>(null)
const allRoles = ref<Role[]>([])
const checkedRoles = ref<string[]>([])
const roleSaving = ref(false)

async function openRoles(record: Account) {
  roleTarget.value = record
  const [roles, current] = await Promise.all([listRoles({ page: 1, page_size: 100 }), accountRoles(record.id!)])
  allRoles.value = (roles.items ?? []).filter((r) => r.id !== '00000000-0000-0000-0000-000000000000')
  checkedRoles.value = (current.items ?? []).map((r) => r.id)
  roleOpen.value = true
}

async function submitRoles() {
  roleSaving.value = true
  try {
    await setAccountRoles(roleTarget.value!.id!, checkedRoles.value)
    message.success(t('common.saved'))
    roleOpen.value = false
  } finally {
    roleSaving.value = false
  }
}

function fmtTime(ts?: number) {
  return ts ? new Date(ts * 1000).toLocaleString() : '-'
}

onMounted(load)
</script>

<template>
  <a-card :bordered="false" class="page-card">
    <div class="page-toolbar">
      <a-input-search v-model:value="search" :placeholder="t('common.search')" style="width: 260px" @search="doSearch" />
      <a-button type="primary" @click="openAdd">{{ t('common.add') }}</a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="items"
      :loading="loading"
      row-key="id"
      :pagination="pagination"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'active'">
          <a-tag :color="record.active ? 'green' : 'red'">{{ record.active ? t('common.enabled') : t('common.disabled') }}</a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'created_at'">
          {{ fmtTime(record.created_at) }}
        </template>
        <template v-else-if="column.key === 'actions'">
          <a-space>
            <a @click="openEdit(record)">{{ t('common.edit') }}</a>
            <a @click="openRoles(record)">{{ t('account.assignRoles') }}</a>
            <a class="danger" @click="onDelete(record)">{{ t('common.delete') }}</a>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal v-model:open="modalOpen" :title="editing ? t('account.editTitle') : t('account.addTitle')" :confirm-loading="saving" @ok="submit">
      <a-form layout="vertical" style="margin-top: 12px">
        <a-form-item :label="t('account.name')">
          <a-input v-model:value="form.name" :disabled="editing?.id === '00000000-0000-0000-0000-000000000000'" />
        </a-form-item>
        <a-form-item :label="t('account.nickname')">
          <a-input v-model:value="form.nickname" />
        </a-form-item>
        <a-form-item :label="t('account.password')" :extra="editing ? t('account.pwdKeep') : ''">
          <a-input-password v-model:value="form.password" />
        </a-form-item>
        <a-form-item :label="t('common.active')">
          <a-switch v-model:checked="form.active" :disabled="editing?.id === '00000000-0000-0000-0000-000000000000'" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="roleOpen" :title="t('account.assignRoles')" :confirm-loading="roleSaving" @ok="submitRoles">
      <a-checkbox-group v-model:value="checkedRoles" style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px">
        <a-checkbox v-for="role in allRoles" :key="role.id" :value="role.id">{{ role.name }}</a-checkbox>
      </a-checkbox-group>
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
