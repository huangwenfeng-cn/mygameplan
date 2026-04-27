<template>
  <div class="py-6">
    <div class="flex items-center justify-between">
      <div class="text-xl font-semibold">页面</div>
      <div class="flex items-center space-x-2">
        <Dropdown
          :options="[
            {
              label: '页面标题',
              onClick: () => (orderBy = 'title asc'),
            },
            {
              label: '更新时间',
              onClick: () => (orderBy = 'modified desc'),
            },
            {
              label: '创建时间',
              onClick: () => (orderBy = 'creation desc'),
            },
          ]"
          placement="center"
        >
          <Button>
            <div class="flex items-center">
              <ArrowDownUp class="mr-1.5 h-4 w-4 leading-none" :stroke-width="1.5" />
              <span>排序</span>
            </div>
          </Button>
        </Dropdown>
        <Button variant="solid" @click="$resources.newPage.submit()">
          <template #prefix><LucidePlus class="w-4" /></template>
          新增
        </Button>
      </div>
    </div>
    <PageGrid class="mt-4.5" :listOptions="{ filters: { project: project.name }, orderBy }" />
  </div>
</template>
<script>
import { Dropdown } from 'frappe-ui'
import ArrowDownUp from '~icons/lucide/arrow-up-down'
import PageGrid from './PageGrid.vue'

export default {
  name: 'ProjectPages',
  props: ['project'],
  components: { Dropdown, ArrowDownUp, PageGrid },
  data() {
    return {
      orderBy: 'modified desc',
    }
  },
  resources: {
    newPage() {
      return {
        url: 'frappe.client.insert',
        params: {
          doc: {
            doctype: 'GP Page',
            project: this.project.name,
            title: '未命名',
            content: '',
          },
        },
        onSuccess(doc) {
          this.$router.push({
            name: 'ProjectPage',
            params: { pageId: doc.name },
          })
        },
      }
    },
  },
}
</script>
<style scoped>
.sort-button:deep(.feather-minimize-2) {
  transform: rotate(15deg);
}
</style>
