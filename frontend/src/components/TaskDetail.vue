<template>
  <div class="flex h-full flex-1" v-if="task.doc">
    <div class="w-full flex-1">
      <div class="relative p-3 sm:p-6">
        <div class="absolute right-0 top-0 p-6" v-show="task.setValue.loading">
          <LoadingText v-if="!task.setValue.error" text="保存中..." />
          <ErrorMessage :message="task.setValue.error" />
        </div>
        <div class="mb-2 flex items-center justify-between space-x-2">
          <input
            type="text"
            placeholder="标题"
            class="-ml-0.5 w-full rounded-sm border-none p-0.5 text-2xl bg-surface-white font-semibold text-ink-gray-8 focus:outline-none focus:ring-2 focus:ring-outline-gray-3"
            @blur="
              task.setValue.submit({
                title: ($event.target as HTMLInputElement).value,
              })
            "
            v-model="task.doc.title"
            v-focus
          />
          <DropdownMoreOptions
            placement="right"
            :options="[
              {
                label: '删除',
                onClick: () => {
                  $dialog({
                    title: '删除任务',
                    message: '确定要删除此任务吗？',
                    actions: [
                      {
                        label: '删除',
                        theme: 'red',
                        variant: 'solid',
                        onClick({ close }) {
                          return task.delete.submit().then(() => {
                            close()
                            $router.back()
                          })
                        },
                      },
                    ],
                  })
                },
              },
            ]"
          />
        </div>
        <TextEditor
          ref="description"
          editor-class="prose-v3 max-w-none focus-within:ring-2 focus-within:ring-outline-gray-3 rounded-sm p-0.5 -ml-0.5 min-h-[4rem]"
          placeholder="描述"
          :content="task.doc.description"
          :bubbleMenu="true"
          :floatingMenu="true"
          @blur="
            !$refs.description.editor.isEmpty
              ? task.setValue.submit({
                  description: $refs.description.editor.getHTML(),
                })
              : null
          "
        />
        <div class="mt-8 flex flex-wrap items-center gap-2 sm:hidden">
          <Combobox
            placeholder="分配成员"
            :options="assignableUsers"
            v-model="task.doc.assigned_to"
            @update:modelValue="changeAssignee"
          />
          <DatePicker
            v-model="task.doc.due_date"
            variant="subtle"
            placeholder="截止日期"
            format="D MMM, YYYY"
            @update:modelValue="
              task.setValue.submit({
                due_date: $event,
              })
            "
          />
          <Dropdown :options="statusOptions">
            <Button>
              <template #prefix>
                <TaskStatusIcon :status="task.doc.status" />
              </template>
              {{ (task.doc.status && statusText[task.doc.status]) || '设置状态' }}
            </Button>
          </Dropdown>
          <Dropdown :options="priorityOptions">
            <Button>
              <template v-if="task.doc.priority" #prefix>
                <TaskPriorityIcon :priority="task.doc.priority" />
              </template>
              {{ task.doc.priority || '设置优先级' }}
            </Button>
          </Dropdown>
          <Combobox
            placeholder="选择空间"
            :options="spaceOptions"
            :modelValue="task.doc.project"
            @update:modelValue="changeSpace"
          />
        </div>
        <CommentsList class="mt-8" doctype="GP Task" :name="taskId" />
      </div>
    </div>
    <div class="hidden w-[20rem] shrink-0 border-l sm:block">
      <div class="grid grid-cols-2 items-center gap-y-6 p-6 text-base text-ink-gray-6">
        <div>负责人</div>
        <div>
          <Combobox
            placeholder="分配成员"
            :options="assignableUsers"
            v-model="task.doc.assigned_to"
            @update:modelValue="changeAssignee"
            placement="end"
          />
        </div>
        <div>截止日期</div>
        <div>
          <DatePicker
            v-model="task.doc.due_date"
            variant="subtle"
            placeholder="截止日期"
            format="D MMM, YYYY"
            @update:modelValue="
              task.setValue.submit({
                due_date: $event,
              })
            "
          />
        </div>
        <div>空间</div>
        <div>
          <Combobox
            placeholder="选择空间"
            :options="spaceOptions"
            :modelValue="task.doc.project"
            @update:modelValue="changeSpace"
          />
        </div>
        <div>状态</div>
        <div>
          <Dropdown :options="statusOptions">
            <Button>
              <template #prefix>
                <TaskStatusIcon :status="task.doc.status" />
              </template>
              {{ (task.doc.status && statusText[task.doc.status]) || '设置状态' }}
            </Button>
          </Dropdown>
        </div>
        <div>优先级</div>
        <div>
          <Dropdown :options="priorityOptions">
            <Button>
              <template v-if="task.doc.priority" #prefix>
                <TaskPriorityIcon :priority="task.doc.priority" />
              </template>
              {{ task.doc.priority || '设置优先级' }}
            </Button>
          </Dropdown>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import TextEditor from '@/components/TextEditor.vue'
import CommentsList from '@/components/CommentsList.vue'
import TaskStatusIcon from '@/components/NewTaskDialog/TaskStatusIcon.vue'
import TaskPriorityIcon from '@/components/icons/TaskPriorityIcon.vue'
import DropdownMoreOptions from './DropdownMoreOptions.vue'
import { Dropdown, LoadingText, DatePicker, Button, Combobox } from 'frappe-ui'
import { vFocus } from '@/directives'
import { activeUsers } from '@/data/users'
import { useGroupedSpaceOptions } from '@/data/groupedSpaces'
import { useTask } from '@/data/tasks'
import { GPTask } from '@/types/doctypes'

const props = defineProps<{
  taskId: string
}>()

const router = useRouter()
const route = useRoute()

const task = useTask(() => props.taskId)

task.onSuccess((doc) => {
  if (['Task', 'SpaceTask'].includes(route.name as string) && route.params.taskId === doc.name) {
    task.trackVisit.submit()
  }
})

const assignableUsers = computed<{ label: string; value: string }[]>(() => {
  return [
    {
      label: '未分配',
      value: '<no_assignee>',
    },
  ].concat(
    ...activeUsers.value.map((user) => ({
      label: user.full_name,
      value: user.name,
    })),
  )
})

// 仅用于界面中文显示，不改变状态实际存储值（仍为英文）
const statusText: Record<GPTask['status'], string> = {
  Backlog: '待办池',
  Todo: '待处理',
  'In Progress': '进行中',
  Done: '已完成',
  Canceled: '已取消',
}

const statusOptions = computed(() =>
  (['Backlog', 'Todo', 'In Progress', 'Done', 'Canceled'] as Array<GPTask['status']>).map(
    (status) => ({
      icon: () => h(TaskStatusIcon, { status }),
      label: statusText[status],
      onClick: () => task.setValue.submit({ status }),
    }),
  ),
)

const priorityOptions = computed(() =>
  (['Low', 'Medium', 'High'] as Array<GPTask['priority']>).map((priority) => ({
    icon: () => h(TaskPriorityIcon, { priority }),
    label: priority,
    onClick: () => task.setValue.submit({ priority }),
  })),
)

const spaceOptions = useGroupedSpaceOptions({ filterFn: (space) => !space.archived_at })

function changeAssignee(option: string) {
  if (option === '<no_assignee>') {
    option = ''
  }
  task.setValue.submit({ assigned_to: option })
}

function changeSpace(option: string) {
  if (!task.doc) return
  task.doc.project = option
  task.setValue.submit({ project: option }).then(updateRoute)
}

function updateRoute() {
  if (task.doc) {
    router.replace({
      name: task.doc.project ? 'SpaceTask' : 'Task',
      params: task.doc.project
        ? {
            taskId: task.doc.name,
            spaceId: task.doc.project,
          }
        : {
            taskId: task.doc.name,
          },
    })
  }
}

</script>
