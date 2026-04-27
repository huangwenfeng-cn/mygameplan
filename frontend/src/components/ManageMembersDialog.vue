<template>
  <Dialog :options="{ title: '管理成员' }" v-model="show">
    <template #body-content v-if="space">
      <div class="mt-6 flex items-end gap-2">
        <div class="w-full">
          <FormLabel label="添加成员" class="mb-1.5" />
          <Combobox
            :options="addableUsers"
            v-model="selectedUser"
            placeholder="请输入姓名"
            v-focus:autoselect
          />
        </div>
        <Button
          class="ml-auto w-13 shrink-0"
          @click="addMember"
          :loading="spaces.runDocMethod.isLoading(space.name, 'add_member')"
        >
          添加
        </Button>
      </div>
      <div class="mt-4 flex items-end gap-2">
        <FormControl
          class="w-full"
          label="邀请访客"
          v-model="guestEmail"
          placeholder="请输入邮箱"
          @keydown.enter="invite"
        />
        <Button
          class="ml-auto w-13"
          @click="invite"
          :loading="spaces.runDocMethod.isLoading(space.name, 'invite_guest')"
        >
          邀请
        </Button>
      </div>
      <ErrorMessage class="mt-2" :message="spaces.runDocMethod.error" />
      <div class="mt-6 space-y-2">
        <div class="flex items-center gap-4" v-for="user in space.members" :key="user.user">
          <UserAvatar :user="user.user" />
          <div class="text-base">
            <span class="text-ink-gray-8">
              {{ useUser(user.user).full_name }}
            </span>
          </div>
          <div class="ml-auto">
            <div class="h-7"></div>
          </div>
        </div>
        <div class="flex items-center gap-4" v-for="user in guestsAndInvites" :key="user.name">
          <UserAvatar :user="user.pending ? user.email : user.user" />
          <div class="text-base">
            <span class="text-ink-gray-8">
              {{ user.pending ? user.email : useUser(user.user).full_name }}
            </span>
            <span class="text-ink-gray-5" v-if="user.pending">（待处理）</span>
          </div>
          <div class="ml-auto flex">
            <Tooltip :text="user.pending ? '删除邀请' : '移除访客用户'">
              <Button
                :label="user.pending ? '删除邀请' : '移除访客用户'"
                @click="remove(user)"
              >
                <template #icon><LucideX class="w-4" /></template>
              </Button>
            </Tooltip>
          </div>
        </div>
        <Dialog :options="removeDialog.options" v-model="removeDialog.open" />
      </div>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { Combobox, FormLabel, toast, Tooltip, useDoctype, useList } from 'frappe-ui'
import { useSpace } from '@/data/spaces'
import { useUser, users } from '@/data/users'
import { GPGuestAccess, GPInvitation, GPProject } from '@/types/doctypes'
import { vFocus } from '@/directives'

const props = defineProps<{ spaceId: string }>()
const show = defineModel<boolean>()
const space = useSpace(() => props.spaceId)
const spaces = useDoctype<GPProject>('GP Project')

type GuestAccess = GPGuestAccess & { pending: false }
let guests = useList<GuestAccess>({
  doctype: 'GP Guest Access',
  filters: { project: space.value?.name || '' },
  fields: ['user', 'project', 'name'],
  transform(data) {
    return data.map((d) => ({ ...d, pending: false }))
  },
  immediate: false,
})

type PendingInvitation = GPInvitation & { pending: true }
let pending = useList<PendingInvitation>({
  doctype: 'GP Invitation',
  filters: {
    projects: ['like', `%${space.value?.name}%`],
    role: 'Gameplan Guest',
    status: 'Pending',
  },
  fields: ['email', 'projects', 'name'],
  transform(data) {
    return data.map((d) => ({ ...d, pending: true }))
  },
  immediate: false,
})

watch(show, (value) => {
  if (value && !guests.isFinished) {
    guests.fetch()
    pending.fetch()
  }
})

let guestsAndInvites = computed(() => {
  return [...(guests.data || []), ...(pending.data || [])]
})

let addableUsers = computed(() => {
  return (users.data || [])
    .filter((user) => user.enabled && !space.value?.members.find((m) => m.user === user.name))
    .map((user) => ({ value: user.name, label: user.full_name }))
})

let selectedUser = ref<string | null>(null)
let guestEmail = ref('')

function addMember() {
  if (space.value && selectedUser.value) {
    spaces.runDocMethod
      .submit({
        name: space.value.name,
        method: 'add_member',
        params: { user: selectedUser.value },
      })
      .then(() => {
        selectedUser.value = null
        let fullName = useUser(selectedUser.value).full_name
        let spaceName = useSpace(space.value?.name).value?.title
        toast.success(`${fullName} added to ${spaceName}`)
        guests.reload()
      })
  }
}

function invite() {
  if (space.value) {
    spaces.runDocMethod
      .submit({
        name: space.value.name,
        method: 'invite_guest',
        params: { email: guestEmail.value },
      })
      .then(() => {
        guestEmail.value = ''
        pending.reload()
      })
  }
}

let removeDialog = reactive({
  open: false,
  options: null,
})

function remove(user: GuestAccess | PendingInvitation) {
  if (user.pending) {
    removeDialog.options = {
      title: '删除邀请',
      message: '确定要删除该邀请吗？',
      actions: [
        {
          label: '删除',
          variant: 'solid',
          theme: 'red',
          onClick: ({ close }) => {
            return pending.delete.submit({ name: user.name }).then(close)
          },
        },
      ],
    }
  } else {
    removeDialog.options = {
      title: '移除访客用户',
      message: `确定要移除访客用户 ${useUser(user.user).full_name} 吗？`,
      actions: [
        {
          label: '删除',
          variant: 'solid',
          theme: 'red',
          onClick: ({ close }) => {
            if (!space.value) return
            return spaces.runDocMethod
              .submit({
                name: space.value.name,
                method: 'remove_guest',
                params: {
                  email: user.user,
                },
              })
              .then(() => {
                guests.reload()
                close()
              })
          },
        },
      ],
    }
  }
  removeDialog.open = true
}
</script>
