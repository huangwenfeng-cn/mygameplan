<template>
  <PageHeader>
    <Breadcrumbs :items="[{ label: '收件箱', route: { name: 'Notifications' } }]" />
    <div class="flex h-7 items-center space-x-2">
      <Button
        @click="$resources.markAllAsRead.submit"
        :loading="$resources.markAllAsRead.loading"
        v-if="activeTab === '未读' && $resources.unreadNotifications.data?.length > 0"
      >
        全部标记为已读
      </Button>
      <TabButtons
        :buttons="[{ label: '未读', active: true }, { label: '已读' }]"
        v-model="activeTab"
      />
    </div>
  </PageHeader>
  <div class="body-container pt-6">
    <div class="divide-y">
      <div class="flex items-center justify-between py-2" v-for="d in notifications" :key="d.name">
        <div class="flex items-start space-x-2">
          <UserAvatar size="sm" :user="d.from_user" v-if="d.from_user" />
          <div class="grid h-5 w-5 place-items-center" v-if="d.type === 'Reaction'">
            <LucideHeart class="h-4 w-4 text-ink-gray-6" />
          </div>
          <div class="text-base text-ink-gray-8">
            {{ d.message }} {{ dayjsLocal(d.creation).fromNow() }}
          </div>
        </div>
        <div class="ml-2 flex shrink-0 items-center space-x-2">
          <router-link
            v-if="d.discussion || d.task"
            class="block text-sm font-medium text-ink-gray-5 hover:text-ink-gray-6"
            :to="
              d.discussion
                ? {
                    name: 'ProjectDiscussion',
                    params: {
                      postId: d.discussion,
                      projectId: d.project,
                      teamId: d.team,
                    },
                    query: d.comment ? { comment: d.comment } : null,
                  }
                : d.task
                  ? {
                      name: 'ProjectTaskDetail',
                      params: {
                        teamId: d.team,
                        projectId: d.project,
                        taskId: d.task,
                      },
                      query: d.comment ? { comment: d.comment } : null,
                    }
                  : null
            "
            @click="markAsRead(d.name)"
          >
            {{ d.discussion ? '查看讨论' : d.task ? '查看任务' : '' }}
          </router-link>
          <Tooltip text="标记为已读">
            <Button v-if="!d.read" variant="ghost" @click="markAsRead(d.name)">
              <template #icon>
                <LucideX class="w-4" />
              </template>
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
    <div v-if="!notifications?.length" class="text-base text-ink-gray-5">暂无通知</div>
  </div>
</template>
<script>
import { TabButtons, Tooltip, Breadcrumbs, dayjsLocal } from 'frappe-ui'
import PageHeader from '@/components/PageHeader.vue'
import Link from '@/components/Link.vue'

export default {
  name: 'Notifications',
  data() {
    return {
      activeTab: '未读',
    }
  },
  pageMeta() {
    return {
      title: '通知',
    }
  },
  components: { TabButtons, Tooltip, Link, Breadcrumbs, PageHeader },
  setup() {
    return {
      dayjsLocal,
    }
  },
  resources: {
    unreadNotifications() {
      if (this.activeTab !== '未读') return
      return {
        type: 'list',
        cache: 'Unread Notifications',
        doctype: 'GP Notification',
        filters: { to_user: this.$user().name, read: 0 },
        fields: [
          'name',
          'from_user',
          'message',
          'read',
          'type',
          'creation',
          'comment',
          'discussion',
          'task',
          'project',
          'team',
        ],
        orderBy: 'creation desc',
        auto: true,
      }
    },
    readNotifications() {
      if (this.activeTab !== '已读') return
      return {
        type: 'list',
        cache: 'Read Notifications',
        doctype: 'GP Notification',
        filters: { to_user: this.$user().name, read: 1 },
        fields: [
          'name',
          'from_user',
          'message',
          'read',
          'type',
          'creation',
          'comment',
          'discussion',
          'task',
          'project',
          'team',
        ],
        orderBy: 'creation desc',
        auto: true,
      }
    },
    markAllAsRead() {
      return {
        url: 'gameplan.api.mark_all_notifications_as_read',
        onSuccess() {
          this.$getResource('Unread Notifications Count')?.reload()
          this.$resources.unreadNotifications.reload()
        },
      }
    },
  },
  computed: {
    notifications() {
      return this.activeTab === '未读'
        ? this.$resources.unreadNotifications.data
        : this.$resources.readNotifications.data
    },
  },
  methods: {
    markAsRead(name) {
      this.$resources.unreadNotifications.setValue.submit(
        {
          name,
          read: 1,
        },
        {
          onSuccess: () => {
            this.$getResource('Unread Notifications Count')?.reload()
          },
        },
      )
    },
  },
  mounted() {
    this.$getResource('Unread Notifications Count')?.reload()
  },
}
</script>
