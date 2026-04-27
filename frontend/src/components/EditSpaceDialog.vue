<template>
  <Dialog :options="{ title: '编辑空间' }" v-model="show">
    <template #body-content>
      <div class="mt-3 space-y-2" v-if="space">
        <div class="space-x-2 flex items-center w-full">
          <IconPicker v-model="space.icon" v-slot="{ isOpen }">
            <Button>
              <template #icon>
                <span v-if="space.icon">{{ space.icon }}</span>
                <LucidePlus v-else class="h-4 w-4" />
              </template>
            </Button>
          </IconPicker>
          <TextInput
            class="w-full"
            placeholder="空间名称"
            v-model="space.title"
            v-focus:autoselect
          />
        </div>

        <div class="flex items-center space-x-2">
          <div class="w-7 h-7"></div>
          <div>
            <FormControl
              type="checkbox"
              :label="
                space.is_private
                  ? '私密 &mdash; 仅成员可见'
                  : '公开 &mdash; 所有人可见'
              "
              v-model="space.is_private"
              disabled
            />
          </div>
        </div>
      </div>
      <div class="mt-4">
        <ErrorMessage :message="spaces.setValue.error" />
      </div>
    </template>
    <template #actions>
      <div class="flex items-center space-x-2 justify-end">
        <Button variant="solid" @click="submit" :loading="spaces.setValue.loading">提交</Button>
      </div>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { Dialog, ErrorMessage, FormControl, TextInput } from 'frappe-ui'
import IconPicker from './IconPicker.vue'
import { useSpace } from '@/data/spaces'
import { useDoctype } from 'frappe-ui'
import { GPProject } from '@/types/doctypes'
import { vFocus } from '@/directives'

const props = defineProps<{ spaceId: string }>()
const show = defineModel<boolean>()

const space = useSpace(() => props.spaceId)
const spaces = useDoctype<GPProject>('GP Project')

function submit() {
  spaces.setValue
    .submit({
      name: props.spaceId,
      title: space.value?.title,
      icon: space.value?.icon,
    })
    .then(() => {
      show.value = false
    })
}
</script>
