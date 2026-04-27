<template>
  <div class="relative flex h-full flex-col" v-if="postId">
    <div class="discussion-container">
      <div v-if="discussion.loading">
        <div class="pb-2 pt-14 flex w-full items-center sticky top-0 z-[1] bg-surface-white">
          <Avatar size="lg" label="A" class="mr-3 animate-pulse shrink-0">
            <div></div>
          </Avatar>
          <div class="flex flex-col md:block">
            <div class="text-base font-medium bg-surface-gray-2 animate-pulse w-20 h-4"></div>
          </div>
          <div class="ml-auto flex space-x-2">
            <Button>
              <template #icon>
                <div class="animate-pulse w-20 h-8"></div>
              </template>
            </Button>
          </div>
        </div>
        <div class="flex items-start justify-between space-x-1">
          <h1 class="flex items-center text-2xl font-semibold animate-pulse">
            <span class="bg-surface-gray-3 h-5.5 w-32"> </span>
            <span class="bg-surface-gray-3 h-5.5 w-20 ml-2"> </span>
            <span class="bg-surface-gray-3 h-5.5 w-40 ml-2"> </span>
          </h1>
        </div>
      </div>
      <template v-else-if="discussion.doc">
        <div>
          <div class="pb-2 pt-14 flex w-full items-center sticky top-0 z-[1] bg-surface-white">
            <UserProfileLink class="mr-3" :user="discussion.doc.owner">
              <UserAvatarWithHover size="lg" :user="discussion.doc.owner" />
            </UserProfileLink>
            <div class="flex flex-col md:block">
              <UserProfileLink
                class="text-base font-medium text-ink-gray-8 hover:text-ink-blue-4"
                :user="discussion.doc.owner"
              >
                {{ $user(discussion.doc.owner).full_name }}
                <span class="hidden md:inline text-ink-gray-7">&nbsp;&middot;&nbsp;</span>
              </UserProfileLink>
              <Tooltip :text="dayjsLocal(discussion.doc.creation).format('YYYY-MM-DD HH:mm')">
                <time class="text-base text-ink-gray-5" :datetime="discussion.doc.creation">
                  {{ dayjsLocal(discussion.doc.creation).fromNow() }}
                </time>
              </Tooltip>
            </div>
            <div class="ml-auto flex space-x-2">
              <Dropdown
                v-if="!readOnlyMode"
                class="ml-auto"
                placement="right"
                :button="{
                  icon: 'more-horizontal',
                  variant: 'ghost',
                  label: '讨论选项',
                }"
                :options="actions"
              />
            </div>
          </div>
          <div :class="{ 'pb-4 mt-1': !editingPost }">
            <div class="flex items-start justify-between space-x-1">
              <h1 v-if="!editingPost" class="flex items-center text-2xl font-semibold">
                <Tooltip v-if="discussion.doc.closed_at" text="该讨论已关闭">
                  <LucideLock class="mr-2 h-4 w-4 text-ink-gray-6" :stroke-width="2" />
                </Tooltip>
                <span class="text-ink-gray-8">
                  {{ discussion.doc.title }}
                </span>
              </h1>
            </div>
            <div class="mt-2 flex items-center text-base" v-show="!editingPost">
              <span class="text-ink-gray-5">
                {{
                  discussion.doc.participants_count == 1
                    ? `1 位参与者`
                    : `${discussion.doc.participants_count} 位参与者`
                }}
              </span>
              <template v-if="discussion.doc.views > 1">
                <span class="px-1.5 text-ink-gray-7">&middot;</span>
                <span class="text-ink-gray-5"> {{ discussion.doc.views }} 次浏览 </span>
              </template>
            </div>
          </div>
          <div
            :class="{
              'rounded-lg border p-4 focus-within:border-outline-gray-3': editingPost,
            }"
            ref="mainPostContentEl"
          >
            <div v-if="editingPost" class="w-full">
              <div class="mb-2">
                <input
                  v-if="editingPost"
                  type="text"
                  class="w-full rounded border-0 text-ink-gray-8 px-0 py-0.5 text-2xl font-semibold focus:ring-0"
                  ref="title"
                  v-model="discussion.doc.title"
                  placeholder="标题"
                  v-focus
                />
              </div>
            </div>
            <CommentEditor
              :value="discussion.doc.content"
              @change="discussion.doc.content = $event"
              @rich-quote="
                handleRichQuote($event, {
                  id: `discussion:${discussion.doc.name}`,
                  author: discussion.doc.owner,
                })
              "
              :submitButtonProps="{
                variant: 'solid',
                onClick: updatePost,
                loading: discussion.setValue.loading,
              }"
              :discardButtonProps="{
                onClick: () => {
                  editingPost = false
                  discussion.reload()
                },
              }"
              :editable="editingPost"
            />
          </div>
          <div class="mt-3">
            <Reactions
              doctype="GP Discussion"
              :name="discussion.doc.name"
              v-model:reactions="discussion.doc.reactions"
              :read-only-mode="readOnlyMode"
            />
          </div>
        </div>
        <CommentsArea
          doctype="GP Discussion"
          :name="discussion.doc.name"
          :newCommentsFrom="discussion.doc.last_unread_comment?.toString()"
          :read-only-mode="readOnlyMode"
          :disable-new-comment="Boolean(discussion.doc.closed_at)"
          @rich-quote="handleRichQuote"
          @rich-quote-click="handleRichQuoteClick"
          ref="commentsArea"
        />
        <Dialog
          :options="{
            title: '将讨论移动到其他空间',
          }"
          @close="
            () => {
              discussionMoveDialog.project = null
              // discussion.moveToProject.reset()
            }
          "
          v-model="discussionMoveDialog.show"
        >
          <template #body-content>
            <Combobox
              :options="spaceOptions"
              v-model="discussionMoveDialog.project"
              placeholder="选择空间"
            />
            <ErrorMessage class="mt-2" :message="discussion.moveToProject.error" />
          </template>
          <template #actions>
            <Button
              class="w-full"
              variant="solid"
              :loading="discussion.moveToProject.loading"
              @click="moveToSpace"
            >
              {{
                discussionMoveDialog.project
                  ? `移动到 ${useSpace(discussionMoveDialog.project).value?.title}`
                  : '移动'
              }}
            </Button>
          </template>
        </Dialog>
        <Dialog
          :options="{
            title: '置顶讨论',
          }"
          @close="
            () => {
              pinDialog.show = false
              pinDialog.pinGlobally = false
            }
          "
          v-model="pinDialog.show"
        >
          <template #body-content>
            <p class="text-p-base text-ink-gray-6 mb-3">
              讨论置顶后会显示在讨论列表顶部。
            </p>

            <div class="space-y-2">
              <label class="flex items-center justify-between">
                <div>
                  <div class="text-base font-medium text-ink-gray-9 mb-1">全局置顶</div>
                  <div class="text-sm text-ink-gray-5" v-if="pinDialog.pinGlobally">
                    在所有讨论中显示
                  </div>
                  <div class="text-sm text-ink-gray-5" v-else>仅在 {{ space?.title }} 中显示</div>
                </div>
                <Switch size="sm" v-model="pinDialog.pinGlobally" />
              </label>
            </div>
          </template>
          <template #actions>
            <div class="flex">
              <Button
                class="ml-auto"
                variant="solid"
                :loading="discussion.pinDiscussion.loading"
                @click="
                  () => {
                    discussion.pinDiscussion
                      .submit({ pin_scope: pinDialog.pinGlobally ? 'Global' : 'Space' })
                      .then(() => {
                        pinDialog.show = false
                        pinDialog.pinGlobally = false
                      })
                  }
                "
              >
                置顶讨论
              </Button>
            </div>
          </template>
        </Dialog>
        <RevisionsDialog
          v-model="showRevisionsDialog"
          doctype="GP Discussion"
          :name="discussion.doc.name"
          fieldname="content"
        />
      </template>
    </div>
    <div v-if="!isMobile" class="fixed bottom-3 h-9 grid place-content-center right-3 z-[2]">
      <Button variant="ghost" v-show="isScrolled" @click="scrollToTop">
        <template #prefix>
          <LucideArrowUp class="h-5 w-5 text-ink-gray-6" />
        </template>
        回到顶部
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, reactive, useTemplateRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Combobox,
  Avatar,
  Dropdown,
  Dialog,
  Tooltip,
  usePageMeta,
  dayjsLocal,
  Switch,
} from 'frappe-ui'
import { until } from '@vueuse/core'
import Reactions from './Reactions.vue'
import UserAvatarWithHover from './UserAvatarWithHover.vue'
import CommentsArea from '@/components/CommentsArea.vue'
import CommentEditor from './CommentEditor.vue'
import UserProfileLink from './UserProfileLink.vue'
import RevisionsDialog from './RevisionsDialog.vue'
import { vFocus } from '@/directives'
import { copyToClipboard } from '@/utils'
import { useSpace } from '@/data/spaces'
import { useGroupedSpaceOptions } from '@/data/groupedSpaces'
import { useDiscussion } from '@/data/discussions'
import { tags } from '@/data/tags'
import { createDialog } from '@/utils/dialogs'
import { useScrollPosition } from '@/utils/scrollContainer'
import { isMobile } from '@/composables/isMobile'
import { useRichQuoteHandler } from '@/components/RichQuoteExtension/useRichQuoteHandler'
import { refreshUnreadCountForProjects } from '@/data/unreadCount'
import { isSessionUser } from '@/data/session'

import LucideArrowUp from '~icons/lucide/arrow-up'

const props = defineProps<{
  postId: string
  readOnlyMode?: boolean
}>()

const router = useRouter()
const route = useRoute()
const commentsArea = useTemplateRef('commentsArea')
const mainPostContentEl = ref<HTMLElement | null>(null)

const { isScrolled, scrollToTop } = useScrollPosition()

const { handleRichQuote, handleRichQuoteClick } = useRichQuoteHandler(
  commentsArea,
  mainPostContentEl,
)

const editingPost = ref(false)
const discussionMoveDialog = reactive<{
  show: boolean
  project: string | null
}>({
  show: false,
  project: null,
})
const pinDialog = reactive<{
  show: boolean
  pinGlobally: boolean
}>({
  show: false,
  pinGlobally: false,
})
const showRevisionsDialog = ref(false)

const discussion = useDiscussion(() => props.postId)

onMounted(() => {
  scrollToUnread()
})

async function scrollToUnread() {
  if (!discussion.doc) {
    await until(() => discussion.doc).toBeTruthy()
  }

  updateUrlSlug()

  let doc = discussion.doc
  if (
    !route.query.comment &&
    !route.query.poll &&
    !route.query.fromSearch &&
    (doc?.last_unread_comment || doc?.last_unread_poll)
  ) {
    if (doc.last_unread_comment) {
      router.replace({
        query: {
          comment: doc.last_unread_comment || undefined,
        },
      })
    } else if (doc.last_unread_poll) {
      router.replace({
        query: {
          poll: doc.last_unread_poll || undefined,
        },
      })
    }
  }

  if (route.name === 'Discussion' && route.params.postId === doc?.name) {
    discussion.trackVisit.submit().then(() => {
      refreshUnreadCountForProjects([doc.project])
    })
  }
}

// Methods
function copyLink() {
  let location = window.location
  let url = `${location.origin}${location.pathname}`
  copyToClipboard(url)
}

function moveToSpace() {
  if (discussionMoveDialog.project) {
    discussion.moveToProject
      .submit({
        project: discussionMoveDialog.project,
      })
      .then(() => {
        nextTick(() => {
          discussionMoveDialog.show = false
          discussionMoveDialog.project = null

          router.replace({
            name: 'Discussion',
            params: {
              spaceId: discussion.doc?.project,
              postId: discussion.doc?.name,
            },
          })
        })
      })
      .catch(() => {
        discussionMoveDialog.show = true
      })
  }
}

function updatePost() {
  discussion.setValue
    .submit({
      title: discussion.doc?.title,
      content: discussion.doc?.content,
    })
    .then(() => {
      tags.reload()
    })
  editingPost.value = false
}

function updateUrlSlug() {
  let doc = discussion.doc
  if (!doc) return
  if (!route.params.slug || route.params.slug !== doc.slug) {
    nextTick(() => {
      router.replace({
        name: 'Discussion',
        params: { ...route.params, slug: doc.slug },
        query: route.query,
      })
    })
  }
}

const space = useSpace(() => discussion.doc?.project)

const spaceOptions = useGroupedSpaceOptions({
  filterFn: (space) => !space.archived_at && space.name !== discussion.doc?.project,
})

const actions = computed(() => [
  {
    label: '编辑',
    icon: 'edit',
    onClick: () => {
      editingPost.value = true
    },
  },
  {
    label: '历史版本',
    icon: 'rotate-ccw',
    onClick: () => (showRevisionsDialog.value = true),
  },
  {
    label: '复制链接',
    icon: 'link',
    onClick: copyLink,
  },
  {
    label: '标记为未读',
    icon: 'mail',
    onClick: () => {
      discussion.markAsUnread.submit().then(() => {
        if (discussion.doc?.project) {
          refreshUnreadCountForProjects([discussion.doc.project])
        }
      })
    },
  },
  {
    label: '收藏',
    icon: 'bookmark',
    onClick: () => discussion.addBookmark.submit(),
    condition: () => !discussion.doc?.is_bookmarked,
  },
  {
    label: '置顶讨论...',
    icon: 'arrow-up-left',
    condition: () => !discussion.doc?.pinned_at,
    onClick: () => {
      pinDialog.show = true
    },
  },
  {
    label: '取消置顶讨论...',
    icon: 'arrow-down-left',
    condition: () => !!discussion.doc?.pinned_at,
    onClick: () => {
      const scopeText =
        discussion.doc?.pin_scope === 'Global'
          ? '该讨论已在所有空间全局置顶。'
          : `该讨论仅在 ${space.value?.title} 中置顶。`

      createDialog({
        title: '取消置顶讨论',
        message: `${scopeText} 你要取消置顶吗？`,
        icon: { name: 'arrow-down-left' },
        actions: [
          {
            label: '取消置顶',
            onClick: ({ close }) => discussion.unpinDiscussion.submit().then(close),
            variant: 'solid',
          },
        ],
      })
    },
  },
  {
    label: '关闭讨论...',
    icon: 'lock',
    condition: () => !discussion.doc?.closed_at,
    onClick: () => {
      createDialog({
        title: '关闭讨论',
        message:
          '关闭后将无法评论。之后任何人都可以重新打开该讨论。确认关闭吗？',
        icon: { name: 'lock' },
        actions: [
          {
            label: '关闭',
            onClick: ({ close }) => discussion.closeDiscussion.submit().then(close),
            variant: 'solid',
          },
        ],
      })
    },
  },
  {
    label: '重新打开讨论...',
    icon: 'unlock',
    condition: () => discussion.doc?.closed_at,
    onClick: () => {
      createDialog({
        title: '重新打开讨论',
        message: '确认重新打开该讨论吗？重新打开后任何人都可以再次评论。',
        icon: { name: 'unlock' },
        actions: [
          {
            label: '重新打开',
            onClick: ({ close }) => discussion.reopenDiscussion.submit().then(close),
            variant: 'solid',
          },
        ],
      })
    },
  },
  {
    label: '取消收藏',
    icon: 'bookmark',
    onClick: () => discussion.removeBookmark.submit(),
    condition: () => discussion.doc?.is_bookmarked,
  },
  {
    label: '移动到...',
    icon: 'log-out',
    onClick: () => {
      discussionMoveDialog.show = true
    },
  },
  {
    label: '删除',
    icon: 'trash',
    condition: () => !!discussion.doc?.owner && isSessionUser(discussion.doc.owner),
    onClick: () => {
      createDialog({
        title: '删除',
        message: '确定要删除这条帖子吗？此操作不可撤销！',
        actions: [
          {
            label: '删除',
            variant: 'solid',
            theme: 'red',
            onClick: ({ close }) => {
              return discussion.delete.submit().then(() => {
                router.replace({ name: 'Space' })
                close()
              })
            },
          },
        ],
      })
    },
  },
])

// Page Meta
usePageMeta(() => {
  if (!discussion.doc) return
  let space = useSpace(() => discussion.doc?.project)
  if (!space) return
  return {
    title: [discussion.doc.title, space.value?.title].filter(Boolean).join(' - '),
  }
})
</script>
