<template>
  <div>
    <PageHeader>
      <Breadcrumbs class="h-7" :items="breadcrumbs" />
    </PageHeader>

    <router-view v-slot="{ Component, route }">
      <div :class="{ 'mx-auto w-full max-w-4xl px-5': !route.meta?.fullWidth }">
        <component :is="Component" />
      </div>
    </router-view>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Breadcrumbs, getCachedDocumentResource, usePageMeta } from 'frappe-ui'
import PageHeader from '@/components/PageHeader.vue'

let breadcrumbs = computed(() => {
  let route = useRoute()
  let items = [{ label: '首页', route: { name: 'Home' } }]
  if (route.name === 'Discussions') {
    items.push({
      label: '讨论',
      route: { name: 'Discussions' },
    })
  }
  if (['MyTasks', 'Task'].includes(route.name)) {
    items.push({
      label: '我的任务',
      route: { name: 'MyTasks' },
    })
  }
  if (route.name === 'Task') {
    let task = getCachedDocumentResource('GP Task', route.params.taskId)
    items.push({
      label: task?.doc ? task.doc.title : route.params.taskId,
      route: { name: 'Task' },
    })
  }
  return items
})

usePageMeta(() => {
  return {
    title: '首页',
  }
})
</script>
