<template>
  <div class="relative" :data-id="comment.name">
    <div
      v-if="highlight"
      class="absolute inset-0 translate-y- z-[5] rounded border-2 -mx-4 -mb-4 mt-11 pointer-events-none"
    />
    <UserInfo :email="comment.owner" v-slot="{ user }">
      <div
        class="flex items-center text-base text-ink-gray-8 sticky top-0 pt-14 pb-2 bg-surface-white z-[1]"
      >
        <UserProfileLink class="mr-3" :user="user.name">
          <UserAvatarWithHover size="lg" :user="user.name" />
        </UserProfileLink>
        <div class="md:flex md:items-center">
          <UserProfileLink class="font-medium hover:text-ink-blue-4" :user="user.name">
            {{ user.full_name }}
            <span class="hidden md:inline">&nbsp;&middot;&nbsp;</span>
          </UserProfileLink>
          <div>
            <Tooltip :text="dayjsLocal(comment.creation).format('YYYY-MM-DD HH:mm')">
              <time class="text-ink-gray-5" :datetime="comment.creation">
                {{ dayjsLocal(comment.creation).fromNow() }}
              </time>
            </Tooltip>
            <Tooltip
              v-if="comment.edited_at"
              :text="dayjsLocal(comment.edited_at).format('YYYY-MM-DD HH:mm')"
            >
              <span class="text-ink-gray-5"> &nbsp;&middot; 已编辑 </span>
            </Tooltip>
            <span v-if="isUpdating" class="italic text-ink-gray-5">
              &nbsp;&middot; 发送中...
            </span>
            <div v-if="updateError">
              &nbsp;&middot;
              <span class="text-ink-red-4"> 错误</span>
            </div>
          </div>
        </div>
        <Dropdown
          v-show="!isEditing"
          class="ml-auto"
          placement="right"
          :button="{
            icon: 'more-horizontal',
            variant: 'ghost',
            label: '评论选项',
          }"
          :options="dropdownOptions"
        />
      </div>
      <div class="flex-1">
        <div
          :class="{
            'w-full rounded-lg border bg-surface-white p-4 focus-within:border-outline-gray-3':
              isEditing,
          }"
          @keydown.ctrl.enter.capture.stop="updateComment()"
          @keydown.meta.enter.capture.stop="updateComment()"
        >
          <CommentEditor
            v-if="comment.deleted_at == null"
            :value="isEditing ? draftContent : comment.content"
            @change="
              (value: string) => {
                if (isEditing) {
                  draftContent = value
                }
              }
            "
            :editable="isEditing"
            :submitButtonProps="{
              onClick: () => updateComment(),
              loading: isUpdating,
            }"
            :discardButtonProps="{
              onClick: () => discardEdit(),
            }"
            @rich-quote="$emit('rich-quote', $event)"
            @rich-quote-click="$emit('rich-quote-click', $event)"
          />
          <span class="text-base italic text-ink-gray-5" v-else> 该消息已删除 </span>
          <div class="mt-3" v-if="!comment.deleted_at && !isEditing && comment.reactions">
            <Reactions
              doctype="GP Comment"
              :name="comment.name"
              v-model:reactions="comment.reactions"
              :read-only-mode="readOnlyMode"
            />
          </div>
        </div>
      </div>
    </UserInfo>
    <RevisionsDialog
      v-model="showRevisionsDialog"
      doctype="GP Comment"
      :name="comment.name"
      fieldname="content"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dropdown, Tooltip, dayjsLocal } from 'frappe-ui'
import { useList } from 'frappe-ui'
import { copyToClipboard } from '@/utils'
import UserProfileLink from './UserProfileLink.vue'
import CommentEditor from './CommentEditor.vue'
import Reactions from './Reactions.vue'
import RevisionsDialog from './RevisionsDialog.vue'
import UserAvatarWithHover from './UserAvatarWithHover.vue'
import { GPComment } from '@/types/doctypes'
import { isSessionUser } from '@/data/session'
import { createDialog } from '@/utils/dialogs'
import { tags } from '@/data/tags'

interface Props {
  comment: GPComment
  readOnlyMode?: boolean
  highlight?: boolean
  comments: ReturnType<typeof useList<GPComment>>
}

const props = defineProps<Props>()
const showRevisionsDialog = ref(false)
const isEditing = ref(false)
const draftContent = ref('')
const isUpdating = ref(false)
const updateError = ref(null)

const startEditing = () => {
  isEditing.value = true
  draftContent.value = props.comment.content
}

const discardEdit = () => {
  isEditing.value = false
  draftContent.value = ''
  updateError.value = null
}

const updateComment = () => {
  if (!draftContent.value.trim()) return

  isUpdating.value = true
  updateError.value = null

  props.comments.setValue
    .submit({
      name: props.comment.name,
      content: draftContent.value,
    })
    .then(() => {
      discardEdit()
      tags.reload()
    })
    .catch((error) => {
      updateError.value = error
    })
    .finally(() => {
      isUpdating.value = false
    })
}

const copyLink = (comment: GPComment) => {
  const location = window.location
  const url = `${location.origin}${location.pathname}?comment=${comment.name}`
  copyToClipboard(url)
}

const dropdownOptions = computed(() => [
  {
    label: '编辑',
    icon: 'edit',
    onClick: () => startEditing(),
    condition: () => !props.comment.deleted_at && !props.readOnlyMode,
  },
  {
    label: '历史版本',
    icon: 'rotate-ccw',
    onClick: () => (showRevisionsDialog.value = true),
    condition: () => Boolean(props.comment.edited_at),
  },
  {
    label: '复制链接',
    icon: 'link',
    onClick: () => copyLink(props.comment),
  },
  {
    label: '删除',
    icon: 'trash',
    onClick: () => {
      createDialog({
        title: '删除评论',
        message: '确定要删除这条评论吗？',
        actions: [
          {
            label: '删除',
            variant: 'solid',
            theme: 'red',
            onClick: ({ close }) => {
              return props.comments.delete.submit({ name: props.comment.name }).then(close)
            },
          },
        ],
      })
    },
    condition: () =>
      isSessionUser(props.comment.owner) && props.comment.deleted_at == null && !props.readOnlyMode,
  },
])
</script>
