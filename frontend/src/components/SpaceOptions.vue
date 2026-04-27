<template>
  <DropdownMoreOptions
    :label="`${space?.title} 空间选项`"
    v-bind="$attrs"
    :options="options"
  />

  <MergeSpaceDialog v-model="showSpaceMergeDialog" :spaceId="props.spaceId" />
  <ChangeSpaceCategoryDialog v-model="showSpaceCategoryDialog" :spaceId="props.spaceId" />
  <EditSpaceDialog v-model="showSpaceEditDialog" :spaceId="props.spaceId" />
  <ManageMembersDialog v-model="inviteGuestDialog" :spaceId="props.spaceId" />
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDoctype } from 'frappe-ui'
import DropdownMoreOptions from './DropdownMoreOptions.vue'
import MergeSpaceDialog from './MergeSpaceDialog.vue'
import ChangeSpaceCategoryDialog from './ChangeSpaceCategoryDialog.vue'
import EditSpaceDialog from './EditSpaceDialog.vue'
import ManageMembersDialog from './ManageMembersDialog.vue'
import { createDialog } from '@/utils/dialogs'
import { useSpace, hasJoined, joinSpace, leaveSpace } from '@/data/spaces'
import { markSpaceAsRead } from '@/data/unreadCount'
import { GPProject } from '@/types/doctypes'

import LucideUserPlus from '~icons/lucide/user-plus'
import LucideEdit from '~icons/lucide/edit'
import LucideMerge from '~icons/lucide/merge'
import LucideArchive from '~icons/lucide/archive'
import LucideTrash2 from '~icons/lucide/trash-2'
import LucideLogOut from '~icons/lucide/log-out'
import LucideCheck from '~icons/lucide/check'
import LucideLogIn from '~icons/lucide/log-in'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  spaceId: string
}>()

const space = useSpace(() => props.spaceId)
const spaces = useDoctype<GPProject>('GP Project')

const showSpaceMergeDialog = ref(false)
const showSpaceCategoryDialog = ref(false)
const showSpaceEditDialog = ref(false)
const inviteGuestDialog = ref(false)

const options = computed(() => [
  {
    label: '编辑',
    icon: LucideEdit,
    onClick: () => (showSpaceEditDialog.value = true),
    condition: () => !space.value?.archived_at,
  },
  {
    label: '全部标记为已读',
    icon: LucideCheck,
    onClick: () => {
      createDialog({
        title: '确认操作',
        message:
          '此操作会将该空间内所有讨论标记为已读，且不可撤销。',
        actions: [
          {
            label: '全部标记为已读',
            variant: 'solid',
            onClick: ({ close }) => {
              return markSpaceAsRead(props.spaceId).then(close)
            },
          },
        ],
      })
    },
    condition: () => !space.value?.archived_at,
  },
  {
    label: hasJoined(props.spaceId) ? '退出空间' : '加入空间',
    icon: hasJoined(props.spaceId) ? LucideLogOut : LucideLogIn,
    onClick: () => {
      if (space.value) {
        if (hasJoined(props.spaceId)) {
          leaveSpace(space.value)
        } else {
          joinSpace(space.value)
        }
      }
    },
    condition: () => !space.value?.archived_at,
  },
  {
    label: '管理成员',
    icon: LucideUserPlus,
    onClick: () => (inviteGuestDialog.value = true),
    condition: () => !space.value?.archived_at,
  },
  {
    label: '更改分类',
    icon: LucideLogOut,
    onClick: () => (showSpaceCategoryDialog.value = true),
    condition: () => !space.value?.archived_at,
  },
  {
    label: '合并',
    icon: LucideMerge,
    onClick: () => (showSpaceMergeDialog.value = true),
  },
  {
    label: '归档',
    icon: LucideArchive,
    onClick: () => {
      createDialog({
        title: '归档空间',
        message:
          '归档后将无法在该空间新建讨论、页面或任务，空间将保持只读。你可以随时取消归档。',
        actions: [
          {
            label: '归档',
            variant: 'solid',
            loading: spaces.runDocMethod.loading,
            onClick: ({ close }) => {
              spaces.runDocMethod
                .submit({
                  method: 'archive',
                  name: props.spaceId,
                })
                .then(close)
            },
          },
        ],
      })
    },
    condition: () => !space.value?.archived_at,
  },
  {
    label: '删除',
    icon: LucideTrash2,
    onClick: () => {
      let message = `这将永久删除该空间及其全部内容，此操作不可撤销。`
      if (space.value?.discussions_count && space.value?.tasks_count) {
        message = `这将永久删除该空间及其全部内容。该空间包含 ${space.value?.discussions_count} 条讨论和 ${space.value?.tasks_count} 个任务。此操作不可撤销。`
      } else if (space.value?.discussions_count) {
        message = `这将永久删除该空间及其全部内容。该空间包含 ${space.value?.discussions_count} 条讨论。此操作不可撤销。`
      }
      createDialog({
        title: '删除空间',
        message,
        actions: [
          {
            label: '删除',
            theme: 'red',
            variant: 'solid',
            loading: spaces.delete.loading,
            onClick: ({ close }) => spaces.delete.submit({ name: props.spaceId }).then(close),
          },
        ],
      })
    },
    condition: () => !space.value?.archived_at,
  },
])
</script>
