<template>
  <div class="relative flex items-center text-p-base text-ink-gray-5">
    <div
      class="mr-3 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-gray-2 text-ink-gray-8"
    >
      <LucideLock class="h-4 w-4" v-if="activity.action === 'Discussion Closed'" />
      <LucideUnlock class="h-4 w-4" v-else-if="activity.action === 'Discussion Reopened'" />
      <LucideEdit3 class="h-4 w-4" v-else-if="activity.action === 'Discussion Title Changed'" />
      <LucidePin class="h-4 w-4" v-else-if="activity.action === 'Discussion Pinned'" />
      <LucidePinOff class="h-4 w-4" v-else-if="activity.action === 'Discussion Unpinned'" />
      <LucideCornerUpRight class="h-4 w-4" v-else-if="activity.action === 'Discussion Moved'" />
      <LucideEdit3 class="h-4 w-4" v-else-if="activity.action === 'Task Value Changed'" />
    </div>
    <p>
      <UserInfo :email="activity.user" v-slot="{ user }">
        <UserProfileLink
          class="font-medium text-ink-gray-7 hover:text-ink-gray-5"
          :user="user.name"
        >
          {{ user.full_name }}
        </UserProfileLink>
      </UserInfo>
      <span v-if="activity.action == 'Discussion Closed'"> 关闭了该讨论</span>
      <span v-if="activity.action == 'Discussion Reopened'"> 重新打开了该讨论</span>
      <span v-if="activity.action == 'Discussion Pinned'"> 置顶了该讨论</span>
      <span v-if="activity.action == 'Discussion Unpinned'"> 取消置顶了该讨论</span>
      <span v-if="activity.action == 'Discussion Title Changed'">
        将标题从
        <span class="text-ink-gray-8">{{ activity.data.old_title }}</span> 修改为
        <span class="text-ink-gray-8">{{ activity.data.new_title }}</span>
      </span>
      <span v-if="activity.action == 'Discussion Moved'">
        将该讨论从
        <router-link
          :to="{ name: 'Space', params: { spaceId: activity.data.old_project } }"
          class="text-ink-gray-8 hover:text-ink-gray-5"
        >
          {{ spaceTitle(activity.data.old_project) }}
        </router-link>
        移动到
        <router-link
          :to="{ name: 'Space', params: { spaceId: activity.data.new_project } }"
          class="text-ink-gray-8 hover:text-ink-gray-5"
        >
          {{ spaceTitle(activity.data.new_project) }}
        </router-link>
      </span>
      <span class="text-ink-gray-5" v-if="activity.action == 'Task Value Changed'">
        <template v-if="activity.data.field === 'assigned_to'">
          将任务分配给
          <UserProfileLink
            class="font-medium text-ink-gray-7 hover:text-ink-gray-5"
            :user="$user(activity.data.new_value).name"
          >
            {{ $user(activity.data.new_value).full_name }}
          </UserProfileLink>
        </template>
        <template v-else-if="activity.data.field === 'description'">
          更新了描述
        </template>
        <template v-else-if="activity.data.field === 'project'">
          修改了空间
          <span v-if="activity.data.old_value">从&nbsp;</span>
          <router-link
            :to="{ name: 'Space', params: { spaceId: activity.data.old_value } }"
            class="text-ink-gray-8 hover:text-ink-gray-5"
          >
            {{ spaceTitle(activity.data.old_value) }}
          </router-link>
          到
          <router-link
            :to="{ name: 'Space', params: { spaceId: activity.data.new_value } }"
            class="text-ink-gray-8 hover:text-ink-gray-5"
          >
            {{ spaceTitle(activity.data.new_value) }}
          </router-link>
        </template>
        <template v-else>
          修改了 {{ activity.data.field_label }}
          <span v-if="activity.data.old_value">从&nbsp;</span>
          <span class="text-ink-gray-7">{{ activity.data.old_value }}</span> 为
          <span class="text-ink-gray-7">{{ activity.data.new_value }}</span>
        </template> </span
      >&nbsp;<Tooltip :text="dayjsLocal(activity.creation).format('YYYY-MM-DD HH:mm')">
        <time class="text-ink-gray-5" :datetime="activity.creation">
          {{ dayjsLocal(activity.creation).fromNow() }}
        </time>
      </Tooltip>
    </p>
  </div>
</template>
<script setup lang="ts">
import { dayjsLocal, Tooltip } from 'frappe-ui'
import UserProfileLink from './UserProfileLink.vue'
import { spaceTitle } from '@/utils/formatters'

interface Activity {
  action: string
  user: string
  creation: string
  data: {
    old_title?: string
    new_title?: string
    old_project?: string
    new_project?: string
    field?: string
    field_label?: string
    old_value?: string
    new_value?: string
  }
}

defineProps<{
  activity: Activity
}>()
</script>
