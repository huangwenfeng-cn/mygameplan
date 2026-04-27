<template>
  <Dialog
    :options="{
      title: '合并到其他空间',
    }"
    @after-leave="
      () => {
        selectedSpace = null
      }
    "
    v-model="show"
  >
    <template #body-content>
      <p class="text-p-base text-ink-gray-7 mb-4">
        这将把
        <span class="whitespace-nowrap font-semibold">{{ space?.title }}</span> space to the
        空间中的所有讨论、任务和页面移动到所选空间。此操作不可撤销！
      </p>
      <Combobox
        :options="groupedSpaceOptions"
        v-model="selectedSpace"
        placeholder="选择空间"
      />
      <ErrorMessage class="mt-2" :message="spaces.runDocMethod.error" />
    </template>
    <template #actions>
      <Button
        class="w-full"
        variant="solid"
        :loading="spaces.runDocMethod.isLoading(spaceId, 'merge_with_project')"
        @click="submit"
      >
        {{ selectedSpace ? `合并到 ${useSpace(selectedSpace).value?.title}` : '合并' }}
      </Button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Combobox } from 'frappe-ui'
import { useGroupedSpaceOptions } from '@/data/groupedSpaces'
import { useDoctype } from 'frappe-ui'
import { GPProject } from '@/types/doctypes'
import { useSpace } from '@/data/spaces'

const props = defineProps<{
  spaceId: string
}>()

const router = useRouter()
const spaces = useDoctype<GPProject>('GP Project')
const space = useSpace(() => props.spaceId)

const selectedSpace = ref(null)
const show = defineModel<boolean>()

const groupedSpaceOptions = useGroupedSpaceOptions({
  filterFn: (s) => s.name.toString() !== props.spaceId.toString(),
})

function submit() {
  spaces.runDocMethod
    .submit({
      method: 'merge_with_project',
      name: props.spaceId,
      params: {
        project: selectedSpace.value,
      },
      validate() {
        if (!selectedSpace.value) {
          return '请选择要合并到的空间'
        }
      },
    })
    .then(() => {
      if (selectedSpace.value) {
        show.value = false
        return router.replace({
          name: 'Space',
          params: { spaceId: selectedSpace.value },
        })
      }
    })
}
</script>
