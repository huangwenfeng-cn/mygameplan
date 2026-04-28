<template>
  <TextEditor
    ref="textEditorRef"
    class="pb-40"
    editor-class="max-w-[unset] min-h-[calc(100vh-350px)] prose-v3 overflow-auto px-2 -mx-2"
    :content="draftData.content"
    @change="(content: string) => (draftData.content = content)"
    :editable="author.name === sessionUser.name"
    placeholder="输入 '/' 使用命令，或选中文本进行格式化"
  >
    <template #editor="{ editor }">
      <DiscussionHeader />

      <div class="discussion-container isolate">
        <div class="top-12 z-10 sticky">
          <div class="bg-surface-white">
            <div class="flex items-center -ml-2 pt-2 pb-1">
              <div class="hidden sm:flex transition-opacity duration-100">
                <TextEditorFixedMenu :buttons="textEditorMenuButtons" />
              </div>
            </div>
          </div>
          <div
            class="h-4 bg-gradient-to-b from-white to-transparent dark:from-[--dark-gray-900]"
          ></div>
        </div>

        <DiscussionMetadata />
        <DiscussionEditor :editor="editor" />
      </div>
    </template>
  </TextEditor>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { TextEditorFixedMenu } from 'frappe-ui'
import TextEditor from '@/components/TextEditor.vue'
import DiscussionHeader from './DiscussionHeader.vue'
import DiscussionMetadata from './DiscussionMetadata.vue'
import DiscussionEditor from './DiscussionEditor.vue'
import { provideNewDiscussion } from './useNewDiscussion'

const textEditorRef = useTemplateRef<InstanceType<typeof TextEditor>>('textEditorRef')

const textEditorMenuButtons = [
  'Paragraph',
  ['Heading 1', 'Heading 2', 'Heading 3', 'Heading 4', 'Heading 5', 'Heading 6'],
  'Separator',
  'Bold',
  'Italic',
  'Strikethrough',
  'Link',
  'FontColor',
  'Separator',
  'Bullet List',
  'Numbered List',
  'Task List',
  'Separator',
  'Align Left',
  'Align Center',
  'Align Right',
  'Separator',
  'Image',
  'Video',
  'Blockquote',
  'Code',
  'Iframe',
  'Separator',
  'Horizontal Rule',
  [
    'InsertTable',
    'AddColumnBefore',
    'AddColumnAfter',
    'DeleteColumn',
    'AddRowBefore',
    'AddRowAfter',
    'DeleteRow',
    'MergeCells',
    'SplitCell',
    'ToggleHeaderColumn',
    'ToggleHeaderRow',
    'ToggleHeaderCell',
    'DeleteTable',
  ],
  'Separator',
  'TableOfContents',
  'Separator',
  'Undo',
  'Redo',
]

const { draftData, sessionUser, author, initialize } = provideNewDiscussion(textEditorRef)

initialize()
</script>
