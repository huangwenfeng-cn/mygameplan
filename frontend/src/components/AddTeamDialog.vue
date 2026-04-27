<template>
  <Dialog :options="{ title: '添加团队' }" v-model="showDialog">
    <template #body-content>
      <div class="space-y-4">
        <FormControl
          label="团队名称"
          type="text"
          v-model="newTeam.title"
          placeholder="团队名称"
          @keydown.enter="createTeam($event.target.value)"
          autocomplete="off"
        />
        <FormControl
          type="select"
          label="可见性"
          :options="[
            { label: '所有人可见', value: 0 },
            { label: '仅团队成员可见（私密）', value: 1 },
          ]"
          v-model="newTeam.is_private"
        />
        <ErrorMessage :message="teams.insert.error?.messages" />
      </div>
    </template>
    <template #actions>
      <Button
        variant="solid"
        class="w-full"
        @click="createTeam(teamName)"
        :loading="teams.insert.loading"
      >
        创建团队
      </Button>
    </template>
  </Dialog>
</template>
<script>
import { teams } from '@/data/teams'

export default {
  name: 'AddTeamDialog',
  props: ['show'],
  emits: ['success', 'update:show'],
  data() {
    return {
      newTeam: { title: '', is_private: 0 },
      teams,
    }
  },
  methods: {
    createTeam() {
      teams.insert.submit(this.newTeam, {
        onSuccess: (team) => {
          this.$resetData('newTeam')
          this.showDialog = false
          this.$emit('success', team)
        },
      })
    },
  },
  computed: {
    showDialog: {
      get() {
        return this.show
      },
      set(val) {
        this.$emit('update:show', val)
      },
    },
  },
}
</script>
