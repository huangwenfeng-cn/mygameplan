<template>
  <Popover transition="default">
    <template #target="{ togglePopover, isOpen }">
      <button @click="togglePopover()">
        <slot v-bind="{ isOpen }">
          <span class="text-base"> {{ modelValue || '' }} </span>
        </slot>
      </button>
    </template>
    <template #body>
      <div class="left-1/2 mt-3 max-w-max -translate-x-1/2 transform px-4 sm:px-0">
        <div
          class="relative max-h-96 overflow-y-auto rounded-lg pb-3 bg-surface-white shadow-2xl ring-1 ring-black ring-opacity-5"
        >
          <div class="flex gap-2 px-3 pb-1 pt-3">
            <div class="flex-1">
              <FormControl
                type="text"
                placeholder="按关键词搜索"
                v-model="search"
                :debounce="300"
                autocomplete="off"
              />
            </div>
            <Button @click="setRandom">随机</Button>
          </div>
          <div class="w-96"></div>
          <div class="px-3" v-for="(emojis, group) in emojiGroups" :key="group">
            <div class="sticky top-0 bg-surface-white pb-2 pt-3 text-sm text-ink-gray-6">
              {{ localizeCategory(group) }}
            </div>
            <div class="grid w-96 grid-cols-12 place-items-center">
              <button
                class="h-8 w-8 rounded-md p-1 text-2xl hover:bg-surface-gray-2 focus:outline-none focus:ring focus:ring-blue-200"
                v-for="emoji in emojis"
                :key="emoji.description"
                @click="$emit('update:modelValue', emoji.emoji)"
                :title="emoji.description"
              >
                {{ emoji.emoji }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Popover>
</template>
<script>
import { debounce, Popover } from 'frappe-ui'
import { gemoji } from 'gemoji'

export default {
  name: 'IconPicker',
  props: ['modelValue', 'setDefault'],
  emits: ['update:modelValue'],
  expose: ['setRandom'],
  data() {
    return { search: '' }
  },
  components: {
    Popover,
  },
  mounted() {
    if (this.setDefault && !this.modelValue) {
      this.setRandom()
    }
  },
  computed: {
    emojiGroups() {
      let groups = {}
      for (let emoji of gemoji) {
        if (this.search) {
          let keywords = [emoji.description, ...emoji.names, ...emoji.tags].join(' ').toLowerCase()
          if (!keywords.includes(this.search.toLowerCase())) {
            continue
          }
        }

        let group = groups[emoji.category]
        if (!group) {
          groups[emoji.category] = []
          group = groups[emoji.category]
        }
        group.push(emoji)
      }
      if (!Object.keys(groups).length) {
        groups['无结果'] = []
      }
      return groups
    },
  },
  methods: {
    localizeCategory(category) {
      return (
        {
          'Smileys & Emotion': '笑脸与表情',
          'People & Body': '人物与身体',
          'Animals & Nature': '动物与自然',
          'Food & Drink': '食物与饮品',
          'Travel & Places': '旅行与地点',
          Activities: '活动',
          Objects: '物品',
          Symbols: '符号',
          Flags: '旗帜',
          无结果: '无结果',
        }[category] || category
      )
    },
    setRandom() {
      let total = gemoji.length
      let index = randomInt(0, total - 1)
      this.$emit('update:modelValue', gemoji[index].emoji)
    },
  },
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}
</script>
