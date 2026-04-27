<template>
  <PageHeader>
    <Breadcrumbs
      class="h-7"
      :items="[
        { label: '草稿', route: { name: 'Drafts' } },
        {
          label: draftDoc?.doc ? draftData.title : '新建讨论',
          route: { name: 'NewDiscussion' },
        },
      ]"
    />
    <div class="flex shrink-0 space-x-2">
      <DropdownMoreOptions
        class="hidden sm:block"
        :options="[
          {
            label: '删除',
            condition: () => draftDoc?.doc && sessionUser.name == author.name,
            onClick: deleteDraft,
          },
          { label: '放弃', condition: () => !draftDoc?.doc, onClick: discard },
          {
            label: '保存草稿',
            condition: () => isDraftChanged && !saveStatus.isSaving,
            onClick: immediateSave,
          },
        ]"
        placement="right"
      />
      <Tooltip text="你不能发布此草稿" :disabled="sessionUser.name == author.name">
        <Button
          variant="solid"
          :loading="publishing"
          @click="publish"
          :disabled="sessionUser.name != author.name"
        >
          发布
        </Button>
      </Tooltip>
    </div>
  </PageHeader>
</template>

<script setup lang="ts">
import { Breadcrumbs, Tooltip } from 'frappe-ui'
import PageHeader from '@/components/PageHeader.vue'
import { useNewDiscussionContext } from './useNewDiscussion'
import DropdownMoreOptions from '@/components/DropdownMoreOptions.vue'

const {
  draftDoc,
  draftData,
  sessionUser,
  author,
  deleteDraft,
  discard,
  saveStatus,
  isDraftChanged,
  publish,
  publishing,
  immediateSave,
} = useNewDiscussionContext()
</script>
