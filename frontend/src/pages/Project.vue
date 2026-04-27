<template>
  <div class="flex flex-col">
    <router-view v-slot="{ Component, route }">
      <header
        class="sticky top-0 z-10 flex items-center justify-between border-b bg-surface-white px-5 py-2.5"
        v-if="!route.meta?.hideHeader"
      >
        <Breadcrumbs class="h-7" :items="breadcrumbs">
          <template #prefix="{ item }">
            <span class="mr-2 flex rounded-sm text-2xl leading-none" v-if="item.icon">
              {{ item.icon }}
            </span>
          </template>
        </Breadcrumbs>
        <div v-if="$route.name === 'ProjectOverview'" class="flex items-center space-x-2">
          <Tooltip
            v-if="project.doc.is_private"
            text="该项目仅团队成员可见"
          >
            <Badge size="lg">
              <template #prefix><LucideLock class="w-3" /></template>
              私密
            </Badge>
          </Tooltip>
          <Badge size="lg" v-if="project.doc.archived_at">
            <template #prefix><LucideArchive class="w-3" /></template>
            已归档
          </Badge>
          <template v-if="!isMobile">
            <Button
              v-if="project.doc.is_followed"
              @click="project.unfollow.submit()"
              :loading="project.unfollow.loading"
            >
              <template #prefix><LucideBell class="w-4" /></template>
              已关注
            </Button>
            <Button v-else @click="project.follow.submit()" :loading="project.follow.loading">
              <template #prefix><LucideBellPlus class="w-4" /></template>
              关注
            </Button>
          </template>
          <Dropdown
            v-if="$user().isNotGuest"
            placement="left"
            :button="{
              icon: 'more-horizontal',
              variant: 'ghost',
              label: '选项',
            }"
            :options="[
              {
                label: '编辑',
                icon: 'edit',
                onClick: () => (projectEditDialog.show = true),
                condition: () => !project.doc.archived_at,
              },
              {
                label: '关注',
                icon: 'plus',
                onClick: () => project.follow.submit(),
                condition: () => isMobile && !project.doc.is_followed,
              },
              {
                label: '已关注',
                icon: 'check',
                onClick: () => project.unfollow.submit(),
                condition: () => isMobile && project.doc.is_followed,
              },
              {
                label: '管理访客',
                icon: 'user-plus',
                onClick: () => (inviteGuestDialog.show = true),
                condition: () => !project.doc.archived_at,
              },
              {
                label: '移动到其他团队',
                icon: 'log-out',
                onClick: () => (projectMoveDialog.show = true),
                condition: () => !project.doc.archived_at,
              },
              {
                label: '合并到其他项目',
                icon: LucideMerge,
                onClick: () => (projectMergeDialog.show = true),
              },
              {
                label: '归档此项目',
                icon: 'trash-2',
                onClick: archiveProject,
                condition: () => !project.doc.archived_at,
              },
              {
                label: '取消归档此项目',
                icon: 'trash-2',
                onClick: unarchiveProject,
                condition: () => project.doc.archived_at,
              },
            ]"
          />
        </div>
        <Dialog
          :options="{
            title: '编辑项目',
            actions: [
              {
                label: '保存',
                variant: 'solid',
                onClick({ close }) {
                  return project.setValue
                    .submit({
                      title: project.doc.title,
                      is_private: project.doc.is_private,
                    })
                    .then(close)
                },
              },
            ],
          }"
          v-model="projectEditDialog.show"
        >
          <template #body-content>
            <FormControl
              class="mb-2"
              label="标题"
              v-model="project.doc.title"
              placeholder="项目标题"
            />
            <FormControl
              v-if="!team.doc.is_private"
              label="可见性"
              type="select"
              :options="[
                { label: '所有人可见', value: 0 },
                { label: '仅团队成员可见（私密）', value: 1 },
              ]"
              v-model="project.doc.is_private"
            />
            <ErrorMessage class="mt-2" :message="project.setValue.error" />
          </template>
        </Dialog>
        <Dialog
          :options="{
            title: '将项目移动到其他团队',
          }"
          @close="
            () => {
              projectMoveDialog.team = null
              project.moveToTeam.reset()
            }
          "
          v-model="projectMoveDialog.show"
        >
          <template #body-content>
            <Autocomplete
              :options="moveToTeamsList"
              v-model="projectMoveDialog.team"
              placeholder="选择团队"
            >
              <template #item-prefix="{ option }">
                <span class="mr-2">{{ option.icon }}</span>
              </template>
            </Autocomplete>
            <ErrorMessage class="mt-2" :message="project.moveToTeam.error" />
          </template>
          <template #actions>
            <Button
              class="w-full"
              variant="solid"
              :loading="project.moveToTeam.loading"
              @click="
                () => {
                  project.moveToTeam.submit(
                    { team: projectMoveDialog.team?.value },
                    {
                      validate() {
                        if (!projectMoveDialog.team?.value) {
                          return '请选择目标团队'
                        }
                      },
                      onSuccess() {
                        onProjectMove()
                      },
                    },
                  )
                }
              "
            >
              {{ projectMoveDialog.team ? `移动到 ${projectMoveDialog.team.label}` : '移动' }}
            </Button>
          </template>
        </Dialog>
        <Dialog
          :options="{
            title: '与其他项目合并',
          }"
          @close="
            () => {
              projectMergeDialog.project = null
              project.mergeWithProject.reset()
            }
          "
          v-model="projectMergeDialog.show"
        >
          <template #body-content>
            <p class="text-p-base text-ink-gray-7 mb-4">
              这将把
              <span class="whitespace-nowrap font-semibold">{{ project.doc.title }}</span>
              项目的所有讨论、任务和页面移动到所选项目。此操作不可撤销！
            </p>
            {{ projectMergeDialog.project }}
            <Autocomplete
              :options="mergeProjectsList"
              v-model="projectMergeDialog.project"
              placeholder="选择项目"
            >
              <template #item-prefix="{ option }">
                <span class="mr-2">{{ option.icon }}</span>
              </template>
            </Autocomplete>
            <ErrorMessage class="mt-2" :message="project.mergeWithProject.error" />
          </template>
          <template #actions>
            <Button
              class="w-full"
              variant="solid"
              :loading="project.mergeWithProject.loading"
              @click="
                () => {
                  project.mergeWithProject.submit(
                    { project: projectMergeDialog.project?.value },
                    {
                      validate() {
                        if (!projectMergeDialog.project?.value) {
                          return '请选择要合并的项目'
                        }
                      },
                      onSuccess() {
                        if (projectMergeDialog.project.value) {
                          projectMergeDialog.show = false
                          return $router.replace({
                            name: 'Project',
                            params: { projectId: projectMergeDialog.project.value },
                          })
                        }
                      },
                    },
                  )
                }
              "
            >
              {{
                projectMergeDialog.project
                  ? `合并到 ${projectMergeDialog.project.label}`
                  : '合并'
              }}
            </Button>
          </template>
        </Dialog>
        <InviteGuestDialog
          v-if="$user().isNotGuest"
          v-model="inviteGuestDialog.show"
          :project="project"
        />
      </header>

      <component
        v-if="project"
        :is="Component"
        :class="{ 'mx-auto w-full max-w-4xl px-5': !route.meta?.fullWidth }"
        :project="project"
        :team="team"
      />
    </router-view>
  </div>
</template>
<script>
import {
  Autocomplete,
  Dropdown,
  FormControl,
  Breadcrumbs,
  frappeRequest,
  Input,
  Tooltip,
  Select,
  Textarea,
} from 'frappe-ui'
import Pie from '@/components/Pie.vue'
import IconPicker from '@/components/IconPicker.vue'
import Links from '@/components/Links.vue'
import Tabs from '@/components/Tabs.vue'
import InviteGuestDialog from '@/components/InviteGuestDialog.vue'
import { projects } from '@/data/projects'
import { activeTeams, teams } from '@/data/teams'
import PinIcon from '~icons/lucide/pin'
import LucideMerge from '~icons/lucide/merge'
import { isMobile as useMobile } from '@/composables/isMobile'

export default {
  name: 'Project',
  props: ['team', 'project'],
  components: {
    Input,
    Dropdown,
    Pie,
    IconPicker,
    Links,
    Tabs,
    Autocomplete,
    Tooltip,
    InviteGuestDialog,
    FormControl,
    Select,
    Textarea,
    Breadcrumbs,
  },
  setup() {
    const isMobile = useMobile()
    return {
      PinIcon,
      LucideMerge,
      isMobile,
    }
  },
  data() {
    return {
      projectMoveDialog: { show: false, team: null },
      projectEditDialog: { show: false },
      inviteGuestDialog: { show: false },
      projectMergeDialog: { show: false, project: null },
    }
  },
  computed: {
    moveToTeamsList() {
      return activeTeams.value
        .filter((d) => d.name != this.team.name)
        .map((d) => ({
          label: d.title,
          value: d.name,
          icon: d.icon,
        }))
    },
    mergeProjectsList() {
      return projects.data
        .filter((d) => d.name != this.project.name)
        .map((d) => ({
          label: d.title,
          value: d.name.toString(),
          icon: d.icon,
        }))
    },
    task() {
      let task = null
      if (this.$route.name === 'ProjectTaskDetail') {
        task = this.$getDocumentResource('GP Task', this.$route.params.taskId)
      }
      return task
    },
    breadcrumbs() {
      let items = [
        {
          label: this.team.doc.title,
          icon: this.team.doc.icon,
          route: { name: 'Team', params: { teamId: this.team.doc.name } },
        },
        {
          label: this.project.doc.title,
          route: {
            name: 'Project',
            params: {
              teamId: this.team.doc.name,
              projectId: this.project.doc.name,
            },
          },
        },
      ]
      if (
        ['ProjectDiscussions', 'ProjectDiscussion', 'ProjectDiscussionNew'].includes(
          this.$route.name,
        )
      ) {
        items.push({
          label: '讨论',
          route: {
            name: 'ProjectDiscussions',
            params: {
              teamId: this.team.doc.name,
              projectId: this.project.doc.name,
            },
          },
        })
      }
      if (this.$route.name === 'ProjectDiscussion') {
        let discussion = this.$getDocumentResource('GP Discussion', this.$route.params.postId)
        items.push({
          label: discussion?.doc?.title || this.$route.params.postId,
          route: {
            name: 'ProjectDiscussion',
            params: {
              teamId: this.team.doc.name,
              projectId: this.project.doc.name,
              postId: this.$route.params.postId,
            },
          },
        })
      }
      if (this.$route.name === 'ProjectDiscussionNew') {
        items.push({
          label: '新建讨论',
          route: {
            name: 'ProjectDiscussionNew',
            params: {
              teamId: this.team.doc.name,
              projectId: this.project.doc.name,
            },
          },
        })
      }

      if (['ProjectTasks', 'ProjectTaskDetail'].includes(this.$route.name)) {
        items.push({
          label: '任务',
          route: {
            name: 'ProjectTasks',
            params: {
              teamId: this.team.doc.name,
              projectId: this.project.doc.name,
            },
          },
        })
      }

      if (this.$route.name === 'ProjectTaskDetail') {
        let task = this.$getDocumentResource('GP Task', this.$route.params.taskId)
        items.push({
          label: task?.doc?.title || this.$route.params.taskId,
          route: {
            name: 'ProjectTaskDetail',
            params: {
              teamId: this.team.doc.name,
              projectId: this.project.doc.name,
              taskId: this.$route.params.taskId,
            },
          },
        })
      }

      if (['ProjectPages', 'ProjectPage'].includes(this.$route.name)) {
        items.push({
          label: '页面',
          route: {
            name: 'ProjectPages',
            params: {
              teamId: this.team.doc.name,
              projectId: this.project.doc.name,
            },
          },
        })
      }

      if (this.$route.name === 'ProjectPage') {
        let page = this.$getDocumentResource('GP Page', this.$route.params.pageId)
        items.push({
          label: page?.doc?.title || this.$route.params.pageId,
          route: {
            name: 'ProjectPage',
            params: {
              teamId: this.team.doc.name,
              projectId: this.project.doc.name,
              pageId: this.$route.params.pageId,
            },
          },
        })
      }

      return items
    },
  },
  methods: {
    archiveProject() {
      this.$dialog({
        title: '归档项目',
        message: '确定要归档此项目吗？',
        actions: [
          {
            label: '归档',
            variant: 'solid',
            onClick: (close) => {
              return this.project.archive.submit(null, {
                onSuccess: close,
              })
            },
          },
        ],
      })
    },
    unarchiveProject() {
      this.$dialog({
        title: '取消归档项目',
        message: '确定要取消归档此项目吗？',
        actions: [
          {
            label: '取消归档',
            variant: 'solid',
            onClick: (close) => {
              return this.project.unarchive.submit(null, {
                onSuccess: close,
              })
            },
          },
          {
            label: '取消',
          },
        ],
      })
    },
    onProjectMove() {
      this.projectMoveDialog.show = false
      projects.reload()
      for (let team of teams.data || []) {
        if ([this.team.doc.name, this.projectMoveDialog.team.value].includes(team.name)) {
          if (this.projectMoveDialog.team.value === team.name) {
            team.open = true
          }
        }
      }
      this.$router.push({
        name: 'ProjectOverview',
        params: {
          teamId: this.projectMoveDialog.team.value,
          projectId: this.project.name,
        },
      })
      this.projectMoveDialog.team = null
      this.project.moveToTeam.reset()
    },
  },
}
</script>
