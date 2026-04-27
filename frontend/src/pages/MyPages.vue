<template>
  <div>
    <PageHeader>
      <Breadcrumbs class="h-7" :items="[{ label: '我的页面', route: { name: 'MyPages' } }]" />
      <div class="flex items-center space-x-2">
        <Select
          :options="[
            {
              label: '排序方式',
              value: '',
              disabled: true,
            },
            {
              label: '页面标题',
              value: 'title asc',
            },
            {
              label: '更新时间',
              value: 'modified desc',
            },
            {
              label: '创建时间',
              value: 'creation desc',
            },
          ]"
          v-model="orderBy"
        />
      </div>
    </PageHeader>

    <div class="px-3 sm:px-5 mt-5">
      <PageGrid
        class="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        :listOptions="{
          filters: { owner: sessionUser.name },
          orderBy: () => orderBy,
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Select, Breadcrumbs } from 'frappe-ui'
import PageHeader from '@/components/PageHeader.vue'
import { useNewDoc } from 'frappe-ui'
import { useSessionUser } from '@/data/users'
import PageGrid from './PageGrid.vue'
import { GPPage } from '@/types/doctypes'
import { UseListOptions } from 'frappe-ui'

const router = useRouter()
const sessionUser = useSessionUser()
const orderBy: UseListOptions<GPPage>['orderBy'] = ref('modified desc')

const newPage = useNewDoc<GPPage>('GP Page', {
  title: '未命名',
  content: '',
})

function createNewPage() {
  newPage.submit().then((doc) => {
    router.push({
      name: 'Page',
      params: { pageId: doc.name, slug: doc.slug },
    })
  })
}
</script>
