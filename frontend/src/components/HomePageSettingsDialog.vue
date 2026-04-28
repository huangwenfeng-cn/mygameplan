<template>
  <Dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :options="{
      title: '主页设置',
      actions: [
        {
          label: '保存',
          variant: 'solid',
          onClick: saveSelection,
        },
      ],
    }"
  >
    <template #body-content>
      <div class="space-y-2">
        <p class="text-ink-gray-7 text-base">
          选择打开项目协作时默认进入的页面。
        </p>

        <RadioGroupRoot class="space-y-1" v-model="selectedHomePage">
          <RadioGroupItem
            v-for="option in homePageOptions"
            :key="option.name"
            :value="option.name"
            class="flex items-start w-full group data-[state=checked]:bg-surface-gray-2 p-2 rounded-md cursor-pointer hover:bg-surface-gray-1"
          >
            <div
              class="size-4 border border-outline-gray-2 group-data-[state=checked]:bg-surface-gray-7 rounded-full grid place-content-center"
            >
              <RadioGroupIndicator>
                <CircleCheckIcon class="text-ink-white size-4.5" />
              </RadioGroupIndicator>
            </div>
            <div class="ml-2 text-left">
              <div class="text-base text-ink-gray-9 font-">
                {{ option.name === 'Discussions' ? '讨论' : option.name === 'Spaces' ? '空间' : option.name }}
              </div>
              <div class="text-ink-gray-6 mt-1 text-sm">{{ option.description }}</div>
            </div>
          </RadioGroupItem>
        </RadioGroupRoot>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Dialog, Select } from 'frappe-ui'
import { RadioGroupRoot, RadioGroupItem, RadioGroupIndicator } from 'reka-ui'
import { useRouter } from 'vue-router'
import { usePreferredHomePage } from '@/composables/usePreferredHomePage'
import { CircleCheckIcon } from 'frappe-ui/icons'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const preferredHomePage = usePreferredHomePage()
const selectedHomePage = ref(preferredHomePage.value)

const homePageOptions = [
  { name: 'Discussions', routeName: 'Discussions', description: '查看所有讨论。' },
  { name: 'Spaces', routeName: 'Spaces', description: '浏览你的空间。' },
]

const router = useRouter()

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      selectedHomePage.value = preferredHomePage.value
    }
  },
)

function saveSelection() {
  preferredHomePage.value = selectedHomePage.value
  router.push({ name: selectedHomePage.value })
  emit('update:modelValue', false)
}
</script>
